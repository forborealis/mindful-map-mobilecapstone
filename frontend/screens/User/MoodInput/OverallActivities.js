import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fonts } from '../../../utils/fonts/fonts';
import { colors } from '../../../utils/colors/colors';
import activityImages from '../../../utils/images/activities';

const chunkArray = (arr, size) => {
  const result = [];
  for (let i = 0; i < arr.length; i += size) {
    result.push(arr.slice(i, i + size));
  }
  return result;
};

const OverallActivities = ({ navigation, route }) => {
  const [selectedActivity, setSelectedActivity] = useState(null);
  
  const { category, selectedTime, timeSegment, selectedDate } = route.params || {};

  const activities = [
    { id: 'commute', title: 'Commute', image: activityImages.commute },
    { id: 'exam', title: 'Exam', image: activityImages.exam },
    { id: 'homework', title: 'Homework', image: activityImages.homework },
    { id: 'study', title: 'Study', image: activityImages.study },
    { id: 'project', title: 'Project', image: activityImages.project },
    { id: 'read', title: 'Read', image: activityImages.read },
    { id: 'extracurricular', title: 'Extracurricular Activities', image: activityImages.extracurricular },
    { id: 'household-chores', title: 'Household Chores', image: activityImages.householdChores },
    { id: 'relax', title: 'Relax', image: activityImages.relax },
    { id: 'watch-movie', title: 'Watch Movie', image: activityImages.watchMovie },
    { id: 'listen-music', title: 'Listen to Music', image: activityImages.listenToMusic },
    { id: 'gaming', title: 'Gaming', image: activityImages.gaming },
    { id: 'browse-internet', title: 'Browse the Internet', image: activityImages.browseInternet },
    { id: 'shopping', title: 'Shopping', image: activityImages.shopping },
    { id: 'travel', title: 'Travel', image: activityImages.travel }
  ];

  const rows = chunkArray(activities, 3);

  const handleSelect = (id) => {
    setSelectedActivity(id);
    console.log('Selected activity:', id);
  };

  const handleSubmit = () => {
    if (selectedActivity) {
      navigation.navigate('BeforeValence', { 
        category,
        selectedTime,
        timeSegment,
        activity: selectedActivity,
        selectedDate
      });
    }
  };

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }}>
      <ScrollView
        className="flex-1 px-6"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: 40, paddingBottom: 40 }}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="absolute left-0 top-0 z-10"
          activeOpacity={0.7}
        >
          <Text
            style={{
              fontSize: 28,
              color: colors.text,
              fontFamily: fonts.semiBold
            }}
          >
            ←
          </Text>
        </TouchableOpacity>

        <View className="mb-8">
          <Text
            className="text-3xl text-center mb-2"
            style={{
              color: colors.text,
              fontFamily: fonts.semiBold,
              lineHeight: 42
            }}
          >
            Select an Activity
          </Text>
          <Text
            className="text-center text-sm"
            style={{
              color: colors.text,
              fontFamily: fonts.regular,
              opacity: 0.7,
              lineHeight: 20
            }}
          >
            *Only select one
          </Text>
        </View>

        <View className="mb-8">
          {rows.map((row, rowIndex) => (
            <View key={rowIndex} className="flex-row justify-center mb-6">
              {row.map((activity) => {
                const isSelected = selectedActivity === activity.id;
                return (
                  <TouchableOpacity
                    key={activity.id}
                    onPress={() => handleSelect(activity.id)}
                    className="mx-2 active:scale-95"
                    style={{ width: 100 }}
                    activeOpacity={0.7}
                  >
                    <View
                      className="rounded-2xl items-center justify-center"
                      style={{
                        backgroundColor: isSelected ? colors.primary : colors.secondary,
                        aspectRatio: 1,
                        borderWidth: isSelected ? 3 : 0,
                        borderColor: colors.accent || '#0d9488',
                        padding: 10
                      }}
                    >
                      <Image
                        source={activityImages[activity.id]}
                        className="w-16 h-16 mb-0"
                        resizeMode="contain"
                      />
                      <Text
                        className="text-center text-xs mt-1"
                        style={{
                          color: colors.text,
                          fontFamily: isSelected ? fonts.semiBold : fonts.regular,
                          lineHeight: 16
                        }}
                      >
                        {activity.title}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
        </View>

        <TouchableOpacity
          onPress={handleSubmit}
          disabled={!selectedActivity}
          className="rounded-full py-4 px-8 shadow-lg active:scale-95"
          style={{
            backgroundColor: selectedActivity ? colors.primary : colors.secondary,
            opacity: selectedActivity ? 1 : 0.5
          }}
          activeOpacity={0.8}
        >
          <Text
            className="text-center text-xl"
            style={{
              color: colors.text,
              fontFamily: fonts.semiBold,
              lineHeight: 24
            }}
          >
            Select 
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

export default OverallActivities;