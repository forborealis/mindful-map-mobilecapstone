import React, { useEffect, useState } from 'react';
import { Modal, View, Text, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../../utils/colors/colors';
import { fonts } from '../../../../utils/fonts/fonts';

const CompletionModal = ({
  visible,
  onClose,
  technique,
  duration,
  streak,
  onRestartSession,
  onViewProgress
}) => {
  const [confettiAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    if (visible) {
      Animated.timing(confettiAnim, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true
      }).start(() => confettiAnim.setValue(0));
    }
  }, [visible]);

  const getCompletionMessage = () => {
    if (streak === 1) return "Congratulations on your first session! 🎉";
    if (streak < 7) return "Great job building your breathing habit! 💪";
    if (streak < 30) return "You're on an amazing streak! Keep it up! 🔥";
    return "You're a breathing master! Incredible dedication! 🧘‍♀️";
  };

  const getNextGoal = () => {
    if (streak < 7) return "Try to reach a 7-day streak!";
    if (streak < 30) return "Can you make it to 30 days?";
    return "You've mastered consistency! Try a new technique!";
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={{
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <View style={{
          backgroundColor: '#fff',
          borderRadius: 24,
          width: '90%',
          paddingBottom: 16,
          overflow: 'hidden'
        }}>
          {/* Confetti Effect */}
          {visible && (
            <Animated.View style={{
              position: 'absolute',
              top: 0, left: 0, right: 0, bottom: 0,
              pointerEvents: 'none',
              opacity: confettiAnim
            }}>
              {[...Array(20)].map((_, i) => (
                <View
                  key={i}
                  style={{
                    position: 'absolute',
                    top: `${Math.random() * 90 + 5}%`,
                    left: `${Math.random() * 90 + 5}%`,
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: '#FFD700',
                  }}
                />
              ))}
            </Animated.View>
          )}

          {/* Header */}
          <View style={{
            backgroundColor: technique.color,
            padding: 24,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            alignItems: 'center'
          }}>
            <Ionicons name="checkmark-circle" size={64} color="#fff" />
            <Text style={{
              fontFamily: fonts.bold,
              fontSize: 22,
              color: '#fff',
              marginTop: 12
            }}>Session Complete!</Text>
            <Text style={{
              color: '#fff',
              fontFamily: fonts.regular,
              marginTop: 6,
              textAlign: 'center'
            }}>{getCompletionMessage()}</Text>
          </View>

          {/* Session Summary */}
          <View style={{
            backgroundColor: colors.surface,
            borderRadius: 16,
            margin: 16,
            padding: 16
          }}>
            <Text style={{
              fontFamily: fonts.bold,
              color: colors.text,
              fontSize: 16,
              marginBottom: 8
            }}>Session Summary</Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <View style={{ alignItems: 'center', flex: 1 }}>
                <Text style={{ fontSize: 28 }}>{technique.icon}</Text>
                <Text style={{ color: colors.textSecondary, marginTop: 4, fontFamily: fonts.regular }}>{technique.name}</Text>
              </View>
              <View style={{ alignItems: 'center', flex: 1 }}>
                <Text style={{ fontSize: 21.5, color: colors.primary, fontFamily: fonts.semiBold }}>{duration.label}</Text>
                <Text style={{ color: colors.textSecondary, marginTop: 4, fontFamily: fonts.regular }}>Duration</Text>
              </View>
            </View>
          </View>

          {/* Streak Info */}
          <View style={{
            backgroundColor: '#FFF7E0',
            borderRadius: 16,
            marginHorizontal: 16,
            marginBottom: 8,
            padding: 16,
            borderWidth: 1,
            borderColor: '#FFD700'
          }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{
                fontFamily: fonts.bold,
                color: '#FFA500',
                fontSize: 16
              }}>
                <Ionicons name="trophy" size={20} color="#FFA500" /> Current Streak
              </Text>
              <Text style={{
                fontFamily: fonts.bold,
                color: '#FFA500',
                fontSize: 22
              }}>{streak}</Text>
            </View>
            <Text style={{
              color: '#FFA500',
              fontFamily: fonts.regular,
              marginTop: 4
            }}>{getNextGoal()}</Text>
          </View>

          {/* Benefits Reminder */}
          <View style={{
            backgroundColor: '#E6F0FF',
            borderRadius: 16,
            marginHorizontal: 16,
            marginBottom: 8,
            padding: 16
          }}>
            <Text style={{
              fontFamily: fonts.bold,
              color: colors.primary,
              fontSize: 16,
              marginBottom: 8
            }}>Benefits You Just Gained:</Text>
            {technique.benefits.slice(0, 3).map((benefit, idx) => (
              <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                <Ionicons name="checkmark-circle" size={16} color={technique.color} style={{ marginRight: 6 }} />
                <Text style={{ color: colors.textSecondary, fontFamily: fonts.regular }}>{benefit}</Text>
              </View>
            ))}
          </View>

          {/* Actions */}
          <View style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            marginHorizontal: 16,
            marginTop: 12
          }}>
            <TouchableOpacity
              onPress={() => {
                onClose();
                onRestartSession();
              }}
              style={{
                flex: 1,
                backgroundColor: technique.color,
                paddingVertical: 12,
                borderRadius: 16,
                alignItems: 'center',
                marginRight: 8
              }}
            >
              <Ionicons name="refresh" size={20} color="#fff" style={{ marginRight: 4 }} />
              <Text style={{
                color: '#fff',
                fontFamily: fonts.bold,
                fontSize: 16
              }}>Another Session</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onViewProgress}
              style={{
                flex: 1,
                backgroundColor: colors.primary,
                paddingVertical: 12,
                borderRadius: 16,
                alignItems: 'center'
              }}
            >
              <Ionicons name="trending-up" size={20} color="#fff" style={{ marginRight: 4 }} />
              <Text style={{
                color: '#fff',
                fontFamily: fonts.bold,
                fontSize: 16
              }}>View Progress</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default CompletionModal;