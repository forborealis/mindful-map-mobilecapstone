import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  ActivityIndicator,
  Modal,
  Image,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { fonts } from '../../utils/fonts/fonts';
import { colors } from '../../utils/colors/colors';
import { moodDataService } from '../../services/moodDataService';

export default function Calendar() {
  const [moodLogs, setMoodLogs] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation();
  
  // Streak state
  const [streakModalOpen, setStreakModalOpen] = useState(false);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [weeklyStreak, setWeeklyStreak] = useState(0);
  const [previousWeekStreak, setPreviousWeekStreak] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);
  const [weeklyProgress, setWeeklyProgress] = useState([false, false, false, false, false, false, false]);
  const [monthlyCompletion, setMonthlyCompletion] = useState(0);

  // Emotion mapping
  const emotionMap = {
    // Negative emotions
    bored: { emoji: '😑', label: 'Bored' },
    sad: { emoji: '😢', label: 'Sad' },
    disappointed: { emoji: '😞', label: 'Disappointed' },
    angry: { emoji: '😠', label: 'Angry' },
    tense: { emoji: '😰', label: 'Tense' },
    // Positive emotions
    calm: { emoji: '😌', label: 'Calm' },
    relaxed: { emoji: '😊', label: 'Relaxed' },
    pleased: { emoji: '🙂', label: 'Pleased' },
    happy: { emoji: '😄', label: 'Happy' },
    excited: { emoji: '🤩', label: 'Excited' }
  };

  // Helper function to determine if an emotion is positive or negative
  const getEmotionPolarity = (emotion) => {
    const negativeEmotions = ['bored', 'sad', 'disappointed', 'angry', 'tense'];
    const positiveEmotions = ['calm', 'relaxed', 'pleased', 'happy', 'excited'];
    
    if (negativeEmotions.includes(emotion)) return 'negative';
    if (positiveEmotions.includes(emotion)) return 'positive';
    return 'neutral'; // fallback
  };

  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  // Fetch mood logs when component mounts or refocuses
  useFocusEffect(
    React.useCallback(() => {
      fetchMoodLogs();
    }, [currentMonth, currentYear])
  );

  const fetchMoodLogs = async () => {
    try {
      setLoading(true);
      // Try to fetch ALL mood logs - set a very high limit and check if the backend is limiting results
      const result = await moodDataService.getUserMoodLogs({
        limit: 999999, // Very high limit to get all records
        page: 1
      });
      if (result.success) {
        console.log('Fetched mood logs count:', result.moodLogs.length);
        if (result.moodLogs.length > 0) {
          console.log('Date range:', {
            earliest: new Date(Math.min(...result.moodLogs.map(log => new Date(log.date)))),
            latest: new Date(Math.max(...result.moodLogs.map(log => new Date(log.date))))
          });
        }
        setMoodLogs(result.moodLogs);
        calculateStreaks(result.moodLogs);
      } else {
        console.error('Error fetching mood logs:', result.error);
        Alert.alert('Error', 'Failed to load mood data. Please try again.');
      }
    } catch (error) {
      console.error('Error fetching mood logs:', error);
      Alert.alert('Error', 'Failed to load mood data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Helper function to check if a specific date has a log
  const hasLogForDate = (date, logs) => {
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);
    
    return logs.some(log => {
      const logDate = new Date(log.date);
      logDate.setHours(0, 0, 0, 0);
      return logDate.getTime() === targetDate.getTime();
    });
  };

  // Calculate streaks from mood logs
  const calculateStreaks = (logs) => {
    if (!logs.length) return;

    // Sort logs by date
    const sortedLogs = [...logs].sort((a, b) => new Date(a.date) - new Date(b.date));
    
    // Get today's date
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Check if today has a log
    const hasLoggedToday = hasLogForDate(today, logs);
    
    // Get the Monday of current week
    const startOfWeek = new Date(today);
    const dayOfWeek = today.getDay(); // 0 (Sunday) to 6 (Saturday)
    const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    startOfWeek.setDate(today.getDate() - daysToSubtract);
    startOfWeek.setHours(0, 0, 0, 0);
    
    // Calculate current streak
    let streak = 0;
    let currentDate = new Date(today);
    
    // If today doesn't have a log, start counting from yesterday
    if (!hasLoggedToday) {
      currentDate.setDate(currentDate.getDate() - 1);
    }
    
    // Count streak days going backwards
    while (true) {
      if (hasLogForDate(currentDate, logs)) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        break;
      }
    }
    
    // Weekly progress - Monday to Sunday
    const weekProgress = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      
      // Only include days up to today (don't mark future days)
      const isPastOrToday = day <= today;
      const hasLog = hasLogForDate(day, logs);
      
      // Day is only completed if it has a log and is not a future day
      weekProgress.push(isPastOrToday && hasLog);
    }
    
    // Calculate longest streak
    let currentLongestStreak = 0;
    let tempStreak = 0;
    
    // Create an array of dates with entries
    const datesWithEntries = logs.map(log => {
      const logDate = new Date(log.date);
      return logDate.toISOString().split('T')[0];
    }).sort();
    
    // Remove duplicates
    const uniqueDates = [...new Set(datesWithEntries)];
    
    for (let i = 0; i < uniqueDates.length; i++) {
      const currentDate = new Date(uniqueDates[i]);
      
      if (i === 0) {
        tempStreak = 1;
      } else {
        const prevDate = new Date(uniqueDates[i-1]);
        const diffTime = Math.abs(currentDate - prevDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) {
          tempStreak++;
        } else {
          if (tempStreak > currentLongestStreak) {
            currentLongestStreak = tempStreak;
          }
          tempStreak = 1;
        }
      }
    }
    
    // Check if the last streak is the longest
    if (tempStreak > currentLongestStreak) {
      currentLongestStreak = tempStreak;
    }
    
    // Get end date of this week (Sunday)
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    
    // Previous week date range
    const startOfPrevWeek = new Date(startOfWeek);
    startOfPrevWeek.setDate(startOfPrevWeek.getDate() - 7);
    
    const endOfPrevWeek = new Date(endOfWeek);
    endOfPrevWeek.setDate(endOfPrevWeek.getDate() - 7);
    
    // Count unique days with logs for current and previous weeks
    const uniqueDaysCurrentWeek = logs.filter(log => {
      const logDate = new Date(log.date);
      logDate.setHours(0, 0, 0, 0);
      return logDate >= startOfWeek && logDate <= endOfWeek && logDate <= today;
    }).reduce((acc, log) => {
      acc.add(new Date(log.date).toDateString());
      return acc;
    }, new Set()).size;
    
    const uniqueDaysPrevWeek = logs.filter(log => {
      const logDate = new Date(log.date);
      logDate.setHours(0, 0, 0, 0);
      return logDate >= startOfPrevWeek && logDate <= endOfPrevWeek;
    }).reduce((acc, log) => {
      acc.add(new Date(log.date).toDateString());
      return acc;
    }, new Set()).size;
    
    // Calculate monthly completion percentage
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const daysPassedInMonth = Math.min(new Date().getDate(), daysInMonth);
    
    const logsThisMonth = logs.filter(log => {
      const logDate = new Date(log.date);
      return (
        logDate.getFullYear() === currentYear && 
        logDate.getMonth() === currentMonth
      );
    });
    
    const uniqueDaysThisMonth = new Set(
      logsThisMonth.map(log => new Date(log.date).getDate())
    ).size;
    
    const monthlyCompletionRate = Math.round(
      (uniqueDaysThisMonth / daysPassedInMonth) * 100
    );
    
    // Update state with all calculated streak info
    setCurrentStreak(streak);
    setWeeklyStreak(uniqueDaysCurrentWeek);
    setPreviousWeekStreak(uniqueDaysPrevWeek);
    setLongestStreak(currentLongestStreak);
    setWeeklyProgress(weekProgress);
    setMonthlyCompletion(monthlyCompletionRate);
  };

  // Get mood for a specific date - return most frequent mood or last inputted mood
  const getMoodForDate = (day) => {
    const dateToCheck = new Date(currentYear, currentMonth, day);
    dateToCheck.setHours(0, 0, 0, 0);
    
    // Get all logs for this specific date
    const logsForDate = moodLogs.filter(log => {
      const logDate = new Date(log.date);
      logDate.setHours(0, 0, 0, 0);
      return logDate.getTime() === dateToCheck.getTime();
    });

    if (logsForDate.length === 0) {
      // Check if this is a day where we should show the + icon
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Get the Monday of current week
      const currentWeekStart = new Date(today);
      const dayOfWeek = today.getDay(); // 0 (Sunday) to 6 (Saturday)
      const offset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Move back to Monday
      currentWeekStart.setDate(today.getDate() + offset);
      currentWeekStart.setHours(0, 0, 0, 0);

      const currentWeekEnd = new Date(currentWeekStart);
      currentWeekEnd.setDate(currentWeekStart.getDate() + 6);
      currentWeekEnd.setHours(23, 59, 59, 999);
      
      // Only show plus if:
      // 1. It's today or a past date (not future)
      // 2. It's in the current week
      const isPastOrToday = dateToCheck <= today;
      const isInCurrentWeek = dateToCheck >= currentWeekStart && dateToCheck <= currentWeekEnd;
      
      if (isPastOrToday && isInCurrentWeek) {
        return { type: 'plus' };
      }
      
      return { type: 'empty' };
    }

    // Collect all emotions from all logs for this date (both before and after emotions)
    const allEmotions = [];
    logsForDate.forEach(log => {
      // Add afterEmotion (always present and more recent)
      if (log.afterEmotion) {
        allEmotions.push({
          emotion: log.afterEmotion,
          date: new Date(log.date),
          type: 'after'
        });
      }
      
      // Add beforeEmotion if it exists (not "can't remember")
      if (log.beforeEmotion && log.beforeValence !== "can't remember") {
        allEmotions.push({
          emotion: log.beforeEmotion,
          date: new Date(log.date),
          type: 'before'
        });
      }
    });

    if (allEmotions.length === 0) {
      return { type: 'empty' };
    }

    // Count frequency of each emotion and track latest occurrence
    const emotionCounts = {};
    const emotionLatestOccurrence = {};
    
    allEmotions.forEach(emotionData => {
      const emotion = emotionData.emotion;
      emotionCounts[emotion] = (emotionCounts[emotion] || 0) + 1;
      
      // Track the latest occurrence of each emotion
      if (!emotionLatestOccurrence[emotion] || emotionData.date > emotionLatestOccurrence[emotion]) {
        emotionLatestOccurrence[emotion] = emotionData.date;
      }
    });

    // Find the maximum frequency
    const maxCount = Math.max(...Object.values(emotionCounts));
    
    // Get all emotions that have the maximum frequency
    const emotionsWithMaxCount = Object.entries(emotionCounts)
      .filter(([emotion, count]) => count === maxCount)
      .map(([emotion, count]) => emotion);

    // If there's only one emotion with max count and it appears more than once, it's clearly frequent
    if (emotionsWithMaxCount.length === 1 && maxCount > 1) {
      const dominantEmotion = emotionsWithMaxCount[0];
      return {
        type: 'frequent',
        emotion: dominantEmotion,
        isFrequent: true,
        polarity: getEmotionPolarity(dominantEmotion),
        count: logsForDate.length
      };
    }

    // If multiple emotions have the same max count and that count is > 1 (tied for most frequent)
    if (emotionsWithMaxCount.length > 1 && maxCount > 1) {
      // Find the emotion with the most recent occurrence among the tied emotions
      let mostRecentEmotion = emotionsWithMaxCount[0];
      let mostRecentDate = emotionLatestOccurrence[mostRecentEmotion];
      
      emotionsWithMaxCount.forEach(emotion => {
        if (emotionLatestOccurrence[emotion] > mostRecentDate) {
          mostRecentEmotion = emotion;
          mostRecentDate = emotionLatestOccurrence[emotion];
        }
      });

      return {
        type: 'frequent',
        emotion: mostRecentEmotion,
        isFrequent: true,
        polarity: getEmotionPolarity(mostRecentEmotion),
        count: logsForDate.length
      };
    }

    // If all emotions appear only once (maxCount === 1), 
    // return the most recent afterEmotion (since it's more recent than beforeEmotion)
    const afterEmotions = allEmotions.filter(e => e.type === 'after');
    if (afterEmotions.length > 0) {
      // Sort by date descending to get the most recent
      const mostRecentAfterEmotion = afterEmotions.sort((a, b) => b.date - a.date)[0];
      return {
        type: 'last',
        emotion: mostRecentAfterEmotion.emotion,
        isFrequent: false,
        polarity: getEmotionPolarity(mostRecentAfterEmotion.emotion),
        count: logsForDate.length
      };
    }

    // Fallback to most recent emotion if no afterEmotions (shouldn't happen normally)
    const mostRecentEmotion = allEmotions.sort((a, b) => b.date - a.date)[0];
    return {
      type: 'last',
      emotion: mostRecentEmotion.emotion,
      isFrequent: false,
      polarity: getEmotionPolarity(mostRecentEmotion.emotion),
      count: logsForDate.length
    };
  };

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const handleCircleClick = (day) => {
    const dateToCheck = new Date(currentYear, currentMonth, day);
    dateToCheck.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get the Monday of current week
    const currentWeekStart = new Date(today);
    const dayOfWeek = today.getDay(); // 0 (Sunday) to 6 (Saturday)
    const offset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Move back to Monday
    currentWeekStart.setDate(today.getDate() + offset);
    currentWeekStart.setHours(0, 0, 0, 0);

    const currentWeekEnd = new Date(currentWeekStart);
    currentWeekEnd.setDate(currentWeekStart.getDate() + 6);
    currentWeekEnd.setHours(23, 59, 59, 999);

    const isInCurrentWeek = dateToCheck >= currentWeekStart && dateToCheck <= currentWeekEnd;
    const isPastOrToday = dateToCheck <= today;

    // Only allow logging for current week and past/today dates
    if (isPastOrToday && isInCurrentWeek) {
      const formattedMonth = (currentMonth + 1).toString().padStart(2, '0');
      const formattedDay = day.toString().padStart(2, '0');
      const formattedDate = `${currentYear}-${formattedMonth}-${formattedDay}`;
      
      // Navigate to category selection with the selected date
      navigation.navigate('ChooseCategory', { selectedDate: formattedDate });
    }
  };

  const handleOpenStreakModal = () => {
    // Recalculate streaks when opening modal to ensure fresh data
    calculateStreaks(moodLogs);
    setStreakModalOpen(true);
  };

  const handleCloseStreakModal = () => {
    setStreakModalOpen(false);
  };

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const firstDay = new Date(currentYear, currentMonth, 1).getDay();

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <StatusBar backgroundColor={colors.background} barStyle="dark-content" />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{ marginTop: 16, fontFamily: fonts.regular, color: colors.text }}>
            Loading calendar...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar backgroundColor={colors.background} barStyle="dark-content" />
      
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={{ 
          backgroundColor: 'white', 
          paddingVertical: 16, 
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 3
        }}>
          <View style={{ paddingHorizontal: 16 }}>
            {/* Month navigation - centered */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
              <TouchableOpacity 
                onPress={handlePrevMonth}
                style={{ padding: 12 }}
              >
                <Text style={{ fontSize: 24, color: colors.primary }}>‹</Text>
              </TouchableOpacity>
              <Text style={{ 
                fontSize: 24, 
                fontFamily: fonts.bold, 
                color: colors.text,
                marginHorizontal: 24,
                textAlign: 'center'
              }}>
                {months[currentMonth]} {currentYear}
              </Text>
              <TouchableOpacity 
                onPress={handleNextMonth}
                style={{ padding: 12 }}
              >
                <Text style={{ fontSize: 24, color: colors.primary }}>›</Text>
              </TouchableOpacity>
            </View>

            {/* Action buttons row */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              {/* Quick entry button */}
              <TouchableOpacity
                onPress={() => navigation.navigate('ChooseCategory')}
                style={{
                  backgroundColor: colors.primary,
                  borderRadius: 16,
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  shadowColor: colors.primary,
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.3,
                  shadowRadius: 4,
                  elevation: 3
                }}
              >
                <Text style={{ 
                  color: 'white', 
                  fontSize: 14, 
                  fontFamily: fonts.semiBold 
                }}>
                  + Add Today
                </Text>
              </TouchableOpacity>

              {/* Streak icon */}
              <TouchableOpacity 
                onPress={handleOpenStreakModal}
                style={{ position: 'relative' }}
              >
                <View style={{ width: 48, height: 48, position: 'relative', alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontSize: 32 }}>🔥</Text>
                  {currentStreak > 0 && (
                    <View style={{
                      position: 'absolute',
                      top: 2,
                      right: 2,
                      backgroundColor: colors.primary,
                      borderRadius: 10,
                      width: 20,
                      height: 20,
                      justifyContent: 'center',
                      alignItems: 'center'
                    }}>
                      <Text style={{ 
                        color: 'white', 
                        fontSize: 12, 
                        fontFamily: fonts.bold 
                      }}>
                        {currentStreak}
                      </Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            </View>
            
            {/* Monthly progress */}
            <View style={{ 
              backgroundColor: colors.accent,
              borderRadius: 20,
              paddingHorizontal: 16,
              paddingVertical: 8,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Text style={{ 
                fontSize: 12, 
                color: colors.text, 
                fontFamily: fonts.medium,
                marginRight: 12
              }}>
                This month:
              </Text>
              <View style={{ 
                width: 96, 
                height: 10, 
                backgroundColor: '#E5E5E5',
                borderRadius: 5,
                overflow: 'hidden'
              }}>
                <View style={{
                  height: '100%',
                  width: `${monthlyCompletion}%`,
                  backgroundColor: colors.primary,
                  borderRadius: 5
                }} />
              </View>
              <Text style={{ 
                fontSize: 12, 
                fontFamily: fonts.bold, 
                color: colors.primary,
                marginLeft: 12
              }}>
                {monthlyCompletion}%
              </Text>
            </View>
          </View>
        </View>

        {/* Calendar explanation */}
        <View style={{ 
          backgroundColor: 'white',
          marginHorizontal: 16,
          marginTop: 32,
          borderRadius: 12,
          padding: 16,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.1,
          shadowRadius: 3,
          elevation: 2
        }}>
          <View style={{ alignItems: 'center', marginBottom: 24 }}>
            <Text style={{ 
              fontSize: 18, 
              fontFamily: fonts.semiBold, 
              color: colors.text,
              marginBottom: 8,
              textAlign: 'center'
            }}>
              📅 Your Mood Calendar
            </Text>
            <Text style={{ 
              fontSize: 14, 
              color: colors.text, 
              fontFamily: fonts.regular,
              textAlign: 'center',
              lineHeight: 20,
              opacity: 0.8
            }}>
              Track your daily emotions and activities. {'\n'}
              <Text style={{ fontFamily: fonts.semiBold }}>Click any circle in the current week</Text> to log a mood.
            </Text>
          </View>

          {/* Legend */}
          <View style={{ 
            backgroundColor: colors.accent,
            borderRadius: 8,
            paddingVertical: 12,
            paddingHorizontal: 16
          }}>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-around' }}>
              <View style={{ alignItems: 'center', marginBottom: 8, width: '30%' }}>
                <View style={{
                  width: 24,
                  height: 24,
                  borderRadius: 12,
                  backgroundColor: 'white',
                  borderWidth: 2,
                  borderColor: '#2196F3',
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginBottom: 4
                }}>
                  <Text style={{ fontSize: 12 }}>😊</Text>
                </View>
                <Text style={{ fontSize: 10, color: colors.text, fontFamily: fonts.medium, textAlign: 'center' }}>
                  Positive{'\n'}Dominant
                </Text>
              </View>
              
              <View style={{ alignItems: 'center', marginBottom: 8, width: '30%' }}>
                <View style={{
                  width: 24,
                  height: 24,
                  borderRadius: 12,
                  backgroundColor: 'white',
                  borderWidth: 2,
                  borderColor: '#FF6B6B',
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginBottom: 4
                }}>
                  <Text style={{ fontSize: 12 }}>😞</Text>
                </View>
                <Text style={{ fontSize: 10, color: colors.text, fontFamily: fonts.medium, textAlign: 'center' }}>
                  Negative{'\n'}Dominant
                </Text>
              </View>
              
              <View style={{ alignItems: 'center', marginBottom: 8, width: '30%' }}>
                <View style={{
                  width: 24,
                  height: 24,
                  borderRadius: 12,
                  backgroundColor: 'white',
                  borderWidth: 2,
                  borderColor: colors.primary,
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginBottom: 4,
                  position: 'relative'
                }}>
                  <Text style={{ fontSize: 12 }}>😊</Text>
                  <View style={{
                    position: 'absolute',
                    top: -4,
                    right: -4,
                    backgroundColor: colors.primary,
                    borderRadius: 6,
                    width: 12,
                    height: 12,
                    justifyContent: 'center',
                    alignItems: 'center',
                    borderWidth: 1,
                    borderColor: 'white'
                  }}>
                    <Text style={{ 
                      color: 'white', 
                      fontSize: 8, 
                      fontFamily: fonts.bold 
                    }}>
                      3
                    </Text>
                  </View>
                </View>
                <Text style={{ fontSize: 10, color: colors.text, fontFamily: fonts.medium, textAlign: 'center' }}>
                  Total Logs
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Calendar */}
        <View style={{ 
          backgroundColor: 'white',
          marginHorizontal: 16,
          marginTop: 16,
          borderRadius: 16,
          overflow: 'hidden',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 4
        }}>
          {/* Days of week header */}
          <View style={{ backgroundColor: colors.primary, paddingVertical: 16 }}>
            <View style={{ flexDirection: 'row' }}>
              {daysOfWeek.map((day, i) => (
                <View key={i} style={{ flex: 1, alignItems: 'center' }}>
                  <Text style={{ 
                    fontFamily: fonts.bold, 
                    color: 'white', 
                    fontSize: 14 
                  }}>
                    {day}
                  </Text>
                </View>
              ))}
            </View>
          </View>
          
          {/* Calendar days */}
          <View style={{ paddingHorizontal: 12, paddingVertical: 16, backgroundColor: colors.background, minHeight: 320 }}>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
              {/* Empty cells for days before the first day of the month */}
              {[...Array(firstDay)].map((_, i) => (
                <View key={`empty-${i}`} style={{ width: '14.28%', aspectRatio: 1.2, marginBottom: 26 }} />
              ))}
              
              {/* Calendar days */}
              {[...Array(daysInMonth)].map((_, i) => {
                const day = i + 1;
                const moodData = getMoodForDate(day);
                const isToday = day === today.getDate() && 
                               currentMonth === today.getMonth() && 
                               currentYear === today.getFullYear();

                const today_check = new Date();
                today_check.setHours(0, 0, 0, 0);
                const dateToCheck = new Date(currentYear, currentMonth, day);
                dateToCheck.setHours(0, 0, 0, 0);
                
                const currentWeekStart = new Date(today_check);
                const dayOfWeek = today_check.getDay();
                const offset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
                currentWeekStart.setDate(today_check.getDate() + offset);
                currentWeekStart.setHours(0, 0, 0, 0);

                const currentWeekEnd = new Date(currentWeekStart);
                currentWeekEnd.setDate(currentWeekStart.getDate() + 6);
                currentWeekEnd.setHours(23, 59, 59, 999);

                const isInCurrentWeek = dateToCheck >= currentWeekStart && dateToCheck <= currentWeekEnd;
                const isPastOrToday = dateToCheck <= today_check;
                const isClickable = (moodData.type === 'plus') || (moodData.type !== 'empty' && isInCurrentWeek && isPastOrToday);

                return (
                  <View key={day} style={{ width: '14.28%', aspectRatio: 1.2, padding: 1, marginBottom: 20 }}>
                    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'space-between', paddingVertical: 4 }}>
                      <TouchableOpacity
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 18,
                          justifyContent: 'center',
                          alignItems: 'center',
                          position: 'relative',
                          backgroundColor: isToday ? 'white' : 
                            moodData.type === 'plus' ? colors.accent :
                            moodData.type === 'empty' ? colors.accent :
                            'white',
                          borderWidth: 1,
                          borderColor: isToday ? colors.primary :
                            moodData.type === 'plus' ? '#999' :
                            moodData.type === 'empty' ? '#E5E5E5' :
                            (moodData.polarity === 'positive' ? '#2196F3' : 
                             moodData.polarity === 'negative' ? '#FF6B6B' : '#999'),
                          borderStyle: moodData.type === 'plus' ? 'dashed' : 'solid',
                          shadowColor: moodData.type !== 'empty' && moodData.type !== 'plus' ? '#000' : 'transparent',
                          shadowOffset: { width: 0, height: 1 },
                          shadowOpacity: 0.1,
                          shadowRadius: 1,
                          elevation: moodData.type !== 'empty' && moodData.type !== 'plus' ? 1 : 0
                        }}
                        onPress={() => isClickable && handleCircleClick(day)}
                        disabled={!isClickable}
                        activeOpacity={isClickable ? 0.7 : 1}
                      >
                        {moodData.type === 'plus' ? (
                          <Text style={{ fontSize: 16, color: '#999', fontFamily: fonts.bold }}>+</Text>
                        ) : moodData.type === 'empty' ? null : (
                          <Text style={{ fontSize: 20 }}>
                            {emotionMap[moodData.emotion]?.emoji || '😊'}
                          </Text>
                        )}
                        
                        {/* Count badge */}
                        {moodData.count > 1 && (
                          <View style={{
                            position: 'absolute',
                            top: -6,
                            right: -6,
                            backgroundColor: colors.primary,
                            borderRadius: 8,
                            width: 16,
                            height: 16,
                            justifyContent: 'center',
                            alignItems: 'center',
                            borderWidth: 1,
                            borderColor: 'white'
                          }}>
                            <Text style={{ 
                              color: 'white', 
                              fontSize: 10, 
                              fontFamily: fonts.bold 
                            }}>
                              {moodData.count}
                            </Text>
                          </View>
                        )}
                      </TouchableOpacity>
                      
                      {/* Day number - with dedicated space */}
                      <Text style={{ 
                        fontSize: 10, 
                        fontFamily: fonts.regular, 
                        textAlign: 'center',
                        marginTop: 2,
                        color: isToday ? colors.primary : 
                          moodData.type !== 'empty' ? colors.text : '#666'
                      }}>
                        {day}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Streak Modal */}
      <Modal
        visible={streakModalOpen}
        transparent={true}
        animationType="slide"
        onRequestClose={handleCloseStreakModal}
      >
        <View style={{ 
          flex: 1, 
          backgroundColor: 'rgba(0,0,0,0.5)', 
          justifyContent: 'center', 
          alignItems: 'center',
          paddingHorizontal: 20
        }}>
          <View style={{ 
            backgroundColor: 'white', 
            borderRadius: 16, 
            padding: 24, 
            width: '100%',
            maxWidth: 400,
            maxHeight: '90%'
          }}>
            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Header */}
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={{ fontSize: 32, marginRight: 8 }}>🔥</Text>
                  <Text style={{ 
                    fontSize: 24, 
                    fontFamily: fonts.bold, 
                    color: colors.text 
                  }}>
                    Your Streak Stats
                  </Text>
                </View>
                <TouchableOpacity onPress={handleCloseStreakModal}>
                  <Text style={{ fontSize: 24, color: '#999' }}>×</Text>
                </TouchableOpacity>
              </View>
              
              {/* Current Streak */}
              <View style={{ marginBottom: 24 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
                  <Text style={{ fontSize: 18, fontFamily: fonts.medium, color: colors.text }}>
                    Current Streak
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
                    <Text style={{ fontSize: 32, fontFamily: fonts.bold, color: '#FF8C00', marginRight: 4 }}>
                      {currentStreak}
                    </Text>
                    <Text style={{ fontSize: 14, color: '#999' }}>days</Text>
                  </View>
                </View>
                <View style={{ height: 12, backgroundColor: '#E5E5E5', borderRadius: 6, overflow: 'hidden' }}>
                  <View style={{
                    height: '100%',
                    width: `${Math.min(100, (currentStreak / 7) * 100)}%`,
                    backgroundColor: '#FF8C00',
                    borderRadius: 6
                  }} />
                </View>
                <Text style={{ 
                  fontSize: 12, 
                  color: '#999', 
                  fontStyle: 'italic', 
                  textAlign: 'right',
                  marginTop: 4
                }}>
                  {currentStreak === 0 ? "Start your streak today!" :
                   currentStreak < 3 ? "Keep going!" :
                   currentStreak < 7 ? "Great progress!" :
                   "Impressive streak!"}
                </Text>
              </View>
              
              {/* Weekly Progress */}
              <View style={{ 
                backgroundColor: colors.accent, 
                borderRadius: 12, 
                padding: 16, 
                marginBottom: 24 
              }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                  <Text style={{ fontSize: 20, marginRight: 8 }}>📅</Text>
                  <Text style={{ fontSize: 16, fontFamily: fonts.semiBold, color: colors.text }}>
                    This Week (Mon-Sun)
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
                  {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, index) => (
                    <Text key={`label-${index}`} style={{ 
                      fontSize: 12, 
                      fontFamily: fonts.medium, 
                      color: '#999',
                      textAlign: 'center',
                      width: 32
                    }}>
                      {day}
                    </Text>
                  ))}
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
                  {weeklyProgress.map((completed, index) => (
                    <View
                      key={`day-${index}`}
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 16,
                        justifyContent: 'center',
                        alignItems: 'center',
                        backgroundColor: completed ? colors.primary : '#E5E5E5'
                      }}
                    >
                      {completed && (
                        <Text style={{ color: 'white', fontSize: 12, fontFamily: fonts.bold }}>✓</Text>
                      )}
                    </View>
                  ))}
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ fontSize: 14, color: colors.text }}>Days logged</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={{ fontSize: 18, fontFamily: fonts.bold, color: colors.primary }}>
                      {weeklyStreak}
                    </Text>
                    <Text style={{ fontSize: 14, color: '#999', marginLeft: 4 }}>/ 7</Text>
                  </View>
                </View>
              </View>
              
              {/* Stats Grid */}
              <View style={{ flexDirection: 'row', marginBottom: 20 }}>
                <View style={{ 
                  flex: 1, 
                  backgroundColor: colors.accent, 
                  padding: 12, 
                  borderRadius: 12,
                  marginRight: 8
                }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                    <Text style={{ fontSize: 20, marginRight: 4 }}>🏆</Text>
                    <Text style={{ fontSize: 14, fontFamily: fonts.semiBold, color: colors.text }}>
                      Longest Streak
                    </Text>
                  </View>
                  <Text style={{ fontSize: 20, fontFamily: fonts.bold, color: colors.text }}>
                    {longestStreak} <Text style={{ fontSize: 14, fontFamily: fonts.regular, color: '#999' }}>days</Text>
                  </Text>
                </View>
                
                <View style={{ 
                  flex: 1, 
                  backgroundColor: colors.accent, 
                  padding: 12, 
                  borderRadius: 12,
                  marginLeft: 8
                }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                    <Text style={{ fontSize: 20, marginRight: 4 }}>📊</Text>
                    <Text style={{ fontSize: 14, fontFamily: fonts.semiBold, color: colors.text }}>
                      Last Week
                    </Text>
                  </View>
                  <Text style={{ fontSize: 20, fontFamily: fonts.bold, color: colors.text }}>
                    {previousWeekStreak} <Text style={{ fontSize: 14, fontFamily: fonts.regular, color: '#999' }}>/ 7 days</Text>
                  </Text>
                </View>
              </View>
              
              {/* Motivational Message */}
              <View style={{ 
                backgroundColor: colors.accent,
                padding: 16, 
                borderRadius: 12, 
                alignItems: 'center',
                marginBottom: 16
              }}>
                <Text style={{ 
                  fontSize: 14, 
                  color: colors.text,
                  textAlign: 'center',
                  lineHeight: 20
                }}>
                  {currentStreak === 0 ? (
                    "Log your mood today to start your streak!"
                  ) : currentStreak < 3 ? (
                    "You're building a great habit! Keep going each day."
                  ) : currentStreak < 7 ? (
                    "Amazing consistency! You're on your way to a full week."
                  ) : (
                    "Incredible dedication! Your consistency is impressive."
                  )}
                </Text>
              </View>
              
              {/* Close Button */}
              <TouchableOpacity 
                style={{ 
                  backgroundColor: colors.primary,
                  paddingVertical: 12,
                  paddingHorizontal: 24,
                  borderRadius: 24,
                  alignItems: 'center'
                }}
                onPress={handleCloseStreakModal}
              >
                <Text style={{ 
                  color: 'white',
                  fontSize: 16,
                  fontFamily: fonts.medium
                }}>
                  Continue Tracking
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
