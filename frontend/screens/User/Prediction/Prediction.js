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
      </View>

      {/* How This Works Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>How does this work?</Text>
        <Text style={styles.sectionDescription}>
          The system analyzes your mood logs using a weighted mean algorithm that considers both the recency of data (recent weeks weighted more heavily: 4→3→2→1) and mood intensity levels. This creates predictions based on patterns in your data, helping you understand emotional trends and anticipate future moods with up to 90% confidence.
        </Text>
      </View>

      {/* Disclaimer Section */}
      <View style={styles.disclaimerSection}>
        <View style={styles.disclaimerCard}>
          <Text style={styles.disclaimerText}>
            <Text style={styles.disclaimerBold}>Disclaimer:</Text> Predictions use a weighted mean algorithm (max 90% confidence) analyzing your mood intensity and recency patterns. They are meant for guidance only and may not reflect all real-life factors affecting your mood.
          </Text>
        </View>
      </View>

      {/* Category Predictions Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Category-Based Weekly Predictions</Text>
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
            Understanding your patterns is the first step toward improving your emotional well-being.
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
  },
  section: {
    padding: 20,
    paddingTop: 0,
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
  disclaimerSection: {
    padding: 20,
    paddingTop: 0,
  },
  disclaimerCard: {
    backgroundColor: '#fffbe6',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#ffe58f',
  },
  disclaimerText: {
    fontSize: 12,
    fontFamily: fonts.regular,
    color: '#b8860b',
    lineHeight: 20,
  },
  disclaimerBold: {
    fontFamily: fonts.semiBold,
  },
  sectionDescription: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
    lineHeight: 20,
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