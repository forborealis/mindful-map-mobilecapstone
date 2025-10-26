import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { Provider as PaperProvider } from 'react-native-paper';
import { View, ActivityIndicator, Text } from 'react-native';
import Toast from 'react-native-toast-message';
import * as Font from 'expo-font';
import './global.css';
import { initializeAuth } from './services/authInitializer';
import Ionicons from 'react-native-vector-icons/Ionicons';

import MainStack from './navigation/MainStack';

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [initialRoute, setInitialRoute] = useState('Landing');

  useEffect(() => {
    async function prepare() {
      try {
        await Font.loadAsync({
          'Poppins-Regular': require('./assets/fonts/Poppins-Regular.ttf'),
          'Poppins-Bold': require('./assets/fonts/Poppins-Bold.ttf'),
          'Poppins-SemiBold': require('./assets/fonts/Poppins-SemiBold.ttf'),
          'Poppins-Medium': require('./assets/fonts/Poppins-Medium.ttf'),
          'Poppins-Light': require('./assets/fonts/Poppins-Light.ttf'),
          ...Ionicons.font,
        });
        const authResult = await initializeAuth();
        setInitialRoute(authResult.initialRoute);
      } catch (error) {
        setInitialRoute('Landing');
      } finally {
        setIsLoading(false);
      }
    }
    prepare();
  }, []);

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-green-50">
        <ActivityIndicator size="large" color="#0d9488" />
        <Text className="mt-4 text-gray-800 font-medium text-xl">
          Loading...
        </Text>
      </View>
    );
  }

  return (
    <>
      <PaperProvider>
        <NavigationContainer>
          <MainStack initialRoute={initialRoute} />
        </NavigationContainer>
      </PaperProvider>
      <Toast />
    </>
  );
}