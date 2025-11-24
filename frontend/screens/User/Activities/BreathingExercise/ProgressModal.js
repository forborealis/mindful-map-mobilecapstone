import React from 'react';
import { Modal, View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../../utils/colors/colors';
import { fonts } from '../../../../utils/fonts/fonts';

const ProgressModal = ({
  visible,
  onClose,
  streak,
  totalSessions,
  techniqueProgress,
  techniques
}) => {
  const getStreakMessage = () => {
    if (streak === 0) return "Start your breathing journey today!";
    if (streak === 1) return "Great start! Keep it going!";
    if (streak < 7) return "Building a healthy habit!";
    if (streak < 30) return "You're on fire! 🔥";
    return "Breathing master! 🧘‍♀️";
  };

  const getAchievements = () => {
    const achievements = [];
    if (totalSessions >= 1) achievements.push({ title: "First Breath", desc: "Completed your first session", icon: "🌟" });
    if (totalSessions >= 10) achievements.push({ title: "Dedicated Breather", desc: "Completed 10 sessions", icon: "💪" });
    if (totalSessions >= 50) achievements.push({ title: "Breathing Expert", desc: "Completed 50 sessions", icon: "🏆" });
    if (streak >= 7) achievements.push({ title: "Week Warrior", desc: "7 day streak", icon: "📅" });
    if (streak >= 30) achievements.push({ title: "Monthly Master", desc: "30 day streak", icon: "🎯" });
    return achievements;
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
          maxHeight: '90%',
          paddingBottom: 16,
          overflow: 'hidden'
        }}>
          <View style={{
            backgroundColor: colors.primary,
            padding: 24,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            alignItems: 'center'
          }}>
            <Ionicons name="trending-up" size={48} color="#fff" />
            <Text style={{
              fontFamily: fonts.bold,
              fontSize: 22,
              color: '#fff',
              marginTop: 12
            }}>Your Progress</Text>
            <Text style={{
              color: '#fff',
              fontFamily: fonts.regular,
              marginTop: 6,
              textAlign: 'center'
            }}>Track your breathing journey</Text>
          </View>
          <ScrollView style={{ maxHeight: 400 }}>
            {/* Stats Overview */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', margin: 16 }}>
              <View style={{
                backgroundColor: '#E6FFE6',
                borderRadius: 16,
                flex: 1,
                alignItems: 'center',
                padding: 16,
                marginRight: 8
              }}>
                <Text style={{ fontSize: 28, color: '#34A853', fontFamily: fonts.bold }}>{streak}</Text>
                <Text style={{ color: '#34A853', fontFamily: fonts.medium }}>Day Streak</Text>
                <Text style={{ color: '#34A853', fontFamily: fonts.regular, marginTop: 4, textAlign: 'center' }}>{getStreakMessage()}</Text>
              </View>
              <View style={{
                backgroundColor: '#E6F0FF',
                borderRadius: 16,
                flex: 1,
                alignItems: 'center',
                padding: 16
              }}>
                <Text style={{ fontSize: 28, color: colors.primary, fontFamily: fonts.bold }}>{totalSessions}</Text>
                <Text style={{ color: colors.primary, fontFamily: fonts.medium }}>Total Sessions</Text>
                <Text style={{ color: colors.primary, fontFamily: fonts.regular, marginTop: 4, textAlign: 'center' }}>Sessions completed</Text>
              </View>
            </View>

            {/* Technique Breakdown */}
            <View style={{ marginHorizontal: 16, marginBottom: 12 }}>
              <Text style={{
                fontFamily: fonts.bold,
                fontSize: 16,
                color: colors.text,
                marginBottom: 8
              }}>
                <Ionicons name="time" size={18} color={colors.primary} /> Technique Usage
              </Text>
              {techniques.map(technique => {
                const count = techniqueProgress[technique.id] || 0;
                const percentage = totalSessions > 0 ? (count / totalSessions) * 100 : 0;
                return (
                  <View key={technique.id} style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: colors.surface,
                    borderRadius: 12,
                    padding: 12,
                    marginBottom: 6,
                    justifyContent: 'space-between',
                    fontFamily: fonts.regular
                  }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Text style={{ fontSize: 22, marginRight: 8, fontFamily: fonts.regular }}>{technique.icon}</Text>
                      <View>
                        <Text style={{ fontFamily: fonts.medium, color: colors.text }}>{technique.name}</Text>
                        <Text style={{ fontSize: 12, color: colors.textSecondary, fontFamily: fonts.regular }}>{count} sessions</Text>
                      </View>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <View style={{
                        width: 60,
                        height: 6,
                        backgroundColor: '#eee',
                        borderRadius: 3,
                        marginRight: 6
                      }}>
                        <View style={{
                          height: 6,
                          borderRadius: 3,
                          backgroundColor: technique.color,
                          fontFamily: fonts.regular,
                          width: `${percentage}%`
                        }} />
                      </View>
                      <Text style={{ fontSize: 12, color: colors.textSecondary }}>{Math.round(percentage)}%</Text>
                    </View>
                  </View>
                );
              })}
            </View>

            {/* Achievements */}
            <View style={{ marginHorizontal: 16, marginBottom: 12 }}>
              <Text style={{
                fontFamily: fonts.bold,
                fontSize: 16,
                color: colors.text,
                marginBottom: 8
              }}>
                <Ionicons name="trophy" size={18} color="#FFA500" /> Achievements
              </Text>
              {getAchievements().length === 0 ? (
                <View style={{
                  alignItems: 'center',
                  padding: 24,
                  backgroundColor: colors.surface,
                  borderRadius: 12
                }}>
                  <Ionicons name="trophy" size={48} color="#FFD700" style={{ opacity: 0.3 }} />
                  <Text style={{ color: colors.textSecondary, marginTop: 8 }}>Complete sessions to unlock achievements!</Text>
                </View>
              ) : (
                getAchievements().map((achievement, idx) => (
                  <View key={idx} style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: '#FFF7E0',
                    borderRadius: 12,
                    padding: 12,
                    marginBottom: 6,
                    borderWidth: 1,
                    borderColor: '#FFD700'
                  }}>
                    <Text style={{ fontSize: 22, marginRight: 8 }}>{achievement.icon}</Text>
                    <View>
                      <Text style={{ fontFamily: fonts.bold, color: '#FFA500' }}>{achievement.title}</Text>
                      <Text style={{ fontSize: 12, color: '#FFA500', fontFamily: fonts.regular }}>{achievement.desc}</Text>
                    </View>
                    <Ionicons name="checkmark-circle" size={18} color={colors.primary} style={{ marginLeft: 'auto' }} />
                  </View>
                ))
              )}
            </View>
          </ScrollView>
          <View style={{ marginHorizontal: 16, marginTop: 8 }}>
            <TouchableOpacity
              onPress={onClose}
              style={{
                backgroundColor: colors.primary,
                paddingVertical: 14,
                borderRadius: 16,
                alignItems: 'center'
              }}
            >
              <Text style={{
                color: '#fff',
                fontFamily: fonts.bold,
                fontSize: 16
              }}>Continue Training</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default ProgressModal;