import React, { useEffect, useRef } from 'react';
import {
  Animated,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Dimensions,
} from 'react-native';
import { Ionicons, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNotifications } from '../../context/NotificationContext';
import Colors from '../../constants/colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const getNotificationTheme = (type) => {
  switch (type) {
    case 'deal':
      return {
        icon: 'pricetag',
        color: '#D97706',
        bg: '#FEF3C7',
        badgeText: 'DEAL ALERT',
      };
    case 'meal':
      return {
        icon: 'restaurant',
        color: '#3A6847',
        bg: '#EAF3EC',
        badgeText: 'MEAL PREP',
      };
    case 'milestone':
      return {
        icon: 'trophy',
        color: '#E8A93F',
        bg: '#FEF6EB',
        badgeText: 'MILESTONE',
      };
    case 'shopping':
      return {
        icon: 'cart',
        color: '#3A6847',
        bg: '#EAF3EC',
        badgeText: 'GROCERY BASKET',
      };
    case 'admin':
      return {
        icon: 'shield-checkmark',
        color: '#2B2420',
        bg: '#F5EFEB',
        badgeText: 'SYSTEM UPDATE',
      };
    default:
      return {
        icon: 'notifications',
        color: '#3A6847',
        bg: '#FAF8F5',
        badgeText: 'STOCKPOT',
      };
  }
};

const InAppNotificationBanner = () => {
  const { activeBanner, dismissBanner, openNotificationCenter } = useNotifications();
  const slideAnim = useRef(new Animated.Value(-120)).current;

  useEffect(() => {
    if (activeBanner) {
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 8,
        tension: 50,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: -120,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [activeBanner, slideAnim]);

  if (!activeBanner) return null;

  const theme = getNotificationTheme(activeBanner.type);

  const handlePress = () => {
    dismissBanner();
    openNotificationCenter();
  };

  return (
    <Animated.View
      style={[
        styles.bannerContainer,
        {
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <TouchableOpacity
        style={styles.bannerContent}
        onPress={handlePress}
        activeOpacity={0.92}
      >
        <View style={[styles.iconWrap, { backgroundColor: theme.bg }]}>
          <Ionicons name={theme.icon} size={18} color={theme.color} />
        </View>

        <View style={styles.textWrap}>
          <View style={styles.tagRow}>
            <Text style={[styles.tagText, { color: theme.color }]}>{theme.badgeText}</Text>
            <Text style={styles.timeText}>Just now</Text>
          </View>
          <Text style={styles.title} numberOfLines={1}>
            {activeBanner.title}
          </Text>
          <Text style={styles.message} numberOfLines={2}>
            {activeBanner.message}
          </Text>
        </View>

        <TouchableOpacity style={styles.closeBtn} onPress={dismissBanner} activeOpacity={0.7}>
          <Ionicons name="close" size={16} color="#9CA3AF" />
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  bannerContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 48 : 28,
    left: 14,
    right: 14,
    zIndex: 99999,
    alignItems: 'center',
  },
  bannerContent: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.16,
    shadowRadius: 14,
    elevation: 10,
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  textWrap: {
    flex: 1,
    paddingRight: 4,
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  tagText: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  timeText: {
    fontSize: 10,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  title: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#111827',
    lineHeight: 18,
  },
  message: {
    fontSize: 12,
    color: '#4B5563',
    lineHeight: 16,
    marginTop: 1,
  },
  closeBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
});

export default InAppNotificationBanner;
