import React from 'react';
import { ScrollView, View } from 'react-native';
import DetailedMoodAnalysis from './DetailedMoodAnalysis';
import MoodCount from './MoodCount';
import SleepAnalysis from './SleepAnalysis';
import { colors } from '../../../utils/colors/colors';

export default function StatisticsDashboard() {
  return (
    <ScrollView style={{ backgroundColor: colors.background }}>
      <View style={{ marginBottom: 24 }}>
        <DetailedMoodAnalysis />
      </View>
      <View style={{ marginBottom: 24 }}>
        <MoodCount />
      </View>
      <View style={{ marginBottom: 24 }}>
        <SleepAnalysis />
      </View>
    </ScrollView>
  );
}