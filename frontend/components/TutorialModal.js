import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Modal,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../utils/colors/colors';
import { fonts } from '../utils/fonts/fonts';

const { height } = Dimensions.get('window');

const TutorialModal = ({ isOpen, onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);

  const tutorialSteps = [
    {
      title: 'Step 1: Choose a Category',
      description: 'Select what activity, social interaction, health activity, or sleep you want to log. Each category helps us understand different aspects of your wellbeing.',
      details: [
        'Activities: Academic or leisure activities you engaged in',
        'Social Interactions: Time spent with friends, family, or others',
        'Health-related Activities: Exercise, sports, or wellness activities',
        "Previous Night's Sleep: Hours of sleep you got"
      ]
    },
    {
      title: 'Step 2: Select Time',
      description: 'Tell us when this activity or event happened. You have two options:',
      details: [
        'Yes, I remember: Enter the exact specific time',
        "No, I don't: Choose a general time period (Morning, Afternoon, Evening, etc.)",
        'This helps us track when activities happen and how they affect your mood'
      ]
    },
    {
      title: 'Step 3: Select Activity Details',
      description: 'Choose the specific activity or interaction from the available options. This provides context for your mood tracking.',
      details: [
        'Activities: Study, Exam, Project, Gaming, etc.',
        'Social: Who you spent time with and what you did',
        'Health: Type of exercise or wellness activity',
        'Sleep: Enter the number of hours you slept'
      ]
    },
    {
      title: 'Step 4: Before - Valence (Emotion Type)',
      description: 'How did you feel BEFORE doing this activity? Choose the general type of emotion:',
      details: [
        'Positive: Happy, excited, pleased emotions',
        'Negative: Sad, anxious, frustrated emotions',
        "Can't remember: If you don't recall your feeling"
      ]
    },
    {
      title: 'Step 5: Before - Select Emotion',
      description: 'Pick the specific emotion that best describes how you felt BEFORE the activity:',
      details: [
        'Positive emotions: Calm, Excited, Happy, Pleased, Relaxed',
        'Negative emotions: Angry, Anxious, Bored, Frustrated, Sad',
        'Your selection helps create a detailed emotional snapshot'
      ]
    },
    {
      title: 'Step 6: Before - Rate Intensity & Reason',
      description: 'Rate how strongly you felt that emotion (1-5 scale) and explain why:',
      details: [
        '1 = Low intensity (barely felt it)',
        '5 = High intensity (very strong feeling)',
        'Reason: Briefly explain what caused this feeling (up to 100 words)',
        'Example: "I was nervous because it was my first exam"'
      ]
    },
    {
      title: 'Step 7: After - Valence (Emotion Type)',
      description: 'How did you feel AFTER completing this activity? Choose the general type of emotion:',
      details: [
        'Positive: Did the activity make you feel better?',
        'Negative: Did it leave you feeling worse?',
        'This shows how activities impact your emotional state'
      ]
    },
    {
      title: 'Step 8: After - Select Emotion',
      description: 'Pick the specific emotion that best describes how you felt AFTER the activity:',
      details: [
        'Your feeling after completing the activity',
        'Compare with your "before" emotion to see the impact',
        'This helps identify activities that improve or worsen your mood'
      ]
    },
    {
      title: 'Step 9: After - Rate Intensity & Reason',
      description: 'Rate how strongly you felt that emotion (1-5 scale) and explain why:',
      details: [
        '1 = Low intensity',
        '5 = High intensity',
        'Reason: Explain how or why the activity affected your emotions',
        'Example: "I feel relieved because the exam is over!"'
      ]
    },
    {
      title: 'All Done!',
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
      <View
        style={{
          flex: 1,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          justifyContent: 'center',
          alignItems: 'center',
          padding: 12,
        }}
      >
        <View
          style={{
            backgroundColor: colors.backgroundLight || '#F1F8E8',
            borderRadius: 16,
            overflow: 'hidden',
            maxHeight: height * 0.85,
            width: '100%',
          }}
        >
          {/* Header */}
          <View
            style={{
              backgroundColor: colors.primary || '#55AD9B',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingHorizontal: 16,
              paddingVertical: 12,
            }}
          >
            <Text
              style={{
                fontSize: 18,
                fontFamily: fonts.bold,
                color: colors.white || '#fff',
                flex: 1,
                textAlign: 'center',
              }}
            >
              Data Logging Tutorial
            </Text>
            <TouchableOpacity
              onPress={handleClose}
              style={{ padding: 4 }}
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={28} color={colors.white || '#fff'} />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView
            style={{ padding: 16, flexGrow: 0 }}
            showsVerticalScrollIndicator={false}
          >
            {/* Step Title */}
            <Text
              style={{
                fontSize: 18,
                fontFamily: fonts.bold,
                color: colors.textDark || '#272829',
                marginBottom: 10,
              }}
            >
              {step.title}
            </Text>

            {/* Step Description */}
            <Text
              style={{
                fontSize: 14,
                fontFamily: fonts.regular,
                color: colors.textSecondary || '#555',
                lineHeight: 20,
                marginBottom: 12,
                textAlign: 'justify',
              }}
            >
              {step.description}
            </Text>

            {/* Details List */}
            <View style={{ marginBottom: 16, gap: 6 }}>
              {step.details.map((detail, index) => (
                <View
                  key={index}
                  style={{
                    flexDirection: 'row',
                    gap: 10,
                    padding: 10,
                    backgroundColor: colors.backgroundMedium || '#D8EFD3',
                    borderRadius: 10,
                  }}
                >
                  <View
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: 11,
                      backgroundColor: colors.secondary || '#95D2B3',
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 14,
                        fontFamily: fonts.bold,
                        color: colors.textDark || '#272829',
                      }}
                    >
                      {index + 1}
                    </Text>
                  </View>
                  <Text
                    style={{
                      flex: 1,
                      fontSize: 13,
                      fontFamily: fonts.regular,
                      color: colors.textDark || '#272829',
                      lineHeight: 16,
                    }}
                  >
                    {detail}
                  </Text>
                </View>
              ))}
            </View>

            {/* Progress Bar */}
            <View style={{ marginBottom: 12 }}>
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 6,
                }}
              >
                <Text
                  style={{
                    fontSize: 13,
                    fontFamily: fonts.semiBold,
                    color: colors.textDark || '#272829',
                  }}
                >
                  Step {currentStep + 1} of {tutorialSteps.length}
                </Text>
                <Text
                  style={{
                    fontSize: 13,
                    fontFamily: fonts.semiBold,
                    color: colors.textSecondary || '#555',
                  }}
                >
                  {Math.round(progressPercent)}%
                </Text>
              </View>
              <View
                style={{
                  height: 10,
                  backgroundColor: colors.backgroundMedium || '#D8EFD3',
                  borderRadius: 4.5,
                  overflow: 'hidden',
                }}
              >
                <View
                  style={{
                    height: '100%',
                    backgroundColor: colors.primary || '#55AD9B',
                    borderRadius: 2.5,
                    width: `${progressPercent}%`,
                  }}
                />
              </View>
            </View>
          </ScrollView>

          {/* Footer Navigation */}
          <View
            style={{
              flexDirection: 'row',
              gap: 10,
              paddingHorizontal: 16,
              paddingVertical: 10,
              borderTopWidth: 1,
              borderTopColor: colors.backgroundMedium || '#D8EFD3',
              backgroundColor: colors.backgroundLight || '#F1F8E8',
            }}
          >
            <TouchableOpacity
              onPress={handlePrev}
              disabled={currentStep === 0}
              style={{
                flex: 1,
                paddingVertical: 8,
                paddingHorizontal: 12,
                borderRadius: 10,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: colors.primary,
                opacity: currentStep === 0 ? 0.3 : 1,
              }}
              activeOpacity={0.7}
            >
              <Text
                style={{
                  fontSize: 16,
                  fontFamily: fonts.semiBold,
                  color: colors.backgroundLight || '#F1F8E8',
                  ...(currentStep === 0 && { color: colors.textDark || '#272829' }),
                }}
              >
                ← Previous
              </Text>
            </TouchableOpacity>

            {currentStep === tutorialSteps.length - 1 ? (
              <TouchableOpacity
                onPress={handleClose}
                style={{
                  flex: 1,
                  paddingVertical: 8,
                  paddingHorizontal: 12,
                  borderRadius: 10,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: colors.primary || '#55AD9B',
                }}
                activeOpacity={0.7}
              >
                <Text
                  style={{
                    fontSize: 16,
                    fontFamily: fonts.semiBold,
                    color: colors.backgroundLight || '#F1F8E8',
                  }}
                >
                  Start
                </Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={handleNext}
                style={{
                  flex: 1,
                  paddingVertical: 8,
                  paddingHorizontal: 12,
                  borderRadius: 10,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: colors.primary || '#55AD9B',
                }}
                activeOpacity={0.7}
              >
                <Text
                  style={{
                    fontSize: 16,
                    fontFamily: fonts.semiBold,
                    color: colors.backgroundLight || '#F1F8E8',
                  }}
                >
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

export default TutorialModal;