const fetch = require('node-fetch');
const ConcordanceResult = require('../models/ConcordanceResult');
const MoodLog = require('../models/MoodLog');

// Helper: local day bounds [start, next)
function localDayBounds(dateStr) {
  const [y, m, d] = String(dateStr).split('-').map(Number);
  const start = new Date(y, m - 1, d);
  start.setHours(0, 0, 0, 0);
  const next = new Date(start);
  next.setDate(start.getDate() + 1);
  next.setHours(0, 0, 0, 0);
  return { start, next };
}

// Convert valence+intensity -> signed score (scaled)
function signed(valence, intensity, scale = 20) {
  if (intensity == null) return null;
  const v = String(valence || '').toLowerCase();
  const s = v === 'positive' ? +1 : v === 'negative' ? -1 : 0;
  return s * Number(intensity) * scale;
}

// Build latest MoodLog _id per activity from docs (for recommendation links)
function buildLatestIdsMap(docs = []) {
  const latestByAct = {};
  for (const d of docs) {
    const a = d.activity || 'unknown';
    const ts = new Date(d.date).getTime();
    const prevTs = latestByAct[a]?.ts ?? -Infinity;
    if (ts >= prevTs) {
      latestByAct[a] = { id: d._id, ts };
    }
  }
  const map = {};
  Object.entries(latestByAct).forEach(([a, v]) => {
    map[a] = v.id;
  });
  return map;
}

// Build CCC payload from MoodLog docs (paired before/after per activity)
async function buildPairsPayload(userId, start, next, scale = 20) {
  const logs = await MoodLog.find({
    user: userId,
    date: { $gte: start, $lt: next }
  }).lean();

  const categories = ['activity', 'social', 'health'];
  const data = {};
  categories.forEach((c) => {
    data[c] = {};
  });

  for (const log of logs) {
    if (log.category === 'sleep') continue; // sleep handled separately
    const category = categories.includes(log.category) ? log.category : 'activity';
    const act = log.activity || 'unknown';
    data[category][act] = data[category][act] || [];

    const b = signed(log.beforeValence, log.beforeIntensity, scale);
    const a = signed(log.afterValence, log.afterIntensity, scale);
    if (b != null && a != null) {
      data[category][act].push([b, a]); // numeric pair
    }
  }

  return { data, logs };
}

// Count pairs locally per activity
function countPairs(groups = {}) {
  const counts = {};
  Object.entries(groups).forEach(([act, arr]) => {
    counts[act] = arr?.length || 0;
  });
  return counts;
}

// Count total logs per activity (whether paired or not)
function countLogsByActivity(logDocs = []) {
  const counts = {};
  for (const d of logDocs) {
    const a = d.activity || 'unknown';
    counts[a] = (counts[a] || 0) + 1;
  }
  return counts;
}

// Derive top lists from mean deltas (safety if Python omits them)
function computeTopListsFromMeans(means = {}) {
  const rows = Object.entries(means).map(([activity, moodScore]) => ({
    activity,
    moodScore: +Number(moodScore).toFixed(2)
  }));
  const topPositive = rows.filter((r) => r.moodScore > 0).sort((a, b) => b.moodScore - a.moodScore);
  const topNegative = rows.filter((r) => r.moodScore < 0).sort((a, b) => a.moodScore - b.moodScore);
  return { topPositive, topNegative };
}

// Pick latest sleep log in the day
function pickSleep(logs = []) {
  const sleepLogs = logs
    .filter((l) => l.category === 'sleep')
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  if (sleepLogs.length === 0) return null;

  const last = sleepLogs[sleepLogs.length - 1];
  const sleepHours = last.hrs;

  if (typeof sleepHours !== 'number') return null;

  let sleepQuality = null;
  if (sleepHours <= 5) sleepQuality = 'Poor';
  else if (sleepHours >= 6 && sleepHours <= 8) sleepQuality = 'Sufficient';
  else if (sleepHours > 8) sleepQuality = 'Good';

  // Simple effect score for sleep
  let sleepMoodScore = null;
  if (sleepHours >= 7 && sleepHours <= 9) {
    sleepMoodScore = Math.round(((sleepHours - 4) / 5) * 80);
  } else if (sleepHours < 7) {
    sleepMoodScore = Math.round(((sleepHours - 7) / 7) * 100);
  } else if (sleepHours > 9) {
    sleepMoodScore = Math.round(((9 - sleepHours) / 2) * 30);
  }
  if (sleepMoodScore == null || Number.isNaN(sleepMoodScore)) sleepMoodScore = -100;

  return { quality: sleepQuality, hours: sleepHours, moodScore: sleepMoodScore, _id: last._id };
}

exports.runConcordanceForUser = async (req, res) => {
  try {
    const userId = req.user._id;
    const { date, thresholds: clientThresholds } = req.body;
    if (!date) return res.status(400).json({ success: false, message: 'Date is required' });

    const { start: targetDate, next: nextDate } = localDayBounds(date);

    // Anchor saved document at local NOON
    const localNoonAnchor = new Date(
      targetDate.getFullYear(),
      targetDate.getMonth(),
      targetDate.getDate(),
      12,
      0,
      0,
      0
    );

    const categories = ['activity', 'social', 'health'];

    // Build CCC payload from logs (pairs) + also get all logs for the day
    const scale = Number(clientThresholds?.scale ?? 20);
    const { data: payload, logs } = await buildPairsPayload(userId, targetDate, nextDate, scale);

    // Sleep extraction (same shape frontend expects)
    const sleepData = pickSleep(logs);

    // Precompute per-category logs for the day (used to always provide groupLastIds, even if CCC is insufficient)
    const dailyLogDocsByCategory = {};
    for (const cat of categories) {
      dailyLogDocsByCategory[cat] = logs
        .filter((l) => l.category === cat)
        .map((l) => ({ _id: l._id, activity: l.activity, date: l.date }));
    }

    // Build "latest MoodLog id per activity" maps for the day (always available if logs exist)
    const latestIdsByCategory = {};
    const logCountsByCategory = {};
    for (const cat of categories) {
      latestIdsByCategory[cat] = buildLatestIdsMap(dailyLogDocsByCategory[cat] || {});
      logCountsByCategory[cat] = countLogsByActivity(dailyLogDocsByCategory[cat] || {});
    }

    // Determine if we have any PAIRS (not just logs) for CCC
    const hasAnyPairs = categories.some((cat) => Object.keys(payload[cat] || {}).length > 0);

    // If no pairs at all, return saved ConcordanceResult snapshot (if any) + ALWAYS include groupLastIds
    if (!hasAnyPairs) {
      const savedDoc = await ConcordanceResult.findOne({
        user: userId,
        date: { $gte: targetDate, $lt: nextDate }
      }).lean();

      const savedResults = savedDoc?.results || {};
      const thresholds = savedDoc?.thresholds || { minPairs: 1, pos: 10, neg: -10, minCcc: 0.2, scale };

      // Always return a complete object for frontend (so it doesn't show "No data" due to missing keys),
      // and always include groupLastIds for recommendation navigation.
      const concordanceResults = {};
      for (const cat of categories) {
        const fromSaved = savedResults?.[cat];
        if (fromSaved) {
          concordanceResults[cat] = {
            ...fromSaved,
            // Ensure these are present even on older saved docs
            groupLastIds: fromSaved.groupLastIds || latestIdsByCategory[cat] || {},
            availableGroups: fromSaved.availableGroups || Object.keys(latestIdsByCategory[cat] || {}),
            groupLogCounts: fromSaved.groupLogCounts || logCountsByCategory[cat] || {}
          };
        } else {
          // No saved snapshot: return "insufficient" but still include ids for tips
          concordanceResults[cat] = {
            insufficient: true,
            message: 'Not enough paired logs to analyze yet. You can still view tips for logged activities.',
            includedGroups: [],
            ignoredGroups: Object.keys(latestIdsByCategory[cat] || {}),
            groupCounts: {}, // pairs count (none)
            groupMeans: {},
            topPositive: [],
            topNegative: [],
            groupLastIds: latestIdsByCategory[cat] || {},
            availableGroups: Object.keys(latestIdsByCategory[cat] || {}),
            groupLogCounts: logCountsByCategory[cat] || {}
          };
        }
      }

      const anyLogsToday =
        categories.some((cat) => Object.keys(latestIdsByCategory[cat] || {}).length > 0) || !!sleepData;

      return res.json({
        success: anyLogsToday || Object.keys(savedResults).length > 0,
        concordanceResults,
        thresholds,
        sleep: sleepData,
        message:
          !anyLogsToday && Object.keys(savedResults).length === 0
            ? 'No logs or saved results for this day.'
            : undefined
      });
    }

    // Call Python CCC service
    const pythonApiUrl = process.env.PYTHON_API_URL;
    const thresholds = {
      pos: Number(clientThresholds?.pos ?? 10),
      neg: Number(clientThresholds?.neg ?? -10),
      minPairs: Number(clientThresholds?.minPairs ?? 1),
      minCcc: Number(clientThresholds?.minCcc ?? 0.2),
      scale
    };

    const pythonResponse = await fetch(`${pythonApiUrl}/api/ccc/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: payload, thresholds })
    });

    const pythonData = await pythonResponse.json();

    const concordanceResultsForFrontend = {};
    const resultsToStore = {};

    for (const category of categories) {
      const catGroups = payload[category] || {};
      const localPairCounts = countPairs(catGroups);

      // Always provide groupLastIds (even if CCC fails for this category)
      const groupLastIds = latestIdsByCategory[category] || {};
      const availableGroups = Object.keys(groupLastIds);
      const groupLogCounts = logCountsByCategory[category] || {};

      const resultData = pythonData?.results?.[category];
      if (!pythonData?.success || !resultData || resultData.success === false) {
        // If CCC failed, still return something with ids so UI can route to tips later
        const ignoredGroups =
          Array.isArray(resultData?.ignoredGroups) && resultData.ignoredGroups.length > 0
            ? resultData.ignoredGroups
            : Object.keys(localPairCounts).filter((g) => (localPairCounts[g] || 0) < thresholds.minPairs);

        const insufficient = {
          insufficient: true,
          message:
            (resultData && resultData.message) ||
            pythonData?.message ||
            'Logs are still insufficient to analyze. Come back later!',
          includedGroups: [],
          ignoredGroups,
          groupCounts: localPairCounts,
          groupMeans: {},
          topPositive: [],
          topNegative: [],
          groupLastIds,
          availableGroups,
          groupLogCounts
        };

        concordanceResultsForFrontend[category] = insufficient;
        resultsToStore[category] = insufficient;
        continue;
      }

      // Safety: compute top lists if missing
      const means = resultData.groupMeans || {};
      const { topPositive, topNegative } =
        resultData.topPositive && resultData.topNegative
          ? { topPositive: resultData.topPositive, topNegative: resultData.topNegative }
          : computeTopListsFromMeans(means);

      const normalized = {
        ...resultData,

        // Always attach ids for recommendation routing (not just included groups)
        groupLastIds,
        availableGroups,
        groupLogCounts,

        // Ensure these exist
        topPositive,
        topNegative,

        // Helpful for debugging/UI: local pair counts as seen by Node
        groupCounts: resultData.groupCounts || localPairCounts
      };

      concordanceResultsForFrontend[category] = normalized;
      resultsToStore[category] = normalized;
    }

    // IMPORTANT: save ALL categories into one doc (do NOT overwrite per loop)
    await ConcordanceResult.findOneAndUpdate(
      { user: userId, date: localNoonAnchor },
      {
        $set: {
          user: userId,
          date: localNoonAnchor,
          results: resultsToStore,
          thresholds,
          computedAt: new Date()
        }
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return res.json({
      success: true,
      concordanceResults: concordanceResultsForFrontend,
      thresholds,
      sleep: sleepData
    });
  } catch (err) {
    console.error('Concordance Controller Error:', err);
    return res.status(500).json({
      success: false,
      message: 'Server error while running CCC',
      error: err.message
    });
  }
};

exports.getHistoricalConcordance = async (req, res) => {
  try {
    const userId = req.user._id;
    const { startDate, endDate } = req.query;
    if (!startDate || !endDate) {
      return res.status(400).json({ success: false, message: 'startDate and endDate are required' });
    }

    const { start: startLocal } = localDayBounds(startDate);
    const { next: endNextLocal } = localDayBounds(endDate);

    const docs = await ConcordanceResult.find({
      user: userId,
      date: { $gte: startLocal, $lt: endNextLocal }
    }).lean();

    const byDate = {};
    docs.forEach((doc) => {
      const dt = new Date(doc.date);
      const dateKey = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(
        dt.getDate()
      ).padStart(2, '0')}`;
      byDate[dateKey] = doc.results || {};
    });

    return res.json({ success: true, concordanceByDate: byDate });
  } catch (err) {
    console.error('Historical CCC fetch error:', err);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching historical CCC',
      error: err.message
    });
  }
};