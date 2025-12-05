import React from 'react';
import { ScrollView, View } from 'react-native';
import DetailedMoodAnalysis from './DetailedMoodAnalysis';
import MoodCount from './MoodCount';
import SleepAnalysis from './SleepAnalysis';
import Anova from './Anova';
import { colors } from '../../../utils/colors/colors';

export default function StatisticsDashboard() {
  return (
    <ScrollView style={{ backgroundColor: colors.background }}>
      <View style={{ paddingTop: 16 }}>
        <Anova />
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