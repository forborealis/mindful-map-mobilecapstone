const fetch = require('node-fetch');
const MoodScore = require('../models/MoodScore');
const MoodLog = require('../models/MoodLog'); // supports CCC flow (MoodLog IDs), but recommendations must not be gated by CCC
const Recommendation = require('../models/Recommendation.js');
const RecommendationEffectiveness = require('../models/RecommendationEffectiveness');
const { getRecommendations } = require('../services/recommendEngine');

function getCurrentWeekRange() {
  const now = new Date();
  const local = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const day = local.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;

  const start = new Date(local);
  start.setDate(local.getDate() + diffToMonday);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);

  return { start, end };
}

function isDateWithinCurrentWeek(d) {
  const { start, end } = getCurrentWeekRange();
  const dt = new Date(d);
  return dt >= start && dt <= end;
}

// Helper: convert valence+intensity to signed score (same scale as CCC)
function signed(valence, intensity, scale = 20) {
  if (intensity == null) return null;
  const v = String(valence || '').toLowerCase();
  const s = v === 'positive' ? +1 : v === 'negative' ? -1 : 0;
  return s * Number(intensity) * scale;
}

// local-day range helper (prevents exact-timestamp mismatches)
function localDayRangeFromDate(dt) {
  const d = new Date(dt);
  const start = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
  const next = new Date(start);
  next.setDate(start.getDate() + 1);
  return { start, next };
}

/**
 * Default tips: used to GUARANTEE we always have recommendations.
 * This is NOT tied to CCC or any thresholds.
 */
function getDefaultTips({ category, activity, moodType }) {
  const common = [
    'Log a quick note about what happened right before and after—context helps you spot patterns.',
    'Try changing one small variable next time (duration, time of day, setting) and see how you feel.',
    'Keep it simple: pick one small action you can repeat consistently.',
    'If this felt unhelpful, adjust the intensity down and try again later.',
    'Aim for consistency over perfection—repeat what seems to work.',
    'Add a short reset: water + a 60‑second stretch can noticeably change how you feel.'
  ];

  if (category === 'sleep') {
    return [
      'Keep a consistent sleep and wake time—even on weekends.',
      'Reduce screen time for 30–60 minutes before bed.',
      'Keep the room cool, dark, and quiet.',
      'If you can’t fall asleep, try a short breathing exercise or relaxation routine.',
      ...common
    ];
  }

  // Light activity-specific defaults (extend anytime)
  if (String(activity || '').toLowerCase() === 'gaming') {
    return [
      'Set a stopping rule before you start (time limit or number of matches).',
      'Take a 3–5 minute break every 30–60 minutes to reset.',
      'If competitive modes raise stress, try a lower-pressure mode or co-op session.',
      'Notice triggers: late-night sessions, fatigue, hunger, or conflict can amplify negative mood.',
      'After gaming, do a short “cool down” (walk, stretch, water) to transition.',
      ...common
    ];
  }

  if (moodType === 'negative') {
    return [
      'Pause for 60–90 seconds of slow breathing to reset.',
      'Break the next step into something tiny and start there.',
      'Change your environment slightly (lighting, posture, noise) and reassess.',
      'Do a quick body reset: water + stretch.',
      ...common
    ];
  }

  return common;
}

async function enrichWithEffectiveness(recs) {
  const ids = (recs || []).map((r) => r._id).filter(Boolean);
  if (ids.length === 0) return recs || [];

  const agg = await RecommendationEffectiveness.aggregate([
    { $match: { recommendation: { $in: ids } } },
    {
      $group: {
        _id: '$recommendation',
        count: { $sum: 1 },
        avgCombined: { $avg: '$combinedScore' },
        anyEffective: { $max: { $cond: ['$effective', 1, 0] } },
        ineffectiveCount: { $sum: { $cond: [{ $eq: ['$effective', false] }, 1, 0] } }
      }
    }
  ]);

  const byId = new Map(agg.map((a) => [String(a._id), a]));
  return (recs || []).map((r) => {
    const a = byId.get(String(r._id));
    return {
      ...r,
      effectivenessCount: a ? a.count : 0,
      effectivenessAvg: a ? a.avgCombined : 0,
      effective: a ? a.anyEffective === 1 : false,
      ineffectiveCount: a ? a.ineffectiveCount : 0
    };
  });
}

/**
 * Helper for legacy MoodScore resolution (used by resolveMoodScoreId).
 */
function normalizeKey(k) {
  return String(k || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/_/g, '-');
}

function getDayRange(dateInput) {
  const d = dateInput ? new Date(dateInput) : new Date();
  const start = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
  const end = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
  return { start, end };
}

async function findMoodScoreByKey({ userId, date, category, activity }) {
  const { start, end } = getDayRange(date);
  const q = {
    user: userId,
    category,
    date: { $gte: start, $lte: end }
  };

  const docs = await MoodScore.find(q)
    .sort({ date: -1, createdAt: -1 })
    .lean();

  if (category === 'sleep') {
    return docs[0] || null;
  }

  const target = normalizeKey(activity);
  for (const d of docs) {
    const k = normalizeKey(d.activity);
    if (k === target) return d;
  }
  return null;
}

/**
 * Generate and save recommendations for either:
 * - legacy moodScoreId (MoodScore)
 * - CCC flow moodLogId (MoodLog)
 *
 * HARD REQUIREMENT:
 * - Do not rely on CCC as a gate.
 * - ALWAYS return recommendations (never empty).
 * - Always persist recommendations so user can rate them (never return _id: null).
 */
exports.generateAndSaveRecommendation = async (req, res) => {
  try {
    const { moodScoreId, moodLogId } = req.body;

    if (!moodScoreId && !moodLogId) {
      return res.status(400).json({ error: 'moodScoreId or moodLogId is required' });
    }

    let sourceId;
    let sourceType; // 'moodScore' | 'moodLog'
    let user;
    let date;
    let category;
    let activity;
    let moodScoreValue; // numeric delta or stored moodScore
    let sleepHours;

    if (moodScoreId) {
      // Old flow: use MoodScore document
      const moodScoreDoc = await MoodScore.findById(moodScoreId).populate('user');
      if (!moodScoreDoc) return res.status(404).json({ error: 'MoodScore not found' });

      sourceId = moodScoreDoc._id;
      sourceType = 'moodScore';

      user = moodScoreDoc.user;
      date = moodScoreDoc.date;
      category = moodScoreDoc.category;
      activity = moodScoreDoc.activity;
      moodScoreValue = moodScoreDoc.moodScore;
      sleepHours = moodScoreDoc.sleepHours;
    } else {
      // CCC flow: use MoodLog document; CCC is NOT used to gate recommendations.
      const log = await MoodLog.findById(moodLogId).populate('user');
      if (!log) return res.status(404).json({ error: 'MoodLog not found' });

      sourceId = log._id;
      sourceType = 'moodLog';

      user = log.user;
      date = log.date;
      category = log.category || 'activity';
      activity = log.activity || 'unknown';

      // Keep category to known buckets
      const allowed = new Set(['activity', 'social', 'health', 'sleep']);
      if (!allowed.has(category)) category = 'activity';

      // Compute delta from before/after mood if present; otherwise pick a neutral-ish default
      const b = signed(log.beforeValence, log.beforeIntensity);
      const a = signed(log.afterValence, log.afterIntensity);

      if (b != null && a != null) {
        moodScoreValue = a - b;
      } else {
        const hrs = Number(log.hrs ?? log.sleepHours);
        if (!Number.isNaN(hrs)) {
          sleepHours = hrs;
          // heuristic only; NOT a gate
          if (hrs >= 7 && hrs <= 9) moodScoreValue = 40;
          else if (hrs <= 5) moodScoreValue = -40;
          else moodScoreValue = -20;
        } else {
          moodScoreValue = 0;
        }
      }

      if (sleepHours == null) {
        const hrs = Number(log.hrs);
        if (!Number.isNaN(hrs)) sleepHours = hrs;
      }
    }

    const userId = user?._id || user;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    // Define moodType (used only for choosing tip tone; NOT a gate)
    const moodType = moodScoreValue >= 0 ? 'positive' : 'negative';

    // Keying for this entry (prefer moodLog when available; keep back-compat with legacy day/category/activity)
    const primaryKeyQuery =
      sourceType === 'moodLog' ? { user: userId, moodLog: sourceId } : { user: userId, moodScore: sourceId };

    const { start, next } = localDayRangeFromDate(date);
    const legacyKeyQuery = {
      user: userId,
      date: { $gte: start, $lt: next },
      category,
      activity
    };

    // If we already have some recs saved for this key, return them (fast path)
    const existingForKey = await Recommendation.find({ $or: [primaryKeyQuery, legacyKeyQuery] })
      .sort({ createdAt: 1 })
      .limit(3)
      .lean();

    if (existingForKey.length > 0) {
      const enriched = await enrichWithEffectiveness(existingForKey);
      return res.json({ recommendations: enriched });
    }

    // Build a large candidate pool (engine + defaults) so we can ALWAYS save 3.
    const engineTexts = getRecommendations({ category, activity, moodType, sleepHours, n: 24 }) || [];
    const defaultTexts = getDefaultTips({ category, activity, moodType });

    // Normalize and de-dup while preserving order
    const pool = [];
    const seen = new Set();
    for (const t of [...engineTexts, ...defaultTexts]) {
      const tt = String(t || '').trim();
      if (!tt) continue;
      const key = tt.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      pool.push(tt);
    }

    // Determine blocked texts (still respected when possible, but NEVER causes empty output)
    const ineffectiveAgg = await RecommendationEffectiveness.aggregate([
      { $match: { user: userId, effective: false } },
      { $group: { _id: '$recommendation', ineffectiveCount: { $sum: 1 } } },
      { $match: { ineffectiveCount: { $gte: 2 } } }
    ]);

    const ineffectiveRecIds = ineffectiveAgg.map((a) => a._id);
    const ineffectiveRecs = await Recommendation.find({
      _id: { $in: ineffectiveRecIds },
      user: userId,
      category,
      activity
    })
      .select('recommendation')
      .lean();

    const blocked = new Set(ineffectiveRecs.map((r) => String(r.recommendation).trim().toLowerCase()));

    // Helper: upsert one recommendation so it is ALWAYS persisted (rateable)
    const upsertOne = async (text) => {
      const docBase = {
        user: userId,
        date,
        category,
        activity,
        moodScoreValue,
        sleepHours,
        recommendation: String(text).trim(),
        type: moodType,

        // Back-compat: keep moodScore populated even for moodLog flow (legacy schema expectations)
        moodScore: sourceId,
        moodLog: sourceType === 'moodLog' ? sourceId : undefined
      };

      // Use moodLog if available; otherwise moodScore. This avoids relying on day ranges to find the record later.
      const key =
        sourceType === 'moodLog'
          ? { user: userId, moodLog: sourceId, recommendation: docBase.recommendation }
          : { user: userId, moodScore: sourceId, recommendation: docBase.recommendation };

      // Upsert guarantees persistence; duplicates won’t throw.
      const saved = await Recommendation.findOneAndUpdate(
        key,
        { $setOnInsert: docBase },
        { new: true, upsert: true, setDefaultsOnInsert: true }
      ).lean();

      return saved;
    };

    // First pass: avoid blocked if possible
    const savedDocs = [];
    for (const text of pool) {
      if (savedDocs.length >= 3) break;
      if (blocked.has(String(text).toLowerCase())) continue;
      const doc = await upsertOne(text);
      if (doc) savedDocs.push(doc);
    }

    // Second pass: if still not enough, ignore blocked (requirement: ALWAYS have recommendations)
    if (savedDocs.length < 3) {
      for (const text of pool) {
        if (savedDocs.length >= 3) break;
        const doc = await upsertOne(text);
        if (doc) {
          // avoid returning duplicates in the response list
          if (!savedDocs.some((d) => String(d._id) === String(doc._id))) savedDocs.push(doc);
        }
      }
    }

    // Final fetch: guarantee 1..3 persisted docs
    const final = await Recommendation.find({ $or: [primaryKeyQuery, legacyKeyQuery] })
      .sort({ createdAt: 1 })
      .limit(3)
      .lean();

    // Hard guarantee: if something very unexpected happened, force-create 3 defaults.
    if (!final || final.length === 0) {
      const hard = getDefaultTips({ category, activity, moodType }).slice(0, 3);
      for (const t of hard) {
        await upsertOne(t);
      }

      const refetch = await Recommendation.find({ $or: [primaryKeyQuery, legacyKeyQuery] })
        .sort({ createdAt: 1 })
        .limit(3)
        .lean();

      const enriched = await enrichWithEffectiveness(refetch);
      return res.json({ recommendations: enriched });
    }

    const enriched = await enrichWithEffectiveness(final);
    return res.json({ recommendations: enriched });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

exports.getCurrentWeekRecommendations = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { start, end } = getCurrentWeekRange();

    const recs = await Recommendation.find({
      user: userId,
      date: { $gte: start, $lte: end }
    })
      .sort({ date: 1 })
      .lean();

    const enriched = await enrichWithEffectiveness(recs);
    return res.json({ recommendations: enriched });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

/**
 * Submit effectiveness feedback:
 * body: { recommendationId, rating (1-5), comment (string, optional) }
 * Allows rating only within the current week of the recommendation.
 * One rating per (recommendation, user): if exists, update; otherwise create.
 * Combines rating (80%) and sentiment (20% when comment >= 10 chars).
 * If no usable comment, use 100% rating.
 */
exports.submitRecommendationFeedback = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { recommendationId, rating, comment } = req.body || {};
    if (!recommendationId || rating == null) {
      return res.status(400).json({ error: 'recommendationId and rating are required' });
    }
    const r = Number(rating);
    if (Number.isNaN(r) || r < 1 || r > 5) {
      return res.status(400).json({ error: 'rating must be a number between 1 and 5' });
    }

    const rec = await Recommendation.findById(recommendationId).lean();
    if (!rec) return res.status(404).json({ error: 'Recommendation not found' });

    // Enforce: allow ratings only for recommendations within the current week
    if (!isDateWithinCurrentWeek(rec.date)) {
      return res
        .status(400)
        .json({ error: 'Rating period has ended for this recommendation (outside current week).' });
    }

    const pythonApiUrl = process.env.PYTHON_API_URL;
    const token = req.headers.authorization;

    const hasComment = typeof comment === 'string' && comment.trim().length >= 10;
    let sentimentScore = 0;

    if (hasComment) {
      try {
        const pyResponse = await fetch(`${pythonApiUrl}/api/sentiment`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: token || ''
          },
          body: JSON.stringify({ comment: comment || '' })
        });
        const ct = pyResponse.headers.get('content-type') || '';
        const pyData = ct.includes('application/json') ? await pyResponse.json() : {};
        if (pyResponse.ok && typeof pyData?.sentimentScore === 'number') {
          sentimentScore = Number(pyData.sentimentScore);
        }
      } catch (_) {
        sentimentScore = 0;
      }
    }

    const rNorm = (r - 1) / 4;
    const sNorm = hasComment ? (sentimentScore + 1) / 2 : 0;

    const ratingWeight = hasComment ? 0.8 : 1.0;
    const sentimentWeight = hasComment ? 0.2 : 0.0;

    let combinedScore = ratingWeight * rNorm + sentimentWeight * sNorm;
    combinedScore = Math.max(0, Math.min(1, combinedScore));

    const effective = combinedScore >= 0.65;

    // One rating per (recommendation, user): update if exists, else insert
    const update = {
      $set: {
        rating: r,
        comment: comment || '',
        sentimentScore,
        combinedScore,
        effective
      }
    };
    const options = { new: true, upsert: true, setDefaultsOnInsert: true };

    const feedbackDoc = await RecommendationEffectiveness.findOneAndUpdate(
      { recommendation: recommendationId, user: userId },
      update,
      options
    ).lean();

    // Update aggregates on Recommendation
    try {
      const agg = await RecommendationEffectiveness.aggregate([
        { $match: { recommendation: rec._id } },
        { $group: { _id: '$recommendation', avgCombined: { $avg: '$combinedScore' }, count: { $sum: 1 } } }
      ]);
      const avgCombined = agg?.[0]?.avgCombined ?? 0;
      const count = agg?.[0]?.count ?? 0;
      await Recommendation.updateOne(
        { _id: rec._id },
        { $set: { effectivenessAvg: avgCombined, effectivenessCount: count, effective } }
      );
    } catch (_) {}

    return res.json({
      feedback: feedbackDoc,
      sentimentScore,
      combinedScore,
      effective
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// Return current user's feedback for a specific recommendation
exports.getUserFeedbackForRecommendation = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { recommendationId } = req.params;
    if (!recommendationId) return res.status(400).json({ error: 'recommendationId is required' });

    const feedback = await RecommendationEffectiveness.findOne({
      recommendation: recommendationId,
      user: userId
    }).lean();

    return res.json({ feedback: feedback || null });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

/**
 * Legacy helper for mobile flows that resolve a MoodScore by { date, category, activity }.
 * Kept for compatibility with existing clients.
 */
exports.resolveMoodScoreId = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { date, category, activity } = req.body || {};
    if (!date || !category) {
      return res.status(400).json({ error: 'date and category are required' });
    }

    const doc = await findMoodScoreByKey({ userId, date, category, activity });
    if (!doc) return res.json({ moodScoreId: null });

    return res.json({ moodScoreId: doc._id });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};