const fetch = require('node-fetch');
const AnovaResult = require('../models/AnovaResult');
const MoodScore = require('../models/MoodScore');
const MoodLog = require('../models/MoodLog');
const User = require('../models/User'); // for uid -> _id fallback

// Normalize Tukey rows (Python sends 'p-adj' or 'p_adj')
const normalizeTukey = rows =>
  (rows || []).map(r => ({
    group1: r.group1,
    group2: r.group2,
    meandiff: r.meandiff,
    p_adj: r['p-adj'] ?? r.p_adj ?? null,
    lower: r.lower,
    upper: r.upper,
    reject: r.reject
  }));

// Helper: build local day bounds [start, next)
function localDayBounds(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const start = new Date(y, m - 1, d);
  start.setHours(0, 0, 0, 0);
  const next = new Date(start);
  next.setDate(start.getDate() + 1);
  next.setHours(0, 0, 0, 0);
  return { start, next };
}

// Compute means and counts from MoodScore docs for one category
function computeMeansAndCountsFromDocs(docs = []) {
  const byAct = new Map();
  for (const d of docs) {
    const a = d.activity || 'unknown';
    if (!byAct.has(a)) byAct.set(a, { sum: 0, count: 0 });
    const s = byAct.get(a);
    s.sum += Number(d.moodScore) || 0;
    s.count += 1;
  }
  const groupMeans = {};
  const groupCounts = {};
  for (const [a, { sum, count }] of byAct.entries()) {
    if (count > 0) {
      groupMeans[a] = +(sum / count).toFixed(2);
      groupCounts[a] = count;
    }
  }
  return { groupMeans, groupCounts };
}

// Derive "top" lists from means/counts (≥2 logs)
function computeTopListsFromMeans(means = {}, counts = {}, minN = 2, limit = 5) {
  const rows = Object.entries(means)
    .filter(([name]) => (counts[name] || 0) >= minN)
    .map(([name, avg]) => ({ activity: name, moodScore: +(+avg).toFixed(2) }));

  const topPositive = rows.filter(r => r.moodScore > 0).sort((a, b) => b.moodScore - a.moodScore).slice(0, limit);
  const topNegative = rows.filter(r => r.moodScore < 0).sort((a, b) => a.moodScore - b.moodScore).slice(0, limit);
  return { topPositive, topNegative };
}

// Pick saved means/counts, else backfilled ones
function pickSavedOrBackfill(saved = {}, backfill = {}) {
  return (saved && Object.keys(saved).length > 0) ? saved : backfill;
}

// Resolve Mongo user _id from req.user (supports either req.user._id or req.user.uid)
async function resolveMongoUserId(req) {
  if (req.user?._id) return req.user._id;
  if (req.user?.uid) {
    const u = await User.findOne({ firebaseUid: req.user.uid }).select('_id');
    return u?._id;
  }
  return null;
}

// Always build frontend payload for a saved record with backfilled means/counts (USING RANGE)
async function buildSavedPayload(userId, startDate, nextDate, category) {
  const saved = await AnovaResult.findOne({
    user: userId,
    category,
    date: { $gte: startDate, $lt: nextDate }
  }).lean();
  if (!saved) return null;

  const docs = await MoodScore.find({
    user: userId,
    date: { $gte: startDate, $lt: nextDate },
    category
  }).lean();

  const { groupMeans, groupCounts } = computeMeansAndCountsFromDocs(docs);
  const gm = pickSavedOrBackfill(saved.anova?.groupMeans, groupMeans);
  const gc = pickSavedOrBackfill(saved.anova?.groupCounts, groupCounts);

  return {
    success: true,
    F_value: saved.anova?.F_value,
    p_value: saved.anova?.p_value,
    MSB: saved.anova?.MSB,
    MSW: saved.anova?.MSW,
    interpretation: saved.anova?.interpretation,
    includedGroups: saved.anova?.includedGroups || [],
    ignoredGroups: saved.anova?.ignoredGroups || [],
    tukeyHSD: normalizeTukey(saved.tukeyHSD || []),
    tukeyInfo: saved.anova?.tukeyInfo || {},
    groupMeans: gm,
    groupCounts: gc
  };
}

// Run ANOVA for a single day; frontend uses groupMeans and tukeyHSD
exports.runAnovaForUser = async (req, res) => {
  try {
    const mongoUserId = await resolveMongoUserId(req);
    if (!mongoUserId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const { date } = req.body;
    if (!date) return res.status(400).json({ success: false, message: 'Date is required' });

    const { start: targetDate, next: nextDate } = localDayBounds(date);
    const categories = ['activity', 'social', 'health'];

    // Fetch logs in local bounds
    const logs = await MoodLog.find({
      user: mongoUserId,
      date: { $gte: targetDate, $lt: nextDate }
    });

    // If no logs, return saved payloads for all categories (RANGE)
    if (!logs || logs.length === 0) {
      const anovaResultsForFrontend = {};
      for (const cat of categories) {
        const payload = await buildSavedPayload(mongoUserId, targetDate, nextDate, cat);
        if (payload) anovaResultsForFrontend[cat] = payload;
      }

      const sleepScore = await MoodScore.findOne({
        user: mongoUserId,
        date: { $gte: targetDate, $lt: nextDate },
        category: 'sleep'
      }).lean();

      const sleepData = sleepScore
        ? { quality: sleepScore.sleepQuality, hours: sleepScore.sleepHours, moodScore: sleepScore.moodScore, _id: sleepScore._id }
        : null;

      return res.json({
        success: Object.keys(anovaResultsForFrontend).length > 0 || !!sleepData,
        anovaResults: anovaResultsForFrontend,
        sleep: sleepData,
        message: Object.keys(anovaResultsForFrontend).length === 0 && !sleepData ? 'No logs or saved results for this day.' : undefined
      });
    }

    // Recompute mood scores for non-sleep logs
    await MoodScore.deleteMany({
      user: mongoUserId,
      date: { $gte: targetDate, $lt: nextDate },
      category: { $ne: 'sleep' }
    });

    // Sleep extraction
    let sleepQuality = null;
    let sleepHours = null;
    let sleepMoodScore = null;
    let sleepMoodScoreId = null;

    logs.forEach(log => {
      if (log.category === 'sleep') {
        sleepHours = log.hrs;
        if (sleepHours <= 4) sleepQuality = 'Poor';
        else if (sleepHours >= 6 && sleepHours <= 8) sleepQuality = 'Sufficient';
        else if (sleepHours > 8) sleepQuality = 'Good';

        if (sleepHours >= 7 && sleepHours <= 9) {
          sleepMoodScore = Math.round(((sleepHours - 4) / 5) * 80);
        } else if (sleepHours < 7) {
          sleepMoodScore = Math.round(((sleepHours - 7) / 7) * 100);
        } else if (sleepHours > 9) {
          sleepMoodScore = Math.round(((9 - sleepHours) / 2) * 30);
        }
      }
    });

    if (sleepHours !== null && sleepMoodScore !== null) {
      // Use date RANGE for upsert to avoid time equality issues
      const sleepScore = await MoodScore.findOneAndUpdate(
        { user: mongoUserId, category: 'sleep', activity: 'sleep', date: { $gte: targetDate, $lt: nextDate } },
        { $set: { moodScore: sleepMoodScore, sleepHours, sleepQuality }, $setOnInsert: { date: targetDate } },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      sleepMoodScoreId = sleepScore ? sleepScore._id : null;
    }

    // Compute per-log mood scores
    for (const log of logs) {
      if (
        log.category !== 'sleep' &&
        log.beforeIntensity !== undefined && log.beforeIntensity !== null &&
        log.afterIntensity !== undefined && log.afterIntensity !== null
      ) {
        const diff = log.afterIntensity - log.beforeIntensity;
        const moodScore = Math.round((diff / 5) * 100);
        await MoodScore.create({
          user: mongoUserId,
          date: log.date,
          category: log.category,
          activity: log.activity,
          moodScore
        });
      }
    }

    const savedResults = [];
    const anovaResultsForFrontend = {};

    for (const category of categories) {
      const moodScores = await MoodScore.find({
        user: mongoUserId,
        date: { $gte: targetDate, $lt: nextDate },
        category
      });

      const dataForPython = { data: { [category]: {} } };
      moodScores.forEach(doc => {
        const activityName = doc.activity || 'unknown';
        if (!dataForPython.data[category][activityName]) dataForPython.data[category][activityName] = [];
        dataForPython.data[category][activityName].push(doc.moodScore);
      });

      // If no groups, return saved payload (RANGE)
      if (!Object.keys(dataForPython.data[category]).length) {
        const payload = await buildSavedPayload(mongoUserId, targetDate, nextDate, category);
        if (payload) anovaResultsForFrontend[category] = payload;
        continue;
      }

      const pythonApiUrl = process.env.PYTHON_API_URL || 'http://localhost:5001';
      const token = req.headers.authorization || '';

      const pythonResponse = await fetch(`${pythonApiUrl}/api/run-anova`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token
        },
        body: JSON.stringify(dataForPython)
      });

      const pythonData = await pythonResponse.json();
      const resultData = pythonData?.results?.[category];

      // If Python says insufficient, return saved payload (RANGE)
      if (!pythonData.success || !resultData || resultData.success === false) {
        const payload = await buildSavedPayload(mongoUserId, targetDate, nextDate, category);
        if (payload) {
          anovaResultsForFrontend[category] = payload;
          continue;
        }

        const ignoredGroups =
          (resultData && resultData.ignoredGroups) ||
          Object.entries(dataForPython.data[category])
            .filter(([, arr]) => (arr?.length || 0) < 2)
            .map(([name]) => name);

        anovaResultsForFrontend[category] = {
          insufficient: true,
          message:
            (resultData && resultData.message) ||
            pythonData.message ||
            'Logs are still insufficient to run a proper analysis. Come back later!',
          ignoredGroups
        };
        continue;
      }

      // Normalize Tukey
      let tukeyRows = normalizeTukey(resultData.tukeyHSD);

      // Ensure groupCounts present
      const groupCounts = resultData.groupCounts && Object.keys(resultData.groupCounts).length
        ? resultData.groupCounts
        : Object.fromEntries(
            Object.entries(dataForPython.data[category]).map(([activity, arr]) => [activity, arr.length])
          );

      // Filter Tukey pairs to only those with both groups >= 2 logs
      tukeyRows = tukeyRows.filter(r =>
        (groupCounts[r.group1] || 0) >= 2 && (groupCounts[r.group2] || 0) >= 2
      );

      // Persist (store snapshot of groupMeans & groupCounts)
      let result = await AnovaResult.findOne({
        user: mongoUserId,
        category,
        date: { $gte: targetDate, $lt: nextDate } // RANGE write-protect
      });

      const anovaPayload = {
        F_value: resultData.F_value,
        p_value: resultData.p_value,
        MSB: resultData.MSB,
        MSW: resultData.MSW,
        interpretation: resultData.interpretation,
        includedGroups: resultData.includedGroups || [],
        ignoredGroups: resultData.ignoredGroups || [],
        tukeyInfo: resultData.tukeyInfo || {},
        groupMeans: resultData.groupMeans || {},
        groupCounts
      };

      const { topPositive, topNegative } = computeTopListsFromMeans(anovaPayload.groupMeans, anovaPayload.groupCounts);

      // Anchor saved document at local NOON to avoid UTC previous-day display
      const localNoonAnchor = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 12, 0, 0, 0);

      if (!result) {
        result = new AnovaResult({
          user: mongoUserId,
          category,
          date: localNoonAnchor, // store local-day anchor at noon
          anova: anovaPayload,
          topPositive,
          topNegative,
          tukeyHSD: tukeyRows
        });
      } else {
        result.date = localNoonAnchor; // keep anchor consistent if we previously saved midnight
        result.anova = anovaPayload;
        result.topPositive = topPositive;
        result.topNegative = topNegative;
        result.tukeyHSD = tukeyRows;
      }

      await result.save();
      savedResults.push(result);

      // Frontend payload
      anovaResultsForFrontend[category] = {
        success: true,
        F_value: resultData.F_value,
        p_value: resultData.p_value,
        MSB: resultData.MSB,
        MSW: resultData.MSW,
        interpretation: resultData.interpretation,
        includedGroups: resultData.includedGroups || [],
        ignoredGroups: resultData.ignoredGroups || [],
        tukeyHSD: tukeyRows,
        tukeyInfo: resultData.tukeyInfo || {},
        groupMeans: resultData.groupMeans || {},
        groupCounts
      };
    }

    const sleepData = (sleepHours !== null && sleepMoodScore !== null)
      ? { quality: sleepQuality, hours: sleepHours, moodScore: sleepMoodScore, _id: sleepMoodScoreId }
      : null;

    // Final fallback: return saved payloads if recomputation produced none (RANGE)
    if (Object.keys(anovaResultsForFrontend).length === 0 && !sleepData) {
      const payload = {};
      for (const cat of ['activity', 'social', 'health']) {
        const p = await buildSavedPayload(mongoUserId, targetDate, nextDate, cat);
        if (p) payload[cat] = p;
      }

      if (Object.keys(payload).length > 0) {
        return res.json({
          success: true,
          anovaResults: payload,
          sleep: sleepData || null
        });
      }

      return res.json({
        success: false,
        message: 'Logs are still insufficient to run a proper analysis. Come back later!',
        sleep: null
      });
    }

    res.json({
      success: true,
      savedResults,
      anovaResults: anovaResultsForFrontend,
      sleep: sleepData
    });
  } catch (err) {
    console.error('ANOVA Controller Error:', err);
    res.status(500).json({ success: false, message: 'Server error while running ANOVA', error: err.message });
  }
};

// Historical fetch: use local bounds and inclusive end by converting to next local midnight
exports.getHistoricalAnova = async (req, res) => {
  try {
    const mongoUserId = await resolveMongoUserId(req);
    if (!mongoUserId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const { startDate, endDate } = req.query;
    if (!startDate || !endDate) {
      return res.status(400).json({ success: false, message: 'startDate and endDate are required' });
    }

    const { start: startLocal } = localDayBounds(startDate);
    const { next: endNextLocal } = localDayBounds(endDate);

    const anovaResults = await AnovaResult.find({
      user: mongoUserId,
      date: { $gte: startLocal, $lt: endNextLocal }
    }).lean();

    const moodScores = await MoodScore.find({
      user: mongoUserId,
      date: { $gte: startLocal, $lt: endNextLocal }
    }).lean();

    const anovaByDate = {};
    anovaResults.forEach(result => {
      const dt = new Date(result.date);
      // Build LOCAL YYYY-MM-DD key (avoid UTC ISO previous-day)
      const dateKey = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
      if (!anovaByDate[dateKey]) anovaByDate[dateKey] = {};
      anovaByDate[dateKey][result.category] = {
        anova: result.anova,
        topPositive: result.topPositive || [],
        topNegative: result.topNegative || [],
        tukeyHSD: result.tukeyHSD || []
      };
    });

    const moodScoresByDate = {};
    moodScores.forEach(ms => {
      const dt = new Date(ms.date);
      const dateKey = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
      if (!moodScoresByDate[dateKey]) moodScoresByDate[dateKey] = {};
      if (!moodScoresByDate[dateKey][ms.category]) moodScoresByDate[dateKey][ms.category] = [];
      moodScoresByDate[dateKey][ms.category].push(ms);
    });

    res.json({
      success: true,
      anovaByDate,
      moodScoresByDate
    });
  } catch (err) {
    console.error('Historical ANOVA fetch error:', err);
    res.status(500).json({ success: false, message: 'Server error while fetching historical ANOVA', error: err.message });
  }
};