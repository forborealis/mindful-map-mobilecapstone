import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fonts } from '../../../utils/fonts/fonts';
import { colors } from '../../../utils/colors/colors';
import { moodDataService } from '../../../services/moodDataService';
import ContinueTrackingModal from './ContinueTrackingModal';
import { Ionicons } from '@expo/vector-icons';

const tips = [
  { image: require('../../../assets/images/mood/others/sleep1.png'), text: 'Stick to a consistent sleep schedule.' },
  { image: require('../../../assets/images/mood/others/sleep2.png'), text: 'Avoid screentime at least 30 minutes before bed.' },
  { image: require('../../../assets/images/mood/others/sleep3.png'), text: 'Limit your caffeine intake.' }
];

const Sleep = ({ navigation, route }) => {
  const [hours, setHours] = useState('');
  const [isValid, setIsValid] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [existingLog, setExistingLog] = useState(null);
  const [showContinueModal, setShowContinueModal] = useState(false);
  
  // Get time data from TimeSegmentSelector and existing log data
  const { category, selectedTime, timeSegment, selectedDate, hasExistingLog, existingLog: passedExistingLog } = route.params || {};

  useEffect(() => {
    // If we have an existing log passed from ChooseCategory, use it
    if (hasExistingLog && passedExistingLog) {
      setExistingLog(passedExistingLog);
      setHours(passedExistingLog.hrs ? passedExistingLog.hrs.toString() : '');
      setIsValid(!!passedExistingLog.hrs);
    } else {
      // Otherwise check for existing sleep log
      checkExistingSleepLog();
    }
  }, [hasExistingLog, passedExistingLog]);

  const checkExistingSleepLog = async () => {
    try {
      let result;
      if (selectedDate) {
        // Check for sleep log on the selected date
        result = await moodDataService.getTodaysLastMoodLog('sleep', selectedDate);
        if (result.success && result.lastLog) {
          setExistingLog(result.lastLog);
          setHours(result.lastLog.hrs ? result.lastLog.hrs.toString() : '');
          setIsValid(!!result.lastLog.hrs);
        }
      } else {
        // Check for today's sleep log
        result = await moodDataService.getTodaysSleepLog();
        if (result.success && result.sleepLog) {
          setExistingLog(result.sleepLog);
          setHours(result.sleepLog.hrs.toString());
          setIsValid(true);
        }
      }
    } catch (error) {
      console.error('Error checking existing sleep log:', error);
    }
  };

  const handleChange = (value) => {
    // Allow numbers and one decimal point
    const validValue = value.replace(/[^0-9.]/g, '');
    // Ensure only one decimal point
    const parts = validValue.split('.');
    if (parts.length > 2) {
      return; // Don't allow multiple decimal points
    }
    // Limit to one decimal place
    if (parts[1] && parts[1].length > 1) {
      return;
    }
    
    setHours(validValue);
    const numValue = Number(validValue);
    setIsValid(validValue !== '' && numValue > 0 && numValue <= 24);
  };

  const handleIncrease = () => {
    const currentValue = hours === '' ? 0 : Number(hours);
    const newValue = Math.min(currentValue + 0.5, 24);
    const formattedValue = newValue % 1 === 0 ? newValue.toString() : newValue.toFixed(1);
    setHours(formattedValue);
    setIsValid(newValue > 0 && newValue <= 24);
  };

  const handleDecrease = () => {
    const currentValue = hours === '' ? 0 : Number(hours);
    const newValue = Math.max(currentValue - 0.5, 0);
    const formattedValue = newValue === 0 ? '' : (newValue % 1 === 0 ? newValue.toString() : newValue.toFixed(1));
    setHours(formattedValue);
    setIsValid(newValue > 0 && newValue <= 24);
  };

  const handleContinueTracking = () => {
    setShowContinueModal(false);
    // Format today's date as YYYY-MM-DD if not already selected from calendar
    const dateToPass = selectedDate || (() => {
      const today = new Date();
      const formattedMonth = (today.getMonth() + 1).toString().padStart(2, '0');
      const formattedDay = today.getDate().toString().padStart(2, '0');
      return `${today.getFullYear()}-${formattedMonth}-${formattedDay}`;
    })();
    navigation.navigate('ChooseCategory', { selectedDate: dateToPass });
  };

  const handleDoneTracking = () => {
    setShowContinueModal(false);
    navigation.navigate('MoodEntries');
  };

  const handleSubmit = async () => {
    if (!isValid) return;

    setIsLoading(true);
    try {
      let result;
      
      if (existingLog) {
        // Update existing sleep log hours only - pass the date if available
        result = await moodDataService.updateSleepHours(Number(hours), selectedDate);
        if (result.success) {
          setShowContinueModal(true);
        } else {
          Alert.alert('Error', result.message || 'Failed to update sleep hours');
        }
      } else {
        // Navigate to before valence for new sleep log
        navigation.navigate('BeforeValence', {
          category: 'sleep',
          hrs: Number(hours),
          selectedTime,
          timeSegment,
          selectedDate
        });
      }
    } catch (error) {
      console.error('Error handling sleep submission:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View
          style={{
            position: 'absolute',
            top: 20,
            left: 2,
            zIndex: 100,
            elevation: 10,
          }}
          pointerEvents="box-none"
        >
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
          >
            <Ionicons name="arrow-back" size={28} color="#222" />
          </TouchableOpacity>
        </View>
        <View className="flex-1 justify-center px-8">
          <Text
            className="text-3xl text-center mb-3"
            style={{
              color: colors.text,
              fontFamily: fonts.semiBold,
              lineHeight: 42
            }}
          >
            Previous Night's Sleep
          </Text>
          <Text
            className="text-base text-center mb-2"
            style={{
              color: colors.text,
              fontFamily: fonts.regular,
              opacity: 0.8,
              lineHeight: 22
            }}
          >
            How many hours did you sleep last night?
          </Text>
         
        <View
        className="mb-8 px-4 py-5 rounded-2xl"
        style={{
            backgroundColor: colors.secondary,
            shadowColor: colors.primary,
            shadowOpacity: 0.1,
            shadowRadius: 8,
            shadowOffset: { width: 0, height: 2 }
        }}
        >
        <Text
            className="text-base mb-3 text-center"
            style={{
            color: colors.text,
            fontFamily: fonts.semiBold,
            letterSpacing: 0.2
            }}
        >
            Tips to get more hours of sleep
        </Text>
        {tips.map((tip, idx) => (
            <View key={idx}>
            <View className="flex-row items-center mb-2">
                <Image
                source={tip.image}
                className="w-7 h-7 mr-3"
                resizeMode="contain"
                />
                <Text
                    className="text-sm flex-1"
                style={{
                    color: colors.text,
                    fontFamily: fonts.regular,
                    opacity: 0.85
                }}
                >
                {tip.text}
                </Text>
            </View>
            {idx < tips.length - 1 && (
                <View
                style={{
                    height: 1,
                    backgroundColor: colors.primary,
                    opacity: 0.15,
                    marginVertical: 4,
                    marginLeft: 38
                }}
                />
            )}
            </View>
        ))}
        </View>
          <View className="items-center mb-4">
            {/* Sleep Input Container with Buttons */}
            <View className="flex-row items-center justify-center mb-4">
              {/* Decrease Button */}
              <TouchableOpacity
                onPress={handleDecrease}
                disabled={hours === '' || Number(hours) <= 0}
                className="w-12 h-12 rounded-full items-center justify-center mr-4"
                style={{
                  backgroundColor: (hours !== '' && Number(hours) > 0) ? colors.primary : colors.secondary,
                  opacity: (hours !== '' && Number(hours) > 0) ? 1 : 0.5,
                  shadowColor: colors.primary,
                  shadowOpacity: 0.2,
                  shadowRadius: 4,
                  shadowOffset: { width: 0, height: 2 }
                }}
                activeOpacity={0.7}
              >
                <Text
                  style={{
                    fontSize: 24,
                    color: colors.text,
                    fontFamily: fonts.bold,
                    lineHeight: 24
                  }}
                >
                  −
                </Text>
              </TouchableOpacity>

              {/* Input Field */}
              <TextInput
                value={hours}
                onChangeText={handleChange}
                keyboardType="decimal-pad"
                maxLength={4}
                className="w-32 h-20 text-4xl text-center rounded-2xl"
                style={{
                  backgroundColor: colors.background,
                  color: colors.text,
                  fontFamily: fonts.semiBold,
                  borderWidth: 2,
                  borderColor: colors.primary,
                  shadowColor: colors.primary,
                  shadowOpacity: 0.15,
                  shadowRadius: 8,
                  shadowOffset: { width: 0, height: 2 },
                  paddingVertical: 0,
                  paddingTop: 0,
                  paddingBottom: 0,
                  marginBottom: 0,
                  textAlignVertical: 'center'
                }}
                placeholder="0.0"
                placeholderTextColor={colors.text}
              />

              {/* Increase Button */}
              <TouchableOpacity
                onPress={handleIncrease}
                disabled={Number(hours) >= 24}
                className="w-12 h-12 rounded-full items-center justify-center ml-4"
                style={{
                  backgroundColor: (Number(hours) < 24) ? colors.primary : colors.secondary,
                  opacity: (Number(hours) < 24) ? 1 : 0.5,
                  shadowColor: colors.primary,
                  shadowOpacity: 0.2,
                  shadowRadius: 4,
                  shadowOffset: { width: 0, height: 2 }
                }}
                activeOpacity={0.7}
              >
                <Text
                  style={{
                    fontSize: 24,
                    color: colors.text,
                    fontFamily: fonts.bold,
                    lineHeight: 24
                  }}
                >
                  +
                </Text>
              </TouchableOpacity>
            </View>

            <Text
              className="text-lg"
              style={{
                color: colors.text,
                fontFamily: fonts.semiBold
              }}
            >
              hours
            </Text>
          </View>
          {existingLog && (
            <View 
              className="mb-4 px-4 py-3 rounded-xl"
              style={{ backgroundColor: colors.primary }}
            >
              <Text
                className="text-center text-sm"
                style={{
                  color: colors.text,
                  fontFamily: fonts.regular,
                }}
              >
                💡 You already logged sleep today. Update your hours or track the mood impact.
              </Text>
            </View>
          )}

          <TouchableOpacity
            onPress={handleSubmit}
            disabled={!isValid || isLoading}
            className="rounded-full py-4 px-8 shadow-lg mt-6 active:scale-95"
            style={{
              backgroundColor: isValid ? colors.primary : colors.secondary,
              opacity: isValid && !isLoading ? 1 : 0.5
            }}
            activeOpacity={0.8}
          >
            <Text
              className="text-center text-xl"
              style={{
                color: colors.text,
                fontFamily: fonts.semiBold,
                lineHeight: 24
              }}
            >
              {isLoading 
                ? 'Saving...'
                : existingLog 
                  ? 'Update sleep hours' 
                  : 'Continue with mood tracking'
              }
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
      
      <ContinueTrackingModal
        visible={showContinueModal}
        onContinue={handleContinueTracking}
        onDone={handleDoneTracking}
      />
    </SafeAreaView>
  );
};

export default Sleep;