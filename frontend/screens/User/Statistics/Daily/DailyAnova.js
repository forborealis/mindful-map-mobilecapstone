import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons, MaterialCommunityIcons, Ionicons, Entypo } from '@expo/vector-icons';
import { colors } from '../../../../utils/colors/colors';
import { fonts } from '../../../../utils/fonts/fonts';
import { runAnova } from '../../../../services/anovaService';

// Simple skeleton
const SkeletonBox = ({ width, height, style }) => (
  <View style={[{ backgroundColor: '#e5e7eb', borderRadius: 14, width, height, marginBottom: 16, opacity: 0.5 }, style]} />
);

const CATEGORY_ICONS = {
  sleep: <MaterialCommunityIcons name="bed" size={32} color="#55AD9B" />,
  activity: <MaterialIcons name="emoji-events" size={32} color="#55AD9B" />,
  social: <Ionicons name="people" size={32} color="#55AD9B" />,
  health: <MaterialIcons name="favorite" size={32} color="#55AD9B" />,
};

const ACTIVITY_LABELS = {
  commute: 'Commuting',
  exam: 'Having an exam',
  homework: 'Doing your homework',
  study: 'Studying',
  project: 'Doing a project',
  read: 'Reading',
  extracurricular: 'Doing an extracurricular activity',
  'household-chores': 'Doing household chores',
  relax: 'Relaxing',
  'watch-movie': 'Watching a movie',
  'listen-music': 'Listening to music',
  gaming: 'Gaming',
  'browse-internet': 'Browsing the internet',
  shopping: 'Shopping',
  travel: 'Traveling',
  alone: 'Being alone',
  friends: 'Socializing with your friends',
  family: 'Socializing with your family',
  classmates: 'Socializing with your classmates',
  relationship: 'Socializing with your significant other',
  online: 'Socializing online',
  pet: 'Being with your pet',
  jog: 'Jogging',
  walk: 'Walking',
  exercise: 'Exercising',
  sports: 'Playing a sport',
  meditate: 'Meditating',
  'eat-unhealthy': 'Eating unhealthy food',
  'eat-healthy': 'Eating healthy food',
  'no-physical': 'Not doing any physical activity',
  'drink-alcohol': 'Drinking alcohol'
};

const sleepQualityColors = { Poor: '#ff6b6b', Sufficient: '#f7b801', Good: '#55AD9B' };
const POSITIVE_COLOR = '#55AD9B';
const NEGATIVE_COLOR = '#FF9800';

// Lightweight accordion for mobile
function Accordion({ title, subtitle, children, initiallyOpen = false }) {
  const [open, setOpen] = useState(initiallyOpen);
  return (
    <View style={{ marginBottom: 8, borderRadius: 12, borderWidth: 1, borderColor: '#D8EFD3', backgroundColor: '#fff' }}>
      <TouchableOpacity
        onPress={() => setOpen(!open)}
        style={{ paddingVertical: 12, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
      >
        <View style={{ flex: 1, paddingRight: 8 }}>
          <Text style={{ fontFamily: fonts.semiBold, color: '#55AD9B', fontSize: 14 }}>{title}</Text>
          {subtitle ? (
            <Text style={{ fontFamily: fonts.regular, color: '#777', fontSize: 12, marginTop: 2 }}>{subtitle}</Text>
          ) : null}
        </View>
        <MaterialIcons name={open ? 'expand-less' : 'expand-more'} size={22} color="#55AD9B" />
      </TouchableOpacity>
      {open && <View style={{ paddingHorizontal: 10, paddingBottom: 10 }}>{children}</View>}
    </View>
  );
}

function formatText(text) {
  if (!text) return '';
  return text.replace(/[-_]/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
}
function getMoodIcon(score) {
  if (score > 0) return <MaterialIcons name="trending-up" size={20} color={POSITIVE_COLOR} />;
  if (score < 0) return <MaterialIcons name="trending-down" size={20} color={NEGATIVE_COLOR} />;
  return <Entypo name="minus" size={20} color="#f7b801" />;
}

// Sleep message — same logic as web
function getSleepMessage(hours, moodScore) {
  if (hours == null || moodScore == null || typeof moodScore !== 'number') {
    return 'Your sleep had a neutral effect today.';
  }
  const absScore = Math.abs(moodScore);
  let intensity;
  if (absScore >= 40) intensity = 'strong';
  else if (absScore >= 20) intensity = 'moderate';
  else if (absScore > 0) intensity = 'slight';

  if (moodScore > 0) return `Sleeping for ${hours} hours had a ${intensity} positive effect on your mood.`;
  if (moodScore < 0) return `${hours} hours of sleep lowered your mood (${intensity} effect).`;
  return 'Your sleep had a neutral effect today.';
}

function getDateString(date) {
  const d = new Date(date);
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}
function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}
function getMoodMessage(activityKey, moodScore) {
  const label = ACTIVITY_LABELS[activityKey] || formatText(activityKey);
  if (moodScore > 0) return `${label} boosted your mood.`;
  if (moodScore < 0) return `${label} lowered your mood.`;
  return `${label} had a neutral effect.`;
}

// Build includedSet like web: includedGroups ∩ (count ≥2). Fallback: all with count ≥2.
function buildIncludedSet(data, groupCounts) {
  const hasMinTwo = (a) => (groupCounts[a] ?? 0) >= 2;
  const rawIncluded = Array.isArray(data?.includedGroups) ? data.includedGroups : [];
  const includedSet = new Set(rawIncluded.filter(hasMinTwo));
  if (includedSet.size === 0) {
    Object.keys(groupCounts || {}).forEach(g => { if (hasMinTwo(g)) includedSet.add(g); });
  }
  return includedSet;
}

// Explain a Tukey pair like the web version
function explainPair(row, groupMeans) {
  const a1 = ACTIVITY_LABELS[row.group1] || formatText(row.group1);
  const a2 = ACTIVITY_LABELS[row.group2] || formatText(row.group2);
  const m1 = groupMeans[row.group1];
  const m2 = groupMeans[row.group2];
  if (typeof m1 !== 'number' || typeof m2 !== 'number') return `${a1} vs ${a2} (limited data).`;

  const diff = m1 - m2;
  const bothNeg = m1 < 0 && m2 < 0;
  const bothPos = m1 > 0 && m2 > 0;
  const equal = Number(m1.toFixed(2)) === Number(m2.toFixed(2));

  if (!row.reject || equal) return `Similar effect: ${a1} & ${a2}.`;

  if (diff > 0) {
    if (bothNeg) return `${a1} lowered mood less than ${a2}.`;
    if (bothPos) return `${a1} lifted mood more than ${a2}.`;
    if (m1 > 0 && m2 < 0) return `${a1} lifted mood while ${a2} lowered it.`;
    if (m1 < 0 && m2 > 0) return `${a2} lifted mood while ${a1} lowered it.`;
    return `${a1} had a higher average mood than ${a2}.`;
  } else {
    if (bothNeg) return `${a2} lowered mood less than ${a1}.`;
    if (bothPos) return `${a2} lifted mood more than ${a1}.`;
    if (m2 > 0 && m1 < 0) return `${a2} lifted mood while ${a1} lowered it.`;
    if (m2 < 0 && m1 > 0) return `${a1} lifted mood while ${m2} lowered it.`;
    return `${a2} had a higher average mood than ${a1}.`;
  }
}

// Activity differences section
function renderActivityComparisons(tukeyHSD = [], groupMeans = {}, groupCounts = {}, includedSet = new Set()) {
  if (!Array.isArray(tukeyHSD) || tukeyHSD.length === 0 || !groupMeans) return null;

  const validGroups = Array.from(includedSet);
  const filteredPairs = tukeyHSD.filter(r => validGroups.includes(r.group1) && validGroups.includes(r.group2));
  if (filteredPairs.length === 0) return null;

  const significantPairs = filteredPairs.filter(r => r.reject);
  const nonSignificantPairs = filteredPairs.filter(r => !r.reject);
  const fmt = v => (typeof v === 'number' && !isNaN(v) ? Number(v).toFixed(2) : 'n/a');

  const ranked = [...validGroups]
    .filter(g => typeof groupMeans[g] === 'number' && !isNaN(groupMeans[g]))
    .sort((a, b) => groupMeans[b] - groupMeans[a]);

  const sigMap = new Map();
  significantPairs.forEach(r => {
    sigMap.set(`${r.group1}||${r.group2}`, r);
    sigMap.set(`${r.group2}||${r.group1}`, r);
  });

  const chain = [];
  for (let i = 0; i < ranked.length - 1; i++) {
    const g1 = ranked[i];
    const g2 = ranked[i + 1];
    const row = sigMap.get(`${g1}||${g2}`);
    if (!row) continue;
    const m1 = groupMeans[g1];
    const m2 = groupMeans[g2];
    const label1 = ACTIVITY_LABELS[g1] || formatText(g1);
    const label2 = ACTIVITY_LABELS[g2] || formatText(g2);

    const sentence = m1 === m2
      ? `Similar: ${label1} & ${label2}`
      : (m1 > m2
          ? `${label1} improved mood more than ${label2}`
          : `${label2} improved mood more than ${label1}`);
    chain.push({
      g1, g2, m1, m2,
      p: row?.p_adj ?? row?.['p-adj'],
      sentence,
      delta: (Math.abs(m1 - m2)).toFixed(2)
    });
    if (chain.length === 3) break;
  }

  return (
    <View style={{ marginBottom: 8, padding: 10, borderRadius: 12, backgroundColor: '#F7FBF9', borderColor: '#D8EFD3', borderWidth: 1 }}>
      <Text style={{ fontFamily: fonts.semiBold, color: '#55AD9B', marginBottom: 6 }}>Activity Differences</Text>

      
      {significantPairs.length > 0 ? (
        <View style={{ marginBottom: 6 }}>
          <Text style={{ fontFamily: fonts.medium, color: '#55AD9B', marginBottom: 6, fontSize: 12 }}>
            Clear differences (≥2 logs each):
          </Text>
          {significantPairs.map((row, idx) => {
            const m1 = groupMeans[row.group1];
            const m2 = groupMeans[row.group2];
            const a1 = ACTIVITY_LABELS[row.group1] || formatText(row.group1);
            const a2 = ACTIVITY_LABELS[row.group2] || formatText(row.group2);
            const diffVal = (Math.abs(m1 - m2)).toFixed(2);
            return (
              <View
                key={idx}
                style={{
                  backgroundColor: '#F1F8E8',
                  borderWidth: 2,
                  borderColor: '#95D2B3',
                  borderRadius: 12,
                  paddingVertical: 10,
                  paddingHorizontal: 10,
                  marginBottom: 8
                }}
              >
                <Text style={{ fontFamily: fonts.medium, color: '#272829', fontSize: 13 }}>
                  {explainPair(row, groupMeans)}
                </Text>
                <Text style={{ fontFamily: fonts.regular, color: '#555', marginTop: 4, fontSize: 12 }}>
                  {a1}: {fmt(m1)} | {a2}: {fmt(m2)}
                </Text>
                <View style={{ flexDirection: 'row', marginTop: 6 }}>
                  <View style={{ backgroundColor: '#55AD9B', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4, marginRight: 6 }}>
                    <Text style={{ color: '#fff', fontFamily: fonts.semiBold, fontSize: 12 }}>Δ: {diffVal}</Text>
                  </View>
                  <View style={{ backgroundColor: '#f7b801', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 }}>
                    <Text style={{ color: '#fff', fontFamily: fonts.semiBold, fontSize: 12 }}>
                      p: {row.p_adj ?? row['p-adj']}
                    </Text>
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      ) : (
        <Text style={{ fontFamily: fonts.regular, color: '#555' }}>
          No clear differences between activities with ≥2 logs.
        </Text>
      )}

      {nonSignificantPairs.length > 0 && significantPairs.length > 0 && (
        <View style={{ marginTop: 2 }}>
          <Text style={{ fontFamily: fonts.medium, color: '#777', marginBottom: 4, fontSize: 12 }}>
            Other similar pairs:
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            {nonSignificantPairs.slice(0, 8).map((row, idx) => {
              const a1 = ACTIVITY_LABELS[row.group1] || formatText(row.group1);
              const a2 = ACTIVITY_LABELS[row.group2] || formatText(row.group2);
              return (
                <View
                  key={idx}
                  style={{
                    backgroundColor: '#fff',
                    borderWidth: 1,
                    borderColor: '#EEE',
                    borderRadius: 8,
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                    marginRight: 6,
                    marginBottom: 6
                  }}
                >
                  <Text style={{ fontFamily: fonts.regular, color: '#555', fontSize: 12 }}>
                    {a1} & {a2}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      )}

      <Text style={{ fontFamily: fonts.regular, color: '#777', marginTop: 8, fontSize: 12 }}>
        Comparisons exclude activities with fewer than 2 logs for reliability.
      </Text>
    </View>
  );
}

export default function DailyAnova() {
  const navigation = useNavigation();
  const [anovaResults, setAnovaResults] = useState({});
  const [sleep, setSleep] = useState(null);
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnova = async () => {
      setLoading(true);
      try {
        const data = await runAnova(date);
        setAnovaResults(data.anovaResults || {});
        setSleep(data.sleep || null);
      } catch (e) {
        console.error('ANOVA fetch error:', e);
        setAnovaResults({});
        setSleep(null);
      }
      setLoading(false);
    };
    fetchAnova();
  }, [date]);

  const handlePrev = () => setDate(addDays(date, -1));
  const handleNext = () => setDate(addDays(date, 1));
  const getDayLabel = () => {
    const today = new Date().toISOString().split('T')[0];
    if (date === today) return 'Today';
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    if (date === yesterdayStr) return 'Yesterday';
    return new Date(date).toLocaleDateString('en-US', { weekday: 'long' });
  };

  // Build top lists from includedSet like web; show avg values
  const buildTopLists = (data) => {
    const groupMeans = data?.groupMeans || {};
    const groupCounts = data?.groupCounts || {};
    const includedSet = buildIncludedSet(data, groupCounts);

    const entries = Object.entries(groupMeans).filter(
      ([g, mean]) => includedSet.has(g) && typeof mean === 'number' && !isNaN(mean)
    );
    const positives = entries
      .filter(([, m]) => m > 0)
      .sort((a, b) => b[1] - a[1])
      .map(([activity, moodScore]) => ({ activity, moodScore }));
    const negatives = entries
      .filter(([, m]) => m < 0)
      .sort((a, b) => a[1] - b[1])
      .map(([activity, moodScore]) => ({ activity, moodScore }));

    const topPositive = Array.isArray(data?.topPositive) && data.topPositive.length > 0
      ? data.topPositive.filter(r => includedSet.has(r.activity))
      : positives;

    const topNegative = Array.isArray(data?.topNegative) && data.topNegative.length > 0
      ? data.topNegative.filter(r => includedSet.has(r.activity))
      : negatives;

    return { topPositive, topNegative, groupMeans, groupCounts, includedSet };
  };

  const renderFAndP = (F_value, p_value) => (
    <View style={{ marginBottom: 8, padding: 10, borderRadius: 12, backgroundColor: '#F7FBF9', borderColor: '#95D2B3', borderWidth: 1 }}>
      <Text style={{ fontFamily: fonts.semiBold, color: '#55AD9B' }}>
        Daily Activity Comparison
      </Text>
      <Text style={{ marginTop: 4, fontFamily: fonts.medium, color: '#272829' }}>
        F-score: {F_value ?? '—'}   p-value: {p_value ?? '—'}
      </Text>
      <Text style={{ marginTop: 2, fontFamily: fonts.regular, color: '#555' }}>
        {p_value != null && F_value != null
          ? (p_value < 0.05 ? 'Some activities affected your mood differently today.' : 'Activities had similar effects on your mood today.')
          : 'Not enough data today to compare activities.'}
      </Text>
    </View>
  );

  const renderIncludedIgnored = (includedSet = new Set(), groupCounts = {}, ignored = []) => {
    const included = Array.from(includedSet);
    const notEnoughGroups = Array.isArray(ignored) && ignored.length > 0
      ? ignored
      : Object.keys(groupCounts).filter(g => !includedSet.has(g));
    if (included.length === 0 && notEnoughGroups.length === 0) return null;

    return (
      <View style={{ marginBottom: 8 }}>
        {included.length > 0 && (
          <Text style={{ fontFamily: fonts.medium, color: '#555' }}>
            Activities considered: {included.map(g => ACTIVITY_LABELS[g] || formatText(g)).join(', ')}
          </Text>
        )}
        {notEnoughGroups.length > 0 && (
          <Text style={{ fontFamily: fonts.medium, color: '#777', marginTop: 2 }}>
            Not enough logs: {notEnoughGroups.map(g => ACTIVITY_LABELS[g] || formatText(g)).join(', ')}
          </Text>
        )}
      </View>
    );
  };

  // Collapsible category content
  function renderCategoryResults(categoryKey, data) {
    if (!data) {
      return (
        <View style={{ alignItems: 'center', justifyContent: 'center', minHeight: 60 }}>
          <Text style={{ color: '#888', fontSize: 14, fontFamily: fonts.medium, textAlign: 'center' }}>
            No data for this category
          </Text>
        </View>
      );
    }
    if (data.insufficient) {
      return (
        <View style={{ alignItems: 'center', justifyContent: 'center', minHeight: 80 }}>
          <Text style={{ color: '#888', fontSize: 16, fontFamily: fonts.medium, textAlign: 'center' }}>
            {data.message || 'Logs are still insufficient to run a proper analysis. Come back later!'}
          </Text>
        </View>
      );
    }

    const { topPositive, topNegative, groupMeans, groupCounts, includedSet } = buildTopLists(data);

    return (
      <View>
        <Accordion
          title="Daily Activity Comparison (ANOVA)"
          subtitle="Tap to show/hide"
          initiallyOpen={false}
        >
          {renderFAndP(data.F_value, data.p_value)}
          {renderIncludedIgnored(includedSet, groupCounts, data.ignoredGroups)}
        </Accordion>

        <Accordion
          title="Activity Differences (Tukey HSD)"
          subtitle="Tap to show/hide"
          initiallyOpen={false}
        >
          {renderActivityComparisons(data.tukeyHSD, groupMeans, groupCounts, includedSet)}
        </Accordion>

        <Text style={{ fontFamily: fonts.regular, color: '#777', marginBottom: 8 }}>
          Lists show average mood change per activity (only if ≥2 logs).
        </Text>

        {topPositive.length > 0 && (
          <View style={{ marginBottom: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
              <MaterialIcons name="trending-up" size={20} color={POSITIVE_COLOR} />
              <Text style={{
                fontFamily: fonts.semiBold,
                fontSize: 14,
                color: POSITIVE_COLOR,
                marginLeft: 6,
              }}>
                Habits that boosted your mood
              </Text>
            </View>
            {topPositive.map((item) => {
              const msId = data?.groupLastIds?.[item.activity];
              const navParams = msId
                ? { moodScoreId: msId }
                : { date, category: categoryKey, activity: item.activity };
              return (
                <View
                  key={`${item.activity}-pos`}
                  style={{
                    flexDirection: 'column',
                    backgroundColor: '#F1F8E8',
                    borderWidth: 2,
                    borderColor: POSITIVE_COLOR,
                    borderRadius: 16,
                    paddingVertical: 12,
                    paddingHorizontal: 14,
                    marginBottom: 8,
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={{ marginRight: 10 }}>{getMoodIcon(item.moodScore)}</View>
                    <View style={{ flex: 1 }}>
                      <Text style={{
                        fontSize: 14,
                        color: '#272829',
                        fontFamily: fonts.medium,
                      }}>
                        {getMoodMessage(item.activity, item.moodScore)}
                      </Text>
                      <Text style={{ color: '#555', fontFamily: fonts.medium, fontSize: 12, marginTop: 4 }}>
                        avg {typeof item.moodScore === 'number' ? Number(item.moodScore).toFixed(2) : item.moodScore}
                      </Text>
                    </View>
                  </View>
                  <View style={{ alignItems: 'flex-end', marginTop: 10 }}>
                    <TouchableOpacity
                      onPress={() => navigation.navigate('Recommendation', navParams)}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        backgroundColor: POSITIVE_COLOR,
                        paddingVertical: 8,
                        paddingHorizontal: 12,
                        borderRadius: 999,
                      }}
                    >
                      <MaterialIcons name="list" size={16} color="#fff" style={{ marginRight: 6 }} />
                      <Text style={{ color: '#fff', fontFamily: fonts.semiBold, fontSize: 12 }}>
                        View Recommendation
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {topNegative.length > 0 && (
          <View>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
              <MaterialIcons name="trending-down" size={20} color={NEGATIVE_COLOR} />
              <Text style={{
                fontFamily: fonts.semiBold,
                fontSize: 14,
                color: NEGATIVE_COLOR,
                marginLeft: 6,
              }}>
                Habits that lowered your mood
              </Text>
            </View>
            {topNegative.map((item) => {
              const msId = data?.groupLastIds?.[item.activity];
              const navParams = msId
                ? { moodScoreId: msId }
                : { date, category: categoryKey, activity: item.activity };
              return (
                <View
                  key={`${item.activity}-neg`}
                  style={{
                    flexDirection: 'column',
                    backgroundColor: '#FFF7E6',
                    borderWidth: 2,
                    borderColor: NEGATIVE_COLOR,
                    borderRadius: 16,
                    paddingVertical: 12,
                    paddingHorizontal: 14,
                    marginBottom: 8,
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={{ marginRight: 10 }}>{getMoodIcon(item.moodScore)}</View>
                    <View style={{ flex: 1 }}>
                      <Text style={{
                        fontSize: 14,
                        color: '#272829',
                        fontFamily: fonts.medium,
                      }}>
                        {getMoodMessage(item.activity, item.moodScore)}
                      </Text>
                      <Text style={{ color: '#555', fontFamily: fonts.medium, fontSize: 12, marginTop: 4 }}>
                        avg {typeof item.moodScore === 'number' ? Number(item.moodScore).toFixed(2) : item.moodScore}
                      </Text>
                    </View>
                  </View>
                  <View style={{ alignItems: 'flex-end', marginTop: 10 }}>
                    <TouchableOpacity
                      onPress={() => navigation.navigate('Recommendation', navParams)}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        backgroundColor: NEGATIVE_COLOR,
                        paddingVertical: 8,
                        paddingHorizontal: 12,
                        borderRadius: 999,
                      }}
                    >
                      <MaterialIcons name="list" size={16} color="#fff" style={{ marginRight: 6 }} />
                      <Text style={{ color: '#fff', fontFamily: fonts.semiBold, fontSize: 12 }}>
                        View Recommendation
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </View>
    );
  }

  const gridData = [
    {
      key: 'sleep',
      title: 'Sleep',
      icon: CATEGORY_ICONS.sleep,
      header: 'How your sleep affected your mood',
      content: (
        <View style={{ alignItems: 'center', width: '100%' }}>
          {sleep?.hours != null ? (
            <View style={{ alignItems: 'center', width: '100%' }}>
              <View
                style={{
                  alignItems: 'center',
                  backgroundColor: '#FFF7E6',
                  borderWidth: 2,
                  borderColor: '#f7b801',
                  borderRadius: 16,
                  paddingVertical: 18,
                  paddingHorizontal: 12,
                  width: '100%',
                  marginBottom: 4,
                }}
              >
                {sleep?.quality && (
                  <View style={{ backgroundColor: sleepQualityColors[sleep.quality] || '#f7b801', borderRadius: 999, paddingHorizontal: 18, paddingVertical: 4, marginBottom: 10 }}>
                    <Text style={{ color: '#fff', fontFamily: fonts.semiBold, fontSize: 15 }}>
                      {formatText(sleep.quality)}
                    </Text>
                  </View>
                )}
                <View style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  width: '100%',
                  justifyContent: 'flex-start',
                }}>
                  <View style={{ marginRight: 8 }}>
                    {typeof sleep?.moodScore === 'number'
                      ? getMoodIcon(sleep.moodScore)
                      : <Entypo name="minus" size={20} color="#f7b801" />}
                  </View>
                  <Text style={{
                    fontSize: 14,
                    color: '#272829',
                    flex: 1,
                    textAlign: 'left',
                    marginHorizontal: 0,
                    fontFamily: fonts.medium,
                  }}>
                    {getSleepMessage(sleep.hours, sleep.moodScore)}
                  </Text>
                </View>

                {sleep?._id ? (
                  <View style={{ marginTop: 12 }}>
                    <TouchableOpacity
                      onPress={() => navigation.navigate('Recommendation', { moodScoreId: sleep._id })}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        backgroundColor: colors.primary,
                        paddingVertical: 10,
                        paddingHorizontal: 14,
                        borderRadius: 999,
                      }}
                    >
                      <MaterialIcons name="list" size={18} color="#fff" style={{ marginRight: 8 }} />
                      <Text style={{ color: '#fff', fontFamily: fonts.semiBold, fontSize: 13 }}>
                        View Recommendation
                      </Text>
                    </TouchableOpacity>
                  </View>
                ) : null}
              </View>
            </View>
          ) : (
            <View style={{ alignItems: 'center', justifyContent: 'center', minHeight: 80, width: '100%' }}>
              <Text style={{ color: '#888', fontSize: 14, fontFamily: fonts.medium, textAlign: 'center' }}>
                No sleep data recorded
              </Text>
            </View>
          )}
        </View>
      ),
    },
    {
      key: 'activity',
      title: 'Overall Activities',
      icon: CATEGORY_ICONS.activity,
      header: 'How your activities affected your mood',
      content: renderCategoryResults('activity', anovaResults.activity)
    },
    {
      key: 'social',
      title: 'Social',
      icon: CATEGORY_ICONS.social,
      header: 'How your social life affected your mood',
      content: renderCategoryResults('social', anovaResults.social)
    },
    {
      key: 'health',
      title: 'Health',
      icon: CATEGORY_ICONS.health,
      header: 'How your health habits affected your mood',
      content: renderCategoryResults('health', anovaResults.health)
    }
  ];

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.primary }}>
        <ScrollView style={{ flex: 1 }}>
          <View style={{ paddingHorizontal: 10, marginTop: 50, marginBottom: 18 }}>
            <SkeletonBox width="100%" height={60} style={{ borderRadius: 18, marginBottom: 24 }} />
            {[...Array(4)].map((_, i) => (
              <SkeletonBox key={i} width="100%" height={140} style={{ borderRadius: 18 }} />
            ))}
            <SkeletonBox width="100%" height={60} style={{ borderRadius: 18, marginTop: 10 }} />
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.primary }}>
      <View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          paddingTop: 30,
          height: 56 + 18,
          backgroundColor: colors.primary,
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 12,
          zIndex: 101,
          elevation: 8,
          shadowColor: '#000',
          shadowOpacity: 0.1,
          shadowRadius: 4,
          shadowOffset: { width: 0, height: 2 },
        }}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
        >
          <Ionicons name="arrow-back" size={26} color="#222" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={{ flex: 1, marginTop: 74 }}
        contentContainerStyle={{ paddingTop: 0 }}
        keyboardShouldPersistTaps="handled"
      >
        <View
          style={{
            backgroundColor: '#fff',
            marginTop: 0,
            marginBottom: 24,
            paddingVertical: 18,
            paddingHorizontal: 12,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            elevation: 2,
            shadowColor: '#000',
            shadowOpacity: 0.06,
            shadowOffset: { width: 0, height: 2 },
            shadowRadius: 6,
          }}
        >
          <TouchableOpacity
            onPress={handlePrev}
            style={{
              padding: 10,
              marginRight: 18,
            }}
          >
            <Ionicons name="chevron-back" size={28} color={colors.primary} />
          </TouchableOpacity>
          <View style={{ alignItems: 'center', flex: 1 }}>
            <Text style={{ fontFamily: fonts.bold, fontSize: 22, color: colors.primary, textAlign: 'center' }}>
              {getDayLabel()}
            </Text>
            <Text style={{ fontFamily: fonts.medium, fontSize: 15, color: '#888', textAlign: 'center', marginTop: 2 }}>
              {getDateString(date)}
            </Text>
          </View>
          <TouchableOpacity
            onPress={handleNext}
            disabled={date >= new Date().toISOString().split('T')[0]}
            style={{ padding: 10, marginLeft: 18, opacity: date >= new Date().toISOString().split('T')[0] ? 0.5 : 1 }}
          >
            <Ionicons name="chevron-forward" size={28} color={colors.primary} />
          </TouchableOpacity>
        </View>

        <View style={{ paddingHorizontal: 10, marginBottom: 18 }}>
          {gridData.map((cat) => (
            <View
              key={cat.key}
              style={{
                borderRadius: 18,
                shadowColor: '#000',
                shadowOpacity: 0.08,
                shadowRadius: 8,
                shadowOffset: { width: 0, height: 2 },
                elevation: 3,
                borderWidth: 2,
                borderColor: '#D8EFD3',
                backgroundColor: '#fff',
                marginBottom: 18,
                overflow: 'hidden',
              }}
            >
              <View style={{
                flexDirection: 'row',
                alignItems: 'flex-start',
                paddingVertical: 18,
                paddingHorizontal: 16,
                backgroundColor: '#95D2B3',
                borderTopLeftRadius: 18,
                borderTopRightRadius: 18,
              }}>
                <View style={{ marginTop: 2 }}>{cat.icon}</View>
                <View style={{ marginLeft: 10, flex: 1 }}>
                  <Text style={{
                    fontFamily: fonts.semiBold,
                    fontSize: 20,
                    color: '#fff',
                  }}>
                    {cat.title}
                  </Text>
                  <Text style={{
                    color: '#fff',
                    opacity: 0.9,
                    fontFamily: fonts.medium,
                    fontSize: 14,
                    marginTop: 2,
                    flexWrap: 'wrap',
                  }}>
                    {cat.header}
                  </Text>
                </View>
              </View>
              <View style={{ padding: 16 }}>
                {cat.content}
              </View>
            </View>
          ))}
          <View style={{ alignItems: 'center', backgroundColor: '#D8EFD3', borderRadius: 18, padding: 18, marginTop: 10, marginBottom: 30 }}>
            <Text style={{ color: '#272829', fontSize: 16, fontFamily: fonts.medium, textAlign: 'center' }}>
              🌟 Each log teaches what lifts you. Keep going! 🌟
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}