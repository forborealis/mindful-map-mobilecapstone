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
      backgroundColor: '#F8F8FF',
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
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
        <View style={{
          backgroundColor: '#DFF7EC',
          borderRadius: 12,
          padding: 10,
          marginRight: 12,
        }}>
          <MaterialIcons name="show-chart" size={28} color={colors.primary} />
        </View>
        <View>
          <Text style={{
            fontFamily: fonts.bold,
            fontSize: 22,
            color: colors.primary,
          }}>
            Detailed Mood Analysis
          </Text>
          <Text style={{
            fontFamily: fonts.medium,
            fontSize: 15,
            color: colors.text,
            opacity: 0.7,
          }}>
            Get comprehensive insights into your emotional patterns
          </Text>
        </View>
      </View>

      {/* Description */}
      <Text style={{
        fontFamily: fonts.medium,
        fontSize: 14,
        color: colors.text,
        marginBottom: 18,
        opacity: 0.8,
      }}>
        Explore in-depth statistics about your daily and weekly mood patterns. Discover trends, compare time periods, and gain valuable insights into your emotional journey.
      </Text>

      {/* Navigation Card */}
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
          marginBottom: 8,
          elevation: 2,
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
            Daily Statistics
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
    </View>
  );
}