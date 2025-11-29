import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Dimensions, ScrollView, Image } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { moodDataService } from '../../../services/moodDataService';
import { colors } from '../../../utils/colors/colors';
import { fonts } from '../../../utils/fonts/fonts';
import excellentImg from '../../../assets/images/mood/sleep/excellent.png';
import goodImg from '../../../assets/images/mood/sleep/good.png';
import lowImg from '../../../assets/images/mood/sleep/low.png';
import criticalImg from '../../../assets/images/mood/sleep/critical.png';

const screenWidth = Dimensions.get('window').width;
const chartWidth = screenWidth * 1;

function formatDate(date) {
  const d = new Date(date);
  const monthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];
  return `${monthNames[d.getMonth()]}. ${d.getDate()}`;
}

function getPeriodText(period) {
  if (period === 'week') return 'this week';
  if (period === 'month') return 'this month';
  return period;
}

function getSleepGuide(avgSleep) {
  if (avgSleep >= 8 && avgSleep <= 10) {
    return {
      label: 'Excellent',
      color: '#DFF7EC',
      borderColor: '#59AC77',
      icon: '🌞',
      hours: '8-10 hours',
      desc: 'Perfect for school',
      barColor: '#59AC77',
      textColor: '#218838',
      barPercent: 1,
    };
  } else if (avgSleep >= 7 && avgSleep < 8) {
    return {
      label: 'Good',
      color: '#FFF9E3',
      borderColor: '#FFD600',
      icon: '😊',
      hours: '7-8 hours',
      desc: 'Still manageable',
      barColor: '#FFD600',
      textColor: '#B8860B',
      barPercent: 0.7,
    };
  } else if (avgSleep >= 6 && avgSleep < 7) {
    return {
      label: 'Low',
      color: '#FFEFE3',
      borderColor: '#FF714B',
      icon: '😴',
      hours: '6-7 hours',
      desc: 'May affect focus',
      barColor: '#FF714B',
      textColor: '#FF714B',
      barPercent: 0.4,
    };
  } else {
    return {
      label: 'Critical',
      color: '#FFE3E3',
      borderColor: '#FF6347',
      icon: '😵',
      hours: '<6 hours',
      desc: 'Impacts grades',
      barColor: '#FF6347',
      textColor: '#B22222',
      barPercent: 0.2,
    };
  }
}

export default function SleepAnalysis() {
  const [period, setPeriod] = useState('month');
  const [trend, setTrend] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTrend() {
      setLoading(true);
      const data = await moodDataService.getSleepHoursTrend(period);
      setTrend(data.filter(item => item.hrs > 0));
      setLoading(false);
    }
    fetchTrend();
  }, [period]);


  const avgSleep = trend.length ? (trend.reduce((a, b) => a + b.hrs, 0) / trend.length).toFixed(1) : 0;
  const bestDay = trend.reduce((max, cur) => cur.hrs > max.hrs ? cur : max, { hrs: 0 });
  const leastDay = trend.reduce((min, cur) => cur.hrs < min.hrs ? cur : min, { hrs: 99 });
  const [chartPage, setChartPage] = useState(0);
  const PAGE_SIZE = 5;
  const pagedTrend = trend.slice(chartPage * PAGE_SIZE, (chartPage + 1) * PAGE_SIZE);
  const totalPages = Math.ceil(trend.length / PAGE_SIZE);

  const guides = [
    {
      label: 'Excellent',
      color: '#DFF7EC',
      borderColor: '#59AC77',
      image: excellentImg,
      hours: '8-10 hours',
      desc: 'Perfect for school',
      barColor: '#59AC77',
      textColor: '#218838',
      barPercent: 1,
    },
    {
      label: 'Good',
      color: '#FFF9E3',
      borderColor: '#FFD600',
      image: goodImg,
      hours: '7-8 hours',
      desc: 'Still manageable',
      barColor: '#FFD600',
      textColor: '#B8860B',
      barPercent: 0.7,
    },
    {
      label: 'Low',
      color: '#FFEFE3',
      borderColor: '#FF714B',
      image: lowImg,
      hours: '6-7 hours',
      desc: 'May affect focus',
      barColor: '#FF714B',
      textColor: '#FF714B',
      barPercent: 0.4,
    },
    {
      label: 'Critical',
      color: '#FFE3E3',
      borderColor: '#FF6347',
      image: criticalImg,
      hours: '<6 hours',
      desc: 'Impacts grades',
      barColor: '#FF6347',
      textColor: '#B22222',
      barPercent: 0.2,
    },
  ];


  const userGuide = getSleepGuide(Number(avgSleep));


  return (
    <View style={{
      marginHorizontal: 16,
    }}>
        <View style={{
          backgroundColor: '#fff',
          borderRadius: 24,
          padding: 20,
          width: '100%',
          shadowColor: '#000',
          shadowOpacity: 0.08,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: 2 },
          elevation: 4,
        }}>
          {/* Header */}
          <View style={{ marginBottom: 14, alignItems: 'center', justifyContent: 'center' }}>
            <Text
              style={{
                fontFamily: fonts.bold,
                fontSize: 22,
                color: colors.primary,
                marginBottom: 2,
                textAlign: 'center',
              }}
            >
              Sleep Analysis
            </Text>
            <Text
              style={{
                fontFamily: fonts.medium,
                fontSize: 14,
                color: colors.text,
                opacity: 0.7,
                textAlign: 'center',
                lineHeight: 20,
              }}
            >
              Track your sleep hours and patterns
            </Text>
          </View>

          {/* Toggle */}
          <View style={{
            flexDirection: 'row',
            justifyContent: 'center',
            marginBottom: 14,
          }}>
            <View style={{
              flexDirection: 'row',
              backgroundColor: '#f3f4f6',
              padding: 2,
              borderRadius: 999,
            }}>
              {['week', 'month'].map(opt => (
                <TouchableOpacity
                  key={opt}
                  onPress={() => {
                    setPeriod(opt);
                    setChartPage(0); 
                  }}
                  style={{
                    backgroundColor: period === opt ? '#6FC3B2' : 'transparent',
                    borderRadius: 999,
                    paddingVertical: 6,
                    paddingHorizontal: 18,
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
                    {opt === 'week' ? 'Weekly' : 'Monthly'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Stat Cards */}
          <View style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            marginBottom: 14,
            gap: 8,
          }}>
            <View style={{
              backgroundColor: '#E6F7F2',
              borderRadius: 16,
              paddingVertical: 16,
              paddingHorizontal: 10,
              alignItems: 'center',
              flex: 1,
              elevation: 2,
              justifyContent: 'center',
            }}>
              <Text style={{
                fontFamily: fonts.bold,
                fontSize: 22,
                color: '#3CB371',
                marginBottom: 2,
                textAlign: 'center',
              }}>{avgSleep}h</Text>
              <Text style={{
                fontFamily: fonts.medium,
                fontSize: 12,
                color: colors.text,
                opacity: 0.7,
                textAlign: 'center',
                lineHeight: 16,
              }}>Average Sleep</Text>
            </View>
            <View style={{
              backgroundColor: '#F0FFF0',
              borderRadius: 16,
              paddingVertical: 16,
              paddingHorizontal: 10,
              alignItems: 'center',
              flex: 1,
              elevation: 2,
              justifyContent: 'center',
            }}>
              <Text style={{
                fontFamily: fonts.bold,
                fontSize: 16,
                color: '#3CB371',
                marginBottom: 2,
                textAlign: 'center',
              }}>{bestDay.date ? formatDate(bestDay.date) : '--'}</Text>
              <Text style={{
                fontFamily: fonts.medium,
                fontSize: 12,
                color: colors.text,
                opacity: 0.7,
                textAlign: 'center',
                lineHeight: 16,
              }}>Best Day</Text>
              <Text style={{
                fontFamily: fonts.semiBold,
                fontSize: 13,
                color: '#3CB371',
                marginTop: 2,
                textAlign: 'center',
              }}>{bestDay.hrs ? `${bestDay.hrs}h` : '--'}</Text>
            </View>
            <View style={{
              backgroundColor: '#FFF0F0',
              borderRadius: 16,
              paddingVertical: 16,
              paddingHorizontal: 10,
              alignItems: 'center',
              flex: 1,
              elevation: 2,
              justifyContent: 'center',
            }}>
              <Text style={{
                fontFamily: fonts.bold,
                fontSize: 16,
                color: '#FF6347',
                marginBottom: 2,
                textAlign: 'center',
              }}>{leastDay.date ? formatDate(leastDay.date) : '--'}</Text>
              <Text style={{
                fontFamily: fonts.medium,
                fontSize: 12,
                color: colors.text,
                opacity: 0.7,
                textAlign: 'center',
                lineHeight: 16,
              }}>Least Day</Text>
              <Text style={{
                fontFamily: fonts.semiBold,
                fontSize: 13,
                color: '#FF6347',
                marginTop: 2,
                textAlign: 'center',
              }}>{leastDay.hrs !== 99 ? `${leastDay.hrs}h` : '--'}</Text>
            </View>
          </View>

          {/* Line Chart */}
          <View style={{
            backgroundColor: '#F8F8FF',
            borderRadius: 16,
            padding: 16,
            marginTop: 12,
            marginBottom: 12,
            shadowColor: '#000',
            shadowOpacity: 0.06,
            shadowRadius: 6,
            shadowOffset: { width: 0, height: 1 },
            elevation: 2,
            width: '100%',
            alignSelf: 'center',
          }}>
            <Text style={{
              fontFamily: fonts.bold,
              fontSize: 16,
              color: colors.primary,
              marginBottom: 12,
              textAlign: 'center',
            }}>Sleep Trend</Text>
            {loading ? (
              <Text style={{
                fontFamily: fonts.medium,
                fontSize: 15,
                color: colors.text,
                textAlign: 'center',
                marginTop: 18,
              }}>Loading...</Text>
            ) : trend.length === 0 ? (
              <Text style={{
                fontFamily: fonts.medium,
                fontSize: 15,
                color: colors.text,
                textAlign: 'center',
                marginTop: 18,
              }}>No sleep data for this period.</Text>
            ) : (
              <>
                <LineChart
                  data={{
                    labels: pagedTrend.map(item => formatDate(item.date)),
                    datasets: [{ data: pagedTrend.map(item => item.hrs) }]
                  }}
                  width={chartWidth * 0.85 - 16}
                  height={190}
                  yAxisSuffix="h"
                  yAxisInterval={1}
                  chartConfig={{
                    backgroundColor: '#F8F8FF',
                    backgroundGradientFrom: '#F8F8FF',
                    backgroundGradientTo: '#F8F8FF',
                    decimalPlaces: 1,
                    color: (opacity = 1) => `rgba(67, 205, 131, ${opacity})`,
                    labelColor: (opacity = 1) => `rgba(44, 62, 80, ${opacity})`,
                    style: { borderRadius: 16 },
                    propsForDots: {
                      r: '5',
                      strokeWidth: '2',
                      stroke: '#3CB371',
                    },
                  }}
                  bezier
                  style={{
                    marginVertical: 8,
                    borderRadius: 16,
                    alignSelf: 'center',
                  }}
                />
                {trend.length > PAGE_SIZE && (
                  <View style={{
                    flexDirection: 'row',
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginTop: 10,
                    marginBottom: 2,
                  }}>
                    <TouchableOpacity
                      onPress={() => setChartPage(p => Math.max(0, p - 1))}
                      disabled={chartPage === 0}
                      style={{
                        opacity: chartPage === 0 ? 0.3 : 1,
                        padding: 6,
                        marginHorizontal: 10,
                      }}
                    >
                      <Text style={{ fontSize: 24, color: colors.primary }}>{'←'}</Text>
                    </TouchableOpacity>
                    <Text style={{
                      fontFamily: fonts.medium,
                      fontSize: 13,
                      color: colors.primary,
                      marginHorizontal: 8,
                    }}>
                      {chartPage + 1} of {totalPages}
                    </Text>
                    <TouchableOpacity
                      onPress={() => setChartPage(p => Math.min(totalPages - 1, p + 1))}
                      disabled={chartPage >= totalPages - 1}
                      style={{
                        opacity: chartPage >= totalPages - 1 ? 0.3 : 1,
                        padding: 6,
                        marginHorizontal: 10,
                      }}
                    >
                      <Text style={{ fontSize: 24, color: colors.primary }}>{'→'}</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </>
            )}
          </View>

          {/* Sleep Guide Title */}
          <Text style={{
            fontFamily: fonts.bold,
            fontSize: 16,
            color: colors.primary,
            marginBottom: 12,
            marginTop: 12,
            textAlign: 'center',
          }}>
            Sleep Guide 
          </Text>

        
          <View style={{ marginBottom: 0 }}>
            {guides.map((guide, idx) => (
              <View
                key={guide.label}
                style={{
                  backgroundColor: guide.color,
                  borderRadius: 14,
                  borderWidth: 2,
                  borderColor: guide.borderColor,
                  paddingVertical: 12,
                  paddingHorizontal: 12,
                  alignItems: 'center',
                  marginBottom: idx === guides.length - 1 ? 0 : 10,
                  width: '100%',
                  elevation: 2,
                  flexDirection: 'row',
                  minHeight: 56,
                }}
              >
                <Image
                  source={guide.image}
                  style={{ width: 36, height: 36, marginRight: 12 }}
                  resizeMode="contain"
                />
                <View style={{ flex: 1 }}>
                  <Text style={{
                    fontFamily: fonts.bold,
                    fontSize: 14,
                    color: guide.textColor,
                    marginBottom: 2,
                  }}>{guide.label}</Text>
                  <Text style={{
                    fontFamily: fonts.medium,
                    fontSize: 12,
                    color: colors.text,
                    marginBottom: 2,
                  }}>{guide.hours}</Text>
                  <Text style={{
                    fontFamily: fonts.medium,
                    fontSize: 11,
                    color: colors.text,
                    opacity: 0.7,
                    marginBottom: 4,
                  }}>{guide.desc}</Text>
                  <View style={{
                    height: 5,
                    width: `${guide.barPercent * 100}%`,
                    backgroundColor: guide.barColor,
                    borderRadius: 3,
                    marginTop: 2,
                    alignSelf: 'flex-start',
                  }} />
                </View>
              </View>
            ))}
          </View>
        </View>
    </View>
  );
}