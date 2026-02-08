const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const dataPath = path.join(__dirname, '..', 'utils', 'recommendations.json');
const RECOMMENDATIONS = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

// ---------------- helpers ----------------
function stableOrder(items, keyStr) {
  return [...items].sort((a, b) => {
    const ha = crypto.createHash('sha256').update(keyStr + '|' + String(a)).digest('hex');
    const hb = crypto.createHash('sha256').update(keyStr + '|' + String(b)).digest('hex');
    return parseInt(ha.slice(0, 8), 16) - parseInt(hb.slice(0, 8), 16);
  });
}

function slugify(s) {
  return String(s || '')
    .trim()
    .toLowerCase()
    .replace(/['"]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-');
}

function normMood(moodType) {
  const m = slugify(moodType);
  if (m === 'positive') return 'positive';
  if (m === 'negative') return 'negative';
  if (m === 'neutral') return 'positive'; // JSON has only positive/negative; treat neutral as positive
  return 'negative'; // default to negative if unknown
}

function normCategory(cat) {
  const c = slugify(cat);
  if (c === 'sleep') return 'sleep';
  if (c === 'activity') return 'activity';
  if (c === 'social') return 'social';
  if (c === 'health') return 'health';

  // allow TitleCase keys too
  if (String(cat) === 'Sleep') return 'sleep';
  if (String(cat) === 'Activity') return 'activity';
  if (String(cat) === 'Social') return 'social';
  if (String(cat) === 'Health') return 'health';

  // clamp unknown -> activity (prevents category="studying" bugs)
  return 'activity';
}

// aliases to map user/log variations to the canonical keys used in recommendations.json
const ACTIVITY_ALIASES = {
  studying: 'study',
  study: 'study',

  'doing-your-homework': 'homework',
  'doing-homework': 'homework',
  homework: 'homework',

  'watching-a-movie': 'watch-movie',
  'watching-movie': 'watch-movie',
  'watch-movie': 'watch-movie',
  movie: 'watch-movie',

  'listening-to-music': 'listen-music',
  'listening-music': 'listen-music',
  'listen-music': 'listen-music',
  music: 'listen-music',

  'browsing-the-internet': 'browse-internet',
  'browsing-internet': 'browse-internet',
  'browse-internet': 'browse-internet',
  internet: 'browse-internet',

  chores: 'household-chores',
  'household-chores': 'household-chores',

  jogging: 'jog',
  running: 'jog',
  jog: 'jog',

  walking: 'walk',
  walk: 'walk',

  workout: 'exercise',
  exercising: 'exercise',
  exercise: 'exercise',

  sports: 'sports',
  sport: 'sports',

  meditating: 'meditate',
  meditation: 'meditate',
  meditate: 'meditate',

  'eating-healthy': 'eat-healthy',
  'eat-healthy': 'eat-healthy',

  'eating-unhealthy': 'eat-unhealthy',
  'eat-unhealthy': 'eat-unhealthy',

  'no-physical-activity': 'no-physical',
  'no-physical': 'no-physical',

  alcohol: 'drink-alcohol',
  'drinking-alcohol': 'drink-alcohol',
  'drink-alcohol': 'drink-alcohol'
};

function normActivity(activity) {
  const a = slugify(activity);
  return ACTIVITY_ALIASES[a] || a;
}

function uniqueTopN(list, n, keyStr) {
  const ordered = stableOrder(list, keyStr);
  const seen = new Set();
  const out = [];
  for (const r of ordered) {
    const t = String(r || '').trim();
    if (!t) continue;
    const k = t.toLowerCase();
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(t);
    if (out.length === n) break;
  }
  return out;
}

function sleepBucket(sleepHours) {
  const h = Number(sleepHours);
  if (!Number.isFinite(h)) return 'enough'; // fallback so we always return something
  if (h < 7) return 'less';
  if (h > 9) return 'more';
  return 'enough';
}

// ---------------- index recommendations.json by slugs ----------------
function buildIndex(raw) {
  const idx = { activity: {}, social: {}, health: {}, sleep: {} };

  // Activity/Social/Health
  for (const [topKey, topVal] of Object.entries(raw || {})) {
    const catSlug = slugify(topKey); // "Activity" -> "activity"
    if (!['activity', 'social', 'health', 'sleep'].includes(catSlug)) continue;

    if (catSlug === 'sleep') continue;

    for (const [actKey, moodObj] of Object.entries(topVal || {})) {
      const actSlug = slugify(actKey);
      idx[catSlug][actSlug] = idx[catSlug][actSlug] || {};
      for (const [moodKey, recs] of Object.entries(moodObj || {})) {
        const moodSlug = slugify(moodKey); // positive/negative
        if (!Array.isArray(recs)) continue;
        idx[catSlug][actSlug][moodSlug] = recs.map(String);
      }
    }
  }

  // Sleep
  idx.sleep = raw?.Sleep || raw?.sleep || {};

  return idx;
}

const INDEX = buildIndex(RECOMMENDATIONS);

// ---------------- main API ----------------
function getRecommendations({ category, activity, moodType, sleepHours, n = 3 } = {}) {
  const cat = normCategory(category);
  const mood = normMood(moodType);
  const act = normActivity(activity);

  const keyStr = [cat, act, mood, sleepHours != null ? String(sleepHours) : ''].join('|');

  // Sleep recommendations (bucketed)
  if (cat === 'sleep') {
    const bucket = sleepBucket(sleepHours);
    const recs = Array.isArray(INDEX.sleep?.[bucket]) ? INDEX.sleep[bucket] : [];
    if (recs.length > 0) return uniqueTopN(recs, n, keyStr);

    // last-resort: flatten any sleep bucket
    const allSleep = []
      .concat(INDEX.sleep?.less || [])
      .concat(INDEX.sleep?.enough || [])
      .concat(INDEX.sleep?.more || []);
    return uniqueTopN(allSleep, n, keyStr);
  }

  // Exact match first (after normalization)
  const direct = INDEX?.[cat]?.[act]?.[mood];
  if (Array.isArray(direct) && direct.length > 0) {
    return uniqueTopN(direct, n, keyStr);
  }

  // Fallback 1: try same activity but opposite mood if missing
  const otherMood = mood === 'positive' ? 'negative' : 'positive';
  const altMood = INDEX?.[cat]?.[act]?.[otherMood];
  if (Array.isArray(altMood) && altMood.length > 0) {
    return uniqueTopN(altMood, n, keyStr);
  }

  // Fallback 2: return "some" recommendations for the category+requested mood
  const all = [];
  const byAct = INDEX?.[cat] || {};
  for (const moodsByAct of Object.values(byAct)) {
    const arr = moodsByAct?.[mood];
    if (Array.isArray(arr)) all.push(...arr);
  }
  if (all.length > 0) return uniqueTopN(all, n, keyStr);

  // Fallback 3: any recs in the category
  const any = [];
  for (const moodsByAct of Object.values(byAct)) {
    for (const arr of Object.values(moodsByAct || {})) {
      if (Array.isArray(arr)) any.push(...arr);
    }
  }
  return uniqueTopN(any, n, keyStr);
}

module.exports = { getRecommendations };