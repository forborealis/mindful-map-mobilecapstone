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
  Modal,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { fonts } from '../../utils/fonts/fonts';
import { colors } from '../../utils/colors/colors';
import { authService } from '../../services/authService';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL;

const SECTIONS = [
  'St. John Paul II (STEM 1)',
  'St. Paul VI (STEM 2)',
  'St. John XXIII (STEM 3)',
  'St. Pius X (HUMSS)',
  'St. Tarcisius (ABM)',
  'St. Jose Sanchez Del Rio (ICT)',
];

const TeachersScreen = () => {
  const navigation = useNavigation();
  const [teachers, setTeachers] = useState([]);
  const [filteredTeachers, setFilteredTeachers] = useState([]);
  const [stats, setStats] = useState({
    totalTeachers: 0,
    assignedSections: [],
    unassignedSections: [],
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    middleInitial: '',
    email: '',
    subject: '',
    assignedSections: [],
    password: '',
  });
  const [validationErrors, setValidationErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFormValid, setIsFormValid] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      loadTeachers();
    }, [])
  );

  const loadTeachers = async () => {
    try {
      setLoading(true);

      const sessionResult = await authService.checkAuthStatus();

      if (!sessionResult.isAuthenticated) {
        navigation.replace('Login');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/admin/teachers`, {
        headers: {
          'Authorization': `Bearer ${sessionResult.token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch teachers');
      }

      const data = await response.json();
      if (data.success) {
        setTeachers(data.data);
        calculateStats(data.data);
        applyFiltersAndSearch(data.data, searchQuery);
      }
    } catch (error) {
      console.error('Error loading teachers:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to load teachers',
        position: 'top',
      });
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTeachers();
    setRefreshing(false);
  };

  const calculateStats = (teachersList) => {
    const assignedSections = new Set();
    teachersList.forEach(teacher => {
      if (teacher.assignedSections && teacher.assignedSections.length > 0) {
        teacher.assignedSections.forEach(section => assignedSections.add(section));
      }
    });

    const unassignedSections = SECTIONS.filter(section => !assignedSections.has(section));

    setStats({
      totalTeachers: teachersList.length,
      assignedSections: Array.from(assignedSections),
      unassignedSections: unassignedSections,
    });
  };

  const applyFiltersAndSearch = (dataSource, search) => {
    let result = [...dataSource];

    // Search filter
    if (search.trim()) {
      result = result.filter(teacher => 
        teacher.firstName?.toLowerCase().includes(search.toLowerCase()) ||
        teacher.lastName?.toLowerCase().includes(search.toLowerCase()) ||
        teacher.email?.toLowerCase().includes(search.toLowerCase()) ||
        teacher.subject?.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Sort by created date (newest first)
    result.sort((a, b) => {
      const dateA = new Date(a.createdAt);
      const dateB = new Date(b.createdAt);
      return dateB - dateA;
    });

    setFilteredTeachers(result);
  };

  const handleSearch = (text) => {
    setSearchQuery(text);
    applyFiltersAndSearch(teachers, text);
  };

  // Validation functions
  const validateFirstName = (name) => {
    if (!name || name.trim().length < 2) {
      return 'First name must be at least 2 characters';
    }
    if (!/^[a-zA-Z\s-]+$/.test(name)) {
      return 'First name can only contain letters, spaces, and hyphens';
    }
    if (name.length > 50) {
      return 'First name cannot exceed 50 characters';
    }
    return '';
  };

  const validateLastName = (name) => {
    if (!name || name.trim().length < 2) {
      return 'Last name must be at least 2 characters';
    }
    if (!/^[a-zA-Z\s-]+$/.test(name)) {
      return 'Last name can only contain letters, spaces, and hyphens';
    }
    if (name.length > 50) {
      return 'Last name cannot exceed 50 characters';
    }
    return '';
  };

  const validateMiddleInitial = (mi) => {
    if (mi && !/^[a-zA-Z.]*$/.test(mi)) {
      return 'Middle initial must contain only letters and optional period';
    }
    if (mi && mi.length > 2) {
      return 'Middle initial cannot exceed 2 characters';
    }
    return '';
  };

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      return 'Please enter a valid email address';
    }
    return '';
  };

  const validateSubject = (subject) => {
    if (!subject || subject.trim().length === 0) {
      return 'Subject is required';
    }
    if (subject.length > 50) {
      return 'Subject cannot exceed 50 characters';
    }
    return '';
  };

  const validateSections = (sections) => {
    if (!sections || sections.length === 0) {
      return 'At least one section must be assigned';
    }
    return '';
  };

  const validatePassword = (password) => {
    if (!password) {
      return 'Password is required';
    }
    if (password.length < 6) {
      return 'Password must be at least 6 characters';
    }
    return '';
  };

  const validateField = (name, value) => {
    let error = '';
    switch (name) {
      case 'firstName':
        error = validateFirstName(value);
        break;
      case 'lastName':
        error = validateLastName(value);
        break;
      case 'middleInitial':
        error = validateMiddleInitial(value);
        break;
      case 'email':
        error = validateEmail(value);
        break;
      case 'subject':
        error = validateSubject(value);
        break;
      case 'assignedSections':
        error = validateSections(value);
        break;
      case 'password':
        error = validatePassword(value);
        break;
      default:
        break;
    }
    return error;
  };

  const validateForm = () => {
    const errors = {};
    errors.firstName = validateField('firstName', formData.firstName);
    errors.lastName = validateField('lastName', formData.lastName);
    errors.middleInitial = validateField('middleInitial', formData.middleInitial);
    errors.email = validateField('email', formData.email);
    errors.subject = validateField('subject', formData.subject);
    errors.assignedSections = validateField('assignedSections', formData.assignedSections);

    setValidationErrors(errors);
    
    // Check if form is valid
    const isValid = !Object.values(errors).some(error => error !== '');
    setIsFormValid(isValid);
    
    return isValid;
  };

  const openEditModal = (teacher) => {
    setSelectedTeacher(teacher);
    setFormData({
      firstName: teacher.firstName || '',
      lastName: teacher.lastName || '',
      middleInitial: teacher.middleInitial || '',
      email: teacher.email || '',
      subject: teacher.subject || '',
      assignedSections: teacher.assignedSections || [],
    });
    setValidationErrors({});
    setIsFormValid(false);
    setEditModalVisible(true);
  };

  const closeEditModal = () => {
    setEditModalVisible(false);
    setSelectedTeacher(null);
    setFormData({
      firstName: '',
      lastName: '',
      middleInitial: '',
      email: '',
      subject: '',
      assignedSections: [],
      password: '',
    });
    setValidationErrors({});
    setShowPassword(false);
  };

  const openCreateModal = () => {
    setFormData({
      firstName: '',
      lastName: '',
      middleInitial: '',
      email: '',
      subject: '',
      assignedSections: [],
      password: '',
    });
    setValidationErrors({});
    setIsFormValid(false);
    setShowPassword(false);
    setCreateModalVisible(true);
  };

  const closeCreateModal = () => {
    setCreateModalVisible(false);
    setFormData({
      firstName: '',
      lastName: '',
      middleInitial: '',
      email: '',
      subject: '',
      assignedSections: [],
      password: '',
    });
    setValidationErrors({});
    setShowPassword(false);
  };

  const handleInputChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    
    // Validate field in real-time
    const error = validateField(name, value);
    setValidationErrors(prev => ({
      ...prev,
      [name]: error,
    }));
    
    // Update form validity immediately after validation
    setTimeout(() => {
      setFormData(prevData => {
        const updatedData = {
          ...prevData,
          [name]: value,
        };
        const errors = {
          firstName: validateField('firstName', updatedData.firstName),
          lastName: validateField('lastName', updatedData.lastName),
          middleInitial: validateField('middleInitial', updatedData.middleInitial),
          email: validateField('email', updatedData.email),
          subject: validateField('subject', updatedData.subject),
          assignedSections: validateField('assignedSections', updatedData.assignedSections),
        };
        // Include password validation only when in create mode
        if (createModalVisible) {
          errors.password = validateField('password', updatedData.password);
        }
        const isValid = !Object.values(errors).some(e => e !== '');
        setIsFormValid(isValid);
        return updatedData;
      });
    }, 0);
  };

  const handleSectionToggle = (section) => {
    setFormData(prev => {
      const sections = prev.assignedSections.includes(section)
        ? prev.assignedSections.filter(s => s !== section)
        : [...prev.assignedSections, section];
      
      // Validate sections in real-time
      const error = validateField('assignedSections', sections);
      setValidationErrors(prevErrors => ({
        ...prevErrors,
        assignedSections: error,
      }));
      
      // Update form validity
      const allErrors = {
        firstName: validationErrors.firstName || validateField('firstName', prev.firstName),
        lastName: validationErrors.lastName || validateField('lastName', prev.lastName),
        middleInitial: validationErrors.middleInitial || validateField('middleInitial', prev.middleInitial),
        email: validationErrors.email || validateField('email', prev.email),
        subject: validationErrors.subject || validateField('subject', prev.subject),
        assignedSections: error,
      };
      const isValid = !Object.values(allErrors).some(e => e !== '');
      setIsFormValid(isValid);
      
      return {
        ...prev,
        assignedSections: sections,
      };
    });
  };

  const handleCreateTeacher = async () => {
    // Validate all fields including password for create
    const errors = {
      firstName: validateField('firstName', formData.firstName),
      lastName: validateField('lastName', formData.lastName),
      middleInitial: validateField('middleInitial', formData.middleInitial),
      email: validateField('email', formData.email),
      subject: validateField('subject', formData.subject),
      assignedSections: validateField('assignedSections', formData.assignedSections),
      password: validateField('password', formData.password),
    };

    if (Object.values(errors).some(e => e !== '')) {
      setValidationErrors(errors);
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: 'Please fix all form errors',
        position: 'top',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const sessionResult = await authService.checkAuthStatus();

      const response = await fetch(`${API_BASE_URL}/api/admin/teachers`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${sessionResult.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          middleInitial: formData.middleInitial.trim(),
          email: formData.email.trim(),
          subject: formData.subject.trim(),
          assignedSections: formData.assignedSections,
          password: formData.password,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create teacher');
      }

      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Teacher created successfully',
        position: 'top',
      });

      closeCreateModal();
      await loadTeachers();
    } catch (error) {
      console.error('Error creating teacher:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message || 'Failed to create teacher',
        position: 'top',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const sessionResult = await authService.checkAuthStatus();

      const response = await fetch(`${API_BASE_URL}/api/admin/teachers/${selectedTeacher._id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${sessionResult.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          middleInitial: formData.middleInitial.trim(),
          email: formData.email.trim(),
          subject: formData.subject.trim(),
          assignedSections: formData.assignedSections,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update teacher');
      }

      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Teacher updated successfully',
        position: 'top',
      });

      closeEditModal();
      await loadTeachers();
    } catch (error) {
      console.error('Error updating teacher:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message || 'Failed to update teacher',
        position: 'top',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTeacher = (teacher) => {
    Alert.alert(
      'Delete Teacher',
      `Are you sure you want to delete ${teacher.firstName} ${teacher.lastName}?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const sessionResult = await authService.checkAuthStatus();

              const response = await fetch(`${API_BASE_URL}/api/admin/teachers/${teacher._id}`, {
                method: 'DELETE',
                headers: {
                  'Authorization': `Bearer ${sessionResult.token}`,
                  'Content-Type': 'application/json',
                },
              });

              if (!response.ok) {
                throw new Error('Failed to delete teacher');
              }

              Toast.show({
                type: 'success',
                text1: 'Success',
                text2: 'Teacher deleted successfully',
                position: 'top',
              });

              await loadTeachers();
            } catch (error) {
              console.error('Error deleting teacher:', error);
              Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'Failed to delete teacher',
                position: 'top',
              });
            }
          },
        },
      ]
    );
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

  const renderTeacherItem = ({ item }) => (
    <View
      style={{
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 12,
        marginBottom: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 3,
        elevation: 2,
      }}
    >
      {/* Header with Avatar and Name */}
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 }}>
        <View
          style={{
            width: 50,
            height: 50,
            borderRadius: 25,
            backgroundColor: '#2196F3',
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
              {item.firstName?.[0]}{item.lastName?.[0]}
            </Text>
          )}
        </View>

        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontSize: 15,
              fontWeight: '600',
              color: colors.text,
              fontFamily: fonts.semiBold,
            }}
          >
            {item.firstName} {item.lastName}
          </Text>
          <Text
            style={{
              fontSize: 12,
              color: 'rgba(0,0,0,0.6)',
              fontFamily: fonts.regular,
            }}
          >
            {item.email}
          </Text>
        </View>
      </View>

      {/* Subject Badge */}
      {item.subject && (
        <View style={{ marginBottom: 8 }}>
          <View
            style={{
              backgroundColor: 'rgba(33, 150, 243, 0.1)',
              borderRadius: 6,
              paddingHorizontal: 8,
              paddingVertical: 4,
              alignSelf: 'flex-start',
            }}
          >
            <Text
              style={{
                fontSize: 11,
                color: '#2196F3',
                fontFamily: fonts.semiBold,
              }}
            >
              {item.subject}
            </Text>
          </View>
        </View>
      )}

      {/* Assigned Sections */}
      {item.assignedSections && item.assignedSections.length > 0 && (
        <View style={{ marginBottom: 8 }}>
          <Text
            style={{
              fontSize: 11,
              color: 'rgba(0,0,0,0.5)',
              fontFamily: fonts.semiBold,
              marginBottom: 4,
            }}
          >
            Sections:
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
            {item.assignedSections.map((section, idx) => (
              <View
                key={idx}
                style={{
                  backgroundColor: 'rgba(76, 175, 80, 0.1)',
                  borderRadius: 4,
                  paddingHorizontal: 6,
                  paddingVertical: 2,
                }}
              >
                <Text
                  style={{
                    fontSize: 10,
                    color: '#4CAF50',
                    fontFamily: fonts.regular,
                  }}
                >
                  {section}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Timestamp */}
      <Text
        style={{
          fontSize: 10,
          color: 'rgba(0,0,0,0.4)',
          fontFamily: fonts.regular,
          marginBottom: 12,
        }}
      >
        {formatDate(item.createdAt)}
      </Text>

      {/* Action Buttons */}
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <TouchableOpacity
          onPress={() => openEditModal(item)}
          style={{
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(33, 150, 243, 0.1)',
            paddingVertical: 8,
            borderRadius: 6,
          }}
        >
          <MaterialIcons name="edit" size={16} color="#2196F3" />
          <Text
            style={{
              fontSize: 12,
              color: '#2196F3',
              fontFamily: fonts.semiBold,
              marginLeft: 4,
            }}
          >
            Edit
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => handleDeleteTeacher(item)}
          style={{
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(244, 67, 54, 0.1)',
            paddingVertical: 8,
            borderRadius: 6,
          }}
        >
          <MaterialIcons name="delete" size={16} color="#F44336" />
          <Text
            style={{
              fontSize: 12,
              color: '#F44336',
              fontFamily: fonts.semiBold,
              marginLeft: 4,
            }}
          >
            Delete
          </Text>
        </TouchableOpacity>
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
            Teachers
          </Text>
          <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', marginTop: 4 }}>
            Management
          </Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
          <TouchableOpacity
            onPress={() => openCreateModal()}
            style={{
              backgroundColor: 'rgba(255,255,255,0.2)',
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderRadius: 8,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <MaterialIcons name="add" size={20} color="white" />
            <Text style={{ color: 'white', fontFamily: fonts.semiBold, fontSize: 12 }}>
              Add
            </Text>
          </TouchableOpacity>
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
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Stats Section */}
        <View style={{ padding: 16 }}>
          {/* Total Teachers Card */}
          <View
            style={{
              backgroundColor: 'white',
              borderRadius: 12,
              padding: 16,
              marginBottom: 12,
              flexDirection: 'row',
              alignItems: 'center',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 3.84,
              elevation: 5,
            }}
          >
            <View
              style={{
                width: 50,
                height: 50,
                borderRadius: 25,
                backgroundColor: '#2196F3',
                justifyContent: 'center',
                alignItems: 'center',
                marginRight: 12,
              }}
            >
              <MaterialCommunityIcons name="account-tie" size={28} color="white" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, color: colors.text, fontFamily: fonts.regular }}>
                Total Teachers
              </Text>
              <Text
                style={{
                  fontSize: 28,
                  fontWeight: 'bold',
                  color: '#2196F3',
                  fontFamily: fonts.bold,
                }}
              >
                {stats.totalTeachers}
              </Text>
            </View>
          </View>

          {/* Assigned Sections Card */}
          <View
            style={{
              backgroundColor: 'white',
              borderRadius: 12,
              padding: 16,
              marginBottom: 12,
              flexDirection: 'row',
              alignItems: 'center',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 3.84,
              elevation: 5,
            }}
          >
            <View
              style={{
                width: 50,
                height: 50,
                borderRadius: 25,
                backgroundColor: '#4CAF50',
                justifyContent: 'center',
                alignItems: 'center',
                marginRight: 12,
              }}
            >
              <MaterialIcons name="assignment" size={28} color="white" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, color: colors.text, fontFamily: fonts.regular }}>
                Assigned Sections
              </Text>
              <Text
                style={{
                  fontSize: 28,
                  fontWeight: 'bold',
                  color: '#4CAF50',
                  fontFamily: fonts.bold,
                }}
              >
                {stats.assignedSections.length}
              </Text>
            </View>
          </View>

          {/* Unassigned Sections Card */}
          <View
            style={{
              backgroundColor: 'white',
              borderRadius: 12,
              padding: 16,
              marginBottom: 16,
              flexDirection: 'row',
              alignItems: 'center',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 3.84,
              elevation: 5,
            }}
          >
            <View
              style={{
                width: 50,
                height: 50,
                borderRadius: 25,
                backgroundColor: '#FF9800',
                justifyContent: 'center',
                alignItems: 'center',
                marginRight: 12,
              }}
            >
              <MaterialIcons name="assignment-late" size={28} color="white" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, color: colors.text, fontFamily: fonts.regular }}>
                Unassigned Sections
              </Text>
              <Text
                style={{
                  fontSize: 28,
                  fontWeight: 'bold',
                  color: '#FF9800',
                  fontFamily: fonts.bold,
                }}
              >
                {stats.unassignedSections.length}
              </Text>
            </View>
          </View>

          {/* Search Bar */}
          <View
            style={{
              backgroundColor: 'white',
              borderRadius: 12,
              paddingHorizontal: 12,
              paddingVertical: 8,
              marginBottom: 12,
              flexDirection: 'row',
              alignItems: 'center',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.08,
              shadowRadius: 3,
              elevation: 2,
            }}
          >
            <MaterialIcons name="search" size={20} color="rgba(0,0,0,0.5)" />
            <TextInput
              placeholder="Search by name, email, or subject..."
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

          {/* Sort */}

          {/* Teachers List */}
          {filteredTeachers.length > 0 ? (
            filteredTeachers.map((teacher) => (
              <View key={teacher._id}>
                {renderTeacherItem({ item: teacher })}
              </View>
            ))
          ) : (
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
                No teachers found
              </Text>
              <Text
                style={{
                  fontSize: 12,
                  color: 'rgba(0,0,0,0.5)',
                  fontFamily: fonts.regular,
                  marginTop: 4,
                }}
              >
                Try adjusting your search
              </Text>
            </View>
          )}

          {/* Section Assignment Section */}
          <View style={{ marginTop: 20, marginBottom: 40 }}>
            <Text
              style={{
                fontSize: 18,
                fontWeight: 'bold',
                color: colors.text,
                fontFamily: fonts.bold,
                marginBottom: 12,
              }}
            >
              Section Assignments
            </Text>
            {SECTIONS.map((section) => {
              const sectionTeachers = teachers.filter(teacher =>
                teacher.assignedSections && teacher.assignedSections.includes(section)
              );
              
              return (
                <View
                  key={section}
                  style={{
                    backgroundColor: 'white',
                    borderRadius: 12,
                    padding: 16,
                    marginBottom: 12,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.08,
                    shadowRadius: 3,
                    elevation: 2,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: '600',
                      color: colors.text,
                      fontFamily: fonts.semiBold,
                      marginBottom: 8,
                    }}
                  >
                    {section}
                  </Text>
                  
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <MaterialIcons name="check-circle" size={16} color={colors.primary} style={{ marginRight: 6 }} />
                    <Text
                      style={{
                        fontSize: 12,
                        color: colors.primary,
                        fontFamily: fonts.regular,
                        marginRight: 4,
                      }}
                    >
                      Assigned to:
                    </Text>
                    <Text
                      style={{
                        fontSize: 12,
                        fontFamily: fonts.regular,
                        color: colors.text,
                      }}
                    >
                      {sectionTeachers.length > 0
                        ? sectionTeachers.map(t => `${t.firstName} ${t.lastName}`).join(', ')
                        : 'No teachers assigned'}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>

      {/* Edit Modal */}
      <Modal
        visible={editModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={closeEditModal}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <View
            style={{
              flex: 1,
              justifyContent: 'flex-end',
            }}
          >
            <View
              style={{
                backgroundColor: 'white',
                borderTopLeftRadius: 20,
                borderTopRightRadius: 20,
                maxHeight: '90%',
              }}
            >
              {/* Modal Header */}
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingHorizontal: 16,
                  paddingVertical: 16,
                  borderBottomWidth: 1,
                  borderBottomColor: '#f0f0f0',
                }}
              >
                <Text
                  style={{
                    fontSize: 18,
                    fontWeight: 'bold',
                    color: colors.text,
                    fontFamily: fonts.bold,
                  }}
                >
                  Edit Teacher
                </Text>
                <TouchableOpacity onPress={closeEditModal}>
                  <MaterialIcons name="close" size={24} color={colors.text} />
                </TouchableOpacity>
              </View>

              {/* Modal Content */}
              <ScrollView
                showsVerticalScrollIndicator={false}
                style={{ padding: 16 }}
              >
                {/* First Name */}
                <View style={{ marginBottom: 12 }}>
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: '600',
                      color: colors.text,
                      fontFamily: fonts.semiBold,
                      marginBottom: 6,
                    }}
                  >
                    First Name
                  </Text>
                  <TextInput
                    value={formData.firstName}
                    onChangeText={(text) => handleInputChange('firstName', text)}
                    placeholder="Enter first name"
                    style={{
                      borderWidth: 1,
                      borderColor: validationErrors.firstName ? '#F44336' : '#ddd',
                      borderRadius: 8,
                      paddingHorizontal: 12,
                      paddingVertical: 10,
                      fontSize: 14,
                      fontFamily: fonts.regular,
                      color: colors.text,
                    }}
                  />
                  {validationErrors.firstName && (
                    <Text style={{ color: '#F44336', fontSize: 12, marginTop: 4, fontFamily: fonts.regular }}>
                      {validationErrors.firstName}
                    </Text>
                  )}
                </View>

                {/* Last Name */}
                <View style={{ marginBottom: 12 }}>
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: '600',
                      color: colors.text,
                      fontFamily: fonts.semiBold,
                      marginBottom: 6,
                    }}
                  >
                    Last Name
                  </Text>
                  <TextInput
                    value={formData.lastName}
                    onChangeText={(text) => handleInputChange('lastName', text)}
                    placeholder="Enter last name"
                    style={{
                      borderWidth: 1,
                      borderColor: validationErrors.lastName ? '#F44336' : '#ddd',
                      borderRadius: 8,
                      paddingHorizontal: 12,
                      paddingVertical: 10,
                      fontSize: 14,
                      fontFamily: fonts.regular,
                      color: colors.text,
                    }}
                  />
                  {validationErrors.lastName && (
                    <Text style={{ color: '#F44336', fontSize: 12, marginTop: 4, fontFamily: fonts.regular }}>
                      {validationErrors.lastName}
                    </Text>
                  )}
                </View>

                {/* Middle Initial */}
                <View style={{ marginBottom: 12 }}>
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: '600',
                      color: colors.text,
                      fontFamily: fonts.semiBold,
                      marginBottom: 6,
                    }}
                  >
                    Middle Initial (Optional)
                  </Text>
                  <TextInput
                    value={formData.middleInitial}
                    onChangeText={(text) => handleInputChange('middleInitial', text)}
                    placeholder="e.g., M"
                    maxLength={2}
                    style={{
                      borderWidth: 1,
                      borderColor: validationErrors.middleInitial ? '#F44336' : '#ddd',
                      borderRadius: 8,
                      paddingHorizontal: 12,
                      paddingVertical: 10,
                      fontSize: 14,
                      fontFamily: fonts.regular,
                      color: colors.text,
                    }}
                  />
                  {validationErrors.middleInitial && (
                    <Text style={{ color: '#F44336', fontSize: 12, marginTop: 4, fontFamily: fonts.regular }}>
                      {validationErrors.middleInitial}
                    </Text>
                  )}
                </View>

                {/* Email */}
                <View style={{ marginBottom: 12 }}>
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: '600',
                      color: colors.text,
                      fontFamily: fonts.semiBold,
                      marginBottom: 6,
                    }}
                  >
                    Email
                  </Text>
                  <TextInput
                    value={formData.email}
                    onChangeText={(text) => handleInputChange('email', text)}
                    placeholder="Enter email"
                    keyboardType="email-address"
                    editable={false}
                    style={{
                      borderWidth: 1,
                      borderColor: validationErrors.email ? '#F44336' : '#ddd',
                      borderRadius: 8,
                      paddingHorizontal: 12,
                      paddingVertical: 10,
                      fontSize: 14,
                      fontFamily: fonts.regular,
                      color: colors.text,
                      backgroundColor: '#f5f5f5',
                    }}
                  />
                  <Text style={{ color: 'rgba(0,0,0,0.5)', fontSize: 11, marginTop: 4, fontFamily: fonts.regular }}>
                    Email cannot be changed
                  </Text>
                </View>

                {/* Subject */}
                <View style={{ marginBottom: 12 }}>
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: '600',
                      color: colors.text,
                      fontFamily: fonts.semiBold,
                      marginBottom: 6,
                    }}
                  >
                    Subject
                  </Text>
                  <TextInput
                    value={formData.subject}
                    onChangeText={(text) => handleInputChange('subject', text)}
                    placeholder="Enter subject"
                    style={{
                      borderWidth: 1,
                      borderColor: validationErrors.subject ? '#F44336' : '#ddd',
                      borderRadius: 8,
                      paddingHorizontal: 12,
                      paddingVertical: 10,
                      fontSize: 14,
                      fontFamily: fonts.regular,
                      color: colors.text,
                    }}
                  />
                  {validationErrors.subject && (
                    <Text style={{ color: '#F44336', fontSize: 12, marginTop: 4, fontFamily: fonts.regular }}>
                      {validationErrors.subject}
                    </Text>
                  )}
                </View>

                {/* Assigned Sections */}
                <View style={{ marginBottom: 16 }}>
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: '600',
                      color: colors.text,
                      fontFamily: fonts.semiBold,
                      marginBottom: 8,
                    }}
                  >
                    Assign Sections
                  </Text>
                  {SECTIONS.map((section) => (
                    <TouchableOpacity
                      key={section}
                      onPress={() => handleSectionToggle(section)}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        paddingVertical: 10,
                        paddingHorizontal: 12,
                        backgroundColor: formData.assignedSections.includes(section)
                          ? 'rgba(33, 150, 243, 0.1)'
                          : '#f9f9f9',
                        borderRadius: 8,
                        marginBottom: 6,
                        borderWidth: formData.assignedSections.includes(section) ? 2 : 1,
                        borderColor: formData.assignedSections.includes(section)
                          ? '#2196F3'
                          : '#ddd',
                      }}
                    >
                      <MaterialIcons
                        name={formData.assignedSections.includes(section) ? 'check-box' : 'check-box-outline-blank'}
                        size={20}
                        color={formData.assignedSections.includes(section) ? '#2196F3' : '#ccc'}
                        style={{ marginRight: 8 }}
                      />
                      <Text
                        style={{
                          fontSize: 13,
                          color: colors.text,
                          fontFamily: fonts.regular,
                          flex: 1,
                        }}
                      >
                        {section}
                      </Text>
                    </TouchableOpacity>
                  ))}
                  {validationErrors.assignedSections && (
                    <Text style={{ color: '#F44336', fontSize: 12, marginTop: 4, fontFamily: fonts.regular }}>
                      {validationErrors.assignedSections}
                    </Text>
                  )}
                </View>

                {/* Submit Button */}
                <TouchableOpacity
                  onPress={handleEditSubmit}
                  disabled={isSubmitting || !isFormValid}
                  style={{
                    backgroundColor: isFormValid && !isSubmitting ? colors.primary : '#ccc',
                    paddingVertical: 14,
                    borderRadius: 8,
                    alignItems: 'center',
                    marginBottom: 12,
                    opacity: isSubmitting ? 0.6 : 1,
                  }}
                >
                  <Text
                    style={{
                      color: 'white',
                      fontSize: 16,
                      fontWeight: 'bold',
                      fontFamily: fonts.bold,
                    }}
                  >
                    {isSubmitting ? 'Saving...' : 'Save Changes'}
                  </Text>
                </TouchableOpacity>

                {/* Cancel Button */}
                <TouchableOpacity
                  onPress={closeEditModal}
                  disabled={isSubmitting}
                  style={{
                    backgroundColor: '#f0f0f0',
                    paddingVertical: 14,
                    borderRadius: 8,
                    alignItems: 'center',
                    marginBottom: 20,
                  }}
                >
                  <Text
                    style={{
                      color: colors.text,
                      fontSize: 16,
                      fontWeight: 'bold',
                      fontFamily: fonts.bold,
                    }}
                  >
                    Cancel
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Create Teacher Modal */}
      <Modal
        visible={createModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={closeCreateModal}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <View
            style={{
              flex: 1,
              justifyContent: 'flex-end',
            }}
          >
            <View
              style={{
                backgroundColor: 'white',
                borderTopLeftRadius: 20,
                borderTopRightRadius: 20,
                maxHeight: '90%',
              }}
            >
              {/* Header */}
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingHorizontal: 16,
                  paddingVertical: 16,
                  borderBottomWidth: 1,
                  borderBottomColor: '#f0f0f0',
                }}
              >
                <Text
                  style={{
                    fontSize: 18,
                    fontWeight: 'bold',
                    color: colors.text,
                    fontFamily: fonts.bold,
                  }}
                >
                  Add Teacher
                </Text>
                <TouchableOpacity onPress={closeCreateModal}>
                  <MaterialIcons name="close" size={24} color={colors.text} />
                </TouchableOpacity>
              </View>

              {/* Form Content */}
              <ScrollView
                showsVerticalScrollIndicator={false}
                style={{ padding: 16 }}
              >
                {/* First Name */}
                <View style={{ marginBottom: 12 }}>
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: '600',
                      color: colors.text,
                      fontFamily: fonts.semiBold,
                      marginBottom: 6,
                    }}
                  >
                    First Name
                  </Text>
                  <TextInput
                    value={formData.firstName}
                    onChangeText={(text) => handleInputChange('firstName', text)}
                    placeholder="Enter first name"
                    style={{
                      borderWidth: 1,
                      borderColor: validationErrors.firstName ? '#F44336' : '#ddd',
                      borderRadius: 8,
                      paddingHorizontal: 12,
                      paddingVertical: 10,
                      fontSize: 14,
                      fontFamily: fonts.regular,
                      color: colors.text,
                    }}
                  />
                  {validationErrors.firstName && (
                    <Text style={{ color: '#F44336', fontSize: 12, marginTop: 4, fontFamily: fonts.regular }}>
                      {validationErrors.firstName}
                    </Text>
                  )}
                </View>

                {/* Last Name */}
                <View style={{ marginBottom: 12 }}>
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: '600',
                      color: colors.text,
                      fontFamily: fonts.semiBold,
                      marginBottom: 6,
                    }}
                  >
                    Last Name
                  </Text>
                  <TextInput
                    value={formData.lastName}
                    onChangeText={(text) => handleInputChange('lastName', text)}
                    placeholder="Enter last name"
                    style={{
                      borderWidth: 1,
                      borderColor: validationErrors.lastName ? '#F44336' : '#ddd',
                      borderRadius: 8,
                      paddingHorizontal: 12,
                      paddingVertical: 10,
                      fontSize: 14,
                      fontFamily: fonts.regular,
                      color: colors.text,
                    }}
                  />
                  {validationErrors.lastName && (
                    <Text style={{ color: '#F44336', fontSize: 12, marginTop: 4, fontFamily: fonts.regular }}>
                      {validationErrors.lastName}
                    </Text>
                  )}
                </View>

                {/* Middle Initial */}
                <View style={{ marginBottom: 12 }}>
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: '600',
                      color: colors.text,
                      fontFamily: fonts.semiBold,
                      marginBottom: 6,
                    }}
                  >
                    Middle Initial (Optional)
                  </Text>
                  <TextInput
                    value={formData.middleInitial}
                    onChangeText={(text) => handleInputChange('middleInitial', text)}
                    placeholder="e.g., M"
                    maxLength={2}
                    style={{
                      borderWidth: 1,
                      borderColor: validationErrors.middleInitial ? '#F44336' : '#ddd',
                      borderRadius: 8,
                      paddingHorizontal: 12,
                      paddingVertical: 10,
                      fontSize: 14,
                      fontFamily: fonts.regular,
                      color: colors.text,
                    }}
                  />
                  {validationErrors.middleInitial && (
                    <Text style={{ color: '#F44336', fontSize: 12, marginTop: 4, fontFamily: fonts.regular }}>
                      {validationErrors.middleInitial}
                    </Text>
                  )}
                </View>

                {/* Email */}
                <View style={{ marginBottom: 12 }}>
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: '600',
                      color: colors.text,
                      fontFamily: fonts.semiBold,
                      marginBottom: 6,
                    }}
                  >
                    Email
                  </Text>
                  <TextInput
                    value={formData.email}
                    onChangeText={(text) => handleInputChange('email', text)}
                    placeholder="Enter email"
                    keyboardType="email-address"
                    style={{
                      borderWidth: 1,
                      borderColor: validationErrors.email ? '#F44336' : '#ddd',
                      borderRadius: 8,
                      paddingHorizontal: 12,
                      paddingVertical: 10,
                      fontSize: 14,
                      fontFamily: fonts.regular,
                      color: colors.text,
                    }}
                  />
                  {validationErrors.email && (
                    <Text style={{ color: '#F44336', fontSize: 12, marginTop: 4, fontFamily: fonts.regular }}>
                      {validationErrors.email}
                    </Text>
                  )}
                </View>

                {/* Subject */}
                <View style={{ marginBottom: 12 }}>
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: '600',
                      color: colors.text,
                      fontFamily: fonts.semiBold,
                      marginBottom: 6,
                    }}
                  >
                    Subject
                  </Text>
                  <TextInput
                    value={formData.subject}
                    onChangeText={(text) => handleInputChange('subject', text)}
                    placeholder="Enter subject"
                    style={{
                      borderWidth: 1,
                      borderColor: validationErrors.subject ? '#F44336' : '#ddd',
                      borderRadius: 8,
                      paddingHorizontal: 12,
                      paddingVertical: 10,
                      fontSize: 14,
                      fontFamily: fonts.regular,
                      color: colors.text,
                    }}
                  />
                  {validationErrors.subject && (
                    <Text style={{ color: '#F44336', fontSize: 12, marginTop: 4, fontFamily: fonts.regular }}>
                      {validationErrors.subject}
                    </Text>
                  )}
                </View>

                {/* Password */}
                <View style={{ marginBottom: 12 }}>
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: '600',
                      color: colors.text,
                      fontFamily: fonts.semiBold,
                      marginBottom: 6,
                    }}
                  >
                    Password
                  </Text>
                  <View style={{ position: 'relative' }}>
                    <TextInput
                      value={formData.password}
                      onChangeText={(text) => handleInputChange('password', text)}
                      placeholder="Enter password"
                      secureTextEntry={!showPassword}
                      style={{
                        borderWidth: 1,
                        borderColor: validationErrors.password ? '#F44336' : '#ddd',
                        borderRadius: 8,
                        paddingHorizontal: 12,
                        paddingVertical: 10,
                        fontSize: 14,
                        fontFamily: fonts.regular,
                        color: colors.text,
                        paddingRight: 40,
                      }}
                    />
                    <TouchableOpacity
                      onPress={() => setShowPassword(!showPassword)}
                      style={{
                        position: 'absolute',
                        right: 12,
                        top: '50%',
                        marginTop: -12,
                      }}
                    >
                      <MaterialIcons
                        name={showPassword ? 'visibility' : 'visibility-off'}
                        size={20}
                        color="rgba(0,0,0,0.5)"
                      />
                    </TouchableOpacity>
                  </View>
                  {validationErrors.password && (
                    <Text style={{ color: '#F44336', fontSize: 12, marginTop: 4, fontFamily: fonts.regular }}>
                      {validationErrors.password}
                    </Text>
                  )}
                </View>

                {/* Assigned Sections */}
                <View style={{ marginBottom: 16 }}>
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: '600',
                      color: colors.text,
                      fontFamily: fonts.semiBold,
                      marginBottom: 8,
                    }}
                  >
                    Assign Sections
                  </Text>
                  {SECTIONS.map((section) => (
                    <TouchableOpacity
                      key={section}
                      onPress={() => handleSectionToggle(section)}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        paddingVertical: 10,
                        paddingHorizontal: 12,
                        backgroundColor: formData.assignedSections.includes(section)
                          ? 'rgba(33, 150, 243, 0.1)'
                          : '#f9f9f9',
                        borderRadius: 8,
                        marginBottom: 6,
                        borderWidth: formData.assignedSections.includes(section) ? 2 : 1,
                        borderColor: formData.assignedSections.includes(section)
                          ? '#2196F3'
                          : '#ddd',
                      }}
                    >
                      <MaterialIcons
                        name={formData.assignedSections.includes(section) ? 'check-box' : 'check-box-outline-blank'}
                        size={20}
                        color={formData.assignedSections.includes(section) ? '#2196F3' : '#ccc'}
                        style={{ marginRight: 8 }}
                      />
                      <Text
                        style={{
                          fontSize: 13,
                          color: colors.text,
                          fontFamily: fonts.regular,
                          flex: 1,
                        }}
                      >
                        {section}
                      </Text>
                    </TouchableOpacity>
                  ))}
                  {validationErrors.assignedSections && (
                    <Text style={{ color: '#F44336', fontSize: 12, marginTop: 4, fontFamily: fonts.regular }}>
                      {validationErrors.assignedSections}
                    </Text>
                  )}
                </View>

                {/* Submit Button */}
                <TouchableOpacity
                  onPress={handleCreateTeacher}
                  disabled={isSubmitting || !isFormValid}
                  style={{
                    backgroundColor: isFormValid && !isSubmitting ? colors.primary : '#ccc',
                    paddingVertical: 14,
                    borderRadius: 8,
                    alignItems: 'center',
                    marginBottom: 12,
                    opacity: isSubmitting ? 0.6 : 1,
                  }}
                >
                  <Text
                    style={{
                      color: 'white',
                      fontSize: 16,
                      fontWeight: 'bold',
                      fontFamily: fonts.bold,
                    }}
                  >
                    {isSubmitting ? 'Creating...' : 'Create Teacher'}
                  </Text>
                </TouchableOpacity>

                {/* Cancel Button */}
                <TouchableOpacity
                  onPress={closeCreateModal}
                  disabled={isSubmitting}
                  style={{
                    backgroundColor: '#f0f0f0',
                    paddingVertical: 14,
                    borderRadius: 8,
                    alignItems: 'center',
                    marginBottom: 20,
                  }}
                >
                  <Text
                    style={{
                      color: colors.text,
                      fontSize: 16,
                      fontWeight: 'bold',
                      fontFamily: fonts.bold,
                    }}
                  >
                    Cancel
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

export default TeachersScreen;
