import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { Provider as PaperProvider } from 'react-native-paper';
import Toast from 'react-native-toast-message';
import * as Font from 'expo-font';
import './global.css';

// Import your screens
import LoginScreen from './screens/Login';
import SignupScreen from './screens/Signup';
import LandingScreen from './screens/Landing';
import HomeScreen from './screens/User/Home';

const Stack = createStackNavigator();

export default function App() {
  useEffect(() => {
    Font.loadAsync({
      // Add your custom fonts here
      'Poppins-Regular': require('./assets/fonts/Poppins-Regular.ttf'),
      'Poppins-Bold': require('./assets/fonts/Poppins-Bold.ttf'),
      'Poppins-SemiBold': require('./assets/fonts/Poppins-SemiBold.ttf'),
      'Poppins-Medium': require('./assets/fonts/Poppins-Medium.ttf'),
      'Poppins-Light': require('./assets/fonts/Poppins-Light.ttf'),
    }).then(() => {
      console.log('✅ Fonts loaded');
    }).catch((error) => {
      console.warn('⚠️ Font loading error:', error);
    });
  }, []);

  return (
    <>
    <PaperProvider>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Landing">
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
            options={{ headerShown: false  }}
          />
          <Stack.Screen 
            name="Home" 
            component={HomeScreen}
            options={{ headerShown: false  }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </PaperProvider>
  <Toast />
  </>
);
}