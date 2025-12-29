import React, { useState } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, ScrollView, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import YoutubePlayer from 'react-native-youtube-iframe';
import { colors } from '../../../utils/colors/colors';
import { fonts } from '../../../utils/fonts/fonts';

const meditationData = {
  mindfulness: {
    '5': {
      id: 'ssss7V1_eyA',
      description: 'A gentle 5-minute mindfulness meditation to help you become present and aware of your thoughts and sensations.',
    },
    '10': {
      id: 'Evgx9yX2Vw8',
      description: 'A 10-minute guided mindfulness session to cultivate calm and clarity by focusing on the breath and present moment.',
    },
  },
  'body-scan': {
    '5': {
      id: 'z8zX-QbXIT4',
      description: 'A short body scan to help you relax and connect with your body, releasing tension from head to toe.',
    },
    '10': {
      id: 'nnVCadMo3qI',
      description: 'A deeper 10-minute body scan meditation for full-body relaxation and stress relief.',
    },
  },
  visualization: {
    '5': {
      id: '_YAgCAhVtss',
      description: 'A quick visualization to help you imagine a peaceful place and boost your mood.',
    },
    '10': {
      id: 'Tvs7JNV8NDA',
      description: 'A 10-minute visualization journey to inspire positivity and inner peace.',
    },
  },
  sound: {
    '5': {
      id: '1AQs9vLcr3Q',
      description: 'A 5-minute sound bath using soothing tones to calm your mind and body.',
    },
    '10': {
      id: 'YlOUww60Q5M',
      description: 'A longer sound bath experience for deep relaxation and mental clarity.',
    },
  },
  chakra: {
    '5': {
      id: 'v0r2zCMcRsA',
      description: 'A brief chakra meditation to balance your energy centers and promote well-being.',
    },
    '10': {
      id: 'P_ri2uy9Hgs',
      description: 'A 10-minute chakra alignment meditation for harmony and inner balance.',
    },
  },
};

const meditationTypes = [
  { id: 'mindfulness', name: 'Mindfulness', icon: 'leaf-outline' },
  { id: 'body-scan', name: 'Body Scan', icon: 'body-outline' },
  { id: 'visualization', name: 'Visualization', icon: 'eye-outline' },
  { id: 'sound', name: 'Sound Bath', icon: 'musical-notes-outline' },
  { id: 'chakra', name: 'Chakra', icon: 'radio-button-on-outline' },
];

const { width } = Dimensions.get('window');
const VIDEO_HEIGHT = (width - 40) * (9 / 16);

const GuidedMeditation = ({ navigation }) => {
  const [meditationType, setMeditationType] = useState('mindfulness');
  const [duration, setDuration] = useState('5');
  const [playing, setPlaying] = useState(false);

  const currentMeditation = meditationData[meditationType][duration];

  const handleMeditationTypeChange = (type) => {
    setMeditationType(type);
    setPlaying(false);
  };

  const handleDurationChange = (newDuration) => {
    setDuration(newDuration);
    setPlaying(false);
  };

  const onStateChange = (state) => {
    if (state === 'ended') {
      setPlaying(false);
    }
  };

  return (
    <SafeAreaView style={{
      flex: 1,
      backgroundColor: colors.background,
    }}>
      {/* Header styled like PomodoroTechnique */}
      <View
        style={{
          paddingTop: 36,
          paddingBottom: 18,
          backgroundColor: '#fff',
          borderBottomWidth: 2,
          borderBottomColor: '#CBE7DC',
          shadowColor: '#000',
          shadowOpacity: 0.06,
          shadowOffset: { width: 0, height: 2 },
          shadowRadius: 6,
          elevation: 3,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12 }}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={{
              padding: 10,
              borderRadius: 999,
              backgroundColor: 'rgba(255,255,255,0.8)',
            }}
          >
            <Ionicons name="arrow-back" size={24} color="#55AD9B" />
          </TouchableOpacity>
          <View style={{ flex: 1, alignItems: 'center', paddingHorizontal: 20 }}>
            <Text style={{
              fontFamily: fonts.bold,
              fontSize: 21,
              color: '#1b5f52',
              letterSpacing: 0,
              alignSelf: 'center'
            }}>
              Guided Meditation
            </Text>
          </View>
          <View style={{ width: 36, height: 36 }} />
        </View>
      </View>

      <ScrollView contentContainerStyle={{
        paddingBottom: 40,
        paddingTop: 10,
      }}>
        <View style={{
          width: width - 40,
          height: VIDEO_HEIGHT,
          marginHorizontal: 20,
          borderRadius: 16,
          overflow: 'hidden',
          backgroundColor: colors.white,
          marginTop: 10,
          elevation: 5,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.12,
          shadowRadius: 6,
        }}>
          {currentMeditation ? (
            <YoutubePlayer
              height={VIDEO_HEIGHT}
              play={playing}
              videoId={currentMeditation.id}
              onChangeState={onStateChange}
              webViewStyle={{ borderRadius: 16 }}
            />
          ) : (
            <View style={{
              flex: 1,
              justifyContent: 'center',
              alignItems: 'center',
            }}>
              <Text style={{
                fontFamily: fonts.regular,
                color: colors.secondary,
              }}>Select a meditation to begin</Text>
            </View>
          )}
        </View>

        {/* Description */}
        <View style={{
          flexDirection: 'row',
          alignItems: 'flex-start',
          backgroundColor: colors.mintGreen + '22',
          borderRadius: 10,
          marginHorizontal: 22,
          marginTop: 18,
          marginBottom: 8,
          padding: 12,
          minHeight: 54,
        }}>
          <Ionicons name="information-circle-outline" size={20} color={colors.primary} style={{ marginRight: 6 }} />
          <Text style={{
            fontFamily: fonts.medium,
            color: colors.text,
            fontSize: 15,
            flex: 1,
            lineHeight: 21,
          }}>
            {currentMeditation ? currentMeditation.description : 'Choose a meditation type and duration to see an overview.'}
          </Text>
        </View>

        <View style={{ marginTop: 22, paddingHorizontal: 20 }}>
          <Text style={{
            fontSize: 15,
            fontFamily: fonts.bold,
            color: colors.primary,
            marginBottom: 12,
            letterSpacing: 0.2,
          }}>Choose Your Path</Text>
          <View style={{ flexDirection: 'column' }}>
            {meditationTypes.map((type) => (
              <TouchableOpacity
                key={type.id}
                onPress={() => handleMeditationTypeChange(type.id)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: meditationType === type.id ? colors.primary : colors.white,
                  paddingVertical: 18,
                  paddingHorizontal: 18,
                  borderRadius: 14,
                  marginBottom: 14,
                  borderWidth: 1.5,
                  borderColor: meditationType === type.id ? colors.primary : colors.mintGreen,
                  elevation: 2,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.08,
                  shadowRadius: 3,
                }}
              >
                <Ionicons
                  name={type.icon}
                  size={26}
                  color={meditationType === type.id ? colors.white : colors.primary}
                  style={{ marginRight: 12 }}
                />
                <Text style={{
                  fontSize: 16,
                  fontFamily: fonts.medium,
                  color: meditationType === type.id ? colors.white : colors.text,
                  letterSpacing: 0.1,
                }}>
                  {type.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={{ marginTop: 22, paddingHorizontal: 20 }}>
          <Text style={{
            fontSize: 15,
            fontFamily: fonts.bold,
            color: colors.primary,
            marginBottom: 12,
            letterSpacing: 0.2,
          }}>Select Duration</Text>
          <View style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
          }}>
            <TouchableOpacity
              onPress={() => handleDurationChange('5')}
              style={{
                width: '48%',
                backgroundColor: duration === '5' ? colors.primary : colors.white,
                padding: 14,
                borderRadius: 12,
                alignItems: 'center',
                borderWidth: 1.5,
                borderColor: duration === '5' ? colors.primary : colors.mintGreen,
                elevation: 1,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.06,
                shadowRadius: 2,
              }}
            >
              <Text style={{
                fontSize: 15,
                fontFamily: fonts.medium,
                color: duration === '5' ? colors.white : colors.text,
                letterSpacing: 0.1,
              }}>5 Minutes</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleDurationChange('10')}
              style={{
                width: '48%',
                backgroundColor: duration === '10' ? colors.primary : colors.white,
                padding: 14,
                borderRadius: 12,
                alignItems: 'center',
                borderWidth: 1.5,
                borderColor: duration === '10' ? colors.primary : colors.mintGreen,
                elevation: 1,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.06,
                shadowRadius: 2,
              }}
            >
              <Text style={{
                fontSize: 15,
                fontFamily: fonts.medium,
                color: duration === '10' ? colors.white : colors.text,
                letterSpacing: 0.1,
              }}>10 Minutes</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default GuidedMeditation;