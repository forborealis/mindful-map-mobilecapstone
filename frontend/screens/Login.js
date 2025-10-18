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
  Alert
} from 'react-native';
import { Formik } from 'formik';
import * as Yup from 'yup';
import Toast from 'react-native-toast-message';
import { Ionicons } from '@expo/vector-icons';
import { fonts } from '../utils/fonts/fonts';
import { colors } from '../utils/colors/colors';
import { useNavigation } from '@react-navigation/native';
import { authService } from '../services/authService';
import 'expo-dev-client';

// Validation Schema
const LoginSchema = Yup.object().shape({
  email: Yup.string()
    .email('Please enter a valid email address')
    .required('Email is required'),
  password: Yup.string()
    .required('Password is required')
    .min(1, 'Password cannot be empty'),
});

export default function Login() {
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigation = useNavigation();

  const handleLogin = async (values) => {
    setLoading(true);

    try {
      console.log('🔐 Attempting login for:', values.email);
      
      const result = await authService.login(values.email.trim(), values.password);

      if (result.success) {
        // Success toast
        Toast.show({
          type: 'success',
          text1: 'Welcome back!',
          text2: `Hello ${result.user.firstName}! 👋`,
          position: 'top',
          visibilityTime: 3000,
        });

        // Navigate to Home
        setTimeout(() => {
          navigation.replace('Home');
        }, 1000);

      } else {
        // Handle specific error messages from backend
        const errorMessage = result.error || 'Login failed';
        
        console.log('❌ Backend error message:', errorMessage);
        
        // Check for specific error patterns
        if (errorMessage.includes('password') || errorMessage.includes('Password')) {
          Toast.show({
            type: 'error',
            text1: 'Incorrect Password',
            text2: 'Please check your password and try again.',
            position: 'top',
            visibilityTime: 4000,
          });
        } else if (errorMessage.includes('email') || errorMessage.includes('account') || errorMessage.includes('No account found')) {
          Toast.show({
            type: 'error',
            text1: 'Account Not Found',
            text2: 'No account found with this email address.',
            position: 'top',
            visibilityTime: 4000,
          });
        } else if (errorMessage.includes('Server error') || errorMessage.includes('connection')) {
          Toast.show({
            type: 'error',
            text1: 'Server Error',
            text2: 'Please try again in a moment.',
            position: 'top',
            visibilityTime: 4000,
          });
        } else {
          // Generic error message
          Toast.show({
            type: 'error',
            text1: 'Login Failed',
            text2: errorMessage,
            position: 'top',
            visibilityTime: 4000,
          });
        }
      }
    } catch (error) {
      console.error('❌ Login error:', error);
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

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      console.log('🔍 Starting Google Sign-In...');
      
      const result = await authService.signInWithGoogle();
      
      if (result.success) {
        // Success toast
        Toast.show({
          type: 'success',
          text1: result.isNewUser ? 'Welcome to Mindful Map!' : 'Welcome back!',
          text2: `Hello ${result.user.firstName}! 👋`,
          position: 'top',
          visibilityTime: 3000,
        });

        console.log('✅ Google login successful:', result.user.email);
        
        // Navigate to Home
        setTimeout(() => {
          navigation.replace('Home');
        }, 1000);
        
      } else {
        console.log('❌ Google login failed:', result.error);
        
        // Show error toast
        if (result.error === 'Sign-in was cancelled') {
          // Don't show error for user cancellation
          console.log('🚫 User cancelled Google Sign-In');
        } else {
          Toast.show({
            type: 'error',
            text1: 'Google Sign-In Failed',
            text2: result.error || 'Unable to sign in with Google',
            position: 'top',
            visibilityTime: 4000,
          });
        }
      }
    } catch (error) {
      console.error('❌ Google login error:', error);
      Toast.show({
        type: 'error',
        text1: 'Google Sign-In Error',
        text2: 'An unexpected error occurred',
        position: 'top',
        visibilityTime: 4000,
      });
    } finally {
      setGoogleLoading(false);
    }
  };

  // Toggle password visibility
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <Formik
      initialValues={{ email: '', password: '' }}
      validationSchema={LoginSchema}
      onSubmit={handleLogin}
    >
      {({ handleChange, handleBlur, handleSubmit, values, errors, touched, isValid }) => (
        <KeyboardAvoidingView 
          style={{ flex: 1 }} 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView
            style={{ flex: 1, backgroundColor: colors.background }}
            contentContainerStyle={{ flexGrow: 1 }}
            showsVerticalScrollIndicator={false}
          >
            <StatusBar backgroundColor={colors.accent} barStyle="dark-content" />
            
            <View className="flex-1 px-8 pt-20">
              {/* Logo - Made bigger */}
              <View className="items-center mb-8">
                <TouchableOpacity 
                  onPress={() => navigation.navigate('Landing')}
                  disabled={loading || googleLoading}
                  style={{
                    opacity: (loading || googleLoading) ? 0.5 : 1,
                    padding: 10,
                    borderRadius: 20,
                  }}
                  activeOpacity={0.8}
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
                
                {/* Welcome Text */}
                <Text 
                  className="text-3xl font-semibold text-center"
                  style={{ fontFamily: fonts.semiBold, color: colors.text }}
                >
                  Welcome back!
                </Text>
              </View>

              {/* Input Fields */}
              <View className="mb-4">
                {/* Email Input */}
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
                  {/* Email Error */}
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

                {/* Password Input with Eye Icon */}
                <View className="mb-3">
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
                    
                    {/* Eye Icon Button */}
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
                  
                  {/* Password Error */}
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
              </View>

              {/* Buttons */}
              <View className="mb-8">
                {/* Sign In Button */}
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
                        className="text-lg font-regular"
                        style={{ fontFamily: fonts.regular, color: colors.white }}
                      >
                        Signing In...
                      </Text>
                    </View>
                  ) : (
                    <Text
                      className="text-lg font-semibold"
                      style={{ fontFamily: fonts.semiBold, color: colors.background }}
                    >
                      Sign In
                    </Text>
                  )}
                </TouchableOpacity>

                {/* Sign In with Google Button - UPDATED with SVG */}
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
                        Signing in with Google...
                      </Text>
                    </View>
                  ) : (
                    <>
                      {/* Google SVG Icon */}
                      <Image
                        source={require('../assets/images/login/google.png')}
                        style={{
                          width: 25,
                          height: 25,
                          marginRight: 12,
                        }}
                        resizeMode="contain"
                      />
                      <Text
                        className="text-lg font-semibold"
                        style={{ fontFamily: fonts.semiBold, color: colors.text }}
                      >
                        Sign in with Google
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>

              {/* Footer Links */}
              <View className="items-center">
                <TouchableOpacity 
                  className="mb-4" 
                  disabled={loading || googleLoading}
                >
                  <Text
                    className="text-base"
                    style={{ 
                      fontFamily: fonts.regular, 
                      color: (loading || googleLoading) ? colors.primary + '50' : colors.primary 
                    }}
                  >
                    Forgot Password?
                  </Text>
                </TouchableOpacity>
                
                <View className="flex-row items-center">
                  <Text
                    className="text-lg"
                    style={{ fontFamily: fonts.regular, color: colors.text }}
                  >
                    Don't have an account?{' '}
                  </Text>
                  <TouchableOpacity 
                    onPress={() => navigation.navigate('Signup')}
                    disabled={loading || googleLoading}
                  >
                    <Text
                      className="text-lg font-semibold"
                      style={{ 
                        fontFamily: fonts.semiBold, 
                        color: (loading || googleLoading) ? colors.primary + '50' : colors.primary 
                      }}
                    >
                      Sign Up
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