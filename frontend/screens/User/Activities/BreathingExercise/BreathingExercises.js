import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, Modal, ScrollView,
  SafeAreaView, ActivityIndicator, FlatList, Animated
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { useFocusEffect } from '@react-navigation/native';
import { colors } from '../../../../utils/colors/colors';
import { fonts } from '../../../../utils/fonts/fonts';
import { activityService } from '../../../../services/activityService';
import { musicService } from '../../../../services/musicService';
import ProgressModal from './ProgressModal';
import CompletionModal from './CompletionModal';

const BREATHING_TECHNIQUES = [
  {
    id: 'box',
    name: 'Box Breathing',
    description: 'Navy SEAL technique for stress reduction and improved focus',
    benefits: ['Reduces stress and anxiety', 'Improves concentration', 'Lowers blood pressure', 'Enhances mental clarity'],
    phases: ['Breathe In', 'Hold', 'Breathe Out', 'Hold'],
    durations: [4, 4, 4, 4],
    color: '#64aa86',
    difficulty: 'Beginner',
    icon: '⬜',
    cycleTime: 16
  },
  {
    id: '478',
    name: '4-7-8 Breathing',
    description: 'Dr. Weil\'s technique for better sleep and anxiety relief',
    benefits: ['Promotes better sleep', 'Reduces anxiety', 'Calms nervous system', 'Helps with insomnia'],
    phases: ['Inhale', 'Hold', 'Exhale'],
    durations: [4, 7, 8],
    color: '#5a9edb',
    difficulty: 'Intermediate',
    icon: '🌙',
    cycleTime: 19
  },
  {
    id: 'diaphragmatic',
    name: 'Diaphragmatic Breathing',
    description: 'Deep belly breathing for stress relief and better oxygen flow',
    benefits: ['Strengthens diaphragm', 'Reduces oxygen demand', 'Improves core stability', 'Enhances relaxation'],
    phases: ['Inhale', 'Exhale'],
    durations: [4, 6],
    color: '#9c75d5',
    difficulty: 'Beginner',
    icon: '🫁',
    cycleTime: 10
  }
];

const DURATION_OPTIONS = [
  { value: 1, label: '1 min', cycles: 3 },
  { value: 2, label: '2 min', cycles: 7 },
  { value: 3, label: '3 min', cycles: 12 },
  { value: 5, label: '5 min', cycles: 18 },
  { value: 10, label: '10 min', cycles: 37 }
];

const CUSTOM_MUSIC_NAMES = [
  'Pixel Lofi Café',
  'Dreamscape Ambience',
  'Mystic Nature Walk',
  'Retro Rain Arcade'
];

const BreathingExercises = ({ navigation }) => {
  const [musicOptions, setMusicOptions] = useState([]);
  const [selectedMusic, setSelectedMusic] = useState(null);
  const [selectedTechnique, setSelectedTechnique] = useState(BREATHING_TECHNIQUES[0]);
  const [selectedDuration, setSelectedDuration] = useState(DURATION_OPTIONS[1]);
  const [phase, setPhase] = useState(selectedTechnique.phases[0]);
  const [count, setCount] = useState(selectedTechnique.durations[0]);
  const [currentPhaseIndex, setCurrentPhaseIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [completedCycles, setCompletedCycles] = useState(0);
  const [totalCycles, setTotalCycles] = useState(selectedDuration.cycles);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [totalSessionTime, setTotalSessionTime] = useState(selectedTechnique.cycleTime * selectedDuration.cycles);
  const [showInfo, setShowInfo] = useState(false);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [showResumeModal, setShowResumeModal] = useState(false);
  const [resumeData, setResumeData] = useState(null);

  const [isMuted, setIsMuted] = useState(false);
  const [isMusicPaused, setIsMusicPaused] = useState(false);
  const [volume, setVolume] = useState(0.3);

  const [streak, setStreak] = useState(0);
  const [totalSessions, setTotalSessions] = useState(0);
  const [techniqueProgress, setTechniqueProgress] = useState({});
  const [loading, setLoading] = useState(true);

  const soundRef = useRef(null);
  const timerRef = useRef(null);
  const breathingAnim = useRef(new Animated.Value(1)).current;
  const loadTokenRef = useRef(0);

  const normalizeMusicResponse = (res) => {
    if (!res) return [];
    if (Array.isArray(res)) return res;
    if (Array.isArray(res.data)) return res.data;
    if (Array.isArray(res.music)) return res.music;
    if (Array.isArray(res.items)) return res.items;
    if (Array.isArray(res.results)) return res.results;
    if (Array.isArray(res.tracks)) return res.tracks;
    if (typeof res === 'object') return [res];
    return [];
  };

  const computePhaseFromElapsed = useCallback((technique, elapsedInCycle) => {
    let remainder = elapsedInCycle;
    for (let i = 0; i < technique.durations.length; i++) {
      const seg = technique.durations[i];
      if (remainder < seg) return { phaseIndex: i, phaseRemaining: seg - remainder };
      remainder -= seg;
    }
    return { phaseIndex: 0, phaseRemaining: technique.durations[0] };
  }, []);

  const stopAndUnloadSound = async () => {
    if (soundRef.current) {
      try {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
      } catch {}
      soundRef.current = null;
    }
  };

  const loadSound = useCallback(async (musicSrc) => {
    if (!musicSrc || !isActive) return;
    const token = ++loadTokenRef.current;
    try {
      if (soundRef.current) {
        await soundRef.current.stopAsync().catch(()=>{});
        await soundRef.current.unloadAsync().catch(()=>{});
        soundRef.current = null;
      }
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true
      });
      const { sound } = await Audio.Sound.createAsync(
        { uri: musicSrc },
        { volume: isMuted ? 0 : volume, isLooping: true }
      );
      if (token !== loadTokenRef.current) {
        await sound.unloadAsync().catch(()=>{});
        return;
      }
      soundRef.current = sound;
      if (!isPaused && !isMusicPaused && !isMuted) {
        await sound.playAsync().catch(()=>{});
      }
    } catch (e) {
      console.log('Audio load error', e);
    }
  }, [volume, isMusicPaused, isMuted, isActive, isPaused]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const rawMusic = await musicService.getAllMusic();
      const arr = normalizeMusicResponse(rawMusic).filter(track =>
        track &&
        (track.category === 'other' || track.musicCategory === 'other') &&
        typeof track.cloudinaryUrl === 'string' &&
        track.cloudinaryUrl.endsWith('.mp3')
      );
      const options = arr.map((track, idx) => ({
        id: track.cloudinaryPublicId || track._id || track.id || track.title || track.cloudinaryUrl,
        name: CUSTOM_MUSIC_NAMES[idx] || track.title || `Track ${idx + 1}`,
        src: track.cloudinaryUrl,
        color: ['#FFB86C', '#8BE9FD', '#50FA7B', '#BD93F9'][idx % 4]
      }));
      setMusicOptions(options);
      if (!selectedMusic && options.length) setSelectedMusic(options[0]);

      const progressRes = await activityService.getBreathingProgress();
      const progress = progressRes?.progress || progressRes;

      if (progress && progress.lastSelectedTechnique && progress.lastSelectedDuration) {
        const technique = BREATHING_TECHNIQUES.find(t => t.id === progress.lastSelectedTechnique) || BREATHING_TECHNIQUES[0];
        const duration = DURATION_OPTIONS.find(d => d.value === progress.lastSelectedDuration) || DURATION_OPTIONS[1];
        setSelectedTechnique(technique);
        setSelectedDuration(duration);
        setStreak(progress.streak || 0);
        setTotalSessions(progress.totalSessions || 0);
        setTechniqueProgress(
          (progress.techniques || []).reduce((acc, t) => {
            acc[t.techniqueId] = t.sessions;
            return acc;
          }, {})
        );
        const lastElapsed = Number(progress.lastSessionElapsedTime || 0);
        const sessionTotal = technique.cycleTime * duration.cycles;
        if (!isActive && lastElapsed > 0 && lastElapsed < sessionTotal) {
            const withinCycle = lastElapsed % technique.cycleTime;
            const { phaseIndex, phaseRemaining } = computePhaseFromElapsed(technique, withinCycle);
            setResumeData({ technique, duration, elapsedTime: lastElapsed, phaseIndex, phaseRemaining });
            setShowResumeModal(true);
        } else {
            setResumeData(null);
            setShowResumeModal(false);
        }
      }
    } catch (err) {
      console.log('Fetch error', err);
    }
    setLoading(false);
  }, [selectedMusic, isActive, computePhaseFromElapsed]);

  useFocusEffect(
    useCallback(() => {
      fetchData();
      return () => {
        stopAndUnloadSound();
      };
    }, [fetchData])
  );

  useEffect(() => {
    setPhase(selectedTechnique.phases[0]);
    setCount(selectedTechnique.durations[0]);
    setCurrentPhaseIndex(0);
    setTotalCycles(selectedDuration.cycles);
    setTotalSessionTime(selectedTechnique.cycleTime * selectedDuration.cycles);
  }, [selectedTechnique, selectedDuration]);

  useEffect(() => {
    if (isActive && !isPaused) {
      timerRef.current = setInterval(() => {
        setElapsedTime(prev => {
          const newTime = prev + 1;
          if (newTime >= totalSessionTime) {
            handleSessionComplete();
            return totalSessionTime;
          }
          setCompletedCycles(Math.floor(newTime / selectedTechnique.cycleTime));
          return newTime;
        });
        setCount(prevCount => {
          if (prevCount === 1) {
            const nextIndex = (currentPhaseIndex + 1) % selectedTechnique.phases.length;
            setCurrentPhaseIndex(nextIndex);
            setPhase(selectedTechnique.phases[nextIndex]);
            return selectedTechnique.durations[nextIndex];
          }
          return prevCount - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, isPaused, currentPhaseIndex, selectedTechnique, totalSessionTime]);

  useEffect(() => {
    if (isActive && !isPaused) {
      Animated.sequence([
        Animated.timing(breathingAnim, { toValue: 1.25, duration: 900, useNativeDriver: true }),
        Animated.timing(breathingAnim, { toValue: 1, duration: 900, useNativeDriver: true })
      ]).start();
    }
  }, [count, phase, isActive, isPaused, breathingAnim]);

  useEffect(() => {
    if (!isActive) {
      stopAndUnloadSound();
      return;
    }
    if (selectedMusic && !isMusicPaused && !isMuted && !isPaused) {
      loadSound(selectedMusic.src);
    }
  }, [selectedMusic, isActive, isMusicPaused, isMuted, isPaused, loadSound]);

  // Keep audio state aligned with pause/mute toggles
  useEffect(() => {
    if (!soundRef.current) return;
    if (!isActive || isPaused || isMusicPaused || isMuted) {
      soundRef.current.pauseAsync().catch(()=>{});
    } else {
      soundRef.current.playAsync().catch(()=>{});
    }
  }, [isActive, isPaused, isMusicPaused, isMuted]);

  useEffect(() => {
    if (!isActive) return;
    const save = async () => {
      try {
        await activityService.updateBreathingProgress({
          streak,
          totalSessions,
          lastSession: new Date(),
          techniques: Object.entries(techniqueProgress).map(([techniqueId, sessions]) => ({ techniqueId, sessions })),
          lastSelectedTechnique: selectedTechnique.id,
          lastSelectedDuration: selectedDuration.value,
          lastSessionStartTime: new Date(),
          lastSessionElapsedTime: elapsedTime
        });
      } catch (e) {
        console.log('Progress save error', e);
      }
    };
    save();
  }, [elapsedTime, isActive, selectedTechnique, selectedDuration, streak, totalSessions, techniqueProgress]);

  const handleSessionComplete = async () => {
    setIsActive(false);
    setIsPaused(false);
    setShowCompletionModal(true);
    const newStreak = streak + 1;
    const newTotalSessions = totalSessions + 1;
    const newTechniqueProgress = {
      ...techniqueProgress,
      [selectedTechnique.id]: (techniqueProgress[selectedTechnique.id] || 0) + 1
    };
    setStreak(newStreak);
    setTotalSessions(newTotalSessions);
    setTechniqueProgress(newTechniqueProgress);
    try {
      await activityService.updateBreathingProgress({
        streak: newStreak,
        totalSessions: newTotalSessions,
        lastSession: new Date(),
        techniques: Object.entries(newTechniqueProgress).map(([techniqueId, sessions]) => ({ techniqueId, sessions })),
        lastSelectedTechnique: selectedTechnique.id,
        lastSelectedDuration: selectedDuration.value,
        lastSessionStartTime: new Date(),
        lastSessionElapsedTime: elapsedTime
      });
    } catch (e) {
      console.log('Complete save error', e);
    }
    stopAndUnloadSound();
  };

  const startSession = () => {
    setIsActive(true);
    setIsPaused(false);
    setCompletedCycles(0);
    setElapsedTime(0);
    setCurrentPhaseIndex(0);
    setPhase(selectedTechnique.phases[0]);
    setCount(selectedTechnique.durations[0]);
    setShowCompletionModal(false);
    setIsMusicPaused(false);
    setShowResumeModal(false);
    setResumeData(null);
    stopAndUnloadSound();
    if (selectedMusic && !isMuted) loadSound(selectedMusic.src);
  };

  const resumeSession = () => {
    if (!resumeData) return;
    setSelectedTechnique(resumeData.technique);
    setSelectedDuration(resumeData.duration);
    setElapsedTime(resumeData.elapsedTime);
    setCompletedCycles(Math.floor(resumeData.elapsedTime / resumeData.technique.cycleTime));
    setCurrentPhaseIndex(resumeData.phaseIndex);
    setPhase(resumeData.technique.phases[resumeData.phaseIndex]);
    setCount(resumeData.phaseRemaining);
    setIsActive(true);
    setIsPaused(false);
    setShowResumeModal(false);
    setShowCompletionModal(false);
    setIsMusicPaused(false);
    setResumeData(null);
    stopAndUnloadSound();
    if (selectedMusic && !isMuted) loadSound(selectedMusic.src);
  };

  const resetSession = () => {
    setIsActive(false);
    setIsPaused(false);
    setCompletedCycles(0);
    setElapsedTime(0);
    setCurrentPhaseIndex(0);
    setPhase(selectedTechnique.phases[0]);
    setCount(selectedTechnique.durations[0]);
    setShowCompletionModal(false);
    setShowResumeModal(false);
    setResumeData(null);
    stopAndUnloadSound();
  };

  const togglePause = () => {
    setIsPaused(prev => {
      const next = !prev;
      if (soundRef.current) {
        if (next) soundRef.current.pauseAsync().catch(()=>{});
        else if (isActive && !isMusicPaused && !isMuted) soundRef.current.playAsync().catch(()=>{});
      }
      return next;
    });
  };

  const changeTechnique = (technique) => {
    if (isActive) resetSession();
    setSelectedTechnique(technique);
  };

  const changeDuration = (duration) => {
    if (isActive) resetSession();
    setSelectedDuration(duration);
  };

  const toggleMute = () => {
    const newMute = !isMuted;
    setIsMuted(newMute);
    if (soundRef.current) {
      soundRef.current.setVolumeAsync(newMute ? 0 : volume).catch(()=>{});
      if (!newMute && isActive && !isMusicPaused && !isPaused && selectedMusic) soundRef.current.playAsync().catch(()=>{});
    }
  };

  const toggleMusicPause = () => {
    const newPaused = !isMusicPaused;
    setIsMusicPaused(newPaused);
    if (soundRef.current) {
      if (newPaused) soundRef.current.pauseAsync().catch(()=>{});
      else if (isActive && !isMuted && !isPaused) soundRef.current.playAsync().catch(()=>{});
    }
  };

  const handleVolumeChange = (newVolume) => {
    const clamped = Math.max(0, Math.min(1, newVolume));
    setVolume(clamped);
    if (soundRef.current) soundRef.current.setVolumeAsync(isMuted ? 0 : clamped).catch(()=>{});
    if (clamped === 0) setIsMuted(true);
    else if (isMuted && clamped > 0) setIsMuted(false);
  };

  const handleMusicChange = async (music) => {
    if (!music) return;
    setSelectedMusic(music);
    setIsMusicPaused(false);
    if (isActive && !isMuted && !isPaused) {
      await stopAndUnloadSound();
      loadSound(music.src);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercentage = totalSessionTime > 0 ? (elapsedTime / totalSessionTime) * 100 : 0;
  const cycleProgressPercentage = totalCycles > 0 ? (completedCycles / totalCycles) * 100 : 0;

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  const isBox = selectedTechnique.id === 'box';
  const breathingShapeStyle = isBox
    ? {
        width: 170,
        height: 170,
        borderRadius: 20,
        borderWidth: 6,
        borderColor: selectedTechnique.color,
        backgroundColor: selectedTechnique.color + '18',
        justifyContent: 'center',
        alignItems: 'center',
        transform: [{ scale: breathingAnim }],
        shadowColor: selectedTechnique.color,
        shadowOpacity: 0.25,
        shadowRadius: 12,
        elevation: 4
      }
    : {
        width: 160,
        height: 160,
        borderRadius: 80,
        backgroundColor: selectedTechnique.color + '33',
        justifyContent: 'center',
        alignItems: 'center',
        transform: [{ scale: breathingAnim }],
      };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <Modal visible={showResumeModal} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ backgroundColor: '#fff', borderRadius: 28, padding: 26, width: '90%', maxWidth: 420 }}>
            <Text style={{ fontFamily: fonts.bold, fontSize: 22, color: colors.text, textAlign: 'center', marginBottom: 12 }}>Continue Session?</Text>
            <Text style={{ fontFamily: fonts.regular, color: colors.textSecondary, textAlign: 'center', marginBottom: 18 }}>
              You have an unfinished breathing session. Continue where you left off or start over.
            </Text>
            <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 14 }}>
              <TouchableOpacity
                onPress={resumeSession}
                style={{ backgroundColor: colors.primary, paddingVertical: 12, paddingHorizontal: 26, borderRadius: 18, marginRight: 10 }}
              >
                <Text style={{ color: '#fff', fontFamily: fonts.bold, fontSize: 16 }}>Continue</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={resetSession}
                style={{ backgroundColor: colors.surface, paddingVertical: 12, paddingHorizontal: 26, borderRadius: 18, borderWidth: 1.5, borderColor: colors.primary }}
              >
                <Text style={{ color: colors.primary, fontFamily: fonts.bold, fontSize: 16 }}>Start Over</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <View style={{ paddingHorizontal: 20, paddingTop: 48, paddingBottom: 8, flexDirection: 'row', alignItems: 'center' }}>
        <TouchableOpacity
          style={{
            width: 42, height: 42, borderRadius: 24, backgroundColor: colors.surface,
            justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: colors.border
          }}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={{ fontSize: 27, fontFamily: fonts.bold, color: colors.text, textAlign: 'center', letterSpacing: 0.1 }}>
            Breathing Exercises
          </Text>
          <View style={{ flexDirection: 'row', marginTop: 10, justifyContent: 'center' }}>
            <TouchableOpacity
              onPress={() => setShowInfo(true)}
              style={{
                width: 44, height: 44, borderRadius: 22, backgroundColor: colors.surface,
                justifyContent: 'center', alignItems: 'center', marginHorizontal: 8, borderWidth: 1, borderColor: selectedTechnique.color + '66'
              }}
            >
              <Ionicons name="information-circle" size={24} color={selectedTechnique.color} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setShowProgressModal(true)}
              style={{
                width: 44, height: 44, borderRadius: 22, backgroundColor: colors.surface,
                justifyContent: 'center', alignItems: 'center', marginHorizontal: 8, borderWidth: 1, borderColor: colors.primary + '66'
              }}
            >
              <Ionicons name="stats-chart" size={22} color={colors.primary} />
            </TouchableOpacity>
          </View>
        </View>
        <View style={{ width: 42 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 50 }}>
        <Text style={{ color: colors.text, fontFamily: fonts.bold, fontSize: 18, marginBottom: 8, textAlign: 'center' }}>Session Duration</Text>
        <FlatList
          data={DURATION_OPTIONS}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={item => item.value.toString()}
          style={{ marginBottom: 22 }}
          contentContainerStyle={{ gap: 12, paddingHorizontal: 6, justifyContent: 'center' }}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => changeDuration(item)}
              disabled={isActive}
              style={{
                paddingVertical: 12,
                paddingHorizontal: 18,
                borderRadius: 18,
                backgroundColor: selectedDuration.value === item.value ? selectedTechnique.color + '18' : colors.surface,
                borderWidth: 2,
                borderColor: selectedDuration.value === item.value ? selectedTechnique.color : colors.border,
                minWidth: 88,
                alignItems: 'center'
              }}
            >
              <Text style={{ fontFamily: fonts.bold, color: colors.text, fontSize: 15 }}>{item.label}</Text>
              <Text style={{ fontFamily: fonts.regular, color: colors.textSecondary, fontSize: 11 }}>≈ {item.cycles} cycles</Text>
            </TouchableOpacity>
          )}
        />

        <Text style={{ color: colors.text, fontFamily: fonts.bold, fontSize: 18, marginBottom: 10, textAlign: 'center' }}>Choose Your Technique</Text>
        <View style={{ marginBottom: 24 }}>
          {BREATHING_TECHNIQUES.map(technique => {
            const active = selectedTechnique.id === technique.id;
            return (
              <TouchableOpacity
                key={technique.id}
                onPress={() => changeTechnique(technique)}
                disabled={isActive}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  padding: 18,
                  borderRadius: 20,
                  marginBottom: 14,
                  backgroundColor: active ? technique.color + '20' : colors.surface,
                  borderWidth: active ? 2 : 1,
                  borderColor: active ? technique.color : colors.border,
                  shadowColor: technique.color,
                  shadowOpacity: active ? 0.15 : 0,
                  shadowRadius: 10,
                }}
              >
                <View
                  style={{
                    width: 54,
                    height: 54,
                    borderRadius: 16,
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginRight: 16,
                  }}
                >
                  <Text style={{ fontSize: 28, fontFamily: fonts.bold }}>{technique.icon}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: fonts.bold, color: colors.text, fontSize: 17, marginBottom: 4 }}>{technique.name}</Text>
                  <Text style={{ fontFamily: fonts.regular, color: colors.textSecondary, fontSize: 13 }}>{technique.description}</Text>
                </View>
                {active && <Ionicons name="checkmark-circle" size={26} color={technique.color} />}
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={{ alignItems: 'center', justifyContent: 'center', marginBottom: 30 }}>
          <Animated.View style={breathingShapeStyle}>
            <Text style={{ fontSize: 48, color: selectedTechnique.color, fontFamily: fonts.bold, marginBottom: 4, textAlign: 'center' }}>{count}</Text>
            <Text style={{ fontSize: 22, color: selectedTechnique.color, fontFamily: fonts.semiBold, textAlign: 'center' }}>{phase}</Text>
          </Animated.View>
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: 24 }}>
          {!isActive ? (
            <TouchableOpacity
              onPress={startSession}
              style={{
                backgroundColor: selectedTechnique.color,
                paddingVertical: 16,
                paddingHorizontal: 42,
                flexDirection: 'row',
                alignItems: 'center',
                elevation: 4,
                borderRadius: 32,
              }}
            >
              <Ionicons name="play" size={24} color="#fff" style={{ marginRight: 10 }} />
              <Text style={{ color: '#fff', fontFamily: fonts.bold, fontSize: 18, letterSpacing: 0.5 }}>Start Session</Text>
            </TouchableOpacity>
          ) : (
            <>
              <TouchableOpacity
                onPress={togglePause}
                style={{
                  backgroundColor: selectedTechnique.color,
                  paddingVertical: 14,
                  paddingHorizontal: 30,
                  borderRadius: 32,
                  marginRight: 12,
                  flexDirection: 'row',
                  alignItems: 'center',
                  shadowColor: selectedTechnique.color,
                  shadowOpacity: 0.25,
                  shadowRadius: 10,
                  elevation: 4
                }}
              >
                <Ionicons name={isPaused ? 'play' : 'pause'} size={22} color="#fff" style={{ marginRight: 8 }} />
                <Text style={{ color: '#fff', fontFamily: fonts.bold, fontSize: 17 }}>{isPaused ? 'Resume' : 'Pause'}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={resetSession}
                style={{
                  backgroundColor: colors.surface,
                  paddingVertical: 14,
                  paddingHorizontal: 30,
                  borderRadius: 32,
                  flexDirection: 'row',
                  alignItems: 'center',
                  borderWidth: 1.5,
                  borderColor: selectedTechnique.color + '88'
                }}
              >
                <Ionicons name="refresh" size={22} color={selectedTechnique.color} style={{ marginRight: 8 }} />
                <Text style={{ color: selectedTechnique.color, fontFamily: fonts.bold, fontSize: 17 }}>Reset</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {(isActive || completedCycles > 0) && (
          <View style={{
            backgroundColor: colors.surface,
            borderRadius: 20,
            padding: 18,
            marginBottom: 26,
          }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14 }}>
              <View style={{ alignItems: 'center', flex: 1 }}>
                <Text style={{ fontSize: 20, fontFamily: fonts.bold, color: colors.text, textAlign: 'center' }}>{formatTime(elapsedTime)}</Text>
                <Text style={{ fontSize: 12, color: colors.textSecondary, textAlign: 'center' }}>of {formatTime(totalSessionTime)}</Text>
              </View>
              <View style={{ alignItems: 'center', flex: 1 }}>
                <Text style={{ fontSize: 20, fontFamily: fonts.bold, color: colors.text, textAlign: 'center' }}>{completedCycles} / {totalCycles}</Text>
                <Text style={{ fontSize: 12, color: colors.textSecondary, textAlign: 'center' }}>Cycles</Text>
              </View>
              <View style={{ alignItems: 'center', flex: 1 }}>
                <Text style={{ fontSize: 18, fontFamily: fonts.bold, color: selectedTechnique.color, textAlign: 'center' }}>{phase}</Text>
                <Text style={{ fontSize: 12, color: colors.textSecondary, textAlign: 'center' }}>Phase</Text>
              </View>
            </View>
            <View style={{ marginBottom: 12, alignItems: 'center' }}>
              <Text style={{ color: colors.text, fontFamily: fonts.medium, marginBottom: 6, textAlign: 'center' }}>Time Progress</Text>
              <View style={{ height: 8, backgroundColor: colors.border, borderRadius: 4, width: '100%' }}>
                <View style={{ height: 8, borderRadius: 4, backgroundColor: selectedTechnique.color, width: `${Math.min(progressPercentage, 100)}%` }} />
              </View>
            </View>
            <View style={{ alignItems: 'center' }}>
              <Text style={{ color: colors.text, fontFamily: fonts.medium, marginBottom: 6, textAlign: 'center' }}>Cycle Progress</Text>
              <View style={{ height: 8, backgroundColor: colors.border, borderRadius: 4, width: '100%' }}>
                <View style={{ height: 8, borderRadius: 4, backgroundColor: selectedTechnique.color, width: `${Math.min(cycleProgressPercentage, 100)}%` }} />
              </View>
            </View>
          </View>
        )}

        <View style={{
          borderRadius: 24,
          overflow: 'hidden',
          marginBottom: 30,
          shadowColor: '#000',
          shadowOpacity: 0.12,
          shadowRadius: 12,
          elevation: 3,
          backgroundColor: '#1e1f26',
          padding: 20,
          borderWidth: 1,
          borderColor: '#2e323b'
        }}>

            {selectedMusic && (
              <View style={{
                backgroundColor: '#ffffff11',
                padding: 14,
                borderRadius: 16,
                marginBottom: 18,
                borderWidth: 1,
                borderColor: '#ffffff22'
              }}>
                <Text style={{ fontFamily: fonts.bold, fontSize: 16, color: '#fff', marginBottom: 6, textAlign: 'center' }}>
                  {selectedMusic.name}
                </Text>
                <View style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: 10 }}>
                  <TouchableOpacity
                    onPress={toggleMusicPause}
                    style={{
                      width: 50, height: 50, borderRadius: 25, backgroundColor: '#ffffff22',
                      justifyContent: 'center', alignItems: 'center', marginHorizontal: 8
                    }}
                  >
                    <Ionicons name={isMusicPaused ? 'play' : 'pause'} size={24} color="#fff" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={toggleMute}
                    style={{
                      width: 50, height: 50, borderRadius: 25, backgroundColor: '#ffffff22',
                      justifyContent: 'center', alignItems: 'center', marginHorizontal: 8
                    }}
                  >
                    <Ionicons name={isMuted ? 'volume-mute' : 'volume-high'} size={24} color="#fff" />
                  </TouchableOpacity>
                </View>
                <View style={{ alignItems: 'center', marginBottom: 6 }}>
                  <Text style={{ color: '#ddd', fontFamily: fonts.medium, fontSize: 12, marginBottom: 6 }}>Volume {Math.round((isMuted ? 0 : volume) * 100)}%</Text>
                  <View style={{ width: '100%', height: 10, backgroundColor: '#ffffff22', borderRadius: 6, overflow: 'hidden' }}>
                    <View style={{
                      width: `${(isMuted ? 0 : volume) * 100}%`,
                      backgroundColor: selectedMusic.color,
                      height: 10
                    }} />
                  </View>
                  <View style={{ flexDirection: 'row', marginTop: 8 }}>
                    <TouchableOpacity onPress={() => handleVolumeChange(volume - 0.1)} style={{ paddingHorizontal: 14, paddingVertical: 6 }}>
                      <Text style={{ color: '#fff', fontSize: 20 }}>−</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleVolumeChange(volume + 0.1)} style={{ paddingHorizontal: 14, paddingVertical: 6 }}>
                      <Text style={{ color: '#fff', fontSize: 20 }}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>
                {!isActive && (
                  <Text style={{ color: '#bbb', fontFamily: fonts.regular, fontSize: 12, textAlign: 'center' }}>
                    Music starts when the breathing session begins.
                  </Text>
                )}
              </View>
            )}

          <Text style={{ color: '#eee', fontFamily: fonts.medium, marginBottom: 8, textAlign: 'center' }}>Select Track</Text>
          <FlatList
            data={musicOptions}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={item => item.id}
            contentContainerStyle={{ gap: 12, paddingVertical: 4 }}
            renderItem={({ item }) => {
              const active = selectedMusic && selectedMusic.id === item.id;
              return (
                <TouchableOpacity
                  onPress={() => handleMusicChange(item)}
                  style={{
                    paddingVertical: 10,
                    paddingHorizontal: 16,
                    borderRadius: 18,
                    backgroundColor: active ? item.color : '#2a2f38',
                    borderWidth: active ? 2 : 1,
                    borderColor: active ? '#ffffffaa' : '#3d434e',
                    minWidth: 140,
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Text style={{
                    color: active ? '#1e1f26' : '#fff',
                    fontFamily: fonts.bold,
                    fontSize: 13,
                    textAlign: 'center'
                  }}>{item.name}</Text>
                  <Ionicons
                    name={active ? 'checkmark-circle' : 'musical-note'}
                    size={20}
                    color={active ? '#1e1f26' : '#ffffffcc'}
                    style={{ marginTop: 4 }}
                  />
                </TouchableOpacity>
              );
            }}
          />
        </View>
      </ScrollView>

      <Modal visible={showInfo} animationType="slide" transparent>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ backgroundColor: '#fff', borderRadius: 28, padding: 26, width: '90%', maxHeight: '82%' }}>
            <Text style={{ fontFamily: fonts.bold, fontSize: 24, color: colors.text, marginBottom: 14, textAlign: 'center' }}>About {selectedTechnique.name}</Text>
            <Text style={{ fontFamily: fonts.regular, color: colors.textSecondary, marginBottom: 10, textAlign: 'center' }}>{selectedTechnique.description}</Text>
            <Text style={{ fontFamily: fonts.bold, color: colors.text, marginBottom: 8, textAlign: 'center' }}>Benefits</Text>
            {selectedTechnique.benefits.map((b, i) => (
              <Text key={i} style={{ fontFamily: fonts.regular, color: colors.textSecondary, marginBottom: 4, textAlign: 'center' }}>• {b}</Text>
            ))}
            <Text style={{ fontFamily: fonts.bold, color: colors.text, marginTop: 14, marginBottom: 8, textAlign: 'center' }}>Instructions</Text>
            {selectedTechnique.phases.map((p, i) => (
              <Text key={i} style={{ fontFamily: fonts.regular, color: colors.textSecondary, marginBottom: 4, textAlign: 'center' }}>
                {p} for {selectedTechnique.durations[i]} seconds
              </Text>
            ))}
            <TouchableOpacity
              onPress={() => setShowInfo(false)}
              style={{ marginTop: 18, backgroundColor: colors.primary, paddingVertical: 14, borderRadius: 20, alignItems: 'center' }}
            >
              <Text style={{ color: '#fff', fontFamily: fonts.bold, fontSize: 16 }}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <ProgressModal
        visible={showProgressModal}
        onClose={() => setShowProgressModal(false)}
        streak={streak}
        totalSessions={totalSessions}
        techniqueProgress={techniqueProgress}
        techniques={BREATHING_TECHNIQUES}
      />

      <CompletionModal
        visible={showCompletionModal}
        onClose={() => setShowCompletionModal(false)}
        technique={selectedTechnique}
        duration={selectedDuration}
        streak={streak}
        onRestartSession={startSession}
        onViewProgress={() => {
          setShowCompletionModal(false);
          setShowProgressModal(true);
        }}
      />
    </SafeAreaView>
  );
};

export default BreathingExercises;