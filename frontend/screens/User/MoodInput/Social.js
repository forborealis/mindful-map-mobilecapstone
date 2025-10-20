import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fonts } from '../../../utils/fonts/fonts';
import { colors } from '../../../utils/colors/colors';

const chunkArray = (arr, size) => {
  const result = [];
  for (let i = 0; i < arr.length; i += size) {
    result.push(arr.slice(i, i + size));
  }
  return result;
};

const Social = ({ navigation }) => {
  const [selectedInteraction, setSelectedInteraction] = useState(null);

  const interactions = [
    { id: 'alone', title: 'Alone', image: require('../../../assets/images/mood/alone.png') },
    { id: 'friends', title: 'Friend/s', image: require('../../../assets/images/mood/friend.png') },
    { id: 'family', title: 'Family', image: require('../../../assets/images/mood/family.png') },
    { id: 'classmates', title: 'Classmate/s', image: require('../../../assets/images/mood/classmate.png') },
    { id: 'relationship', title: 'Relationship', image: require('../../../assets/images/mood/relationship.png') },
    { id: 'online', title: 'Online Interaction', image: require('../../../assets/images/mood/onlineInteraction.png') },
    { id: 'pet', title: 'Pet', image: require('../../../assets/images/mood/pet.png') }
  ];

  const rows = chunkArray(interactions, 3);

  const handleSelect = (id) => {
    setSelectedInteraction(id);
    console.log('Selected interaction:', id);
  };

  const handleSubmit = () => {
    if (selectedInteraction) {
      console.log('Submitting interaction:', selectedInteraction);
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
            Select a Social Interaction
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
              {row.map((interaction) => {
                const isSelected = selectedInteraction === interaction.id;
                return (
                  <TouchableOpacity
                    key={interaction.id}
                    onPress={() => handleSelect(interaction.id)}
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
                        source={interaction.image}
                        className="w-16 h-16 mb-1"
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
                        {interaction.title}
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
          disabled={!selectedInteraction}
          className="rounded-full py-4 px-8 shadow-lg active:scale-95"
          style={{
            backgroundColor: selectedInteraction ? colors.primary : colors.secondary,
            opacity: selectedInteraction ? 1 : 0.5
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

export default Social;