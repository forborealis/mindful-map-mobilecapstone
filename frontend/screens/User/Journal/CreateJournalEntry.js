import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { journalService } from '../../../services/journalService';
import { fonts } from '../../../utils/fonts/fonts';

const CHALLENGES = [
  {
    key: 'gratitude',
    title: 'Gratitude',
    description: 'Reflect on and list things you are thankful for today.',
    suggestions: [
      "I'm grateful for...",
      'Today I appreciated...',
      'A small thing that made me smile was...',
    ],
  },
  {
    key: 'goal',
    title: 'Goal Setting',
    description: 'Set a meaningful goal you want to achieve soon.',
    suggestions: [
      'My goal for today is...',
      'One thing I want to accomplish is...',
      'Steps I can take to reach my goal...',
    ],
  },
  {
    key: 'reflection',
    title: 'Self Reflection',
    description: 'Look back on your experiences and what you learned.',
    suggestions: [
      'Today I learned...',
      'I noticed that...',
      'Something I could improve on is...',
    ],
  },
  {
    key: 'affirmation',
    title: 'Positive Affirmation',
    description: 'Write a positive statement to encourage yourself.',
    suggestions: [
      'I am capable of...',
      'I believe in myself because...',
      'Today I will remind myself...',
    ],
  },
  {
    key: 'highlight',
    title: 'Daily Highlights',
    description: 'Share the best moments of your day.',
    suggestions: [
      'The best part of my day was...',
      'A moment that made me happy was...',
      'Something unexpected and good happened...',
    ],
  },
  {
    key: 'problem',
    title: 'Problem Solving',
    description: 'Describe a challenge you faced and how you handled it.',
    suggestions: [
      'A challenge I faced today was...',
      'I handled it by...',
      'Next time, I might try...',
    ],
  },
  {
    key: 'free',
    title: 'Free Write',
    description: 'Express anything on your mind, no prompt needed.',
    suggestions: [
      'Today I feel...',
      "What's on my mind is...",
      'I want to talk about...',
    ],
  },
];

// Simple client-side keyword detection (same idea as web)
const TRIGGER_PATTERNS = [
  /\b(suicide|suicidal)\b/i,
  /\b(kill myself|end my life|take my life)\b/i,
  /\b(self[-\s]?harm|harm myself|hurt myself)\b/i,
  /\b(overdose|od)\b/i,
  /\b(cut myself|cutting)\b/i,
  /\b(can't go on|cannot go on|no reason to live)\b/i,
];

function findTriggerMatch(text) {
  const t = String(text || '');
  if (!t.trim()) return null;
  for (const re of TRIGGER_PATTERNS) {
    const m = t.match(re);
    if (m) return m[0];
  }
  return null;
}

function SupportModal({ visible, onClose }) {
  const [showResources, setShowResources] = useState(true);

  useEffect(() => {
    if (visible) setShowResources(true);
  }, [visible]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.4)',
          justifyContent: 'center',
          alignItems: 'center',
          paddingHorizontal: 16,
        }}
      >
        <View
          style={{
            width: '100%',
            maxWidth: 400,
            backgroundColor: '#fff',
            borderRadius: 20,
            borderWidth: 1,
            borderColor: '#E6F4EA',
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <View
            style={{
              padding: 16,
              borderBottomWidth: 1,
              borderBottomColor: '#E5E7EB',
              flexDirection: 'row',
              alignItems: 'flex-start',
            }}
          >
            <View
              style={{
                height: 44,
                width: 44,
                borderRadius: 14,
                backgroundColor: '#E6F4EA',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 10,
              }}
            >
              <MaterialIcons name="support-agent" size={24} color="#1b5f52" />
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontFamily: fonts.bold,
                  fontSize: 18,
                  color: '#1b5f52',
                }}
              >
                You’re not alone.
              </Text>
              <Text
                style={{
                  marginTop: 4,
                  fontFamily: fonts.regular,
                  fontSize: 13,
                  color: '#4b5563',
                }}
              >
                If you’re going through a hard moment, it can help to pause and
                reach out. You deserve support.
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={{
                marginLeft: 4,
                padding: 4,
                borderRadius: 999,
              }}
            >
              <Ionicons name="close" size={20} color="#64748b" />
            </TouchableOpacity>
          </View>

          {/* Body */}
          <View style={{ padding: 16 }}>
            <View
              style={{
                borderRadius: 12,
                backgroundColor: '#F7FBF9',
                borderWidth: 1,
                borderColor: '#E6F4EA',
                padding: 12,
                marginBottom: 12,
              }}
            >
              <Text
                style={{
                  fontFamily: fonts.regular,
                  fontSize: 13,
                  color: '#374151',
                  lineHeight: 18,
                }}
              >
                Consider messaging a trusted friend or family member, or talking
                with a professional. If you feel like you might be in immediate
                danger, call <Text style={{ fontFamily: fonts.semiBold }}>911</Text> right now.
              </Text>
            </View>

            <View
              style={{
                flexDirection: 'row',
                flexWrap: 'wrap',
                gap: 8,
                marginBottom: 12,
              }}
            >
              <TouchableOpacity
                onPress={() => setShowResources((s) => !s)}
                style={{
                  flexGrow: 1,
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                  borderRadius: 999,
                  borderWidth: 2,
                  borderColor: '#D8EFD3',
                  backgroundColor: '#fff',
                  alignItems: 'center',
                }}
              >
                <Text
                  style={{
                    fontFamily: fonts.semiBold,
                    fontSize: 13,
                    color: '#1b5f52',
                  }}
                >
                  {showResources ? 'Hide resources' : 'Show resources'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={onClose}
                style={{
                  flexGrow: 1,
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                  borderRadius: 999,
                  backgroundColor: '#55AD9B',
                  alignItems: 'center',
                }}
              >
                <Text
                  style={{
                    fontFamily: fonts.semiBold,
                    fontSize: 13,
                    color: '#fff',
                  }}
                >
                  I’m okay for now
                </Text>
              </TouchableOpacity>
            </View>

            {showResources && (
              <View style={{ gap: 8 }}>
                <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                  <MaterialIcons
                    name="phone-in-talk"
                    size={18}
                    color="#1b5f52"
                    style={{ marginTop: 3, marginRight: 6 }}
                  />
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontFamily: fonts.semiBold,
                        fontSize: 13,
                        color: '#1f2937',
                        marginBottom: 4,
                      }}
                    >
                      Crisis support (Philippines / Metro Manila)
                    </Text>
                    <View style={{ paddingLeft: 8 }}>
                      <Text
                        style={{
                          fontFamily: fonts.regular,
                          fontSize: 12,
                          color: '#374151',
                          marginBottom: 2,
                        }}
                      >
                        <Text style={{ fontFamily: fonts.semiBold }}>
                          Emergency:
                        </Text>{' '}
                        <Text style={{ fontFamily: fonts.semiBold }}>911</Text>
                      </Text>
                      <Text
                        style={{
                          fontFamily: fonts.regular,
                          fontSize: 12,
                          color: '#374151',
                          marginBottom: 2,
                        }}
                      >
                        <Text style={{ fontFamily: fonts.semiBold }}>
                          NCMH Crisis Hotline (Mandaluyong):
                        </Text>{' '}
                        <Text style={{ fontFamily: fonts.semiBold }}>1553</Text>{' '}
                        (landline)
                      </Text>
                      <Text
                        style={{
                          fontFamily: fonts.regular,
                          fontSize: 12,
                          color: '#374151',
                          marginBottom: 2,
                        }}
                      >
                        <Text style={{ fontFamily: fonts.semiBold }}>
                          NCMH mobile:
                        </Text>{' '}
                        <Text style={{ fontFamily: fonts.semiBold }}>
                          0917-899-8727
                        </Text>
                        {', '}
                        <Text style={{ fontFamily: fonts.semiBold }}>
                          0908-639-2672
                        </Text>
                        {', '}
                        <Text style={{ fontFamily: fonts.semiBold }}>
                          0966-351-4518
                        </Text>
                      </Text>
                      <Text
                        style={{
                          fontFamily: fonts.regular,
                          fontSize: 12,
                          color: '#374151',
                          marginBottom: 2,
                        }}
                      >
                        <Text style={{ fontFamily: fonts.semiBold }}>
                          Hopeline Philippines:
                        </Text>{' '}
                        <Text style={{ fontFamily: fonts.semiBold }}>
                          2919
                        </Text>{' '}
                        (Globe/TM) or{' '}
                        <Text style={{ fontFamily: fonts.semiBold }}>
                          0917-558-4673
                        </Text>
                      </Text>
                      <Text
                        style={{
                          fontFamily: fonts.regular,
                          fontSize: 12,
                          color: '#374151',
                        }}
                      >
                        Directory / find local help:{' '}
                        <Text
                          style={{
                            fontFamily: fonts.semiBold,
                            color: '#1b5f52',
                            textDecorationLine: 'underline',
                          }}
                        >
                          findahelpline.com
                        </Text>
                      </Text>
                    </View>
                  </View>
                </View>

                <Text
                  style={{
                    fontFamily: fonts.regular,
                    fontSize: 11,
                    color: '#6b7280',
                    marginTop: 2,
                  }}
                >
                  Numbers can change. If any line doesn’t work, try another
                  option above or dial 911. This message is shown based on
                  certain words/phrases and may not always be accurate.
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

export default function CreateJournalEntry() {
  const navigation = useNavigation();
  const route = useRoute();
  const challengeParam = route.params?.challenge;

  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);

  // Real-time support modal state
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [editVersion, setEditVersion] = useState(0);
  const [dismissedAtVersion, setDismissedAtVersion] = useState(-1);

  const triggerMatch = useMemo(() => findTriggerMatch(content), [content]);
  const hasTriggeringText = !!triggerMatch;

  // Find the selected challenge object for UI display
  const selectedChallengeObj = CHALLENGES.find(
    (c) => c.key === challengeParam?.key
  );

  // Real-time trigger detection (similar behavior to web)
  useEffect(() => {
    if (!hasTriggeringText) {
      setShowSupportModal(false);
      setDismissedAtVersion(-1);
      return;
    }
    if (editVersion > dismissedAtVersion) {
      setShowSupportModal(true);
    }
  }, [hasTriggeringText, editVersion, dismissedAtVersion]);

  const handleCloseSupportModal = () => {
    setShowSupportModal(false);
    setDismissedAtVersion(editVersion);
  };

  // Handle suggestion bubble click
  const handleSuggestion = (suggestion) => {
    setContent((prev) =>
      prev
        ? prev.trim().endsWith('.')
          ? prev + ' ' + suggestion
          : prev + '. ' + suggestion
        : suggestion
    );
    setEditVersion((v) => v + 1);
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
    const res = await journalService.createJournalEntry(
      content,
      new Date(),
      [challengeParam.title]
    );
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
      <SupportModal
        visible={showSupportModal}
        onClose={handleCloseSupportModal}
      />

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
        <View
          style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}
        >
          <TouchableOpacity
            onPress={handleBack}
            style={{
              padding: 8,
            }}
          >
            <Ionicons name="arrow-back" size={24} color="#55AD9B" />
          </TouchableOpacity>
          <View style={{ flex: 1, alignItems: 'center', marginRight: 40 }}>
            <Text
              style={{
                fontFamily: fonts.bold,
                fontSize: 18,
                color: '#1b5f52',
              }}
            >
              New Journal Entry
            </Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 20,
          paddingBottom: 30,
        }}
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
            flexDirection: 'row',
            alignItems: 'flex-start',
            gap: 8,
          }}
        >
          <MaterialIcons name="info-outline" size={22} color="#B45309" />
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontFamily: fonts.semiBold,
                fontSize: 13,
                color: '#92400e',
                lineHeight: 18,
              }}
            >
              Complete your daily challenge by reflecting and writing your
              thoughts below.
            </Text>
          </View>
        </View>

        {/* Challenge Info Card */}
        {selectedChallengeObj && (
          <View
            style={{
              backgroundColor: '#fff',
              borderRadius: 16,
              padding: 18,
              borderWidth: 1.5,
              borderColor: '#D8EFD3',
              marginBottom: 18,
              flexDirection: 'row',
              alignItems: 'flex-start',
            }}
          >
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  color: '#1b5f52',
                  fontSize: 17,
                  marginBottom: 2,
                  fontFamily: fonts.semiBold,
                  alignSelf: 'center',
                }}
              >
                {selectedChallengeObj.title}
              </Text>
              <Text
                style={{
                  color: '#272829',
                  fontSize: 14,
                  fontFamily: fonts.semiBold,
                  alignSelf: 'center',
                  textAlign: 'center',
                }}
              >
                {selectedChallengeObj.description}
              </Text>
            </View>
          </View>
        )}

        {/* Suggestion Bubbles */}
        {selectedChallengeObj && selectedChallengeObj.suggestions && (
          <View style={{ marginBottom: 14 }}>
            <Text
              style={{
                color: '#1b5f52',
                fontSize: 14,
                marginBottom: 6,
                fontFamily: fonts.semiBold,
              }}
            >
              Suggestions
            </Text>
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
                    borderColor: '#D8EFD3',
                  }}
                  onPress={() => handleSuggestion(s)}
                >
                  <Text
                    style={{
                      color: '#3e8e7e',
                      fontSize: 13,
                      fontFamily: fonts.semiBold,
                    }}
                  >
                    {s}
                  </Text>
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
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 12,
            }}
          >
            <Text
              style={{
                fontFamily: fonts.bold,
                fontSize: 16,
                color: '#1b5f52',
              }}
            >
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
              <Text
                style={{
                  fontFamily: fonts.semiBold,
                  fontSize: 10,
                  color: '#92400e',
                }}
              >
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
            onChangeText={(text) => {
              setContent(text);
              setEditVersion((v) => v + 1);
            }}
            placeholder="Write your thoughts here..."
            placeholderTextColor="#9CA3AF"
          />
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'flex-start',
              gap: 6,
            }}
          >
            <MaterialIcons name="info-outline" size={16} color="#9CA3AF" />
            <Text
              style={{
                flex: 1,
                fontFamily: fonts.semiBold,
                fontSize: 11,
                color: '#9CA3AF',
                lineHeight: 16,
              }}
            >
              You can use the suggestions above or write anything that comes to
              mind.
            </Text>
          </View>

          {/* Gentle inline hint when triggers are detected */}
          {hasTriggeringText && (
            <View
              style={{
                marginTop: 10,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: 'rgba(251,191,36,0.3)',
                backgroundColor: '#FFFBEB',
                padding: 10,
              }}
            >
              <Text
                style={{
                  fontFamily: fonts.regular,
                  fontSize: 12,
                  color: '#78350f',
                  lineHeight: 17,
                }}
              >
                If you’re feeling overwhelmed, consider taking a break and
                reaching out to someone you trust.
              </Text>
            </View>
          )}
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
                <Text
                  style={{
                    fontFamily: fonts.semiBold,
                    fontSize: 15,
                    color: '#fff',
                  }}
                >
                  Saving...
                </Text>
              </>
            ) : (
              <>
                <MaterialIcons name="send" size={18} color="#fff" />
                <Text
                  style={{
                    fontFamily: fonts.bold,
                    fontSize: 15,
                    color: '#fff',
                  }}
                >
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
            <Text
              style={{
                fontFamily: fonts.semiBold,
                fontSize: 14,
                color: '#6B7280',
              }}
            >
              Cancel
            </Text>
          </TouchableOpacity>
        </View>

        {/* Bottom Note */}
        <View style={{ alignItems: 'center', paddingVertical: 12 }}>
          <Text
            style={{
              fontFamily: fonts.regular,
              fontSize: 12,
              color: '#9CA3AF',
              textAlign: 'center',
              lineHeight: 18,
            }}
          >
            Journaling regularly helps you reflect, grow, and build a mindful
            habit.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}