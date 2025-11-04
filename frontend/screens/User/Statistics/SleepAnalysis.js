import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Dimensions, ScrollView } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { moodDataService } from '../../../services/moodDataService';
import { colors } from '../../../utils/colors/colors';
import { fonts } from '../../../utils/fonts/fonts';

const screenWidth = Dimensions.get('window').width;
const chartWidth = screenWidth * 0.92;

function formatDate(date) {
  const d = new Date(date);
  const monthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];
  return `${monthNames[d.getMonth()]}. ${d.getDate()}`;
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

  // Stats
  const avgSleep = trend.length ? (trend.reduce((a, b) => a + b.hrs, 0) / trend.length).toFixed(1) : 0;
  const bestDay = trend.reduce((max, cur) => cur.hrs > max.hrs ? cur : max, { hrs: 0 });
  const leastDay = trend.reduce((min, cur) => cur.hrs < min.hrs ? cur : min, { hrs: 99 });

  return (
    <ScrollView style={{ backgroundColor: colors.background }}>
      <View style={{
        marginTop: 28,
        marginBottom: 18,
        alignItems: 'center',
      }}>
        <View style={{
          backgroundColor: '#fff',
          borderRadius: 28,
          padding: 22,
          width: chartWidth,
          shadowColor: '#000',
          shadowOpacity: 0.08,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: 2 },
          elevation: 4,
        }}>
          {/* Header */}
          <View style={{ marginBottom: 18, alignItems: 'center', justifyContent: 'center' }}>
            <Text
              style={{
                fontFamily: fonts.bold,
                fontSize: 24,
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
                fontSize: 15,
                color: colors.text,
                opacity: 0.7,
                textAlign: 'center',
              }}
            >
              Track your sleep hours and patterns
            </Text>
          </View>

          {/* Toggle */}
          <View style={{
            flexDirection: 'row',
            justifyContent: 'center',
            marginBottom: 18,
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
                  onPress={() => setPeriod(opt)}
                  style={{
                    backgroundColor: period === opt ? '#6FC3B2' : 'transparent',
                    borderRadius: 999,
                    paddingVertical: 8,
                    paddingHorizontal: 24,
                    marginHorizontal: 2,
                    elevation: period === opt ? 2 : 0,
                  }}
                >
                  <Text style={{
                    color: period === opt ? '#fff' : colors.primary,
                    fontFamily: fonts.semiBold,
                    fontSize: 16,
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
            marginBottom: 18,
          }}>
            <View style={{
              backgroundColor: '#E6F7F2',
              borderRadius: 18,
              paddingVertical: 18,
              paddingHorizontal: 10,
              alignItems: 'center',
              flex: 1,
              marginRight: 8,
              elevation: 2,
              justifyContent: 'center',
            }}>
              <Text style={{
                fontFamily: fonts.bold,
                fontSize: 24,
                color: '#3CB371',
                marginBottom: 2,
                textAlign: 'center',
              }}>{avgSleep}h</Text>
              <Text style={{
                fontFamily: fonts.medium,
                fontSize: 14,
                color: colors.text,
                opacity: 0.7,
                textAlign: 'center',
              }}>Average Sleep</Text>
            </View>
            <View style={{
              backgroundColor: '#F0FFF0',
              borderRadius: 18,
              paddingVertical: 18,
              paddingHorizontal: 10,
              alignItems: 'center',
              flex: 1,
              marginHorizontal: 4,
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
                fontSize: 14,
                color: colors.text,
                opacity: 0.7,
                textAlign: 'center',
              }}>Best Sleep Day</Text>
              <Text style={{
                fontFamily: fonts.semiBold,
                fontSize: 15,
                color: '#3CB371',
                marginTop: 2,
                textAlign: 'center',
              }}>{bestDay.hrs ? `${bestDay.hrs}h` : '--'}</Text>
            </View>
            <View style={{
              backgroundColor: '#FFF0F0',
              borderRadius: 18,
              paddingVertical: 18,
              paddingHorizontal: 10,
              alignItems: 'center',
              flex: 1,
              marginLeft: 8,
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
                fontSize: 14,
                color: colors.text,
                opacity: 0.7,
                textAlign: 'center',
              }}>Least Sleep Day</Text>
              <Text style={{
                fontFamily: fonts.semiBold,
                fontSize: 15,
                color: '#FF6347',
                marginTop: 2,
                textAlign: 'center',
              }}>{leastDay.hrs !== 99 ? `${leastDay.hrs}h` : '--'}</Text>
            </View>
          </View>

          {/* Line Chart */}
          <View style={{
            backgroundColor: '#F8F8FF',
            borderRadius: 20,
            padding: 18,
            marginTop: 8,
            marginBottom: 8,
            shadowColor: '#000',
            shadowOpacity: 0.06,
            shadowRadius: 6,
            shadowOffset: { width: 0, height: 1 },
            elevation: 2,
            width: chartWidth * 0.85, // Make chart container same width as main container
            alignSelf: 'center',
          }}>
            <Text style={{
              fontFamily: fonts.bold,
              fontSize: 18,
              color: colors.primary,
              marginBottom: 10,
              textAlign: 'center',
            }}>Sleep Hours Trend</Text>
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
              <LineChart
                data={{
                  labels: trend.map(item => formatDate(item.date)),
                  datasets: [{ data: trend.map(item => item.hrs) }]
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
            )}
          </View>
        </View>
      </View>
    </ScrollView>
  );
}