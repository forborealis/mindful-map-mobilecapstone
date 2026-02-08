// ...existing code...
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
  StatusBar,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { fonts } from '../../utils/fonts/fonts';
import { colors } from '../../utils/colors/colors';

const cardShadow = {
  shadowColor: '#000',
  shadowOpacity: 0.08,
  shadowRadius: 8,
  shadowOffset: { width: 0, height: 3 },
  elevation: 3,
};

const MentalHealthResources = ({ navigation }) => {
  const [expandedId, setExpandedId] = useState(null);

  const resources = [
    {
      id: 1,
      name: 'CHO Taguig',
      subtitle: 'Mental Health Clinic and Online Service',
      availability: 'Weekdays, 8:00 am - 5:00 pm',
      classification: 'Government',
      contact: {
        phone: ['0929-521-8373', '0967-039-3456'],
        email: 'mhptaguig@gmail.com',
        address: 'Lakeshore, C6, Lower Bicutan, Taguig City, NCR',
        website:
          'https://mentalhealthph.org/directory/listing/cho-taguig-mental-health-clinic-and-online-service/',
      },
      categories: [
        'Crisis Hotline',
        'Advocacy Group',
        'Online Services / Telemental Health',
      ],
      deliveryMode: 'Hybrid',
      services: [
        'Consultation',
        'Counseling / Therapy',
        'Information Dissemination',
        'Medication',
        'Psychological Assessment',
      ],
      mhpssLevel: 'Level 4 – Specialised Mental Health Care',
    },
    {
      id: 2,
      name: 'National Center for Mental Health',
      subtitle: 'Crisis Hotline & Hospital Services',
      availability: 'Anytime, 24/7',
      classification: 'Government',
      contact: {
        phone: ['0919-057-1553', '0918-639-2672', '0917-899-8727', '0966-351-4518'],
        telNo: ['8531-9001', '(02) 7-989-8727'],
        nationwide: [{ number: '(02) 1553', type: 'Toll-free' }],
        phoneByProvider: [
          { number: '0919-057-1553', type: 'Smart/TNT' },
          { number: '0918-639-2672', type: 'Smart/TNT' },
          { number: '0917-899-8727', type: 'Globe/TM' },
          { number: '0966-351-4518', type: 'Globe/TM' },
        ],
        email: 'mcc@ncmh.gov.ph',
        address: 'Nueve de Pebrero Street, Mauway, Mandaluyong City, NCR',
        website: 'https://ncmh.gov.ph/',
      },
      categories: ['Crisis Hotline', 'Hospital'],
      deliveryMode: 'Hybrid',
      services: [
        'Consultation',
        'Counseling / Therapy',
        'Emergency Services',
        'Information Dissemination',
        'Medication',
        'Psychological Assessment',
        'Training',
      ],
      mhpssLevel: 'Level 4 – Specialised Mental Health Care',
    },
  ];

  const handlePhoneClick = (phone) => {
    Linking.openURL(`tel:${phone}`).catch(() => {
      Alert.alert('Cannot make call', 'Phone calling not available on this device');
    });
  };

  const handleEmailClick = (email) => {
    Linking.openURL(`mailto:${email}`).catch(() => {
      Alert.alert('Cannot send email', 'Email not available on this device');
    });
  };

  const handleWebsiteClick = (website) => {
    Linking.openURL(website).catch(() => {
      Alert.alert('Cannot open website', 'Unable to open the website');
    });
  };

  const toggleExpanded = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar backgroundColor={colors.primary} barStyle="light-content" />

      {/* Header */}
      <View
        style={{
          backgroundColor: colors.primary,
          paddingTop: 50,
          paddingBottom: 18,
          paddingHorizontal: 16,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          ...cardShadow,
        }}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{
            paddingRight: 10,
            paddingVertical: 4,
          }}
        >
          <MaterialCommunityIcons
            name="arrow-left"
            size={26}
            color={colors.creamWhite}
          />
        </TouchableOpacity>
        <Text
          style={{
            fontSize: 22,
            fontFamily: fonts.bold,
            color: colors.creamWhite,
            flex: 1,
            marginLeft: 6,
          }}
          numberOfLines={1}
        >
          Mental Health Resources
        </Text>
      </View>

      {/* Content */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 30, paddingTop: 10 }}
      >
        {/* Crisis Banner - At Top */}
        <View style={{ paddingHorizontal: 16, paddingVertical: 8 }}>
          <View
            style={{
              backgroundColor: colors.white,
              padding: 16,
              borderRadius: 14,
              borderLeftWidth: 4,
              borderLeftColor: colors.primary,
              ...cardShadow,
            }}
          >
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginBottom: 6,
              }}
            >
              <MaterialCommunityIcons
                name="alert-circle-outline"
                size={24}
                color={colors.primary}
                style={{ marginRight: 8 }}
              />
              <Text
                style={{
                  fontSize: 19,
                  fontFamily: fonts.semiBold,
                  color: colors.text,
                }}
              >
                Need Immediate Help?
              </Text>
            </View>
            <Text
              style={{
                fontSize: 15,
                fontFamily: fonts.regular,
                color: colors.text,
                lineHeight: 18,
                opacity: 0.85,
                textAlign: 'justify',
              }}
            >
              Call the National Center for Mental Health Crisis Hotline at{' '}
              <Text
                style={{
                  fontFamily: fonts.semiBold,
                  color: colors.primary,
                }}
              >
                (02) 1553
              </Text>{' '}
              available 24/7.
            </Text>
          </View>
        </View>

        {/* Intro Section */}
        <View style={{ paddingHorizontal: 20, paddingVertical: 14 }}>
          <Text
            style={{
              fontSize: 15,
              fontFamily: fonts.regular,
              color: colors.text,
              lineHeight: 20,
              opacity: 0.8,
              textAlign: 'justify',
            }}
          >
            You're not alone. Here are trusted mental health resources available
            to support your wellbeing journey.
          </Text>
        </View>

        {/* Resources List */}
        <View style={{ paddingHorizontal: 16 }}>
          {resources.map((resource) => (
            <TouchableOpacity
              key={resource.id}
              onPress={() => toggleExpanded(resource.id)}
              activeOpacity={0.9}
              style={[
                {
                  backgroundColor: colors.white,
                  borderRadius: 16,
                  marginBottom: 14,
                  overflow: 'hidden',
                  borderLeftWidth: 4,
                  borderLeftColor: colors.primary,
                },
                cardShadow,
              ]}
            >
              {/* Resource Header */}
              <View
                style={{
                  padding: 16,
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                }}
              >
                <View style={{ flex: 1, marginRight: 12 }}>
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      marginBottom: 4,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 19,
                        fontFamily: fonts.bold,
                        color: colors.text,
                        flexShrink: 1,
                        flexWrap: 'wrap',
                        lineHeight: 24,
                      }}
                      numberOfLines={2}
                    >
                      {resource.name}
                    </Text>
                    <View style={{ width: 6 }} />
                    <View
                      style={{
                        backgroundColor: colors.accent + '30',
                        paddingHorizontal: 10,
                        paddingVertical: 3,
                        borderRadius: 999,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 11,
                          fontFamily: fonts.semiBold,
                          color: colors.primary,
                          letterSpacing: 0.2,
                        }}
                      >
                        {resource.classification}
                      </Text>
                    </View>
                  </View>
                  {resource.subtitle && (
                    <Text
                      style={{
                        fontSize: 14,
                        fontFamily: fonts.regular,
                        color: colors.text,
                        marginBottom: 8,
                        opacity: 0.85,
                      }}
                    >
                      {resource.subtitle}
                    </Text>
                  )}
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      marginBottom: 8,
                    }}
                  >
                    <MaterialCommunityIcons
                      name="clock-outline"
                      size={16}
                      color={colors.primary}
                      style={{ marginRight: 6 }}
                    />
                    <Text
                      style={{
                        fontSize: 13,
                        fontFamily: fonts.regular,
                        color: colors.text,
                        opacity: 0.7,
                      }}
                    >
                      {resource.availability}
                    </Text>
                  </View>
                  {/* Categories in Header */}
                  {resource.categories && resource.categories.length > 0 && (
                    <View
                      style={{
                        flexDirection: 'row',
                        flexWrap: 'wrap',
                        gap: 6,
                      }}
                    >
                      {resource.categories.map((category, index) => (
                        <View
                          key={index}
                          style={{
                            backgroundColor: colors.accent + '25',
                            paddingHorizontal: 10,
                            paddingVertical: 4,
                            borderRadius: 999,
                          }}
                        >
                          <Text
                            style={{
                              fontSize: 11,
                              fontFamily: fonts.regular,
                              color: colors.primary,
                            }}
                          >
                            {category}
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
                <View
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 14,
                    borderWidth: 1,
                    borderColor: colors.primary + '50',
                    justifyContent: 'center',
                    alignItems: 'center',
                    backgroundColor: colors.primary + '08',
                  }}
                >
                  <MaterialCommunityIcons
                    name={expandedId === resource.id ? 'chevron-up' : 'chevron-down'}
                    size={20}
                    color={colors.primary}
                  />
                </View>
              </View>

              {/* Expanded Details */}
              {expandedId === resource.id && (
                <View
                  style={{
                    borderTopWidth: 1,
                    borderTopColor: colors.primary + '15',
                    paddingTop: 12,
                    paddingHorizontal: 16,
                    paddingBottom: 16,
                    backgroundColor: colors.background,
                  }}
                >
                  {/* Contact Information */}
                  <View style={{ marginTop: 4 }}>
                    <Text
                      style={{
                        fontSize: 13,
                        fontFamily: fonts.semiBold,
                        color: colors.text,
                        marginBottom: 10,
                      }}
                    >
                      Contact Information
                    </Text>

                    {/* Address */}
                    {resource.contact.address && (
                      <View style={{ marginBottom: 14 }}>
                        <View
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            marginBottom: 4,
                          }}
                        >
                          <MaterialCommunityIcons
                            name="map-marker-outline"
                            size={16}
                            color={colors.primary}
                            style={{ marginRight: 6 }}
                          />
                          <Text
                            style={{
                              fontSize: 12,
                              fontFamily: fonts.regular,
                              color: colors.text,
                              opacity: 0.7,
                            }}
                          >
                            Address
                          </Text>
                        </View>
                        <Text
                          style={{
                            fontSize: 13,
                            fontFamily: fonts.regular,
                            color: colors.text,
                            marginLeft: 4,
                            lineHeight: 18,
                          }}
                        >
                          {resource.contact.address}
                        </Text>
                      </View>
                    )}

                    {/* Tel No */}
                    {resource.contact.telNo &&
                      resource.contact.telNo.length > 0 && (
                        <View style={{ marginBottom: 14 }}>
                          <View
                            style={{
                              flexDirection: 'row',
                              alignItems: 'center',
                              marginBottom: 4,
                            }}
                          >
                            <MaterialCommunityIcons
                              name="phone-outline"
                              size={16}
                              color={colors.primary}
                              style={{ marginRight: 6 }}
                            />
                            <Text
                              style={{
                                fontSize: 12,
                                fontFamily: fonts.regular,
                                color: colors.text,
                                opacity: 0.7,
                              }}
                            >
                              Tel. No
                            </Text>
                          </View>
                          {resource.contact.telNo.map((phone, index) => (
                            <TouchableOpacity
                              key={index}
                              onPress={() => handlePhoneClick(phone)}
                              style={{ marginBottom: 4 }}
                            >
                              <Text
                                style={{
                                  fontSize: 13,
                                  fontFamily: fonts.regular,
                                  color: colors.primary,
                                  textDecorationLine: 'underline',
                                  marginLeft: 4,
                                }}
                              >
                                {phone}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      )}

                    {/* Nationwide Landline */}
                    {resource.contact.nationwide &&
                      resource.contact.nationwide.length > 0 && (
                        <View style={{ marginBottom: 14 }}>
                          <View
                            style={{
                              flexDirection: 'row',
                              alignItems: 'center',
                              marginBottom: 4,
                            }}
                          >
                            <MaterialCommunityIcons
                              name="phone-classic"
                              size={16}
                              color={colors.primary}
                              style={{ marginRight: 6 }}
                            />
                            <Text
                              style={{
                                fontSize: 12,
                                fontFamily: fonts.regular,
                                color: colors.text,
                                opacity: 0.7,
                              }}
                            >
                              Nationwide Landline
                            </Text>
                          </View>
                          {resource.contact.nationwide.map((item, index) => (
                            <TouchableOpacity
                              key={index}
                              onPress={() => handlePhoneClick(item.number)}
                              style={{ marginBottom: 4 }}
                            >
                              <Text
                                style={{
                                  fontSize: 13,
                                  fontFamily: fonts.regular,
                                  color: colors.primary,
                                  textDecorationLine: 'underline',
                                  marginLeft: 4,
                                }}
                              >
                                {item.number}{' '}
                                <Text
                                  style={{
                                    fontFamily: fonts.regular,
                                    color: colors.text,
                                    opacity: 0.6,
                                    textDecorationLine: 'none',
                                  }}
                                >
                                  ({item.type})
                                </Text>
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      )}

                    {/* Phone Numbers by Provider - 2 Column Format */}
                    {resource.contact.phoneByProvider &&
                      resource.contact.phoneByProvider.length > 0 && (
                        <View style={{ marginBottom: 14 }}>
                          <View
                            style={{
                              flexDirection: 'row',
                              alignItems: 'center',
                              marginBottom: 6,
                            }}
                          >
                            <MaterialCommunityIcons
                              name="cellphone"
                              size={16}
                              color={colors.primary}
                              style={{ marginRight: 6 }}
                            />
                            <Text
                              style={{
                                fontSize: 12,
                                fontFamily: fonts.regular,
                                color: colors.text,
                                opacity: 0.7,
                              }}
                            >
                              Phone Numbers
                            </Text>
                          </View>
                          <View
                            style={{
                              flexDirection: 'row',
                              gap: 8,
                            }}
                          >
                            {/* Column 1 - Smart/TNT */}
                            <View style={{ flex: 1 }}>
                              {resource.contact.phoneByProvider
                                .filter((item) => item.type === 'Smart/TNT')
                                .map((item, index) => (
                                  <TouchableOpacity
                                    key={index}
                                    onPress={() => handlePhoneClick(item.number)}
                                    style={{ marginBottom: 6 }}
                                  >
                                    <Text
                                      style={{
                                        fontSize: 11,
                                        fontFamily: fonts.regular,
                                        color: colors.text,
                                        opacity: 0.6,
                                        marginBottom: 1,
                                      }}
                                    >
                                      {item.type}
                                    </Text>
                                    <Text
                                      style={{
                                        fontSize: 12,
                                        fontFamily: fonts.regular,
                                        color: colors.primary,
                                        textDecorationLine: 'underline',
                                      }}
                                    >
                                      {item.number}
                                    </Text>
                                  </TouchableOpacity>
                                ))}
                            </View>
                            {/* Column 2 - Globe/TM */}
                            <View style={{ flex: 1 }}>
                              {resource.contact.phoneByProvider
                                .filter((item) => item.type === 'Globe/TM')
                                .map((item, index) => (
                                  <TouchableOpacity
                                    key={index}
                                    onPress={() => handlePhoneClick(item.number)}
                                    style={{ marginBottom: 6 }}
                                  >
                                    <Text
                                      style={{
                                        fontSize: 11,
                                        fontFamily: fonts.regular,
                                        color: colors.text,
                                        opacity: 0.6,
                                        marginBottom: 1,
                                      }}
                                    >
                                      {item.type}
                                    </Text>
                                    <Text
                                      style={{
                                        fontSize: 12,
                                        fontFamily: fonts.regular,
                                        color: colors.primary,
                                        textDecorationLine: 'underline',
                                      }}
                                    >
                                      {item.number}
                                    </Text>
                                  </TouchableOpacity>
                                ))}
                            </View>
                          </View>
                        </View>
                      )}

                    {/* CHO Phone Numbers (simple list) */}
                    {resource.id === 1 &&
                      resource.contact.phone &&
                      resource.contact.phone.length > 0 && (
                        <View style={{ marginBottom: 14 }}>
                          <View
                            style={{
                              flexDirection: 'row',
                              alignItems: 'center',
                              marginBottom: 4,
                            }}
                          >
                            <MaterialCommunityIcons
                              name="cellphone"
                              size={16}
                              color={colors.primary}
                              style={{ marginRight: 6 }}
                            />
                            <Text
                              style={{
                                fontSize: 12,
                                fontFamily: fonts.regular,
                                color: colors.text,
                                opacity: 0.7,
                              }}
                            >
                              Phone Numbers
                            </Text>
                          </View>
                          {resource.contact.phone.map((phone, index) => (
                            <TouchableOpacity
                              key={index}
                              onPress={() => handlePhoneClick(phone)}
                              style={{ marginBottom: 4 }}
                            >
                              <Text
                                style={{
                                  fontSize: 13,
                                  fontFamily: fonts.regular,
                                  color: colors.primary,
                                  textDecorationLine: 'underline',
                                  marginLeft: 4,
                                }}
                              >
                                {phone}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      )}

                    {/* Email */}
                    {resource.contact.email && (
                      <View style={{ marginBottom: 14 }}>
                        <View
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            marginBottom: 4,
                          }}
                        >
                          <MaterialCommunityIcons
                            name="email-outline"
                            size={16}
                            color={colors.primary}
                            style={{ marginRight: 6 }}
                          />
                          <Text
                            style={{
                              fontSize: 12,
                              fontFamily: fonts.regular,
                              color: colors.text,
                              opacity: 0.7,
                            }}
                          >
                            Email
                          </Text>
                        </View>
                        <TouchableOpacity
                          onPress={() => handleEmailClick(resource.contact.email)}
                        >
                          <Text
                            style={{
                              fontSize: 13,
                              fontFamily: fonts.regular,
                              color: colors.primary,
                              textDecorationLine: 'underline',
                              marginLeft: 4,
                            }}
                          >
                            {resource.contact.email}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    )}

                    {/* Website */}
                    {resource.contact.website && (
                      <View style={{ marginBottom: 4 }}>
                        <View
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            marginBottom: 4,
                          }}
                        >
                          <MaterialCommunityIcons
                            name="web"
                            size={16}
                            color={colors.primary}
                            style={{ marginRight: 6 }}
                          />
                          <Text
                            style={{
                              fontSize: 12,
                              fontFamily: fonts.regular,
                              color: colors.text,
                              opacity: 0.7,
                            }}
                          >
                            Website
                          </Text>
                        </View>
                        <TouchableOpacity
                          onPress={() =>
                            handleWebsiteClick(resource.contact.website)
                          }
                        >
                          <Text
                            style={{
                              fontSize: 13,
                              fontFamily: fonts.regular,
                              color: colors.primary,
                              textDecorationLine: 'underline',
                              marginLeft: 4,
                            }}
                            numberOfLines={2}
                          >
                            {resource.contact.website}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>

                  {/* Services */}
                  {resource.services && resource.services.length > 0 && (
                    <View style={{ marginTop: 16, marginBottom: 8 }}>
                      <Text
                        style={{
                          fontSize: 13,
                          fontFamily: fonts.semiBold,
                          color: colors.text,
                          marginBottom: 6,
                        }}
                      >
                        Services Offered
                      </Text>
                      {resource.services.map((service, index) => (
                        <View
                          key={index}
                          style={{
                            marginBottom: 4,
                            flexDirection: 'row',
                            alignItems: 'flex-start',
                          }}
                        >
                          <MaterialCommunityIcons
                            name="check-circle-outline"
                            size={14}
                            color={colors.primary}
                            style={{ marginRight: 6, marginTop: 2 }}
                          />
                          <Text
                            style={{
                              fontSize: 12,
                              fontFamily: fonts.regular,
                              color: colors.text,
                              flex: 1,
                            }}
                          >
                            {service}
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}

                  {/* Delivery Mode & MHPSS Level */}
                  {(resource.deliveryMode || resource.mhpssLevel) && (
                    <View
                      style={{
                        marginTop: 12,
                        paddingTop: 10,
                        borderTopWidth: 1,
                        borderTopColor: colors.primary + '25',
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        gap: 12,
                      }}
                    >
                      {resource.deliveryMode && (
                        <View style={{ flex: 1 }}>
                          <Text
                            style={{
                              fontSize: 11,
                              fontFamily: fonts.semiBold,
                              color: colors.text,
                              opacity: 0.6,
                              marginBottom: 2,
                            }}
                          >
                            MODE OF DELIVERY
                          </Text>
                          <Text
                            style={{
                              fontSize: 13,
                              fontFamily: fonts.regular,
                              color: colors.text,
                            }}
                          >
                            {resource.deliveryMode}
                          </Text>
                        </View>
                      )}
                      {resource.mhpssLevel && (
                        <View style={{ flex: 1 }}>
                          <Text
                            style={{
                              fontSize: 11,
                              fontFamily: fonts.semiBold,
                              color: colors.text,
                              opacity: 0.6,
                              marginBottom: 2,
                            }}
                          >
                            MHPSS LEVEL
                          </Text>
                          <Text
                            style={{
                              fontSize: 13,
                              fontFamily: fonts.regular,
                              color: colors.text,
                            }}
                          >
                            {resource.mhpssLevel}
                          </Text>
                        </View>
                      )}
                    </View>
                  )}
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Self-Care Tips Section */}
        <View style={{ paddingHorizontal: 16, paddingVertical: 20 }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginBottom: 10,
            }}
          >
            <MaterialCommunityIcons
              name="heart-circle-outline"
              size={20}
              color={colors.primary}
              style={{ marginRight: 8 }}
            />
            <Text
              style={{
                fontSize: 16,
                fontFamily: fonts.bold,
                color: colors.text,
              }}
            >
              Self-Care Tips
            </Text>
          </View>

          <View style={{ gap: 10 }}>
            <View
              style={[
                {
                  backgroundColor: colors.white,
                  padding: 12,
                  borderRadius: 12,
                  borderLeftWidth: 3,
                  borderLeftColor: colors.primary,
                },
                cardShadow,
              ]}
            >
              <View
                style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}
              >
                <MaterialCommunityIcons
                  name="meditation"
                  size={18}
                  color={colors.primary}
                  style={{ marginRight: 8 }}
                />
                <Text
                  style={{
                    fontSize: 13,
                    fontFamily: fonts.semiBold,
                    color: colors.text,
                  }}
                >
                  Practice Mindfulness
                </Text>
              </View>
              <Text
                style={{
                  fontSize: 12,
                  fontFamily: fonts.regular,
                  color: colors.text,
                  lineHeight: 18,
                  opacity: 0.9,
                }}
              >
                Take a few minutes daily to breathe deeply and be present in the
                moment.
              </Text>
            </View>

            <View
              style={[
                {
                  backgroundColor: colors.white,
                  padding: 12,
                  borderRadius: 12,
                  borderLeftWidth: 3,
                  borderLeftColor: colors.primary,
                },
                cardShadow,
              ]}
            >
              <View
                style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}
              >
                <MaterialCommunityIcons
                  name="walk"
                  size={18}
                  color={colors.primary}
                  style={{ marginRight: 8 }}
                />
                <Text
                  style={{
                    fontSize: 13,
                    fontFamily: fonts.semiBold,
                    color: colors.text,
                  }}
                >
                  Move Your Body
                </Text>
              </View>
              <Text
                style={{
                  fontSize: 12,
                  fontFamily: fonts.regular,
                  color: colors.text,
                  lineHeight: 18,
                  opacity: 0.9,
                }}
              >
                Regular exercise and physical activity can significantly boost your
                mental health.
              </Text>
            </View>

            <View
              style={[
                {
                  backgroundColor: colors.white,
                  padding: 12,
                  borderRadius: 12,
                  borderLeftWidth: 3,
                  borderLeftColor: colors.primary,
                },
                cardShadow,
              ]}
            >
              <View
                style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}
              >
                <MaterialCommunityIcons
                  name="account-heart-outline"
                  size={18}
                  color={colors.primary}
                  style={{ marginRight: 8 }}
                />
                <Text
                  style={{
                    fontSize: 13,
                    fontFamily: fonts.semiBold,
                    color: colors.text,
                  }}
                >
                  Connect with Others
                </Text>
              </View>
              <Text
                style={{
                  fontSize: 12,
                  fontFamily: fonts.regular,
                  color: colors.text,
                  lineHeight: 18,
                  opacity: 0.9,
                }}
              >
                Share your feelings with trusted friends, family, or mental health
                professionals.
              </Text>
            </View>
          </View>
        </View>

        {/* Remember Section */}
        <View style={{ paddingHorizontal: 16, paddingBottom: 24 }}>
          <View
            style={[
              {
                backgroundColor: colors.primary + '10',
                padding: 14,
                borderRadius: 12,
                borderLeftWidth: 4,
                borderLeftColor: colors.primary,
              },
              cardShadow,
            ]}
          >
            <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
              <MaterialCommunityIcons
                name="lightbulb-on-outline"
                size={18}
                color={colors.primary}
                style={{ marginRight: 8, marginTop: 2 }}
              />
              <Text
                style={{
                  fontSize: 12,
                  fontFamily: fonts.regular,
                  color: colors.text,
                  lineHeight: 18,
                  flex: 1,
                }}
              >
                <Text
                  style={{
                    fontFamily: fonts.semiBold,
                    color: colors.primary,
                  }}
                >
                  Remember:{' '}
                </Text>
                Seeking help is a sign of strength. Mental health is just as
                important as physical health.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default MentalHealthResources;
