import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  FlatList,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { fonts } from '../../utils/fonts/fonts';
import { colors } from '../../utils/colors/colors';
import { authService } from '../../services/authService';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5001';

const StudentsScreen = () => {
  const navigation = useNavigation();
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSection, setSelectedSection] = useState('all');
  const [sortOrder, setSortOrder] = useState('newest'); // 'newest' or 'oldest'

  useFocusEffect(
    React.useCallback(() => {
      loadStudents();
    }, [])
  );

  const loadStudents = async () => {
    try {
      setLoading(true);

      const sessionResult = await authService.checkAuthStatus();

      if (!sessionResult.isAuthenticated) {
        navigation.replace('Login');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/admin/students`, {
        headers: {
          'Authorization': `Bearer ${sessionResult.token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch students');
      }

      const data = await response.json();
      if (data.success) {
        setStudents(data.data);
        
        // Extract unique sections
        const uniqueSections = [...new Set(data.data.map(s => s.section).filter(Boolean))].sort();
        setSections(uniqueSections);

        // Apply filters and search
        applyFiltersAndSearch(data.data, searchQuery, selectedSection, sortOrder);
      }
    } catch (error) {
      console.error('Error loading students:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to load students',
        position: 'top',
      });
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadStudents();
    setRefreshing(false);
  };

  const applyFiltersAndSearch = (dataSource, search, section, sort) => {
    let result = [...dataSource];

    // Search filter
    if (search.trim()) {
      result = result.filter(student => 
        student.firstName?.toLowerCase().includes(search.toLowerCase()) ||
        student.lastName?.toLowerCase().includes(search.toLowerCase()) ||
        student.email?.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Section filter
    if (section !== 'all') {
      result = result.filter(student => student.section === section);
    }

    // Sort by created date
    result.sort((a, b) => {
      const dateA = new Date(a.createdAt);
      const dateB = new Date(b.createdAt);
      return sort === 'newest' ? dateB - dateA : dateA - dateB;
    });

    setFilteredStudents(result);
  };

  const handleSearch = (text) => {
    setSearchQuery(text);
    applyFiltersAndSearch(students, text, selectedSection, sortOrder);
  };

  const handleSectionFilter = (section) => {
    setSelectedSection(section);
    applyFiltersAndSearch(students, searchQuery, section, sortOrder);
  };

  const handleSortToggle = () => {
    const newSort = sortOrder === 'newest' ? 'oldest' : 'newest';
    setSortOrder(newSort);
    applyFiltersAndSearch(students, searchQuery, selectedSection, newSort);
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getInitials = (firstName, lastName) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  };

  const renderStudentItem = ({ item }) => (
    <View
      style={{
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 12,
        marginBottom: 8,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 3,
        elevation: 2,
      }}
    >
      {/* Avatar */}
      <View
        style={{
          width: 50,
          height: 50,
          borderRadius: 25,
          backgroundColor: colors.primary,
          justifyContent: 'center',
          alignItems: 'center',
          marginRight: 12,
          overflow: 'hidden',
        }}
      >
        {item.avatar ? (
          <Image
            source={{ uri: item.avatar }}
            style={{ width: '100%', height: '100%' }}
          />
        ) : (
          <Text
            style={{
              fontSize: 18,
              fontWeight: 'bold',
              color: 'white',
              fontFamily: fonts.bold,
            }}
          >
            {getInitials(item.firstName, item.lastName)}
          </Text>
        )}
      </View>

      {/* Student Info */}
      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontSize: 15,
            fontWeight: '600',
            color: colors.text,
            fontFamily: fonts.semiBold,
            marginBottom: 2,
          }}
        >
          {item.firstName} {item.lastName}
        </Text>
        <Text
          style={{
            fontSize: 12,
            color: 'rgba(0,0,0,0.6)',
            fontFamily: fonts.regular,
            marginBottom: 4,
          }}
        >
          {item.email}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
          {item.section && (
            <View
              style={{
                backgroundColor: 'rgba(52, 152, 219, 0.1)',
                borderRadius: 6,
                paddingHorizontal: 8,
                paddingVertical: 2,
                marginRight: 8,
              }}
            >
              <Text
                style={{
                  fontSize: 11,
                  color: colors.primary,
                  fontFamily: fonts.semiBold,
                }}
              >
                {item.section}
              </Text>
            </View>
          )}
          <View
            style={{
              backgroundColor: item.isActive ? 'rgba(76, 175, 80, 0.1)' : 'rgba(255, 152, 0, 0.1)',
              borderRadius: 6,
              paddingHorizontal: 8,
              paddingVertical: 2,
            }}
          >
            <Text
              style={{
                fontSize: 11,
                color: item.isActive ? '#4CAF50' : '#FF9800',
                fontFamily: fonts.semiBold,
              }}
            >
              {item.isActive ? 'Active' : 'Inactive'}
            </Text>
          </View>
        </View>
        <Text
          style={{
            fontSize: 10,
            color: 'rgba(0,0,0,0.4)',
            fontFamily: fonts.regular,
          }}
        >
          {formatDate(item.createdAt)}
        </Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <StatusBar barStyle="light-content" backgroundColor={colors.primary} />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />

      {/* Header */}
      <View
        style={{
          backgroundColor: colors.primary,
          paddingHorizontal: 16,
          paddingVertical: 16,
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <View>
          <Text
            style={{
              fontSize: 24,
              fontWeight: 'bold',
              color: 'white',
              fontFamily: fonts.bold,
            }}
          >
            Students
          </Text>
          <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', marginTop: 4 }}>
            {filteredStudents.length} student{filteredStudents.length !== 1 ? 's' : ''}
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => navigation.toggleDrawer()}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: 'rgba(255,255,255,0.2)',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <MaterialIcons name="menu" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View
        style={{
          backgroundColor: 'white',
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderBottomWidth: 1,
          borderBottomColor: '#f0f0f0',
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: '#f5f5f5',
            borderRadius: 8,
            paddingHorizontal: 12,
            paddingVertical: 8,
          }}
        >
          <MaterialIcons name="search" size={20} color="rgba(0,0,0,0.5)" />
          <TextInput
            placeholder="Search by name or email..."
            placeholderTextColor="rgba(0,0,0,0.4)"
            value={searchQuery}
            onChangeText={handleSearch}
            style={{
              flex: 1,
              marginLeft: 8,
              fontSize: 14,
              fontFamily: fonts.regular,
              color: colors.text,
            }}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => handleSearch('')}>
              <MaterialIcons name="close" size={18} color="rgba(0,0,0,0.5)" />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Filters and Sort */}
      <View
        style={{
          backgroundColor: 'white',
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderBottomWidth: 1,
          borderBottomColor: '#f0f0f0',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {/* Section Filter */}
        <ScrollView 
          horizontal showsHorizontalScrollIndicator={false}
          style={{ marginRight: 10 }}
        >
          <TouchableOpacity
            onPress={() => handleSectionFilter('all')}
            style={{
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 20,
              backgroundColor: selectedSection === 'all' ? colors.primary : '#f0f0f0',
              marginRight: 8,
            }}
          >
            <Text
              style={{
                fontSize: 12,
                fontFamily: fonts.semiBold,
                color: selectedSection === 'all' ? 'white' : colors.text,
              }}
            >
              All Sections
            </Text>
          </TouchableOpacity>
          {sections.map((section) => (
            <TouchableOpacity
              key={section}
              onPress={() => handleSectionFilter(section)}
              style={{
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 20,
                backgroundColor: selectedSection === section ? colors.primary : '#f0f0f0',
                marginRight: 8,
              }}
            >
              <Text
                style={{
                  fontSize: 12,
                  fontFamily: fonts.semiBold,
                  color: selectedSection === section ? 'white' : colors.text,
                }}
              >
                {section}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Sort Toggle */}
        <TouchableOpacity
          onPress={handleSortToggle}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 8,
            backgroundColor: '#f0f0f0',
            marginLeft: 8,
          }}
        >
          <MaterialIcons
            name={sortOrder === 'newest' ? 'arrow-downward' : 'arrow-upward'}
            size={14}
            color={colors.primary}
          />
          <Text
            style={{
              fontSize: 12,
              fontFamily: fonts.semiBold,
              color: colors.primary,
              marginLeft: 4,
            }}
          >
            {sortOrder === 'newest' ? 'Newest' : 'Oldest'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Students List */}
      <FlatList
        data={filteredStudents}
        renderItem={renderStudentItem}
        keyExtractor={(item) => item._id}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingVertical: 12,
        }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyState={
          <View style={{ alignItems: 'center', paddingVertical: 40 }}>
            <MaterialCommunityIcons name="account-search" size={48} color="rgba(0,0,0,0.3)" />
            <Text
              style={{
                fontSize: 16,
                color: colors.text,
                fontFamily: fonts.semiBold,
                marginTop: 12,
              }}
            >
              No students found
            </Text>
            <Text
              style={{
                fontSize: 12,
                color: 'rgba(0,0,0,0.5)',
                fontFamily: fonts.regular,
                marginTop: 4,
              }}
            >
              Try adjusting your filters or search
            </Text>
          </View>
        }
        scrollEnabled={true}
      />
    </SafeAreaView>
  );
};

export default StudentsScreen;
