import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Image, Dimensions } from 'react-native';
import { PieChart } from 'react-native-chart-kit';
import { useNavigation } from '@react-navigation/native';
import { moodDataService } from '../../../services/moodDataService';
import { colors } from '../../../utils/colors/colors';
import { fonts } from '../../../utils/fonts/fonts';
import emotionImages from '../../../utils/images/emotions';
const screenWidth = Dimensions.get('window').width;
const chartWidth = screenWidth * 0.8;
const mainContainerWidth = screenWidth * 0.92;



const moodColorMap = {
  calm: '#8FABD4',
  relaxed: '#59AC77',
  pleased: '#FF714B',
  happy: '#f7b40bff',
  excited: '#F564A9',
  bored: '#A9A9A9',
  sad: '#092b9cff',
  disappointed: '#4e4d4dff',
  angry: '#cc062dff',
  tense: '#a854a8ff',
};

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function getPeriodText(period) {
  if (period === 'daily') return 'today';
  if (period === 'week') return 'this week';
  if (period === 'month') return 'this month';
  return period;
}

export default function MoodCount() {
  const navigation = useNavigation();
  const [period, setPeriod] = useState('daily');
  const [type, setType] = useState('after');
  const [moodCounts, setMoodCounts] = useState({});
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [showSummary, setShowSummary] = useState(false);

  useEffect(() => {
    fetchData();
  }, [period, type]);

  async function fetchData() {
    setLoading(true);
    let result;
    if (type === 'after') {
      result = await moodDataService.getAfterEmotionCounts(period);
    } else {
      result = await moodDataService.getBeforeEmotionCounts(period);
    }
    setMoodCounts(result);
    setTotal(
      Object.keys(result)
        .filter(mood => mood !== '_summary')
        .map(mood => result[mood])
        .reduce((a, b) => a + b, 0)
    );
    setLoading(false);
    setSummary(result._summary || null);
    setShowSummary(false);
  }

  const sortedMoodKeys = Object.keys(moodCounts)
    .filter(mood => mood !== '_summary')
    .sort((a, b) => moodCounts[b] - moodCounts[a]);

  const chartData = sortedMoodKeys.map(mood => {
    const percent = total ? Math.round((moodCounts[mood] / total) * 100) : 0;
    return {
      name: capitalize(mood),
      population: moodCounts[mood],
      color: moodColorMap[mood] || '#ccc',
      legendFontColor: colors.text,
      legendFontSize: 16,
      key: mood,
      percent: percent,
    };
  });

  let topMood = '';
  if (summary && summary.topMood) {
    topMood = capitalize(summary.topMood);
  }
  const uniqueMoods = sortedMoodKeys;
  const uniqueCount = uniqueMoods.length;

  const moodCardSize = screenWidth * 0.20;
  const moodCardHeight = moodCardSize + 20;

  // Mood containers with assigned colors and navigation, sorted by count
  const moodCards = chartData.map(item => (
    <TouchableOpacity
      key={item.name}
      onPress={() => navigation.navigate('ActivitiesStatistics', {
        mood: item.key,
        type,
        period
      })}
      activeOpacity={0.8}
      style={{
        width: moodCardSize,
        height: moodCardHeight,
        backgroundColor: item.color,
        elevation: 2,
        shadowColor: item.color,
        shadowOpacity: 0.10,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 1 },
        padding: 6,
        marginHorizontal: 6,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
      }}
    >
      <Text
        style={{
          color: '#fff',
          fontFamily: fonts.semiBold,
          fontSize: 10,
          letterSpacing: 0.5,
          textShadowColor: 'rgba(0,0,0,0.10)',
          textShadowOffset: { width: 1, height: 1 },
          textShadowRadius: 1,
        }}
        numberOfLines={1}
        ellipsizeMode="tail"
      >
        {item.name}
      </Text>
      <Image
        source={emotionImages[item.name.toLowerCase()]}
        style={{
          width: 30,
          height: 30,
          marginBottom: 2,
        }}
        resizeMode="contain"
      />
      <Text
        style={{
          color: '#fff',
          fontFamily: fonts.bold,
          fontSize: 15,
          textShadowColor: 'rgba(0,0,0,0.08)',
          textShadowOffset: { width: 1, height: 1 },
          textShadowRadius: 1,
        }}
      >
        {item.population}
      </Text>
      <Text
        style={{
          color: '#fff',
          fontFamily: fonts.semiBold,
          fontSize: 12,
          opacity: 0.85,
        }}
      >
        {item.percent}%
      </Text>
    </TouchableOpacity>
  ));

  // Only 4 per row
  const moodRows = [];
  for (let i = 0; i < moodCards.length; i += 4) {
    moodRows.push(
      <View key={i} style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: 2 }}>
        {moodCards.slice(i, i + 4)}
      </View>
    );
  }

  // Pie chart percentage label positions (more inward)
  function renderPieLabels() {
    if (!chartData.length || !total) return null;
    let angle = -Math.PI / 2;
    const radius = chartWidth / 2 - 70;
    return chartData.map((slice, idx) => {
      const sliceAngle = (slice.population / total) * 2 * Math.PI;
      const midAngle = angle + sliceAngle / 2;
      angle += sliceAngle;
      const x = chartWidth / 2 + radius * Math.cos(midAngle);
      const y = chartWidth / 2 + radius * Math.sin(midAngle);
      return (
        <Text
          key={slice.key}
          style={{
            position: 'absolute',
            left: x - 18,
            top: y - 10,
            color: colors.background,
            fontFamily: fonts.semiBold,
            fontSize: 15,
            backgroundColor: 'transparent',
            width: 36,
            textAlign: 'center',
          }}
        >
          {slice.percent > 0 ? `${slice.percent}%` : ''}
        </Text>
      );
    });
  }

  return (
    <View style={{ backgroundColor: colors.background }}>
      <View
        style={{
          backgroundColor: '#fff',
          borderRadius: 24,
          borderWidth: 1,
          borderColor: '#e5e7eb',
          width: mainContainerWidth,
          paddingBottom: 20,
          paddingTop: 20,
          marginHorizontal: 16,
          marginBottom: 0,
          elevation: 6,
          shadowColor: '#000',
          shadowOpacity: 0.08,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: 2 },
          alignSelf: 'center',
          alignItems: 'center',
        }}
      >
        {/* Header */}
        <Text
          style={{
            color: colors.primary,
            fontFamily: fonts.bold,
            letterSpacing: 0.5,
            fontSize: 22,
            textAlign: 'center',
            marginBottom: 4,
          }}
        >
          Mood Analysis
        </Text>

        {/* Toggle Buttons for Before/After */}
        <View style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: 12 }}>
          <View style={{
            flexDirection: 'row',
            backgroundColor: '#f3f4f6',
            padding: 2,
            borderRadius: 999,
          }}>
            {['before', 'after'].map(opt => (
              <TouchableOpacity
                key={opt}
                onPress={() => setType(opt)}
                style={{
                  backgroundColor: type === opt ? '#6FC3B2' : 'transparent',
                  borderRadius: 999,
                  paddingVertical: 6,
                  paddingHorizontal: 20,
                  marginHorizontal: 2,
                  elevation: type === opt ? 2 : 0,
                }}
              >
                <Text style={{
                  color: type === opt ? '#fff' : colors.primary,
                  fontFamily: fonts.semiBold,
                  fontSize: 13,
                  textAlign: 'center',
                }}>
                  {opt === 'before' ? 'Before' : 'After'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Toggle Buttons for Daily/Weekly/Monthly */}
        <View style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: 14 }}>
          <View style={{
            flexDirection: 'row',
            backgroundColor: '#f3f4f6',
            padding: 2,
            borderRadius: 999,
          }}>
            {['daily', 'week', 'month'].map(opt => (
              <TouchableOpacity
                key={opt}
                onPress={() => setPeriod(opt)}
                style={{
                  backgroundColor: period === opt ? '#6FC3B2' : 'transparent',
                  borderRadius: 999,
                  paddingVertical: 6,
                  paddingHorizontal: 16,
                  marginHorizontal: 2,
                  elevation: period === opt ? 2 : 0,
                }}
              >
                <Text style={{
                  color: period === opt ? '#fff' : colors.primary,
                  fontFamily: fonts.semiBold,
                  fontSize: 13,
                  textAlign: 'center',
                }}>
                  {opt === 'daily' ? 'Daily' : opt === 'week' ? 'Weekly' : 'Monthly'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Pie Chart with percentage labels */}
        <View style={{ alignItems: 'center', justifyContent: 'center', width: '100%', marginTop: 2, marginBottom: 2 }}>
          {loading ? (
            <View style={{ alignItems: 'center', width: chartWidth }}>
              <View style={{ borderRadius: chartWidth / 2, backgroundColor: '#e5e7eb', marginBottom: 24, width: chartWidth, height: chartWidth }} />
              <View style={{ borderRadius: 8, backgroundColor: '#e5e7eb', marginBottom: 8, width: 70, height: 28 }} />
              <View style={{ borderRadius: 8, backgroundColor: '#e5e7eb', width: 90, height: 18 }} />
            </View>
          ) : chartData.length === 0 ? (
            <Text style={{ marginTop: 24, fontSize: 16, fontFamily: fonts.medium, color: colors.text, textAlign: 'center' }}>
              No mood data found for this period.
            </Text>
          ) : (
            <View style={{ width: chartWidth, height: chartWidth, alignSelf: 'center', marginBottom: 8 }}>
              <PieChart
                data={chartData}
                width={chartWidth}
                height={chartWidth}
                chartConfig={{
                  color: () => colors.primary,
                  labelColor: () => colors.text,
                }}
                accessor="population"
                backgroundColor="transparent"
                paddingLeft={screenWidth * 0.2}
                hasLegend={false}
                center={[0, 0]}
                absolute
                style={{ alignSelf: 'center' }}
              />
              {renderPieLabels()}
            </View>
          )}
        </View>

        {/* Top Mood, Total, Unique Container */}
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingHorizontal: 12,
            paddingVertical: 12,
            marginTop: 10,
            marginBottom: 14,
            backgroundColor: colors.secondary,
            borderRadius: 16,
            width: mainContainerWidth * 0.93,
            alignSelf: 'center',
            elevation: 2,
          }}
        >
          <View style={{ alignItems: 'center', flex: 1 }}>
            <Text style={{ fontSize: 13, fontFamily: fonts.semiBold, color: colors.white, marginBottom: 2, textAlign: 'center' }}>
              {topMood || '—'}
            </Text>
            <Text style={{ fontSize: 11, color: colors.text, fontFamily: fonts.regular, textAlign: 'center' }}>
              Top Mood
            </Text>
          </View>
          <View style={{ alignItems: 'center', flex: 1 }}>
            <Text style={{ fontSize: 15, fontFamily: fonts.semiBold, color: colors.white, marginBottom: 2, textAlign: 'center' }}>
              {total}
            </Text>
            <Text style={{ fontSize: 11, color: colors.text, fontFamily: fonts.regular, textAlign: 'center' }}>
              Total Moods
            </Text>
          </View>
          <View style={{ alignItems: 'center', flex: 1 }}>
            <Text style={{ fontSize: 15, fontFamily: fonts.semiBold, color: colors.white, marginBottom: 2, textAlign: 'center' }}>
              {uniqueCount}
            </Text>
            <Text style={{ fontSize: 11, color: colors.text, fontFamily: fonts.regular, textAlign: 'center' }}>
              Unique Moods
            </Text>
          </View>
        </View>

        {/* Mood Counts Grid */}
        <View style={{ marginTop: 10, paddingHorizontal: 8, paddingBottom: 12, width: '100%' }}>
          {moodRows}
        </View>
        
        {/* Info Text */}
        <Text
          style={{
            fontFamily: fonts.medium,
            fontSize: 12,
            color: colors.text,
            opacity: 0.6,
            textAlign: 'center',
            marginBottom: 0,
            marginTop: 0,
          }}
        >
          Tap a mood to view details
        </Text>

      </View>
    </View>
  );
}