import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import LoginScreen from '../screens/Login';
import SignupScreen from '../screens/Signup';
import LandingScreen from '../screens/Landing';
import DailyQuote from '../screens/User/DailyQuote';
import TeacherDrawer from './TeacherDrawer';
import AdminDrawer from './AdminDrawer';
import TeacherDashboard from '../screens/Teacher/Dashboard';
import SectionStudents from '../screens/Teacher/SectionStudents';
import StudentLogs from '../screens/Teacher/StudentLogs';
import TeacherProfile from '../screens/Teacher/Profile';
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
import DetailedMoodAnalysis from '../screens/User/Statistics/DetailedMoodAnalysis';
import DailyStatistics from '../screens/User/Statistics/Daily/DailyStatistics'; 
import WeeklyStatistics from '../screens/User/Statistics/Weekly/WeeklyStatistics';
import MoodCount from '../screens/User/Statistics/MoodCount';
import ActivitiesStatistics from '../screens/User/Statistics/ActivitiesStatistics';
import SleepAnalysis from '../screens/User/Statistics/SleepAnalysis';
import Anova from '../screens/User/Statistics/Anova';
import DailyAnova from '../screens/User/Statistics/Daily/DailyAnova';
import Recommendation from '../screens/User/Statistics/Daily/Recommendation'; 
import RecommendationRating from '../screens/User/Statistics/Daily/RecommendationRating';
import ViewRecommendation from '../screens/User/Statistics/Daily/ViewRecommendation'; 
import EditRecommendation from '../screens/User/Statistics/Daily/EditRecommendation';
import WeeklyAnova from '../screens/User/Statistics/Weekly/WeeklyAnova';
import Prediction from '../screens/User/Prediction/Prediction';
import CategoryPrediction from '../screens/User/Prediction/CategoryPrediction';
import BreathingExercises from '../screens/User/Activities/BreathingExercise/BreathingExercises';
import CompletionModal from '../screens/User/Activities/BreathingExercise/CompletionModal';
import ProgressModal from '../screens/User/Activities/BreathingExercise/ProgressModal';
import PomodoroTechnique from '../screens/User/Activities/PomodoroTechnique';
import GuidedMeditation from '../screens/User/Activities/GuidedMeditation';
import DailyAffirmation from '../screens/User/Activities/DailyAffirmation';
import CalmingMusic from '../screens/User/Activities/CalmingMusic';
import MentalHealthResources from '../screens/User/MentalHealthResources';
import JournalChallenge from '../screens/User/Journal/JournalChallenge';
import CreateJournalEntry from '../screens/User/Journal/CreateJournalEntry';
import EditJournal from '../screens/User/Journal/EditJournal';
import ViewJournal from '../screens/User/Journal/ViewJournal';
import JournalLogs from '../screens/User/Journal/JournalLogs';
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
        name="TeacherDrawer" 
        component={TeacherDrawer}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="AdminDrawer" 
        component={AdminDrawer}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="TeacherDashboard" 
        component={TeacherDashboard}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="SectionStudents" 
        component={SectionStudents}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="StudentLogs" 
        component={StudentLogs}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="TeacherProfile" 
        component={TeacherProfile}
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
        name="DailyQuote" 
        component={DailyQuote}
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
        name="DetailedMoodAnalysis" 
        component={DetailedMoodAnalysis}
        options={{ headerShown: false }}
      />
      <Stack.Screen      
        name="DailyStatistics" 
        component={DailyStatistics}
        options={{ headerShown: false }}
      />
      <Stack.Screen      
        name="WeeklyStatistics" 
        component={WeeklyStatistics}
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
        name="Anova"
        component={Anova}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="DailyAnova"
        component={DailyAnova}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Recommendation"
        component={Recommendation}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="RecommendationRating"
        component={RecommendationRating}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ViewRecommendation"
        component={ViewRecommendation}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="EditRecommendation"
        component={EditRecommendation}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="WeeklyAnova"
        component={WeeklyAnova}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="JournalChallenge"
        component={JournalChallenge}
        options={{ headerShown: false }}
      />
       <Stack.Screen
        name="CreateJournalEntry"
        component={CreateJournalEntry}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="EditJournal"
        component={EditJournal}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ViewJournal"
        component={ViewJournal}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="JournalLogs"
        component={JournalLogs}
        options={{ headerShown: true }}
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
      <Stack.Screen
        name="BreathingExercises"
        component={BreathingExercises}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="CompletionModal"
        component={CompletionModal}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ProgressModal"
        component={ProgressModal}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="PomodoroTechnique"
        component={PomodoroTechnique}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="GuidedMeditation"
        component={GuidedMeditation}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="DailyAffirmation"
        component={DailyAffirmation}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="CalmingMusic"
        component={CalmingMusic}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="MentalHealthResources"
        component={MentalHealthResources}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}