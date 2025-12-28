import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { fonts } from '../../../utils/fonts/fonts';
import { journalService } from '../../../services/journalService';

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

function getChallengeObjByTitle(title) {
  return (
    CHALLENGES.find(
      (c) => c.title.toLowerCase() === (title || '').toLowerCase()
    ) || null
  );
}

export default function EditJournal() {
  const navigation = useNavigation();
  const route = useRoute();
  const { id } = route.params || {};
  const [challengeTitle, setChallengeTitle] = useState('');
  const [challengeObj, setChallengeObj] = useState(null);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Fetch previous journal entry data
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await journalService.getJournalEntryById(id);
        const entry = res.entry;
        const firstChallenge = Array.isArray(entry?.challenges) && entry.challenges.length > 0
          ? entry.challenges[0]
          : '';
        setChallengeTitle(firstChallenge);
        setChallengeObj(getChallengeObjByTitle(firstChallenge));
        setContent(entry?.content || '');
      } catch (err) {
        Alert.alert('Failed to load journal entry.');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

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

  // Save updated journal entry
  const handleSave = async () => {
    if (!content.trim()) {
      Alert.alert('Content is required.');
      return;
    }
    setSaving(true);
    try {
      const res = await journalService.updateJournalEntry(id, content);
      if (res.success) {
        navigation.goBack();
      } else {
        Alert.alert('Failed to update journal entry.');
      }
    } catch (err) {
      Alert.alert('Failed to update journal entry.');
    } finally {
      setSaving(false);
    }
  };

  // Go back
  const handleBack = () => navigation.goBack();

  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#F1F8E8', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#55AD9B" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#F1F8E8' }}>
      {/* Header */}
      <View
        style={{
          paddingTop: 30,
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
            onPress={handleBack}
            style={{
              padding: 10,
              borderRadius: 999,
              backgroundColor: 'rgba(255,255,255,0.8)',
            }}
          >
            <Ionicons name="arrow-back" size={24} color="#55AD9B" />
          </TouchableOpacity>
          <View style={{ flex: 1, alignItems: 'center', paddingHorizontal: 20 }}>
            <Text style={{ fontFamily: fonts.bold, fontSize: 20, color: '#1b5f52' }}>
              Edit Journal Entry
            </Text>
          </View>
          <View style={{ width: 44 }} />
        </View>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
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
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
            <MaterialIcons name="info-outline" size={24} color="#92400e" />
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: fonts.semiBold, fontSize: 15, color: '#92400e', marginBottom: 4 }}>
                Edit Your Journal Entry
              </Text>
              <Text style={{ fontFamily: fonts.regular, fontSize: 13, color: '#78350f', lineHeight: 20 }}>
                Update your journal content below. You cannot change the challenge type.
              </Text>
            </View>
          </View>
        </View>

        {/* Challenge Info Card */}
        {challengeObj && (
          <View style={{
            backgroundColor: '#fff',
            borderRadius: 16,
            padding: 20,
            borderWidth: 2,
            borderColor: '#D8EFD3',
            shadowColor: '#000',
            shadowOpacity: 0.08,
            shadowOffset: { width: 0, height: 2 },
            shadowRadius: 6,
            elevation: 3,
            marginBottom: 16,
            flexDirection: 'row',
            alignItems: 'flex-start'
          }}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: '#1b5f52', fontFamily: fonts.bold, fontSize: 17, marginBottom: 2, alignSelf: 'center'    }}>
                {challengeObj.title}
              </Text>
              <Text style={{ color: '#272829', fontFamily: fonts.semiBold, fontSize: 14, alignSelf: 'center'  }}>
                {challengeObj.description}
              </Text>
            </View>
          </View>
        )}

        {/* Suggestion Bubbles */}
        {challengeObj && challengeObj.suggestions && (
          <View style={{ marginBottom: 14 }}>
            <Text style={{ color: '#1b5f52', fontFamily: fonts.semiBold, fontSize: 14, marginBottom: 6 }}>Suggestions</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
              {challengeObj.suggestions.map((s, i) => (
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
                  <Text style={{ color: '#3e8e7e', fontFamily: fonts.semiBold, fontSize: 13 }}>{s}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Journal Content */}
        <View
          style={{
            backgroundColor: '#fff',
            borderRadius: 16,
            padding: 20,
            borderWidth: 2,
            borderColor: '#D8EFD3',
            shadowColor: '#000',
            shadowOpacity: 0.08,
            shadowOffset: { width: 0, height: 2 },
            shadowRadius: 6,
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
        <View style={{ flexDirection: 'row', gap: 12, marginTop: 8 }}>
          <TouchableOpacity
            onPress={handleBack}
            style={{
              flex: 1,
              paddingVertical: 14,
              borderRadius: 999,
              borderWidth: 2,
              borderColor: '#D8EFD3',
              backgroundColor: '#fff',
              alignItems: 'center',
            }}
            disabled={saving}
          >
            <Text style={{ fontFamily: fonts.semiBold, fontSize: 15, color: '#1b5f52' }}>
              Cancel
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleSave}
            disabled={saving}
            style={{
              flex: 1,
              paddingVertical: 14,
              borderRadius: 999,
              backgroundColor: saving ? '#94A3B8' : '#55AD9B',
              alignItems: 'center',
              flexDirection: 'row',
              justifyContent: 'center',
              gap: 8,
              shadowColor: saving ? 'transparent' : '#55AD9B',
              shadowOpacity: 0.3,
              shadowOffset: { width: 0, height: 4 },
              shadowRadius: 8,
              elevation: saving ? 0 : 4,
            }}
          >
            {saving ? (
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
                  Save Changes
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Bottom Note */}
        <View style={{ alignItems: 'center', paddingVertical: 16 }}>
          <Text style={{ fontFamily: fonts.regular, fontSize: 13, color: '#6b7280', textAlign: 'center', lineHeight: 20 }}>
            Journaling regularly helps you reflect, grow, and build a mindful habit.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}