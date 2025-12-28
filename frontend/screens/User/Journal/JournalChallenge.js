import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons, MaterialIcons, FontAwesome5, Feather, MaterialCommunityIcons, Entypo } from '@expo/vector-icons';
import { fonts } from '../../../utils/fonts/fonts';

const CHALLENGES = [
  {
    key: "gratitude",
    title: "Gratitude",
    description: "Reflect on and list things you are thankful for today.",
    color: "#EAF7F3",
    icon: <Feather name="heart" size={28} color="#55AD9B" />,
  },
  {
    key: "goal",
    title: "Goal Setting",
    description: "Set a meaningful goal you want to achieve soon.",
    color: "#FFF7E0",
    icon: <FontAwesome5 name="bullseye" size={28} color="#F59E42" />,
  },
  {
    key: "reflection",
    title: "Self Reflection",
    description: "Look back on your experiences and what you learned.",
    color: "#F3E8FF",
    icon: <MaterialCommunityIcons name="mirror" size={28} color="#8B5CF6" />,
  },
  {
    key: "affirmation",
    title: "Positive Affirmation",
    description: "Write a positive statement to encourage yourself.",
    color: "#FEF3C7",
    icon: <MaterialIcons name="emoji-emotions" size={28} color="#FBBF24" />,
  },
  {
    key: "highlight",
    title: "Daily Highlights",
    description: "Share the best moments of your day.",
    color: "#E0F2FE",
    icon: <Feather name="star" size={28} color="#38BDF8" />,
  },
  {
    key: "problem",
    title: "Problem Solving",
    description: "Describe a challenge you faced and how you handled it.",
    color: "#FCE7F3",
    icon: <MaterialCommunityIcons name="puzzle" size={28} color="#EC4899" />,
  },
  {
    key: "free",
    title: "Free Write",
    description: "Express anything on your mind, no prompt needed.",
    color: "#DCFCE7",
    icon: <Entypo name="feather" size={28} color="#22C55E" />,
  },
];

export default function JournalChallenge() {
  const navigation = useNavigation();

  return (
    <View style={{ flex: 1, backgroundColor: '#F1F8E8' }}>
      {/* Header */}
      <View
        style={{
          paddingTop: 36,
          paddingBottom: 18,
          backgroundColor: '#fff',
          borderBottomWidth: 2,
          borderBottomColor: '#CBE7DC',
          shadowColor: '#000',
          shadowOpacity: 0.06,
          shadowOffset: { width: 0, height: 2 },
          shadowRadius: 6,
          elevation: 3,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12 }}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={{
              padding: 10,
              borderRadius: 999,
              backgroundColor: 'rgba(255,255,255,0.8)',
            }}
          >
            <Ionicons name="arrow-back" size={24} color="#55AD9B" />
          </TouchableOpacity>
          <View style={{ flex: 1, alignItems: 'center', paddingHorizontal: 20 }}>
            <Text style={{ fontFamily: fonts.bold, fontSize: 21, color: '#1b5f52', letterSpacing: 0., alignSelf: 'center'   }}>
              Journal Challenge
            </Text>
          </View>
          <View style={{ width: 44 }} />
        </View>
      </View>

      <ScrollView style={{ flex: 1 }}>
        <View style={{ marginTop: 18, marginBottom: 8, paddingHorizontal: 10 }}>
          {CHALLENGES.map((challenge, idx) => (
            <TouchableOpacity
              key={challenge.key}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: challenge.color,
                borderRadius: 18,
                paddingVertical: 22,
                paddingHorizontal: 18,
                marginBottom: 14,
                elevation: 2,
                shadowColor: '#000',
                shadowOpacity: 0.07,
                shadowRadius: 6,
                shadowOffset: { width: 0, height: 2 },
                borderWidth: 2,
                borderColor: '#D8EFD3',
              }}
              activeOpacity={0.88}
              onPress={() => navigation.navigate('CreateJournalEntry', { challenge })}
            >
              <View
                style={{
                  width: 54,
                  height: 54,
                  borderRadius: 16,
                  backgroundColor: '#fff',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 18,
                  borderWidth: 1.5,
                  borderColor: '#E5E7EB',
                  shadowColor: '#000',
                  shadowOpacity: 0.06,
                  shadowRadius: 4,
                  shadowOffset: { width: 0, height: 2 },
                  elevation: 2,
                }}
              >
                {challenge.icon}
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontFamily: fonts.bold,
                    fontSize: 17,
                    color: '#1b5f52',
                    marginBottom: 3,
                  }}
                >
                  {challenge.title}
                </Text>
                <Text
                  style={{
                    fontFamily: fonts.semiBold,
                    fontSize: 13,
                    color: '#272829',
                    opacity: 0.85,
                  }}
                >
                  {challenge.description}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={22} color="#55AD9B" style={{ marginLeft: 8 }} />
            </TouchableOpacity>
          ))}
        </View>
        {/* Footer */}
        <View
          style={{
            marginBottom: 36,
            alignItems: 'center',
            paddingHorizontal: 24,
          }}
        >
          <Text
            style={{
              fontSize: 10,
              color: '#1b5f52',
              textAlign: 'center',
              opacity: 0.85,
              fontFamily: fonts.semiBold,
              letterSpacing: 0.2,
            }}
          >
            Tip: Try a different prompt each day to build a richer habit.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}