import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../../utils/colors/colors';
import { fonts } from '../../../utils/fonts/fonts';

export default function Anova() {
  const navigation = useNavigation();
  const [modalVisible, setModalVisible] = useState(false);

  const infoText = `This dashboard combines several methods: per‑activity average mood change from your logs (before vs. after), one‑way ANOVA to test for differences across activities, and Tukey’s HSD for pairwise comparisons (only activities with at least 2 logs are included). Sleep impact is derived from hours/quality to a mood score.`;

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
        overflow: 'hidden',
        marginBottom: 16,
      }}
    >
      {/* Header (centered, no left icon). Position relative to anchor help icon */}
      <View style={{ backgroundColor: '#ffff', padding: 18, position: 'relative' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontFamily: fonts.bold, fontSize: 22, color: colors.primary, textAlign: 'center' }}>
              Mood & Habits Analysis
            </Text>
            <Text style={{ fontFamily: fonts.medium, fontSize: 13, color: '#52545aff', textAlign: 'justify', marginTop: 4 }}>
              Statistical insights into how your habits affect mood
            </Text>
          </View>

          <TouchableOpacity
            onPress={() => setModalVisible(true)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={{
              position: 'absolute',
              right: -10,
              top: -10,  
            }}
          >
            <MaterialIcons name="help-outline" size={20} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* Info text removed from main container; shown only in modal */}

        {/* Primary CTA — keep current button color */}
        <View style={{ alignItems: 'center', marginTop: 8 }}>
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => navigation.navigate('DailyAnova')}
            style={{
              width: '100%',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: colors.primary, // keep current color
              paddingVertical: 14,
              paddingHorizontal: 16,
              borderRadius: 16,
              shadowColor: '#000',
              shadowOpacity: 0.12,
              shadowRadius: 8,
              shadowOffset: { width: 0, height: 3 },
              elevation: 3,
            }}
          >
            <MaterialCommunityIcons name="calendar-today" size={22} color="#fff" style={{ marginRight: 12 }} />
            <View>
              <Text style={{ fontFamily: fonts.semiBold, fontSize: 15, color: '#fff', textAlign: 'left' }}>
                Daily Insights
              </Text>
              <Text style={{ fontFamily: fonts.medium, fontSize: 12, color: '#f3f6fa', opacity: 0.9, textAlign: 'left' }}>
                Today’s activity impact analysis
              </Text>
            </View>
          </TouchableOpacity>
        </View>
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
            maxWidth: 360,
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