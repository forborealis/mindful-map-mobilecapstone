import React from 'react';
import { View, Text, TouchableOpacity, Modal } from 'react-native';
import { fonts } from '../../../utils/fonts/fonts';
import { colors } from '../../../utils/colors/colors';

const ContinueTrackingModal = ({ visible, onContinue, onDone }) => {
  return (
    <Modal
      transparent
      animationType="fade"
      visible={visible}
      onRequestClose={onDone}
    >
      <View 
        className="flex-1 justify-center items-center" 
        style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
      >
        <View 
          className="rounded-3xl p-8 m-6 w-80"
          style={{ backgroundColor: colors.background }}
        >
          <Text
            className="text-2xl text-center mb-8"
            style={{
              color: colors.text,
              fontFamily: fonts.semiBold,
              lineHeight: 32
            }}
          >
            Great job! 🎉
          </Text>
          
          <Text
            className="text-lg text-center mb-8"
            style={{
              color: colors.text,
              fontFamily: fonts.regular,
              lineHeight: 24,
              opacity: 0.8
            }}
          >
            Would you like to track another category or are you done for now?
          </Text>

          <TouchableOpacity
            onPress={onContinue}
            className="w-full rounded-2xl py-4 mb-4 shadow-lg active:scale-95"
            style={{
              backgroundColor: colors.primary,
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
              Track Another Category
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={onDone}
            className="w-full rounded-2xl py-4 shadow-lg active:scale-95"
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
                fontFamily: fonts.regular
              }}
            >
              I'm Done
            </Text>
          </TouchableOpacity>

          <Text
            className="text-sm text-center mt-6"
            style={{
              color: colors.text,
              fontFamily: fonts.regular,
              opacity: 0.6
            }}
          >
            💡 You can always come back to track more categories later
          </Text>
        </View>
      </View>
    </Modal>
  );
};

export default ContinueTrackingModal;