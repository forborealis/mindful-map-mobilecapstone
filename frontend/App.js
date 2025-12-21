import React, { useEffect, useState, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { Provider as PaperProvider } from 'react-native-paper';
import { View, ActivityIndicator, Text } from 'react-native';
import Toast from 'react-native-toast-message';
import * as Font from 'expo-font';
import './global.css';
import { initializeAuth } from './services/authInitializer';
import { authService } from './services/authService';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { subscribeNotificationResponses, registerPushTokenIfLoggedIn } from './AppNotifications';
import MainStack from './navigation/MainStack';

// Export ref so Login/Signup screens can use it for immediate navigation
export const navigationRef = React.createRef();

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
        await registerPushTokenIfLoggedIn();
      } catch (error) {
        console.error('Error in app preparation:', error);
        setInitialRoute('Landing');
      } finally {
        setIsLoading(false);
      }
    }
    prepare();
  }, []);

  // Listen for logout events only
  useEffect(() => {
    if (!navigationRef.current) return;
    
    const checkAndUpdateRoute = async () => {
      const session = await authService.checkAuthStatus();
      
      if (!session.isAuthenticated) {
        console.log('User logged out');
        navigationRef.current?.reset({
          index: 0,
          routes: [{ name: 'Landing' }],
        });
      }
    };

    const unsubscribe = authService.subscribeToAuthChanges?.(checkAndUpdateRoute);
    
    return () => unsubscribe?.();
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
        <NavigationContainer ref={navigationRef}>
          <MainStack initialRoute={initialRoute} />
        </NavigationContainer>
      </PaperProvider>
      <Toast />
    </>
  );
}