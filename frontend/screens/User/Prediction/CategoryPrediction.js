import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  Alert,
  Dimensions,
  TouchableOpacity,
  Animated,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { predictionService } from '../../../services/predictionService';
import { colors } from '../../../utils/colors/colors';
import { fonts } from '../../../utils/fonts/fonts';
import emotionImages from '../../../utils/images/emotions';

const { width } = Dimensions.get('window');

const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const categoryInfo = {
  activity: { name: 'Activity', icon: 'fitness', color: '#FF6B6B' },
  social: { name: 'Social', icon: 'people', color: '#4ECDC4' },
  health: { name: 'Health', icon: 'heart', color: '#45B7D1' },
  sleep: { name: 'Sleep', icon: 'moon', color: '#96CEB4' },
};

const CategoryPrediction = ({ navigation, route }) => {
  const { category } = route.params;
  const [loading, setLoading] = useState(false);
  const [predictions, setPredictions] = useState(null);
  const [dateRange, setDateRange] = useState(null);
  const scrollViewRef = useRef(null);
  const dayCardRefs = useRef({});
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const getTodayDayName = () => {
    const today = new Date();
    const dayIndex = today.getDay();
    const adjustedIndex = dayIndex === 0 ? 6 : dayIndex - 1;
    return daysOfWeek[adjustedIndex];
  };

  const [todayDayName] = useState(getTodayDayName());

  const emotionColors = {
    bored: '#95A5A6',
    sad: '#3498DB',
    disappointed: '#E67E22',
    angry: '#E74C3C',
    tense: '#9B59B6',
    calm: '#27AE60',
    relaxed: '#1ABC9C',
    pleased: '#F39C12',
    happy: '#F1C40F',
    excited: '#E91E63',
  };

  useEffect(() => {
    fetchCategoryPrediction();
  }, [category]);

  const fetchCategoryPrediction = async () => {
    setLoading(true);
    try {
      const response = await predictionService.predictCategoryMood(category);

      if (response.success) {
        setPredictions(response.predictions);
        setDateRange(response.dateRange);
        Toast.show({
          type: 'success',
          text1: 'Prediction Generated',
          text2: `${categoryInfo[category].name} prediction is ready!`,
          position: 'top',
        });

        setTimeout(() => {
          scrollToTodayAndAnimate();
        }, 300);
      } else {
        Alert.alert('Error', response.message || 'Failed to generate prediction');
        navigation.goBack();
      }
    } catch (error) {
      console.error('Error generating category prediction:', error);
      Alert.alert('Error', error.message || 'Failed to generate prediction');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const scrollToTodayAndAnimate = () => {
    if (dayCardRefs.current[todayDayName] && scrollViewRef.current) {
      dayCardRefs.current[todayDayName].measureLayout(
        scrollViewRef.current,
        (x, y) => {
          scrollViewRef.current?.scrollTo({
            y: y - 100,
            animated: true,
          });

          Animated.sequence([
            Animated.timing(scaleAnim, {
              toValue: 1.05,
              duration: 300,
              useNativeDriver: true,
            }),
            Animated.timing(scaleAnim, {
              toValue: 1,
              duration: 300,
              useNativeDriver: true,
            }),
          ]).start();
        },
        (error) => {
          console.warn('Error measuring layout:', error);
        }
      );
    }
  };

  const getEmotionColor = (emotion) => {
    return emotionColors[emotion] || colors.primary;
  };

  const getValenceLabel = (valence) => {
    return valence > 0.5 ? 'Positive' : 'Negative';
  };

  const getEmotionImage = (emotion) => {
    return emotionImages[emotion.toLowerCase()] || null;
  };

  const getShortMonthName = (dateString) => {
    if (!dateString || dateString === 'No data available') return dateString;

    const monthMap = {
      'January': 'Jan',
      'February': 'Feb',
      'March': 'Mar',
      'April': 'Apr',
      'May': 'May',
      'June': 'Jun',
      'July': 'Jul',
      'August': 'Aug',
      'September': 'Sep',
      'October': 'Oct',
      'November': 'Nov',
      'December': 'Dec'
    };

    let result = dateString;
    Object.keys(monthMap).forEach(month => {
      result = result.replace(month, monthMap[month]);
    });
    return result;
  };

  const getActivityDisplayName = (activityId) => {
    const activityMap = {
      commute: 'Commute',
      exam: 'Exam',
      homework: 'Homework',
      study: 'Study',
      project: 'Project',
      read: 'Read',
      extracurricular: 'Extracurricular Activities',
      'household-chores': 'Household Chores',
      relax: 'Relax',
      'watch-movie': 'Watch Movie',
      'listen-music': 'Listen to Music',
      gaming: 'Gaming',
      'browse-internet': 'Browse the Internet',
      shopping: 'Shopping',
      travel: 'Travel',
      alone: 'Alone',
      friends: 'Friend/s',
      family: 'Family',
      classmates: 'Classmate/s',
      relationship: 'Relationship',
      online: 'Online Interaction',
      pet: 'Pet',
      jog: 'Jog',
      walk: 'Walk',
      exercise: 'Exercise',
      sports: 'Sports',
      meditate: 'Meditate',
      'eat-healthy': 'Eat Healthy',
      'no-physical': 'No Physical Activity',
      'eat-unhealthy': 'Eat Unhealthy',
      'drink-alcohol': 'Drink Alcohol',
      sleep: 'Sleep Hours'
    };

    return activityMap[activityId] || activityId || 'Unknown Activity';
  };

  const renderDayCard = (day) => {
    const dayData = predictions[day];
    const isToday = day === todayDayName;

    if (!dayData) return null;

    return (
      <Animated.View
        key={day}
        ref={(ref) => {
          if (ref) dayCardRefs.current[day] = ref;
        }}
        style={isToday ? { transform: [{ scale: scaleAnim }] } : {}}
      >
        <View style={{
          backgroundColor: colors.white,
          borderRadius: 12,
          padding: 16,
          marginBottom: 16,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: isToday ? 8 : 3,
          borderWidth: isToday ? 2 : 0,
          borderColor: isToday ? colors.primary : 'transparent',
        }}>
          <View style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 16,
          }}>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={{
                  fontSize: 18,
                  fontFamily: fonts.semiBold,
                  color: colors.text,
                }}>{day}</Text>
                {isToday && (
                  <View style={{
                    backgroundColor: colors.primary,
                    borderRadius: 8,
                    paddingHorizontal: 8,
                    paddingVertical: 2,
                    marginLeft: 12,
                  }}>
                    <Text style={{
                      fontSize: 11,
                      fontFamily: fonts.bold,
                      color: colors.white,
                    }}>Today</Text>
                  </View>
                )}
              </View>
              {dayData.date && dayData.date !== 'No data available' && (
                <Text style={{
                  fontSize: 12,
                  fontFamily: fonts.regular,
                  color: colors.textSecondary,
                  marginTop: 2,
                }}>{getShortMonthName(dayData.date)}</Text>
              )}
            </View>
            {dayData.prediction !== 'No data available' && (
              <View style={{
                backgroundColor: colors.primary,
                borderRadius: 12,
                paddingHorizontal: 8,
                paddingVertical: 4,
              }}>
                <Text style={{
                  fontSize: 12,
                  fontFamily: fonts.medium,
                  color: colors.white,
                }}>
                  {dayData.confidence.toFixed(1)}%
                </Text>
              </View>
            )}
          </View>

          {dayData.prediction === 'No data available' ? (
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              paddingVertical: 20,
            }}>
              <Ionicons name="information-circle" size={24} color={colors.textSecondary} />
              <Text style={{
                fontSize: 14,
                fontFamily: fonts.regular,
                color: colors.textSecondary,
                marginLeft: 8,
              }}>No data for this day</Text>
            </View>
          ) : (
            <View>
              {/* Main Prediction */}
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginBottom: 16,
              }}>
                {getEmotionImage(dayData.prediction) ? (
                  <Image
                    source={getEmotionImage(dayData.prediction)}
                    style={{ width: 32, height: 32, marginRight: 8 }}
                    resizeMode="contain"
                  />
                ) : (
                  <Text style={{ fontSize: 20, marginRight: 12 }}>😐</Text>
                )}
                <Text style={{
                  fontSize: 16,
                  fontFamily: fonts.semiBold,
                  color: colors.text,
                  textTransform: 'capitalize',
                }}>{dayData.prediction}</Text>
              </View>

              {/* Valence and Activity */}
              <View style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                marginBottom: 16,
              }}>
                <View style={{ flex: 1 }}>
                  <Text style={{
                    fontSize: 12,
                    fontFamily: fonts.regular,
                    color: colors.textSecondary,
                    marginBottom: 4,
                  }}>Valence:</Text>
                  <Text style={{
                    fontSize: 14,
                    fontFamily: fonts.medium,
                    color: colors.text,
                  }}>
                    {getValenceLabel(dayData.valence_avg)}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{
                    fontSize: 12,
                    fontFamily: fonts.regular,
                    color: colors.textSecondary,
                    marginBottom: 4,
                  }}>Likely Cause:</Text>
                  <Text style={{
                    fontSize: 14,
                    fontFamily: fonts.medium,
                    color: colors.text,
                  }}>
                    {category === 'sleep'
                      ? `${dayData.activity || 'Unknown'} hours of sleep`
                      : getActivityDisplayName(dayData.activity)
                    }
                  </Text>
                </View>
              </View>

              {/* Emotion Breakdown */}
              <View style={{
                borderTopWidth: 1,
                borderTopColor: colors.lightGray,
                paddingTop: 16,
              }}>
                <Text style={{
                  fontSize: 14,
                  fontFamily: fonts.semiBold,
                  color: colors.text,
                  marginBottom: 12,
                }}>Emotion Probabilities:</Text>
                <View>
                  {Object.entries(dayData.emotion_breakdown || {})
                    .filter(([_, probability]) => probability > 0)
                    .sort(([_, a], [__, b]) => b - a)
                    .slice(0, 3)
                    .map(([emotion, probability]) => (
                      <View key={emotion} style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        marginBottom: 8,
                      }}>
                        {getEmotionImage(emotion) ? (
                          <Image
                            source={getEmotionImage(emotion)}
                            style={{
                              width: 22,
                              height: 22,
                              marginRight: 6,
                              opacity: emotion.toLowerCase() === dayData.prediction.toLowerCase() ? 1 : 0.6
                            }}
                            resizeMode="contain"
                          />
                        ) : (
                          <View style={{
                            width: 12,
                            height: 12,
                            borderRadius: 6,
                            marginRight: 8,
                            backgroundColor: categoryInfo[category].color,
                            opacity: emotion.toLowerCase() === dayData.prediction.toLowerCase() ? 1 : 0.6
                          }} />
                        )}
                        <Text style={{
                          flex: 1,
                          fontSize: 13,
                          fontFamily: fonts.regular,
                          color: colors.text,
                          textTransform: 'capitalize',
                        }}>{emotion}</Text>
                        <Text style={{
                          fontSize: 13,
                          fontFamily: fonts.medium,
                          color: colors.textSecondary,
                        }}>
                          {probability.toFixed(1)}%
                        </Text>
                      </View>
                    ))
                  }
                </View>
              </View>
            </View>
          )}
        </View>
      </Animated.View>
    );
  };

  const renderDataRangeInfo = () => {
    if (!dateRange) return null;

    return (
      <View style={{
        backgroundColor: colors.white,
        margin: 20,
        marginBottom: 10,
        padding: 16,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
      }}>
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 8,
        }}>
          <Ionicons name="calendar" size={20} color={colors.primary} />
          <Text style={{
            fontSize: 16,
            fontFamily: fonts.semiBold,
            color: colors.text,
            marginLeft: 8,
          }}>Date Range</Text>
        </View>
        <Text style={{
          fontSize: 14,
          fontFamily: fonts.regular,
          color: colors.text,
          lineHeight: 20,
          textAlign: 'center',
        }}>
          Based on {dateRange.total_entries} entries from <Text style={{ color: colors.primary, fontFamily: fonts.semiBold }}>{dateRange.formatted_range}</Text>
        </Text>
        <Text style={{
          fontSize: 12,
          fontFamily: fonts.regular,
          color: colors.textSecondary,
          marginTop: 4,
          textAlign: 'center',
        }}>
          {dateRange.weeks_of_data} weeks of data analyzed
        </Text>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.background,
      }}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{
          fontSize: 16,
          fontFamily: fonts.regular,
          color: colors.text,
          marginTop: 16,
        }}>Generating prediction...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View style={{
        paddingTop: 50,
        paddingBottom: 20,
        paddingHorizontal: 20,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: categoryInfo[category].color,
      }}>
        <TouchableOpacity
          style={{ padding: 8, marginRight: 16 }}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.white} />
        </TouchableOpacity>

        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
          <Text style={{
            fontSize: 20,
            fontFamily: fonts.bold,
            color: colors.white,
            marginLeft: 12,
          }}>{categoryInfo[category].name} Prediction</Text>
        </View>
      </View>

      <ScrollView ref={scrollViewRef} style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        {renderDataRangeInfo()}

        <View style={{ padding: 20, paddingTop: 10 }}>
          <Text style={{
            fontSize: 22,
            fontFamily: fonts.semiBold,
            color: colors.text,
            marginTop: 5,
            marginBottom: 8,
            textAlign: 'center',
          }}>Weekly Mood Predictions</Text>
          <Text style={{
            fontSize: 14,
            fontFamily: fonts.regular,
            color: colors.textSecondary,
            marginBottom: 20,
            textAlign: 'center',
          }}>
            How you might feel during {categoryInfo[category].name.toLowerCase()} activities
          </Text>

          {predictions && daysOfWeek.map(renderDayCard)}
        </View>

        <View style={{ padding: 20, paddingTop: 0 }}>
          <View style={{
            backgroundColor: colors.lightBlue,
            borderRadius: 12,
            padding: 16,
            flexDirection: 'row',
            alignItems: 'flex-start',
          }}>
            <Ionicons name="information-circle" size={24} color={colors.primary} />
            <Text style={{
              fontSize: 12,
              fontFamily: fonts.regular,
              color: colors.text,
              marginLeft: 12,
              flex: 1,
              lineHeight: 10,
              textAlign: 'justify',
            }}>
              Predictions are based on your historical mood patterns during {categoryInfo[category].name.toLowerCase()} activities. 
              The confidence percentage indicates how reliable the prediction is based on your data patterns.
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default CategoryPrediction;