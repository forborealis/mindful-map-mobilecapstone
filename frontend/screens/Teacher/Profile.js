import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  ScrollView,
  TextInput,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { fonts } from '../../utils/fonts/fonts';
import { colors } from '../../utils/colors/colors';
import { authService } from '../../services/authService';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5001';

const TeacherProfile = () => {
  const navigation = useNavigation();

  const [teacher, setTeacher] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    subject: '',
    assignedSections: [],
    avatar: '',
  });

  const [editFormData, setEditFormData] = useState({ ...formData });

  useEffect(() => {
    loadTeacherProfile();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      loadTeacherProfile();
    }, [])
  );

  const loadTeacherProfile = async () => {
    try {
      setLoading(true);
      const user = await authService.getCurrentUser();
      const token = await authService.getToken();

      const response = await fetch(`${API_BASE_URL}/api/teacher/profile`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        setTeacher(data.data);
        setFormData({
          firstName: data.data.firstName || '',
          lastName: data.data.lastName || '',
          email: data.data.email || '',
          subject: data.data.subject || '',
          assignedSections: data.data.assignedSections || [],
          avatar: data.data.avatar || '',
        });
        setEditFormData({
          firstName: data.data.firstName || '',
          lastName: data.data.lastName || '',
          email: data.data.email || '',
          subject: data.data.subject || '',
          assignedSections: data.data.assignedSections || [],
          avatar: data.data.avatar || '',
        });
      } else {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: data.error || 'Failed to load profile',
          position: 'top',
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to load profile',
        position: 'top',
      });
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.cancelled && result.assets && result.assets.length > 0) {
        const imageUri = result.assets[0].uri;
        setEditFormData({ ...editFormData, avatar: imageUri });
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to pick image',
        position: 'top',
      });
    }
  };

  const handleSaveProfile = async () => {
    if (!editFormData.firstName.trim() || !editFormData.lastName.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'First name and last name are required',
        position: 'top',
      });
      return;
    }

    try {
      setUploading(true);
      const token = await authService.getToken();

      let formDataToSend = new FormData();
      formDataToSend.append('firstName', editFormData.firstName);
      formDataToSend.append('lastName', editFormData.lastName);
      formDataToSend.append('subject', editFormData.subject);

      // Handle avatar upload if it's a new image
      if (
        editFormData.avatar &&
        editFormData.avatar.startsWith('file://') &&
        editFormData.avatar !== formData.avatar
      ) {
        formDataToSend.append('avatar', {
          uri: editFormData.avatar,
          type: 'image/jpeg',
          name: 'avatar.jpg',
        });
      }

      const response = await fetch(`${API_BASE_URL}/api/teacher/profile`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formDataToSend,
      });

      const data = await response.json();

      if (data.success) {
        // Update stored user data with new profile info
        // Preserve avatarPublicId from current teacher if not in response
        const updatedUser = {
          ...teacher,
          firstName: data.data.firstName,
          lastName: data.data.lastName,
          subject: data.data.subject,
          avatar: data.data.avatar,
          avatarPublicId: data.data.avatarPublicId || teacher.avatarPublicId,
          assignedSections: data.data.assignedSections,
        };
        
        // Save updated user to AsyncStorage
        await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
        
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: 'Profile updated successfully',
          position: 'top',
        });
        setFormData(editFormData);
        setEditing(false);
        loadTeacherProfile();
      } else {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: data.error || 'Failed to update profile',
          position: 'top',
        });
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to update profile',
        position: 'top',
      });
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{ marginTop: 12, color: '#666', fontSize: fonts.sizes.sm }}>
            Loading profile...
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
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
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
            Profile
          </Text>
          {!editing && (
            <TouchableOpacity
              onPress={() => {
                setEditing(true);
                setEditFormData({ ...formData });
              }}
            >
              <MaterialIcons name="edit" size={24} color={colors.primary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingVertical: 16 }} showsVerticalScrollIndicator={false}>
        {/* Avatar Section */}
        <View style={{ alignItems: 'center', marginBottom: 24 }}>
          <TouchableOpacity
            onPress={() => editing && pickImage()}
            disabled={!editing}
            style={{ position: 'relative' }}
          >
            {editFormData.avatar ? (
              <Image
                source={{ uri: editFormData.avatar }}
                style={{
                  width: 120,
                  height: 120,
                  borderRadius: 60,
                  backgroundColor: '#E0E0E0',
                }}
              />
            ) : (
              <View
                style={{
                  width: 120,
                  height: 120,
                  borderRadius: 60,
                  backgroundColor: colors.primary,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <Text
                  style={{
                    color: 'white',
                    fontSize: 40,
                    fontWeight: '700',
                  }}
                >
                  {formData.firstName?.[0]?.toUpperCase()}
                </Text>
              </View>
            )}

            {editing && (
              <View
                style={{
                  position: 'absolute',
                  bottom: 0,
                  right: 0,
                  backgroundColor: colors.primary,
                  borderRadius: 20,
                  padding: 8,
                }}
              >
                <MaterialIcons name="camera-alt" size={16} color="white" />
              </View>
            )}
          </TouchableOpacity>
          {uploading && (
            <ActivityIndicator
              size="small"
              color={colors.primary}
              style={{ position: 'absolute', bottom: 0 }}
            />
          )}
        </View>

        {/* Profile Information */}
        <View style={{ paddingHorizontal: 16, marginBottom: 24 }}>
          {/* First Name */}
          <View style={{ marginBottom: 16 }}>
            <Text style={{ fontSize: fonts.sizes.sm, color: '#999', marginBottom: 8, fontWeight: '600' }}>
              First Name
            </Text>
            <TextInput
              editable={editing}
              value={editFormData.firstName}
              onChangeText={(text) => setEditFormData({ ...editFormData, firstName: text })}
              style={{
                borderWidth: 1,
                borderColor: editing ? colors.primary : '#E0E0E0',
                borderRadius: 8,
                paddingHorizontal: 12,
                paddingVertical: 10,
                fontSize: fonts.sizes.sm,
                backgroundColor: editing ? 'white' : '#F5F5F5',
                color: colors.text,
              }}
              placeholderTextColor="#999"
            />
          </View>

          {/* Last Name */}
          <View style={{ marginBottom: 16 }}>
            <Text style={{ fontSize: fonts.sizes.sm, color: '#999', marginBottom: 8, fontWeight: '600' }}>
              Last Name
            </Text>
            <TextInput
              editable={editing}
              value={editFormData.lastName}
              onChangeText={(text) => setEditFormData({ ...editFormData, lastName: text })}
              style={{
                borderWidth: 1,
                borderColor: editing ? colors.primary : '#E0E0E0',
                borderRadius: 8,
                paddingHorizontal: 12,
                paddingVertical: 10,
                fontSize: fonts.sizes.sm,
                backgroundColor: editing ? 'white' : '#F5F5F5',
                color: colors.text,
              }}
              placeholderTextColor="#999"
            />
          </View>

          {/* Email */}
          <View style={{ marginBottom: 16 }}>
            <Text style={{ fontSize: fonts.sizes.sm, color: '#999', marginBottom: 8, fontWeight: '600' }}>
              Email
            </Text>
            <TextInput
              editable={false}
              value={editFormData.email}
              style={{
                borderWidth: 1,
                borderColor: '#E0E0E0',
                borderRadius: 8,
                paddingHorizontal: 12,
                paddingVertical: 10,
                fontSize: fonts.sizes.sm,
                backgroundColor: '#F5F5F5',
                color: '#999',
              }}
              placeholderTextColor="#999"
            />
          </View>

          {/* Subject */}
          <View style={{ marginBottom: 16 }}>
            <Text style={{ fontSize: fonts.sizes.sm, color: '#999', marginBottom: 8, fontWeight: '600' }}>
              Subject
            </Text>
            <TextInput
              editable={editing}
              value={editFormData.subject}
              onChangeText={(text) => setEditFormData({ ...editFormData, subject: text })}
              style={{
                borderWidth: 1,
                borderColor: editing ? colors.primary : '#E0E0E0',
                borderRadius: 8,
                paddingHorizontal: 12,
                paddingVertical: 10,
                fontSize: fonts.sizes.sm,
                backgroundColor: editing ? 'white' : '#F5F5F5',
                color: colors.text,
              }}
              placeholder="Enter your subject"
              placeholderTextColor="#999"
            />
          </View>

          {/* Assigned Sections */}
          {editFormData.assignedSections && editFormData.assignedSections.length > 0 && (
            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: fonts.sizes.sm, color: '#999', marginBottom: 8, fontWeight: '600' }}>
                Assigned Sections
              </Text>
              <View
                style={{
                  backgroundColor: '#F5F5F5',
                  borderRadius: 8,
                  padding: 12,
                }}
              >
                {editFormData.assignedSections.map((section, index) => (
                  <Text
                    key={index}
                    style={{
                      fontSize: fonts.sizes.sm,
                      color: colors.text,
                      marginBottom: index < editFormData.assignedSections.length - 1 ? 8 : 0,
                    }}
                  >
                    • {section}
                  </Text>
                ))}
              </View>
            </View>
          )}
        </View>

        {/* Action Buttons */}
        {editing && (
          <View style={{ paddingHorizontal: 16, gap: 12 }}>
            <TouchableOpacity
              onPress={handleSaveProfile}
              disabled={uploading}
              style={{
                backgroundColor: colors.primary,
                borderRadius: 8,
                paddingVertical: 14,
                alignItems: 'center',
              }}
            >
              {uploading ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text
                  style={{
                    color: 'white',
                    fontSize: fonts.sizes.md,
                    fontWeight: '600',
                  }}
                >
                  Save Changes
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                setEditing(false);
                setEditFormData({ ...formData });
              }}
              style={{
                backgroundColor: '#E0E0E0',
                borderRadius: 8,
                paddingVertical: 14,
                alignItems: 'center',
              }}
            >
              <Text
                style={{
                  color: colors.text,
                  fontSize: fonts.sizes.md,
                  fontWeight: '600',
                }}
              >
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default TeacherProfile;
