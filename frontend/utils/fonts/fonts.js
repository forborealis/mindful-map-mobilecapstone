import * as Font from 'expo-font';

export const loadFonts = async () => {
  await Font.loadAsync({
    'Poppins-Regular': require('../../assets/fonts/Poppins-Regular.ttf'),
    'Poppins-ExtraBold': require('../../assets/fonts/Poppins-ExtraBold.ttf'),
    'Poppins-SemiBold': require('../../assets/fonts/Poppins-SemiBold.ttf'),
    'Poppins-Medium': require('../../assets/fonts/Poppins-Medium.ttf'),
    'Poppins-Light': require('../../assets/fonts/Poppins-Light.ttf'),
  });
};

export const fonts = {
  regular: 'Poppins-Regular',
  bold: 'Poppins-Bold',
  semiBold: 'Poppins-SemiBold',
  medium: 'Poppins-Medium',
  light: 'Poppins-Light',
};