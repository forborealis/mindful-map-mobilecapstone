import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fonts } from '../../../utils/fonts/fonts';
import { colors } from '../../../utils/colors/colors';

const tips = [
  { image: require('../../../assets/images/mood/others/sleep1.png'), text: 'Stick to a consistent sleep schedule.' },
  { image: require('../../../assets/images/mood/others/sleep2.png'), text: 'Avoid screentime at least 30 minutes before bed.' },
  { image: require('../../../assets/images/mood/others/sleep3.png'), text: 'Limit your caffeine intake.' }
];

const Sleep = ({ navigation }) => {
  const [hours, setHours] = useState('');
  const [isValid, setIsValid] = useState(false);

  const handleChange = (value) => {
    const num = value.replace(/[^0-9]/g, '');
    setHours(num);
    setIsValid(num !== '' && Number(num) > 0 && Number(num) <= 24);
  };

  const handleSubmit = () => {
    if (isValid) {
      console.log('Sleep hours:', hours);
    }
  };

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="absolute left-6 top-2 z-10"
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
        <View className="flex-1 justify-center px-8">
          <Text
            className="text-3xl text-center mb-3"
            style={{
              color: colors.text,
              fontFamily: fonts.semiBold,
              lineHeight: 42
            }}
          >
            Previous Night's Sleep
          </Text>
          <Text
            className="text-base text-center mb-3"
            style={{
              color: colors.text,
              fontFamily: fonts.regular,
              opacity: 0.8,
              lineHeight: 22
            }}
          >
            How many hours did you sleep last night?
          </Text>
        <View
        className="mb-8 px-4 py-5 rounded-2xl"
        style={{
            backgroundColor: colors.secondary,
            shadowColor: colors.primary,
            shadowOpacity: 0.1,
            shadowRadius: 8,
            shadowOffset: { width: 0, height: 2 }
        }}
        >
        <Text
            className="text-base mb-3 text-center"
            style={{
            color: colors.text,
            fontFamily: fonts.semiBold,
            letterSpacing: 0.2
            }}
        >
            Tips to get more hours of sleep
        </Text>
        {tips.map((tip, idx) => (
            <View key={idx}>
            <View className="flex-row items-center mb-2">
                <Image
                source={tip.image}
                className="w-7 h-7 mr-3"
                resizeMode="contain"
                />
                <Text
                    className="text-sm flex-1"
                style={{
                    color: colors.text,
                    fontFamily: fonts.regular,
                    opacity: 0.85
                }}
                >
                {tip.text}
                </Text>
            </View>
            {idx < tips.length - 1 && (
                <View
                style={{
                    height: 1,
                    backgroundColor: colors.primary,
                    opacity: 0.15,
                    marginVertical: 4,
                    marginLeft: 38
                }}
                />
            )}
            </View>
        ))}
        </View>
          <View className="items-center mb-4">
            <TextInput
              value={hours}
              onChangeText={handleChange}
              keyboardType="number-pad"
              maxLength={2}
              className="w-32 h-20 text-4xl text-center rounded-2xl"
              style={{
                backgroundColor: colors.background,
                color: colors.text,
                fontFamily: fonts.semiBold,
                borderWidth: 2,
                borderColor: colors.primary,
                shadowColor: colors.primary,
                shadowOpacity: 0.15,
                shadowRadius: 8,
                shadowOffset: { width: 0, height: 2 },
                paddingVertical: 0,
                paddingTop: 0,
                paddingBottom: 0,
                marginBottom: 0,
                textAlignVertical: 'center'
              }}
              placeholder="0"
              placeholderTextColor={colors.text}
            />
            <Text
              className="text-lg mt-2"
              style={{
                color: colors.text,
                fontFamily: fonts.semiBold
              }}
            >
              hours
            </Text>
          </View>
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={!isValid}
            className="rounded-full py-4 px-8 shadow-lg mt-6 active:scale-95"
            style={{
              backgroundColor: isValid ? colors.primary : colors.secondary,
              opacity: isValid ? 1 : 0.5
            }}
            activeOpacity={0.8}
          >
            <Text
              className="text-center text-xl"
              style={{
                color: colors.text,
                fontFamily: fonts.semiBold,
                lineHeight: 24
              }}
            >
              Enter sleep hours
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default Sleep;