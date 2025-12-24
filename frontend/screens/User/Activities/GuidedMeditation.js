import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import YoutubePlayer from 'react-native-youtube-iframe';
import { colors } from '../../../utils/colors/colors';
import { fonts } from '../../../utils/fonts/fonts';

const meditationData = {
  mindfulness: {
    '5': 'ssss7V1_eyA',
    '10': 'Evgx9yX2Vw8',
  },
  'body-scan': {
    '5': 'z8zX-QbXIT4',
    '10': 'nnVCadMo3qI',
  },
  visualization: {
    '5': '_YAgCAhVtss',
    '10': 'Tvs7JNV8NDA',
  },
  sound: {
    '5': '1AQs9vLcr3Q',
    '10': 'YlOUww60Q5M',
  },
  chakra: {
    '5': 'v0r2zCMcRsA',
    '10': 'P_ri2uy9Hgs',
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
  const [video, setVideo] = useState(meditationData.mindfulness['5']);
  const [playing, setPlaying] = useState(false);

  const handleMeditationTypeChange = (type) => {
    setMeditationType(type);
    setVideo(meditationData[type][duration]);
    setPlaying(false);
  };

  const handleDurationChange = (newDuration) => {
    setDuration(newDuration);
    setVideo(meditationData[meditationType][newDuration]);
    setPlaying(false);
  };

  const onStateChange = (state) => {
    if (state === 'ended') {
      setPlaying(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Guided Meditation</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.videoContainer}>
          {video ? (
            <YoutubePlayer
              height={VIDEO_HEIGHT}
              play={playing}
              videoId={video}
              onChangeState={onStateChange}
              webViewStyle={styles.youtubeWebView}
            />
          ) : (
            <View style={styles.placeholderContainer}>
              <Text style={styles.placeholderText}>Select a meditation to begin</Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Choose Your Path</Text>
          <View style={styles.typeGrid}>
            {meditationTypes.map((type) => (
              <TouchableOpacity
                key={type.id}
                onPress={() => handleMeditationTypeChange(type.id)}
                style={[
                  styles.typeButton,
                  meditationType === type.id && styles.activeTypeButton
                ]}
              >
                <Ionicons 
                  name={type.icon} 
                  size={24} 
                  color={meditationType === type.id ? colors.white : colors.primary} 
                />
                <Text style={[
                  styles.typeButtonText,
                  meditationType === type.id && styles.activeTypeButtonText
                ]}>
                  {type.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Duration</Text>
          <View style={styles.durationContainer}>
            <TouchableOpacity
              onPress={() => handleDurationChange('5')}
              style={[
                styles.durationButton,
                duration === '5' && styles.activeDurationButton
              ]}
            >
              <Text style={[
                styles.durationButtonText,
                duration === '5' && styles.activeDurationButtonText
              ]}>5 Minutes</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleDurationChange('10')}
              style={[
                styles.durationButton,
                duration === '10' && styles.activeDurationButton
              ]}
            >
              <Text style={[
                styles.durationButtonText,
                duration === '10' && styles.activeDurationButtonText
              ]}>10 Minutes</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    backgroundColor: colors.background,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: fonts.bold,
    color: colors.text,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  videoContainer: {
    width: width - 40,
    height: VIDEO_HEIGHT,
    marginHorizontal: 20,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: colors.white,
    marginTop: 10,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  youtubeWebView: {
    borderRadius: 12,
  },
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontFamily: fonts.regular,
    color: colors.secondary,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: fonts.bold,
    color: colors.text,
    marginBottom: 12,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  typeButton: {
    width: '48%',
    backgroundColor: colors.white,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.mintGreen,
  },
  activeTypeButton: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  typeButtonText: {
    marginTop: 8,
    fontSize: 14,
    fontFamily: fonts.medium,
    color: colors.text,
  },
  activeTypeButtonText: {
    color: colors.white,
  },
  durationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  durationButton: {
    width: '48%',
    backgroundColor: colors.white,
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.mintGreen,
  },
  activeDurationButton: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  durationButtonText: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: colors.text,
  },
  activeDurationButtonText: {
    color: colors.white,
  },
});

export default GuidedMeditation;