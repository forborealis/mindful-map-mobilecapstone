const fetch = require('node-fetch');
const MoodScore = require('../models/MoodScore');
const Recommendation = require('../models/Recommendation.js');
const RecommendationEffectiveness = require('../models/RecommendationEffectiveness');
const { getRecommendations } = require('../services/recommendEngine');

function getCurrentWeekRange() {
  const now = new Date();
  const local = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const day = local.getDay();
  const diffToMonday = (day === 0 ? -6 : 1 - day);
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

function normalizeKey(k) {
  return String(k || '').trim().toLowerCase().replace(/\s+/g, '-').replace(/_/g, '-');
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

exports.generateAndSaveRecommendation = async (req, res) => {
  try {
    const { moodScoreId, date, category, activity } = req.body;

    let moodScoreDoc = null;

    if (moodScoreId) {
      moodScoreDoc = await MoodScore.findById(moodScoreId).populate('user');
      if (!moodScoreDoc) return res.status(404).json({ error: 'MoodScore not found' });
    } else if (date && category) {
      const userId = req.user?._id || req.user?.id;
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });

      const found = await findMoodScoreByKey({ userId, date, category, activity });
      if (!found) {
        return res.json({ recommendations: [] });
      }
      moodScoreDoc = await MoodScore.findById(found._id).populate('user');
    } else {
      return res.status(400).json({ error: 'Provide moodScoreId or { date, category, activity }' });
    }

    const { _id, user, date: msDate, category: msCategory, activity: msActivity, moodScore, sleepHours } = moodScoreDoc;
    const moodType = moodScore >= 0 ? 'positive' : 'negative';

    const keyQuery = { user: user._id, date: msDate, category: msCategory, activity: msActivity };
    const existingForKey = await Recommendation.find(keyQuery).sort({ createdAt: 1 }).lean();

    // Get ineffective recommendations to filter out
    const ineffectiveAgg = await RecommendationEffectiveness.aggregate([
      { 
        $match: { 
          user: user._id,
          effective: false 
        } 
      },
      {
        $group: {
          _id: '$recommendation',
          ineffectiveCount: { $sum: 1 }
        }
      },
      {
        $match: {
          ineffectiveCount: { $gte: 2 }
        }
      }
    ]);
    
    const ineffectiveRecIds = ineffectiveAgg.map(a => a._id);
    const ineffectiveRecs = await Recommendation.find({
      _id: { $in: ineffectiveRecIds },
      user: user._id,
      category: msCategory,
      activity: msActivity
    }).select('recommendation').lean();
    
    const blockedTexts = new Set(ineffectiveRecs.map(r => String(r.recommendation).trim().toLowerCase()));

    // Generate recommendations, filtering out blocked ones
    let texts = getRecommendations({
      category: msCategory,
      activity: msActivity,
      moodType,
      sleepHours,
      n: 10
    }) || [];

    texts = texts
      .map(t => String(t).trim())
      .filter(t => t && !blockedTexts.has(t.toLowerCase()))
      .slice(0, 3);

    if (texts.length === 0 && existingForKey.length === 0) {
      return res.json({ recommendations: [] });
    }

    const toInsert = texts
      .map(t => String(t).trim())
      .filter(Boolean)
      .slice(0, 3)
      .map(tt => ({
        moodScore: _id,
        user: user._id,
        date: msDate,
        category: msCategory,
        activity: msActivity,
        moodScoreValue: moodScore,
        sleepHours,
        recommendation: tt,
        type: moodType
      }));

    if (toInsert.length) {
      try {
        await Recommendation.insertMany(toInsert, { ordered: false });
      } catch (e) {
        const msg = String(e?.message || '').toLowerCase();
        const isDup = e.code === 11000 || msg.includes('duplicate key') || msg.includes('e11000') || msg.includes('duplicate');
        if (!isDup) throw e;
      }
    }

    const final = await Recommendation.find(keyQuery).sort({ createdAt: 1 }).limit(3).lean();

    // Attach feedback aggregates
    const ids = final.map(r => r._id);
    const agg = await RecommendationEffectiveness.aggregate([
      { $match: { recommendation: { $in: ids } } },
      {
        $group: {
          _id: '$recommendation',
          count: { $sum: 1 },
          avgCombined: { $avg: '$combinedScore' },
          anyEffective: { $max: { $cond: ['$effective', 1, 0] } },
          ineffectiveCount: { 
            $sum: { $cond: [{ $eq: ['$effective', false] }, 1, 0] } 
          }
        }
      }
    ]);
    const byId = new Map(agg.map(a => [String(a._id), a]));
    const enriched = final.map(r => {
      const a = byId.get(String(r._id));
      return {
        ...r,
        effectivenessCount: a ? a.count : 0,
        effectivenessAvg: a ? a.avgCombined : 0,
        effective: a ? a.anyEffective === 1 : false,
        ineffectiveCount: a ? a.ineffectiveCount : 0
      };
    });

    return res.json({ recommendations: enriched });
  } catch (err) {
    res.status(500).json({ error: err.message });
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

    // Enrich with aggregates
    const ids = recs.map(r => r._id);
    const agg = await RecommendationEffectiveness.aggregate([
      { $match: { recommendation: { $in: ids } } },
      {
        $group: {
          _id: '$recommendation',
          count: { $sum: 1 },
          avgCombined: { $avg: '$combinedScore' },
          anyEffective: { $max: { $cond: ['$effective', 1, 0] } },
          ineffectiveCount: { 
            $sum: { $cond: [{ $eq: ['$effective', false] }, 1, 0] } 
          }
        }
      }
    ]);
    const byId = new Map(agg.map(a => [String(a._id), a]));
    const enriched = recs.map(r => {
      const a = byId.get(String(r._id));
      return {
        ...r,
        effectivenessCount: a ? a.count : 0,
        effectivenessAvg: a ? a.avgCombined : 0,
        effective: a ? a.anyEffective === 1 : false,
        ineffectiveCount: a ? a.ineffectiveCount : 0
      };
    });

    res.json({ recommendations: enriched });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.resolveMoodScoreId = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { date, category, activity } = req.body || {};
    if (!date || !category) return res.status(400).json({ error: 'date and category are required' });

    const doc = await findMoodScoreByKey({ userId, date, category, activity });
    if (!doc) return res.json({ moodScoreId: null });

    return res.json({ moodScoreId: doc._id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

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
      return res.status(400).json({ error: 'Rating period has ended for this recommendation (outside current week).' });
    }

    const pythonApiUrl = process.env.PYTHON_API_URL || 'http://localhost:5001';
    const token = req.headers.authorization;

    const hasComment = typeof comment === 'string' && comment.trim().length >= 10;
    let sentimentScore = 0;

    if (hasComment) {
      try {
        const pyResponse = await fetch(`${pythonApiUrl}/api/sentiment`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': token || ''
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
    res.status(500).json({ error: err.message });
  }
};

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
    res.status(500).json({ error: err.message });
  }
};