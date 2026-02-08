import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../../utils/colors/colors';
import { fonts } from '../../../utils/fonts/fonts';

export default function MoodHabit() {
  const navigation = useNavigation();

  return (
    <View
      style={{
        marginHorizontal: 16,
        backgroundColor: '#fff',
        borderRadius: 24,
        borderWidth: 1,
        borderColor: '#d6e3df',
        shadowColor: '#000',
        shadowOpacity: 0.06,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
        elevation: 5,
        overflow: 'hidden',
        marginBottom: 16,
      }}
    >
      <View
        style={{
          padding: 18,
          backgroundColor: '#f3f7f6',
        }}
      >
        {/* Header + icon */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
          <View
            style={{
              padding: 10,
              borderRadius: 18,
              backgroundColor: '#E8F5E8',
              marginRight: 10,
            }}
          >
            <MaterialIcons name="analytics" size={26} color="#55AD9B" />
          </View>
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontFamily: fonts.bold,
                fontSize: 22,
                color: '#272829',
              }}
            >
              Mood & Habits Analysis
            </Text>
            <Text
              style={{
                fontFamily: fonts.medium,
                fontSize: 13,
                color: '#4b5563',
                marginTop: 2,
              }}
            >
              Insights from your mood and habit logs to support your recommendations
            </Text>
          </View>
        </View>

        {/* Description */}
        <Text
          style={{
            fontFamily: fonts.medium,
            fontSize: 13,
            color: '#374151',
            lineHeight: 19,
            textAlign: 'justify',
            marginBottom: 14,
          }}
        >
          This dashboard uses your logged moods and habits to highlight patterns—like how you tend
          to feel before and after different activities, social time, health habits, and sleep.
          These insights help form the basis of the recommendations you receive, so you can spot
          what’s helping, what’s not, and what to try next.
        </Text>

        {/* Primary CTA */}
        <View style={{ alignItems: 'center', marginTop: 4 }}>
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => navigation.navigate('MoodHabitAnalysis')}
            style={{
              width: '100%',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: colors.primary,
              paddingVertical: 14,
              paddingHorizontal: 16,
              borderRadius: 16,
              shadowColor: '#000',
              shadowOpacity: 0.12,
              shadowRadius: 8,
              shadowOffset: { width: 0, height: 3 },
              elevation: 3,
            }}
          >
            <MaterialCommunityIcons
              name="calendar-today"
              size={24}
              color="#fff"
              style={{ marginRight: 12 }}
            />
            <View style={{ flexShrink: 1 }}>
              <Text
                style={{
                  fontFamily: fonts.semiBold,
                  fontSize: 16,
                  color: '#fff',
                  textAlign: 'left',
                }}
              >
                Daily Statistics
              </Text>
              <Text
                style={{
                  fontFamily: fonts.medium,
                  fontSize: 13,
                  color: '#f3f6fa',
                  opacity: 0.9,
                  textAlign: 'left',
                  marginTop: 2,
                }}
              >
                Today&apos;s mood and habit insights
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}