import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, Image, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fonts } from '../../../utils/fonts/fonts';
import { colors } from '../../../utils/colors/colors';
import { moodDataService } from '../../../services/moodDataService';
import ContinueTrackingModal from './ContinueTrackingModal';
import ConsecutiveNegativeModal from './ConsecutiveNegativeModal';
import { Ionicons } from '@expo/vector-icons';
import emotionImages from '../../../utils/images/emotions';
import { validateReason } from '../../../utils/reasonValidator';

const emotions = [
  { id: 'bored', title: 'Bored' },
  { id: 'sad', title: 'Sad' },
  { id: 'disappointed', title: 'Disappointed' },
  { id: 'angry', title: 'Angry' },
  { id: 'tense', title: 'Tense' }
];

const intensityValues = [1, 2, 3, 4, 5];

const chunkArray = (arr, size) => {
  const result = [];
  for (let i = 0; i < arr.length; i += size) {
    result.push(arr.slice(i, i + size));
  }
  return result;
};

const AfterNegative = ({ navigation, route }) => {
  const [selectedEmotion, setSelectedEmotion] = useState(null);
  const [selectedIntensity, setSelectedIntensity] = useState(null);
  const [reason, setReason] = useState('');
  const [reasonError, setReasonError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showConsecutiveNegativeModal, setShowConsecutiveNegativeModal] = useState(false);

  // Get all the data from previous screens
  const { 
    category, 
    activity, 
    hrs, 
    selectedTime,
    selectedDate,
    beforeValence,
    beforeEmotion,
    beforeIntensity,
    beforeReason
  } = route.params || {};

  const isInputEnabled = selectedEmotion && selectedIntensity;
  const isButtonEnabled = isInputEnabled && !reasonError;

  const emotionRows = chunkArray(emotions, 3);

  const handleReasonChange = (text) => {
    setReason(text);
    if (text.trim().length > 0) {
      const validation = validateReason(text);
      setReasonError(validation.isValid ? '' : validation.error);
    } else {
      setReasonError('');
    }
  };

  const checkConsecutiveNegativeEmotions = async () => {
    try {
      // Fetch recent logs to check for consecutive negative emotions
      const response = await moodDataService.getRecentMoodLogs(5);
      
      if (response && response.logs && response.logs.length >= 5) {
        const lastFiveLogs = response.logs.slice(0, 5);
        // console.log('Last 5 logs:', lastFiveLogs);
        
        // Check if all last 5 have negative afterValence
        const allNegative = lastFiveLogs.every(log => log.afterValence === 'negative');
        console.log('All 5 negative?', allNegative);
        
        if (allNegative) {
          // Show the consecutive negative modal
          setShowConsecutiveNegativeModal(true);
          return true;
        }
      } else {
        console.log('Not enough logs yet. Total logs:', response.logs?.length || 0);
      }
    } catch (error) {
      console.error('Error checking consecutive negative emotions:', error);
      // Silently fail - don't interrupt user experience
    }
    return false;
  };

  const handleSubmit = async () => {
    if (!isButtonEnabled || isLoading) return;

    // Final validation before submit
    const validation = validateReason(reason);
    if (!validation.isValid) {
      setReasonError(validation.error);
      return;
    }

    setIsLoading(true);
    
    try {
      // Prepare mood data for saving
      const moodData = {
        category,
        activity,
        hrs,
        selectedTime,
        selectedDate,
        beforeValence,
        beforeEmotion,
        beforeIntensity,
        beforeReason,
        afterValence: 'negative',
        afterEmotion: selectedEmotion,
        afterIntensity: selectedIntensity,
        afterReason: reason.trim()
      };

      console.log('Saving mood data:', moodData);
      
      const result = await moodDataService.saveMoodLog(moodData);
      
      if (result.success) {
        console.log('Mood log saved successfully');
        
        // Check for consecutive negative emotions
        const hasConsecutiveNegative = await checkConsecutiveNegativeEmotions();
        
        if (hasConsecutiveNegative) {
          // Modal will be shown, don't set showModal yet
        } else {
          // Show regular continue modal
          setShowModal(true);
        }
      } else {
        Alert.alert('Error', result.error || 'Failed to save mood log');
      }
    } catch (error) {
      console.error('Error saving mood log:', error);
      Alert.alert('Error', 'Something went wrong while saving. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 24}
      >
      <ScrollView
        className="flex-1 px-6"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: 40, paddingBottom: 24 }}
      >
        <View
          style={{
            position: 'absolute',
            top: 38,
            left: 18,
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
        <Text
          className="text-2xl text-center mb-6"
          style={{
            color: colors.text,
            fontFamily: fonts.semiBold,
            lineHeight: 34
          }}
        >
          Select your emotion
        </Text>
        <View className="mb-6">
          {emotionRows.map((row, rowIdx) => (
            <View
              key={rowIdx}
              className="flex-row mb-8"
              style={{
                justifyContent: row.length === 3 ? 'center' : 'space-evenly'
              }}
            >
              {row.map((emotion) => {
                const isSelected = selectedEmotion === emotion.id;
                return (
                  <TouchableOpacity
                    key={emotion.id}
                    onPress={() => setSelectedEmotion(emotion.id)}
                    className="mx-4 active:scale-95"
                    style={{ alignItems: 'center' }}
                    activeOpacity={0.8}
                  >
                    <Image
                      source={emotionImages[emotion.id]}
                      className="w-20 h-20 mb-2"
                      resizeMode="contain"
                      style={{
                        borderWidth: isSelected ? 3 : 0,
                        borderColor: isSelected ? colors.primary : 'transparent',
                        borderRadius: 50
                      }}
                    />
                    <Text
                      className="text-sm text-center"
                      style={{
                        color: colors.text,
                        fontFamily: isSelected ? fonts.semiBold : fonts.regular,
                        width: 90
                      }}
                    >
                      {emotion.title}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
        </View>

        <Text
          className="text-xl text-center mb-2"
          style={{
            color: colors.text,
            fontFamily: fonts.semiBold
          }}
        >
          Rate the Intensity
        </Text>
        <View className="flex-row justify-center mb-2">
          {intensityValues.map((val) => {
            const isSelected = selectedIntensity === val;
            return (
              <TouchableOpacity
                key={val}
                onPress={() => setSelectedIntensity(val)}
                className="mx-3 active:scale-95"
                activeOpacity={0.8}
              >
                <View
                  className="items-center justify-center"
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 24,
                    backgroundColor: isSelected ? colors.primary : colors.secondary,
                    borderWidth: isSelected ? 2 : 0,
                    borderColor: colors.accent || colors.primary,
                    shadowColor: colors.primary,
                    shadowOpacity: isSelected ? 0.15 : 0,
                    shadowRadius: 6
                  }}
                >
                  <Text
                    className="text-base"
                    style={{
                      color: colors.text,
                      fontFamily: fonts.semiBold
                    }}
                  >
                    {val}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
        <View className="flex-row justify-between px-2 mb-4">
          <Text
            className="text-xs"
            style={{
              color: colors.text,
              fontFamily: fonts.regular
            }}
          >
            Low
          </Text>
          <Text
            className="text-xs"
            style={{
              color: colors.text,
              fontFamily: fonts.regular
            }}
          >
            High
          </Text>
        </View>

        {isInputEnabled && (
          <View className="mb-4">
            <Text
              className="text-lg mb-2 text-center"
              style={{
                color: colors.text,
                fontFamily: fonts.semiBold
              }}
            >
              Why do you feel that way?
            </Text>
            <TextInput
              value={reason}
              onChangeText={handleReasonChange}
              className="rounded-xl px-4 py-3 text-base"
              style={{
                backgroundColor: colors.accent,
                color: colors.text,
                fontFamily: fonts.regular,
                borderWidth: 1,
                borderColor: reasonError ? '#dc2626' : colors.primary,
                minHeight: 100,
                textAlignVertical: 'top'
              }}
              placeholder="Describe what made you feel this way..."
              placeholderTextColor={colors.text}
              multiline
            />
            {reasonError && (
              <View className="mt-2 p-3 rounded-lg" style={{ backgroundColor: '#fee2e2' }}>
                <Text className="text-sm" style={{ color: '#dc2626', fontFamily: fonts.regular }}>
                  {reasonError}
                </Text>
              </View>
            )}
            <View className="mt-3 p-3 rounded-lg" style={{ backgroundColor: '#e0f2fe' }}>
              <Text className="text-xs" style={{ color: '#1e40af', fontFamily: fonts.regular }}>
                💬 <Text style={{ fontFamily: fonts.semiBold }}>Please avoid gibberish or unclear text for more accurate insights.</Text>
              </Text>
            </View>
          </View>
        )}

        <TouchableOpacity
          onPress={handleSubmit}
          disabled={!isButtonEnabled || isLoading}
          className="rounded-full py-4 px-8 shadow-lg active:scale-95 mb-4"
          style={{
            backgroundColor: isButtonEnabled && !isLoading ? colors.primary : colors.secondary,
            opacity: isButtonEnabled && !isLoading ? 1 : 0.5
          }}
          activeOpacity={0.8}
        >
          <Text
            className="text-center text-lg"
            style={{
              color: isButtonEnabled && !isLoading ? colors.background : colors.text,
              fontFamily: fonts.semiBold,
              lineHeight: 24
            }}
          >
            {isLoading ? 'Saving...' : 'Save & Continue'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
      </KeyboardAvoidingView>

      <ContinueTrackingModal
        visible={showModal}
        onContinue={() => {
          setShowModal(false);
          // Format today's date as YYYY-MM-DD if not already selected from calendar
          const dateToPass = selectedDate || (() => {
            const today = new Date();
            const formattedMonth = (today.getMonth() + 1).toString().padStart(2, '0');
            const formattedDay = today.getDate().toString().padStart(2, '0');
            return `${today.getFullYear()}-${formattedMonth}-${formattedDay}`;
          })();
          navigation.navigate('ChooseCategory', { selectedDate: dateToPass });
        }}
        onDone={() => {
          setShowModal(false);
          // Check if this was initiated from calendar (missed day logging)
          const isFromCalendar = selectedDate !== null;
          
          if (isFromCalendar) {
            // For missed days, redirect back to calendar
            navigation.navigate('SideBar', { screen: 'Calendar' });
          } else {
            // For normal flow, go to mood entries
            navigation.navigate('SideBar', { screen: 'MoodEntries' });
          }
        }}
      />

      <ConsecutiveNegativeModal
        isOpen={showConsecutiveNegativeModal}
        onClose={() => {
          setShowConsecutiveNegativeModal(false);
          setShowModal(true);
        }}
        onViewResources={() => {
          setShowConsecutiveNegativeModal(false);
          navigation.navigate('MentalHealthResources');
        }}
      />
    </SafeAreaView>
  );
};

export default AfterNegative;