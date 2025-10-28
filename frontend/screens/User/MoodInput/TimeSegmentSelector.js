import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, Modal, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fonts } from '../../../utils/fonts/fonts';
import { colors } from '../../../utils/colors/colors';

const TimeSegmentSelector = ({ navigation, route }) => {
  const { category, activity, categoryTitle, nextScreen, selectedDate } = route.params || {};
  
  const [rememberTime, setRememberTime] = useState(null); // null, true, false, 'current'
  const [selectedTime, setSelectedTime] = useState(null);
  const [customHour, setCustomHour] = useState('12');
  const [customMinute, setCustomMinute] = useState('00');
  const [customPeriod, setCustomPeriod] = useState('PM');
  const [showTimeModal, setShowTimeModal] = useState(false);
  const [timeType, setTimeType] = useState('segment'); // 'segment', 'specific', or 'current'
  
  // Helper function to check if selected date is today
  const isToday = () => {
    if (!selectedDate) return true; // If no date selected, assume today
    const today = new Date();
    const selected = new Date(selectedDate);
    return today.toDateString() === selected.toDateString();
  };
  
  // Get current time in 12-hour format
  const getCurrentTime = () => {
    const now = new Date();
    let hours = now.getHours();
    const minutes = now.getMinutes();
    const period = hours >= 12 ? 'PM' : 'AM';
    hours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    return {
      hour: hours.toString(),
      minute: minutes.toString().padStart(2, '0'),
      period,
      fullTime: `${hours}:${minutes.toString().padStart(2, '0')} ${period}`
    };
  };
  
  // Check if a time is in the future (only relevant for today)
  const isTimeInFuture = (hour12, minute, period) => {
    if (!isToday()) return false;
    
    const now = new Date();
    let hour24 = parseInt(hour12);
    if (period === 'AM' && hour24 === 12) hour24 = 0;
    if (period === 'PM' && hour24 !== 12) hour24 += 12;
    
    const selectedTime = new Date();
    selectedTime.setHours(hour24, parseInt(minute), 0, 0);
    
    return selectedTime > now;
  };

  // Check if a time segment is in the future or hasn't occurred yet
  const isSegmentAvailable = (segmentId) => {
    if (!isToday()) return true; // All segments available for past dates
    
    const now = new Date();
    const currentHour = now.getHours();
    
    switch(segmentId) {
      case 'early-morning': // 12:00 AM - 5:59 AM
        return currentHour >= 0 && currentHour <= 5 ? true : currentHour >= 6; // Available if currently in range or past 6 AM
      case 'morning': // 6:00 AM - 11:59 AM
        return currentHour >= 6;
      case 'afternoon': // 12:00 PM - 5:59 PM
        return currentHour >= 12;
      case 'evening': // 6:00 PM - 11:59 PM
        return currentHour >= 18;
      default:
        return true;
    }
  };
  
  const hourScrollRef = useRef(null);
  const minuteScrollRef = useRef(null);
  const periodScrollRef = useRef(null);

  const timeSegments = [
    { id: 'early-morning', label: 'Early Morning', time: '12:00 AM - 5:59 AM', icon: '🌌', midTime: '03:00' },
    { id: 'morning', label: 'Morning', time: '6:00 AM - 11:59 AM', icon: '🌅', midTime: '09:00' },
    { id: 'afternoon', label: 'Afternoon', time: '12:00 PM - 5:59 PM', icon: '☀️', midTime: '15:00' },
    { id: 'evening', label: 'Evening', time: '6:00 PM - 11:59 PM', icon: '🌇', midTime: '21:00' }
  ];

  const handleTimeRememberChoice = (remembers) => {
    setRememberTime(remembers);
    setSelectedTime(null);
    if (remembers === false) {
      // Reset custom time inputs if they choose "don't remember"
      setCustomHour('12');
      setCustomMinute('00');
      setCustomPeriod('PM');
      setTimeType('segment');
    } else if (remembers === true) {
      setTimeType('specific');
      // Only auto-set current time for today, not for past dates
      if (isToday()) {
        const currentTime = getCurrentTime();
        setCustomHour(currentTime.hour);
        setCustomMinute(currentTime.minute);
        setCustomPeriod(currentTime.period);
        setSelectedTime('current');
      } else {
        // For past dates, reset to default time picker values
        setCustomHour('12');
        setCustomMinute('00');
        setCustomPeriod('PM');
      }
    } else if (remembers === 'current') {
      setTimeType('current');
      setSelectedTime('current');
      const currentTime = getCurrentTime();
      setCustomHour(currentTime.hour);
      setCustomMinute(currentTime.minute);
      setCustomPeriod(currentTime.period);
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
    // Check if the selected time is in the future (for today only)
    if (isToday() && isTimeInFuture(customHour, customMinute, customPeriod)) {
      Alert.alert(
        'Invalid Time', 
        'Please choose a time that has already passed today.',
        [{ text: 'OK' }]
      );
      return;
    }
    
    setSelectedTime('specific');
    setTimeType('specific');
    setShowTimeModal(false);
  };

  const formatCustomTime = () => {
    return `${customHour}:${customMinute} ${customPeriod}`;
  };

  const convertTo24Hour = (hour12, minute, period) => {
    let hour24 = parseInt(hour12);
    if (period === 'AM' && hour24 === 12) hour24 = 0;
    if (period === 'PM' && hour24 !== 12) hour24 += 12;
    return `${hour24.toString().padStart(2, '0')}:${minute}`;
  };

  const createTimeFromSegment = (segmentId, baseDate) => {
    const segment = timeSegments.find(s => s.id === segmentId);
    if (!segment) return null;
    
    const [hours, minutes] = segment.midTime.split(':').map(Number);
    return new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate(), hours, minutes, 0);
  };

  // Generate arrays for scrollable pickers
  const hours = ['12', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11'];
  const minutes = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));
  const periods = ['AM', 'PM'];

  const ITEM_HEIGHT = 50;

  const ScrollablePicker = ({ data, selectedValue, onSelect, scrollRef, label }) => {
    const selectedIndex = data.indexOf(selectedValue);
    const [isScrolling, setIsScrolling] = useState(false);
    const scrollTimeoutRef = useRef(null);
    
    const handleScrollBegin = () => {
      setIsScrolling(true);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };

    const snapToNearestItem = (y) => {
      const index = Math.round(y / ITEM_HEIGHT);
      let clampedIndex = Math.max(0, Math.min(index, data.length - 1));
      
      // Find the nearest non-disabled item
      if (isItemDisabled(data[clampedIndex])) {
        // Try to find a non-disabled item before this index
        let foundValidIndex = -1;
        for (let i = clampedIndex - 1; i >= 0; i--) {
          if (!isItemDisabled(data[i])) {
            foundValidIndex = i;
            break;
          }
        }
        
        // If no valid item found before, try after
        if (foundValidIndex === -1) {
          for (let i = clampedIndex + 1; i < data.length; i++) {
            if (!isItemDisabled(data[i])) {
              foundValidIndex = i;
              break;
            }
          }
        }
        
        if (foundValidIndex !== -1) {
          clampedIndex = foundValidIndex;
        }
      }
      
      const targetY = clampedIndex * ITEM_HEIGHT;
      
      scrollRef.current?.scrollTo({
        y: targetY,
        animated: true
      });
      
      onSelect(data[clampedIndex]);
    };

    const handleScrollEnd = (event) => {
      const y = event.nativeEvent.contentOffset.y;
      
      // Clear any existing timeout
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      
      // Set a small delay to allow momentum to finish
      scrollTimeoutRef.current = setTimeout(() => {
        setIsScrolling(false);
        snapToNearestItem(y);
      }, 100);
    };

    const scrollToIndex = (index) => {
      if (scrollRef.current) {
        scrollRef.current.scrollTo({
          y: index * ITEM_HEIGHT,
          animated: true
        });
      }
    };

    React.useEffect(() => {
      if (selectedIndex >= 0) {
        setTimeout(() => scrollToIndex(selectedIndex), 100);
      }
    }, [selectedIndex]);

    React.useEffect(() => {
      return () => {
        if (scrollTimeoutRef.current) {
          clearTimeout(scrollTimeoutRef.current);
        }
      };
    }, []);

    // Check if item should be disabled (future time)
    const isItemDisabled = (item) => {
      if (!isToday()) return false;
      
      let testHour = customHour;
      let testMinute = customMinute;
      let testPeriod = customPeriod;
      
      // Update the test value based on which picker this is for
      if (label === 'Hour') testHour = item;
      if (label === 'Minute') testMinute = item;
      if (label === 'Period') testPeriod = item;
      
      return isTimeInFuture(testHour, testMinute, testPeriod);
    };

    return (
      <View className="flex-1 items-center">
        <Text 
          className="text-sm mb-2 opacity-70"
          style={{ 
            color: colors.text,
            fontFamily: fonts.medium
          }}
        >
          {label}
        </Text>
        <View 
          className="h-32 w-16 relative overflow-hidden rounded-xl"
          style={{ backgroundColor: colors.secondary }}
        >
          {/* Selection highlight */}
          <View 
            className="absolute left-0 right-0 rounded-lg"
            style={{
              top: ITEM_HEIGHT,
              height: ITEM_HEIGHT,
              backgroundColor: colors.primary,
              opacity: 0.3,
              zIndex: 1
            }}
          />
          
          <ScrollView
            ref={scrollRef}
            showsVerticalScrollIndicator={false}
            onScrollBeginDrag={handleScrollBegin}
            onMomentumScrollEnd={handleScrollEnd}
            decelerationRate="fast"
            scrollEventThrottle={64}
            bounces={false}
            contentContainerStyle={{
              paddingVertical: ITEM_HEIGHT
            }}
          >
            {data.map((item, index) => {
              const disabled = isItemDisabled(item);
              return (
                <TouchableOpacity
                  key={index}
                  onPress={() => {
                    if (!disabled) {
                      onSelect(item);
                      scrollToIndex(index);
                    }
                  }}
                  disabled={disabled}
                  className="justify-center items-center"
                  style={{ height: ITEM_HEIGHT }}
                >
                  <Text 
                    className={`text-lg ${selectedValue === item ? 'opacity-100' : disabled ? 'opacity-25' : 'opacity-50'}`}
                    style={{ 
                      color: disabled ? '#999' : colors.text,
                      fontFamily: selectedValue === item ? fonts.semiBold : fonts.regular
                    }}
                  >
                    {item}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </View>
    );
  };

  const handleContinue = () => {
    // Check validation based on current state
    if (rememberTime === null) {
      Alert.alert('Please choose', isToday() ? 'Choose how to set the time.' : 'Do you remember the specific time or not?');
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

    // Validate that selected time is not in the future (for today only)
    if (isToday() && (timeType === 'specific' || timeType === 'current')) {
      if (isTimeInFuture(customHour, customMinute, customPeriod)) {
        Alert.alert('Invalid Time', 'You cannot select a time in the future. Please choose a time that has already passed.');
        return;
      }
    }

    let timeValue = null;
    
    // Use selectedDate if provided, otherwise use current date
    const baseDate = selectedDate ? new Date(selectedDate) : new Date();
    
    if (timeType === 'specific') {
      if (selectedTime === 'current' && isToday()) {
        // Use current time for today
        timeValue = new Date().toISOString();
      } else {
        // Convert 12-hour format to 24-hour and create date
        let hour = parseInt(customHour);
        if (customPeriod === 'PM' && hour !== 12) hour += 12;
        if (customPeriod === 'AM' && hour === 12) hour = 0;
        
        timeValue = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate(), hour, parseInt(customMinute), 0).toISOString();
      }
    } else {
      // Use the middle time of the selected segment
      const segmentTime = createTimeFromSegment(selectedTime, baseDate);
      timeValue = segmentTime ? segmentTime.toISOString() : null;
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
            
            {isToday() && (
              <View 
                className="mb-4 p-3 rounded-xl"
                style={{ 
                  backgroundColor: 'rgba(59, 130, 246, 0.1)', 
                  borderWidth: 1,
                  borderColor: '#3B82F6'
                }}
              >
                <Text 
                  className="text-sm text-center"
                  style={{ 
                    color: '#1E40AF',
                    fontFamily: fonts.medium
                  }}
                >
                  ℹ️ Only time periods that have already occurred today are available
                </Text>
              </View>
            )}
          
          <View className="gap-3">
            {timeSegments.map((segment) => {
              const isAvailable = isSegmentAvailable(segment.id);
              const isDisabled = !isAvailable;
              
              return (
                <TouchableOpacity
                  key={segment.id}
                  onPress={() => !isDisabled && handleSegmentPress(segment)}
                  disabled={isDisabled}
                  className="rounded-2xl p-4 border-2"
                  style={{ 
                    backgroundColor: selectedTime === segment.id && timeType === 'segment' 
                      ? 'rgba(78, 205, 196, 0.1)'
                      : isDisabled 
                        ? '#F3F4F6' 
                        : 'white',
                    borderColor: selectedTime === segment.id && timeType === 'segment'
                      ? '#4ECDC4' 
                      : isDisabled
                        ? '#D1D5DB'
                        : '#B0E5E1',
                    opacity: isDisabled ? 0.6 : 1
                  }}
                  activeOpacity={isDisabled ? 1 : 0.8}
                >
                  <View className="flex-row items-center">
                    <Text 
                      className="text-2xl mr-3"
                      style={{ opacity: isDisabled ? 0.5 : 1 }}
                    >
                      {segment.icon}
                    </Text>
                    <View className="flex-1">
                      <View className="flex-row items-center">
                        <Text 
                          className="text-lg"
                          style={{ 
                            color: isDisabled ? '#9CA3AF' : colors.text,
                            fontFamily: selectedTime === segment.id && timeType === 'segment' 
                              ? fonts.semiBold 
                              : fonts.medium
                          }}
                        >
                          {segment.label}
                        </Text>
                        {isDisabled && (
                          <Text 
                            className="text-xs ml-2 px-2 py-1 rounded-full"
                            style={{ 
                              backgroundColor: '#FEE2E2',
                              color: '#DC2626',
                              fontFamily: fonts.medium
                            }}
                          >
                            Not yet
                          </Text>
                        )}
                      </View>
                      <Text 
                        className="text-sm opacity-70"
                        style={{ 
                          color: isDisabled ? '#9CA3AF' : colors.text,
                          fontFamily: fonts.regular
                        }}
                      >
                        {segment.time}
                      </Text>
                    </View>
                    {selectedTime === segment.id && timeType === 'segment' && !isDisabled && (
                      <View className="ml-2">
                        <Text className="text-xl" style={{ color: '#4ECDC4' }}>✓</Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
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
              {isToday() ? 'Time for this entry' : 'Enter the specific time'}
            </Text>
            
            {/* Show current time preview if auto-selected for today */}
            {isToday() && selectedTime === 'current' && (
              <View
                className="rounded-2xl p-4 border-2 mb-4"
                style={{ 
                  backgroundColor: 'rgba(34, 197, 94, 0.1)', 
                  borderColor: '#22C55E'
                }}
              >
                <View className="flex-row items-center justify-center">
                  <Text className="text-2xl mr-3">⏰</Text>
                  <Text 
                    className="text-lg"
                    style={{ 
                      color: colors.text,
                      fontFamily: fonts.semiBold
                    }}
                  >
                    Current Time: {formatCustomTime()}
                  </Text>
                  <View className="ml-3">
                    <Text className="text-xl" style={{ color: '#22C55E' }}>✓</Text>
                  </View>
                </View>
              </View>
            )}
          
            <TouchableOpacity
              onPress={handleSpecificTimePress}
              className="rounded-2xl p-4 border-2 active:scale-95"
              style={{ 
                backgroundColor: selectedTime === 'specific'
                  ? 'rgba(78, 205, 196, 0.1)' 
                  : 'white',
                borderColor: selectedTime === 'specific'
                  ? '#4ECDC4' 
                  : '#B0E5E1'
              }}
              activeOpacity={0.8}
            >
              <View className="flex-row items-center justify-center">
                <Text className="text-2xl mr-3">🕒</Text>
                <Text 
                  className="text-lg"
                  style={{ 
                    color: colors.text,
                    fontFamily: fonts.semiBold
                  }}
                >
                  {selectedTime === 'specific' 
                    ? formatCustomTime()
                    : (isToday() && selectedTime === 'current')
                      ? 'Change to different time'
                      : 'Tap to set time'
                  }
                </Text>
                {selectedTime === 'specific' && (
                  <View className="ml-2">
                    <Text className="text-xl" style={{ color: '#4ECDC4' }}>✓</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
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
             selectedTime === 'current' ? 'Continue with Current Time' :
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
              className="rounded-2xl p-6 m-4 w-80"
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
              
              <View className="flex-row justify-between items-center mb-4 px-4">
                <ScrollablePicker
                  data={hours}
                  selectedValue={customHour}
                  onSelect={setCustomHour}
                  scrollRef={hourScrollRef}
                  label="Hour"
                />
                
                <Text 
                  className="text-2xl mx-4 mt-8"
                  style={{ color: colors.text, fontFamily: fonts.semiBold }}
                >
                  :
                </Text>
                
                <ScrollablePicker
                  data={minutes}
                  selectedValue={customMinute}
                  onSelect={setCustomMinute}
                  scrollRef={minuteScrollRef}
                  label="Minute"
                />
                
                <ScrollablePicker
                  data={periods}
                  selectedValue={customPeriod}
                  onSelect={setCustomPeriod}
                  scrollRef={periodScrollRef}
                  label="Period"
                />
              </View>

              {/* Future Time Warning */}
              {isToday() && isTimeInFuture(customHour, customMinute, customPeriod) && (
                <View 
                  className="mb-4 p-3 rounded-xl"
                  style={{ 
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    borderWidth: 1,
                    borderColor: '#EF4444'
                  }}
                >
                  <View className="flex-row items-center">
                    <Text className="text-lg mr-2">⚠️</Text>
                    <Text 
                      className="text-sm flex-1"
                      style={{ 
                        color: '#DC2626',
                        fontFamily: fonts.medium
                      }}
                    >
                      Please select a time that has already passed.
                    </Text>
                  </View>
                </View>
              )}
              

              
              <View className="flex-row gap-3">
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