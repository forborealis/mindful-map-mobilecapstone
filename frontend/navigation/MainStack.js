import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import LoginScreen from '../screens/Login';
import SignupScreen from '../screens/Signup';
import LandingScreen from '../screens/Landing';
import ChooseCategory from '../screens/User/MoodInput/ChooseCategory';
import OverallActivities from '../screens/User/MoodInput/OverallActivities';
import Social from '../screens/User/MoodInput/Social';
import Health from '../screens/User/MoodInput/Health';
import Sleep from '../screens/User/MoodInput/Sleep';
import BeforeValence from '../screens/User/MoodInput/BeforeValence';
import BeforePositive from '../screens/User/MoodInput/BeforePositive';
import BeforeNegative from '../screens/User/MoodInput/BeforeNegative';
import AfterValence from '../screens/User/MoodInput/AfterValence';
import AfterPositive from '../screens/User/MoodInput/AfterPositive';
import AfterNegative from '../screens/User/MoodInput/AfterNegative';
import TimeSegmentSelector from '../screens/User/MoodInput/TimeSegmentSelector';
import Home from '../screens/User/Home';
import MoodEntries from '../screens/User/MoodEntries';
import SideBarNav from '../components/SideBarNav';
import StatisticsDashboard from '../screens/User/Statistics/StatisticsDashboard';
import MoodCount from '../screens/User/Statistics/MoodCount';
import ActivitiesStatistics from '../screens/User/Statistics/ActivitiesStatistics';
import SleepAnalysis from '../screens/User/Statistics/SleepAnalysis';
import Prediction from '../screens/User/Prediction/Prediction';
import CategoryPrediction from '../screens/User/Prediction/CategoryPrediction';

const Stack = createStackNavigator();

export default function MainStack({ initialRoute }) {
  return (
    <Stack.Navigator initialRouteName={initialRoute}>
        <Stack.Screen 
        name="Landing" 
        component={LandingScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="SideBar" 
        component={SideBarNav}
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
        name="ChooseCategory" 
        component={ChooseCategory}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="TimeSegmentSelector" 
        component={TimeSegmentSelector}
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
    <Stack.Screen
      name="StatisticsDashboard"
      component={StatisticsDashboard}
      options={{ headerShown: false }}
    />
      <Stack.Screen      
        name="MoodCount" 
        component={MoodCount}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ActivitiesStatistics"
        component={ActivitiesStatistics}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="SleepAnalysis"
        component={SleepAnalysis}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Prediction"
        component={Prediction}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="CategoryPrediction"
        component={CategoryPrediction}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}