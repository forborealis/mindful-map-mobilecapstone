import React from 'react';
import { View, Text, TouchableOpacity, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../../../utils/colors/colors';
import { fonts } from '../../../utils/fonts/fonts';
import { MaterialIcons } from '@expo/vector-icons';

const screenWidth = Dimensions.get('window').width;
const containerWidth = screenWidth * 0.92;

export default function DetailedMoodAnalysis() {
  const navigation = useNavigation();

  return (
    <View style={{
      backgroundColor: '#FFFFFF',
      borderRadius: 28,
      padding: 22,
      width: containerWidth,
      alignSelf: 'center',
      marginTop: 28,
      marginBottom: 18,
      shadowColor: '#000',
      shadowOpacity: 0.08,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 2 },
      elevation: 4,
    }}>
      {/* Header */}
      <View style={{ alignItems: 'center', marginBottom: 10 }}>
        <Text style={{
          fontFamily: fonts.bold,
          fontSize: 22,
          color: colors.primary,
          textAlign: 'center',
        }}>
          Detailed Mood Analysis
        </Text>
      </View>

      {/* Description */}
      <Text style={{
        fontFamily: fonts.medium,
        fontSize: 15,
        color: colors.text,
        marginBottom: 18,
        opacity: 0.8,
        textAlign: 'justify',
      }}>
        Get comprehensive insights into your emotional patterns. 
      </Text>

      {/* Navigation Cards */}
      <TouchableOpacity
        onPress={() => navigation.navigate('DailyStatistics')}
        style={{
          backgroundColor: '#fff',
          borderRadius: 16,
          borderWidth: 2,
          borderColor: '#E6F7F2',
          paddingVertical: 18,
          paddingHorizontal: 18,
          flexDirection: 'row',
          alignItems: 'center',
          marginBottom: 12,
          elevation: 2,
          justifyContent: 'center',
        }}
      >
        <MaterialIcons name="menu" size={24} color={colors.primary} style={{ marginRight: 14 }} />
        <View>
          <Text style={{
            fontFamily: fonts.bold,
            fontSize: 16,
            color: colors.primary,
            marginBottom: 2,
          }}>
            Daily Mood Analysis
          </Text>
          <Text style={{
            fontFamily: fonts.medium,
            fontSize: 13,
            color: colors.text,
            opacity: 0.7,
          }}>
            Day-by-day mood insights
          </Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => navigation.navigate('WeeklyStatistics')}
        style={{
          backgroundColor: '#fff',
          borderRadius: 16,
          borderWidth: 2,
          borderColor: '#E6F7F2',
          paddingVertical: 18,
          paddingHorizontal: 18,
          flexDirection: 'row',
          alignItems: 'center',
          elevation: 2,
          justifyContent: 'center',
        }}
      >
        <MaterialIcons name="bar-chart" size={24} color={colors.primary} style={{ marginRight: 14 }} />
        <View>
          <Text style={{
            fontFamily: fonts.bold,
            fontSize: 16,
            color: colors.primary,
            marginBottom: 2,
          }}>
            Weekly Mood Analysis
          </Text>
          <Text style={{
            fontFamily: fonts.medium,
            fontSize: 13,
            color: colors.text,
            opacity: 0.7,
          }}>
            Weekly mood insights & patterns
          </Text>
        </View>
      </TouchableOpacity>
    </View>
  );
}