import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StatusBar,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Linking
} from 'react-native';
import { Formik } from 'formik';
import * as Yup from 'yup';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { fonts } from '../utils/fonts/fonts';
import { colors } from '../utils/colors/colors';
import { useNavigation } from '@react-navigation/native';
import { authService } from '../services/authService';
import 'expo-dev-client';

const SignupSchema = Yup.object().shape({
  firstName: Yup.string()
    .min(2, 'First name must be at least 2 characters')
    .matches(/^[A-Za-z\s\-']+$/, 'First name can only contain letters, spaces, hyphens, and apostrophes')
    .required('First name is required'),
  middleInitial: Yup.string()
    .max(1, 'Middle initial must be 1 character')
    .matches(/^[A-Za-z]$/, 'Middle initial can only be a letter')
    .optional(),
  lastName: Yup.string()  
    .min(2, 'Last name must be at least 2 characters')
    .matches(/^[A-Za-z\s\-']+$/, 'Last name can only contain letters, spaces, hyphens, and apostrophes')
    .required('Last name is required'),
  gender: Yup.string()
    .required('Please select your gender'),
  section: Yup.string()
    .required('Please select your section'),
  email: Yup.string()
    .email('Please enter a valid email address')
    .required('Email is required'),
  password: Yup.string()
    .min(6, 'Password must be at least 6 characters')
    .required('Password is required'),
});

export default function Signup() {
  const [showGenderDropdown, setShowGenderDropdown] = useState(false);
  const [showSectionDropdown, setShowSectionDropdown] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [avatarUri, setAvatarUri] = useState(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false); 
  
  const navigation = useNavigation();

  const genderOptions = ['Male', 'Female', 'Rather not say'];
  const sectionOptions = ['Grade 11 - A', 'Grade 11 - B', 'Grade 11 - C', 'Grade 11 - D'];

  // Request camera permissions
  const requestCameraPermission = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      
      if (status === 'granted') {
        return true;
      } else if (status === 'denied') {
        Alert.alert(
          'Camera Permission Denied',
          'Camera access is required to take photos. Please enable it in your device settings.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => Linking.openSettings() }
          ]
        );
        return false;
      } else {
        Alert.alert(
          'Camera Permission Required',
          'This app needs camera access to let you take profile pictures.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Grant Access', onPress: async () => {
              const { status: newStatus } = await ImagePicker.requestCameraPermissionsAsync();
              return newStatus === 'granted';
            }}
          ]
        );
        return false;
      }
    } catch (error) {
      console.error('Camera permission error:', error);
      return false;
    }
  };

  // Request media library permissions
  const requestMediaLibraryPermission = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status === 'granted') {
        return true;
      } else if (status === 'denied') {
        Alert.alert(
          'Photo Library Permission Denied',
          'Photo library access is required to select images. Please enable it in your device settings.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => Linking.openSettings() }
          ]
        );
        return false;
      } else {
        Alert.alert(
          'Photo Library Permission Required',
          'This app needs photo library access to let you select profile pictures.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Grant Access', onPress: async () => {
              const { status: newStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
              return newStatus === 'granted';
            }}
          ]
        );
        return false;
      }
    } catch (error) {
      console.error('Media library permission error:', error);
      return false;
    }
  };

  // Handle avatar selection
  const handleAvatarSelection = () => {
    Alert.alert(
      'Select Profile Picture',
      'How would you like to add your profile picture?',
      [
        {
          text: 'Take Photo',
          onPress: takePhotoWithCamera,
          style: 'default'
        },
        {
          text: 'Choose from Library',
          onPress: selectFromLibrary,
          style: 'default'
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ],
      { 
        cancelable: true,
        userInterfaceStyle: 'light'
      }
    );
  };

const takePhotoWithCamera = async () => {
  try {
    const { status } = await ImagePicker.getCameraPermissionsAsync();
    
    let hasPermission = status === 'granted';
    
    if (!hasPermission) {
      hasPermission = await requestCameraPermission();
    }
    
    if (!hasPermission) {
      console.log('❌ Camera permission not granted');
      return;
    }

    console.log('📷 Launching camera...');
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: 'images',
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
      presentationStyle: 'pageSheet', 
      showsCropButton: true, 
    });

    console.log('📷 Camera result:', result);

    if (!result.canceled && result.assets && result.assets[0]) {
      const selectedImage = result.assets[0];
      console.log('✅ Photo taken successfully:', selectedImage.uri);
      setAvatarUri(selectedImage.uri);
      
      Toast.show({
        type: 'success',
        text1: 'Photo Captured!',
        text2: 'Your photo has been selected.',
        position: 'top',
        visibilityTime: 2000,
      });
    } else {
      console.log('📷 Camera canceled or no image selected');
    }
  } catch (error) {
    console.error('❌ Camera error:', error);
    Toast.show({
      type: 'error',
      text1: 'Camera Error',
      text2: 'Failed to take photo. Please try again.',
      position: 'top',
      visibilityTime: 3000,
    });
  }
};

const selectFromLibrary = async () => {
  try {
    const { status } = await ImagePicker.getMediaLibraryPermissionsAsync();
    
    let hasPermission = status === 'granted';
    
    if (!hasPermission) {
      hasPermission = await requestMediaLibraryPermission();
    }
    
    if (!hasPermission) {
      console.log('❌ Media library permission not granted');
      return;
    }

    console.log('📁 Launching image picker...');
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
      presentationStyle: 'pageSheet', 
      showsCropButton: true, 
    });

    console.log('📁 Library result:', result);

    if (!result.canceled && result.assets && result.assets[0]) {
      const selectedImage = result.assets[0];
      console.log('✅ Image selected successfully:', selectedImage.uri);
      setAvatarUri(selectedImage.uri);
      
      Toast.show({
        type: 'success',
        text1: 'Image Selected!',
        text2: 'Your image has been selected.',
        position: 'top',
        visibilityTime: 2000,
      });
    } else {
      console.log('📁 Library canceled or no image selected');
    }
  } catch (error) {
    console.error('❌ Image picker error:', error);
    Toast.show({
      type: 'error',
      text1: 'Image Selection Error',
      text2: 'Failed to select image. Please try again.',
      position: 'top',
      visibilityTime: 3000,
    });
  }
};

  const removeAvatar = () => {
    Alert.alert(
      'Remove Avatar',
      'Are you sure you want to remove the selected avatar?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => setAvatarUri(null),
        },
      ]
    );
  };


  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      console.log('🔍 Starting Google Sign-Up...');
      
      const result = await authService.signInWithGoogle();
      
      if (result.success) {
        Toast.show({
          type: 'success',
          text1: result.isNewUser ? 'Welcome to Mindful Map!' : 'Welcome back!',
          text2: `Hello ${result.user.firstName}! 👋`,
          position: 'top',
          visibilityTime: 3000,
        });

        console.log('✅ Google sign-up successful:', result.user.email);

        setTimeout(() => {
          navigation.replace('Home');
        }, 1000);
        
      } else {
        console.log('❌ Google sign-up failed:', result.error);
        

        if (result.error === 'Sign-in was cancelled') {
          console.log('🚫 User cancelled Google Sign-Up');
          return; 
        }
        
        Toast.show({
          type: 'error',
          text1: 'Google Sign-Up Failed',
          text2: result.error || 'Unable to sign up with Google',
          position: 'top',
          visibilityTime: 4000,
        });
      }
    } catch (error) {
      console.error('❌ Google sign-up error:', error);

      if (error.message && (
          error.message.includes('cancelled') || 
          error.message.includes('SIGN_IN_CANCELLED') ||
          error.message.includes('No user data received from Google')
        )) {
        console.log('🚫 User cancelled Google Sign-Up (caught in catch)');
        return;
      }
      
      Toast.show({
        type: 'error',
        text1: 'Google Sign-Up Error',
        text2: 'An unexpected error occurred',
        position: 'top',
        visibilityTime: 4000,
      });
    } finally {
      setGoogleLoading(false);
    }
  };


  const handleSignup = async (values) => {
    setLoading(true);

    try {
      console.log('📝 Attempting signup for:', values.email);
      
      const result = await authService.register(values, avatarUri);

      if (result.success) {
        Toast.show({
          type: 'success',
          text1: 'Account Created!',
          text2: `Welcome ${result.user.firstName}! 🎉`,
          position: 'top',
          visibilityTime: 3000,
        });

        setTimeout(() => {
          navigation.replace('Home');
        }, 1000);

      } else {
        let errorMessage = result.error || 'Registration failed';
        
        if (errorMessage.includes('email') && errorMessage.includes('exists')) {
          Toast.show({
            type: 'error',
            text1: 'Email Already Exists',
            text2: 'An account with this email already exists.',
            position: 'top',
            visibilityTime: 4000,
          });
        } else if (errorMessage.includes('password')) {
          Toast.show({
            type: 'error',
            text1: 'Password Too Short',
            text2: 'Password must be at least 6 characters long.',
            position: 'top',
            visibilityTime: 4000,
          });
        } else {
          Toast.show({
            type: 'error',
            text1: 'Registration Failed',
            text2: errorMessage,
            position: 'top',
            visibilityTime: 4000,
          });
        }
      }
    } catch (error) {
      console.error('❌ Signup error:', error);
      Toast.show({
        type: 'error',
        text1: 'Connection Error',
        text2: 'Please check your internet connection and try again.',
        position: 'top',
        visibilityTime: 4000,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Formik
      initialValues={{
        firstName: '',
        middleInitial: '',
        lastName: '',
        gender: '',
        section: '',
        email: '',
        password: '',
      }}
      validationSchema={SignupSchema}
      onSubmit={handleSignup}
    >
      {({ handleChange, handleBlur, handleSubmit, values, errors, touched, setFieldValue, isValid }) => (
        <KeyboardAvoidingView 
          style={{ flex: 1 }} 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView
            style={{ flex: 1, backgroundColor: colors.background }}
            contentContainerStyle={{ 
              flexGrow: 1,
              paddingBottom: 100  
            }}
            showsVerticalScrollIndicator={false}
          >
            <StatusBar backgroundColor={colors.accent} barStyle="dark-content" />
            
            <View className="flex-1 px-8 pt-20">
              {/* Logo */}
              <View className="items-center mb-8">
                <TouchableOpacity 
                  onPress={() => navigation.navigate('Landing')}
                  disabled={loading || googleLoading}
                  style={{ opacity: (loading || googleLoading) ? 0.5 : 1 }}
                >
                  <Image
                    source={require('../assets/images/login/logo.png')}
                    style={{
                      width: 150,
                      height: 150,
                      resizeMode: 'contain',
                      marginBottom: 20,
                    }}
                  />
                </TouchableOpacity>
                
                <Text 
                  className="text-3xl font-semibold text-center"
                  style={{ fontFamily: fonts.semiBold, color: colors.text }}
                >
                  Create your account
                </Text>
              </View>

              {/* Input Fields */}
              <View className="mb-4">
                <View className="flex-row mb-4" style={{ gap: 8 }}>
                  <View className="flex-1">
                    <TextInput
                      placeholder="First Name"
                      value={values.firstName}
                      onChangeText={handleChange('firstName')}
                      onBlur={handleBlur('firstName')}
                      editable={!loading && !googleLoading}
                      className="px-4 py-4 rounded-xl border-2"
                      style={{
                        fontFamily: fonts.regular,
                        fontSize: 16,
                        backgroundColor: colors.background,
                        borderColor: (touched.firstName && errors.firstName) ? '#FF6B6B' : colors.primary,
                        color: colors.text,
                      }}
                      placeholderTextColor={colors.text + '80'}
                    />
                    {touched.firstName && errors.firstName && (
                      <Text style={{ 
                        fontFamily: fonts.regular, 
                        fontSize: 12, 
                        color: '#FF6B6B', 
                        marginTop: 4, 
                        marginLeft: 4 
                      }}>
                        {errors.firstName}
                      </Text>
                    )}
                  </View>
                  
                  <View style={{ width: 60 }}>
                    <TextInput
                      placeholder="M.I"
                      value={values.middleInitial}
                      onChangeText={handleChange('middleInitial')}
                      onBlur={handleBlur('middleInitial')}
                      maxLength={1}
                      editable={!loading && !googleLoading}
                      className="px-2 py-4 rounded-xl border-2 text-center"
                      style={{
                        fontFamily: fonts.regular,
                        fontSize: 16,
                        backgroundColor: colors.background,
                        borderColor: (touched.middleInitial && errors.middleInitial) ? '#FF6B6B' : colors.primary,
                        color: colors.text,
                        textAlign: 'center',
                      }}
                      placeholderTextColor={colors.text + '80'}
                    />
                    {touched.middleInitial && errors.middleInitial && (
                      <Text style={{ 
                        fontFamily: fonts.regular, 
                        fontSize: 12, 
                        color: '#FF6B6B', 
                        marginTop: 4, 
                        marginLeft: 4 
                      }}>
                        {errors.middleInitial}
                      </Text>
                    )}
                  </View>
                  
                  <View className="flex-1">
                    <TextInput
                      placeholder="Last Name"
                      value={values.lastName}
                      onChangeText={handleChange('lastName')}
                      onBlur={handleBlur('lastName')}
                      editable={!loading && !googleLoading}
                      className="px-4 py-4 rounded-xl border-2"
                      style={{
                        fontFamily: fonts.regular,
                        fontSize: 16,
                        backgroundColor: colors.background,
                        borderColor: (touched.lastName && errors.lastName) ? '#FF6B6B' : colors.primary,
                        color: colors.text,
                      }}
                      placeholderTextColor={colors.text + '80'}
                    />
                    {touched.lastName && errors.lastName && (
                      <Text style={{ 
                        fontFamily: fonts.regular, 
                        fontSize: 12, 
                        color: '#FF6B6B', 
                        marginTop: 4, 
                        marginLeft: 4 
                      }}>
                        {errors.lastName}
                      </Text>
                    )}
                  </View>
                </View>

                <View className="mb-4" style={{ position: 'relative', zIndex: 20 }}>
                  <TouchableOpacity
                    onPress={() => {
                      if (!loading && !googleLoading) {
                        setShowGenderDropdown(!showGenderDropdown);
                        setShowSectionDropdown(false);
                      }
                    }}
                    className="px-4 py-4 rounded-xl border-2 flex-row justify-between items-center"
                    style={{
                      backgroundColor: colors.background,
                      borderColor: (touched.gender && errors.gender) ? '#FF6B6B' : colors.primary,
                      opacity: (loading || googleLoading) ? 0.5 : 1,
                    }}
                  >
                    <Text
                      style={{
                        fontFamily: fonts.regular,
                        fontSize: 16,
                        color: values.gender ? colors.text : colors.text + '80',
                      }}
                    >
                      {values.gender || 'Select Gender'}
                    </Text>
                    <Text style={{ color: colors.text }}>{showGenderDropdown ? '▲' : '▼'}</Text>
                  </TouchableOpacity>
                  
                  {showGenderDropdown && (
                    <View
                      className="absolute top-full left-0 right-0 rounded-xl border-2 mt-1"
                      style={{
                        backgroundColor: colors.background,
                        borderColor: colors.primary,
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.25,
                        shadowRadius: 3.84,
                        elevation: 5,
                        zIndex: 30,
                      }}
                    >
                      {genderOptions.map((option, index) => (
                        <TouchableOpacity
                          key={index}
                          className="px-4 py-3"
                          style={{
                            borderBottomWidth: index < genderOptions.length - 1 ? 1 : 0,
                            borderBottomColor: colors.primary + '20',
                          }}
                          onPress={() => {
                            setFieldValue('gender', option);
                            setShowGenderDropdown(false);
                          }}
                        >
                          <Text
                            style={{ fontFamily: fonts.regular, color: colors.text }}
                          >
                            {option}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                  {touched.gender && errors.gender && (
                    <Text style={{ 
                      fontFamily: fonts.regular, 
                      fontSize: 12, 
                      color: '#FF6B6B', 
                      marginTop: 4, 
                      marginLeft: 4 
                    }}>
                      {errors.gender}
                    </Text>
                  )}
                </View>

                <View className="mb-4" style={{ position: 'relative', zIndex: 10 }}>
                  <TouchableOpacity
                    onPress={() => {
                      if (!loading && !googleLoading) {
                        setShowSectionDropdown(!showSectionDropdown);
                        setShowGenderDropdown(false);
                      }
                    }}
                    className="px-4 py-4 rounded-xl border-2 flex-row justify-between items-center"
                    style={{
                      backgroundColor: colors.background,
                      borderColor: (touched.section && errors.section) ? '#FF6B6B' : colors.primary,
                      opacity: (loading || googleLoading) ? 0.5 : 1,
                    }}
                  >
                    <Text
                      style={{
                        fontFamily: fonts.regular,
                        fontSize: 16,
                        color: values.section ? colors.text : colors.text + '80',
                      }}
                    >
                      {values.section || 'Select Section'}
                    </Text>
                    <Text style={{ color: colors.text }}>{showSectionDropdown ? '▲' : '▼'}</Text>
                  </TouchableOpacity>
                  
                  {showSectionDropdown && (
                    <View
                      className="absolute top-full left-0 right-0 rounded-xl border-2 mt-1"
                      style={{
                        backgroundColor: colors.background,
                        borderColor: colors.primary,
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.25,
                        shadowRadius: 3.84,
                        elevation: 5,
                        zIndex: 20,
                      }}
                    >
                      {sectionOptions.map((option, index) => (
                        <TouchableOpacity
                          key={index}
                          className="px-4 py-3"
                          style={{
                            borderBottomWidth: index < sectionOptions.length - 1 ? 1 : 0,
                            borderBottomColor: colors.primary + '20',
                          }}
                          onPress={() => {
                            setFieldValue('section', option);
                            setShowSectionDropdown(false);
                          }}
                        >
                          <Text
                            style={{ fontFamily: fonts.regular, color: colors.text }}
                          >
                            {option}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                  {touched.section && errors.section && (
                    <Text style={{ 
                      fontFamily: fonts.regular, 
                      fontSize: 12, 
                      color: '#FF6B6B', 
                      marginTop: 4, 
                      marginLeft: 4 
                    }}>
                      {errors.section}
                    </Text>
                  )}
                </View>

                <View className="mb-4">
                  <TextInput
                    placeholder="Email"
                    value={values.email}
                    onChangeText={handleChange('email')}
                    onBlur={handleBlur('email')}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!loading && !googleLoading}
                    className="px-4 py-4 rounded-xl border-2"
                    style={{
                      fontFamily: fonts.regular,
                      fontSize: 16,
                      backgroundColor: colors.background,
                      borderColor: (touched.email && errors.email) ? '#FF6B6B' : colors.primary,
                      color: colors.text,
                    }}
                    placeholderTextColor={colors.text + '80'}
                  />
                  {touched.email && errors.email && (
                    <Text style={{ 
                      fontFamily: fonts.regular, 
                      fontSize: 12, 
                      color: '#FF6B6B', 
                      marginTop: 4, 
                      marginLeft: 4 
                    }}>
                      {errors.email}
                    </Text>
                  )}
                </View>

                <View className="mb-4">
                  <View className="relative">
                    <TextInput
                      placeholder="Password"
                      value={values.password}
                      onChangeText={handleChange('password')}
                      onBlur={handleBlur('password')}
                      secureTextEntry={!showPassword}
                      editable={!loading && !googleLoading}
                      className="px-4 py-4 pr-12 rounded-xl border-2"
                      style={{
                        fontFamily: fonts.regular,
                        fontSize: 16,
                        backgroundColor: colors.background,
                        borderColor: (touched.password && errors.password) ? '#FF6B6B' : colors.primary,
                        color: colors.text,
                      }}
                      placeholderTextColor={colors.text + '80'}
                    />
                    
                    <TouchableOpacity
                      onPress={togglePasswordVisibility}
                      disabled={loading || googleLoading}
                      style={{
                        position: 'absolute',
                        right: 12,
                        top: 0,
                        bottom: 0,
                        justifyContent: 'center',
                        alignItems: 'center',
                        width: 24,
                        height: '100%',
                      }}
                    >
                      <Ionicons
                        name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                        size={20}
                        color={(loading || googleLoading) ? colors.text + '50' : colors.text + '70'}
                      />
                    </TouchableOpacity>
                  </View>
                  
                  {touched.password && errors.password && (
                    <Text style={{ 
                      fontFamily: fonts.regular, 
                      fontSize: 12, 
                      color: '#FF6B6B', 
                      marginTop: 4, 
                      marginLeft: 4 
                    }}>
                      {errors.password}
                    </Text>
                  )}
                </View>

                <View className="mb-4">
                  {avatarUri ? (
                    <View className="items-center">
                      <View className="relative">
                        <Image
                          source={{ uri: avatarUri }}
                          style={{
                            width: 100,
                            height: 100,
                            borderRadius: 50,
                            marginBottom: 12,
                          }}
                        />
                        <TouchableOpacity
                          onPress={removeAvatar}
                          disabled={loading || googleLoading}
                          style={{
                            position: 'absolute',
                            top: -5,
                            right: -5,
                            backgroundColor: '#FF6B6B',
                            borderRadius: 15,
                            width: 30,
                            height: 30,
                            justifyContent: 'center',
                            alignItems: 'center',
                          }}
                        >
                          <Ionicons name="close" size={16} color="white" />
                        </TouchableOpacity>
                      </View>
                      <TouchableOpacity
                        onPress={handleAvatarSelection}
                        disabled={loading || googleLoading}
                        className="py-2 px-4 rounded-lg"
                        style={{
                          backgroundColor: colors.primary + '20',
                          opacity: (loading || googleLoading) ? 0.5 : 1,
                        }}
                      >
                        <Text
                          style={{ 
                            fontFamily: fonts.medium, 
                            color: colors.primary, 
                            fontSize: 14 
                          }}
                        >
                          Change Avatar
                        </Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <TouchableOpacity
                      onPress={handleAvatarSelection}
                      disabled={loading || googleLoading}
                      className="py-4 rounded-xl items-center border-2 border-dashed"
                      style={{
                        backgroundColor: colors.accent,
                        borderColor: colors.primary,
                        opacity: (loading || googleLoading) ? 0.5 : 1,
                      }}
                    >
                      <Ionicons 
                        name="camera-outline" 
                        size={24} 
                        color={colors.primary} 
                        style={{ marginBottom: 8 }}
                      />
                      <Text
                        className="text-base font-medium"
                        style={{ fontFamily: fonts.medium, color: colors.primary }}
                      >
                        Upload Avatar
                      </Text>
                      <Text
                        className="text-sm mt-2"
                        style={{ 
                          fontFamily: fonts.regular, 
                          color: colors.text + '70',
                          textAlign: 'center'
                        }}
                      >
                        Take a photo or choose from gallery
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              <View className="mb-8">
                <TouchableOpacity
                  className="py-4 rounded-xl items-center mb-4"
                  style={{
                    backgroundColor: (loading || googleLoading) ? colors.primary + '70' : colors.primary,
                    shadowColor: colors.primary,
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.3,
                    shadowRadius: 8,
                    elevation: 6,
                  }}
                  onPress={handleSubmit}
                  disabled={loading || googleLoading || !isValid}
                >
                  {loading ? (
                    <View className="flex-row items-center">
                      <ActivityIndicator size="small" color={colors.white} style={{ marginRight: 8 }} />
                      <Text
                        className="text-lg font-semibold"
                        style={{ fontFamily: fonts.semiBold, color: colors.white }}
                      >
                        Creating Account...
                      </Text>
                    </View>
                  ) : (
                    <Text
                      className="text-lg font-semibold"
                      style={{ fontFamily: fonts.semiBold, color: colors.background }}
                    >
                      Sign Up
                    </Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  className="py-4 rounded-xl items-center flex-row justify-center border-2"
                  style={{
                    backgroundColor: colors.white,
                    borderColor: colors.primary + '30',
                    opacity: (loading || googleLoading) ? 0.5 : 1,
                  }}
                  disabled={loading || googleLoading}
                  onPress={handleGoogleSignIn}
                >
                  {googleLoading ? (
                    <View className="flex-row items-center">
                      <ActivityIndicator size="small" color={colors.primary} style={{ marginRight: 8 }} />
                      <Text
                        className="text-base font-semibold"
                        style={{ fontFamily: fonts.semiBold, color: colors.text }}
                      >
                        Signing up with Google...
                      </Text>
                    </View>
                  ) : (
                    <>
                      <Image
                        source={require('../assets/images/login/google.png')}
                        style={{
                          width: 25,
                          height: 25,
                          marginRight: 12,
                        }}
                      />
                      <Text
                        className="text-lg font-semibold"
                        style={{ fontFamily: fonts.semiBold, color: colors.text }}
                      >
                        Sign up with Google
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>

              <View className="items-center" style={{ marginBottom: 80 }}>
                <View className="flex-row items-center">
                  <Text
                    className="text-lg"
                    style={{ fontFamily: fonts.regular, color: colors.text }}
                  >
                    Already have an account?{' '} 
                  </Text>
                  <TouchableOpacity 
                    onPress={() => navigation.navigate('Login')}
                    disabled={loading || googleLoading}
                  >
                    <Text
                      className="text-lg font-semibold"
                      style={{ 
                        fontFamily: fonts.semiBold, 
                        color: (loading || googleLoading) ? colors.primary + '50' : colors.primary 
                      }}
                    >
                    Sign In
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      )}
    </Formik>
  );
}