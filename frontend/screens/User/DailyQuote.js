import React, { useEffect, useState, useRef } from 'react';
import { View, Text, ImageBackground, TouchableOpacity, Alert, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import ViewShot from 'react-native-view-shot';
import * as MediaLibrary from 'expo-media-library';
import quoteImages from '../../utils/images/quotes';
import { getRandomQuote } from '../../utils/others/quotes';
import { fonts } from '../../utils/fonts/fonts';

const screenHeight = Dimensions.get('window').height;
const screenWidth = Dimensions.get('window').width;

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

export default function DailyQuote({ user = { name: 'Friend' } }) {
  const navigation = useNavigation();
  const [imageIndex, setImageIndex] = useState(Math.floor(Math.random() * quoteImages.length));
  const [quote, setQuote] = useState({ text: '', author: '' });
  const viewShotRef = useRef();

  const fetchQuote = async () => {
    const q = await getRandomQuote();
    setQuote(q);
  };

  useEffect(() => {
    setImageIndex(Math.floor(Math.random() * quoteImages.length));
    fetchQuote();
    // eslint-disable-next-line
  }, []);

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
    navigation.navigate('ChooseCategory');
  };

  return (
    <View style={{
      flex: 1,
      backgroundColor: '#cfd8e3',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <ViewShot ref={viewShotRef} options={{ format: 'jpg', quality: 0.95 }}>
        <ImageBackground
          source={quoteImages[imageIndex]}
          style={{
            width: 320,
            height: 420,
            borderRadius: 24,
            overflow: 'hidden',
            justifyContent: 'flex-end',
            marginBottom: 24,
          }}
          imageStyle={{ borderRadius: 24 }}
        >
          <View style={{
            position: 'absolute',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(30,40,60,0.25)',
            borderRadius: 24,
          }} />
          <View style={{
            padding: 28,
            alignItems: 'flex-start',
          }}>
            <Text style={{
              fontSize: 38,
              color: '#fff',
              opacity: 0.7,
              marginBottom: 8,
              fontFamily: fonts.bold,
            }}>“</Text>
            <Text style={{
              fontSize: 22,
              color: '#fff',
              fontWeight: '600',
              marginBottom: 12,
              fontFamily: fonts.semiBold,
            }}>{quote.text}</Text>
            <Text style={{
              fontSize: 16,
              color: '#fff',
              opacity: 0.8,
              alignSelf: 'flex-end',
              fontFamily: fonts.medium,
            }}>- {quote.author}</Text>
          </View>
        </ImageBackground>
      </ViewShot>
      <View style={{
        flexDirection: 'row',
        justifyContent: 'center',
        width: 180,
        marginTop: 8,
        marginBottom: 16,
      }}>
        <TouchableOpacity onPress={handleDownload} style={{
          backgroundColor: 'rgba(30,40,60,0.85)',
          paddingVertical: 12,
          paddingHorizontal: 28,
          borderRadius: 32,
          marginRight: 12,
          flexDirection: 'row',
          alignItems: 'center',
          shadowColor: '#000',
          shadowOpacity: 0.18,
          shadowRadius: 8,
          elevation: 3,
        }}>
          <Ionicons name="download-outline" size={22} color="#fff" style={{ marginRight: 8 }} />
          <Text style={{
            color: '#fff',
            fontFamily: fonts.bold,
            fontSize: 16,
            letterSpacing: 1,
          }}>
            Download
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleNext}
          style={{
            backgroundColor: 'rgba(30,40,60,0.85)',
            paddingVertical: 12,
            paddingHorizontal: 28,
            borderRadius: 32,
            flexDirection: 'row',
            alignItems: 'center',
            shadowColor: '#000',
            shadowOpacity: 0.18,
            shadowRadius: 8,
            elevation: 3,
          }}
        >
          <Ionicons name="arrow-forward-outline" size={22} color="#fff" style={{ marginRight: 8 }} />
          <Text style={{
            color: '#fff',
            fontFamily: fonts.bold,
            fontSize: 16,
            letterSpacing: 1,
          }}>
            Next
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}