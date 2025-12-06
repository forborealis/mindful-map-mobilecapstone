const MoodScore = require('../models/MoodScore');
const Recommendation = require('../models/Recommendation.js');
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
      // Re-fetch populated user for consistent code path
      moodScoreDoc = await MoodScore.findById(found._id).populate('user');
    } else {
      return res.status(400).json({ error: 'Provide moodScoreId or { date, category, activity }' });
    }

    const { _id, user, date: msDate, category: msCategory, activity: msActivity, moodScore, sleepHours } = moodScoreDoc;
    const moodType = moodScore >= 0 ? 'positive' : 'negative';

    // Idempotency per (user, date, category, activity)
    const keyQuery = { user: user._id, date: msDate, category: msCategory, activity: msActivity };
    const existingForKey = await Recommendation.find(keyQuery).sort({ createdAt: 1 }).lean();
    if (existingForKey.length > 0) {
      return res.json({ recommendations: existingForKey.slice(0, 3) });
    }

    // Generate up to 3 unique recommendation texts
    const texts = getRecommendations({
      category: msCategory,
      activity: msActivity,
      moodType,
      sleepHours,
      n: 3
    }) || [];

    if (texts.length === 0) {
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
    return res.json({ recommendations: final });
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

    res.json({ recommendations: recs });
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