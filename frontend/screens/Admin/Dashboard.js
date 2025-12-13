import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { BarChart, PieChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';
import { fonts } from '../../utils/fonts/fonts';
import { colors } from '../../utils/colors/colors';
import { authService } from '../../services/authService';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5001';
const screenWidth = Dimensions.get('window').width;

const AdminDashboard = () => {
  const navigation = useNavigation();
  const [admin, setAdmin] = useState(null);
  const [dashboardStats, setDashboardStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      loadDashboardData();
    }, [])
  );

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Get stored user and token
      const sessionResult = await authService.checkAuthStatus();

      if (!sessionResult.isAuthenticated) {
        navigation.replace('Login');
        return;
      }

      // Verify user is an admin
      const storedUser = await authService.getCurrentUser();
      if (storedUser.role !== 'admin') {
        Toast.show({
          type: 'error',
          text1: 'Access Denied',
          text2: 'This screen is only accessible to admins.',
          position: 'top',
        });
        navigation.replace('Login');
        return;
      }

      setAdmin(storedUser);

      // Fetch dashboard stats
      const statsResponse = await fetch(
        `${API_BASE_URL}/api/admin/dashboard-stats`,
        {
          headers: {
            'Authorization': `Bearer ${sessionResult.token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!statsResponse.ok) {
        throw new Error('Failed to fetch dashboard stats');
      }

      const statsData = await statsResponse.json();
      if (statsData.success) {
        setDashboardStats(statsData.data);
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to load dashboard data',
        position: 'top',
      });
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

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

  const userChartData =
    dashboardStats && dashboardStats.monthlyUsers
      ? {
          labels: dashboardStats.monthlyUsers.map(item => item.month),
          datasets: [
            {
              data: dashboardStats.monthlyUsers.map(item => item.count),
            },
          ],
        }
      : null;

  // Calculate max value for y-axis with equal steps
  const maxMonthlyCount = userChartData 
    ? Math.max(...userChartData.datasets[0].data, dashboardStats?.totalStudents || 100)
    : 100;
  const yAxisMax = Math.ceil(maxMonthlyCount / 25) * 25;

  const activeInactiveChartData =
    dashboardStats && dashboardStats.activeInactiveStudents
      ? [
          {
            name: 'Active',
            population: dashboardStats.activeInactiveStudents.active,
            color: '#4CAF50',
            legendFontColor: colors.text,
            legendFontSize: 12,
          },
          {
            name: 'Inactive',
            population: dashboardStats.activeInactiveStudents.inactive,
            color: '#FF9800',
            legendFontColor: colors.text,
            legendFontSize: 12,
          },
        ]
      : null;

  // Render pie chart labels inside the pie
  const renderPieLabels = () => {
    if (!activeInactiveChartData) return null;
    
    const total = activeInactiveChartData.reduce((sum, item) => sum + item.population, 0);
    let cumulativePercentage = 0;
    const chartRadius = 80; // Pie chart radius
    const chartCenterX = (screenWidth - 64) / 2;
    const chartCenterY = 90; // Adjusted for proper centering
    
    return activeInactiveChartData.map((item, index) => {
      const percentage = (item.population / total) * 100;
      const midAngle = (cumulativePercentage + percentage / 2) * 3.6; // Convert to degrees
      cumulativePercentage += percentage;
      
      // Calculate position for label - closer to center for better visibility
      const labelRadius = chartRadius * 0.6; // 60% of chart radius
      const angleInRadians = (midAngle - 90) * Math.PI / 180;
      const x = Math.cos(angleInRadians) * labelRadius;
      const y = Math.sin(angleInRadians) * labelRadius;
      
      return (
        <View
          key={index}
          style={{
            position: 'absolute',
            left: chartCenterX + x - 15,
            top: chartCenterY + y - 12,
            width: 30,
            height: 24,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Text
            style={{
              fontSize: 14,
              fontWeight: 'bold',
              color: 'white',
              textAlign: 'center',
              textShadowColor: 'rgba(0, 0, 0, 0.8)',
              textShadowOffset: { width: 1, height: 1 },
              textShadowRadius: 3,
            }}
          >
            {item.population}
          </Text>
        </View>
      );
    });
  };

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
            Admin Dashboard
          </Text>
          <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', marginTop: 4 }}>
            System Overview
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

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Stats Cards */}
        <View style={{ padding: 16 }}>
          {/* Total Users Card */}
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
                backgroundColor: '#E91E63',
                justifyContent: 'center',
                alignItems: 'center',
                marginRight: 12,
              }}
            >
              <MaterialCommunityIcons name="account-multiple" size={28} color="white" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, color: colors.text, fontFamily: fonts.regular }}>
                Total Users
              </Text>
              <Text
                style={{
                  fontSize: 28,
                  fontWeight: 'bold',
                  color: '#E91E63',
                  fontFamily: fonts.bold,
                }}
              >
                {dashboardStats?.totalUsers || 0}
              </Text>
            </View>
          </View>

          {/* Active Users Card */}
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
              <MaterialIcons name="check-circle" size={28} color="white" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, color: colors.text, fontFamily: fonts.regular }}>
                Active Students
              </Text>
              <Text
                style={{
                  fontSize: 28,
                  fontWeight: 'bold',
                  color: '#4CAF50',
                  fontFamily: fonts.bold,
                }}
              >
                {dashboardStats?.activeInactiveStudents?.active || 0}
              </Text>
            </View>
          </View>

          {/* Inactive Users Card */}
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
                backgroundColor: '#FF9800',
                justifyContent: 'center',
                alignItems: 'center',
                marginRight: 12,
              }}
            >
              <MaterialIcons name="highlight-off" size={28} color="white" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, color: colors.text, fontFamily: fonts.regular }}>
                Inactive Students
              </Text>
              <Text
                style={{
                  fontSize: 28,
                  fontWeight: 'bold',
                  color: '#FF9800',
                  fontFamily: fonts.bold,
                }}
              >
                {dashboardStats?.activeInactiveStudents?.inactive || 0}
              </Text>
            </View>
          </View>

          {/* Teachers Card */}
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
                Teachers
              </Text>
              <Text
                style={{
                  fontSize: 28,
                  fontWeight: 'bold',
                  color: '#2196F3',
                  fontFamily: fonts.bold,
                }}
              >
                {dashboardStats?.totalTeachers || 0}
              </Text>
            </View>
          </View>

          {/* Students Card */}
          <View
            style={{
              backgroundColor: 'white',
              borderRadius: 12,
              padding: 16,
              marginBottom: 20,
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
                backgroundColor: '#9C27B0',
                justifyContent: 'center',
                alignItems: 'center',
                marginRight: 12,
              }}
            >
              <MaterialCommunityIcons name="school" size={28} color="white" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, color: colors.text, fontFamily: fonts.regular }}>
                Students
              </Text>
              <Text
                style={{
                  fontSize: 28,
                  fontWeight: 'bold',
                  color: '#9C27B0',
                  fontFamily: fonts.bold,
                }}
              >
                {dashboardStats?.totalStudents || 0}
              </Text>
            </View>
          </View>

          {/* Chart Section */}
          {userChartData && (
            <View
              style={{
                backgroundColor: 'white',
                borderRadius: 12,
                padding: 16,
                marginBottom: 16,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 3.84,
                elevation: 5,
              }}
            >
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: '600',
                  color: colors.text,
                  marginBottom: 12,
                  fontFamily: fonts.semiBold,
                }}
              >
                Monthly User Registrations
              </Text>
              <BarChart
                data={userChartData}
                width={screenWidth - 64}
                height={280}
                yAxisLabel=""
                yAxisSuffix=""
                fromZero={true}
                segments={5}
                chartConfig={{
                  backgroundColor: '#ffffff',
                  backgroundGradientFrom: '#ffffff',
                  backgroundGradientTo: '#ffffff',
                  decimalPlaces: 0,
                  color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`,
                  labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                  style: {
                    borderRadius: 12,
                  },
                  propsForLabels: {
                    fontSize: 12,
                  },
                  barPercentage: 0.7,
                  propsForBackgroundLines: {
                    strokeWidth: 1,
                  },
                }}
                style={{ borderRadius: 12 }}
                showValuesOnTopOfBars={true}
                withInnerLines={true}
              />
            </View>
          )}

          {activeInactiveChartData && (
            <View
              style={{
                backgroundColor: 'white',
                borderRadius: 12,
                padding: 16,
                marginBottom: 20,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 3.84,
                elevation: 5,
              }}
            >
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: '600',
                  color: colors.text,
                  marginBottom: 12,
                  fontFamily: fonts.semiBold,
                }}
              >
                Active vs Inactive Students
              </Text>
              <View style={{ position: 'relative', alignItems: 'center', justifyContent: 'center' }}>
                <PieChart
                  data={activeInactiveChartData}
                  width={screenWidth - 64}
                  height={200}
                  chartConfig={{
                    backgroundColor: '#ffffff',
                    backgroundGradientFrom: '#ffffff',
                    backgroundGradientTo: '#ffffff',
                    decimalPlaces: 0,
                    color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                  }}
                  accessor="population"
                  backgroundColor="transparent"
                  paddingLeft="75"
                  paddingRight="25"
                  paddingTop="10"
                  paddingBottom="10"
                  absolute
                  hasLegend={false}
                />
                {renderPieLabels()}
                
                {/* Custom Legend */}
                <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 15, gap: 30 }}>
                  {activeInactiveChartData.map((item, index) => (
                    <View key={index} style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <View
                        style={{
                          width: 12,
                          height: 12,
                          backgroundColor: item.color,
                          marginRight: 8,
                          borderRadius: 6,
                        }}
                      />
                      <Text style={{ fontSize: 12, color: colors.text, fontFamily: fonts.regular }}>
                        {item.name}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default AdminDashboard;
