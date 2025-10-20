import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { Provider as PaperProvider } from 'react-native-paper';
import { View, ActivityIndicator, Text } from 'react-native';
import Toast from 'react-native-toast-message';
import * as Font from 'expo-font';
import './global.css';
import { initializeAuth } from './services/authInitializer'; 

import LoginScreen from './screens/Login';
import SignupScreen from './screens/Signup';
import LandingScreen from './screens/Landing';

import HomeScreen from './screens/User/Home';
import MoodEntriesScreen from './screens/User/MoodEntries';

import ChooseCategory from './screens/User/MoodInput/ChooseCategory';
import OverallActivities from './screens/User/MoodInput/OverallActivities';
import Social from './screens/User/MoodInput/Social';
import Health from './screens/User/MoodInput/Health';
import Sleep from './screens/User/MoodInput/Sleep';

import BeforeValence from './screens/User/MoodInput/BeforeValence';
import BeforePositive from './screens/User/MoodInput/BeforePositive';
import BeforeNegative from './screens/User/MoodInput/BeforeNegative';

import AfterValence from './screens/User/MoodInput/AfterValence';
import AfterPositive from './screens/User/MoodInput/AfterPositive';
import AfterNegative from './screens/User/MoodInput/AfterNegative';

const Stack = createStackNavigator();

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [initialRoute, setInitialRoute] = useState('Landing');

  useEffect(() => {
    async function prepare() {
      try {
        console.log('App starting...');

        await Font.loadAsync({
          'Poppins-Regular': require('./assets/fonts/Poppins-Regular.ttf'),
          'Poppins-Bold': require('./assets/fonts/Poppins-Bold.ttf'),
          'Poppins-SemiBold': require('./assets/fonts/Poppins-SemiBold.ttf'),
          'Poppins-Medium': require('./assets/fonts/Poppins-Medium.ttf'),
          'Poppins-Light': require('./assets/fonts/Poppins-Light.ttf'),
        });
        console.log('Fonts loaded');

      const authResult = await initializeAuth();
            setInitialRoute(authResult.initialRoute);

          } catch (error) {
            console.error('Error during app initialization:', error);
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
          <Stack.Navigator initialRouteName={initialRoute}>
            <Stack.Screen 
              name="Landing" 
              component={LandingScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen 
              name="Login" 
              component={LoginScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen 
              name="Signup" 
              component={SignupScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen 
              name="Home" 
              component={HomeScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen 
              name="MoodEntries" 
              component={MoodEntriesScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen 
              name="ChooseCategory" 
              component={ChooseCategory}
              options={{ headerShown: false }}
            />
            <Stack.Screen 
              name="Social" 
              component={Social}
              options={{ headerShown: false }}
            />
            <Stack.Screen 
              name="OverallActivities" 
              component={OverallActivities}
              options={{ headerShown: false }}
            />
            <Stack.Screen 
              name="Health" 
              component={Health}
              options={{ headerShown: false }}
            />
            <Stack.Screen 
              name="Sleep" 
              component={Sleep}
              options={{ headerShown: false }}
            />
            <Stack.Screen 
              name="BeforeValence" 
              component={BeforeValence}
              options={{ headerShown: false }}
            />
             <Stack.Screen 
              name="BeforePositive" 
              component={BeforePositive}
              options={{ headerShown: false }}
            />
             <Stack.Screen 
              name="BeforeNegative" 
              component={BeforeNegative}
              options={{ headerShown: false }}
            />
            <Stack.Screen 
              name="AfterValence" 
              component={AfterValence}
              options={{ headerShown: false }}
            />                          
            <Stack.Screen 
              name="AfterPositive" 
              component={AfterPositive}
              options={{ headerShown: false }}
            />
            <Stack.Screen 
              name="AfterNegative" 
              component={AfterNegative}
              options={{ headerShown: false }}
            />
          </Stack.Navigator>
        </NavigationContainer>
      </PaperProvider>
      <Toast />
    </>
  );
}