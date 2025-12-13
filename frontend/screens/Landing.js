import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView, 
  Image, 
  Dimensions,
  StatusBar 
} from 'react-native';
import { fonts } from '../utils/fonts/fonts';
import { colors } from '../utils/colors/colors';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');

const heroImages = [
  require('../assets/images/landing/landing1.png'),
  require('../assets/images/landing/landing2.png'),
  require('../assets/images/landing/landing3.png'),
  require('../assets/images/landing/landing4.png'),
  require('../assets/images/landing/landing5.png'),
];

export default function Landing() {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const navigation = useNavigation();

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % heroImages.length);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <ScrollView 
      style={{ flex: 1, backgroundColor: colors.background }}
      showsVerticalScrollIndicator={false}
    >
      <StatusBar backgroundColor={colors.primary} barStyle="light-content" />
      
      {/* Navigation Header */}
      <View 
        className="w-full px-6 py-4 flex-row justify-between items-center"
        style={{ backgroundColor: colors.primary, paddingTop: 50 }}
      >
        <Text 
          className="text-2xl"
          style={{ fontFamily: fonts.bold, color: colors.creamWhite }}
        >
          Mindful Map
        </Text>
        
        <TouchableOpacity 
          className="px-6 py-2 rounded-full"
          style={{ backgroundColor: colors.creamWhite }}
          onPress={() => navigation.navigate('Login')}
        >
          <Text 
            className="text-base font-semibold"
            style={{ fontFamily: fonts.semiBold, color: colors.primary }}
          >
            Login
          </Text>
        </TouchableOpacity>
      </View>

        {/* Hero Image with Animation */}
        <View className="items-center mb-8 relative">
          <Image
            source={heroImages[currentImageIndex]}
            className="rounded-2xl"
            style={{ 
              width: width * 0.9, 
              height: width * 0.8,
              resizeMode: 'cover',
              top: 50
            }}
          />
        </View>
      {/* Hero Section */}
      <View 
        className="px-6 py-8"
        style={{ backgroundColor: colors.background }}
      >
        <View className="items-center mb-8" style={{ width: '100%' }}>
          <Text 
            className="text-4xl text-center mb-1"
            style={{ fontFamily: fonts.bold, color: colors.text, width: '100%' }}
          >
            Your Mental
          </Text>
          <Text 
            className="text-4xl text-center mb-4"
            style={{ fontFamily: fonts.bold, color: colors.primary,  width: '100%' }}
          >
            Wellness Journey
          </Text>
          <Text 
            className="text-lg text-center mb-2 leading-relaxed"
            style={{ fontFamily: fonts.regular, color: colors.text, opacity: 0.8 }}
          >
            Track your emotions, discover patterns, and build healthier habits with personalized insights.
          </Text>
        </View>


        <View className="space-y-4 mb-8">
          <TouchableOpacity 
            className="py-4 px-8 rounded-full mb-4"
            style={{ backgroundColor: colors.primary }}
            onPress={() => navigation.navigate('Login')}
          >
            <Text 
              className="text-xl font-semibold text-center"
              style={{ fontFamily: fonts.semiBold, color: colors.creamWhite, width: '100%' }}
            >
              ▶ Try Today
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            className="py-4 px-8 rounded-full border-2"
            style={{ 
              backgroundColor: 'transparent',
              borderColor: colors.primary 
            }}
          >
            <Text 
              className="text-xl font-semibold text-center"
              style={{ fontFamily: fonts.semiBold, color: colors.primary, width: '100%' }}
            >
              Learn More
            </Text>
          </TouchableOpacity>
        </View>
      </View>


      {/* Features Section */}
      <View 
        className="py-12 px-6"
        style={{ backgroundColor: colors.background }}
      >
        <View className="items-center mb-8">
          <Text 
            className="text-4xl text-center mb-2"
            style={{ fontFamily: fonts.bold, color: colors.text }}
          >
            Features That
          </Text>
          <Text 
            className="text-4xl text-center mb-4"
            style={{ fontFamily: fonts.bold, color: colors.primary }}
          >
            Make a Difference
          </Text>
          <View 
            className="h-1 rounded-full mb-6"
            style={{ width: 80, backgroundColor: colors.primary }}
          />
        </View>

        <View className="space-y-6">
          <View 
            className="p-6 rounded-2xl"
            style={{ backgroundColor: colors.white + 'CC' }}
          >
            <View 
              className="w-16 h-16 rounded-2xl items-center justify-center mb-4"
              style={{ backgroundColor: colors.accent }}
            >
              <Text className="text-4xl">🧠</Text>
            </View>
            <Text 
              className="text-2xl  mb-2"
              style={{ fontFamily: fonts.semiBold, color: colors.text }}
            >
              Mood Tracking
            </Text>
            <Text 
              className="text-base leading-relaxed"
              style={{ fontFamily: fonts.regular, color: colors.text, opacity: 0.8 }}
            >
              Track emotions with intelligent prompts and discover patterns in your mental health.
            </Text>
          </View>

          <View 
            className="p-6 rounded-2xl"
            style={{ backgroundColor: colors.white + 'CC' }}
          >
            <View 
              className="w-16 h-16 rounded-2xl items-center justify-center mb-4"
              style={{ backgroundColor: colors.accent }}
            >
              <Text className="text-4xl">👍</Text>
            </View>
            <Text 
              className="text-2xl  mb-2"
              style={{ fontFamily: fonts.semiBold, color: colors.text }}
            >
              Smart Insights
            </Text>
            <Text 
              className="text-base leading-relaxed"
              style={{ fontFamily: fonts.regular, color: colors.text, opacity: 0.8 }}
            >
              Get personalized recommendations based on your unique patterns and habits.
            </Text>
          </View>

          <View 
            className="p-6 rounded-2xl"
            style={{ backgroundColor: colors.white + 'CC' }}
          >
            <View 
              className="w-16 h-16 rounded-2xl items-center justify-center mb-4"
              style={{ backgroundColor: colors.accent }}
            >
              <Text className="text-4xl">📊</Text>
            </View>
            <Text 
              className="text-2xl  mb-2"
              style={{ fontFamily: fonts.semiBold, color: colors.text }}
            >
              Visual Analytics
            </Text>
            <Text 
              className="text-base leading-relaxed"
              style={{ fontFamily: fonts.regular, color: colors.text, opacity: 0.8 }}
            >
              Beautiful charts and graphs to visualize your progress and celebrate milestones.
            </Text>
          </View>
        </View>
      </View>

      <View 
        className="py-16 px-6 items-center"
        style={{ backgroundColor: colors.primary }}
      >
        <Text 
          className="text-3xl text-center mb-4"
          style={{ fontFamily: fonts.bold, color: colors.creamWhite }}
        >
          Start Your Journey
        </Text>
        <Text 
          className="text-lg text-center mb-8 leading-relaxed"
          style={{ 
            fontFamily: fonts.regular, 
            color: colors.creamWhite, 
            opacity: 0.9,
            maxWidth: 280 
          }}
        >
          Join us in building healthier mental habits.
        </Text>
        
        <TouchableOpacity 
          className="py-4 px-10 rounded-full items-center"
          style={{ backgroundColor: colors.creamWhite }}
          onPress={() => navigation.navigate('Login')}
        >
          <Text 
            className="text-lg "
            style={{ fontFamily: fonts.bold, color: colors.primary }}
          >
            ▶ Try Now
          </Text>
        </TouchableOpacity>
      </View>

      {/* Mental Health Resources Section */}
      <View 
        className="py-12 px-6"
        style={{ backgroundColor: colors.background }}
      >
        <View className="items-center mb-8">
          <Text 
            className="text-4xl text-center mb-2"
            style={{ fontFamily: fonts.bold, color: colors.text }}
          >
            Need Support?
          </Text>
          <Text 
            className="text-lg text-center mb-4 leading-relaxed"
            style={{ fontFamily: fonts.regular, color: colors.text, opacity: 0.8 }}
          >
            Access mental health resources and professional support when you need it.
          </Text>
        </View>

        <TouchableOpacity 
          className="py-6 px-6 rounded-2xl items-center"
          style={{ backgroundColor: colors.white + 'CC' }}
          onPress={() => navigation.navigate('MentalHealthResources')}
        >
          <View 
            className="w-16 h-16 rounded-2xl items-center justify-center mb-4"
            style={{ backgroundColor: colors.accent }}
          >
            <Text className="text-4xl">💚</Text>
          </View>
          <Text 
            className="text-2xl mb-2"
            style={{ fontFamily: fonts.semiBold, color: colors.text }}
          >
            Mental Health Resources
          </Text>
          <Text 
            className="text-base text-center leading-relaxed"
            style={{ fontFamily: fonts.regular, color: colors.text, opacity: 0.8 }}
          >
            Explore crisis hotlines, clinics, counseling services, and support organizations.
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}