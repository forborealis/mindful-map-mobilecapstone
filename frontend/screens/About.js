import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { fonts } from '../utils/fonts/fonts';
import { colors } from '../utils/colors/colors';

const sncsLogo = require('../assets/images/sncs.png');
const appLogo = require('../assets/images/login/logo.png');

const values = [
  {
    title: 'Privacy-first',
    description:
      'Your entries are personal. We design features to respect your data and your boundaries.',
  },
  {
    title: 'Supportive by design',
    description:
      'Calm UI, gentle wording, and thoughtful prompts—made to feel safe and encouraging.',
  },
  {
    title: 'Clarity over complexity',
    description:
      'Insights should be understandable and actionable, not overwhelming.',
  },
];

const featureCards = [
  {
    icon: { lib: 'ion', name: 'happy-outline' },
    title: 'Mood Tracking',
    description:
      'Log daily moods with detailed emotions and intensity. Spot patterns over time and understand what affects you.',
  },
  {
    icon: { lib: 'ion', name: 'trending-up-outline' },
    title: 'Activity Insights',
    description:
      'Connect emotions with activities. Learn what helps, what drains you, and what routines support your well-being.',
  },
  {
    icon: { lib: 'ion', name: 'bar-chart-outline' },
    title: 'Personalized Analytics',
    description:
      'Turn your entries into meaningful visuals and insights to support reflection and healthier emotional habits.',
  },
];

const partnershipHighlights = [
  {
    title: 'Student-centered approach',
    description:
      'Designed to support healthy reflection and emotional awareness in a school setting.',
  },
  {
    title: 'Real-world impact',
    description:
      'Built with practical use in mind—simple, guided, and easy to sustain.',
  },
  {
    title: 'Supportive environment',
    description:
      'Encourages gentle routines that complement wellness initiatives.',
  },
];

export default function About() {
  const navigation = useNavigation();
  const scrollRef = useRef(null);
  const [featuresY, setFeaturesY] = useState(0);
  const [partnershipY, setPartnershipY] = useState(0);

  const scrollToFeatures = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ y: featuresY, animated: true });
    }
  };

  const scrollToPartnership = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ y: partnershipY, animated: true });
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar backgroundColor={colors.primary} barStyle="light-content" />

      {/* Top Nav (similar feel to web) */}
      <View
        style={{
          backgroundColor: colors.primary,
          paddingTop: 50,
          paddingBottom: 12,
          paddingHorizontal: 20,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          shadowColor: '#000',
          shadowOpacity: 0.15,
          shadowOffset: { width: 0, height: 4 },
          shadowRadius: 8,
          elevation: 6,
        }}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{ padding: 6, marginRight: 8 }}
        >
          <Ionicons name="arrow-back" size={22} color={colors.creamWhite} />
        </TouchableOpacity>

        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontFamily: fonts.bold,
              fontSize: 22,
              color: colors.creamWhite,
              textAlign: 'center',
            }}
          >
            Mindful Map
          </Text>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity
            onPress={() => navigation.navigate('Signup')}
            style={{
              paddingHorizontal: 14,
              paddingVertical: 7,
              borderRadius: 999,
              backgroundColor: colors.creamWhite,
              flexDirection: 'row',
              alignItems: 'center',
            }}
          >
            <Text
              style={{
                fontFamily: fonts.semiBold,
                fontSize: 13,
                color: colors.primary,
                marginRight: 4,
              }}
            >
              Sign Up
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        ref={scrollRef}
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <View
          style={{
            paddingHorizontal: 20,
            paddingTop: 28,
            paddingBottom: 16,
            alignItems: 'center',
          }}
        >
          <View style={{ marginBottom: 14, width: '100%' }}>
            <Text
              style={{
                fontFamily: fonts.bold,
                fontSize: 32,
                color: '#111827',
                textAlign: 'center',
              }}
            >
              About Mindful Map
            </Text>
          </View>

          <Image
            source={appLogo}
            resizeMode="contain"
            style={{
              width: 200,
              height: 200,
              marginBottom: 16,
            }}
          />

          <Text
            style={{
              fontFamily: fonts.regular,
              fontSize: 15,
              color: '#4B5563',
              lineHeight: 22,
              marginBottom: 18,
              textAlign: 'justify',
              width: '100%',
            }}
          >
            Mindful Map is built to help you understand your emotions through gentle
            tracking, reflective journaling, and clear insights—so you can build
            healthier habits one day at a time.
          </Text>

          <View
            style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              gap: 10,
              marginTop: 6,
              marginBottom: 8,
              width: '100%',
              justifyContent: 'center',
            }}
          >
            <TouchableOpacity
              onPress={() => navigation.navigate('Signup')}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 18,
                paddingVertical: 10,
                borderRadius: 999,
                backgroundColor: colors.primary,
                shadowColor: colors.primary,
                shadowOpacity: 0.3,
                shadowOffset: { width: 0, height: 4 },
                shadowRadius: 8,
                elevation: 4,
              }}
            >
              <Text
                style={{
                  fontFamily: fonts.semiBold,
                  fontSize: 14,
                  color: colors.creamWhite,
                  marginRight: 6,
                }}
              >
                Explore Now
              </Text>
              <Ionicons
                name="arrow-forward-circle-outline"
                size={18}
                color={colors.creamWhite}
              />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={scrollToFeatures}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 18,
                paddingVertical: 10,
                borderRadius: 999,
                borderWidth: 2,
                borderColor: colors.primary,
                backgroundColor: 'rgba(255,255,255,0.9)',
              }}
            >
              <Text
                style={{
                  fontFamily: fonts.semiBold,
                  fontSize: 14,
                  color: colors.primary,
                  marginRight: 6,
                }}
              >
                See Features
              </Text>
              <MaterialIcons
                name="keyboard-arrow-down"
                size={18}
                color={colors.primary}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Mission & Values */}
        <View style={{ paddingHorizontal: 20, marginBottom: 22 }}>
          <View
            style={{
              backgroundColor: 'rgba(255,255,255,0.9)',
              borderRadius: 24,
              borderWidth: 1,
              borderColor: '#95D2B355',
              padding: 18,
              shadowColor: '#000',
              shadowOpacity: 0.07,
              shadowOffset: { width: 0, height: 4 },
              shadowRadius: 10,
              elevation: 3,
            }}
          >
            <View style={{ marginBottom: 14 }}>
              <Text
                style={{
                  fontFamily: fonts.bold,
                  fontSize: 22,
                  color: '#111827',
                  marginBottom: 6,
                }}
              >
                Our Mission
              </Text>
              <Text
                style={{
                  fontFamily: fonts.regular,
                  fontSize: 14,
                  color: '#4B5563',
                  lineHeight: 21,
                }}
              >
                To make emotional reflection simple, supportive, and consistent—
                through tools that help people notice patterns, name feelings, and
                take small steps toward better well-being.
              </Text>
            </View>

            <View
              style={{
                flexDirection: 'row',
                flexWrap: 'wrap',
                marginHorizontal: -4,
              }}
            >
              {values.map((v) => (
                <View
                  key={v.title}
                  style={{
                    width: '100%',
                    paddingHorizontal: 4,
                    marginBottom: 8,
                  }}
                >
                  <View
                    style={{
                      borderRadius: 18,
                      borderWidth: 1,
                      borderColor: '#D8EFD3',
                      backgroundColor: 'rgba(255,255,255,0.95)',
                      padding: 12,
                    }}
                  >
                    <Text
                      style={{
                        fontFamily: fonts.semiBold,
                        fontSize: 14,
                        color: colors.primary,
                        marginBottom: 4,
                      }}
                    >
                      {v.title}
                    </Text>
                    <Text
                      style={{
                        fontFamily: fonts.regular,
                        fontSize: 13,
                        color: '#4B5563',
                        lineHeight: 19,
                      }}
                    >
                      {v.description}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Features */}
        <View
          onLayout={(e) => setFeaturesY(e.nativeEvent.layout.y - 60)}
          style={{
            backgroundColor: 'rgba(255,255,255,0.7)',
            borderTopWidth: 1,
            borderBottomWidth: 1,
            borderColor: '#95D2B355',
            paddingVertical: 22,
            paddingHorizontal: 20,
          }}
        >
          <View style={{ alignItems: 'center', marginBottom: 18 }}>
            <Text
              style={{
                fontFamily: fonts.bold,
                fontSize: 26,
                color: '#111827',
                textAlign: 'center',
              }}
            >
              How Mindful Map
            </Text>
            <Text
              style={{
                fontFamily: fonts.bold,
                fontSize: 26,
                color: colors.primary,
                textAlign: 'center',
              }}
            >
              Works for You
            </Text>
            <View
              style={{
                width: 80,
                height: 4,
                borderRadius: 999,
                backgroundColor: colors.primary,
                marginTop: 8,
              }}
            />
            <Text
              style={{
                fontFamily: fonts.regular,
                fontSize: 14,
                color: '#4B5563',
                textAlign: 'center',
                marginTop: 8,
              }}
            >
              A calm, guided experience that turns daily check-ins into clarity
              you can use.
            </Text>
          </View>

          <View
            style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              justifyContent: 'center',
            }}
          >
            {featureCards.map((feat) => (
              <View
                key={feat.title}
                style={{
                  width: '100%',
                  marginBottom: 14,
                }}
              >
                <View
                  style={{
                    borderRadius: 24,
                    borderWidth: 1,
                    borderColor: '#95D2B355',
                    backgroundColor: 'rgba(255,255,255,0.95)',
                    paddingVertical: 16,
                    paddingHorizontal: 16,
                    shadowColor: '#000',
                    shadowOpacity: 0.06,
                    shadowOffset: { width: 0, height: 4 },
                    shadowRadius: 8,
                    elevation: 3,
                    alignItems: 'center',
                  }}
                >
                  <View
                    style={{
                      width: 72,
                      height: 72,
                      borderRadius: 24,
                      backgroundColor: '#F1F8E8',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: 10,
                    }}
                  >
                    <Ionicons
                      name={feat.icon.name}
                      size={36}
                      color={colors.primary}
                    />
                  </View>
                  <Text
                    style={{
                      fontFamily: fonts.semiBold,
                      fontSize: 18,
                      color: colors.primary,
                      marginBottom: 6,
                      textAlign: 'center',
                    }}
                  >
                    {feat.title}
                  </Text>
                  <Text
                    style={{
                      fontFamily: fonts.regular,
                      fontSize: 14,
                      color: '#4B5563',
                      textAlign: 'center',
                      lineHeight: 21,
                    }}
                  >
                    {feat.description}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Partnership */}
        <View
          onLayout={(e) => setPartnershipY(e.nativeEvent.layout.y - 60)}
          style={{
            backgroundColor: 'rgba(255,255,255,0.7)',
            borderBottomWidth: 1,
            borderColor: '#95D2B355',
            paddingVertical: 22,
            paddingHorizontal: 20,
          }}
        >
          <View style={{ alignItems: 'center', marginBottom: 18 }}>
            <Text
              style={{
                fontFamily: fonts.bold,
                fontSize: 24,
                color: colors.primary,
                textAlign: 'center',
              }}
            >
              Built in Partnership With
            </Text>
            <Text
              style={{
                fontFamily: fonts.bold,
                fontSize: 24,
                color: '#111827',
                textAlign: 'center',
              }}
            >
              Sto. Niño Catholic School Inc.
            </Text>
            <View
              style={{
                width: 80,
                height: 4,
                borderRadius: 999,
                backgroundColor: colors.primary,
                marginTop: 8,
              }}
            />
          </View>

          {/* Two-column style stacked on mobile */}
          <View>
            {/* Left card */}
            <View
              style={{
                borderRadius: 24,
                borderWidth: 1,
                borderColor: '#95D2B355',
                backgroundColor: 'rgba(255,255,255,0.95)',
                padding: 16,
                marginBottom: 14,
                shadowColor: '#000',
                shadowOpacity: 0.06,
                shadowOffset: { width: 0, height: 4 },
                shadowRadius: 8,
                elevation: 3,
              }}
            >
              <Text
                style={{
                  fontFamily: fonts.bold,
                  fontSize: 18,
                  color: colors.primary,
                  marginBottom: 6,
                  textAlign: 'center',
                }}
              >
                A grounded collaboration
              </Text>
              <Text
                style={{
                  fontFamily: fonts.regular,
                  fontSize: 14,
                  color: '#4B5563',
                  lineHeight: 21,
                  marginBottom: 10,
                  textAlign: 'justify',
                }}
              >
                This partnership helps ensure Mindful Map stays practical,
                supportive, and appropriate in a school setting.
              </Text>

              {partnershipHighlights.map((h) => (
                <View
                  key={h.title}
                  style={{ flexDirection: 'row', marginBottom: 6 }}
                >
                  <View
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 999,
                      backgroundColor: colors.primary,
                      marginTop: 6,
                      marginRight: 8,
                    }}
                  />
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontFamily: fonts.semiBold,
                        fontSize: 14,
                        color: colors.primary,
                      }}
                    >
                      {h.title}
                    </Text>
                    <Text
                      style={{
                        fontFamily: fonts.regular,
                        fontSize: 13,
                        color: '#4B5563',
                        lineHeight: 19,
                      }}
                    >
                      {h.description}
                    </Text>
                  </View>
                </View>
              ))}
            </View>

            {/* Right card: SNCS logo */}
            <View
              style={{
                borderRadius: 24,
                borderWidth: 1,
                borderColor: '#95D2B355',
                backgroundColor: 'rgba(255,255,255,0.95)',
                padding: 16,
                shadowColor: '#000',
                shadowOpacity: 0.06,
                shadowOffset: { width: 0, height: 4 },
                shadowRadius: 8,
                elevation: 3,
              }}
            >
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  marginBottom: 10,
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontFamily: fonts.semiBold,
                      fontSize: 19,
                      color: colors.primary,
                      textAlign: 'center',
                    }}
                  >
                    Sto. Niño Catholic School Inc.
                  </Text>
                </View>
              </View>

              <View
                style={{
                  borderRadius: 18,
                  borderWidth: 1,
                  borderColor: '#D8EFD3',
                  backgroundColor: '#FFFFFF',
                  padding: 12,
                  alignItems: 'center',
                  marginBottom: 10,
                }}
              >
                <Image
                  source={sncsLogo}
                  resizeMode="contain"
                  style={{ width: 200, height: 160 }}
                />
              </View>

              <Text
                style={{
                  fontFamily: fonts.regular,
                  fontSize: 13,
                  color: '#4B5563',
                  lineHeight: 19,
                  textAlign: 'justify',
                }}
              >
                Working together to support calm, consistent emotional reflection—
                without adding pressure.
              </Text>
            </View>
          </View>
        </View>

        {/* Call to Action */}
        <View
          style={{
            backgroundColor: colors.primary,
            paddingHorizontal: 20,
            paddingVertical: 26,
            marginTop: 8,
          }}
        >
          <Text
            style={{
              fontFamily: fonts.bold,
              fontSize: 24,
              color: colors.creamWhite,
              textAlign: 'center',
              marginBottom: 8,
            }}
          >
            Ready to Start?
          </Text>
          <Text
            style={{
              fontFamily: fonts.regular,
              fontSize: 15,
              color: 'rgba(241,248,232,0.9)',
              textAlign: 'center',
              lineHeight: 22,
              marginBottom: 18,
            }}
          >
            Begin your journey with tools designed to help you reflect, track, and
            grow—one day at a time.
          </Text>

          <View style={{ alignItems: 'center' }}>
            <TouchableOpacity
              onPress={() => navigation.navigate('Signup')}
              style={{
                paddingHorizontal: 24,
                paddingVertical: 12,
                borderRadius: 999,
                backgroundColor: colors.creamWhite,
                flexDirection: 'row',
                alignItems: 'center',
                shadowColor: '#000',
                shadowOpacity: 0.25,
                shadowOffset: { width: 0, height: 4 },
                shadowRadius: 10,
                elevation: 5,
              }}
            >
              <Text
                style={{
                  fontFamily: fonts.bold,
                  fontSize: 15,
                  color: colors.primary,
                  marginRight: 6,
                }}
              >
                Begin Your Journey Today
              </Text>

            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}