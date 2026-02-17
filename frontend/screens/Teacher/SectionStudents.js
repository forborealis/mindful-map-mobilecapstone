import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  FlatList,
  RefreshControl,
  TextInput,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { fonts } from '../../utils/fonts/fonts';
import { colors } from '../../utils/colors/colors';
import { authService } from '../../services/authService';
import { downloadStudentLogsPDF } from '../../components/PDFTemplate/StudentLogsPDF';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL;
const PAGE_SIZE = 10;

const SectionStudents = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { section: paramSection } = route.params || {};
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSection, setSelectedSection] = useState(paramSection || 'All');
  const [sections, setSections] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  
  const isFetching = useRef(false);

  useEffect(() => {
    resetAndFetch();
  }, [paramSection]);

  useEffect(() => {
    applyFilters();
  }, [searchQuery, selectedSection, students]);

  const resetAndFetch = async () => {
    setLoading(true);
    setPage(1);
    setHasMore(true);
    isFetching.current = true;
    try {
      const token = await authService.getToken();

      const response = await fetch(`${API_BASE_URL}/api/teacher/students?page=1&limit=${PAGE_SIZE}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        setStudents(data.data || []);
        // Extract unique sections from the returned data
        const uniqueSections = ['All', ...new Set((data.data || []).map((s) => s.section).filter(s => s !== 'N/A'))];
        setSections(uniqueSections);
        // Use the paramSection if it was passed, otherwise use 'All'
        const sectionToFilter = paramSection || 'All';
        setSelectedSection(sectionToFilter);
        setHasMore((data.data || []).length === PAGE_SIZE);
      } else {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: data.error || data.message || 'Failed to load students',
          position: 'top',
        });
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
      setRefreshing(false);
      isFetching.current = false;
    }
  };

  const fetchMore = async () => {
    if (loadingMore || !hasMore || isFetching.current) return;
    setLoadingMore(true);
    isFetching.current = true;
    try {
      const nextPage = page + 1;
      const token = await authService.getToken();

      const response = await fetch(`${API_BASE_URL}/api/teacher/students?page=${nextPage}&limit=${PAGE_SIZE}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        const newStudents = data.data || [];
        setStudents(prev => [...prev, ...newStudents]);
        setPage(nextPage);
        setHasMore(newStudents.length === PAGE_SIZE);
      }
    } catch (error) {
      console.error('Error loading more students:', error);
    } finally {
      setLoadingMore(false);
      isFetching.current = false;
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    resetAndFetch();
  }, []);

  const applyFilters = () => {
    let filtered = students;

    if (selectedSection !== 'All') {
      filtered = filtered.filter((s) => s.section === selectedSection);
    }

    if (searchQuery.trim()) {
      filtered = filtered.filter(
        (s) =>
          s.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.email.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredStudents(filtered);
  };

  const handleSearch = (text) => {
    setSearchQuery(text);
  };

  const handleSectionFilter = (section) => {
    setSelectedSection(section);
  };

  const navigateToStudentLogs = (student) => {
    navigation.navigate('StudentLogs', { student });
  };

  const handleDownloadStudentLogs = async (student) => {
    try {
      Toast.show({
        type: 'info',
        text1: 'Generating PDF',
        text2: 'Please wait...',
        position: 'top',
      });

      const token = await authService.getToken();

      // Fetch all student logs
      const response = await fetch(`${API_BASE_URL}/api/teacher/student-mood-logs/${student._id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        // Download PDF with logs
        await downloadStudentLogsPDF(student, data.data || []);
        Toast.show({
          type: 'success',
          text1: 'PDF Downloaded',
          text2: 'Student logs downloaded successfully',
          position: 'top',
        });
      } else {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: data.error || 'Failed to load student logs',
          position: 'top',
        });
      }
    } catch (error) {
      console.error('Error downloading logs:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to download logs',
        position: 'top',
      });
    }
  };

  const renderStudentCard = ({ item }) => (
    <TouchableOpacity
      style={{
        backgroundColor: 'white',
        marginHorizontal: 16,
        marginVertical: 8,
        borderRadius: 12,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 3,
      }}
    >
      {/* Student Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
        {item.avatar ? (
          <Image
            source={{ uri: item.avatar }}
            style={{
              width: 56,
              height: 56,
              borderRadius: 28,
              marginRight: 12,
              backgroundColor: '#E0E0E0',
            }}
          />
        ) : (
          <View
            style={{
              width: 56,
              height: 56,
              borderRadius: 28,
              marginRight: 12,
              backgroundColor: colors.primary,
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Text
              style={{
                color: 'white',
                fontSize: fonts.sizes.lg,
                fontWeight: '600',
              }}
            >
              {item.firstName?.[0]?.toUpperCase()}
            </Text>
          </View>
        )}

        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontSize: fonts.sizes.md,
              fontWeight: '600',
              color: colors.text,
              marginBottom: 4,
            }}
          >
            {item.firstName} {item.lastName}
          </Text>
          <Text
            style={{
              fontSize: fonts.sizes.xs,
              color: '#666',
            }}
          >
            {item.email}
          </Text>
        </View>
      </View>

      {/* Log Counts */}
      <View
        style={{
          backgroundColor: '#F5F5F5',
          borderRadius: 8,
          padding: 12,
          marginBottom: 12,
        }}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginBottom: 8 }}>
          <View style={{ alignItems: 'center' }}>
            <Text style={{ fontSize: fonts.sizes.xs, color: '#999', marginBottom: 4 }}>
              Activity
            </Text>
            <Text style={{ fontSize: fonts.sizes.lg, fontWeight: '700', color: colors.activity }}>
              {item.moodLogCounts?.activity || 0}
            </Text>
          </View>
          <View style={{ alignItems: 'center' }}>
            <Text style={{ fontSize: fonts.sizes.xs, color: '#999', marginBottom: 4 }}>
              Social
            </Text>
            <Text style={{ fontSize: fonts.sizes.lg, fontWeight: '700', color: colors.social }}>
              {item.moodLogCounts?.social || 0}
            </Text>
          </View>
          <View style={{ alignItems: 'center' }}>
            <Text style={{ fontSize: fonts.sizes.xs, color: '#999', marginBottom: 4 }}>
              Health
            </Text>
            <Text style={{ fontSize: fonts.sizes.lg, fontWeight: '700', color: colors.health }}>
              {item.moodLogCounts?.health || 0}
            </Text>
          </View>
          <View style={{ alignItems: 'center' }}>
            <Text style={{ fontSize: fonts.sizes.xs, color: '#999', marginBottom: 4 }}>
              Sleep
            </Text>
            <Text style={{ fontSize: fonts.sizes.lg, fontWeight: '700', color: colors.sleep }}>
              {item.moodLogCounts?.sleep || 0}
            </Text>
          </View>
        </View>

        <View
          style={{
            borderTopWidth: 1,
            borderTopColor: '#DDD',
            paddingTop: 8,
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Text
            style={{
              fontSize: fonts.sizes.sm,
              fontWeight: '600',
              color: colors.text,
            }}
          >
            Total Logs
          </Text>
          <View
            style={{
              backgroundColor: colors.primary,
              borderRadius: 16,
              paddingHorizontal: 12,
              paddingVertical: 4,
            }}
          >
            <Text
              style={{
                color: 'white',
                fontSize: fonts.sizes.md,
                fontWeight: '700',
              }}
            >
              {(item.moodLogCounts?.activity || 0) +
                (item.moodLogCounts?.social || 0) +
                (item.moodLogCounts?.health || 0) +
                (item.moodLogCounts?.sleep || 0)}
            </Text>
          </View>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <TouchableOpacity
          onPress={() => navigateToStudentLogs(item)}
          style={{
            flex: 1,
            backgroundColor: colors.primary,
            borderRadius: 8,
            paddingVertical: 10,
            alignItems: 'center',
          }}
        >
          <Text
            style={{
              color: 'white',
              fontSize: fonts.sizes.sm,
              fontWeight: '600',
            }}
          >
            View Logs
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => handleDownloadStudentLogs(item)}
          style={{
            flex: 1,
            backgroundColor: colors.secondary,
            borderRadius: 8,
            paddingVertical: 10,
            alignItems: 'center',
          }}
        >
          <Text
            style={{
              color: 'white',
              fontSize: fonts.sizes.sm,
              fontWeight: '600',
            }}
          >
            Download
          </Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{ marginTop: 12, color: '#666', fontSize: fonts.sizes.sm }}>
            Loading students...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      {/* Header */}
      <View
        style={{
          paddingHorizontal: 16,
          paddingVertical: 16,
          borderBottomWidth: 1,
          borderBottomColor: '#E0E0E0',
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
          <TouchableOpacity onPress={() => navigation.openDrawer()} style={{ marginRight: 12 }}>
            <MaterialIcons name="menu" size={24} color={colors.primary} />
          </TouchableOpacity>
          <Text
            style={{
              fontSize: fonts.sizes.xl,
              fontWeight: 'bold',
              color: colors.text,
              flex: 1,
            }}
          >
            Section Students
          </Text>
        </View>

        {/* Search Bar */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: '#F5F5F5',
            borderRadius: 8,
            paddingHorizontal: 12,
            marginBottom: 12,
          }}
        >
          <MaterialIcons name="search" size={20} color="#999" />
          <TextInput
            placeholder="Search students..."
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={handleSearch}
            style={{
              flex: 1,
              paddingHorizontal: 10,
              paddingVertical: 10,
              fontSize: fonts.sizes.sm,
            }}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => handleSearch('')}>
              <MaterialIcons name="clear" size={20} color="#999" />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Section Filter */}
        <FlatList
          data={sections}
          horizontal
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => handleSectionFilter(item)}
              style={{
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderRadius: 20,
                marginRight: 8,
                backgroundColor: selectedSection === item ? colors.primary : '#E0E0E0',
              }}
            >
              <Text
                style={{
                  color: selectedSection === item ? 'white' : '#666',
                  fontSize: fonts.sizes.xs,
                  fontWeight: '600',
                }}
              >
                {item}
              </Text>
            </TouchableOpacity>
          )}
          keyExtractor={(item) => item}
          scrollEnabled={true}
          showsHorizontalScrollIndicator={false}
        />
      </View>

      {/* Students List */}
      {filteredStudents.length > 0 ? (
        <FlatList
          data={filteredStudents}
          renderItem={renderStudentCard}
          keyExtractor={(item) => item._id}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
            />
          }
          contentContainerStyle={{ paddingVertical: 8 }}
          onEndReached={fetchMore}
          onEndReachedThreshold={0.3}
          ListFooterComponent={
            loadingMore ? (
              <View style={{ padding: 18 }}>
                <ActivityIndicator color={colors.primary} size="small" />
              </View>
            ) : null
          }
        />
      ) : (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <MaterialIcons name="person-outline" size={48} color="#CCC" />
          <Text
            style={{
              marginTop: 12,
              fontSize: fonts.sizes.md,
              color: '#999',
              textAlign: 'center',
            }}
          >
            No students found
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
};

export default SectionStudents;
