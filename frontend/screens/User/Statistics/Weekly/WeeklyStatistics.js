import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image, Dimensions } from 'react-native';
import { colors } from '../../../../utils/colors/colors';
import { fonts } from '../../../../utils/fonts/fonts';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { moodDataService } from '../../../../services/moodDataService';

const emotionImages = {
  angry: require('../../../../assets/images/mood/emotions/angry.png'),
  bored: require('../../../../assets/images/mood/emotions/bored.png'),
  sad: require('../../../../assets/images/mood/emotions/sad.png'),
  disappointed: require('../../../../assets/images/mood/emotions/disappointed.png'),
  tense: require('../../../../assets/images/mood/emotions/tense.png'),
  happy: require('../../../../assets/images/mood/emotions/happy.png'),
  calm: require('../../../../assets/images/mood/emotions/calm.png'),
  excited: require('../../../../assets/images/mood/emotions/excited.png'),
  pleased: require('../../../../assets/images/mood/emotions/pleased.png'),
  relaxed: require('../../../../assets/images/mood/emotions/relaxed.png'),
};

const timeSegmentIcons = {
  earlyMorning: <MaterialIcons name="brightness-3" size={28} color="#90A4AE" />,
  morning: <Ionicons name="sunny" size={28} color="#FFA726" />,
  afternoon: <MaterialIcons name="wb-twilight" size={28} color="#FF7043" />,
  evening: <Ionicons name="moon" size={28} color="#5C6BC0" />,
};

const timeSegments = {
  earlyMorning: { label: 'Early Morning', time: '12:00 AM - 5:59 AM' },
  morning: { label: 'Morning', time: '6:00 AM - 11:59 AM' },
  afternoon: { label: 'Afternoon', time: '12:00 PM - 5:59 PM' },
  evening: { label: 'Evening', time: '6:00 PM - 11:59 PM' },
};

const daysOfWeek = [
  { key: 'Monday', label: 'Monday' },
  { key: 'Tuesday', label: 'Tuesday' },
  { key: 'Wednesday', label: 'Wednesday' },
  { key: 'Thursday', label: 'Thursday' },
  { key: 'Friday', label: 'Friday' },
  { key: 'Saturday', label: 'Saturday' },
  { key: 'Sunday', label: 'Sunday' },
];

function formatWeekRange(start, end) {
  const options = { month: 'short', day: 'numeric' };
  return `${start.toLocaleDateString('en-US', options)} - ${new Date(end - 1).toLocaleDateString('en-US', options)}, ${start.getFullYear()}`;
}

function formatText(text) {
  if (!text) return '';
  return text.replace(/[-_]/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
}

const SkeletonBox = ({ width, height, style }) => (
  <View
    style={[
      {
        backgroundColor: colors.background,
        borderRadius: 12,
        width,
        height,
        marginBottom: 12,
      },
      style,
    ]}
  />
);

export default function WeeklyStatistics({ navigation }) {
  const [statistics, setStatistics] = useState(null);
  const [previousWeekStats, setPreviousWeekStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedWeek, setSelectedWeek] = useState(new Date());
  const [error, setError] = useState(null);

  const fetchWeeklyStatistics = async (date) => {
    try {
      setLoading(true);
      setError(null);

      const stats = await moodDataService.getWeeklyStatistics(date);
      setStatistics(stats);

      // Previous week
      const prevWeek = new Date(stats.weekStart);
      prevWeek.setDate(prevWeek.getDate() - 7);
      try {
        const prevStats = await moodDataService.getWeeklyStatistics(prevWeek);
        setPreviousWeekStats(prevStats);
      } catch {
        setPreviousWeekStats(null);
      }
    } catch (err) {
      setError('Failed to load weekly statistics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWeeklyStatistics(selectedWeek);
  }, [selectedWeek]);

  // Navigation for week
  const navigateWeek = (direction) => {
    const newDate = new Date(statistics?.weekStart || selectedWeek);
    newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
    setSelectedWeek(newDate);
  };

  // Top emotions
  const getTopEmotions = () => {
    if (!statistics?.emotionCounts) return [];
    return Object.entries(statistics.emotionCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([emotion, count]) => ({
        emotion,
        count,
      }));
  };

 // ...inside WeeklyStatistics.js...

const getComparisonInsights = () => {
  if (
    !statistics ||
    !previousWeekStats ||
    statistics.totalEntries === 0 ||
    previousWeekStats.totalEntries === 0
  ) {
    return [];
  }

  const insights = [];

  // Total entries comparison
  const entriesDiff = statistics.totalEntries - previousWeekStats.totalEntries;
  if (entriesDiff > 0) {
    insights.push({
      type: 'positive',
      icon: <MaterialIcons name="trending-up" size={20} color="#4CAF50" />,
      text: `You logged ${entriesDiff} more mood${entriesDiff > 1 ? 's' : ''} this week than last week! Excellent consistency! 🌟`,
      color: '#4CAF50',
    });
  } else if (entriesDiff < 0) {
    insights.push({
      type: 'neutral',
      icon: <MaterialIcons name="trending-down" size={20} color="#FF9800" />,
      text: `You logged ${Math.abs(entriesDiff)} fewer mood${Math.abs(entriesDiff) > 1 ? 's' : ''} than last week. Every bit of tracking counts! 📝`,
      color: '#FF9800',
    });
  }

  // Positive mood comparison
  const currentPositive = statistics.valenceCounts?.positive || 0;
  const previousPositive = previousWeekStats.valenceCounts?.positive || 0;
  const positiveDiff = currentPositive - previousPositive;
  if (positiveDiff > 0) {
    insights.push({
      type: 'positive',
      icon: <MaterialIcons name="sentiment-satisfied" size={20} color="#4CAF50" />,
      text: `${positiveDiff} more positive moment${positiveDiff > 1 ? 's' : ''} this week! You're building positive momentum! 🚀`,
      color: '#4CAF50',
    });
  } else if (positiveDiff < 0) {
    insights.push({
      type: 'understanding',
      icon: <MaterialIcons name="sentiment-dissatisfied" size={20} color="#2196F3" />,
      text: `Fewer positive moods than last week. That's perfectly normal - every week is different! 💙`,
      color: '#2196F3',
    });
  }

  // Weekly activity comparison (per day)
  const currentAvgPerDay = (statistics.totalEntries / 7).toFixed(1);
  const previousAvgPerDay = (previousWeekStats.totalEntries / 7).toFixed(1);
  const avgDiff = currentAvgPerDay - previousAvgPerDay;
  if (Math.abs(avgDiff) > 0.5) {
    if (avgDiff > 0) {
      insights.push({
        type: 'insight',
        icon: <MaterialIcons name="timeline" size={20} color="#9C27B0" />,
        text: `You've been more active this week with ${currentAvgPerDay} entries per day (vs ${previousAvgPerDay} last week)! 📈`,
        color: '#9C27B0',
      });
    } else {
      insights.push({
        type: 'neutral',
        icon: <MaterialIcons name="timeline" size={20} color="#FF9800" />,
        text: `Slightly less active this week with ${currentAvgPerDay} entries per day. Quality over quantity! 🎯`,
        color: '#FF9800',
      });
    }
  }

  // Most active day comparison
  if (statistics.dailyBreakdown && previousWeekStats.dailyBreakdown) {
    const currentMostActiveDay = Object.keys(statistics.dailyBreakdown).reduce((a, b) =>
      statistics.dailyBreakdown[a].count > statistics.dailyBreakdown[b].count ? a : b
    );
    const previousMostActiveDay = Object.keys(previousWeekStats.dailyBreakdown).reduce((a, b) =>
      previousWeekStats.dailyBreakdown[a].count > previousWeekStats.dailyBreakdown[b].count ? a : b
    );
    if (currentMostActiveDay !== previousMostActiveDay) {
      insights.push({
        type: 'insight',
        icon: <MaterialIcons name="calendar-today" size={20} color="#FF5722" />,
        text: `Your most active day shifted from ${previousMostActiveDay} to ${currentMostActiveDay}. Interesting pattern change! 📅`,
        color: '#FF5722',
      });
    }
  }

  return insights.slice(0, 3);
};

  // Helper: determine dominant emotion & counts for a time segment (same as daily)
  const getSegmentDominant = (segment) => {
    if (!statistics) return null;
    const src = statistics.timeSegmentMoods?.[segment];
    if (src && (src.emotion || src.count != null || src.totalEntries != null)) {
      return {
        emotion: src.emotion || null,
        count: typeof src.count === 'number' ? src.count : (src.counts ? src.counts[src.emotion] || 0 : null),
        totalEntries: typeof src.totalEntries === 'number' ? src.totalEntries : src.total || null,
        averageIntensity: src.averageIntensity != null ? src.averageIntensity : null,
      };
    }
    return null;
  };

  // Determine which valence has the higher count for Weekly Mood
  let valenceOrder = [];
  if (statistics) {
    const pos = statistics.valenceCounts.positive || 0;
    const neg = statistics.valenceCounts.negative || 0;
    if (pos >= neg) {
      valenceOrder = [
        { label: 'Positive', count: pos, color: '#4CAF50' },
        { label: 'Negative', count: neg, color: '#FF9800' },
      ];
    } else {
      valenceOrder = [
        { label: 'Negative', count: neg, color: '#FF9800' },
        { label: 'Positive', count: pos, color: '#4CAF50' },
      ];
    }
  }

  // Skeleton loading
  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.primary }}>
        <ScrollView style={{ flex: 1 }}>
          <View style={{ padding: 16 }}>
            <SkeletonBox width="100%" height={60} style={{ borderRadius: 18, marginBottom: 24, marginTop: 50 }} />
            <SkeletonBox width="100%" height={140} style={{ borderRadius: 24, marginBottom: 24 }} />
            {[...Array(3)].map((_, i) => (
              <SkeletonBox key={i} width="100%" height={64} style={{ borderRadius: 18, marginBottom: 12 }} />
            ))}
            <SkeletonBox width="100%" height={140} style={{ borderRadius: 22, marginBottom: 24 }} />
            <SkeletonBox width="100%" height={60} style={{ borderRadius: 22, marginBottom: 12 }} />
            {[...Array(4)].map((_, i) => (
              <SkeletonBox key={i} width="100%" height={140} style={{ borderRadius: 14, marginBottom: 14 }} />
            ))}
          </View>
        </ScrollView>
      </View>
    );
  }

  if (error) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ fontFamily: fonts.bold, fontSize: 16, color: colors.background, marginBottom: 10, textAlign: 'center' }}>Unable to Load Data</Text>
        <Text style={{ color: colors.text, opacity: 0.7, marginBottom: 18, textAlign: 'center' }}>{error}</Text>
        <TouchableOpacity
          onPress={() => fetchWeeklyStatistics(selectedWeek)}
          style={{
            backgroundColor: colors.primary,
            paddingHorizontal: 24,
            paddingVertical: 10,
            borderRadius: 12,
          }}
        >
          <Text style={{ color: '#fff', fontFamily: fonts.bold, textAlign: 'center' }}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const comparisonInsights = getComparisonInsights();
  const topEmotions = getTopEmotions();

  // Get the background color for day containers (same as most frequent emotion)
  const mostFrequentBg = topEmotions.length > 0 ? '#F0F9F0' : '#FAFAFA';

  return (
    <View style={{ flex: 1, backgroundColor: colors.primary }}>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingTop: 0 }}
        keyboardShouldPersistTaps="handled"
      >
      <View
        style={{
          position: 'absolute',
          top: 38,
          left: 18,
          zIndex: 100,
          elevation: 10,
        }}
        pointerEvents="box-none"
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
        >
          <Ionicons name="arrow-back" size={26} color="#222" />
        </TouchableOpacity>
      </View>
        {/* Week Navigation */}
        <View
          style={{
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
          }}
        >
          <TouchableOpacity
            onPress={() => navigateWeek('prev')}
            style={{
              padding: 10,
              marginRight: 24,
            }}
          >
            <Ionicons name="chevron-back" size={26} color={colors.primary} />
          </TouchableOpacity>
          <View style={{ alignItems: 'center', flex: 1 }}>
            <Text
              style={{
                fontFamily: fonts.bold,
                fontSize: 20,
                color: colors.primary,
                textAlign: 'center',
              }}
            >
              {statistics?.weekStart && statistics?.weekEnd
                ? formatWeekRange(new Date(statistics.weekStart), new Date(statistics.weekEnd))
                : ''}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => navigateWeek('next')}
            disabled={(() => {
              const now = new Date();
              const weekEnd = statistics?.weekEnd ? new Date(statistics.weekEnd) : null;
              return weekEnd && weekEnd > now;
            })()}
            style={{
              padding: 10,
              marginLeft: 24,
              opacity: (() => {
                const now = new Date();
                const weekEnd = statistics?.weekEnd ? new Date(statistics.weekEnd) : null;
                return weekEnd && weekEnd > now ? 0.5 : 1;
              })(),
            }}
          >
            <Ionicons name="chevron-forward" size={26} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* No Data State */}
        {statistics?.totalEntries === 0 ? (
          <View
            style={{
              backgroundColor: '#fff',
              margin: 32,
              borderRadius: 28,
              padding: 40,
              alignItems: 'center',
              elevation: 2,
            }}
          >
            <Text style={{ fontSize: 54, marginBottom: 16, textAlign: 'center' }}>📝</Text>
            <Text
              style={{
                fontFamily: fonts.bold,
                fontSize: 22,
                color: colors.primary,
                marginBottom: 10,
                textAlign: 'center',
              }}
            >
              No Mood Entries
            </Text>
            <Text
              style={{
                fontFamily: fonts.medium,
                fontSize: 16,
                color: colors.text,
                opacity: 0.7,
                textAlign: 'center',
              }}
            >
              No mood entries found for this week. Start tracking your emotions to see insights here!
            </Text>
          </View>
        ) : (
          <View style={{ paddingHorizontal: 12, paddingBottom: 32 }}>
            {/* Insights & Comparisons */}
            {comparisonInsights.length > 0 && (
              <View
                style={{
                  backgroundColor: '#F8F8FF',
                  borderRadius: 24,
                  padding: 22,
                  marginBottom: 24,
                  elevation: 2,
                  alignItems: 'center',
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14, justifyContent: 'center' }}>
                  <MaterialIcons name="lightbulb-outline" size={26} color={colors.primary} style={{ marginRight: 10 }} />
                  <Text
                    style={{
                      fontFamily: fonts.bold,
                      fontSize: 16,
                      color: colors.text,
                      textAlign: 'center',
                    }}
                  >
                    Weekly Insights & Comparisons
                  </Text>
                </View>
                {comparisonInsights.map((insight, idx) => (
                  <View
                    key={idx}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      backgroundColor: '#fff',
                      borderRadius: 16,
                      padding: 14,
                      marginBottom: 10,
                      elevation: 1,
                      width: '100%',
                      justifyContent: 'center',
                    }}
                  >
                    <View
                      style={{
                        marginRight: 12,
                        borderRadius: 10,
                        padding: 6,
                        fontSize: 14,
                      }}
                    >
                      {insight.icon}
                    </View>
                    <Text
                      style={{
                        fontFamily: fonts.medium,
                        fontSize: 15,
                        color: colors.text,
                        flex: 1,
                        textAlign: 'center',
                      }}
                    >
                      {insight.text}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {/* Stats */}
            <View
              style={{
                marginBottom: 24,
                flexDirection: 'column',
                gap: 12,
              }}
            >
              {/* Total Entries */}
              <View
                style={{
                  backgroundColor: '#fff',
                  borderRadius: 18,
                  marginBottom: 10,
                  paddingVertical: 14,
                  paddingHorizontal: 18,
                  alignItems: 'center',
                  elevation: 2,
                  width: '100%',
                  flexDirection: 'row',
                  minHeight: 64,
                }}
              >
                <View style={{ alignItems: 'center', marginRight: 16, width: 48 }}>
                  <FontAwesome5 name="list-ol" size={26} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontFamily: fonts.medium,
                      fontSize: 15,
                      color: colors.text,
                      opacity: 0.7,
                      textAlign: 'left',
                    }}
                  >
                    Total Entries:{' '}
                    <Text
                      style={{
                        fontFamily: fonts.bold,
                        fontSize: 16,
                        color: colors.text,
                      }}
                    >
                      {statistics.totalEntries}
                    </Text>
                  </Text>
                  {previousWeekStats && (
                    <Text
                      style={{
                        fontFamily: fonts.medium,
                        fontSize: 13,
                        color: colors.text,
                        opacity: 0.5,
                        marginTop: 2,
                        textAlign: 'left',
                      }}
                    >
                      Last Week: {previousWeekStats.totalEntries}
                    </Text>
                  )}
                </View>
              </View>
              {/* Average Per Day */}
              <View
                style={{
                  backgroundColor: '#fff',
                  borderRadius: 18,
                  marginBottom: 10,
                  paddingVertical: 14,
                  paddingHorizontal: 18,
                  alignItems: 'center',
                  elevation: 2,
                  width: '100%',
                  flexDirection: 'row',
                  minHeight: 64,
                }}
              >
                <View style={{ alignItems: 'center', marginRight: 16, width: 48 }}>
                  <MaterialIcons name="timeline" size={26} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontFamily: fonts.medium,
                      fontSize: 15,
                      color: colors.text,
                      opacity: 0.7,
                      textAlign: 'left',
                    }}
                  >
                    Per Day:{' '}
                    <Text
                      style={{
                        fontFamily: fonts.bold,
                        fontSize: 16,
                        color: colors.text,
                      }}
                    >
                      {(statistics.totalEntries / 7).toFixed(1)}
                    </Text>
                  </Text>
                  {previousWeekStats && (
                    <Text
                      style={{
                        fontFamily: fonts.medium,
                        fontSize: 13,
                        color: colors.text,
                        opacity: 0.5,
                        marginTop: 2,
                        textAlign: 'left',
                      }}
                    >
                      Last Week: {(previousWeekStats.totalEntries / 7).toFixed(1)}
                    </Text>
                  )}
                </View>
              </View>
              {/* Weekly Mood */}
              <View
                style={{
                  backgroundColor: '#fff',
                  borderRadius: 18,
                  marginBottom: 10,
                  paddingVertical: 14,
                  paddingHorizontal: 18,
                  alignItems: 'center',
                  elevation: 2,
                  width: '100%',
                  flexDirection: 'row',
                  minHeight: 64,
                }}
              >
                <View style={{ alignItems: 'center', marginRight: 16, width: 48 }}>
                  {statistics.mostProminentValence === 'positive' ? (
                    <MaterialIcons name="sentiment-satisfied" size={26} color="#4CAF50" />
                  ) : (
                    <MaterialIcons name="sentiment-dissatisfied" size={26} color="#FF9800" />
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontFamily: fonts.medium,
                      fontSize: 15,
                      color: colors.text,
                      opacity: 0.7,
                      textAlign: 'left',
                    }}
                  >
                    Weekly Mood:{' '}
                    <Text
                      style={{
                        fontFamily: fonts.bold,
                        color: statistics.mostProminentValence === 'positive' ? '#4CAF50' : '#FF9800',
                      }}
                    >
                      {formatText(statistics.mostProminentValence)}
                    </Text>
                  </Text>
                  {/* Show valence counts, most count first, stacked */}
                  <View style={{ marginTop: 4 }}>
                    {valenceOrder.map((v) => (
                      <Text
                        key={v.label}
                        style={{
                          fontFamily: fonts.medium,
                          fontSize: 13,
                          color: v.color,
                          marginBottom: 2,
                          textAlign: 'left',
                        }}
                      >
                        {v.label}: {v.count}
                      </Text>
                    ))}
                  </View>
                  {previousWeekStats && (
                    <Text
                      style={{
                        fontFamily: fonts.medium,
                        fontSize: 12,
                        color: colors.text,
                        opacity: 0.5,
                        marginTop: 2,
                        textAlign: 'left',
                      }}
                    >
                      Last Week: {formatText(previousWeekStats.mostProminentValence)}
                    </Text>
                  )}
                </View>
              </View>
              {/* Average Intensity */}
              <View
                style={{
                  backgroundColor: '#fff',
                  borderRadius: 18,
                  marginBottom: 0,
                  paddingVertical: 14,
                  paddingHorizontal: 18,
                  alignItems: 'center',
                  elevation: 2,
                  width: '100%',
                  flexDirection: 'row',
                  minHeight: 64,
                }}
              >
                <View style={{ alignItems: 'center', marginRight: 16, width: 48 }}>
                  <MaterialIcons name="trending-up" size={26} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontFamily: fonts.medium,
                      fontSize: 15,
                      color: colors.text,
                      opacity: 0.7,
                      textAlign: 'left',
                    }}
                  >
                    Avg Intensity:{' '}
                    <Text
                      style={{
                        fontFamily: fonts.bold,
                        fontSize: 16,
                        color: colors.text,
                      }}
                    >
                      {statistics.averageIntensity != null ? Number(Math.round(statistics.averageIntensity * 10) / 10).toFixed(1) : '0.0'}
                    </Text>
                  </Text>
                  <View style={{ flexDirection: 'row', marginTop: 2, marginBottom: 2 }}>
                    {[...Array(5)].map((_, i) => (
                      <View
                        key={i}
                        style={{
                          width: 10,
                          height: 10,
                          borderRadius: 5,
                          marginHorizontal: 1,
                          backgroundColor: i < Math.round(statistics.averageIntensity || 0) ? colors.primary : '#E5E7EB',
                        }}
                      />
                    ))}
                  </View>
                  {previousWeekStats && (
                    <Text
                      style={{
                        fontFamily: fonts.medium,
                        fontSize: 13,
                        color: colors.text,
                        opacity: 0.5,
                        marginTop: 2,
                        textAlign: 'left',
                      }}
                    >
                      Last Week: {previousWeekStats.averageIntensity != null ? Number(Math.round(previousWeekStats.averageIntensity * 10) / 10).toFixed(1) : '0.0'}
                    </Text>
                  )}
                </View>
              </View>
            </View>

            {/* Top Emotions - horizontal, 1 per row */}
            <View
              style={{
                backgroundColor: '#fff',
                borderRadius: 22,
                padding: 24,
                marginBottom: 24,
                elevation: 2,
                alignItems: 'center',
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14, justifyContent: 'center' }}>
                <MaterialIcons name="emoji-emotions" size={24} color={colors.primary} style={{ marginRight: 10 }} />
                <Text
                  style={{
                    fontFamily: fonts.bold,
                    fontSize: 18,
                    color: colors.text,
                    textAlign: 'center',
                  }}
                >
                  Most Frequent Emotions 
                </Text>
              </View>
              {topEmotions.length > 0 ? (
                <View style={{ width: '100%' }}>
                  {topEmotions.map((item, idx) => (
                    <View
                      key={item.emotion}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        backgroundColor: idx === 0 ? '#F0F9F0' : '#FAFAFA',
                        marginBottom: 12,
                        borderRadius: 14,
                        padding: 14,
                        width: '100%',
                        minWidth: 110,
                      }}
                    >
                      {emotionImages[item.emotion] ? (
                        <Image
                          source={emotionImages[item.emotion]}
                          style={{ width: 44, height: 44, marginRight: 14 }}
                          resizeMode="contain"
                        />
                      ) : (
                        <Text style={{ fontSize: 36, marginRight: 14 }}>😐</Text>
                      )}
                      <View style={{ flex: 1 }}>
                        <Text
                          style={{
                            fontFamily: fonts.bold,
                            fontSize: 15,
                            color: colors.primary,
                            marginBottom: 2,
                            textAlign: 'left',
                          }}
                        >
                          {formatText(item.emotion)}
                        </Text>
                        <Text
                          style={{
                            fontFamily: fonts.medium,
                            fontSize: 13,
                            color: colors.text,
                            marginBottom: 2,
                            textAlign: 'left',
                          }}
                        >
                          {item.count} time{item.count !== 1 ? 's' : ''}
                        </Text>
                        {idx === 0 && (
                          <Text
                            style={{
                              backgroundColor: colors.primary,
                              color: '#fff',
                              fontFamily: fonts.medium,
                              fontSize: 12,
                              paddingHorizontal: 10,
                              paddingVertical: 3,
                              borderRadius: 8,
                              marginTop: 2,
                              alignSelf: 'flex-start',
                            }}
                          >
                            Most Frequent
                          </Text>
                        )}
                      </View>
                    </View>
                  ))}
                </View>
              ) : (
                <View style={{ alignItems: 'center', paddingVertical: 24 }}>
                  <Text style={{ fontSize: 36, opacity: 0.5, textAlign: 'center' }}>😐</Text>
                  <Text style={{ color: colors.text, opacity: 0.5, fontFamily: fonts.medium, textAlign: 'center' }}>No emotion data available</Text>
                </View>
              )}
            </View>

            {/* Mood by Time of Day */}
            <View
              style={{
                backgroundColor: '#fff',
                borderRadius: 22,
                padding: 24,
                marginBottom: 24,
                elevation: 2,
                alignItems: 'center',
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14, justifyContent: 'center' }}>
                <MaterialIcons name="access-time" size={24} color={colors.primary} style={{ marginRight: 10 }} />
                <Text
                  style={{
                    fontFamily: fonts.bold,
                    fontSize: 18,
                    color: colors.text,
                    textAlign: 'center',
                  }}
                >
                  Mood by Time of the Day
                </Text>
              </View>
              <View style={{ width: '100%' }}>
                {Object.entries(timeSegments).map(([segment, { label, time }]) => {
                  const moodData = getSegmentDominant(segment);

                  return (
                    <View
                      key={segment}
                      style={{
                        backgroundColor: '#FAFAFA',
                        borderRadius: 14,
                        paddingVertical: 18,
                        paddingHorizontal: 18,
                        marginBottom: 14,
                        width: '100%',
                        minHeight: 140,
                        flexDirection: 'column',
                        justifyContent: 'flex-start',
                        position: 'relative',
                      }}
                    >
                      {/* Icon top-left */}
                      <View style={{ position: 'absolute', top: 16, left: 16 }}>
                        {timeSegmentIcons[segment]}
                      </View>
                      {/* Time label and time top-right */}
                      <View style={{ position: 'absolute', top: 16, right: 16, alignItems: 'flex-end' }}>
                        <Text
                          style={{
                            fontFamily: fonts.bold,
                            fontSize: 15,
                            color: colors.text,
                          }}
                        >
                          {label}
                        </Text>
                        <Text
                          style={{
                            fontFamily: fonts.medium,
                            fontSize: 12,
                            color: colors.text,
                            opacity: 0.7,
                          }}
                        >
                          {time}
                        </Text>
                      </View>
                      {/* Centered mood info */}
                      <View
                        style={{
                          flex: 1,
                          alignItems: 'center',
                          justifyContent: 'center',
                          minHeight: 90,
                          marginTop: 18,
                        }}
                      >
                        {moodData && moodData.totalEntries && moodData.totalEntries > 0 ? (
                          <>
                            {emotionImages[moodData.emotion] ? (
                              <Image
                                source={emotionImages[moodData.emotion]}
                                style={{ width: 56, height: 56, marginBottom: 8, marginTop: 28 }}
                                resizeMode="contain"
                              />
                            ) : (
                              <Text style={{ fontSize: 36, marginBottom: 8, textAlign: 'center' }}>😐</Text>
                            )}

                            <Text
                              style={{
                                fontFamily: fonts.bold,
                                fontSize: 15,
                                color: colors.primary,
                                marginBottom: 6,
                                textAlign: 'center',
                              }}
                            >
                              {formatText(moodData.emotion)}
                            </Text>

                            <Text
                              style={{
                                fontFamily: fonts.medium,
                                fontSize: 13,
                                color: colors.text,
                                marginBottom: 6,
                                textAlign: 'center',
                              }}
                            >
                              {moodData.count} of {moodData.totalEntries} entries
                            </Text>

                            <View style={{ flexDirection: 'row', marginBottom: 6, justifyContent: 'center' }}>
                              {[...Array(5)].map((_, i) => (
                                <View
                                  key={i}
                                  style={{
                                    width: 10,
                                    height: 10,
                                    borderRadius: 5,
                                    marginHorizontal: 1,
                                    backgroundColor:
                                      moodData.averageIntensity != null
                                        ? i < Math.round(moodData.averageIntensity ) ? colors.primary : '#E5E7EB'
                                        : '#E5E7EB',
                                  }}
                                />
                              ))}
                            </View>

                            <Text
                              style={{
                                fontFamily: fonts.medium,
                                fontSize: 13,
                                color: colors.text,
                                opacity: 0.7,
                                textAlign: 'center',
                              }}
                            >
                              Intensity: {moodData.averageIntensity != null ? `${Number(moodData.averageIntensity).toFixed(1)}/5` : '—'}
                            </Text>
                          </>
                        ) : (
                          <>
                            <Text
                              style={{
                                fontFamily: fonts.medium,
                                fontSize: 13,
                                color: colors.text,
                                opacity: 0.4,
                                textAlign: 'center',
                              }}
                            >
                              No entries
                            </Text>
                          </>
                        )}
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>

            {/* Daily Breakdown - horizontal, 1 per row, emotion image left, day & count, emotion name below, bg same as most frequent */}
            <View
              style={{
                backgroundColor: '#fff',
                borderRadius: 22,
                padding: 24,
                marginBottom: 24,
                elevation: 2,
                alignItems: 'center',
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14, justifyContent: 'center' }}>
                <MaterialIcons name="access-time" size={24} color={colors.primary} style={{ marginRight: 10 }} />
                <Text
                  style={{
                    fontFamily: fonts.bold,
                    fontSize: 18,
                    color: colors.text,
                    textAlign: 'center',
                  }}
                >
                  Daily Breakdown
                </Text>
              </View>
              <View style={{ width: '100%' }}>
                {daysOfWeek.map((day, idx) => {
                  const data = statistics.dailyBreakdown?.[day.key] || { count: 0, dominantEmotion: null };
                  return (
                    <View
                      key={day.key}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        backgroundColor: mostFrequentBg,
                        borderRadius: 14,
                        padding: 14,
                        marginBottom: 12,
                        width: '100%',
                        minWidth: 110,
                      }}
                    >
                      {data.dominantEmotion && emotionImages[data.dominantEmotion] ? (
                        <Image
                          source={emotionImages[data.dominantEmotion]}
                          style={{ width: 36, height: 36, marginRight: 14 }}
                          resizeMode="contain"
                        />
                      ) : (
                        <Text style={{ fontSize: 28, marginRight: 14, opacity: 0.5 }}>😐</Text>
                      )}
                      <View style={{ flex: 1 }}>
                        <Text
                          style={{
                            fontFamily: fonts.bold,
                            fontSize: 15,
                            color: colors.primary,
                            marginBottom: 2,
                            textAlign: 'left',
                          }}
                        >
                          {day.label}:{' '}
                          <Text style={{ fontFamily: fonts.bold, fontSize: 15, color: colors.text }}>
                            {data.count}
                          </Text>
                        </Text>
                        <Text
                          style={{
                            fontFamily: fonts.medium,
                            fontSize: 13,
                            color: colors.text,
                            opacity: 0.7,
                            textAlign: 'left',
                          }}
                        >
                          {data.dominantEmotion ? formatText(data.dominantEmotion) : 'No Data'}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}