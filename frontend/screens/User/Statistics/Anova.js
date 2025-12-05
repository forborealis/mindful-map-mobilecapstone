import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { colors } from '../../../utils/colors/colors';
import { fonts } from '../../../utils/fonts/fonts';

export default function Anova() {
  const navigation = useNavigation();
  const [modalVisible, setModalVisible] = useState(false);

  const infoText = `The ANOVA (Analysis of Variance) tool helps you understand which activities have the most significant impact on your mood. It uses statistical analysis to compare mood changes across different activities, showing you where the biggest differences occur.`;

  return (
    <View
      style={{
        marginHorizontal: 16,
        backgroundColor: '#fff',
        borderRadius: 24,
        borderWidth: 1,
        borderColor: '#f0f1f3',
        shadowColor: '#000',
        shadowOpacity: 0.06,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
        elevation: 5,
        padding: 20,
      }}
    >
      <View style={{ flex: 1, flexDirection: 'column' }}>
        <TouchableOpacity
          onPress={() => setModalVisible(true)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={{ alignSelf: 'flex-end' }}
        >
          <MaterialIcons name="help-outline" size={24} color={colors.primary} />
        </TouchableOpacity>

        <Text
          style={{
            fontFamily: fonts.bold,
            fontSize: 22,
            color: colors.primary,
            marginBottom: 4,
            marginTop: 0,
            textAlign: 'center',
          }}
        >
          ANOVA Mood Analysis
        </Text>
        <Text
          style={{
            fontFamily: fonts.medium,
            fontSize: 14,
            color: colors.text,
            marginBottom: 16,
            opacity: 0.8,
            textAlign: 'justify',
            lineHeight: 20,
          }}
        >
          Advanced statistical insights into activity impact
        </Text>
      </View>
      <View style={{ flexDirection: 'column', gap: 10 }}>
        <TouchableOpacity
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            borderRadius: 16,
            paddingVertical: 14,
            paddingHorizontal: 16,
            backgroundColor: colors.primary,
            shadowColor: '#000',
            shadowOpacity: 0.09,
            shadowRadius: 6,
            shadowOffset: { width: 0, height: 2 },
            elevation: 2,
          }}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('DailyAnova')}
        >
          <MaterialCommunityIcons name="calendar-today" size={22} color="#fff" style={{ marginRight: 12 }} />
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontFamily: fonts.semiBold,
                fontSize: 15,
                color: '#fff',
                marginBottom: 2,
              }}
            >
              Daily ANOVA
            </Text>
            <Text
              style={{
                fontFamily: fonts.medium,
                fontSize: 12,
                color: '#f3f6fa',
                opacity: 0.9,
                lineHeight: 16,
              }}
            >
              Today's activity impact analysis
            </Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            borderRadius: 16,
            paddingVertical: 14,
            paddingHorizontal: 16,
            backgroundColor: colors.primary,
            shadowColor: '#000',
            shadowOpacity: 0.09,
            shadowRadius: 6,
            shadowOffset: { width: 0, height: 2 },
            elevation: 2,
          }}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('WeeklyAnova')}
        >
          <FontAwesome5 name="chart-line" size={20} color="#fff" style={{ marginRight: 12 }} />
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontFamily: fonts.semiBold,
                fontSize: 15,
                color: '#fff',
                marginBottom: 2,
              }}
            >
              Weekly ANOVA
            </Text>
            <Text
              style={{
                fontFamily: fonts.medium,
                fontSize: 12,
                color: '#f3f6fa',
                opacity: 0.9,
                lineHeight: 16,
              }}
            >
              Weekly patterns & trends analysis
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Info Modal */}
      <Modal
        visible={modalVisible}
        animationType="fade"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.25)',
          justifyContent: 'center',
          alignItems: 'center',
        }}>
          <View style={{
            backgroundColor: '#fff',
            borderRadius: 18,
            padding: 22,
            marginHorizontal: 24,
            maxWidth: 340,
            alignItems: 'center',
            elevation: 6,
          }}>
            <MaterialIcons name="help-outline" size={32} color={colors.primary} style={{ marginBottom: 12 }} />
            <Text
              style={{
                fontFamily: fonts.bold,
                fontSize: 18,
                color: colors.primary,
                marginBottom: 12,
                textAlign: 'center',
              }}
            >
              What is ANOVA?
            </Text>
            <Text
              style={{
                fontFamily: fonts.medium,
                fontSize: 14,
                color: '#374151',
                marginBottom: 18,
                textAlign: 'justify',
                lineHeight: 20,
              }}
            >
              {infoText}
            </Text>
            <Pressable
              onPress={() => setModalVisible(false)}
              style={{
                marginTop: 8,
                backgroundColor: colors.primary,
                borderRadius: 12,
                paddingVertical: 10,
                paddingHorizontal: 24,
              }}
            >
              <Text style={{
                color: '#fff',
                fontFamily: fonts.semiBold,
                fontSize: 14,
              }}>
                Close
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}