import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  Dimensions,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { predictionService } from '../../../services/predictionService';
import { colors } from '../../../utils/colors/colors';
import { fonts } from '../../../utils/fonts/fonts';

const { width } = Dimensions.get('window');

const Prediction = ({ navigation }) => {
  const [availableCategories, setAvailableCategories] = useState({});

  const categories = [
    { id: 'activity', name: 'Activity', icon: 'fitness', color: '#FF6B6B' },
    { id: 'social', name: 'Social', icon: 'people', color: '#4ECDC4' },
    { id: 'health', name: 'Health', icon: 'heart', color: '#45B7D1' },
    { id: 'sleep', name: 'Sleep', icon: 'moon', color: '#96CEB4' },
  ];

  useEffect(() => {
    checkDataAvailability();
  }, []);

  const checkDataAvailability = async () => {
    try {
      const response = await predictionService.checkCategoryData();
      if (response.success) {
        setAvailableCategories(response.availability);
      }
    } catch (error) {
      console.error('Error checking data availability:', error);
    }
  };

  const handleCategoryPrediction = (categoryId) => {
    const isAvailable = availableCategories[categoryId]?.available;
    if (!isAvailable) {
      Alert.alert(
        'Insufficient Data',
        availableCategories[categoryId]?.message || 'Not enough data available for this category prediction.'
      );
      return;
    }
    navigation.navigate('CategoryPrediction', { category: categoryId });
  };

  const renderCategoryCard = (category) => {
    const isAvailable = availableCategories[category.id]?.available;
    return (
      <TouchableOpacity
        key={category.id}
        style={{
          width: (width - 72) / 2,
          borderRadius: 18,
          padding: 22,
          marginBottom: 18,
          position: 'relative',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.12,
          shadowRadius: 8,
          elevation: 4,
          minHeight: 120,
          justifyContent: 'space-between',
          backgroundColor: category.color,
          opacity: !isAvailable ? 0.5 : 1,
          borderWidth: isAvailable ? 0 : 1,
          borderColor: isAvailable ? 'transparent' : '#ccc',
        }}
        onPress={() => handleCategoryPrediction(category.id)}
        disabled={!isAvailable}
        activeOpacity={0.85}
      >
        <View style={{ marginBottom: 10, alignItems: 'center' }}>
          <Ionicons name={category.icon} size={40} color={colors.white} style={{ marginBottom: 6 }} />
          <Text style={{
            fontSize: 19,
            fontFamily: fonts.semiBold,
            color: colors.white,
            marginTop: 4,
            letterSpacing: 0.2,
          }}>
            {category.name}
          </Text>
        </View>
        <Text style={{
          fontSize: 15,
          fontFamily: fonts.regular,
          color: colors.white,
          opacity: 0.92,
          marginTop: 2,
          textAlign: 'center',
        }}>
          {isAvailable ? 'Tap to predict' : 'Insufficient data'}
        </Text>
        {!isAvailable && (
          <View style={{
            position: 'absolute',
            top: 14,
            right: 14,
          }}>
            <Ionicons name="lock-closed" size={24} color={colors.white} />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ paddingBottom: 32 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header with image */}
      <View style={{ alignItems: 'center', marginTop: 24, marginBottom: 10 }}>
        <View
          style={{
            backgroundColor: colors.white,
            borderRadius: 24,
            padding: 16,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.10,
            shadowRadius: 12,
            elevation: 6,
            alignItems: 'center',
            width: width * 0.85,
          }}
        >
         <Text
            style={{
              fontSize: 26,
              fontFamily: fonts.bold,
              color: colors.primary,
              textAlign: 'center',
              marginBottom: 2,
              letterSpacing: 0.5,
            }}
          >
            Mood Predictions
          </Text>
          <Image
            source={require('../../../assets/images/others/predictive.png')}
            style={{
              width: width * 0.8,
              height: width * 0.6,
              resizeMode: 'contain',
              marginBottom: 12,
              borderRadius: 16,
            }}
          />
      <View
        style={{
          paddingHorizontal: 24,
          paddingTop: 18,
          paddingBottom: 10,
        }}
      >
        <Text
          style={{
            fontSize: 17,
            fontFamily: fonts.semiBold,
            color: colors.text,
            marginBottom: 8,
            textAlign: 'center',
          }}
        >
          How does this work?
        </Text>
        <Text
          style={{
            fontSize: 14,
            fontFamily: fonts.regular,
            color: colors.textSecondary,
            lineHeight: 15,
            textAlign: 'justify',
          }}
        >
          The system analyzes your mood logs using a weighted mean algorithm that considers both the recency of data (recent weeks weighted more heavily: 4→3→2→1) and mood intensity levels. This creates predictions based on patterns in your data, helping you understand emotional trends and anticipate future moods with up to 90% confidence.
        </Text>
      </View>
        </View>
      </View>



      {/* Disclaimer Section */}
      <View
        style={{
          paddingHorizontal: 24,
          paddingTop: 0,
          paddingBottom: 10,
        }}
      >
        <View
          style={{
            backgroundColor: colors.primary,
            borderRadius: 14,
            padding: 16,
            borderWidth: 1,
            borderColor: colors.accent,
            flexDirection: 'row',
            alignItems: 'flex-start',
          }}
        >
          <Ionicons name="warning" size={22} color={colors.white} style={{ marginRight: 10, marginTop: 2 }} />
          <Text
            style={{
              fontSize: 12,
              fontFamily: fonts.regular,
              color: colors.white,
              lineHeight: 15,
              flex: 1,
              textAlign: 'justify',
            }}
          >
            <Text style={{ fontFamily: fonts.semiBold }}>Disclaimer:</Text> Predictions use a weighted mean algorithm (max 90% confidence) analyzing your mood intensity and recency patterns. They are meant for guidance only and may not reflect all real-life factors affecting your mood.
          </Text>
        </View>
      </View>

      {/* Category Predictions Section */}
      <View
        style={{
          paddingHorizontal: 24,
          paddingTop: 40,
          paddingBottom: 20,
        }}
      >
        <Text
          style={{
            fontSize: 24,
            fontFamily: fonts.semiBold,
            color: colors.text,
            marginBottom: 4,
            textAlign: 'center',
          }}
        >
          Category-Based Weekly Predictions
        </Text>
        <Text
          style={{
            fontSize: 14,
            fontFamily: fonts.regular,
            color: colors.textSecondary,
            marginBottom: 14,
            textAlign: 'justify',
          }}
        >
          Get detailed predictions for different aspects of your life
        </Text>
        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
          }}
        >
          {categories.map(renderCategoryCard)}
        </View>
      </View>


    </ScrollView>
  );
};

export default Prediction;