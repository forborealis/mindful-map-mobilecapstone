import React from 'react';
import { ScrollView, View } from 'react-native';
import DetailedMoodAnalysis from './DetailedMoodAnalysis';
import MoodCount from './MoodCount';
import SleepAnalysis from './SleepAnalysis';
import MoodHabit from './MoodHabit';
import { colors } from '../../../utils/colors/colors';

export default function StatisticsDashboard() {
  return (
    <ScrollView style={{ backgroundColor: colors.background }}>
      <View style={{ paddingTop: 16 }}>
        <MoodHabit />
      </View>
      <View style={{ marginTop: 16 }}>
        <DetailedMoodAnalysis />
      </View>
      <View style={{ marginTop: 16 }}>
        <MoodCount />
      </View>
      <View style={{ marginTop: 16, paddingBottom: 30 }}>
        <SleepAnalysis />
      </View>
    </ScrollView>
  );
}