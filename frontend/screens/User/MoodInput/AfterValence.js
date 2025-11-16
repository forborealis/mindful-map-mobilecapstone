import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fonts } from '../../../utils/fonts/fonts';
import { colors } from '../../../utils/colors/colors';
import { Ionicons } from '@expo/vector-icons';
const options = [
  { id: 'positive', label: 'Positive', emoji: '👍' },
  { id: 'negative', label: 'Negative', emoji: '👎' }
];

const AfterValence = ({ navigation, route }) => {
  const [selected, setSelected] = useState(null);

  // Get all parameters from previous screens
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

  const handleSelect = (id) => {
    setSelected(id);
    const params = {
      category, 
      activity, 
      hrs, 
      selectedTime,
      selectedDate,
      beforeValence,
      beforeEmotion,
      beforeIntensity,
      beforeReason
    };
    
    if (id === 'positive') {
      navigation.navigate('AfterPositive', params);
    }
    else {
      navigation.navigate('AfterNegative', params);
    }
  };

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }}>
      <View className="flex-1 justify-center px-8">
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
          className="text-3xl text-center mb-16"
          style={{
            color: colors.text,
            fontFamily: fonts.semiBold,
            lineHeight: 34
          }}
        >
          How do you feel after doing the activity?
        </Text>
        <View className="mb-10">
          {options.map((option) => (
            <TouchableOpacity
              key={option.id}
              onPress={() => handleSelect(option.id)}
              className="flex-row items-center justify-center mb-4 rounded-2xl py-4"
              style={{
                backgroundColor: colors.secondary,
                borderWidth: selected === option.id ? 2 : 0,
                borderColor: colors.primary,
                shadowColor: colors.primary,
                shadowOpacity: selected === option.id ? 0.15 : 0,
                shadowRadius: 6
              }}
              activeOpacity={0.8}
            >
              <Text
                className="text-lg"
                style={{
                  color: colors.text,
                  fontFamily: selected === option.id ? fonts.semiBold : fonts.regular
                }}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <View
          className="flex-row items-center justify-center px-4 py-3"
          style={{
            backgroundColor: colors.accent,
            opacity: 0.85
          }}
        >
          <Text style={{ fontSize: 18, marginRight: 8 }}>💡</Text>
          <Text
            className="text-sm flex-1"
            style={{
              color: colors.text,
              fontFamily: fonts.regular,
              opacity: 0.85
            }}
          >
            Take a moment to reflect on your emotional state before engaging in the activity.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default AfterValence;