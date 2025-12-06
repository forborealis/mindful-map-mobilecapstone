const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Adjust the JSON path if you store it elsewhere
const dataPath = path.join(__dirname, '..', 'utils', 'recommendations.json');

let RECOMMENDATIONS = {};
try {
  const raw = fs.readFileSync(dataPath, 'utf-8');
  RECOMMENDATIONS = JSON.parse(raw);
} catch (e) {
  console.warn('recommendEngine: recommendations.json not found or invalid:', e.message);
  RECOMMENDATIONS = { Sleep: {}, Activity: {}, Social: {}, Health: {} };
}

function stableOrder(items, keyStr) {
  return [...items].sort((a, b) => {
    const ha = crypto.createHash('sha256').update(keyStr + '|' + String(a)).digest('hex');
    const hb = crypto.createHash('sha256').update(keyStr + '|' + String(b)).digest('hex');
    return parseInt(ha.slice(0, 8), 16) - parseInt(hb.slice(0, 8), 16);
  });
}

function topCategory(cat) {
  const c = String(cat || '').trim().toLowerCase();
  if (c === 'sleep') return 'Sleep';
  if (c === 'activity') return 'Activity';
  if (c === 'social') return 'Social';
  if (c === 'health') return 'Health';
  if (['Sleep', 'Activity', 'Social', 'Health'].includes(cat)) return cat;
  return null;
}

function normActivity(a) {
  return String(a || '').trim().toLowerCase();
}

function uniqueTopN(list, n, keyStr) {
  const ordered = stableOrder(list, keyStr);
  const seen = new Set();
  const out = [];
  for (const r of ordered) {
    const t = String(r || '').trim();
    if (!t) continue;
    if (seen.has(t)) continue;
    seen.add(t);
    out.push(t);
    if (out.length === n) break;
  }
  return out;
}

function getRecommendations({ category, activity, moodType, sleepHours, n = 3 }) {
  const cat = topCategory(category);
  const act = normActivity(activity);
  const mood = String(moodType || '').trim().toLowerCase() === 'positive' ? 'positive' : 'negative';
  const keyStr = [cat || '', act || '', mood, sleepHours != null ? String(sleepHours) : ''].join('|');

  if (!cat) return [];

  // Sleep-specific rules
  if (cat === 'Sleep') {
    if (sleepHours == null) return [];
    let bucket = 'enough';
    if (sleepHours < 7) bucket = 'less';
    else if (sleepHours > 9) bucket = 'more';
    const recs = RECOMMENDATIONS.Sleep?.[bucket] || [];
    return uniqueTopN(recs, n, keyStr);
  }

  // Activity/Social/Health
  const recs = RECOMMENDATIONS[cat]?.[act]?.[mood] || [];
  return uniqueTopN(recs, n, keyStr);
}

module.exports = { getRecommendations };