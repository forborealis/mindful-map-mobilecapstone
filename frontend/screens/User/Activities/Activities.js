import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../utils/colors/colors';
import { fonts } from '../../../utils/fonts/fonts';

const Activities = ({ navigation }) => {
  const activities = [
    {
      id: 1,
      title: 'Breathing Exercises',
      description: 'Reduce stress and anxiety with guided breathing techniques. Practice mindful breathing for improved relaxation and mental clarity.',
      icon: 'leaf-outline',
      screen: 'BreathingExercises'
    },
    {
      id: 2,
      title: 'Pomodoro Technique',
      description: 'Boost productivity with timed work and break intervals. An effective method to maintain focus and prevent burnout.',
      icon: 'timer-outline',
      screen: 'PomodoroTechnique'
    },
    {
      id: 3,
      title: 'Guided Meditation',
      description: 'Experience deep relaxation with guided beach-setting meditation. Let the soothing sounds of waves wash away stress and restore inner calm.',
      icon: 'water-outline',
      screen: 'GuidedMeditation'
    },
    {
      id: 4,
      title: 'Daily Affirmation',
      description: 'Build confidence and positive mindset through affirmations. Transform negative thoughts with powerful positive statements.',
      icon: 'heart-outline',
      screen: 'DailyAffirmation'
    },
    {
      id: 5,
      title: 'Calming Music',
      description: 'Relax with soothing melodies and nature sounds. Curated audio tracks designed to reduce anxiety and promote peaceful states of mind.',
      icon: 'musical-notes-outline',
      screen: 'CalmingMusic'
    }
  ];

  const renderActivityCard = (activity) => (
    <TouchableOpacity
      key={activity.id}
      style={styles.activityCard}
      onPress={() => navigation.navigate(activity.screen)}
    >
      <View style={styles.cardHeader}>
        <Ionicons name={activity.icon} size={32} color={colors.primary} />
        <Text style={styles.activityTitle}>{activity.title}</Text>
      </View>
      <Text style={styles.activityDescription}>{activity.description}</Text>
      <View style={styles.cardFooter}>
        <Ionicons name="arrow-forward" size={20} color={colors.primary} />
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.headerTitle}>Mindfulness Activities</Text>
        <Text style={styles.headerSubtitle}>
          Choose an activity to support your mental well-being
        </Text>
        
        <View style={styles.activitiesContainer}>
          {activities.map(activity => renderActivityCard(activity))}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  headerTitle: {
    fontSize: 28,
    fontFamily: fonts.bold,
    color: colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 22,
  },
  activitiesContainer: {
    gap: 16,
  },
  activityCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  activityTitle: {
    fontSize: 20,
    fontFamily: fonts.semiBold,
    color: colors.text,
    marginLeft: 12,
    flex: 1,
  },
  activityDescription: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 16,
  },
  cardFooter: {
    alignItems: 'flex-end',
  },
});

export default Activities;