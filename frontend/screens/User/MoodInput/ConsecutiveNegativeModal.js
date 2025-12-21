import React, { useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Dimensions,
} from 'react-native';
import { fonts } from '../../../utils/fonts/fonts';
import { colors } from '../../../utils/colors/colors';

const { width, height } = Dimensions.get('window');

const ConsecutiveNegativeModal = ({ isOpen, onClose, onViewResources, consecutiveCount }) => {
  // Array of encouraging messages
  const encouragingMessages = useMemo(() => [
    {
      title: "We're Here For You 💚",
      message: "It's okay to have tough days. You're stronger than you think, and we believe in you. Remember, every moment is a chance to feel better.",
      supportText: "Reach out to someone you trust or explore our mental health resources below."
    },
    {
      title: "You've Got This! 🌟",
      message: "We see you're going through something challenging right now. That takes courage to acknowledge. You deserve support and kindness—especially from yourself.",
      supportText: "Browse our resources and remember: seeking help is a sign of strength."
    },
    {
      title: "Let's Turn Things Around 🌈",
      message: "Rough patches are part of life, but they don't define you. We're so glad you're tracking your emotions—that's the first step to feeling better.",
      supportText: "Explore calming activities and support tools designed just for you."
    },
    {
      title: "You Matter More Than You Know ✨",
      message: "Your feelings are valid, and you don't have to handle everything alone. Take a deep breath—better days are coming, and we're here to help.",
      supportText: "Check out our mental health resources and find what works best for you."
    },
    {
      title: "This Moment Doesn't Define Your Story 💫",
      message: "Life has ups and downs, and right now you're in a down moment. But that's temporary. You have the strength to bounce back—we know you do.",
      supportText: "Discover strategies and resources to lift your spirits."
    },
    {
      title: "You're Doing Better Than You Think 🎯",
      message: "The fact that you're here, tracking your emotions, and taking care of yourself shows real strength. Don't be hard on yourself right now.",
      supportText: "Lean on our support resources—you deserve to feel your best."
    }
  ], []);

  // Get a random message
  const randomMessage = useMemo(() => {
    return encouragingMessages[Math.floor(Math.random() * encouragingMessages.length)];
  }, [encouragingMessages, isOpen]);

  const handleViewResources = () => {
    onClose();
    onViewResources();
  };

  const handleDismiss = () => {
    onClose();
  };

  return (
    <Modal
      visible={isOpen}
      transparent={true}
      animationType="fade"
      onRequestClose={handleDismiss}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          justifyContent: 'center',
          alignItems: 'center',
          paddingHorizontal: 16,
        }}
      >
        <View
          style={{
            backgroundColor: colors.white,
            borderRadius: 24,
            padding: 24,
            maxWidth: 400,
            width: '100%',
            shadowColor: '#000',
            shadowOffset: {
              width: 0,
              height: 4,
            },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 10,
          }}
        >
          {/* Heart Icon */}
          <View
            style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              backgroundColor: colors.accent + '20',
              justifyContent: 'center',
              alignItems: 'center',
              alignSelf: 'center',
              marginBottom: 16,
            }}
          >
            <Text style={{ fontSize: 48 }}>💚</Text>
          </View>

          {/* Title */}
          <Text
            style={{
              fontSize: 22,
              fontFamily: fonts.bold,
              color: colors.text,
              textAlign: 'center',
              marginBottom: 12,
            }}
          >
            {randomMessage.title}
          </Text>

          {/* Message */}
          <Text
            style={{
              fontSize: 14,
              fontFamily: fonts.regular,
              color: colors.text,
              textAlign: 'center',
              lineHeight: 22,
              marginBottom: 16,
            }}
          >
            {randomMessage.message}
          </Text>

          {/* Support Message Box */}
          <View
            style={{
              backgroundColor: colors.accent + '15',
              borderRadius: 12,
              padding: 12,
              marginBottom: 20,
              borderLeftWidth: 4,
              borderLeftColor: colors.accent,
            }}
          >
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'flex-start',
                gap: 10,
              }}
            >
              <Text style={{ fontSize: 20 }}>💚</Text>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 12,
                    fontFamily: fonts.semiBold,
                    color: colors.text,
                    marginBottom: 4,
                  }}
                >
                  We're here to support you
                </Text>
                <Text
                  style={{
                    fontSize: 12,
                    fontFamily: fonts.regular,
                    color: colors.text,
                    lineHeight: 18,
                  }}
                >
                  {randomMessage.supportText}
                </Text>
              </View>
            </View>
          </View>

          {/* Buttons */}
          <View style={{ gap: 12 }}>
            <TouchableOpacity
              onPress={handleViewResources}
              style={{
                backgroundColor: colors.primary,
                borderRadius: 16,
                padding: 16,
                alignItems: 'center',
              }}
            >
              <Text
                style={{
                  fontSize: 16,
                  fontFamily: fonts.semiBold,
                  color: colors.creamWhite,
                }}
              >
                View Support Resources
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleDismiss}
              style={{
                backgroundColor: colors.white,
                borderRadius: 16,
                padding: 16,
                alignItems: 'center',
                borderWidth: 2,
                borderColor: colors.primary + '40',
              }}
            >
              <Text
                style={{
                  fontSize: 16,
                  fontFamily: fonts.semiBold,
                  color: colors.text,
                }}
              >
                Thank You, I'm Okay.
              </Text>
            </TouchableOpacity>
          </View>

          {/* Helper text */}
          <View style={{ marginTop: 16, alignItems: 'center' }}>
            <Text
              style={{
                fontSize: 12,
                fontFamily: fonts.regular,
                color: colors.text,
                opacity: 0.6,
              }}
            >
              💚 Your wellbeing is our priority. Take care of yourself.
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default ConsecutiveNegativeModal;
