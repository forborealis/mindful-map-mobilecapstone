import React, { useEffect, useState, useRef } from 'react';
import { View, Text, ImageBackground, TouchableOpacity, Alert, Dimensions, StatusBar, ActivityIndicator } from 'react-native';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import ViewShot from 'react-native-view-shot';
import * as MediaLibrary from 'expo-media-library';
import quoteImages from '../../utils/images/quotes';
import { getRandomQuote } from '../../utils/others/quotes';
import { fonts } from '../../utils/fonts/fonts';
import { authService } from '../../services/authService';

const screenHeight = Dimensions.get('window').height;
const screenWidth = Dimensions.get('window').width;

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

export default function DailyQuote() {
  const navigation = useNavigation();
  const isFocused = useIsFocused();
  const [imageIndex, setImageIndex] = useState(Math.floor(Math.random() * quoteImages.length));
  const [quote, setQuote] = useState({ text: '', author: '' });
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [userLoading, setUserLoading] = useState(true);
  const viewShotRef = useRef();

  // Fetch user info on mount
  useEffect(() => {
    const fetchUser = async () => {
      setUserLoading(true);
      try {
        const result = await authService.getStoredUser();
        if (result.success) {
          setUser(result.user);
        }
      } catch (e) {
        setUser(null);
      }
      setUserLoading(false);
    };
    fetchUser();
  }, []);

  const fetchQuote = async () => {
    setLoading(true);
    const q = await getRandomQuote();
    setQuote(q);
    setLoading(false);
  };

  useEffect(() => {
    if (isFocused) {
      setImageIndex(Math.floor(Math.random() * quoteImages.length));
      fetchQuote();
    }
    // eslint-disable-next-line
  }, [isFocused]);

  const handleDownload = async () => {
    try {
      const uri = await viewShotRef.current.capture();
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Please allow access to save images.');
        return;
      }
      await MediaLibrary.saveToLibraryAsync(uri);
      Alert.alert('Saved!', 'Quote card saved to your gallery.');
    } catch (e) {
      Alert.alert('Error', 'Could not save image.');
    }
  };

  const handleNext = () => {
    setImageIndex(Math.floor(Math.random() * quoteImages.length));
    fetchQuote();
  };

  const handleSkip = () => {
    // Format today's date as YYYY-MM-DD to ensure consistent sleep log checking
    const today = new Date();
    const formattedMonth = (today.getMonth() + 1).toString().padStart(2, '0');
    const formattedDay = today.getDate().toString().padStart(2, '0');
    const formattedDate = `${today.getFullYear()}-${formattedMonth}-${formattedDay}`;
    navigation.navigate('ChooseCategory', { selectedDate: formattedDate });
  };

  return (
    <View style={{
      flex: 1,
      backgroundColor: '#e6f0ef',
      alignItems: 'center',
      justifyContent: 'center',
      paddingTop: StatusBar.currentHeight || 36,
    }}>
      <View style={{
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 18,
      }}>
        <Text style={{
          fontFamily: fonts.bold,
          fontSize: 22,
          color: '#229e88ff',
          letterSpacing: 0.5,
        }}>
          {getGreeting()},{" "}
          {userLoading
            ? '...'
            : user?.firstName
              ? user.firstName
              : user?.name
                ? user.name
                : 'Friend'}
        </Text>
      </View>

      {/* Quote Card */}
      <ViewShot ref={viewShotRef} options={{ format: 'jpg', quality: 0.97 }}>
        <ImageBackground
          source={quoteImages[imageIndex]}
          style={{
            width: screenWidth * 0.92,
            height: screenHeight * 0.46,
            borderRadius: 32,
            overflow: 'hidden',
            justifyContent: 'flex-end',
            marginBottom: 24,
            shadowColor: '#000',
            shadowOpacity: 0.15,
            shadowRadius: 16,
            shadowOffset: { width: 0, height: 6 },
            elevation: 8,
          }}
          imageStyle={{ borderRadius: 32 }}
        >
          <View style={{
            position: 'absolute',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(30,40,60,0.22)',
            borderRadius: 32,
          }} />
          <View style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            paddingHorizontal: 32,
            paddingVertical: 36,
          }}>
            <Text style={{
              fontSize: 35,
              color: '#fff',
              opacity: 0.7,
              marginBottom: 10,
              fontFamily: fonts.bold,
              alignSelf: 'flex-start',
              textShadowColor: 'rgba(0,0,0,0.12)',
              textShadowOffset: { width: 0, height: 2 },
              textShadowRadius: 6,
            }}>“</Text>
            <Text style={{
              fontSize: 22,
              color: '#fff',
              fontWeight: '600',
              marginBottom: 20,
              fontFamily: fonts.semiBold,
              textAlign: 'center',
              textShadowColor: 'rgba(0,0,0,0.18)',
              textShadowOffset: { width: 0, height: 2 },
              textShadowRadius: 8,
              lineHeight: 34,
            }}>
              {loading ? <ActivityIndicator color="#fff" /> : quote.text}
            </Text>
            <Text style={{
              fontSize: 17,
              color: '#fff',
              opacity: 0.88,
              alignSelf: 'flex-end',
              fontFamily: fonts.medium,
              marginTop: 10,
              textShadowColor: 'rgba(0,0,0,0.13)',
              textShadowOffset: { width: 0, height: 1 },
              textShadowRadius: 3,
            }}>
              — {loading ? '' : quote.author}
            </Text>
          </View>
        </ImageBackground>
      </ViewShot>

      {/* Actions */}
      <View style={{
        flexDirection: 'row',
        justifyContent: 'center',
        width: '90%',
        marginTop: 2,
        marginBottom: 10,
      }}>
        <TouchableOpacity
          onPress={handleDownload}
          style={{
            backgroundColor: '#55AD9B',
            paddingVertical: 13,
            paddingHorizontal: 28,
            borderRadius: 32,
            marginRight: 12,
            flexDirection: 'row',
            alignItems: 'center',
            shadowColor: '#000',
            shadowOpacity: 0.13,
            shadowRadius: 8,
            elevation: 2,
          }}>
          <Ionicons name="download-outline" size={22} color="#fff" style={{ marginRight: 8 }} />
          <Text style={{
            color: '#fff',
            fontFamily: fonts.bold,
            fontSize: 16,
            letterSpacing: 0.5,
          }}>
            Save
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleNext}
          style={{
            backgroundColor: '#55AD9B',
            paddingVertical: 13,
            paddingHorizontal: 28,
            borderRadius: 32,
            flexDirection: 'row',
            alignItems: 'center',
            shadowColor: '#000',
            shadowOpacity: 0.13,
            shadowRadius: 8,
            elevation: 2,
          }}>
          <Ionicons name="refresh" size={22} color="#fff" style={{ marginRight: 8 }} />
          <Text style={{
            color: '#fff',
            fontFamily: fonts.bold,
            fontSize: 16,
            letterSpacing: 0.5,
          }}>
            New Quote
          </Text>
        </TouchableOpacity>
      </View>
      <View style={{
        flexDirection: 'row',
        justifyContent: 'center',
        width: '90%',
        marginBottom: 18,
      }}>
        <TouchableOpacity
          onPress={handleSkip}
          style={{
            backgroundColor: '#fff',
            paddingVertical: 13,
            paddingHorizontal: 28,
            borderRadius: 32,
            flexDirection: 'row',
            alignItems: 'center',
            borderWidth: 1.5,
            borderColor: '#fff',
            shadowColor: '#000',
            shadowOpacity: 0.09,
            shadowRadius: 6,
            elevation: 1,
            width: '50%',
            justifyContent: 'center'
          }}>
          <Text style={{
            color: '#55AD9B',
            fontFamily: fonts.bold,
            fontSize: 16,
            letterSpacing: 0.5,
          }}>
            Next
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}