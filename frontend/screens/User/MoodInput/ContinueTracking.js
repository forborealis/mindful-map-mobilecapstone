import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fonts } from '../../../utils/fonts/fonts';
import { colors } from '../../../utils/colors/colors';

const ContinueTracking = ({ navigation }) => {
  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }}>
      <View className="flex-1 justify-center items-center px-8">
        <Text
          className="text-2xl text-center mb-8"
          style={{
            color: colors.text,
            fontFamily: fonts.semiBold,
            lineHeight: 36
          }}
        >
          Would you like to track another category or are you done for now?
        </Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('ChooseCategory')}
          className="w-full rounded-2xl py-5 mb-5 shadow-lg active:scale-95"
          style={{
            backgroundColor: colors.secondary,
            alignItems: 'center'
          }}
          activeOpacity={0.85}
        >
          <Text
            className="text-lg"
            style={{
              color: colors.text,
              fontFamily: fonts.semiBold
            }}
          >
            Yes, track another category
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => navigation.navigate('MoodEntries')}
          className="w-full rounded-2xl py-5 shadow-lg active:scale-95"
          style={{
            backgroundColor: colors.secondary,
            alignItems: 'center'
          }}
          activeOpacity={0.85}
        >
          <Text
            className="text-lg"
            style={{
              color: colors.text,
              fontFamily: fonts.semiBold
            }}
          >
            No, I'm done
          </Text>
        </TouchableOpacity>
      </View>
      <View className="items-center mb-10">
        <Text
          className="text-sm text-center"
          style={{
            color: colors.text,
            fontFamily: fonts.regular,
            opacity: 0.7,
            width: '80%'
          }}
        >
          💡 You can always come back to track more categories later
        </Text>
      </View>
    </SafeAreaView>
  );
};

export default ContinueTracking;