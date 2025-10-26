import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fonts } from '../../../utils/fonts/fonts';
import { colors } from '../../../utils/colors/colors';
import { moodDataService } from '../../../services/moodDataService';

const ChooseCategory = ({ navigation }) => {
    const categories = [
    { id: 'activity', title: 'Activities', image: require('../../../assets/images/mood/others/activities.png'), screen: 'OverallActivities' },
    { id: 'social', title: 'Social Interactions', image: require('../../../assets/images/mood/others/social.png'), screen: 'Social' },
    { id: 'health', title: 'Health-related Activities', image: require('../../../assets/images/mood/others/health.png'), screen: 'Health' },
    { id: 'sleep', title: "Previous Night's Sleep (Hours)", image: require('../../../assets/images/mood/others/sleep.png'), screen: 'Sleep' }
    ];

  const handleCategoryPress = async (categoryId) => {
    const selected = categories.find(cat => cat.id === categoryId);
    if (selected) {
      // For sleep category, check if there's already a sleep log
      if (categoryId === 'sleep') {
        try {
          const result = await moodDataService.getTodaysSleepLog();
          if (result.success && result.sleepLog) {
            // If there's already a sleep log, go directly to Sleep screen to update hours
            navigation.navigate('Sleep', { 
              category: categoryId,
              categoryTitle: selected.title,
              hasExistingLog: true
            });
          } else {
            // No existing log, go through TimeSegmentSelector
            navigation.navigate('TimeSegmentSelector', { 
              category: categoryId,
              categoryTitle: selected.title,
              nextScreen: selected.screen
            });
          }
        } catch (error) {
          console.error('Error checking sleep log:', error);
          // On error, default to TimeSegmentSelector flow
          navigation.navigate('TimeSegmentSelector', { 
            category: categoryId,
            categoryTitle: selected.title,
            nextScreen: selected.screen
          });
        }
      } else {
        // For other categories, go to TimeSegmentSelector first
        navigation.navigate('TimeSegmentSelector', { 
          category: categoryId,
          categoryTitle: selected.title,
          nextScreen: selected.screen
        });
      }
    }
  };

  const handleSkip = () => {
    console.log('User chose to do it later');
    navigation.navigate('SideBar', { screen: 'MoodEntries' });
  };

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: colors.secondary }}>
      <ScrollView 
        className="flex-1 px-6"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: 60, paddingBottom: 60 }}
      >
        <View className="mb-12">
          <Text 
            className="text-4xl text-center mb-3"
            style={{ 
              color: colors.text,
              fontFamily: fonts.semiBold
            }}
          >
            Choose a category
          </Text>
          <Text 
            className="text-center text-base opacity-80"
            style={{ 
              color: colors.text,
              fontFamily: fonts.regular
            }}
          >
            What would you like to track today?
          </Text>
        </View>

        <View className="gap-5 mb-12">
          {categories.map((category) => (
            <TouchableOpacity
              key={category.id}
              onPress={() => handleCategoryPress(category.id)}
              className="rounded-2xl p-6 shadow-lg active:scale-95"
              style={{ backgroundColor: colors.background }}
              activeOpacity={0.8}
            >
              <View className="flex-row items-center">
                <View 
                  className="w-14 h-14 rounded-full items-center justify-center mr-5"
                  style={{ backgroundColor: colors.primary }}
                >
                  <Image
                    source={category.image}
                    className="w-8 h-8"
                    resizeMode="contain"
                  />
                </View>
                <Text 
                  className="text-lg flex-1"
                  style={{ 
                    color: colors.text,
                    fontFamily: fonts.regular
                  }}
                >
                  {category.title || 'Untitled'}
                </Text>
                <Text className="text-2xl opacity-50" style={{ color: colors.text }}>
                  ›
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          onPress={handleSkip}
          className="items-center py-4 active:opacity-70"
          activeOpacity={0.8}
        >
          <Text 
            className="text-xl"
            style={{ 
              color: colors.text,
              fontFamily: fonts.semiBold
            }}
          >
            I'll do it later
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ChooseCategory;