import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, Image, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fonts } from '../../../utils/fonts/fonts';
import { colors } from '../../../utils/colors/colors';

const emotions = [
  { id: 'bored', title: 'Bored', image: require('../../../assets/images/mood/emotions/bored.png') },
  { id: 'sad', title: 'Sad', image: require('../../../assets/images/mood/emotions/sad.png') },
  { id: 'disappointed', title: 'Disappointed', image: require('../../../assets/images/mood/emotions/disappointed.png') },
  { id: 'angry', title: 'Angry', image: require('../../../assets/images/mood/emotions/angry.png') },
  { id: 'tense', title: 'Tense', image: require('../../../assets/images/mood/emotions/tense.png') }
];

const intensityValues = [1, 2, 3, 4, 5];

const chunkArray = (arr, size) => {
  const result = [];
  for (let i = 0; i < arr.length; i += size) {
    result.push(arr.slice(i, i + size));
  }
  return result;
};

const BeforeNegative = ({ navigation }) => {
  const [selectedEmotion, setSelectedEmotion] = useState(null);
  const [selectedIntensity, setSelectedIntensity] = useState(null);
  const [reason, setReason] = useState('');

  const isInputEnabled = selectedEmotion && selectedIntensity;
  const isButtonEnabled = isInputEnabled && reason.trim().length > 0;

  const emotionRows = chunkArray(emotions, 3);

  const handleSubmit = () => {
    if (isButtonEnabled) {
      navigation.navigate('AfterValence', { emotion: selectedEmotion, intensity: selectedIntensity, reason });
    }
  };

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }}>
       <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 24}
      >
      <ScrollView
        className="flex-1 px-6"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: 40, paddingBottom: 24 }}
      >
       <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="absolute left-0 top-0 z-10"
          activeOpacity={0.7}
        >
          <Text
            style={{
              fontSize: 28,
              color: colors.text,
              fontFamily: fonts.semiBold
            }}
          >
            ←
          </Text>
        </TouchableOpacity>
        <Text
          className="text-2xl text-center mb-6"
          style={{
            color: colors.text,
            fontFamily: fonts.semiBold,
            lineHeight: 34
          }}
        >
          Select your emotion
        </Text>
        <View className="mb-6">
          {emotionRows.map((row, rowIdx) => (
            <View
              key={rowIdx}
              className="flex-row mb-8"
              style={{
                justifyContent: row.length === 3 ? 'center' : 'space-evenly'
              }}
            >
              {row.map((emotion) => {
                const isSelected = selectedEmotion === emotion.id;
                return (
                  <TouchableOpacity
                    key={emotion.id}
                    onPress={() => setSelectedEmotion(emotion.id)}
                    className="mx-4 active:scale-95"
                    style={{ alignItems: 'center' }}
                    activeOpacity={0.8}
                  >
                    <Image
                      source={emotion.image}
                      className="w-20 h-20 mb-2"
                      resizeMode="contain"
                      style={{
                        borderWidth: isSelected ? 3 : 0,
                        borderColor: isSelected ? colors.primary : 'transparent',
                        borderRadius: 50
                      }}
                    />
                    <Text
                      className="text-sm text-center"
                      style={{
                        color: colors.text,
                        fontFamily: isSelected ? fonts.semiBold : fonts.regular,
                        width: 90
                      }}
                    >
                      {emotion.title}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
        </View>

        <Text
          className="text-xl text-center mb-2"
          style={{
            color: colors.text,
            fontFamily: fonts.semiBold
          }}
        >
          Rate the Intensity
        </Text>
        <View className="flex-row justify-center mb-2">
          {intensityValues.map((val) => {
            const isSelected = selectedIntensity === val;
            return (
              <TouchableOpacity
                key={val}
                onPress={() => setSelectedIntensity(val)}
                className="mx-3 active:scale-95"
                activeOpacity={0.8}
              >
                <View
                  className="items-center justify-center"
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 24,
                    backgroundColor: isSelected ? colors.primary : colors.secondary,
                    borderWidth: isSelected ? 2 : 0,
                    borderColor: colors.accent || colors.primary,
                    shadowColor: colors.primary,
                    shadowOpacity: isSelected ? 0.15 : 0,
                    shadowRadius: 6
                  }}
                >
                  <Text
                    className="text-base"
                    style={{
                      color: colors.text,
                      fontFamily: fonts.semiBold
                    }}
                  >
                    {val}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
        <View className="flex-row justify-between px-2 mb-4">
          <Text
            className="text-xs"
            style={{
              color: colors.text,
              fontFamily: fonts.regular
            }}
          >
            Low
          </Text>
          <Text
            className="text-xs"
            style={{
              color: colors.text,
              fontFamily: fonts.regular
            }}
          >
            High
          </Text>
        </View>

        {isInputEnabled && (
          <View className="mb-4">
            <Text
              className="text-lg mb-2 text-center"
              style={{
                color: colors.text,
                fontFamily: fonts.semiBold
              }}
            >
              Why do you feel that way?
            </Text>
            <TextInput
              value={reason}
              onChangeText={setReason}
              className="rounded-xl px-4 py-3 text-base"
              style={{
                backgroundColor: colors.accent,
                color: colors.text,
                fontFamily: fonts.regular,
                borderWidth: 1,
                borderColor: colors.primary,
                minHeight: 100,
                textAlignVertical: 'top'
              }}
              placeholder="Describe what made you feel this way..."
              placeholderTextColor={colors.text}
              multiline
            />
          </View>
        )}

        <TouchableOpacity
          onPress={handleSubmit}
          disabled={!isButtonEnabled}
          className="rounded-full py-4 px-8 shadow-lg active:scale-95 mb-4"
          style={{
            backgroundColor: isButtonEnabled ? colors.primary : colors.secondary,
            opacity: isButtonEnabled ? 1 : 0.5
          }}
          activeOpacity={0.8}
        >
          <Text
            className="text-center text-lg"
            style={{
              color: isButtonEnabled ? colors.background : colors.text,
              fontFamily: fonts.semiBold,
              lineHeight: 24
            }}
          >
            Enter
          </Text>
        </TouchableOpacity>
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default BeforeNegative;