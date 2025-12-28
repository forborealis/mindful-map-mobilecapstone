import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, FlatList, ActivityIndicator, Alert } from 'react-native';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { journalService } from '../../../services/journalService';
import { fonts } from '../../../utils/fonts/fonts';

// Daily inspirational quotes
const dailyQuotes = [
  // ...existing quotes...
  { quote: "Gratitude turns what we have into enough.", author: "Anonymous" },
  { quote: "Self-love is not selfish; it is necessary.", author: "Oscar Wilde" },
  { quote: "Happiness is not something ready-made. It comes from your own actions.", author: "Dalai Lama" },
  { quote: "The best and most beautiful things in the world cannot be seen or even touched - they must be felt with the heart.", author: "Helen Keller" },
  { quote: "The greatest glory in living lies not in never falling, but in rising every time we fall.", author: "Nelson Mandela" },
  { quote: "Friendship is born at that moment when one person says to another, 'What! You too? I thought I was the only one.'", author: "C.S. Lewis" },
  { quote: "Family is not an important thing. It's everything.", author: "Michael J. Fox" },
  { quote: "To love oneself is the beginning of a lifelong romance.", author: "Oscar Wilde" },
  { quote: "The purpose of our lives is to be happy.", author: "Dalai Lama" },
  { quote: "We must be willing to let go of the life we planned so as to have the life that is waiting for us.", author: "Joseph Campbell" },
  { quote: "The best way to find yourself is to lose yourself in the service of others.", author: "Mahatma Gandhi" },
  { quote: "Small acts, when multiplied by millions of people, can transform the world.", author: "Howard Zinn" },
  { quote: "The most beautiful things in life are felt with the heart.", author: "Antoine de Saint-Exupéry" },
  { quote: "Be the reason someone smiles today.", author: "Anonymous" },
  { quote: "Every day may not be good, but there's something good in every day.", author: "Alice Morse Earle" },
];

function getTodayString() {
  const today = new Date();
  return `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
}

function selectDailyQuote() {
  const now = new Date();
  const dayOfYear = Math.floor((now - new Date(now.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
  const quoteIndex = dayOfYear % dailyQuotes.length;
  return dailyQuotes[quoteIndex];
}

export default function JournalLogs() {
  const navigation = useNavigation();
  const isFocused = useIsFocused();
  const [entries, setEntries] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showQuote, setShowQuote] = useState(false);
  const [todaysQuote, setTodaysQuote] = useState(null);

  // Dropdown state
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [dropdownEntryId, setDropdownEntryId] = useState(null);

  // Month navigation
  const handlePrevMonth = () => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() - 1);
      return newDate;
    });
  };
  const handleNextMonth = () => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + 1);
      return newDate;
    });
  };

  // Filter entries by month
  const filterEntriesByMonth = (entries, date) => {
    const month = date.getMonth();
    const year = date.getFullYear();
    return entries.filter(entry => {
      const entryDate = new Date(entry.date);
      return entryDate.getMonth() === month && entryDate.getFullYear() === year;
    });
  };

  // Show daily quote if not logged today
  const shouldShowDailyQuote = (entries) => {
    const today = getTodayString();
    const hasLoggedToday = entries.some(entry => {
      const entryDate = new Date(entry.date);
      const entryDateString = `${entryDate.getFullYear()}-${entryDate.getMonth() + 1}-${entryDate.getDate()}`;
      return entryDateString === today;
    });
    return !hasLoggedToday;
  };

  // Fetch entries
  const fetchEntries = async () => {
    setLoading(true);
    const res = await journalService.getJournalEntries();
    setEntries(res.entries || []);
    setLoading(false);

    const monthEntries = filterEntriesByMonth(res.entries || [], currentDate);
    setFiltered(monthEntries);

    if (shouldShowDailyQuote(res.entries || [])) {
      setTodaysQuote(selectDailyQuote());
      setShowQuote(true);
    } else {
      setShowQuote(false);
    }
  };

  useEffect(() => {
    if (isFocused) fetchEntries();
    // eslint-disable-next-line
  }, [isFocused, currentDate]);

  useEffect(() => {
    if (search.trim() === '') {
      setFiltered(filterEntriesByMonth(entries, currentDate));
    } else {
      const monthEntries = filterEntriesByMonth(entries, currentDate);
      setFiltered(
        monthEntries.filter(e =>
          (e.challenges && e.challenges.join(' ').toLowerCase().includes(search.toLowerCase())) ||
          (e.content && e.content.toLowerCase().includes(search.toLowerCase()))
        )
      );
    }
    // eslint-disable-next-line
  }, [search, entries, currentDate]);

  // Month display
  const formattedDate = currentDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
  });

  // Delete journal entry
  const handleDelete = async (id) => {
    setDropdownVisible(false);
    Alert.alert(
      "Delete Entry",
      "Are you sure you want to delete this journal entry?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            const res = await journalService.deleteJournalEntry(id);
            if (res.success) {
              fetchEntries();
            } else {
              Alert.alert("Error", res.error || "Failed to delete entry.");
            }
          }
        }
      ]
    );
  };

  // Dropdown open handler
  const openDropdown = (id) => {
    setDropdownEntryId(id);
    setDropdownVisible(true);
  };

  // Dropdown close handler
  const closeDropdown = () => {
    setDropdownVisible(false);
    setDropdownEntryId(null);
  };

  // Render journal card
  const renderItem = ({ item }) => (
    <View
      style={{
        backgroundColor: '#fff',
        borderRadius: 18,
        padding: 18,
        marginBottom: 14,
        elevation: 2,
        borderWidth: 1,
        borderColor: '#E6F4EA',
        position: 'relative'
      }}
    >
      {/* Category/Challenge tags */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 6 }}>
        {item.challenges && item.challenges.length > 0 ? (
          item.challenges.map((challenge, idx) => (
            <View key={idx} style={{
              backgroundColor: '#d8f3dc',
              borderRadius: 16,
              paddingHorizontal: 10,
              paddingVertical: 4,
              marginRight: 6,
              marginBottom: 4
            }}>
              <Text style={{
                color: '#40916c',
                fontSize: 13,
                fontFamily: fonts.semiBold
              }}>{challenge}</Text>
            </View>
          ))
        ) : (
          <View style={{
            backgroundColor: '#ffd6e0',
            borderRadius: 16,
            paddingHorizontal: 10,
            paddingVertical: 4,
            marginRight: 6,
            marginBottom: 4
          }}>
            <Text style={{
              color: '#e11d48',
              fontSize: 13,
              fontFamily: fonts.semiBold
            }}>No Category</Text>
          </View>
        )}
      </View>
      {/* Journal content preview */}
      <TouchableOpacity
        onPress={() => navigation.navigate('ViewJournal', { id: item._id })}
        activeOpacity={0.8}
      >
        <Text style={{
          color: '#272829',
          fontSize: 15,
          marginBottom: 8,
          fontFamily: fonts.semiBold
        }} numberOfLines={3}>
          {item.content.length > 100 ? item.content.slice(0, 100) + '...' : item.content}
        </Text>
      </TouchableOpacity>
      <Text style={{
        color: '#888',
        fontSize: 12,
        textAlign: 'right',
        fontFamily: fonts.regular
      }}>
        {new Date(item.date).toLocaleString()}
      </Text>
      {/* Three dot menu */}
      <TouchableOpacity
        style={{
          position: 'absolute',
          top: 12,
          right: 12,
          padding: 8,
          borderRadius: 20,
          zIndex: 10
        }}
        onPress={() => openDropdown(item._id)}
      >
        <Ionicons name="ellipsis-vertical" size={22} color="#40916c" />
      </TouchableOpacity>
      {/* Dropdown overlay and menu */}
      {dropdownVisible && dropdownEntryId === item._id && (
        <>
          {/* Overlay */}
          <View
            style={{
              position: 'absolute',
              top: 0, left: 0, right: 0, bottom: 0,
              zIndex: 99,
            }}
            pointerEvents="box-none"
          >
            <TouchableOpacity
              style={{ flex: 1 }}
              activeOpacity={1}
              onPress={closeDropdown}
            />
          </View>
          {/* Dropdown menu */}
          <View
            style={{
              position: 'absolute',
              bottom: 48,
              right: 12,
              backgroundColor: '#fff',
              borderRadius: 12,
              elevation: 6,
              shadowColor: '#000',
              shadowOpacity: 0.12,
              shadowOffset: { width: 0, height: 2 },
              shadowRadius: 8,
              minWidth: 120,
              zIndex: 100,
              borderWidth: 1,
              borderColor: '#E6F4EA'
            }}
            pointerEvents="box-none"
          >
            <TouchableOpacity
              style={{
                paddingVertical: 12,
                paddingHorizontal: 18,
                flexDirection: 'row',
                alignItems: 'center'
              }}
              onPress={() => {
                setDropdownVisible(false);
                setTimeout(() => {
                  navigation.navigate('EditJournal', { id: item._id });
                }, 100);
              }}
            >
              <Ionicons name="create-outline" size={18} color="#40916c" style={{ marginRight: 8 }} />
              <Text style={{ color: '#40916c', fontFamily: fonts.semiBold, fontSize: 15 }}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{
                paddingVertical: 12,
                paddingHorizontal: 18,
                flexDirection: 'row',
                alignItems: 'center'
              }}
              onPress={() => {
                setDropdownVisible(false);
                setTimeout(() => {
                  handleDelete(item._id);
                }, 100);
              }}
            >
              <Ionicons name="trash-outline" size={18} color="#e11d48" style={{ marginRight: 8 }} />
              <Text style={{ color: '#e11d48', fontFamily: fonts.semiBold, fontSize: 15 }}>Delete</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{
                paddingVertical: 8,
                alignItems: 'center'
              }}
              onPress={closeDropdown}
            >
              <Text style={{ color: '#888', fontFamily: fonts.semiBold, fontSize: 13 }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );

  // Empty state
  const renderEmpty = () => (
    <View style={{
      backgroundColor: '#fff',
      borderRadius: 16,
      padding: 32,
      alignItems: 'center',
      marginTop: 40,
      marginHorizontal: 16,
      elevation: 2
    }}>
      <Text style={{ fontSize: 40, color: '#E6F4EA', marginBottom: 10 }}>📅</Text>
      <Text style={{
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 8,
        color: '#1b5f52',
        fontFamily: fonts.semiBold
      }}>No journal entries found</Text>
      <Text style={{
        color: '#888',
        marginBottom: 18,
        textAlign: 'center',
        fontFamily: fonts.semiBold
      }}>
        {search ? 'Try adjusting your search term' : 'No entries for this month. Add a new entry to get started!'}
      </Text>
      <TouchableOpacity
        style={{
          backgroundColor: '#55AD9B',
          borderRadius: 20,
          paddingHorizontal: 24,
          paddingVertical: 10
        }}
        onPress={() => navigation.navigate('JournalChallenge')}
      >
        <Text style={{
          color: 'white',
          fontWeight: 'bold',
          fontSize: 16,
          fontFamily: fonts.semiBold
        }}>+ Journal Challenge</Text>
      </TouchableOpacity>
    </View>
  );

  // Daily quote modal
  const renderQuoteModal = () => (
    showQuote && (
      <View style={{
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.25)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 100
      }}>
        <View style={{
          backgroundColor: '#fff',
          borderRadius: 20,
          padding: 28,
          width: '85%',
          alignItems: 'center',
          elevation: 5
        }}>
          <Text style={{ fontSize: 32, marginBottom: 18 }}>💡</Text>
          <Text style={{
            fontSize: 20,
            fontWeight: 'bold',
            color: '#40916c',
            marginBottom: 10,
            fontFamily: fonts.semiBold
          }}>Today's Inspiration</Text>
          <Text style={{
            fontSize: 16,
            fontStyle: 'italic',
            color: '#272829',
            marginBottom: 8,
            textAlign: 'center',
            fontFamily: fonts.semiBold
          }}>
            "{todaysQuote?.quote}"
          </Text>
          <Text style={{
            fontSize: 14,
            color: '#888',
            marginBottom: 18,
            textAlign: 'center',
            fontFamily: fonts.semiBold
          }}>
            — {todaysQuote?.author}
          </Text>
          <TouchableOpacity
            style={{
              backgroundColor: '#55AD9B',
              borderRadius: 20,
              paddingHorizontal: 28,
              paddingVertical: 10,
              marginTop: 8
            }}
            onPress={() => setShowQuote(false)}
          >
            <Text style={{
              color: 'white',
              fontSize: 16,
              fontFamily: fonts.semiBold
            }}>Start My Day</Text>
          </TouchableOpacity>
        </View>
      </View>
    )
  );

  return (
    <View style={{ flex: 1, backgroundColor: '#F1F8E8' }}>
      {/* Header */}
      <View style={{
        backgroundColor: '#fff',
        paddingVertical: 18,
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderColor: '#E6F4EA',
        justifyContent: 'space-between'
      }}>
        {/* Month navigation */}
        <TouchableOpacity onPress={handlePrevMonth} style={{ padding: 8 }}>
          <Text style={{
            fontSize: 22,
            color: '#55AD9B',
            fontFamily: fonts.semiBold
          }}>{'‹'}</Text>
        </TouchableOpacity>
        <Text style={{
          fontSize: 20,
          color: '#1b5f52',
          fontFamily: fonts.semiBold
        }}>
          {formattedDate}
        </Text>
        <TouchableOpacity onPress={handleNextMonth} style={{ padding: 8 }}>
          <Text style={{
            fontSize: 22,
            color: '#55AD9B',
            fontFamily: fonts.semiBold
          }}>{'›'}</Text>
        </TouchableOpacity>
      </View>
      {/* Search and Add */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 16,
        marginTop: 18,
        marginBottom: 8
      }}>
        <TextInput
          style={{
            flex: 1,
            backgroundColor: '#fff',
            borderRadius: 12,
            paddingHorizontal: 14,
            paddingVertical: 8,
            fontSize: 15,
            borderWidth: 1,
            borderColor: '#E6F4EA',
            marginRight: 10,
            fontFamily: fonts.semiBold
          }}
          placeholder="Search journal entries..."
          value={search}
          onChangeText={setSearch}
        />
        <TouchableOpacity
          style={{
            backgroundColor: '#55AD9B',
            borderRadius: 20,
            width: 40,
            height: 40,
            alignItems: 'center',
            justifyContent: 'center'
          }}
          onPress={() => navigation.navigate('JournalChallenge')}
        >
          <Ionicons name="add" size={28} color="white" />
        </TouchableOpacity>
      </View>
      {/* List */}
      {loading ? (
        <ActivityIndicator size="large" color="#55AD9B" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item._id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          ListEmptyComponent={renderEmpty}
        />
      )}
      {/* Daily Quote Modal */}
      {renderQuoteModal()}
    </View>
  );
}