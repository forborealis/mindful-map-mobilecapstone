import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  Dimensions,
  StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { fonts } from '../utils/fonts/fonts';
import { colors } from '../utils/colors/colors';

const { width } = Dimensions.get('window');

const heroImages = [
  require('../assets/images/landing/landing1.png'),
  require('../assets/images/landing/landing2.png'),
  require('../assets/images/landing/landing3.png'),
  require('../assets/images/landing/landing4.png'),
  require('../assets/images/landing/landing5.png'),
];

// Carousel images under Features section
const montageImages = [
  require('../assets/images/landing/features/landing1.png'),
  require('../assets/images/landing/features/landing2.png'),
  require('../assets/images/landing/features/landing3.png'),
  require('../assets/images/landing/features/landing4.png'),
  require('../assets/images/landing/features/landing5.png'),
  require('../assets/images/landing/features/landing6.png'),
  require('../assets/images/landing/features/landing7.png'),
  require('../assets/images/landing/features/landing8.png'),
  require('../assets/images/landing/features/landing9.png'),
];

export default function Landing() {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [montageIndex, setMontageIndex] = useState(0);
  const navigation = useNavigation();

  // Auto-rotate hero images
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % heroImages.length);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const prevMontage = () => {
    setMontageIndex((prev) =>
      prev === 0 ? montageImages.length - 1 : prev - 1
    );
  };

  const nextMontage = () => {
    setMontageIndex((prev) =>
      prev === montageImages.length - 1 ? 0 : prev + 1
    );
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      showsVerticalScrollIndicator={false}
    >
      <StatusBar backgroundColor={colors.primary} barStyle="light-content" />

      {/* Navigation Header (similar to web top nav) */}
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

        <View className="flex-row items-center">

          <TouchableOpacity
            className="px-6 py-2 rounded-full flex-row items-center"
            style={{ backgroundColor: colors.creamWhite }}
            onPress={() => navigation.navigate('Signup')}
          >
            <Text
              className="text-base font-semibold"
              style={{ fontFamily: fonts.semiBold, color: colors.primary }}
            >
              Sign Up
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Hero Image */}
      <View className="items-center mb-8 relative">
        <Image
          source={heroImages[currentImageIndex]}
          className="rounded-2xl"
          style={{
            width: width * 0.9,
            height: width * 0.8,
            resizeMode: 'cover',
            top: 50,
          }}
        />
      </View>

      {/* Hero Section (similar text as web) */}
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
            style={{ fontFamily: fonts.bold, color: colors.primary, width: '100%' }}
          >
            Wellness Journey
          </Text>
          <Text
            className="text-lg text-center mb-2 leading-relaxed"
            style={{
              fontFamily: fonts.regular,
              color: colors.text,
              opacity: 0.8,
            }}
          >
            Track your emotions, discover patterns, and build healthier habits
            with personalized insights.
          </Text>
        </View>

        <View className="space-y-4 mb-8">
          <TouchableOpacity
            className="py-4 px-8 rounded-full mb-4 flex-row items-center justify-center"
            style={{ backgroundColor: colors.primary }}
            onPress={() => navigation.navigate('Signup')}
          >
            <Ionicons
              name="play-circle-outline"
              size={22}
              color={colors.creamWhite}
              style={{ marginRight: 8 }}
            />
            <Text
              className="text-xl font-semibold text-center"
              style={{
                fontFamily: fonts.semiBold,
                color: colors.creamWhite,
                width: '100%',
              }}
            >
              Get Started
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="py-4 px-8 rounded-full border-2 flex-row items-center justify-center"
            style={{
              backgroundColor: 'transparent',
              borderColor: colors.primary,
            }}
            onPress={() => navigation.navigate('About')}
          >
            <Text
              className="text-xl font-semibold text-center"
              style={{
                fontFamily: fonts.semiBold,
                color: colors.primary,
                width: '100%',
              }}
            >
              Learn More
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Features Section (similar to web "Features That Make a Difference") */}
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

        <View>
          {/* Mood Tracking */}
          <View
            className="p-6 rounded-2xl"
            style={{
              backgroundColor: colors.white + 'CC',
              marginBottom: 20,
            }}
          >
            <View
              className="w-16 h-16 rounded-2xl items-center justify-center mb-8"
              style={{ backgroundColor: colors.accent }}
            >
              <Ionicons name="happy-outline" size={32} color={colors.primary} />
            </View>
            <Text
              className="text-2xl mb-2"
              style={{ fontFamily: fonts.semiBold, color: colors.text }}
            >
              Mood Tracking
            </Text>
            <Text
              className="text-base leading-relaxed"
              style={{
                fontFamily: fonts.regular,
                color: colors.text,
                opacity: 0.8,
              }}
            >
              Track emotions with intelligent prompts and discover patterns in your
              mental health.
            </Text>
          </View>

          {/* Smart Insights */}
          <View
            className="p-6 rounded-2xl"
            style={{
              backgroundColor: colors.white + 'CC',
              marginBottom: 20,
            }}
          >
            <View
              className="w-16 h-16 rounded-2xl items-center justify-center mb-4"
              style={{ backgroundColor: colors.accent }}
            >
              <Ionicons
                name="sparkles-outline"
                size={32}
                color={colors.primary}
              />
            </View>
            <Text
              className="text-2xl mb-2"
              style={{ fontFamily: fonts.semiBold, color: colors.text }}
            >
              Smart Insights
            </Text>
            <Text
              className="text-base leading-relaxed"
              style={{
                fontFamily: fonts.regular,
                color: colors.text,
                opacity: 0.8,
              }}
            >
              Get personalized recommendations based on your unique patterns and
              habits.
            </Text>
          </View>

          {/* Visual Analytics */}
          <View
            className="p-6 rounded-2xl"
            style={{
              backgroundColor: colors.white + 'CC',
              marginBottom: 20,
            }}
          >
            <View
              className="w-16 h-16 rounded-2xl items-center justify-center mb-4"
              style={{ backgroundColor: colors.accent }}
            >
              <Ionicons
                name="bar-chart-outline"
                size={32}
                color={colors.primary}
              />
            </View>
            <Text
              className="text-2xl mb-2"
              style={{ fontFamily: fonts.semiBold, color: colors.text }}
            >
              Visual Analytics
            </Text>
            <Text
              className="text-base leading-relaxed"
              style={{
                fontFamily: fonts.regular,
                color: colors.text,
                opacity: 0.8,
              }}
            >
              Beautiful charts and graphs to visualize your progress and celebrate
              milestones.
            </Text>
          </View>

          {/* Journaling */}
          <View
            className="p-6 rounded-2xl"
            style={{
              backgroundColor: colors.white + 'CC',
              marginBottom: 0,
            }}
          >
            <View
              className="w-16 h-16 rounded-2xl items-center justify-center mb-4"
              style={{ backgroundColor: colors.accent }}
            >
              <Ionicons name="book-outline" size={32} color={colors.primary} />
            </View>
            <Text
              className="text-2xl mb-2"
              style={{ fontFamily: fonts.semiBold, color: colors.text }}
            >
              Journaling
            </Text>
            <Text
              className="text-base leading-relaxed"
              style={{
                fontFamily: fonts.regular,
                color: colors.text,
                opacity: 0.8,
              }}
            >
              Guided prompts and reflection exercises to promote self-awareness
              and growth.
            </Text>
          </View>
        </View>
      </View>

      {/* Carousel under Features (montage images, no card container, larger images) */}
      <View
        className="py-6 px-6"
        style={{ backgroundColor: colors.background }}
      >

        <View style={{ alignItems: 'center' }}>
          <View
            style={{
              width: '100%',
              alignItems: 'center',
              paddingVertical: 8,
            }}
          >
            <Image
              source={montageImages[montageIndex]}
              style={{
                width: width * 2.5,
                height: width * 1.5,
                resizeMode: 'contain',
              }}
            />

            {/* Left / Right buttons */}
            <TouchableOpacity
              onPress={prevMontage}
              style={{
                position: 'absolute',
                left: -5,
                top: '50%',
                marginTop: -24,
                backgroundColor: 'rgba(0,0,0,0.15)',
                borderRadius: 999,
                padding: 8,
              }}
              activeOpacity={0.8}
            >
              <Ionicons
                name="chevron-back"
                size={24}
                color={colors.creamWhite}
              />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={nextMontage}
              style={{
                position: 'absolute',
                right: -5,
                top: '50%',
                marginTop: -24,
                backgroundColor: 'rgba(0,0,0,0.15)',
                borderRadius: 999,
                padding: 8,
              }}
              activeOpacity={0.8}
            >
              <Ionicons
                name="chevron-forward"
                size={24}
                color={colors.creamWhite}
              />
            </TouchableOpacity>
          </View>

          {/* Dots */}
          <View
            className="mt-4 flex-row justify-center items-center"
            style={{ flexWrap: 'wrap' }}
          >
            {montageImages.map((_, i) => (
              <TouchableOpacity
                key={i}
                onPress={() => setMontageIndex(i)}
                style={{
                  height: 8,
                  borderRadius: 999,
                  marginHorizontal: 3,
                  marginVertical: 3,
                  width: i === montageIndex ? 20 : 8,
                  backgroundColor:
                    i === montageIndex
                      ? colors.primary
                      : colors.accent + 'AA',
                }}
              />
            ))}
          </View>
        </View>
      </View>

      {/* Mental Health Resources Section (improved, above Start Your Journey) */}
      <View
        className="py-12 px-6"
        style={{ backgroundColor: colors.background }}
      >
        <View className="items-center mb-8">
          <Text
            className="text-3xl text-center mb-2"
            style={{ fontFamily: fonts.bold, color: colors.text }}
          >
            Need Support?
          </Text>
          <Text
            className="text-lg text-center mb-4 leading-relaxed"
            style={{
              fontFamily: fonts.regular,
              color: colors.text,
              opacity: 0.8,
            }}
          >
            Access mental health resources and professional support when you need
            it the most.
          </Text>
        </View>

        <TouchableOpacity
          className="py-6 px-6 rounded-2xl"
          style={{ backgroundColor: colors.white + 'CC' }}
          onPress={() => navigation.navigate('MentalHealthResources')}
          activeOpacity={0.9}
        >

          <Text
            className="text-2xl mb-2"
            style={{ fontFamily: fonts.semiBold, color: colors.text, textAlign: 'center' }}
          >
            Mental Health Resources
          </Text>

          <Text
            className="text-base leading-relaxed mb-3"
            style={{
              fontFamily: fonts.regular,
              color: colors.text,
              opacity: 0.8,
              textAlign: 'justify',
            }}
          >
            Explore crisis hotlines, clinics, counseling services, and support
            organizations in one place.
          </Text>

          <View className="flex-row items-center mb-1">
            <Ionicons
              name="call-outline"
              size={18}
              color={colors.primary}
              style={{ marginRight: 6 }}
            />
            <Text
              style={{
                fontFamily: fonts.semiBold,
                fontSize: 12,
                color: colors.text,
              }}
              
            >
              Quick access to hotlines and emergency contacts.
            </Text>
          </View>

          <View className="flex-row items-center mb-1">
            <Ionicons
              name="business-outline"
              size={18}
              color={colors.primary}
              style={{ marginRight: 6 }}
            />
            <Text
              style={{
                fontFamily: fonts.semiBold,
                fontSize: 12,
                color: colors.text,
              }}
            >
              Find nearby clinics and mental health centers.
            </Text>
          </View>

          <View className="flex-row items-center">
            <Ionicons
              name="open-outline"
              size={18}
              color={colors.primary}
              style={{ marginRight: 6 }}
            />
            <Text
              style={{
                fontFamily: fonts.semiBold,
                fontSize: 12,
                color: colors.text,
              }}
            >
              Curated links to trusted online resources.
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Start Your Journey Section (CTA, below resources) */}
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
            maxWidth: 280,
          }}
        >
          Begin your journey with tools designed to help you reflect, track, and
          grow—one day at a time.
        </Text>

        <TouchableOpacity
          className="py-4 px-10 rounded-full items-center flex-row justify-center"
          style={{ backgroundColor: colors.creamWhite }}
          onPress={() => navigation.navigate('Signup')}
        >
          <Text
            className="text-lg"
            style={{ fontFamily: fonts.bold, color: colors.primary }}
          >
            Begin Your Journey Today
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}