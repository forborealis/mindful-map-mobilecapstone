import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Modal,
  Dimensions,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../utils/colors/colors';
import { fonts } from '../utils/fonts/fonts';

const { height } = Dimensions.get('window');

const TutorialModal = ({ isOpen, onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);

  const tutorialSteps = [
    {
      title: '📋 Step 1: Choose a Category',
      description: 'Select what activity, social interaction, health activity, or sleep you want to log. Each category helps us understand different aspects of your wellbeing.',
      details: [
        'Activities: Academic or leisure activities you engaged in',
        'Social Interactions: Time spent with friends, family, or others',
        'Health-related Activities: Exercise, sports, or wellness activities',
        "Previous Night's Sleep: Hours of sleep you got"
      ]
    },
    {
      title: '⏰ Step 2: Select Time',
      description: 'Tell us when this activity or event happened. You have two options:',
      details: [
        'Yes, I remember: Enter the exact specific time',
        "No, I don't: Choose a general time period (Morning, Afternoon, Evening, etc.)",
        'This helps us track when activities happen and how they affect your mood'
      ]
    },
    {
      title: '🎯 Step 3: Select Activity Details',
      description: 'Choose the specific activity or interaction from the available options. This provides context for your mood tracking.',
      details: [
        'Activities: Study, Exam, Project, Gaming, etc.',
        'Social: Who you spent time with and what you did',
        'Health: Type of exercise or wellness activity',
        'Sleep: Enter the number of hours you slept'
      ]
    },
    {
      title: '😊 Step 4: Before - Valence (Emotion Type)',
      description: 'How did you feel BEFORE doing this activity? Choose the general type of emotion:',
      details: [
        'Positive: Happy, excited, pleased emotions',
        'Negative: Sad, anxious, frustrated emotions',
        "Can't remember: If you don't recall your feeling"
      ]
    },
    {
      title: '😄 Step 5: Before - Select Emotion',
      description: 'Pick the specific emotion that best describes how you felt BEFORE the activity:',
      details: [
        'Positive emotions: Calm, Excited, Happy, Pleased, Relaxed',
        'Negative emotions: Angry, Anxious, Bored, Frustrated, Sad',
        'Your selection helps create a detailed emotional snapshot'
      ]
    },
    {
      title: '📊 Step 6: Before - Rate Intensity & Reason',
      description: 'Rate how strongly you felt that emotion (1-5 scale) and explain why:',
      details: [
        '1 = Low intensity (barely felt it)',
        '5 = High intensity (very strong feeling)',
        'Reason: Briefly explain what caused this feeling (up to 100 words)',
        'Example: "I was nervous because it was my first exam"'
      ]
    },
    {
      title: '😊 Step 7: After - Valence (Emotion Type)',
      description: 'How did you feel AFTER completing this activity? Choose the general type of emotion:',
      details: [
        'Positive: Did the activity make you feel better?',
        'Negative: Did it leave you feeling worse?',
        'This shows how activities impact your emotional state'
      ]
    },
    {
      title: '😄 Step 8: After - Select Emotion',
      description: 'Pick the specific emotion that best describes how you felt AFTER the activity:',
      details: [
        'Your feeling after completing the activity',
        'Compare with your "before" emotion to see the impact',
        'This helps identify activities that improve or worsen your mood'
      ]
    },
    {
      title: '📊 Step 9: After - Rate Intensity & Reason',
      description: 'Rate how strongly you felt that emotion (1-5 scale) and explain why:',
      details: [
        '1 = Low intensity',
        '5 = High intensity',
        'Reason: Explain how or why the activity affected your emotions',
        'Example: "I feel relieved because the exam is over!"'
      ]
    },
    {
      title: '✅ All Done!',
      description: 'Your mood entry has been successfully logged! Over time, this data will help:',
      details: [
        'Identify which activities improve your mood',
        'Spot patterns in your emotional responses',
        'Track your overall wellbeing trends',
        'Get personalized recommendations based on your data'
      ]
    }
  ];

  const step = tutorialSteps[currentStep];

  const handleNext = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleClose = () => {
    setCurrentStep(0);
    onClose();
  };

  const progressPercent = ((currentStep + 1) / tutorialSteps.length) * 100;

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>📚 Data Logging Tutorial</Text>
            <TouchableOpacity
              onPress={handleClose}
              style={styles.closeButton}
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={28} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView 
            style={styles.content}
            showsVerticalScrollIndicator={false}
          >
            {/* Step Title */}
            <Text style={styles.stepTitle}>{step.title}</Text>

            {/* Step Description */}
            <Text style={styles.stepDescription}>{step.description}</Text>

            {/* Details List */}
            <View style={styles.detailsList}>
              {step.details.map((detail, index) => (
                <View key={index} style={styles.detailItem}>
                  <View style={styles.numberBadge}>
                    <Text style={styles.numberText}>{index + 1}</Text>
                  </View>
                  <Text style={styles.detailText}>{detail}</Text>
                </View>
              ))}
            </View>

            {/* Progress Bar */}
            <View style={styles.progressSection}>
              <View style={styles.progressInfo}>
                <Text style={styles.progressLabel}>
                  Step {currentStep + 1} of {tutorialSteps.length}
                </Text>
                <Text style={styles.progressPercent}>
                  {Math.round(progressPercent)}%
                </Text>
              </View>
              <View style={styles.progressBarContainer}>
                <View 
                  style={[
                    styles.progressBar,
                    { width: `${progressPercent}%` }
                  ]}
                />
              </View>
            </View>
          </ScrollView>

          {/* Footer Navigation */}
          <View style={styles.footer}>
            <TouchableOpacity
              onPress={handlePrev}
              disabled={currentStep === 0}
              style={[
                styles.button,
                styles.prevButton,
                currentStep === 0 && styles.buttonDisabled
              ]}
              activeOpacity={0.7}
            >
              <Text 
                style={[
                  styles.buttonText,
                  styles.prevButtonText,
                  currentStep === 0 && styles.buttonTextDisabled
                ]}
              >
                ← Previous
              </Text>
            </TouchableOpacity>

            {currentStep === tutorialSteps.length - 1 ? (
              <TouchableOpacity
                onPress={handleClose}
                style={[styles.button, styles.finishButton]}
                activeOpacity={0.7}
              >
                <Text style={[styles.buttonText, styles.finishButtonText]}>
                  Start 🚀
                </Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={handleNext}
                style={[styles.button, styles.nextButton]}
                activeOpacity={0.7}
              >
                <Text style={[styles.buttonText, styles.nextButtonText]}>
                  Next →
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
  },
  container: {
    backgroundColor: '#F1F8E8',
    borderRadius: 16,
    overflow: 'hidden',
    maxHeight: height * 0.85,
    width: '100%',
  },
  header: {
    backgroundColor: '#55AD9B',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 16,
    fontFamily: fonts.bold,
    color: '#fff',
    flex: 1,
  },
  closeButton: {
    padding: 4,
  },
  content: {
    padding: 16,
    flexGrow: 0,
  },
  stepTitle: {
    fontSize: 18,
    fontFamily: fonts.bold,
    color: '#272829',
    marginBottom: 10,
  },
  stepDescription: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: '#555',
    lineHeight: 20,
    marginBottom: 12,
  },
  detailsList: {
    marginBottom: 16,
    gap: 6,
  },
  detailItem: {
    flexDirection: 'row',
    gap: 10,
    padding: 10,
    backgroundColor: '#D8EFD3',
    borderRadius: 10,
  },
  numberBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#95D2B3',
    justifyContent: 'center',
    alignItems: 'center',
  },
  numberText: {
    fontSize: 10,
    fontFamily: fonts.bold,
    color: '#272829',
  },
  detailText: {
    flex: 1,
    fontSize: 12,
    fontFamily: fonts.regular,
    color: '#272829',
    lineHeight: 16,
  },
  progressSection: {
    marginBottom: 12,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  progressLabel: {
    fontSize: 11,
    fontFamily: fonts.semiBold,
    color: '#272829',
  },
  progressPercent: {
    fontSize: 11,
    fontFamily: fonts.semiBold,
    color: '#555',
  },
  progressBarContainer: {
    height: 5,
    backgroundColor: '#D8EFD3',
    borderRadius: 2.5,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#55AD9B',
    borderRadius: 2.5,
  },
  footer: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#D8EFD3',
    backgroundColor: '#F1F8E8',
  },
  button: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  prevButton: {
    backgroundColor: '#95D2B3',
  },
  nextButton: {
    backgroundColor: '#55AD9B',
  },
  finishButton: {
    backgroundColor: '#55AD9B',
  },
  buttonDisabled: {
    opacity: 0.3,
  },
  buttonText: {
    fontSize: 12,
    fontFamily: fonts.semiBold,
  },
  prevButtonText: {
    color: '#272829',
  },
  nextButtonText: {
    color: '#F1F8E8',
  },
  finishButtonText: {
    color: '#F1F8E8',
  },
  buttonTextDisabled: {
    color: '#272829',
  },
});

export default TutorialModal;
