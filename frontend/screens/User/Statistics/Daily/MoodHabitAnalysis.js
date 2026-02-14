import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons, MaterialCommunityIcons, Ionicons, Entypo } from '@expo/vector-icons';
import { colors } from '../../../../utils/colors/colors';
import { fonts } from '../../../../utils/fonts/fonts';
import { runConcordance } from '../../../../services/concordanceService';

// Simple skeleton
const SkeletonBox = ({ width, height, style }) => (
  <View
    style={[
      {
        backgroundColor: '#e5e7eb',
        borderRadius: 14,
        width,
        height,
        marginBottom: 16,
        opacity: 0.5,
      },
      style,
    ]}
  />
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
  'drink-alcohol': 'Drinking alcohol',
};

const sleepQualityColors = { Poor: '#ff6b6b', Sufficient: '#f7b801', Good: '#55AD9B' };
const POSITIVE_COLOR = '#55AD9B';
const NEGATIVE_COLOR = '#FF9800';

// Lightweight accordion for mobile
function Accordion({ title, subtitle, children, initiallyOpen = false }) {
  const [open, setOpen] = useState(initiallyOpen);
  return (
    <View
      style={{
        marginBottom: 8,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#D8EFD3',
        backgroundColor: '#fff',
      }}
    >
      <TouchableOpacity
        onPress={() => setOpen(!open)}
        style={{
          paddingVertical: 12,
          paddingHorizontal: 10,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <View style={{ flex: 1, paddingRight: 8 }}>
          <Text
            style={{
              fontFamily: fonts.semiBold,
              color: '#55AD9B',
              fontSize: 14,
            }}
          >
            {title}
          </Text>
          {subtitle ? (
            <Text
              style={{
                fontFamily: fonts.regular,
                color: '#777',
                fontSize: 12,
                marginTop: 2,
              }}
            >
              {subtitle}
            </Text>
          ) : null}
        </View>
        <MaterialIcons
          name={open ? 'expand-less' : 'expand-more'}
          size={22}
          color="#55AD9B"
        />
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

  if (moodScore > 0)
    return `Sleeping for ${hours} hours had a ${intensity} positive effect on your mood.`;
  if (moodScore < 0)
    return `${hours} hours of sleep lowered your mood (${intensity} effect).`;
  return 'Your sleep had a neutral effect today.';
}

function getDateString(date) {
  const d = new Date(date);
  return d.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
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

export default function DailyMoodHabitAnalysis() {
  const navigation = useNavigation();
  const [results, setResults] = useState({});
  const [thresholds, setThresholds] = useState({ minPairs: 1 });
  const [sleep, setSleep] = useState(null);
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCCC = async () => {
      setLoading(true);
      try {
        const data = await runConcordance(date);
        setResults(data.concordanceResults || {});
        setThresholds(data.thresholds || { minPairs: 1 });
        setSleep(data.sleep || null);
      } catch (e) {
        console.error('CCC fetch error:', e);
        setResults({});
        setSleep(null);
      }
      setLoading(false);
    };
    fetchCCC();
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

  // Tips-only list (no CCC analysis, but user has logs)
  const renderTipsOnly = (data, { title }) => {
    const groupLastIds = data?.groupLastIds || {};
    const availableGroups = Array.isArray(data?.availableGroups)
      ? data.availableGroups
      : Object.keys(groupLastIds || {});
    const groups = availableGroups.filter((g) => !!groupLastIds?.[g]);

    if (groups.length === 0) return null;

    return (
      <View style={{ marginTop: 8 }}>
        <Text
          style={{
            fontFamily: fonts.semiBold,
            color: '#1b5f52',
            fontSize: 13,
            marginBottom: 6,
          }}
        >
          {title}
        </Text>
        {groups.map((g) => (
          <View
            key={g}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: '#ffffff',
              borderRadius: 12,
              borderWidth: 1,
              borderColor: '#D8EFD3',
              paddingVertical: 10,
              paddingHorizontal: 12,
              marginBottom: 6,
            }}
          >
            <Text
              style={{
                fontFamily: fonts.medium,
                color: '#272829',
                fontSize: 13,
                flex: 1,
                marginRight: 10,
              }}
            >
              {ACTIVITY_LABELS[g] || formatText(g)}
            </Text>
            <TouchableOpacity
              onPress={() =>
                navigation.navigate('Recommendation', { moodScoreId: groupLastIds[g] })
              }
              style={{
                paddingVertical: 6,
                paddingHorizontal: 12,
                borderRadius: 999,
                backgroundColor: '#55AD9B',
                flexDirection: 'row',
                alignItems: 'center',
              }}
            >
              <MaterialIcons
                name="list"
                size={16}
                color="#fff"
                style={{ marginRight: 6 }}
              />
              <Text
                style={{
                  color: '#fff',
                  fontFamily: fonts.semiBold,
                  fontSize: 12,
                }}
              >
                View Tips
              </Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>
    );
  };

  // Category content, CCC-based (similar to web)
  const renderCategoryResults = (categoryKey, data) => {
    if (!data) {
      return (
        <View
          style={{
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: 80,
          }}
        >
          <Text
            style={{
              color: '#888',
              fontSize: 14,
              fontFamily: fonts.medium,
              textAlign: 'center',
            }}
          >
            No data for this category
          </Text>
        </View>
      );
    }

    // If CCC says insufficient, still show tips for logged activities
    if (data.insufficient) {
      return (
        <View style={{ width: '100%' }}>
          <View
            style={{
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: 80,
              width: '100%',
            }}
          >
            <Text
              style={{
                color: '#888',
                fontSize: 14,
                fontFamily: fonts.medium,
                textAlign: 'center',
              }}
            >
              {data.message ||
                'Not enough paired logs to analyze yet. You can still view tips for logged activities.'}
            </Text>
          </View>
          {renderTipsOnly(data, {
            title: 'View tips for logged activities',
          })}
        </View>
      );
    }

    const groupMeans = data.groupMeans || {};
    const groupCounts = data.groupCounts || {};
    const minPairs = Number(thresholds.minPairs ?? 1);
    const hasMinPairs = (a) => (groupCounts[a] ?? 0) >= minPairs;

    const rawIncluded = Array.isArray(data.includedGroups) ? data.includedGroups : [];
    const includedSet = new Set(rawIncluded.filter(hasMinPairs));
    if (includedSet.size === 0) {
      Object.keys(groupCounts).forEach((g) => {
        if (hasMinPairs(g)) includedSet.add(g);
      });
    }

    const entries = Object.entries(groupMeans).filter(
      ([g, mean]) =>
        includedSet.has(g) && typeof mean === 'number' && !Number.isNaN(mean)
    );
    const positivesComputed = entries
      .filter(([, m]) => m > 0)
      .sort((a, b) => b[1] - a[1]);
    const negativesComputed = entries
      .filter(([, m]) => m < 0)
      .sort((a, b) => a[1] - b[1]);

    const topPositiveRaw =
      Array.isArray(data.topPositive) && data.topPositive.length > 0
        ? data.topPositive
        : positivesComputed.map(([activity, mean]) => ({ activity, moodScore: mean }));
    const topNegativeRaw =
      Array.isArray(data.topNegative) && data.topNegative.length > 0
        ? data.topNegative
        : negativesComputed.map(([activity, mean]) => ({ activity, moodScore: mean }));

    const topPositive = topPositiveRaw.filter((r) => includedSet.has(r.activity));
    const topNegative = topNegativeRaw.filter((r) => includedSet.has(r.activity));

    const includedGroups = Array.from(includedSet);
    const notEnoughGroups =
      Array.isArray(data.ignoredGroups) && data.ignoredGroups.length > 0
        ? data.ignoredGroups
        : Object.keys(groupCounts).filter((g) => !includedSet.has(g));

    const groupLastIds = data?.groupLastIds || {};
    const availableGroups = Array.isArray(data?.availableGroups)
      ? data.availableGroups
      : Object.keys(groupLastIds || {});
    const tipsOnlyGroups = availableGroups.filter(
      (g) => !!groupLastIds?.[g] && !includedSet.has(g)
    );
    const tipsOnlyData = {
      groupLastIds,
      availableGroups: tipsOnlyGroups,
    };

    return (
      <View>
        {(includedGroups.length > 0 || notEnoughGroups.length > 0) && (
          <View
            style={{
              marginBottom: 8,
              backgroundColor: '#F7FBF9',
              borderRadius: 10,
              borderWidth: 1,
              borderColor: '#E6F4EA',
              paddingVertical: 8,
              paddingHorizontal: 10,
            }}
          >
            {includedGroups.length > 0 && (
              <Text
                style={{
                  fontFamily: fonts.medium,
                  fontSize: 12,
                  color: '#1b5f52',
                  marginBottom: 2,
                }}
              >
                Activities analyzed:{' '}
                {includedGroups
                  .map((g) => ACTIVITY_LABELS[g] || formatText(g))
                  .join(', ')}
              </Text>
            )}
            {notEnoughGroups.length > 0 && (
              <Text
                style={{
                  fontFamily: fonts.medium,
                  fontSize: 12,
                  color: '#92400e',
                }}
              >
                Not enough paired logs:{' '}
                {notEnoughGroups
                  .map((g) => ACTIVITY_LABELS[g] || formatText(g))
                  .join(', ')}
              </Text>
            )}
          </View>
        )}

        <Text
          style={{
            fontFamily: fonts.regular,
            color: '#777',
            fontSize: 12,
            marginBottom: 8,
          }}
        >
          Lists show average mood change per activity. More paired logs = more
          reliable results.
        </Text>

        {topPositive.length > 0 && (
          <View style={{ marginBottom: 12 }}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginBottom: 6,
              }}
            >
              <MaterialIcons
                name="trending-up"
                size={20}
                color={POSITIVE_COLOR}
              />
              <Text
                style={{
                  fontFamily: fonts.semiBold,
                  fontSize: 14,
                  color: POSITIVE_COLOR,
                  marginLeft: 6,
                }}
              >
                Habits that boosted your mood
              </Text>
            </View>
            {topPositive.map((row) => {
              const msId = data?.groupLastIds?.[row.activity];
              const navParams = msId
                ? { moodScoreId: msId }
                : { date, category: categoryKey, activity: row.activity };
              return (
                <View
                  key={`${row.activity}-pos`}
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
                  <View
                    style={{ flexDirection: 'row', alignItems: 'center' }}
                  >
                    <View style={{ marginRight: 10 }}>
                      {getMoodIcon(row.moodScore)}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          fontSize: 14,
                          color: '#272829',
                          fontFamily: fonts.medium,
                        }}
                      >
                        {getMoodMessage(row.activity, row.moodScore)}
                      </Text>
                    </View>
                  </View>
                  {msId && (
                    <View
                      style={{ alignItems: 'flex-end', marginTop: 10 }}
                    >
                      <TouchableOpacity
                        onPress={() =>
                          navigation.navigate('Recommendation', navParams)
                        }
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          backgroundColor: POSITIVE_COLOR,
                          paddingVertical: 8,
                          paddingHorizontal: 12,
                          borderRadius: 999,
                        }}
                      >
                        <MaterialIcons
                          name="list"
                          size={16}
                          color="#fff"
                          style={{ marginRight: 6 }}
                        />
                        <Text
                          style={{
                            color: '#fff',
                            fontFamily: fonts.semiBold,
                            fontSize: 12,
                          }}
                        >
                          View Tips
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}

        {topNegative.length > 0 && (
          <View>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginBottom: 6,
              }}
            >
              <MaterialIcons
                name="trending-down"
                size={20}
                color={NEGATIVE_COLOR}
              />
              <Text
                style={{
                  fontFamily: fonts.semiBold,
                  fontSize: 14,
                  color: NEGATIVE_COLOR,
                  marginLeft: 6,
                }}
              >
                Habits that lowered your mood
              </Text>
            </View>
            {topNegative.map((row) => {
              const msId = data?.groupLastIds?.[row.activity];
              const navParams = msId
                ? { moodScoreId: msId }
                : { date, category: categoryKey, activity: row.activity };
              return (
                <View
                  key={`${row.activity}-neg`}
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
                  <View
                    style={{ flexDirection: 'row', alignItems: 'center' }}
                  >
                    <View style={{ marginRight: 10 }}>
                      {getMoodIcon(row.moodScore)}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          fontSize: 14,
                          color: '#272829',
                          fontFamily: fonts.medium,
                        }}
                      >
                        {getMoodMessage(row.activity, row.moodScore)}
                      </Text>
                    </View>
                  </View>
                  {msId && (
                    <View
                      style={{ alignItems: 'flex-end', marginTop: 10 }}
                    >
                      <TouchableOpacity
                        onPress={() =>
                          navigation.navigate('Recommendation', navParams)
                        }
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          backgroundColor: NEGATIVE_COLOR,
                          paddingVertical: 8,
                          paddingHorizontal: 12,
                          borderRadius: 999,
                        }}
                      >
                          <MaterialIcons
                          name="list"
                          size={16}
                          color="#fff"
                          style={{ marginRight: 6 }}
                        />
                        <Text
                          style={{
                            color: '#fff',
                            fontFamily: fonts.semiBold,
                            fontSize: 12,
                          }}
                        >
                          View Tips
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}

        {renderTipsOnly(tipsOnlyData, {
          title: 'Other logged activities (tips only)',
        })}
      </View>
    );
  };

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
                  <View
                    style={{
                      backgroundColor:
                        sleepQualityColors[sleep.quality] || '#f7b801',
                      borderRadius: 999,
                      paddingHorizontal: 18,
                      paddingVertical: 4,
                      marginBottom: 10,
                    }}
                  >
                    <Text
                      style={{
                        color: '#fff',
                        fontFamily: fonts.semiBold,
                        fontSize: 15,
                      }}
                    >
                      {formatText(sleep.quality)}
                    </Text>
                  </View>
                )}
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    width: '100%',
                    justifyContent: 'flex-start',
                  }}
                >
                  <View style={{ marginRight: 8 }}>
                    {typeof sleep?.moodScore === 'number' ? (
                      getMoodIcon(sleep.moodScore)
                    ) : (
                      <Entypo name="minus" size={20} color="#f7b801" />
                    )}
                  </View>
                  <Text
                    style={{
                      fontSize: 14,
                      color: '#272829',
                      flex: 1,
                      textAlign: 'left',
                      marginHorizontal: 0,
                      fontFamily: fonts.medium,
                    }}
                  >
                    {getSleepMessage(sleep.hours, sleep.moodScore)}
                  </Text>
                </View>

                {sleep?._id ? (
                  <View style={{ marginTop: 12 }}>
                    <TouchableOpacity
                      onPress={() =>
                        navigation.navigate('Recommendation', {
                          moodScoreId: sleep._id,
                        })
                      }
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        backgroundColor: colors.primary,
                        paddingVertical: 10,
                        paddingHorizontal: 14,
                        borderRadius: 999,
                      }}
                    >
                      <MaterialIcons
                        name="list"
                        size={18}
                        color="#fff"
                        style={{ marginRight: 8 }}
                      />
                      <Text
                        style={{
                          color: '#fff',
                          fontFamily: fonts.semiBold,
                          fontSize: 13,
                        }}
                      >
                        View Sleep Tips
                      </Text>
                    </TouchableOpacity>
                  </View>
                ) : null}
              </View>
            </View>
          ) : (
            <View
              style={{
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: 80,
                width: '100%',
              }}
            >
              <Text
                style={{
                  color: '#888',
                  fontSize: 14,
                  fontFamily: fonts.medium,
                  textAlign: 'center',
                }}
              >
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
      content: renderCategoryResults('activity', results.activity),
    },
    {
      key: 'social',
      title: 'Social',
      icon: CATEGORY_ICONS.social,
      header: 'How your social life affected your mood',
      content: renderCategoryResults('social', results.social),
    },
    {
      key: 'health',
      title: 'Health',
      icon: CATEGORY_ICONS.health,
      header: 'How your health habits affected your mood',
      content: renderCategoryResults('health', results.health),
    },
  ];

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.primary }}>
        <ScrollView style={{ flex: 1 }}>
          <View style={{ paddingHorizontal: 10, marginTop: 50, marginBottom: 18 }}>
            <SkeletonBox
              width="100%"
              height={60}
              style={{ borderRadius: 18, marginBottom: 24 }}
            />
            {[...Array(4)].map((_, i) => (
              <SkeletonBox
                key={i}
                width="100%"
                height={140}
                style={{ borderRadius: 18 }}
              />
            ))}
            <SkeletonBox
              width="100%"
              height={60}
              style={{ borderRadius: 18, marginTop: 10 }}
            />
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.primary }}>
      {/* Header */}
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
          onPress={() => navigation.navigate('StatisticsDashboard')}
          hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
        >
          <Ionicons name="arrow-back" size={26} color="#222" />
        </TouchableOpacity>
        <View style={{ width: 26 }} />
      </View>

      <ScrollView
        style={{ flex: 1, marginTop: 74 }}
        contentContainerStyle={{ paddingTop: 0 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Date selector */}
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
            <Text
              style={{
                fontFamily: fonts.bold,
                fontSize: 22,
                color: colors.primary,
                textAlign: 'center',
              }}
            >
              {getDayLabel()}
            </Text>
            <Text
              style={{
                fontFamily: fonts.medium,
                fontSize: 15,
                color: '#888',
                textAlign: 'center',
                marginTop: 2,
              }}
            >
              {getDateString(date)}
            </Text>
          </View>
          <TouchableOpacity
            onPress={handleNext}
            disabled={date >= new Date().toISOString().split('T')[0]}
            style={{
              padding: 10,
              marginLeft: 18,
              opacity:
                date >= new Date().toISOString().split('T')[0] ? 0.5 : 1,
            }}
          >
            <Ionicons
              name="chevron-forward"
              size={28}
              color={colors.primary}
            />
          </TouchableOpacity>
        </View>

        {/* Cards */}
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
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'flex-start',
                  paddingVertical: 18,
                  paddingHorizontal: 16,
                  backgroundColor: '#95D2B3',
                  borderTopLeftRadius: 18,
                  borderTopRightRadius: 18,
                }}
              >
                <View style={{ marginTop: 2 }}>{cat.icon}</View>
                <View style={{ marginLeft: 10, flex: 1 }}>
                  <Text
                    style={{
                      fontFamily: fonts.semiBold,
                      fontSize: 20,
                      color: '#fff',
                    }}
                  >
                    {cat.title}
                  </Text>
                  <Text
                    style={{
                      color: '#fff',
                      opacity: 0.9,
                      fontFamily: fonts.medium,
                      fontSize: 14,
                      marginTop: 2,
                      flexWrap: 'wrap',
                    }}
                  >
                    {cat.header}
                  </Text>
                </View>
              </View>
              <View style={{ padding: 16 }}>{cat.content}</View>
            </View>
          ))}

          <View
            style={{
              alignItems: 'center',
              backgroundColor: '#D8EFD3',
              borderRadius: 18,
              padding: 18,
              marginTop: 10,
              marginBottom: 30,
              flexDirection: 'row',
              justifyContent: 'center',
            }}
          >
            <MaterialCommunityIcons
              name="star-four-points-outline"
              size={20}
              color="#1b5f52"
              style={{ marginRight: 8 }}
            />
            <Text
              style={{
                color: '#272829',
                fontSize: 16,
                fontFamily: fonts.medium,
                textAlign: 'center',
              }}
            >
              Each log teaches what lifts you. Keep going!
            </Text>
            <MaterialCommunityIcons
              name="star-four-points-outline"
              size={20}
              color="#1b5f52"
              style={{ marginLeft: 8 }}
            />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}