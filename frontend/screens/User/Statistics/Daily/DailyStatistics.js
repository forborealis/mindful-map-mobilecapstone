import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Image } from 'react-native';
import { colors } from '../../../../utils/colors/colors';
import { fonts } from '../../../../utils/fonts/fonts';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import axios from 'axios';

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

// time segment icons (keeps previous choices and adds earlyMorning)
const timeSegmentIcons = {
  earlyMorning: <MaterialIcons name="brightness-3" size={28} color="#90A4AE" />, // crescent moon
  morning: <Ionicons name="sunny" size={28} color="#FFA726" />,
  afternoon: <MaterialIcons name="wb-twilight" size={28} color="#FF7043" />,
  evening: <Ionicons name="moon" size={28} color="#5C6BC0" />,
};

// updated time segments with Early Morning
const timeSegments = {
  earlyMorning: { label: 'Early Morning', time: '12:00 AM - 5:59 AM' },
  morning: { label: 'Morning', time: '6:00 AM - 11:59 AM' },
  afternoon: { label: 'Afternoon', time: '12:00 PM - 5:59 PM' },
  evening: { label: 'Evening', time: '6:00 PM - 11:59 PM' },
};

function formatDate(date) {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return 'Today';
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

function formatText(text) {
  if (!text) return '';
  return text.replace(/[-_]/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
}

import { moodDataService } from '../../../../services/moodDataService';

export default function DailyStatistics({ navigation }) {
  const [statistics, setStatistics] = useState(null);
  const [previousDayStats, setPreviousDayStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [error, setError] = useState(null);

  // Fetch daily statistics using moodDataService
  const fetchDailyStatistics = async (date) => {
    try {
      setLoading(true);
      setError(null);

      const stats = await moodDataService.getDailyStatistics(date);
      setStatistics(stats);

      const previousDate = new Date(date);
      previousDate.setDate(previousDate.getDate() - 1);
      try {
        const prevStats = await moodDataService.getDailyStatistics(previousDate);
        setPreviousDayStats(prevStats);
      } catch {
        setPreviousDayStats(null);
      }
    } catch (err) {
      setError('Failed to load daily statistics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDailyStatistics(selectedDate);
  }, [selectedDate]);

  // Navigation for date
  const navigateDate = (direction) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
    setSelectedDate(newDate);
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

  // Comparison insights
  const getComparisonInsights = () => {
    if (!statistics || !previousDayStats || statistics.totalEntries === 0) return [];
    const insights = [];
    // Total entries
    const entriesDiff = statistics.totalEntries - previousDayStats.totalEntries;
    if (entriesDiff > 0) {
      insights.push({
        icon: <MaterialIcons name="trending-up" size={20} color="#4CAF50" />,
        text: `You logged ${entriesDiff} more mood${entriesDiff > 1 ? 's' : ''} than yesterday! Great self-awareness! 🌟`,
      });
    } else if (entriesDiff < 0) {
      insights.push({
        icon: <MaterialIcons name="trending-down" size={20} color="#FF9800" />,
        text: `You logged ${Math.abs(entriesDiff)} fewer mood${Math.abs(entriesDiff) > 1 ? 's' : ''} than yesterday. Every bit of tracking counts! 📝`,
      });
    }
    // Positive mood comparison
    const currentPositive = statistics.valenceCounts?.positive || 0;
    const previousPositive = previousDayStats.valenceCounts?.positive || 0;
    const positiveDiff = currentPositive - previousPositive;
    if (positiveDiff > 0) {
      insights.push({
        icon: <MaterialIcons name="sentiment-satisfied" size={20} color="#4CAF50" />,
        text: `${positiveDiff} more positive mood${positiveDiff > 1 ? 's' : ''} than yesterday! You're on an upward trend! 🚀`,
      });
    } else if (positiveDiff < 0) {
      insights.push({
        icon: <MaterialIcons name="sentiment-dissatisfied" size={20} color="#2196F3" />,
        text: `Fewer positive moods than yesterday. That's perfectly normal - every day is different! 💙`,
      });
    }
    // Dominant mood shift
    if (
      statistics.mostProminentValence &&
      previousDayStats.mostProminentValence &&
      statistics.mostProminentValence !== previousDayStats.mostProminentValence
    ) {
      if (statistics.mostProminentValence === 'positive') {
        insights.push({
          icon: <MaterialIcons name="sentiment-satisfied" size={20} color="#4CAF50" />,
          text: `Your mood shifted from negative to positive today! What a beautiful turnaround! 🌈`,
        });
      } else {
        insights.push({
          icon: <MaterialIcons name="lightbulb-outline" size={20} color="#2196F3" />,
          text: `Today felt more challenging than yesterday. Remember, difficult days make us stronger! 💪`,
        });
      }
    }
    return insights.slice(0, 3);
  };

  // Helper: determine dominant emotion & counts for a time segment (best-effort)
  const getSegmentDominant = (segment) => {
    if (!statistics) return null;

    // 1) Preferred source: statistics.timeSegmentMoods[segment]
    const src = statistics.timeSegmentMoods?.[segment];
    if (src && (src.emotion || src.count != null || src.totalEntries != null)) {
      return {
        emotion: src.emotion || null,
        count: typeof src.count === 'number' ? src.count : (src.counts ? src.counts[src.emotion] || 0 : null),
        totalEntries: typeof src.totalEntries === 'number' ? src.totalEntries : src.total || null,
        averageIntensity: src.averageIntensity != null ? src.averageIntensity : null,
      };
    }

    // 2) Alternate shape: statistics.timeSegmentEmotionCounts[segment] => {emotion: count, ...}
    const alt = statistics.timeSegmentEmotionCounts?.[segment] || statistics.timeSegmentEmotionCountsMap?.[segment];
    if (alt && typeof alt === 'object') {
      const entries = Object.entries(alt);
      const total = entries.reduce((s, [, c]) => s + (Number(c) || 0), 0);
      if (entries.length === 0) return null;
      const [emotion, count] = entries.sort((a, b) => b[1] - a[1])[0];
      return { emotion, count: Number(count) || 0, totalEntries: total, averageIntensity: null };
    }

    // 3) If there is a generic per-segment entries array: statistics.timeSegmentEntries?.[segment]
    const arr = statistics.timeSegmentEntries?.[segment] || statistics.entriesByTimeSegment?.[segment];
    if (Array.isArray(arr)) {
      // arr elements may be { emotion, intensity, ... }
      const counts = {};
      let total = 0;
      arr.forEach((e) => {
        const emo = e?.emotion || e?.mood || null;
        if (emo) {
          counts[emo] = (counts[emo] || 0) + 1;
          total += 1;
        }
      });
      const entries = Object.entries(counts);
      if (entries.length === 0) return null;
      const [emotion, count] = entries.sort((a, b) => b[1] - a[1])[0];
      return { emotion, count, totalEntries: total, averageIntensity: null };
    }

    // 4) Fallback: try to use statistics.timeSegmentTotals or similar shapes
    const totals = statistics.timeSegmentTotals?.[segment] || statistics.timeSegmentCounts?.[segment];
    if (totals && typeof totals === 'object') {
      // totals might be { topEmotion: 'angry', topCount: 2, total: 4 }
      const emotion = totals.topEmotion || totals.dominantEmotion || null;
      const count = totals.topCount != null ? totals.topCount : totals.count != null ? totals.count : null;
      const totalEntries = totals.total != null ? totals.total : totals.totalEntries != null ? totals.totalEntries : null;
      if (emotion || count != null || totalEntries != null) {
        return { emotion, count, totalEntries, averageIntensity: totals.avgIntensity || null };
      }
    }

    // If nothing available, return null to render "No entries"
    return null;
  };

  // Render
  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.primary }}>
        <ScrollView style={{ flex: 1 }}>
          <View style={{ padding: 16 }}>
            {/* Date Navigation Skeleton */}
            <SkeletonBox width="100%" height={60} style={{ borderRadius: 18, marginBottom: 24, marginTop: 50 }} />

            {/* Insights & Comparisons Skeleton */}
            <SkeletonBox width="100%" height={140} style={{ borderRadius: 24, marginBottom: 24 }} />

            {/* Stats Skeletons */}
            {[...Array(3)].map((_, i) => (
              <SkeletonBox key={i} width="100%" height={64} style={{ borderRadius: 18, marginBottom: 12 }} />
            ))}

            {/* Top Emotions Skeleton */}
            <SkeletonBox width="100%" height={140} style={{ borderRadius: 22, marginBottom: 24 }} />

            {/* Mood by Time of Day Skeletons */}
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
        <Text style={{ fontFamily: fonts.bold, fontSize: 18, color: colors.background, marginBottom: 10, textAlign: 'center' }}>Unable to Load Data</Text>
        <Text style={{ color: colors.text, opacity: 0.7, marginBottom: 18, textAlign: 'center' }}>{error}</Text>
        <TouchableOpacity
          onPress={() => fetchDailyStatistics(selectedDate)}
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

  return (
    <View style={{ flex: 1, backgroundColor: colors.primary }}>
      {/* Back Arrow */}
      <TouchableOpacity
        onPress={() => navigation.goBack()}
        style={{
          position: 'absolute',
          top: 38,
          left: 18,
        }}
      >
        <Ionicons name="arrow-back" size={26} color="#222" />
      </TouchableOpacity>

      <ScrollView style={{ flex: 1 }}>
        {/* Date Navigation */}
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
            onPress={() => navigateDate('prev')}
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
                fontSize: 22,
                color: colors.primary,
                textAlign: 'center',
              }}
            >
              {formatDate(selectedDate)}
            </Text>
            <Text
              style={{
                fontFamily: fonts.medium,
                fontSize: 15,
                color: colors.text,
                opacity: 0.7,
                textAlign: 'center',
              }}
            >
              {selectedDate.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => navigateDate('next')}
            disabled={selectedDate.toDateString() === new Date().toDateString()}
            style={{
              padding: 10,
              marginLeft: 24,
              opacity: selectedDate.toDateString() === new Date().toDateString() ? 0.5 : 1,
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
              No mood entries found for {formatDate(selectedDate).toLowerCase()}. Start tracking your emotions to see insights here!
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
                      fontSize: 18,
                      color: colors.text,
                      textAlign: 'center',
                    }}
                  >
                    Daily Insights & Comparisons
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
                  {previousDayStats && (
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
                      Yesterday: {previousDayStats.totalEntries}
                    </Text>
                  )}
                </View>
              </View>
              {/* Dominant Mood */}
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
                    Dominant Mood:{' '}
                    <Text
                      style={{
                        fontFamily: fonts.bold,
                        color: statistics.mostProminentValence === 'positive' ? '#4CAF50' : '#FF9800',
                      }}
                    >
                      {formatText(statistics.mostProminentValence)}
                    </Text>
                  </Text>
                  {(() => {
                    const positive = statistics.valenceCounts?.positive || 0;
                    const negative = statistics.valenceCounts?.negative || 0;
                    const first =
                      positive >= negative
                        ? { label: 'Positive', count: positive, color: '#4CAF50' }
                        : { label: 'Negative', count: negative, color: '#FF9800' };
                    const second =
                      positive < negative
                        ? { label: 'Positive', count: positive, color: '#4CAF50' }
                        : { label: 'Negative', count: negative, color: '#FF9800' };
                    return (
                      <>
                        <Text
                          style={{
                            fontFamily: fonts.medium,
                            fontSize: 13,
                            color: first.color,
                            marginTop: 2,
                            textAlign: 'left',
                          }}
                        >
                          {first.label}: {first.count}
                        </Text>
                        <Text
                          style={{
                            fontFamily: fonts.medium,
                            fontSize: 13,
                            color: second.color,
                            textAlign: 'left',
                          }}
                        >
                          {second.label}: {second.count}
                        </Text>
                      </>
                    );
                  })()}
                  {previousDayStats && (
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
                      Yesterday: {formatText(previousDayStats.mostProminentValence)}
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
                      {statistics.averageIntensity?.toFixed(1) || '0.0'}
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
                  {previousDayStats && (
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
                      Yesterday: {previousDayStats.averageIntensity?.toFixed(1) || '0.0'}
                    </Text>
                  )}
                </View>
              </View>
            </View>

            {/* Top Emotions */}
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

            {/* Mood by Time of Day - 1 per row, icon left-top, time label right-top, centered mood info */}
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
                                style={{ width: 56, height: 56, marginBottom: 8, marginTop: 28 }} // moved downward
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
                                        ? i < Math.round(moodData.averageIntensity) ? colors.primary : '#E5E7EB'
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
                              Intensity: {moodData.averageIntensity != null ? `${moodData.averageIntensity}/5` : '—'}
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
          </View>
        )}
      </ScrollView>
    </View>
  );
}