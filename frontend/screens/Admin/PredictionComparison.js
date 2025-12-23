import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, StyleSheet, Dimensions, Modal, FlatList } from 'react-native';
import { BarChart } from 'react-native-gifted-charts';
import Toast from 'react-native-toast-message';
import { adminService } from '../../services/adminService';
import { SafeAreaView } from 'react-native-safe-area-context';

const screenWidth = Dimensions.get('window').width;

const PredictionComparison = () => {
  const [availableWeeks, setAvailableWeeks] = useState([]);
  const [selectedWeek, setSelectedWeek] = useState(null);
  const [selectedWeekData, setSelectedWeekData] = useState(null);
  const [selectedDay, setSelectedDay] = useState('Monday');
  const [dailyComparisonData, setDailyComparisonData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [weekDropdownVisible, setWeekDropdownVisible] = useState(false);

  const categories = [
    { key: 'activity', name: 'Activity', color: '#3B82F6' },
    { key: 'social', name: 'Social', color: '#10B981' },
    { key: 'health', name: 'Health', color: '#F59E0B' },
    { key: 'sleep', name: 'Sleep', color: '#8B5CF6' }
  ];

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const formatDateRange = (startDate) => {
    const start = new Date(startDate);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);

    const monthShort = (date) => {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return months[date.getMonth()];
    };

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const isCurrentWeek = start <= today && today <= end;

    return {
      formatted: `${monthShort(start)} ${start.getDate()} - ${monthShort(end)} ${end.getDate()}, ${start.getFullYear()}`,
      isCurrentWeek
    };
  };

  const getWeekDisplayText = (week) => {
    const dateRange = formatDateRange(week.weekStartDate);
    const currentWeekLabel = dateRange.isCurrentWeek ? ' (Current Week)' : '';
    return `${dateRange.formatted}${currentWeekLabel}`;
  };

  useEffect(() => {
    fetchWeeks();
  }, []);

  useEffect(() => {
    if (selectedWeek) {
      fetchData();
    }
  }, [selectedWeek, selectedDay]);

  const fetchWeeks = async () => {
    try {
      const response = await adminService.getAvailableWeeks();
      // The response might be the array directly or { success, data }
      const weeks = Array.isArray(response) ? response : (response.data || []);
      setAvailableWeeks(weeks);
      if (weeks.length > 0) {
        setSelectedWeek(weeks[0].weekStartDate);
        setSelectedWeekData(weeks[0]);
      } else {
        setLoading(false);
      }
    } catch (err) {
      setError('Failed to fetch weeks');
      setLoading(false);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await adminService.getDailyMoodComparison(selectedWeek);
      setDailyComparisonData(data);
      setError('');
    } catch (err) {
      setError('Failed to fetch comparison data');
    } finally {
      setLoading(false);
    }
  };

  const handleCalculate = async () => {
    setLoading(true);
    try {
      await adminService.calculatePredictions();
      await fetchWeeks();
      Toast.show({
        type: 'success',
        text1: 'Predictions Calculated',
        text2: 'Weekly mood predictions have been calculated successfully',
        position: 'top',
      });
    } catch (err) {
      setError('Failed to calculate predictions');
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to calculate predictions',
        position: 'top',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateActual = async () => {
    if (!selectedWeek) return;
    setLoading(true);
    try {
      await adminService.updateActualMoods(selectedWeek);
      await fetchData();
      Toast.show({
        type: 'success',
        text1: 'Actual Moods Updated',
        text2: 'Actual moods have been updated successfully',
        position: 'top',
      });
    } catch (err) {
      setError('Failed to update actual moods');
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to update actual moods',
        position: 'top',
      });
    } finally {
      setLoading(false);
    }
  };

  const renderChart = (category) => {
    if (!dailyComparisonData || !dailyComparisonData.dailyComparison || !dailyComparisonData.dailyComparison[selectedDay]) {
      return null;
    }

    const catData = dailyComparisonData.dailyComparison[selectedDay].categories[category.key];
    if (!catData || catData.totalPredictions === 0) {
      return (
        <View style={styles.noDataContainer}>
          <Text style={styles.noDataText}>No data for {category.name} on {selectedDay}</Text>
        </View>
      );
    }

    const data = [
      { value: catData.top1Matches, label: 'Top 1', frontColor: '#10B981' },
      { value: catData.top2Matches, label: 'Top 2', frontColor: '#F59E0B' },
      { value: catData.top3Matches, label: 'Top 3', frontColor: '#3B82F6' },
      { value: catData.missedPredictions, label: 'Missed', frontColor: '#EF4444' }
    ];

    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>{category.name} - {selectedDay}</Text>
        <View style={{ alignItems: 'center', width: '100%' }}>
          <BarChart
            data={data}
            barWidth={45}
            noOfSections={4}
            barBorderRadius={6}
            frontColor="lightgray"
            yAxisThickness={0}
            xAxisThickness={1}
            xAxisColor={'#D1D5DB'}
            hideRules
            labelStyle={{ color: '#4B5563', fontSize: 10, fontWeight: '600' }}
            showValuesAsTopText
            topLabelTextStyle={{ color: '#374151', fontSize: 12, fontWeight: 'bold' }}
            width={screenWidth - 100}
            height={200}
            isAnimated
          />
        </View>
      </View>
    );
  };

  const renderStats = () => {
    if (!dailyComparisonData || !dailyComparisonData.dailyComparison || !dailyComparisonData.dailyComparison[selectedDay]) {
      return null;
    }

    const dayData = dailyComparisonData.dailyComparison[selectedDay];
    let totalTop1 = 0, totalTop2 = 0, totalTop3 = 0, totalMissed = 0, totalPredictions = 0;

    Object.values(dayData.categories).forEach(cat => {
      totalTop1 += cat.top1Matches;
      totalTop2 += cat.top2Matches;
      totalTop3 += cat.top3Matches;
      totalMissed += cat.missedPredictions;
      totalPredictions += cat.totalPredictions;
    });

    if (totalPredictions === 0) return null;

    const stats = [
      { title: 'Top 1', value: totalTop1, color: '#10B981', bg: '#D1FAE5' },
      { title: 'Top 2', value: totalTop2, color: '#F59E0B', bg: '#FEF3C7' },
      { title: 'Top 3', value: totalTop3, color: '#3B82F6', bg: '#DBEAFE' },
      { title: 'Missed', value: totalMissed, color: '#EF4444', bg: '#FEE2E2' }
    ];

    return (
      <View style={styles.statsGrid}>
        {stats.map((stat, index) => (
          <View key={index} style={[styles.statCard, { backgroundColor: stat.bg }]}>
            <Text style={[styles.statTitle, { color: stat.color }]}>{stat.title}</Text>
            <Text style={[styles.statValue, { color: stat.color }]}>{stat.value}</Text>
            <Text style={[styles.statPercent, { color: stat.color }]}>
              {((stat.value / totalPredictions) * 100).toFixed(1)}%
            </Text>
          </View>
        ))}
      </View>
    );
  };

  if (loading && !dailyComparisonData) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.header}>Mood Prediction Comparison</Text>

        <View style={styles.card}>
          <Text style={styles.label}>Select Week:</Text>
          
          {/* Week Dropdown */}
          <TouchableOpacity 
            style={styles.weekDropdown}
            onPress={() => setWeekDropdownVisible(true)}
          >
            <Text style={styles.weekDropdownText}>
              {selectedWeekData ? (
                <View>
                  <Text style={styles.weekDateRange}>{getWeekDisplayText(selectedWeekData)}</Text>
                  {selectedWeekData.userCount !== undefined && (
                    <Text style={styles.weekSubtext}>Week {selectedWeekData.weekNumber} • {selectedWeekData.userCount} users</Text>
                  )}
                </View>
              ) : (
                'Select a week'
              )}
            </Text>
            <Text style={styles.dropdownArrow}>▼</Text>
          </TouchableOpacity>

          {/* Week Dropdown Modal */}
          <Modal
            transparent
            visible={weekDropdownVisible}
            animationType="fade"
            onRequestClose={() => setWeekDropdownVisible(false)}
          >
            <TouchableOpacity 
              style={styles.modalOverlay}
              onPress={() => setWeekDropdownVisible(false)}
            >
              <View style={styles.dropdownMenu}>
                <FlatList
                  data={availableWeeks}
                  keyExtractor={(item) => item.weekStartDate}
                  renderItem={({ item }) => {
                    const dateRange = formatDateRange(item.weekStartDate);
                    const isSelected = selectedWeek === item.weekStartDate;
                    return (
                      <TouchableOpacity
                        style={[styles.dropdownItem, isSelected && styles.dropdownItemSelected]}
                        onPress={() => {
                          setSelectedWeek(item.weekStartDate);
                          setSelectedWeekData(item);
                          setWeekDropdownVisible(false);
                        }}
                      >
                        <View style={styles.dropdownItemContent}>
                          <Text style={[styles.dropdownItemDate, isSelected && styles.dropdownItemDateSelected]}>
                            {dateRange.formatted}
                            {dateRange.isCurrentWeek && ' (Current Week)'}
                          </Text>
                          {item.userCount !== undefined && (
                            <Text style={[styles.dropdownItemSubtext, isSelected && styles.dropdownItemSubtextSelected]}>
                              Week {item.weekNumber} • {item.userCount} users
                            </Text>
                          )}
                        </View>
                        {isSelected && <Text style={styles.checkmark}>✓</Text>}
                      </TouchableOpacity>
                    );
                  }}
                  scrollEnabled={availableWeeks.length > 5}
                  nestedScrollEnabled
                />
              </View>
            </TouchableOpacity>
          </Modal>

          <View style={styles.buttonRow}>
            <TouchableOpacity style={[styles.button, styles.primaryButton]} onPress={handleCalculate}>
              <Text style={styles.buttonText}>Calculate Prediction</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, styles.secondaryButton]} onPress={handleUpdateActual}>
              <Text style={styles.buttonText}>Update Actual</Text>
            </TouchableOpacity>
          </View>
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <View style={styles.daySelector}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {days.map(day => (
              <TouchableOpacity
                key={day}
                style={[styles.dayButton, selectedDay === day && styles.selectedDayButton]}
                onPress={() => setSelectedDay(day)}
              >
                <Text style={[styles.dayButtonText, selectedDay === day && styles.selectedDayButtonText]}>{day}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {renderStats()}

        {categories.map(category => (
          <View key={category.key}>
            {renderChart(category)}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollContent: {
    padding: 20,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  weekSelector: {
    marginBottom: 16,
  },
  weekButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  selectedWeekButton: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  weekButtonText: {
    color: '#4B5563',
    fontSize: 12,
  },
  selectedWeekButtonText: {
    color: '#FFFFFF',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    flex: 0.48,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#3B82F6',
  },
  secondaryButton: {
    backgroundColor: '#10B981',
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  errorText: {
    color: '#EF4444',
    marginBottom: 16,
    textAlign: 'center',
  },
  daySelector: {
    marginBottom: 20,
  },
  dayButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#E5E7EB',
    marginRight: 8,
  },
  selectedDayButton: {
    backgroundColor: '#3B82F6',
  },
  dayButtonText: {
    color: '#4B5563',
    fontWeight: '600',
  },
  selectedDayButtonText: {
    color: '#FFFFFF',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statCard: {
    width: '48%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  statTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  statPercent: {
    fontSize: 12,
    opacity: 0.8,
  },
  chartContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },
  noDataContainer: {
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noDataText: {
    color: '#6B7280',
    fontStyle: 'italic',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  weekDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 16,
  },
  weekDropdownText: {
    flex: 1,
    color: '#374151',
    fontSize: 14,
  },
  weekDateRange: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  weekSubtext: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  dropdownArrow: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropdownMenu: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    maxHeight: 300,
    width: screenWidth - 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  dropdownItemSelected: {
    backgroundColor: '#EFF6FF',
  },
  dropdownItemContent: {
    flex: 1,
  },
  dropdownItemDate: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  dropdownItemDateSelected: {
    color: '#3B82F6',
  },
  dropdownItemSubtext: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  dropdownItemSubtextSelected: {
    color: '#60A5FA',
  },
  checkmark: {
    fontSize: 18,
    color: '#3B82F6',
    marginLeft: 8,
  }
});

export default PredictionComparison;
