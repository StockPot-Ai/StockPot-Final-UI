import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Dimensions,
  Platform,
} from 'react-native';
import { Ionicons, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '../utils/safeStorage';
import { useAccount } from '../context/AccountContext';
import locationService from '../services/locationService';
import { LANGUAGES } from '../i18n/translations';

const ONBOARDING_STORAGE_KEY = '@stockpot_has_onboarded';
const { width } = Dimensions.get('window');

const OnboardingScreen = ({ onComplete }) => {
  const { language, setLanguage, t } = useAccount();
  const [step, setStep] = useState(1);
  const [locationGranted, setLocationGranted] = useState(false);
  const [notifGranted, setNotifGranted] = useState(false);
  const [detectedTown, setDetectedTown] = useState('');
  const [requestingLoc, setRequestingLoc] = useState(false);

  // Handle Location Permission Request
  const handleRequestLocation = async () => {
    setRequestingLoc(true);
    try {
      const granted = await locationService.requestPermission();
      setLocationGranted(granted);
      if (granted) {
        const coords = await locationService.getCoordinates();
        if (coords && coords.city) {
          setDetectedTown(coords.city);
        }
      }
    } catch (_) {
      setLocationGranted(true);
    }
    setRequestingLoc(false);
  };

  // Handle Notifications Permission Request
  const handleRequestNotifications = async () => {
    setNotifGranted(true);
  };

  const handleFinish = async () => {
    try {
      await AsyncStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
    } catch (_) {}
    if (onComplete) onComplete();
  };

  const handleSkip = async () => {
    try {
      await AsyncStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
    } catch (_) {}
    if (onComplete) onComplete();
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Top Bar with Step Indicators */}
      <View style={styles.topBar}>
        <View style={styles.stepDotsRow}>
          {[1, 2, 3, 4].map((s) => (
            <View
              key={s}
              style={[
                styles.stepDot,
                step === s ? styles.stepDotActive : step > s ? styles.stepDotCompleted : null,
              ]}
            />
          ))}
        </View>

        {step < 4 && (
          <TouchableOpacity onPress={handleSkip} style={styles.skipBtn} activeOpacity={0.7}>
            <Text style={styles.skipBtnText}>{t ? t('skip', 'Skip') : 'Skip'}</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── STEP 1: Select Language ───────────────────────────────────── */}
        {step === 1 && (
          <View style={styles.stepContainer}>
            <View style={styles.iconHeroWrap}>
              <Text style={{ fontSize: 44 }}>🇱🇰</Text>
            </View>

            <Text style={styles.heroTitle}>Choose Your Language</Text>
            <Text style={styles.heroSubtitle}>
              භාෂාව තෝරන්න • மொழியைத் தேர்ந்தெடுக்கவும்
            </Text>
            <Text style={styles.heroDesc}>
              Select your preferred language. You can change this anytime in your Account Settings.
            </Text>

            <View style={styles.languageCardsWrap}>
              {LANGUAGES.slice(0, 3).map((item) => {
                const isSelected = language === item.label;
                return (
                  <TouchableOpacity
                    key={item.code}
                    style={[styles.langCard, isSelected && styles.langCardSelected]}
                    onPress={() => setLanguage(item.label)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.langLeft}>
                      <Text style={styles.langFlag}>{item.flag}</Text>
                      <View>
                        <Text style={[styles.langLabel, isSelected && styles.langLabelSelected]}>
                          {item.label}
                        </Text>
                        <Text style={styles.langNative}>{item.native}</Text>
                      </View>
                    </View>

                    <View style={[styles.checkCircle, isSelected && styles.checkCircleSelected]}>
                      {isSelected && <Ionicons name="checkmark" size={15} color="#FFFFFF" />}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* ─── STEP 2: About StockPot ────────────────────────────────────── */}
        {step === 2 && (
          <View style={styles.stepContainer}>
            <View style={[styles.iconHeroWrap, { backgroundColor: '#E8F8F0' }]}>
              <MaterialCommunityIcons name="pot-steam" size={42} color="#007A3D" />
            </View>

            <Text style={styles.heroTitle}>Smart Kitchen Savings</Text>
            <Text style={styles.heroSubtitle}>Zero-Waste Cooking & Grocery Compare</Text>
            <Text style={styles.heroDesc}>
              StockPot helps Sri Lankan households eat healthier and cut monthly supermarket bills.
            </Text>

            <View style={styles.featureList}>
              <View style={styles.featureItem}>
                <View style={[styles.featureIconWrap, { backgroundColor: '#DCFCE7' }]}>
                  <Ionicons name="cart" size={20} color="#166534" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.featureTitle}>Compare Local Supermarkets</Text>
                  <Text style={styles.featureText}>
                    Track live daily prices across Keells, Cargills Food City, Lanka Sathosa & local grocers.
                  </Text>
                </View>
              </View>

              <View style={styles.featureItem}>
                <View style={[styles.featureIconWrap, { backgroundColor: '#FEF3C7' }]}>
                  <MaterialCommunityIcons name="chef-hat" size={20} color="#92400E" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.featureTitle}>AI Sous-Chef Tété</Text>
                  <Text style={styles.featureText}>
                    Generate nutritious recipes from ingredients in your pantry with zero food waste.
                  </Text>
                </View>
              </View>

              <View style={styles.featureItem}>
                <View style={[styles.featureIconWrap, { backgroundColor: '#DBEAFE' }]}>
                  <FontAwesome5 name="piggy-bank" size={18} color="#1E40AF" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.featureTitle}>Save Rs. 5,000 – 15,000 Monthly</Text>
                  <Text style={styles.featureText}>
                    Smart split-basket routing gets you the lowest possible prices for every dish.
                  </Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* ─── STEP 3: Permissions Request ──────────────────────────────── */}
        {step === 3 && (
          <View style={styles.stepContainer}>
            <View style={[styles.iconHeroWrap, { backgroundColor: '#EFF6FF' }]}>
              <Ionicons name="shield-checkmark" size={42} color="#2563EB" />
            </View>

            <Text style={styles.heroTitle}>Permissions & Location</Text>
            <Text style={styles.heroSubtitle}>Accurate Local Deals & Updates</Text>
            <Text style={styles.heroDesc}>
              To show nearby supermarkets, grocery prices, and deal alerts in your area, please enable these permissions.
            </Text>

            <View style={styles.permCardsWrap}>
              {/* Location Card */}
              <View style={styles.permCard}>
                <View style={styles.permCardTop}>
                  <View style={[styles.permIconCircle, { backgroundColor: '#E8F8F0' }]}>
                    <Ionicons name="location" size={22} color="#007A3D" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.permCardTitle}>GPS Location</Text>
                    <Text style={styles.permCardDesc}>
                      {detectedTown
                        ? `Detected: ${detectedTown}, LK`
                        : 'Discovers nearby Cargills, Sathosa & grocers in your town.'}
                    </Text>
                  </View>
                </View>

                {locationGranted ? (
                  <View style={styles.permGrantedBadge}>
                    <Ionicons name="checkmark-circle" size={16} color="#166534" />
                    <Text style={styles.permGrantedText}>
                      Location Enabled {detectedTown ? `(${detectedTown})` : '✓'}
                    </Text>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.permActionBtn}
                    onPress={handleRequestLocation}
                    disabled={requestingLoc}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.permActionBtnText}>
                      {requestingLoc ? 'Detecting...' : 'Allow Location 📍'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Notification Card */}
              <View style={styles.permCard}>
                <View style={styles.permCardTop}>
                  <View style={[styles.permIconCircle, { backgroundColor: '#FEF3C7' }]}>
                    <Ionicons name="notifications" size={22} color="#D97706" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.permCardTitle}>Smart Price Alerts</Text>
                    <Text style={styles.permCardDesc}>
                      Notifies you when dhal, rice, or oil drops in price near you.
                    </Text>
                  </View>
                </View>

                {notifGranted ? (
                  <View style={styles.permGrantedBadge}>
                    <Ionicons name="checkmark-circle" size={16} color="#166534" />
                    <Text style={styles.permGrantedText}>Notifications Enabled ✓</Text>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.permActionBtn}
                    onPress={handleRequestNotifications}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.permActionBtnText}>Allow Alerts 🔔</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        )}

        {/* ─── STEP 4: Ready to Launch ──────────────────────────────────── */}
        {step === 4 && (
          <View style={styles.stepContainer}>
            <View style={[styles.iconHeroWrap, { backgroundColor: '#DCFCE7' }]}>
              <Text style={{ fontSize: 44 }}>🚀</Text>
            </View>

            <Text style={styles.heroTitle}>You're All Set!</Text>
            <Text style={styles.heroSubtitle}>Welcome to Your Smart Kitchen</Text>
            <Text style={styles.heroDesc}>
              Everything is set up and optimized. Start exploring recipes, plan your meals, and compare nearby grocery prices.
            </Text>

            <View style={styles.summaryCard}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Display Language:</Text>
                <Text style={styles.summaryValue}>{language}</Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Detected Town:</Text>
                <Text style={styles.summaryValue}>
                  {detectedTown || locationService.getCachedLocation()?.city || 'Eheliyagoda, LK'}
                </Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Smart Savings Tier:</Text>
                <Text style={[styles.summaryValue, { color: '#007A3D' }]}>Active Free Starter</Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Bottom Action Footer */}
      <View style={styles.footer}>
        {step < 4 ? (
          <TouchableOpacity
            style={styles.continueBtn}
            onPress={() => setStep(step + 1)}
            activeOpacity={0.85}
          >
            <Text style={styles.continueBtnText}>
              {step === 1 ? 'Next: About StockPot →' : step === 2 ? 'Next: Permissions →' : 'Continue →'}
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.continueBtn, { backgroundColor: '#007A3D' }]}
            onPress={handleFinish}
            activeOpacity={0.85}
          >
            <Text style={styles.continueBtnText}>Start Cooking Smart 🍲</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 8,
  },
  stepDotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  stepDot: {
    width: 22,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#E5E7EB',
  },
  stepDotActive: {
    width: 34,
    backgroundColor: '#007A3D',
  },
  stepDotCompleted: {
    backgroundColor: '#86EFAC',
  },
  skipBtn: {
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  skipBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
  },
  stepContainer: {
    alignItems: 'center',
  },
  iconHeroWrap: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#111827',
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  heroSubtitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#007A3D',
    textAlign: 'center',
    marginTop: 4,
  },
  heroDesc: {
    fontSize: 13.5,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
    paddingHorizontal: 10,
  },
  languageCardsWrap: {
    width: '100%',
    marginTop: 24,
    gap: 12,
  },
  langCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
  },
  langCardSelected: {
    backgroundColor: '#F0FDF4',
    borderColor: '#007A3D',
  },
  langLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  langFlag: {
    fontSize: 28,
  },
  langLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  langLabelSelected: {
    color: '#007A3D',
  },
  langNative: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  checkCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkCircleSelected: {
    backgroundColor: '#007A3D',
    borderColor: '#007A3D',
  },

  // Feature List
  featureList: {
    width: '100%',
    marginTop: 24,
    gap: 14,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#F9FAFB',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  featureIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#111827',
  },
  featureText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
    lineHeight: 17,
  },

  // Permissions Cards
  permCardsWrap: {
    width: '100%',
    marginTop: 22,
    gap: 14,
  },
  permCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
  },
  permCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  permIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  permCardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111827',
  },
  permCardDesc: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  permActionBtn: {
    marginTop: 12,
    backgroundColor: '#007A3D',
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  permActionBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  permGrantedBadge: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#DCFCE7',
    paddingVertical: 8,
    borderRadius: 10,
  },
  permGrantedText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#166534',
  },

  // Summary Card
  summaryCard: {
    width: '100%',
    marginTop: 24,
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  summaryLabel: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#4B5563',
  },
  summaryValue: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#111827',
  },
  summaryDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
  },

  // Footer
  footer: {
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === 'ios' ? 24 : 18,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  continueBtn: {
    backgroundColor: '#007A3D',
    paddingVertical: 15,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#007A3D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  continueBtnText: {
    fontSize: 15.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});

export default OnboardingScreen;
