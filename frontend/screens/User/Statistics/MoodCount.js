import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Image, Dimensions, ScrollView } from 'react-native';
import { PieChart } from 'react-native-chart-kit';
import { moodDataService } from '../../../services/moodDataService';
import { colors } from '../../../utils/colors/colors';
import { fonts } from '../../../utils/fonts/fonts';

const screenWidth = Dimensions.get('window').width;
const chartWidth = screenWidth * 0.8;
const mainContainerWidth = screenWidth * 0.92;

const moodImages = {
  angry: require('../../../assets/images/mood/emotions/angry.png'),
  bored: require('../../../assets/images/mood/emotions/bored.png'),
  sad: require('../../../assets/images/mood/emotions/sad.png'),
  disappointed: require('../../../assets/images/mood/emotions/disappointed.png'),
  tense: require('../../../assets/images/mood/emotions/tense.png'),
  happy: require('../../../assets/images/mood/emotions/happy.png'),
  calm: require('../../../assets/images/mood/emotions/calm.png'),
  excited: require('../../../assets/images/mood/emotions/excited.png'),
  pleased: require('../../../assets/images/mood/emotions/pleased.png'),
  relaxed: require('../../../assets/images/mood/emotions/relaxed.png'),
};

// Mood color mapping as requested
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
  tense: '#973197ff',
};

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export default function MoodCount() {
  const [period, setPeriod] = useState('daily');
  const [type, setType] = useState('after'); // 'before' or 'after'
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

  const chartData = Object.keys(moodCounts)
    .filter(mood => mood !== '_summary')
    .map((mood, idx) => {
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
  const uniqueMoods = Object.keys(moodCounts).filter(mood => mood !== '_summary');
  const uniqueCount = uniqueMoods.length;

  const moodCardSize = screenWidth * 0.20;
  const moodCardHeight = moodCardSize + 21;

  // Mood containers with assigned colors
  const moodCards = chartData.map((item, idx) => (
    <View
      key={item.name}
      className="rounded-xl mb-1 items-center justify-center"
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
        marginHorizontal: 6, // bring inward
      }}
    >
      <Text
        className="text-white"
        style={{
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
        source={moodImages[item.name.toLowerCase()]}
        className="mb-1 rounded-lg"
        style={{
          width: 30,
          height: 30,
        }}
        resizeMode="contain"
      />
      <Text
        className="text-white "
        style={{
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
        className="text-white "
        style={{
          fontFamily: fonts.semiBold,
          fontSize: 12,
          opacity: 0.85,
        }}
      >
        {item.percent}%
      </Text>
    </View>
  ));

  // Only 4 per row
  const moodRows = [];
  for (let i = 0; i < moodCards.length; i += 4) {
    moodRows.push(
      <View key={i} className="flex-row justify-center mb-1">
        {moodCards.slice(i, i + 4)}
      </View>
    );
  }

  // Pie chart percentage label positions (more inward)
  function renderPieLabels() {
    if (!chartData.length || !total) return null;
    let angle = -Math.PI / 2;
    const radius = chartWidth / 2 - 70; // bring labels more inward
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
    <ScrollView className="flex-1" style={{ backgroundColor: colors.background }}>
      <View
        className="self-center items-center mt-6 mb-10 rounded-3xl"
        style={{
          backgroundColor: '#fff',
          borderRadius: 32,
          borderWidth: 1,
          borderColor: '#e5e7eb',
          width: mainContainerWidth,
          paddingBottom: 22,
          paddingTop: 12,
          elevation: 6,
          shadowColor: '#000',
          shadowOpacity: 0.09,
          shadowRadius: 14,
          shadowOffset: { width: 0, height: 3 },
        }}
      >
        {/* Header */}
        <Text
          className="text-center text-2xl mb-2"
          style={{
            color: colors.primary,
            fontFamily: fonts.semiBold,
            letterSpacing: 1,
          }}
        >
          Mood Analysis
        </Text>

        {/* Toggle Buttons for Before/After (on top) */}
        <View className="flex-row justify-center mb-4">
          <View className="flex-row bg-gray-100 p-1" style={{ borderRadius: 999 }}>
            {['before', 'after'].map(opt => (
              <TouchableOpacity
                key={opt}
                onPress={() => setType(opt)}
                className="mx-1"
                style={{
                  backgroundColor: type === opt ? colors.secondary : 'transparent',
                  borderRadius: 999,
                  paddingVertical: 8,
                  paddingHorizontal: 22,
                  elevation: type === opt ? 2 : 0,
                }}
              >
                <Text
                  style={{
                    color: colors.text,
                    fontFamily: fonts.regular,
                    fontSize: 15,
                  }}
                >
                  {opt === 'before' ? 'Before' : 'After'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Toggle Buttons for Daily/Weekly/Monthly */}
        <View className="flex-row justify-center mb-4">
          <View className="flex-row bg-gray-100 p-1" style={{ borderRadius: 999 }}>
            {['daily', 'week', 'month'].map(opt => (
              <TouchableOpacity
                key={opt}
                onPress={() => setPeriod(opt)}
                className="mx-1"
                style={{
                  backgroundColor: period === opt ? colors.secondary : 'transparent',
                  borderRadius: 999,
                  elevation: period === opt ? 2 : 0,
                  paddingVertical: 8,
                  paddingHorizontal: 22,
                }}
              >
                <Text
                  style={{
                    color: colors.text,
                    fontFamily: fonts.regular,
                    fontSize: 15,
                  }}
                >
                  {opt === 'daily' ? 'Daily' : opt === 'week' ? 'Weekly' : 'Monthly'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Pie Chart with percentage labels */}
        <View className="items-center justify-center w-full mt-2 mb-2">
          {loading ? (
            <View className="items-center" style={{ width: chartWidth }}>
              <View className="rounded-full bg-gray-200 mb-6" style={{ width: chartWidth, height: chartWidth }} />
              <View className="rounded bg-gray-200 mb-2" style={{ width: 70, height: 28 }} />
              <View className="rounded bg-gray-200" style={{ width: 90, height: 18 }} />
            </View>
          ) : chartData.length === 0 ? (
            <Text className="mt-6 text-lg font-medium" style={{ color: colors.text, fontFamily: fonts.medium }}>
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
              {/* Percentage labels on top of each slice */}
              {renderPieLabels()}
            </View>
          )}
        </View>

        {/* Top Mood, Total, Unique Container */}
        <View
          className="flex-row justify-between items-center px-2 py-3 mt-2 mb-4"
          style={{
            backgroundColor: colors.background,
            borderRadius: 16,
            width: mainContainerWidth * 0.93,
            alignSelf: 'center',
            elevation: 2,
          }}
        >
          <View className="items-center flex-1">
            <Text className="text-base font-bold mb-1" style={{ color: colors.primary, fontFamily: fonts.semiBold }}>
              {topMood || '—'}
            </Text>
            <Text className="text-xs" style={{ color: colors.text, fontFamily: fonts.regular }}>
              Top Mood
            </Text>
          </View>
          <View className="items-center flex-1">
            <Text className="text-base font-bold mb-1" style={{ color: colors.primary, fontFamily: fonts.semiBold }}>
              {total}
            </Text>
            <Text className="text-xs" style={{ color: colors.text, fontFamily: fonts.regular }}>
              Total Moods
            </Text>
          </View>
          <View className="items-center flex-1">
            <Text className="text-base font-bold mb-1" style={{ color: colors.primary, fontFamily: fonts.semiBold }}>
              {uniqueCount}
            </Text>
            <Text className="text-xs" style={{ color: colors.text, fontFamily: fonts.regular }}>
              Unique Emotions
            </Text>
          </View>
        </View>

        {/* Mood Counts Grid */}
        <View className="mt-2 px-2 pb-6 w-full">
          {moodRows}
        </View>

        {/* View Summary Button */}
        {summary && (
          <TouchableOpacity
            onPress={() => setShowSummary(!showSummary)}
            className="self-center mb-2 px-6 py-2 rounded-full mt-2"
            style={{
              backgroundColor: colors.primary,
              elevation: 2,
            }}
          >
            <Text className="text-white font-semibold text-base" style={{ fontFamily: fonts.semiBold, letterSpacing: 1 }}>
              {showSummary ? 'Hide Summary' : 'View Summary'}
            </Text>
          </TouchableOpacity>
        )}

        {/* Summary Section */}
        {summary && showSummary && (
          <View className="mt-4 mb-2 px-4 py-4 rounded-xl w-11/12 self-center"
            style={{
              backgroundColor: '#f3f4f6',
              elevation: 2,
              shadowColor: '#000',
              shadowOpacity: 0.07,
              shadowRadius: 6,
              shadowOffset: { width: 0, height: 1 },
            }}>
            <Text className=" text-lg mb-3 text-center" style={{ color: colors.primary, fontFamily: fonts.semiBold, letterSpacing: 0.5 }}>
              Summary
            </Text>
            <View className="pl-2">
              <View className="flex-row items-start mb-2">
                <Text className="text-xl font-bold mr-2" style={{ color: colors.primary, fontFamily: fonts.bold }}>•</Text>
                <Text className="text-base font-medium flex-1" style={{ color: colors.text, fontFamily: fonts.medium }}>
                  The top emotion for this {period} is <Text style={{ color: colors.primary, fontFamily: fonts.bold }}>{summary.topType}</Text>, <Text style={{ color: colors.primary, fontFamily: fonts.bold }}>{capitalize(summary.topMood)}</Text>.
                </Text>
              </View>
              <View className="flex-row items-start mb-2">
                <Text className="text-xl font-bold mr-2" style={{ color: colors.primary, fontFamily: fonts.bold }}>•</Text>
                <Text className="text-base font-medium flex-1" style={{ color: colors.text, fontFamily: fonts.medium }}>
                  You have a total of <Text style={{ color: colors.primary, fontFamily: fonts.bold }}>{summary.uniqueCount}</Text> different moods this {period}.
                </Text>
              </View>
              <View className="flex-row items-start">
                <Text className="text-xl font-bold mr-2" style={{ color: colors.primary, fontFamily: fonts.bold }}>•</Text>
                <Text className="text-base font-medium flex-1" style={{ color: colors.text, fontFamily: fonts.medium }}>
                  The least amount of mood you experienced this {period} is <Text style={{ color: colors.primary, fontFamily: fonts.bold }}>{summary.leastType}</Text>, <Text style={{ color: colors.primary, fontFamily: fonts.bold }}>{capitalize(summary.leastMood)}</Text>.
                </Text>
              </View>
            </View>
          </View>
        )}
      </View>
    </ScrollView>
  );
}