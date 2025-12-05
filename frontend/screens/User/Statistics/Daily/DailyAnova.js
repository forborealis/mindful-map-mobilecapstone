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

function formatText(text) {
  if (!text) return '';
  return text.replace(/[-_]/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
}
function getMoodIcon(score) {
  if (score > 0) return <MaterialIcons name="trending-up" size={20} color={POSITIVE_COLOR} />;
  if (score < 0) return <MaterialIcons name="trending-down" size={20} color={NEGATIVE_COLOR} />;
  return <Entypo name="minus" size={20} color="#f7b801" />;
}
function getSleepMessage(hours, moodScore) {
  const absScore = Math.abs(moodScore);
  if (moodScore > 0) return `Sleeping for ${hours} hours improved your mood by ${absScore}%.`;
  if (moodScore < 0) return `${hours} hours of sleep lowered your mood by ${absScore}%.`;
  return `Your sleep had a neutral effect on your mood today.`;
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

  // Build top lists from groupMeans/groupCounts (fallback to arrays if already present)
  const buildTopLists = (data) => {
    const groupMeans = data?.groupMeans || {};
    const groupCounts = data?.groupCounts || {};
    const entries = Object.entries(groupMeans).filter(([g, mean]) =>
      typeof mean === 'number' && !isNaN(mean) && (groupCounts[g] ?? 0) >= 2
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
      ? data.topPositive
      : positives;

    const topNegative = Array.isArray(data?.topNegative) && data.topNegative.length > 0
      ? data.topNegative
      : negatives;

    return { topPositive, topNegative, groupMeans, groupCounts };
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

  const renderIncludedIgnored = (included = [], ignored = []) => {
    if ((!included || included.length === 0) && (!ignored || ignored.length === 0)) return null;
    return (
      <View style={{ marginBottom: 8 }}>
        {included?.length > 0 && (
          <Text style={{ fontFamily: fonts.medium, color: '#555' }}>
            Activities considered: {included.map(g => ACTIVITY_LABELS[g] || formatText(g)).join(', ')}
          </Text>
        )}
        {ignored?.length > 0 && (
          <Text style={{ fontFamily: fonts.medium, color: '#777', marginTop: 2 }}>
            Not enough logs: {ignored.map(g => ACTIVITY_LABELS[g] || formatText(g)).join(', ')}
          </Text>
        )}
      </View>
    );
  };

  const renderTukeyPairs = (tukeyHSD = [], groupMeans = {}, groupCounts = {}) => {
    if (!Array.isArray(tukeyHSD) || tukeyHSD.length === 0) return null;
    const valid = Object.keys(groupCounts || {}).filter(g => (groupCounts[g] || 0) >= 2);
    const pairs = tukeyHSD.filter(r => valid.includes(r.group1) && valid.includes(r.group2));
    const significant = pairs.filter(r => r.reject);

    if (pairs.length === 0) return null;

    return (
      <View style={{ marginBottom: 8, padding: 10, borderRadius: 12, backgroundColor: '#F7FBF9', borderColor: '#D8EFD3', borderWidth: 1 }}>
        <Text style={{ fontFamily: fonts.semiBold, color: '#55AD9B', marginBottom: 6 }}>Activity Differences</Text>
        {significant.length > 0 ? significant.slice(0, 5).map((row, idx) => {
          const a1 = ACTIVITY_LABELS[row.group1] || formatText(row.group1);
          const a2 = ACTIVITY_LABELS[row.group2] || formatText(row.group2);
          const m1 = groupMeans[row.group1];
          const m2 = groupMeans[row.group2];
          const sentence = (() => {
            if (typeof m1 !== 'number' || typeof m2 !== 'number') return `${a1} vs ${a2} (limited data).`;
            const equal = Number(m1.toFixed(2)) === Number(m2.toFixed(2));
            if (!row.reject || equal) return `Similar effect: ${a1} & ${a2}.`;
            if (m1 > m2) return `${a1} improved mood more than ${a2}.`;
            return `${a2} improved mood more than ${a1}.`;
          })();
          return (
            <View key={idx} style={{ paddingVertical: 6 }}>
              <Text style={{ fontFamily: fonts.medium, color: '#272829' }}>{sentence}</Text>
              <Text style={{ fontFamily: fonts.regular, color: '#777', marginTop: 2 }}>
                p: {row.p_adj ?? row['p-adj'] ?? 'n/a'}
              </Text>
            </View>
          );
        }) : (
          <Text style={{ fontFamily: fonts.regular, color: '#555' }}>
            No clear differences between activities with ≥2 logs.
          </Text>
        )}
        <Text style={{ fontFamily: fonts.regular, color: '#777', marginTop: 6 }}>
          Comparisons exclude activities with fewer than 2 logs.
        </Text>
      </View>
    );
  };

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

    const { topPositive, topNegative, groupMeans, groupCounts } = buildTopLists(data);

    return (
      <View>
        {renderFAndP(data.F_value, data.p_value)}
        {renderIncludedIgnored(data.includedGroups, data.ignoredGroups)}
        {renderTukeyPairs(data.tukeyHSD, groupMeans, groupCounts)}
        <Text style={{ fontFamily: fonts.regular, color: '#777', marginBottom: 8 }}>
          Lists show average mood change per activity (only if ≥2 logs).
        </Text>

        {topPositive.length > 0 && (
          <View style={{ marginBottom: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
              <MaterialIcons name="trending-up" size={20} color={POSITIVE_COLOR} />
<<<<<<< HEAD
              <Text style={{ fontFamily: fonts.semiBold, fontSize: 16, color: POSITIVE_COLOR, marginLeft: 6 }}>
=======
              <Text style={{
                fontFamily: fonts.semiBold,
                fontSize: 14,
                color: POSITIVE_COLOR,
                marginLeft: 6,
              }}>
>>>>>>> 9ca5e2fc2c33ad0797d04afc8c438e1a7f1a06d3
                Habits that boosted your mood
              </Text>
            </View>
            {topPositive.map((item, idx) => (
              <View
                key={`${item.activity}-pos`}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: '#F1F8E8',
                  borderWidth: 2,
                  borderColor: POSITIVE_COLOR,
                  borderRadius: 16,
                  paddingVertical: 12,
                  paddingHorizontal: 14,
                  marginBottom: 8,
                  minHeight: 60,
                }}
              >
                <View style={{ marginRight: 10 }}>{getMoodIcon(item.moodScore)}</View>
                <View style={{ flex: 1 }}>
<<<<<<< HEAD
                  <Text style={{ fontSize: 15, color: '#272829', fontFamily: fonts.medium }}>
                    {(ACTIVITY_LABELS[item.activity] || formatText(item.activity))} improved your mood.
=======
                  <Text style={{
                    fontSize: 14,
                    color: '#272829',
                    fontFamily: fonts.medium,
                  }}>
                    {getMoodMessage(item.activity, item.moodScore, idx)}
>>>>>>> 9ca5e2fc2c33ad0797d04afc8c438e1a7f1a06d3
                  </Text>
                </View>
                <View style={{ backgroundColor: POSITIVE_COLOR, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 6, marginLeft: 8 }}>
                  <Text style={{ color: '#fff', fontFamily: fonts.bold, fontSize: 15 }}>
                    {`${Math.abs(Number(item.moodScore.toFixed ? item.moodScore.toFixed(2) : item.moodScore))}%`}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {topNegative.length > 0 && (
          <View>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
              <MaterialIcons name="trending-down" size={20} color={NEGATIVE_COLOR} />
<<<<<<< HEAD
              <Text style={{ fontFamily: fonts.semiBold, fontSize: 16, color: NEGATIVE_COLOR, marginLeft: 6 }}>
=======
              <Text style={{
                fontFamily: fonts.semiBold,
                fontSize: 14,
                color: NEGATIVE_COLOR,
                marginLeft: 6,
              }}>
>>>>>>> 9ca5e2fc2c33ad0797d04afc8c438e1a7f1a06d3
                Habits that lowered your mood
              </Text>
            </View>
            {topNegative.map((item, idx) => (
              <View
                key={`${item.activity}-neg`}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: '#FFF7E6',
                  borderWidth: 2,
                  borderColor: NEGATIVE_COLOR,
                  borderRadius: 16,
                  paddingVertical: 12,
                  paddingHorizontal: 14,
                  marginBottom: 8,
                  minHeight: 60,
                }}
              >
                <View style={{ marginRight: 10 }}>{getMoodIcon(item.moodScore)}</View>
                <View style={{ flex: 1 }}>
<<<<<<< HEAD
                  <Text style={{ fontSize: 15, color: '#272829', fontFamily: fonts.medium }}>
                    {(ACTIVITY_LABELS[item.activity] || formatText(item.activity))} lowered your mood.
=======
                  <Text style={{
                    fontSize: 14,
                    color: '#272829',
                    fontFamily: fonts.medium,
                  }}>
                    {getMoodMessage(item.activity, item.moodScore, idx)}
>>>>>>> 9ca5e2fc2c33ad0797d04afc8c438e1a7f1a06d3
                  </Text>
                </View>
                <View style={{ backgroundColor: NEGATIVE_COLOR, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 6, marginLeft: 8 }}>
                  <Text style={{ color: '#fff', fontFamily: fonts.bold, fontSize: 15 }}>
                    {`${Math.abs(Number(item.moodScore.toFixed ? item.moodScore.toFixed(2) : item.moodScore))}%`}
                  </Text>
                </View>
              </View>
            ))}
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
          {sleep?.quality && sleep?.hours != null ? (
            <View style={{ alignItems: 'center', width: '100%' }}>
              {sleep?.moodScore != null && (
                <View
                  style={{
                    alignItems: 'center',
                    backgroundColor: '#FFF7E6',
                    borderWidth: 2,
                    borderColor: sleep.moodScore > 0 ? POSITIVE_COLOR : sleep.moodScore < 0 ? NEGATIVE_COLOR : '#f7b801',
                    borderRadius: 16,
                    paddingVertical: 18,
                    paddingHorizontal: 12,
                    width: '100%',
                    marginBottom: 4,
                  }}
                >
                  <View style={{ backgroundColor: sleepQualityColors[sleep.quality], borderRadius: 999, paddingHorizontal: 18, paddingVertical: 4, marginBottom: 10 }}>
                    <Text style={{ color: '#fff', fontFamily: fonts.semiBold, fontSize: 15 }}>
                      {formatText(sleep.quality)}
                    </Text>
                  </View>
<<<<<<< HEAD
                  <View style={{ flexDirection: 'row', alignItems: 'center', width: '100%', justifyContent: 'center' }}>
                    <View style={{ marginRight: 8 }}>{getMoodIcon(sleep.moodScore)}</View>
                    <Text style={{ fontSize: 15, color: '#272829', flex: 1, textAlign: 'center', marginHorizontal: 8, fontFamily: fonts.medium }}>
                      {getSleepMessage(sleep.hours, sleep.moodScore)}
                    </Text>
                    <View style={{ backgroundColor: sleep.moodScore > 0 ? POSITIVE_COLOR : sleep.moodScore < 0 ? NEGATIVE_COLOR : '#f7b801', borderRadius: 999, paddingHorizontal: 14, paddingVertical: 6, marginLeft: 8 }}>
                      <Text style={{ color: '#fff', fontFamily: fonts.bold, fontSize: 15 }}>
                        {`${Math.abs(sleep.moodScore)}%`}
=======
                  <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    width: '100%',
                    justifyContent: 'flex-start',
                  }}>
                    <View style={{ marginRight: 8 }}>{getMoodIcon(sleepMoodScore)}</View>
                    <Text style={{
                      fontSize: 14,
                      color: '#272829',
                      flex: 1,
                      textAlign: 'left',
                      marginHorizontal: 0,
                      fontFamily: fonts.medium,
                    }}>
                      {getSleepMessage(sleepHours, sleepMoodScore)}
                    </Text>
                    <View style={{
                      backgroundColor: sleepMoodScore > 0
                        ? POSITIVE_COLOR
                        : sleepMoodScore < 0
                          ? NEGATIVE_COLOR
                          : '#f7b801',
                      borderRadius: 999,
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      marginLeft: 8,
                    }}>
                      <Text style={{
                        color: '#fff',
                        fontFamily: fonts.bold,
                        fontSize: 13,
                      }}>
                        {`${Math.abs(sleepMoodScore)}%`}
>>>>>>> 9ca5e2fc2c33ad0797d04afc8c438e1a7f1a06d3
                      </Text>
                    </View>
                  </View>
                </View>
              )}
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
<<<<<<< HEAD
      <ScrollView style={{ flex: 1 }}>
        {/* Back */}
        <View style={{ position: 'absolute', top: 38, left: 18, zIndex: 100, elevation: 10 }} pointerEvents="box-none">
          <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}>
            <Ionicons name="arrow-back" size={28} color="#222" />
          </TouchableOpacity>
        </View>

        {/* Date Nav */}
        <View style={{
          backgroundColor: '#fff',
          marginTop: 74,
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
        }}>
          <TouchableOpacity onPress={handlePrev} style={{ padding: 10, marginRight: 18 }}>
=======
      {/* Fixed Header with Back Button */}
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
        {/* Date Navigation */}
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
>>>>>>> 9ca5e2fc2c33ad0797d04afc8c438e1a7f1a06d3
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

        {/* Content */}
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
<<<<<<< HEAD
                <View>{cat.icon}</View>
                <View style={{ marginLeft: 10 }}>
                  <Text style={{ fontFamily: fonts.semiBold, fontSize: 20, color: '#fff' }}>
                    {cat.title}
                  </Text>
                  <Text style={{ color: '#fff', opacity: 0.9, fontFamily: fonts.medium, fontSize: 14, marginTop: 2 }}>
=======
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
>>>>>>> 9ca5e2fc2c33ad0797d04afc8c438e1a7f1a06d3
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