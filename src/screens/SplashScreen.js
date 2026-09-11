import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  Animated,
  StatusBar,
} from 'react-native';

export default function SplashScreen({ onFinish }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Clean, elegant fade-in
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();

    // Smooth transition to app after 1.8s
    const timer = setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 350,
        useNativeDriver: true,
      }).start(() => {
        if (onFinish) onFinish();
      });
    }, 1800);

    return () => clearTimeout(timer);
  }, [fadeAnim, onFinish]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAFAF8" />

      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        {/* Logo Card */}
        <View style={styles.logoCard}>
          <Image
            source={require('../../assets/logo.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </View>

        {/* App Title & Tagline */}
        <Text style={styles.brandTitle}>
          StockPot <Text style={styles.brandAi}>AI</Text>
        </Text>

        <View style={styles.badgeWrap}>
          <Text style={styles.badgeText}>SMART KITCHEN & SAVINGS</Text>
        </View>

        <Text style={styles.tagline}>
          Cook Smart • Save Money • Zero Waste
        </Text>
      </Animated.View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Powered by Live Supermarket Data</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAF8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  logoCard: {
    width: 120,
    height: 120,
    borderRadius: 30,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: 'rgba(0, 0, 0, 0.08)',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 4,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  logoImage: {
    width: 96,
    height: 96,
    borderRadius: 20,
  },
  brandTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: '#1F2937',
    letterSpacing: -0.6,
  },
  brandAi: {
    color: '#166534',
  },
  badgeWrap: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#15803D',
    letterSpacing: 0.8,
  },
  tagline: {
    fontSize: 13.5,
    fontWeight: '500',
    color: '#6B7280',
    marginTop: 4,
    textAlign: 'center',
  },
  footer: {
    position: 'absolute',
    bottom: 36,
  },
  footerText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#9CA3AF',
  },
});
