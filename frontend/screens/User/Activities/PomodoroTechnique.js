import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, Image, Modal, TextInput, BackHandler, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { colors } from '../../../utils/colors/colors';
import { fonts } from '../../../utils/fonts/fonts';

// Plant options and stages (local images)
const plantOptions = [
  {
    key: 'firstOption',
    preview: require('../../../assets/images/pomodoro/firstOption/flower1.3.png'),
    stages: [
      require('../../../assets/images/pomodoro/firstOption/flower1.0.png'),
      require('../../../assets/images/pomodoro/firstOption/flower1.1.png'),
      require('../../../assets/images/pomodoro/firstOption/flower1.2.png'),
      require('../../../assets/images/pomodoro/firstOption/flower1.3.png'),
    ],
    unlocked: () => true,
  },
  {
    key: 'secondOption',
    preview: require('../../../assets/images/pomodoro/secondOption/flower2.2.png'),
    stages: [
      require('../../../assets/images/pomodoro/secondOption/flower2.0.png'),
      require('../../../assets/images/pomodoro/secondOption/flower2.1.png'),
      require('../../../assets/images/pomodoro/secondOption/flower2.2.png'),
    ],
    unlocked: () => true,
  },
  {
    key: 'thirdOption',
    preview: require('../../../assets/images/pomodoro/thirdOption/flower3.3.png'),
    stages: [
      require('../../../assets/images/pomodoro/thirdOption/flower3.0.png'),
      require('../../../assets/images/pomodoro/thirdOption/flower3.1.png'),
      require('../../../assets/images/pomodoro/thirdOption/flower3.2.png'),
      require('../../../assets/images/pomodoro/thirdOption/flower3.3.png'),
    ],
    unlocked: () => true, // Always unlocked now
  }
];

const DEFAULT_MINUTES = 25;
const MIN_MINUTES = 10;
const MAX_MINUTES = 60;

const PomodoroTechnique = () => {
  const navigation = useNavigation();

  // Timer states
  const [time, setTime] = useState(DEFAULT_MINUTES * 60);
  const [initialTime, setInitialTime] = useState(DEFAULT_MINUTES * 60);
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  // UI states
  const [completedPomodoros, setCompletedPomodoros] = useState(0);
  const [showPlantModal, setShowPlantModal] = useState(true);
  const [selectedPlant, setSelectedPlant] = useState(null);
  const [customMinutes, setCustomMinutes] = useState(DEFAULT_MINUTES);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [showLeaveModal, setShowLeaveModal] = useState(false);

  const intervalRef = useRef(null);

  // Timer logic
  useEffect(() => {
    if (isActive && !isPaused) {
      intervalRef.current = setInterval(() => {
        setTime((prevTime) => {
          if (prevTime <= 1) {
            clearInterval(intervalRef.current);
            handleTimerComplete();
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [isActive, isPaused]);

  // Plant stages logic
  const getPlantStages = () => {
    if (!selectedPlant) return [];
    const plant = plantOptions.find(p => p.key === selectedPlant);
    return plant ? plant.stages : [];
  };
  const plantStages = getPlantStages();
  const stageCount = plantStages.length;
  const elapsed = initialTime - time;
  const stage = Math.min(
    Math.floor((elapsed / initialTime) * stageCount),
    stageCount - 1
  );

  const handlePlantSelect = (key) => {
    setSelectedPlant(key);
    setShowPlantModal(false);
    setInitialTime(customMinutes * 60);
    setTime(customMinutes * 60);
    setIsActive(false);
    setIsPaused(false);
  };

  const handleTimerComplete = () => {
    setCompletedPomodoros(completedPomodoros + 1);
    setAlertMessage('Good job! Take a break now.');
    setShowAlert(true);
    setIsActive(false);
  };

  const toggleStartPause = () => {
    if (time === 0) return;
    if (!isActive) {
      setIsActive(true);
      setIsPaused(false);
    } else {
      setIsPaused(!isPaused);
    }
  };

  const resetTimer = () => {
    clearInterval(intervalRef.current);
    setTime(initialTime);
    setIsActive(false);
    setIsPaused(false);
  };

  const handleMinutesChange = (val) => {
    let minutes = parseInt(val, 10);
    if (isNaN(minutes)) minutes = DEFAULT_MINUTES;
    minutes = Math.max(MIN_MINUTES, Math.min(MAX_MINUTES, minutes));
    setCustomMinutes(minutes);
    setInitialTime(minutes * 60);
    setTime(minutes * 60);
    setIsActive(false);
    setIsPaused(false);
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds
      .toString()
      .padStart(2, '0')}`;
  };

  // Navigation guard: prompt if timer is running
  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        if (isActive && !isPaused && time > 0) {
          setShowLeaveModal(true);
          return true;
        }
        return false;
      };
   let backHandlerSub;
   if (Platform.OS === 'android') {
     backHandlerSub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
   }
      const unsubscribe = navigation.addListener('beforeRemove', (e) => {
        if (isActive && !isPaused && time > 0) {
          e.preventDefault();
          setShowLeaveModal(true);
        }
      });
      return () => {
  if (backHandlerSub) {
     backHandlerSub.remove();
   }
        unsubscribe();
      };
    }, [isActive, isPaused, time, navigation])
  );

  // Alert
  useEffect(() => {
    if (showAlert) {
      const timeout = setTimeout(() => setShowAlert(false), 3000);
      return () => clearTimeout(timeout);
    }
  }, [showAlert]);

  return (
    <SafeAreaView style={{
      flex: 1,
      backgroundColor: colors.background,
    }}>
      {/* Header */}
      <View
        style={{
          paddingTop: 36,
          paddingBottom: 18,
          backgroundColor: '#fff',
          borderBottomWidth: 2,
          borderBottomColor: '#CBE7DC',
          shadowColor: '#000',
          shadowOpacity: 0.06,
          shadowOffset: { width: 0, height: 2 },
          shadowRadius: 6,
          elevation: 3,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12 }}>
          <TouchableOpacity
            onPress={() => {
              if (isActive && !isPaused && time > 0) {
                setShowLeaveModal(true);
              } else {
                navigation.goBack();
              }
            }}
            style={{
              padding: 10,
              borderRadius: 999,
              backgroundColor: 'rgba(255,255,255,0.8)',
            }}
          >
            <Ionicons name="arrow-back" size={24} color="#55AD9B" />
          </TouchableOpacity>
          <View style={{ flex: 1, alignItems: 'center', paddingHorizontal: 20 }}>
            <Text style={{
              fontFamily: fonts.bold,
              fontSize: 21,
              color: '#1b5f52',
              letterSpacing: 0,
              alignSelf: 'center'
            }}>
              Pomodoro Timer
            </Text>
          </View>
          <TouchableOpacity
            style={{
              width: 36,
              height: 36,
              borderRadius: 24,
              backgroundColor: colors.surface,
              justifyContent: 'center',
              alignItems: 'center',
              borderWidth: 1,
              borderColor: colors.border,
            }}
            onPress={() => setShowInfoModal(true)}
          >
            <Ionicons name="information-circle-outline" size={22} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Plant Selection Modal */}
      <Modal visible={showPlantModal} transparent animationType="fade">
        <View style={{
          flex: 1,
          backgroundColor: 'rgba(30,40,60,0.18)',
          justifyContent: 'center',
          alignItems: 'center',
        }}>
          <View style={{
            backgroundColor: colors.white,
            borderRadius: 24,
            padding: 24,
            alignItems: 'center',
            width: 320,
            elevation: 8,
          }}>
            <Text style={{
              fontSize: 22,
              fontFamily: fonts.bold,
              color: colors.primary,
              marginBottom: 14,
            }}>Choose Your Plant</Text>
            <View style={{
              flexDirection: 'row',
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: 10,
            }}>
              {plantOptions.map((plant, idx) => (
                <TouchableOpacity
                  key={plant.key}
                  style={{
                    alignItems: 'center',
                    marginHorizontal: 2, // bring cards closer
                    padding: 4,
                    borderRadius: 16,
                    backgroundColor: '#e8f5ea',
                  }}
                  onPress={() => handlePlantSelect(plant.key)}
                >
                  <Image
                    source={plant.preview}
                    style={{
                      width: 60,
                      height: 60,
                    }}
                  />
                </TouchableOpacity>
              ))}
            </View>
            <View style={{ alignItems: 'center', marginTop: 10 }}>
              <Text style={{
                fontFamily: fonts.medium,
                color: colors.primary,
                fontSize: 16,
                marginBottom: 4,
              }}>Pomodoro Duration</Text>
              <TextInput
                style={{
                  width: 60,
                  height: 36,
                  borderWidth: 1,
                  borderColor: colors.primary,
                  borderRadius: 8,
                  textAlign: 'center',
                  fontSize: 18,
                  fontFamily: fonts.bold,
                  color: colors.primary,
                  backgroundColor: '#f8faf9',
                  marginBottom: 2,
                }}
                keyboardType="numeric"
                value={customMinutes.toString()}
                onChangeText={handleMinutesChange}
                maxLength={2}
              />
              <Text style={{
                fontFamily: fonts.regular,
                color: colors.primary,
                fontSize: 13,
                marginTop: 2,
              }}>minutes (10–60)</Text>
            </View>
          </View>
        </View>
      </Modal>

      {/* Info Modal */}
      <Modal visible={showInfoModal} transparent animationType="fade">
        <View style={{
          flex: 1,
          backgroundColor: 'rgba(30,40,60,0.18)',
          justifyContent: 'center',
          alignItems: 'center',
        }}>
          <View style={{
            backgroundColor: colors.white,
            borderRadius: 18,
            padding: 24,
            alignItems: 'center',
            width: 320,
            elevation: 8,
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
              <Ionicons name="information-circle-outline" size={28} color={colors.primary} style={{ marginRight: 8 }} />
              <Text style={{
                fontSize: 20,
                fontFamily: fonts.bold,
                color: colors.primary,
              }}>What is Pomodoro?</Text>
            </View>
            <Text style={{
              fontFamily: fonts.regular,
              color: colors.primary,
              fontSize: 15,
              textAlign: 'center',
              marginBottom: 10,
            }}>
              The Pomodoro Technique is a time management method that uses a timer to break work into intervals, traditionally 25 minutes, separated by short breaks.
            </Text>
            <View style={{ marginTop: 10 }}>
              <Text style={{
                fontFamily: fonts.regular,
                color: colors.primary,
                fontSize: 15,
                marginBottom: 2,
              }}>• Pick a plant and set your timer (10–60 min)</Text>
              <Text style={{
                fontFamily: fonts.regular,
                color: colors.primary,
                fontSize: 15,
                marginBottom: 2,
              }}>• Stay focused while your plant grows</Text>
              <Text style={{
                fontFamily: fonts.regular,
                color: colors.primary,
                fontSize: 15,
                marginBottom: 2,
              }}>• When the timer ends, your plant is fully grown!</Text>
              <Text style={{
                fontFamily: fonts.regular,
                color: colors.primary,
                fontSize: 15,
                marginBottom: 2,
              }}>• Complete more Pomodoros to unlock new plants</Text>
            </View>
            <TouchableOpacity
              style={{
                marginTop: 18,
                backgroundColor: colors.primary,
                borderRadius: 10,
                paddingVertical: 8,
                paddingHorizontal: 28,
              }}
              onPress={() => setShowInfoModal(false)}
            >
              <Text style={{
                color: '#fff',
                fontFamily: fonts.bold,
                fontSize: 16,
              }}>Got it!</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Leave Modal */}
      <Modal visible={showLeaveModal} transparent animationType="fade">
        <View style={{
          flex: 1,
          backgroundColor: 'rgba(30,40,60,0.18)',
          justifyContent: 'center',
          alignItems: 'center',
        }}>
          <View style={{
            backgroundColor: colors.white,
            borderRadius: 18,
            padding: 28,
            alignItems: 'center',
            width: 320,
            elevation: 8,
          }}>
            <Ionicons name="alert-circle-outline" size={38} color="#e57373" style={{ marginBottom: 10 }} />
            <Text style={{
              fontFamily: fonts.bold,
              fontSize: 18,
              color: '#e57373',
              marginBottom: 10,
              textAlign: 'center',
            }}>
              Leave Pomodoro?
            </Text>
            <Text style={{
              fontFamily: fonts.regular,
              fontSize: 15,
              color: colors.text,
              textAlign: 'center',
              marginBottom: 18,
            }}>
              Your timer is still running. Are you sure you want to leave and lose your progress?
            </Text>
            <View style={{ flexDirection: 'row' }}>
              <TouchableOpacity
                style={{
                  backgroundColor: '#e57373',
                  borderRadius: 8,
                  paddingVertical: 8,
                  paddingHorizontal: 22,
                  marginRight: 8,
                }}
                onPress={() => {
                  setShowLeaveModal(false);
                  setIsActive(false);
                  navigation.goBack();
                }}
              >
                <Text style={{
                  color: '#fff',
                  fontFamily: fonts.bold,
                  fontSize: 15,
                }}>Leave</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{
                  backgroundColor: colors.primary,
                  borderRadius: 8,
                  paddingVertical: 8,
                  paddingHorizontal: 22,
                }}
                onPress={() => setShowLeaveModal(false)}
              >
                <Text style={{
                  color: '#fff',
                  fontFamily: fonts.bold,
                  fontSize: 15,
                }}>Stay</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Main Circular Timer */}
      <View style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 16,
      }}>
        <View style={{
          width: 260,
          height: 260,
          borderRadius: 130,
          backgroundColor: '#e8f5ea',
          alignItems: 'center',
          justifyContent: 'center',
          shadowColor: colors.primary,
          shadowOpacity: 0.12,
          shadowRadius: 16,
          elevation: 8,
          marginBottom: 20,
        }}>
          {/* Plant Animation */}
          {selectedPlant && plantStages.length > 0 && (
            <Image
              source={plantStages[stage]}
              style={{
                width: 100,
                height: 100,
                marginBottom: 10,
              }}
              resizeMode="contain"
            />
          )}
          {/* Timer */}
          <Text style={{
            fontSize: 36,
            fontFamily: fonts.bold,
            color: colors.primary,
            marginBottom: 2,
            letterSpacing: 2,
          }}>{formatTime(time)}</Text>
          {/* Controls */}
          <View style={{
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
            marginTop: -10, // bring controls upward
            marginBottom: 0,
          }}>
            <TouchableOpacity onPress={toggleStartPause} style={{
              padding: 10,
              borderRadius: 30,
              backgroundColor: '#e8f5ea',
              marginHorizontal: 6,
            }}>
              <Ionicons
                name={isActive && !isPaused ? "pause" : "play"}
                size={32}
                color={colors.primary}
              />
            </TouchableOpacity>
            <TouchableOpacity onPress={resetTimer} style={{
              padding: 10,
              borderRadius: 30,
              backgroundColor: '#e8f5ea',
              marginHorizontal: 6,
            }}>
              <Ionicons name="refresh" size={32} color={colors.primary} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Alert */}
      {showAlert && (
        <View style={{
          position: 'absolute',
          bottom: 40,
          left: 0,
          right: 0,
          alignItems: 'center',
          zIndex: 10,
        }}>
          <Text style={{
            backgroundColor: colors.primary,
            color: '#fff',
            fontFamily: fonts.bold,
            fontSize: 16,
            paddingHorizontal: 24,
            paddingVertical: 12,
            borderRadius: 20,
            overflow: 'hidden',
          }}>{alertMessage}</Text>
        </View>
      )}
    </SafeAreaView>
  );
};

export default PomodoroTechnique;