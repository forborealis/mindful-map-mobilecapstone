import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { fonts } from '../../../utils/fonts/fonts';
import { colors } from '../../../utils/colors/colors';
import { moodDataService } from '../../../services/moodDataService';
import TutorialModal from '../../../components/TutorialModal';

const ChooseCategory = ({ navigation, route }) => {
    const { selectedDate } = route.params || {};
    const [hasSleepLog, setHasSleepLog] = useState(false);
    const [existingSleepLog, setExistingSleepLog] = useState(null);
    const [showTutorial, setShowTutorial] = useState(false);
    
    // Check for existing sleep log when component mounts
    useEffect(() => {
        const checkSleepLog = async () => {
            try {
                let result;
                if (selectedDate) {
                    result = await moodDataService.getTodaysLastMoodLog('sleep', selectedDate);
                } else {
                    result = await moodDataService.getTodaysSleepLog();
                }
                
                if (result.success && (result.sleepLog || result.lastLog)) {
                    setHasSleepLog(true);
                    setExistingSleepLog(result.sleepLog || result.lastLog);
                } else {
                    setHasSleepLog(false);
                    setExistingSleepLog(null);
                }
            } catch (error) {
                console.error('Error checking sleep log:', error);
                setHasSleepLog(false);
                setExistingSleepLog(null);
            }
        };
        
        checkSleepLog();
    }, [selectedDate]);

    const categories = [
    { id: 'activity', title: 'Activities', image: require('../../../assets/images/mood/others/activities.png'), screen: 'OverallActivities' },
    { id: 'social', title: 'Social Interactions', image: require('../../../assets/images/mood/others/social.png'), screen: 'Social' },
    { id: 'health', title: 'Health-related Activities', image: require('../../../assets/images/mood/others/health.png'), screen: 'Health' },
    { id: 'sleep', title: "Previous Night's Sleep (Hours)", image: require('../../../assets/images/mood/others/sleep.png'), screen: 'Sleep' }
    ];

  const handleCategoryPress = async (categoryId) => {
    const selected = categories.find(cat => cat.id === categoryId);
    if (selected) {
      // For sleep category, handle differently
      if (categoryId === 'sleep') {
        // If there's already a sleep log, don't allow clicking (this shouldn't happen due to disabled state)
        if (hasSleepLog) {
          return;
        }
        
        // No existing log, go directly to Sleep screen (skip TimeSegmentSelector)
        navigation.navigate('Sleep', { 
          category: categoryId,
          categoryTitle: selected.title,
          selectedDate
        });
      } else {
        // For other categories, go to TimeSegmentSelector first
        navigation.navigate('TimeSegmentSelector', { 
          category: categoryId,
          categoryTitle: selected.title,
          nextScreen: selected.screen,
          selectedDate
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
      {/* Help Icon */}
      <TouchableOpacity
        onPress={() => setShowTutorial(true)}
        className="absolute top-4 right-6 z-10 p-2"
        activeOpacity={0.7}
        style={{ top: 50 }}
      >
        <Ionicons 
          name="help-circle-outline" 
          size={24} 
          color={colors.primary}
        />
      </TouchableOpacity>

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
              fontFamily: fonts.semiBold,
              paddingBottom: 8 // Add extra padding for descenders
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
          {categories.map((category) => {
            const isSleep = category.id === 'sleep';
            const isDisabled = isSleep && hasSleepLog;
            
            return (
              <TouchableOpacity
                key={category.id}
                onPress={() => !isDisabled && handleCategoryPress(category.id)}
                disabled={isDisabled}
                className={`rounded-2xl p-6 shadow-lg ${isDisabled ? '' : 'active:scale-95'}`}
                style={{ 
                  backgroundColor: isDisabled ? '#F3F4F6' : colors.background,
                  opacity: isDisabled ? 0.6 : 1
                }}
                activeOpacity={isDisabled ? 1 : 0.8}
              >
                <View className="flex-row items-center">
                  <View 
                    className="w-14 h-14 rounded-full items-center justify-center mr-5"
                    style={{ backgroundColor: isDisabled ? '#9CA3AF' : colors.primary }}
                  >
                    <Image
                      source={category.image}
                      className="w-8 h-8"
                      resizeMode="contain"
                      style={{ opacity: isDisabled ? 0.5 : 1 }}
                    />
                  </View>
                  <View className="flex-1">
                    <Text 
                      className="text-lg"
                      style={{ 
                        color: isDisabled ? '#6B7280' : colors.text,
                        fontFamily: fonts.regular
                      }}
                    >
                      {category.title}
                    </Text>
                    {isDisabled && existingSleepLog && (
                      <Text 
                        className="text-sm mt-1"
                        style={{ 
                          color: '#10B981',
                          fontFamily: fonts.medium
                        }}
                      >
                        ✓ Already logged ({existingSleepLog.hrs} hours)
                      </Text>
                    )}
                  </View>
                  <Text 
                    className="text-2xl opacity-50" 
                    style={{ 
                      color: isDisabled ? '#9CA3AF' : colors.text,
                      opacity: isDisabled ? 0.3 : 0.5
                    }}
                  >
                    {isDisabled ? '✓' : '›'}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
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
      <TutorialModal 
        isOpen={showTutorial}
        onClose={() => setShowTutorial(false)}
      />
    </SafeAreaView>
  );
};

export default ChooseCategory;