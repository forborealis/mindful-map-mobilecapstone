import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  StyleSheet,
  Dimensions,
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
        style={[
          styles.categoryCard,
          { backgroundColor: category.color },
          !isAvailable && styles.disabledCard
        ]}
        onPress={() => handleCategoryPrediction(category.id)}
        disabled={!isAvailable}
      >
        <View style={styles.categoryHeader}>
          <Ionicons name={category.icon} size={32} color={colors.white} />
          <Text style={styles.categoryTitle}>{category.name}</Text>
        </View>
        <Text style={styles.categorySubtitle}>
          {isAvailable ? 'Tap to predict' : 'Insufficient data'}
        </Text>
        {!isAvailable && (
          <View style={styles.unavailableOverlay}>
            <Ionicons name="lock-closed" size={24} color={colors.white} />
          </View>
        )}
      </TouchableOpacity>
    );
  };



  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mood Predictions</Text>
        <Text style={styles.headerSubtitle}>
          Discover how different activities might affect your mood throughout the week
        </Text>
      </View>



      {/* Category Predictions Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Mood Predictions by Category</Text>
        <Text style={styles.sectionSubtitle}>
          Get detailed predictions for different aspects of your life
        </Text>
        
        <View style={styles.categoriesGrid}>
          {categories.map(renderCategoryCard)}
        </View>
      </View>

      {/* Information Section */}
      <View style={styles.infoSection}>
        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={24} color={colors.primary} />
          <Text style={styles.infoText}>
            Predictions are based on your mood logging patterns and help you understand trends in your emotional well-being.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    padding: 20,
    paddingTop: 10,
  },
  headerTitle: {
    fontSize: 28,
    fontFamily: fonts.bold,
    color: colors.text,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
  },
  section: {
    padding: 20,
    paddingTop: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: fonts.semiBold,
    color: colors.text,
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
    marginBottom: 16,
  },

  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  categoryCard: {
    width: (width - 60) / 2,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  disabledCard: {
    opacity: 0.6,
  },
  categoryHeader: {
    marginBottom: 12,
  },
  categoryTitle: {
    fontSize: 16,
    fontFamily: fonts.semiBold,
    color: colors.white,
    marginTop: 8,
  },
  categorySubtitle: {
    fontSize: 12,
    fontFamily: fonts.regular,
    color: colors.white,
    opacity: 0.9,
  },
  unavailableOverlay: {
    position: 'absolute',
    top: 12,
    right: 12,
  },
  infoSection: {
    padding: 20,
    paddingTop: 0,
  },
  infoCard: {
    backgroundColor: colors.lightBlue,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  infoText: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: colors.text,
    marginLeft: 12,
    flex: 1,
    lineHeight: 20,
  },
});

export default Prediction;