import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { journalService } from '../../../services/journalService';
import { fonts } from '../../../utils/fonts/fonts';

const CHALLENGES = [
  {
    key: "gratitude",
    title: "Gratitude",
    description: "Reflect on and list things you are thankful for today.",
    suggestions: [
      "I'm grateful for...",
      "Today I appreciated...",
      "A small thing that made me smile was...",
    ],
  },
  {
    key: "goal",
    title: "Goal Setting",
    description: "Set a meaningful goal you want to achieve soon.",
    suggestions: [
      "My goal for today is...",
      "One thing I want to accomplish is...",
      "Steps I can take to reach my goal...",
    ],
  },
  {
    key: "reflection",
    title: "Self Reflection",
    description: "Look back on your experiences and what you learned.",
    suggestions: [
      "Today I learned...",
      "I noticed that...",
      "Something I could improve on is...",
    ],
  },
  {
    key: "affirmation",
    title: "Positive Affirmation",
    description: "Write a positive statement to encourage yourself.",
    suggestions: [
      "I am capable of...",
      "I believe in myself because...",
      "Today I will remind myself...",
    ],
  },
  {
    key: "highlight",
    title: "Daily Highlights",
    description: "Share the best moments of your day.",
    suggestions: [
      "The best part of my day was...",
      "A moment that made me happy was...",
      "Something unexpected and good happened...",
    ],
  },
  {
    key: "problem",
    title: "Problem Solving",
    description: "Describe a challenge you faced and how you handled it.",
    suggestions: [
      "A challenge I faced today was...",
      "I handled it by...",
      "Next time, I might try...",
    ],
  },
  {
    key: "free",
    title: "Free Write",
    description: "Express anything on your mind, no prompt needed.",
    suggestions: [
      "Today I feel...",
      "What's on my mind is...",
      "I want to talk about...",
    ],
  },
];

export default function CreateJournalEntry() {
  const navigation = useNavigation();
  const route = useRoute();
  const challengeParam = route.params?.challenge;
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);

  // Find the selected challenge object for UI display
  const selectedChallengeObj = CHALLENGES.find(c => c.key === challengeParam?.key);

  // Handle suggestion bubble click
  const handleSuggestion = (suggestion) => {
    setContent(prev =>
      prev
        ? prev.trim().endsWith(".")
          ? prev + " " + suggestion
          : prev + ". " + suggestion
        : suggestion
    );
  };

  // Save journal entry
  const handleSave = async () => {
    if (!challengeParam?.title) {
      Alert.alert('No challenge selected.');
      return;
    }
    if (!content.trim()) {
      Alert.alert('Please enter your journal content.');
      return;
    }
    setLoading(true);
    // Save the challenge as its title (e.g. ["Gratitude"])
    const res = await journalService.createJournalEntry(content, new Date(), [challengeParam.title]);
    setLoading(false);
    if (res.success) {
      navigation.navigate('ViewJournal', { id: res.entry._id });
    } else {
      Alert.alert('Error', res.error || 'Failed to save entry');
    }
  };

  // Go back
  const handleBack = () => navigation.goBack();

  return (
    <View style={{ flex: 1, backgroundColor: '#F1F8E8' }}>
      {/* Header */}
      <View
        style={{
          paddingTop: 50,
          paddingBottom: 16,
          paddingHorizontal: 20,
          backgroundColor: '#fff',
          shadowColor: '#000',
          shadowOpacity: 0.05,
          shadowOffset: { width: 0, height: 4 },
          shadowRadius: 8,
          elevation: 5,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
          <TouchableOpacity
            onPress={handleBack}
            style={{
              padding: 8,
            }}
          >
            <Ionicons name="arrow-back" size={24} color="#55AD9B" />
          </TouchableOpacity>
          <View style={{ flex: 1, alignItems: 'center', marginRight: 40 }}>
            <Text style={{ fontFamily: fonts.bold, fontSize: 18, color: '#1b5f52' }}>
              New Journal Entry
            </Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 30 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Info Banner */}
        <View
          style={{
            backgroundColor: '#FEF3C7',
            borderRadius: 16,
            padding: 16,
            borderWidth: 2,
            borderColor: 'rgba(251, 191, 36, 0.3)',
            marginBottom: 16,
          }}
        >
          <MaterialIcons name="info-outline" size={22} color="#B45309" />
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: fonts.semiBold, fontSize: 13, color: '#92400e', lineHeight: 18 }}>
              Complete your daily challenge by reflecting and writing your thoughts below.
            </Text>
          </View>
        </View>

        {/* Challenge Info Card */}
        {selectedChallengeObj && (
          <View style={{
            backgroundColor: '#fff',
            borderRadius: 16,
            padding: 18,
            borderWidth: 1.5,
            borderColor: '#D8EFD3',
            marginBottom: 18,
            flexDirection: 'row',
            alignItems: 'flex-start'
          }}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: '#1b5f52', fontSize: 17, marginBottom: 2, fontFamily: fonts.semiBold, alignSelf: 'center'  }}>
                {selectedChallengeObj.title}
              </Text>
              <Text style={{ color: '#272829', fontSize: 14, fontFamily: fonts.semiBold, alignSelf: 'center'  }}>
                {selectedChallengeObj.description}
              </Text>
            </View>
          </View>
        )}

        {/* Suggestion Bubbles */}
        {selectedChallengeObj && selectedChallengeObj.suggestions && (
          <View style={{ marginBottom: 14 }}>
            <Text style={{ color: '#1b5f52', fontSize: 14, marginBottom: 6, fontFamily: fonts.semiBold }}>Suggestions</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
              {selectedChallengeObj.suggestions.map((s, i) => (
                <TouchableOpacity
                  key={i}
                  style={{
                    backgroundColor: '#EAF7F3',
                    borderRadius: 16,
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    margin: 4,
                    borderWidth: 1,
                    borderColor: '#D8EFD3'
                  }}
                  onPress={() => handleSuggestion(s)}
                >
                  <Text style={{ color: '#3e8e7e', fontSize: 13, fontFamily: fonts.semiBold }}>{s}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Journal Content */}
        <View
          style={{
            backgroundColor: '#fff',
            borderRadius: 20,
            padding: 18,
            shadowColor: '#000',
            shadowOpacity: 0.06,
            shadowOffset: { width: 0, height: 2 },
            shadowRadius: 8,
            elevation: 3,
            marginBottom: 18,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <Text style={{ fontFamily: fonts.bold, fontSize: 16, color: '#1b5f52' }}>
              Journal Content
            </Text>
            <View
              style={{
                paddingHorizontal: 10,
                paddingVertical: 4,
                borderRadius: 12,
                backgroundColor: 'rgba(251, 191, 36, 0.1)',
              }}
            >
              <Text style={{ fontFamily: fonts.semiBold, fontSize: 10, color: '#92400e' }}>
                REQUIRED
              </Text>
            </View>
          </View>
          <TextInput
            style={{
              borderRadius: 12,
              borderWidth: 1,
              borderColor: '#E5E7EB',
              padding: 12,
              fontFamily: fonts.semiBold,
              fontSize: 15,
              color: '#272829',
              backgroundColor: '#FAFAFA',
              minHeight: 120,
              textAlignVertical: 'top',
              marginBottom: 8,
            }}
            multiline
            value={content}
            onChangeText={setContent}
            placeholder="Write your thoughts here..."
            placeholderTextColor="#9CA3AF"
          />
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 6 }}>
            <MaterialIcons name="info-outline" size={16} color="#9CA3AF" />
            <Text style={{ flex: 1, fontFamily: fonts.semiBold, fontSize: 11, color: '#9CA3AF', lineHeight: 16 }}>
              You can use the suggestions above or write anything that comes to mind.
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={{ gap: 12, marginTop: 8 }}>
          <TouchableOpacity
            onPress={handleSave}
            disabled={loading}
            style={{
              paddingVertical: 16,
              borderRadius: 16,
              backgroundColor: loading ? '#CBD5E1' : '#55AD9B',
              alignItems: 'center',
              flexDirection: 'row',
              justifyContent: 'center',
              gap: 8,
              shadowColor: loading ? 'transparent' : '#55AD9B',
              shadowOpacity: 0.3,
              shadowOffset: { width: 0, height: 4 },
              shadowRadius: 8,
              elevation: loading ? 0 : 4,
            }}
          >
            {loading ? (
              <>
                <ActivityIndicator size="small" color="#fff" />
                <Text style={{ fontFamily: fonts.semiBold, fontSize: 15, color: '#fff' }}>
                  Saving...
                </Text>
              </>
            ) : (
              <>
                <MaterialIcons name="send" size={18} color="#fff" />
                <Text style={{ fontFamily: fonts.bold, fontSize: 15, color: '#fff' }}>
                  Save Entry
                </Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleBack}
            style={{
              paddingVertical: 14,
              borderRadius: 16,
              borderWidth: 1.5,
              borderColor: '#E5E7EB',
              backgroundColor: '#fff',
              alignItems: 'center',
            }}
          >
            <Text style={{ fontFamily: fonts.semiBold, fontSize: 14, color: '#6B7280' }}>
              Cancel
            </Text>
          </TouchableOpacity>
        </View>

        {/* Bottom Note */}
        <View style={{ alignItems: 'center', paddingVertical: 12 }}>
          <Text style={{ fontFamily: fonts.regular, fontSize: 12, color: '#9CA3AF', textAlign: 'center', lineHeight: 18 }}>
            Journaling regularly helps you reflect, grow, and build a mindful habit.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}