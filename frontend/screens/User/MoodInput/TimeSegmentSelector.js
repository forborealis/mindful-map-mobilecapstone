import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, Modal, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fonts } from '../../../utils/fonts/fonts';
import { colors } from '../../../utils/colors/colors';

const TimeSegmentSelector = ({ navigation, route }) => {
  const { category, activity, categoryTitle, nextScreen, selectedDate } = route.params || {};
  
  const [rememberTime, setRememberTime] = useState(null); // null, true, false
  const [selectedTime, setSelectedTime] = useState(null);
  const [customHour, setCustomHour] = useState('12');
  const [customMinute, setCustomMinute] = useState('00');
  const [customPeriod, setCustomPeriod] = useState('PM');
  const [showTimeModal, setShowTimeModal] = useState(false);
  const [timeType, setTimeType] = useState('segment'); // 'segment' or 'specific'

  const timeSegments = [
    { id: 'morning', label: 'Morning', time: '06:00 - 12:00', icon: '🌅' },
    { id: 'afternoon', label: 'Afternoon', time: '12:00 - 17:00', icon: '☀️' },
    { id: 'evening', label: 'Evening', time: '17:00 - 22:00', icon: '🌇' },
    { id: 'night', label: 'Night', time: '22:00 - 06:00', icon: '🌙' }
  ];

  const handleTimeRememberChoice = (remembers) => {
    setRememberTime(remembers);
    setSelectedTime(null);
    if (!remembers) {
      // Reset custom time inputs if they choose "don't remember"
      setCustomHour('12');
      setCustomMinute('00');
      setCustomPeriod('PM');
      setTimeType('segment');
    } else {
      setTimeType('specific');
    }
  };

  const handleSegmentPress = (segment) => {
    setSelectedTime(segment.id);
    setTimeType('segment');
  };

  const handleSpecificTimePress = () => {
    setShowTimeModal(true);
  };

  const handleTimeConfirm = () => {
    setSelectedTime('specific');
    setTimeType('specific');
    setShowTimeModal(false);
  };

  const formatCustomTime = () => {
    return `${customHour}:${customMinute} ${customPeriod}`;
  };

  const handleContinue = () => {
    // Check validation based on current state
    if (rememberTime === null) {
      Alert.alert('Please choose', 'Do you remember the specific time or not?');
      return;
    }
    
    if (rememberTime === true && !selectedTime) {
      Alert.alert('Please set time', 'Enter the specific time when this happened.');
      return;
    }
    
    if (rememberTime === false && !selectedTime) {
      Alert.alert('Please select', 'Choose a time period when this happened.');
      return;
    }

    let timeValue = null;
    
    // Use selectedDate if provided, otherwise use current date
    const baseDate = selectedDate ? new Date(selectedDate) : new Date();
    
    if (timeType === 'specific') {
      // Convert 12-hour format to 24-hour and create date
      let hour = parseInt(customHour);
      if (customPeriod === 'PM' && hour !== 12) hour += 12;
      if (customPeriod === 'AM' && hour === 12) hour = 0;
      
      timeValue = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate(), hour, parseInt(customMinute), 0).toISOString();
    } else {
      // Create a time based on the middle of the segment
      const segmentTimes = {
        'morning': new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate(), 9, 0, 0),
        'afternoon': new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate(), 14, 30, 0),
        'evening': new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate(), 19, 0, 0),
        'night': new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate(), 23, 30, 0)
      };
      timeValue = segmentTimes[selectedTime].toISOString();
    }

    // If we have activity (coming from activity screen), go to BeforeValence
    if (activity) {
      navigation.navigate('BeforeValence', {
        category,
        activity,
        selectedTime: timeValue,
        timeSegment: timeType === 'segment' ? selectedTime : null,
        selectedDate
      });
    } 
    // If sleep category, go directly to Sleep screen
    else if (category === 'sleep') {
      navigation.navigate('Sleep', {
        category,
        selectedTime: timeValue,
        timeSegment: timeType === 'segment' ? selectedTime : null,
        selectedDate
      });
    }
    // Otherwise, go to the appropriate activity selection screen
    else if (nextScreen) {
      navigation.navigate(nextScreen, {
        category,
        selectedTime: timeValue,
        timeSegment: timeType === 'segment' ? selectedTime : null,
        selectedDate
      });
    }
  };

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }}>
      <TouchableOpacity
        onPress={() => navigation.goBack()}
        className="absolute left-6 top-2 z-10"
        activeOpacity={0.7}
      >
        <Text
          style={{
            fontSize: 28,
            color: colors.text,
            fontFamily: fonts.semiBold
          }}
        >
          ←
        </Text>
      </TouchableOpacity>

      <ScrollView 
        className="flex-1 px-6"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: 80, paddingBottom: 40 }}
      >
        <View className="mb-8">
          <Text 
            className="text-3xl text-center mb-3"
            style={{ 
              color: colors.text,
              fontFamily: fonts.semiBold,
              lineHeight: 42
            }}
          >
            When did this happen?
          </Text>
          <Text 
            className="text-center text-base opacity-80 mb-2"
            style={{ 
              color: colors.text,
              fontFamily: fonts.regular
            }}
          >
            Help us accurately track when your mood/activity occurred
          </Text>
          <Text 
            className="text-center text-sm opacity-60"
            style={{ 
              color: colors.text,
              fontFamily: fonts.regular
            }}
          >
            Category: {categoryTitle || category}
            {activity && ` • Activity: ${activity}`}
          </Text>
        </View>

        {/* Time Memory Question - First Step */}
        <View className="mb-8">
          <Text 
            className="text-xl text-center mb-6"
            style={{ 
              color: colors.text,
              fontFamily: fonts.semiBold
            }}
          >
            Do you remember the specific time?
          </Text>
          
          <View className="flex-row gap-4 mb-6">
            <TouchableOpacity
              onPress={() => handleTimeRememberChoice(true)}
              className={`flex-1 py-4 px-4 rounded-xl ${
                rememberTime === true 
                  ? 'bg-green-100 border-2 border-green-500' 
                  : 'bg-gray-100 border-2 border-gray-300'
              }`}
            >
              <View className="items-center">
                <Text className="text-2xl mb-2">⏰</Text>
                <Text 
                  className={`font-medium ${
                    rememberTime === true ? 'text-green-700' : 'text-gray-700'
                  }`}
                  style={{ fontFamily: fonts.medium }}
                >
                  Yes, I remember
                </Text>
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={() => handleTimeRememberChoice(false)}
              className={`flex-1 py-4 px-4 rounded-xl ${
                rememberTime === false 
                  ? 'bg-blue-100 border-2 border-blue-500' 
                  : 'bg-gray-100 border-2 border-gray-300'
              }`}
            >
              <View className="items-center">
                <Text className="text-2xl mb-2">❓</Text>
                <Text 
                  className={`font-medium ${
                    rememberTime === false ? 'text-blue-700' : 'text-gray-700'
                  }`}
                  style={{ fontFamily: fonts.medium }}
                >
                  No, I don't
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Time Segments - If they don't remember */}
        {rememberTime === false && (
          <View className="mb-8">
            <Text 
              className="text-lg mb-4"
              style={{ 
                color: colors.text,
                fontFamily: fonts.semiBold
              }}
            >
              Select the time period when it happened
            </Text>
          
          <View className="gap-3">
            {timeSegments.map((segment) => (
              <TouchableOpacity
                key={segment.id}
                onPress={() => handleSegmentPress(segment)}
                className={`rounded-2xl p-4 border-2 active:scale-95 ${
                  selectedTime === segment.id && timeType === 'segment' ? 'border-opacity-100' : 'border-opacity-20'
                }`}
                style={{ 
                  backgroundColor: selectedTime === segment.id && timeType === 'segment'
                    ? colors.primary 
                    : colors.secondary,
                  borderColor: colors.primary
                }}
                activeOpacity={0.8}
              >
                <View className="flex-row items-center">
                  <Text className="text-2xl mr-3">{segment.icon}</Text>
                  <View className="flex-1">
                    <Text 
                      className="text-lg"
                      style={{ 
                        color: colors.text,
                        fontFamily: fonts.semiBold
                      }}
                    >
                      {segment.label}
                    </Text>
                    <Text 
                      className="text-sm opacity-70"
                      style={{ 
                        color: colors.text,
                        fontFamily: fonts.regular
                      }}
                    >
                      {segment.time}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        )}

        {/* Specific Time Input - If they remember */}
        {rememberTime === true && (
          <View className="mb-8">
            <Text 
              className="text-lg mb-4"
              style={{ 
                color: colors.text,
                fontFamily: fonts.semiBold
              }}
            >
              Enter the specific time
            </Text>
          
          <TouchableOpacity
            onPress={handleSpecificTimePress}
            className={`rounded-2xl p-4 border-2 active:scale-95 ${
              selectedTime === 'specific' ? 'border-opacity-100' : 'border-opacity-20'
            }`}
            style={{ 
              backgroundColor: selectedTime === 'specific' 
                ? colors.primary 
                : colors.secondary,
              borderColor: colors.primary
            }}
            activeOpacity={0.8}
          >
            <View className="flex-row items-center justify-between">
              <View>
                <Text 
                  className="text-lg"
                  style={{ 
                    color: colors.text,
                    fontFamily: fonts.semiBold
                  }}
                >
                  Specific Time
                </Text>
                <Text 
                  className="text-sm opacity-70"
                  style={{ 
                    color: colors.text,
                    fontFamily: fonts.regular
                  }}
                >
                  {selectedTime === 'specific' 
                    ? formatCustomTime()
                    : 'Tap to set exact time'
                  }
                </Text>
              </View>
              <Text className="text-2xl">🕒</Text>
            </View>
          </TouchableOpacity>
        </View>
        )}

        {/* Time Preview Section */}
        {selectedTime && (
          <View 
            className="mb-6 p-4 rounded-2xl"
            style={{ 
              backgroundColor: 'rgba(59, 130, 246, 0.1)', 
              borderWidth: 1.5,
              borderColor: '#3B82F6', 
              borderStyle: 'dashed'
            }}
          >
            <Text 
              className="text-center text-sm mb-2"
              style={{ 
                color: colors.text,
                fontFamily: fonts.medium,
                opacity: 0.8
              }}
            >
              📅 Time to be saved:
            </Text>
            <Text 
              className="text-center text-lg"
              style={{ 
                color: colors.text,
                fontFamily: fonts.semiBold
              }}
            >
              {timeType === 'specific' 
                ? formatCustomTime()
                : selectedTime === 'morning' ? '9:00 AM'
                : selectedTime === 'afternoon' ? '2:30 PM'
                : selectedTime === 'evening' ? '7:00 PM'
                : selectedTime === 'night' ? '11:30 PM'
                : ''
              }
            </Text>
            <Text 
              className="text-center text-xs mt-1"
              style={{ 
                color: colors.text,
                fontFamily: fonts.regular,
                opacity: 0.6
              }}
            >
              {timeType === 'specific' 
                ? 'Exact time you specified'
                : `Default time for ${selectedTime} period`
              }
            </Text>
          </View>
        )}

        {/* Continue Button */}
        <TouchableOpacity
          onPress={handleContinue}
          disabled={
            rememberTime === null || 
            (rememberTime === true && !selectedTime) ||
            (rememberTime === false && !selectedTime)
          }
          className="rounded-full py-4 px-8 shadow-lg active:scale-95"
          style={{
            backgroundColor: (rememberTime !== null && 
                             ((rememberTime === true && selectedTime) ||
                              (rememberTime === false && selectedTime)))
                           ? colors.primary : colors.secondary,
            opacity: (rememberTime !== null && 
                     ((rememberTime === true && selectedTime) ||
                      (rememberTime === false && selectedTime)))
                    ? 1 : 0.5
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
            {rememberTime === null ? 'Choose if you remember the time' :
             rememberTime === true && !selectedTime ? 'Set specific time' :
             rememberTime === false && !selectedTime ? 'Select a time period' :
             'Continue'}
          </Text>
        </TouchableOpacity>

        {/* Helper Text */}
        <View className="mt-6 items-center">
          <Text 
            className="text-sm text-center opacity-80 px-4"
            style={{ 
              color: colors.text,
              fontFamily: fonts.regular
            }}
          >
            💡 This helps us accurately track when your mood/activity occurred for better insights
          </Text>
        </View>
      </ScrollView>

      {showTimeModal && (
        <Modal transparent animationType="fade">
          <View className="flex-1 justify-center items-center" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <View 
              className="rounded-2xl p-6 m-4"
              style={{ backgroundColor: colors.background }}
            >
              <Text 
                className="text-xl text-center mb-6"
                style={{ 
                  color: colors.text,
                  fontFamily: fonts.semiBold
                }}
              >
                Select Time
              </Text>
              
              <View className="flex-row items-center justify-center mb-6">
                {/* Hour Input */}
                <TextInput
                  value={customHour}
                  onChangeText={(text) => {
                    const num = text.replace(/[^0-9]/g, '');
                    const hour = Math.min(Math.max(parseInt(num) || 1, 1), 12);
                    setCustomHour(hour.toString());
                  }}
                  className="w-16 h-12 text-center rounded-xl mr-2"
                  style={{
                    backgroundColor: colors.secondary,
                    color: colors.text,
                    fontFamily: fonts.semiBold,
                    fontSize: 18,
                    borderWidth: 1,
                    borderColor: colors.primary
                  }}
                  keyboardType="number-pad"
                  maxLength={2}
                />
                
                <Text className="text-xl mx-2" style={{ color: colors.text }}>:</Text>
                
                {/* Minute Input */}
                <TextInput
                  value={customMinute}
                  onChangeText={(text) => {
                    const num = text.replace(/[^0-9]/g, '');
                    const minute = Math.min(Math.max(parseInt(num) || 0, 0), 59);
                    setCustomMinute(minute.toString().padStart(2, '0'));
                  }}
                  className="w-16 h-12 text-center rounded-xl ml-2 mr-4"
                  style={{
                    backgroundColor: colors.secondary,
                    color: colors.text,
                    fontFamily: fonts.semiBold,
                    fontSize: 18,
                    borderWidth: 1,
                    borderColor: colors.primary
                  }}
                  keyboardType="number-pad"
                  maxLength={2}
                />
                
                {/* AM/PM Selector */}
                <View className="flex-row">
                  <TouchableOpacity
                    onPress={() => setCustomPeriod('AM')}
                    className="px-3 py-2 rounded-l-xl"
                    style={{
                      backgroundColor: customPeriod === 'AM' ? colors.primary : colors.secondary,
                      borderWidth: 1,
                      borderColor: colors.primary,
                      borderRightWidth: 0.5
                    }}
                  >
                    <Text style={{ 
                      color: colors.text, 
                      fontFamily: fonts.semiBold,
                      fontSize: 16 
                    }}>
                      AM
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    onPress={() => setCustomPeriod('PM')}
                    className="px-3 py-2 rounded-r-xl"
                    style={{
                      backgroundColor: customPeriod === 'PM' ? colors.primary : colors.secondary,
                      borderWidth: 1,
                      borderColor: colors.primary,
                      borderLeftWidth: 0.5
                    }}
                  >
                    <Text style={{ 
                      color: colors.text, 
                      fontFamily: fonts.semiBold,
                      fontSize: 16 
                    }}>
                      PM
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
              
              <View className="flex-row gap-3 mt-4">
                <TouchableOpacity
                  onPress={() => setShowTimeModal(false)}
                  className="flex-1 rounded-xl py-3"
                  style={{ backgroundColor: colors.secondary }}
                  activeOpacity={0.8}
                >
                  <Text 
                    className="text-center"
                    style={{ 
                      color: colors.text,
                      fontFamily: fonts.regular
                    }}
                  >
                    Cancel
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  onPress={handleTimeConfirm}
                  className="flex-1 rounded-xl py-3"
                  style={{ backgroundColor: colors.primary }}
                  activeOpacity={0.8}
                >
                  <Text 
                    className="text-center"
                    style={{ 
                      color: colors.text,
                      fontFamily: fonts.semiBold
                    }}
                  >
                    Select
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
};

export default TimeSegmentSelector;