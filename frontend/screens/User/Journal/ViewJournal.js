import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { fonts } from '../../../utils/fonts/fonts';
import { journalService } from '../../../services/journalService';

export default function ViewJournal() {
  const navigation = useNavigation();
  const route = useRoute();
  const { id } = route.params || {};
  const [entry, setEntry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError('');
      try {
        const res = await journalService.getJournalEntryById(id);
        setEntry(res.entry);
      } catch (err) {
        setError('Failed to fetch journal entry.');
      }
      setLoading(false);
    })();
  }, [id]);

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
          shadowOpacity: 0.06,
          shadowOffset: { width: 0, height: 2 },
          shadowRadius: 6,
          elevation: 3,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity
            onPress={() => navigation.pop(3)}
            style={{
              padding: 8,
            }}
          >
            <Ionicons name="arrow-back" size={24} color="#55AD9B" />
          </TouchableOpacity>
          <View style={{ flex: 1, alignItems: 'center', marginRight: 40 }}>
            <Text style={{ fontFamily: fonts.bold, fontSize: 18, color: '#1b5f52' }}>
              Journal Entry
            </Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 30 }}
        showsVerticalScrollIndicator={false}
      >
        {loading && (
          <View style={{ alignItems: 'center', marginTop: 40 }}>
            <ActivityIndicator size="large" color="#55AD9B" />
            <Text style={{ color: '#888', fontSize: 16, fontFamily: fonts.semiBold, marginTop: 12 }}>Loading...</Text>
          </View>
        )}

        {error ? (
          <View style={{
            backgroundColor: '#fff',
            borderRadius: 20,
            padding: 32,
            borderWidth: 2,
            borderColor: '#FFD6E0',
            alignItems: 'center',
            marginBottom: 16,
            marginTop: 40
          }}>
            <Text style={{ color: '#e11d48', fontSize: 16, fontFamily: fonts.semiBold }}>{error}</Text>
          </View>
        ) : null}

        {!loading && entry && (
          <View style={{ gap: 18 }}>
            {/* Success Banner */}
            <View
              style={{
                backgroundColor: '#55AD9B',
                borderRadius: 16,
                padding: 18,
                shadowColor: '#55AD9B',
                shadowOpacity: 0.3,
                shadowOffset: { width: 0, height: 4 },
                shadowRadius: 8,
                elevation: 6,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View
                  style={{
                    height: 48,
                    width: 48,
                    borderRadius: 12,
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <MaterialIcons name="check-circle" size={26} color="#fff" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: fonts.bold, fontSize: 16, color: '#fff', marginBottom: 4 }}>
                    Entry Saved Successfully!
                  </Text>
                  <Text style={{ fontFamily: fonts.regular, fontSize: 13, color: 'rgba(255, 255, 255, 0.9)' }}>
                    Your journal entry has been recorded.
                  </Text>
                </View>
              </View>
            </View>

            {/* Journal Entry Card */}
            <View
              style={{
                backgroundColor: '#fff',
                borderRadius: 16,
                padding: 16,
                shadowColor: '#000',
                shadowOpacity: 0.06,
                shadowOffset: { width: 0, height: 2 },
                shadowRadius: 6,
                elevation: 3,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 14 }}>
                <View
                  style={{
                    height: 44,
                    width: 44,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons name="book" size={22} color="#55AD9B" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: fonts.bold, fontSize: 15, color: '#1b5f52', marginBottom: 6 }}>
                    Journal Content
                  </Text>
                  <Text style={{ fontFamily: fonts.regular, fontSize: 14, color: '#272829', lineHeight: 25 }}>
                    {entry.content}
                  </Text>
                </View>
              </View>

              {/* Tags */}
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                {entry.challenges && entry.challenges.length > 0 ? (
                  entry.challenges.map((challenge, idx) => (
                    <View
                      key={challenge + idx}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 5,
                        paddingHorizontal: 10,
                        paddingVertical: 5,
                        borderRadius: 20,
                        backgroundColor: 'rgba(85, 173, 155, 0.1)',
                        marginRight: 6,
                        marginBottom: 4,
                      }}
                    >
                      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#55AD9B' }} />
                      <Text style={{ fontFamily: fonts.semiBold, fontSize: 11, color: '#1b5f52' }}>
                        {challenge}
                      </Text>
                    </View>
                  ))
                ) : (
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 5,
                      paddingHorizontal: 10,
                      paddingVertical: 5,
                      borderRadius: 20,
                      backgroundColor: '#FFD6E0',
                      marginRight: 6,
                      marginBottom: 4,
                    }}
                  >
                    <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#e11d48' }} />
                    <Text style={{ fontFamily: fonts.semiBold, fontSize: 11, color: '#e11d48' }}>
                      No Category
                    </Text>
                  </View>
                )}
              </View>

              <Text style={{
                color: '#888',
                fontSize: 12,
                textAlign: 'right',
                fontFamily: fonts.regular
              }}>
                {new Date(entry.date).toLocaleString()}
              </Text>
            </View>

            {/* Action Buttons */}
            <View style={{ gap: 12, marginTop: 8 }}>
              <TouchableOpacity
                onPress={() => navigation.pop(3)}
                style={{
                  paddingVertical: 16,
                  borderRadius: 16,
                  backgroundColor: '#55AD9B',
                  alignItems: 'center',
                  shadowColor: '#55AD9B',
                  shadowOpacity: 0.3,
                  shadowOffset: { width: 0, height: 4 },
                  shadowRadius: 8,
                  elevation: 4,
                }}
              >
                <Text style={{ fontFamily: fonts.semiBold, fontSize: 15, color: '#fff' }}>
                  Back to Journal Logs
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => navigation.navigate('EditJournal', { id })}
                style={{
                  paddingVertical: 14,
                  borderRadius: 16,
                  borderWidth: 1.5,
                  borderColor: '#E5E7EB',
                  backgroundColor: '#fff',
                  alignItems: 'center',
                }}
              >
                <Text style={{ fontFamily: fonts.semiBold, fontSize: 14, color: '#1b5f52' }}>
                  Edit Entry
                </Text>
              </TouchableOpacity>
            </View>

            {/* Bottom Note */}
            <View style={{ alignItems: 'center', paddingVertical: 12 }}>
              <Text style={{ fontFamily: fonts.regular, fontSize: 12, color: '#6b7280', textAlign: 'center', lineHeight: 18 }}>
                Journaling regularly helps you reflect, grow, and build a mindful habit.
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}