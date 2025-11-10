import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Dimensions, Image, TouchableOpacity } from 'react-native';
import { PieChart } from 'react-native-chart-kit';
import { useNavigation } from '@react-navigation/native';
import { moodDataService } from '../../../services/moodDataService';
import { colors } from '../../../utils/colors/colors';
import { fonts } from '../../../utils/fonts/fonts';

const screenWidth = Dimensions.get('window').width;
const chartWidth = screenWidth * 0.78;

const pieColors = [
  '#8FABD4', '#59AC77', '#FF714B', '#f7b40bff', '#F564A9',
  '#A9A9A9', '#092b9cff', '#4e4d4dff', '#cc062dff', '#fdf8fdff'
];

const activityImages = {
  commute: require('../../../assets/images/mood/commute.png'),
  exam: require('../../../assets/images/mood/exam.png'),
  homework: require('../../../assets/images/mood/homework.png'),
  project: require('../../../assets/images/mood/project.png'),
  study: require('../../../assets/images/mood/study.png'),
  read: require('../../../assets/images/mood/read.png'),
  extracurricular: require('../../../assets/images/mood/extraCurricularActivities.png'),
  'household-chores': require('../../../assets/images/mood/householdChores.png'),
  relax: require('../../../assets/images/mood/relax.png'),
  'watch-movie': require('../../../assets/images/mood/watchMovie.png'),
  'listen-music': require('../../../assets/images/mood/listenToMusic.png'),
  gaming: require('../../../assets/images/mood/gaming.png'),
  'browse-internet': require('../../../assets/images/mood/browseInternet.png'),
  shopping: require('../../../assets/images/mood/shopping.png'),
  travel: require('../../../assets/images/mood/travel.png'),
  alone: require('../../../assets/images/mood/alone.png'),
  friends: require('../../../assets/images/mood/friend.png'),
  family: require('../../../assets/images/mood/family.png'),
  classmates: require('../../../assets/images/mood/classmate.png'),
  relationship: require('../../../assets/images/mood/relationship.png'),
  online: require('../../../assets/images/mood/onlineInteraction.png'),
  pet: require('../../../assets/images/mood/pet.png'),
  jog: require('../../../assets/images/mood/jog.png'),
  walk: require('../../../assets/images/mood/walk.png'),
  exercise: require('../../../assets/images/mood/exercise.png'),
  sports: require('../../../assets/images/mood/sports.png'),
  meditate: require('../../../assets/images/mood/meditate.png'),
  'eat-healthy': require('../../../assets/images/mood/eatHealthy.png'),
  'no-physical': require('../../../assets/images/mood/noPhysicalActivity.png'),
  'eat-unhealthy': require('../../../assets/images/mood/eatUnhealthy.png'),
  'drink-alcohol': require('../../../assets/images/mood/drinkAlcohol.png')
};

function beautifyName(name) {
  if (!name) return '';
  let str = name.replace(/-/g, ' ');
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function PieSection({ title, data, category }) {
  const total = data.reduce((a, b) => a + b.count, 0);
  const chartData = data.map((item, idx) => ({
    name: beautifyName(item.name),
    population: item.count,
    color: pieColors[idx % pieColors.length],
    legendFontColor: colors.text,
    legendFontSize: 15,
    percent: item.percent,
    key: item.name,
  }));

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
    <View style={{
      marginBottom: 36,
      alignItems: 'center',
      backgroundColor: '#fff',
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
    }}>
      <Text style={{
        fontFamily: fonts.bold,
        fontSize: 24,
        color: colors.primary,
        marginBottom: 14,
        letterSpacing: 1,
        textShadowColor: '#e5e7eb',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 2,
      }}>
        {title}
      </Text>
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
          fontSize: 16,
          color: colors.text,
          marginTop: 18,
        }}>
          No data for this category.
        </Text>
      )}
      <View style={{
        marginTop: 18,
        width: chartWidth,
        alignSelf: 'center',
      }}>
        {chartData.map(item => (
          <View key={item.key} style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 12,
            backgroundColor: '#f7fafc',
            borderRadius: 16,
            paddingVertical: 10,
            paddingHorizontal: 14,
            shadowColor: '#000',
            shadowOpacity: 0.05,
            shadowRadius: 4,
            shadowOffset: { width: 0, height: 1 },
            elevation: 2,
            borderWidth: 1,
            borderColor: '#e5e7eb',
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
              {category !== 'Sleep' && activityImages[item.key] && (
                <Image
                  source={activityImages[item.key]}
                  style={{
                    width: 36,
                    height: 36,
                    marginRight: 12,
                    borderRadius: 10,
                    backgroundColor: '#fff',
                  }}
                  resizeMode="contain"
                />
              )}
              <Text style={{
                fontFamily: fonts.semiBold,
                fontSize: 17,
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
              fontSize: 17,
              color: colors.text,
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

  useEffect(() => {
    async function fetchBreakdown() {
      const result = await moodDataService.getMoodCategoryGroupBreakdown(mood, type, period);
      setBreakdowns(result);
    }
    fetchBreakdown();
  }, [mood, type, period]);

  return (
    <ScrollView style={{
      flex: 1,
      backgroundColor: colors.background,
      paddingTop: 0,
    }}>
      <View style={{
        alignItems: 'center',
        marginTop: 28,
        paddingBottom: 36,
      }}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{
            position: 'absolute',
            left: 18,
            top: 10,
            zIndex: 10
          }}
          activeOpacity={0.7}
        >
          <Text
            style={{
              fontSize: 28,
              color: colors.text,
              fontFamily: fonts.semiBold,
              textAlign: 'center',
            }}
          >
            ←
          </Text>
        </TouchableOpacity>
        <Text style={{
          fontFamily: fonts.bold,
          fontSize: 28,
          color: colors.primary,
          marginBottom: 22,
          letterSpacing: 1.5,
          textShadowColor: '#e5e7eb',
          textShadowOffset: { width: 1, height: 1 },
          textShadowRadius: 2,
        }}>
          {mood.charAt(0).toUpperCase() + mood.slice(1)} Breakdown
        </Text>
        <PieSection title="Activity" data={breakdowns.Activity} category="Activity" />
        <PieSection title="Social" data={breakdowns.Social} category="Social" />
        <PieSection title="Health" data={breakdowns.Health} category="Health" />
        {type === 'after' && <PieSection title="Sleep Hours" data={breakdowns.Sleep} category="Sleep" />}
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
              fontSize: 16,
              color: colors.text,
              textAlign: 'center',
            }}>
              Sleep hours breakdown is only available for 'After' moods.
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}