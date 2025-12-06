import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Dimensions, Image, TouchableOpacity, Alert, ActivityIndicator, ToastAndroid } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PieChart } from 'react-native-chart-kit';
import { useNavigation } from '@react-navigation/native';
import { moodDataService } from '../../../services/moodDataService';
import { colors } from '../../../utils/colors/colors';
import { fonts } from '../../../utils/fonts/fonts';
import activityImages from '../../../utils/images/activities';
import { downloadActivitiesStatisticsPDF } from '../../../components/PDFTemplate/ActivitiesStatisticsPDF';

const screenWidth = Dimensions.get('window').width;
const chartWidth = screenWidth * 0.80;

const pieColors = [
  '#8FABD4', '#59AC77', '#FF714B', '#f7b40bff', '#F564A9',
  '#A9A9A9', '#092b9cff', '#4e4d4dff', '#cc062dff', '#fdf8fdff'
];

const sectionGradients = {
  Activity: ['#c7f2ffff', '#d2f3fa', '#f7fafc'],
  Social: ['#ffe0a3ff', '#ffe1a8', '#f7fafc'],
  Health: ['#c0f6d5ff', '#b2f2bb', '#f7fafc'],
  Sleep: ['#e0e7ff', '#b2b8f2', '#f7fafc'],
};

const categoryColors = {
  Activity: '#0ea5e9',
  Social: '#f9952b',
  Health: '#22c55e',
  Sleep: '#6366f1',
};

// const activityImages = {
//   commute: require('../../../assets/images/mood/commute.png'),
//   exam: require('../../../assets/images/mood/exam.png'),
//   homework: require('../../../assets/images/mood/homework.png'),
//   project: require('../../../assets/images/mood/project.png'),
//   study: require('../../../assets/images/mood/study.png'),
//   read: require('../../../assets/images/mood/read.png'),
//   extracurricular: require('../../../assets/images/mood/extraCurricularActivities.png'),
//   'household-chores': require('../../../assets/images/mood/householdChores.png'),
//   relax: require('../../../assets/images/mood/relax.png'),
//   'watch-movie': require('../../../assets/images/mood/watchMovie.png'),
//   'listen-music': require('../../../assets/images/mood/listenToMusic.png'),
//   gaming: require('../../../assets/images/mood/gaming.png'),
//   'browse-internet': require('../../../assets/images/mood/browseInternet.png'),
//   shopping: require('../../../assets/images/mood/shopping.png'),
//   travel: require('../../../assets/images/mood/travel.png'),
//   alone: require('../../../assets/images/mood/alone.png'),
//   friends: require('../../../assets/images/mood/friend.png'),
//   family: require('../../../assets/images/mood/family.png'),
//   classmates: require('../../../assets/images/mood/classmate.png'),
//   relationship: require('../../../assets/images/mood/relationship.png'),
//   online: require('../../../assets/images/mood/onlineInteraction.png'),
//   pet: require('../../../assets/images/mood/pet.png'),
//   jog: require('../../../assets/images/mood/jog.png'),
//   walk: require('../../../assets/images/mood/walk.png'),
//   exercise: require('../../../assets/images/mood/exercise.png'),
//   sports: require('../../../assets/images/mood/sports.png'),
//   meditate: require('../../../assets/images/mood/meditate.png'),
//   'eat-healthy': require('../../../assets/images/mood/eatHealthy.png'),
//   'no-physical': require('../../../assets/images/mood/noPhysicalActivity.png'),
//   'eat-unhealthy': require('../../../assets/images/mood/eatUnhealthy.png')
// };

function beautifyName(name) {
  if (!name) return '';
  let str = name.replace(/-/g, ' ');
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function getSummaryPhrase(title, data) {
  if (!data || data.length === 0) return `No data for this category.`;
  const top = data[0];
  if (!top) return `No data for this category.`;
  if (title === 'Sleep') {
    return `Most students logged "${beautifyName(top.name)}" hours of sleep most often (${top.count} times, ${top.percent}%). Getting enough sleep is important for your mood and focus!`;
  }
  if (top.percent >= 50) {
    return `The activity "${beautifyName(top.name)}" made up more than half of your logs for this category (${top.count} times, ${top.percent}%).`;
  }
  if (top.percent >= 30) {
    return `"${beautifyName(top.name)}" was the most common in this category (${top.count} times, ${top.percent}%).`;
  }
  return `You did "${beautifyName(top.name)}" most often in this category (${top.count} times, ${top.percent}%).`;
}

function PieSection({ title, data, category }) {
  const [showSummary, setShowSummary] = useState(false);
  const total = data.reduce((a, b) => a + b.count, 0);
  const chartData = data.map((item, idx) => ({
    name: beautifyName(item.name),
    population: item.count,
    color: pieColors[idx % pieColors.length],
    legendFontColor: colors.text,
    legendFontSize: 15,
    percent: item.percent,
    key: item.name,
    count: item.count,
  }));

  // Gradient background for each section
  const gradientColors = sectionGradients[title] || ['#fff'];

  // --- Restore counts on pie slices ---
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
          {slice.count > 0 ? `${slice.count}` : ''}
        </Text>
      );
    });
  }
  // --- End restore ---

  // Sort chartData for the list: greatest to least, then alphabetically
  const sortedChartData = [...chartData].sort((a, b) => {
    if (b.count !== a.count) return b.count - a.count;
    return a.name.localeCompare(b.name);
  });

  return (
    <View style={{
      marginBottom: 36,
      alignItems: 'center',
      borderRadius: 28,
      paddingVertical: 22,
      paddingHorizontal: 14,
      width: chartWidth + 32,
      shadowColor: '#000',
      shadowOpacity: 0.10,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 4 },
      elevation: 6,
      borderWidth: 1,
      borderColor: '#e5e7eb',
      backgroundColor: gradientColors[0],
    }}>
      {/* Section header and summary toggle */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        marginBottom: 10,
      }}>
        <Text style={{
          fontFamily: fonts.bold,
          fontSize: 20,
          color: categoryColors[title] || colors.primary,
          letterSpacing: 1,
          textShadowColor: '#e5e7eb',
          textShadowOffset: { width: 1, height: 1 },
          textShadowRadius: 2,
        }}>
          {title}
        </Text>
        <TouchableOpacity
          onPress={() => setShowSummary(v => !v)}
          style={{
            paddingHorizontal: 18,
            paddingVertical: 6,
            borderRadius: 999,
            borderWidth: 2,
            marginLeft: 8,
            backgroundColor: '#fff',
            borderColor: categoryColors[title] || colors.primary,
          }}
        >
          <Text style={{
            fontFamily: fonts.bold,
            fontSize: 13,
            color: categoryColors[title] || colors.primary,
            letterSpacing: 0.5,
          }}>
            {showSummary ? 'Hide Summary' : 'Show Summary'}
          </Text>
        </TouchableOpacity>
      </View>
      {showSummary && (
        <View style={{
          backgroundColor: '#fff',
          borderRadius: 16,
          borderWidth: 1,
          borderColor: '#e0e7ef',
          paddingHorizontal: 16,
          paddingVertical: 12,
          marginBottom: 10,
          marginTop: 4,
          alignSelf: 'center',
          width: '98%',
          shadowColor: '#000',
          shadowOpacity: 0.04,
          shadowRadius: 4,
          shadowOffset: { width: 0, height: 1 },
          elevation: 2,
        }}>
          <Text style={{
            fontFamily: fonts.medium,
            fontSize: 15,
            color: '#272829',
            textAlign: 'center',
          }}>{getSummaryPhrase(title, data)}</Text>
        </View>
      )}
      {/* Chart (unchanged) */}
      {chartData.length > 0 ? (
        <View style={{
          width: chartWidth,
          height: chartWidth,
          alignSelf: 'center',
          marginBottom: 8,
          justifyContent: 'center',
        }}>
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
      ) : (
        <Text style={{
          fontFamily: fonts.medium,
          fontSize: 14,
          color: colors.text,
          marginTop: 18,
        }}>
          No data for this category.
        </Text>
      )}
      {/* Total pill under the chart */}
      <View style={{
        alignSelf: 'center',
        marginTop: 4,
        marginBottom: 8,
        backgroundColor: '#fff',
        borderRadius: 999,
        paddingHorizontal: 22,
        paddingVertical: 6,
        borderWidth: 1,
        borderColor: '#e0e7ef',
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowRadius: 2,
        shadowOffset: { width: 0, height: 1 },
        elevation: 2,
      }}>
        <Text style={{
          fontFamily: fonts.bold,
          fontSize: 16,
          color: '#222',
          textAlign: 'center',
        }}>
          {total} <Text style={{ fontWeight: 'bold' }}>total</Text>
        </Text>
      </View>
      {/* List below chart */}
      <View style={{
        marginTop: 10,
        width: chartWidth,
        alignSelf: 'center',
      }}>
        {sortedChartData.map(item => (
          <View key={item.key} style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 12,
            backgroundColor: '#ffffffff',
            borderRadius: 16,
            paddingVertical: 10,
            paddingHorizontal: 14,
            shadowColor: '#000',
            shadowOpacity: 0.05,
            shadowRadius: 4,
            shadowOffset: { width: 0, height: 1 },
            elevation: 2,
            borderWidth: 1,
            borderColor: '#ffffffff',
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
              {category !== 'Sleep' && activityImages[item.key] && (
                <Image
                  source={activityImages[item.key]}
                  style={{
                    width: 36,
                    height: 36,
                    marginRight: 12
                  }}
                  resizeMode="contain"
                />
              )}
              <Text style={{
                fontFamily: fonts.semiBold,
                fontSize: 15,
                color: colors.primary,
                flexShrink: 1,
                textShadowColor: '#e5e7eb',
                textShadowOffset: { width: 1, height: 1 },
                textShadowRadius: 1,
              }}>
                {item.name}
              </Text>
            </View>
            <Text style={{
              fontFamily: fonts.bold,
              fontSize: 14,
              color: colors.primary,
              marginLeft: 14,
            }}>
              {item.count} <Text style={{ color: colors.primary }}>({item.percent}%)</Text>
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

export default function ActivitiesStatistics({ route }) {
  const navigation = useNavigation();
  const { mood, type, period } = route.params;
  const [breakdowns, setBreakdowns] = useState({
    Activity: [],
    Social: [],
    Health: [],
    Sleep: [],
  });
  const [isDownloading, setIsDownloading] = useState(false);

  // Check if data is loaded and not empty
  const isDataReady = () => {
    const totalCount = Object.values(breakdowns).reduce((sum, category) => {
      return sum + category.reduce((catSum, item) => catSum + (item.count || 0), 0);
    }, 0);
    return totalCount > 0;
  };

  // For header subtitle
  function getTypeLabel(type) {
    if (type === 'after') return 'After Emotion';
    if (type === 'before') return 'Before Emotion';
    return '';
  }

function getPeriodLabel(period) {
  if (!period) return '';
  const p = period.toLowerCase();
  if (p === 'daily' || p === 'day') return 'Daily';
  if (p === 'weekly' || p === 'week') return 'Weekly';
  if (p === 'monthly' || p === 'month') return 'Monthly';
  return period.charAt(0).toUpperCase() + period.slice(1);
}

  useEffect(() => {
    async function fetchBreakdown() {
      const result = await moodDataService.getMoodCategoryGroupBreakdown(mood, type, period);
      setBreakdowns(result);
    }
    fetchBreakdown();
  }, [mood, type, period]);

  const handleDownloadPDF = async () => {
    try {
      setIsDownloading(true);
      const result = await downloadActivitiesStatisticsPDF(mood, type, period, breakdowns);
      setIsDownloading(false);
      ToastAndroid.show(`Report downloaded: ${result.filename}`, ToastAndroid.LONG);
    } catch (error) {
      console.error('Error downloading PDF:', error);
      setIsDownloading(false);
      ToastAndroid.show('Failed to download report: ' + error.message, ToastAndroid.LONG);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#fcfcfcff' }}>
      {/* Fixed Header */}
      <View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          paddingTop: 40,
          paddingBottom: 20,
          paddingHorizontal: 16,
          height: 90,
          backgroundColor: '#fcfcfcff',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
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
          style={{
            backgroundColor: colors.primary,
            borderRadius: 999,
            padding: 10,
            width: 44,
            height: 44,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        
        <View style={{ flex: 1, marginLeft: 16 }}>
          <Text style={{
            fontFamily: fonts.bold,
            fontSize: 18,
            color: colors.primary,
            marginBottom: 4,
          }}>
            {mood.charAt(0).toUpperCase() + mood.slice(1)}
          </Text>
          <Text style={{
            fontFamily: fonts.medium,
            fontSize: 11,
            color: colors.text,
            opacity: 0.7,
          }}>
            {getTypeLabel(type)} · {getPeriodLabel(period)}
          </Text>
        </View>
      </View>

    <ScrollView style={{
      flex: 1,
      backgroundColor: '#fcfcfcff',
    }}>
      <View style={{
        alignItems: 'center',
        paddingTop: 120,
        paddingBottom: 0,
        paddingHorizontal: 16,
      }}>
        {/* Download PDF Button */}
        <TouchableOpacity
          onPress={handleDownloadPDF}
          disabled={isDownloading || !isDataReady()}
          style={{
            alignSelf: 'flex-end',
            marginBottom: 16,
            backgroundColor: colors.primary,
            borderRadius: 12,
            paddingVertical: 12,
            paddingHorizontal: 24,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: (isDownloading || !isDataReady()) ? 0.5 : 1,
            shadowColor: '#000',
            shadowOpacity: 0.1,
            shadowRadius: 4,
            shadowOffset: { width: 0, height: 2 },
            elevation: 3,
          }}
        >
          {isDownloading ? (
            <ActivityIndicator size="small" color="#fff" style={{ marginRight: 8 }} />
          ) : (
            <Ionicons name="download-outline" size={18} color="#fff" style={{ marginRight: 8 }} />
          )}
          <Text style={{
            fontFamily: fonts.bold,
            fontSize: 14,
            color: '#fff',
          }}>
            {isDownloading ? 'Exporting...' : !isDataReady() ? 'Loading...' : 'Export PDF'}
          </Text>
        </TouchableOpacity>
      </View>
      
      <View style={{
        alignItems: 'center',
        paddingTop: 8,
        paddingBottom: 20,
      }}>
        <PieSection title="Activity" data={breakdowns.Activity} category="Activity" />
        <PieSection title="Social" data={breakdowns.Social} category="Social" />
        <PieSection title="Health" data={breakdowns.Health} category="Health" />
        {type === 'after' && <PieSection title="Sleep" data={breakdowns.Sleep} category="Sleep" />}
        {type === 'before' && (
          <View style={{
            backgroundColor: '#fff',
            borderRadius: 18,
            padding: 18,
            marginTop: 8,
            width: chartWidth + 32,
            shadowColor: '#000',
            shadowOpacity: 0.07,
            shadowRadius: 8,
            shadowOffset: { width: 0, height: 1 },
            elevation: 2,
            borderWidth: 1,
            borderColor: '#e5e7eb',
          }}>
            <Text style={{
              fontFamily: fonts.medium,
              fontSize: 14,
              color: colors.text,
              textAlign: 'center',
            }}>
              Sleep hours breakdown is only available for 'After' moods.
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
    </View>
  );
}