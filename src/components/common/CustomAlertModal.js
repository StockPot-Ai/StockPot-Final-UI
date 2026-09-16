import React, { useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Platform,
  Dimensions,
} from 'react-native';
import { Ionicons, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import Colors from '../../constants/colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

/**
 * CustomAlertModal
 * Premium Apple-inspired alert dialog replacement for native Alert.alert.
 *
 * Variants:
 * - 'error': Terracotta (#994122) - Invalid credentials, account blocks, failure
 * - 'warning': Warm Amber (#E8A93F) - Rate limits, lockouts, Google account conflicts
 * - 'success': Forest Green (#3A6847) - Resets sent, email verified, profile saved
 * - 'info': Deep Charcoal (#2B2420) - Notifications, general tips
 */
const CustomAlertModal = ({
  visible,
  type = 'info', // 'error' | 'warning' | 'success' | 'info'
  title,
  message,
  primaryButton, // { text, onPress, icon }
  secondaryButton, // { text, onPress }
  countdown, // Optional number (e.g. seconds remaining for lockout)
  onClose,
}) => {
  const scaleAnim = useRef(new Animated.Value(0.92)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 65,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      scaleAnim.setValue(0.92);
      opacityAnim.setValue(0);
    }
  }, [visible, scaleAnim, opacityAnim]);

  if (!visible) return null;

  const getTheme = () => {
    switch (type) {
      case 'error':
        return {
          icon: <Ionicons name="alert-circle" size={32} color="#994122" />,
          badgeBg: '#FDF1EC',
          primaryBtnBg: '#994122',
          primaryBtnText: '#FFFFFF',
          borderColor: '#F3D5C8',
        };
      case 'warning':
        return {
          icon: <Ionicons name="warning" size={30} color="#C6851C" />,
          badgeBg: '#FEF6EB',
          primaryBtnBg: '#E8A93F',
          primaryBtnText: '#2B2420',
          borderColor: '#F9E2BE',
        };
      case 'success':
        return {
          icon: <Ionicons name="checkmark-circle" size={32} color="#3A6847" />,
          badgeBg: '#EAF3EC',
          primaryBtnBg: '#3A6847',
          primaryBtnText: '#FFFFFF',
          borderColor: '#C7DEC9',
        };
      case 'info':
      default:
        return {
          icon: <Ionicons name="information-circle" size={32} color="#2B2420" />,
          badgeBg: '#F5EFEB',
          primaryBtnBg: '#2B2420',
          primaryBtnText: '#FFFFFF',
          borderColor: '#E8DFD8',
        };
    }
  };

  const theme = getTheme();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose || secondaryButton?.onPress || primaryButton?.onPress}
    >
      <View style={styles.backdrop}>
        <Animated.View
          style={[
            styles.dialogContainer,
            {
              opacity: opacityAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {/* Top Badge Icon */}
          <View style={[styles.iconBadge, { backgroundColor: theme.badgeBg, borderColor: theme.borderColor }]}>
            {theme.icon}
          </View>

          {/* Title */}
          {title ? <Text style={styles.titleText}>{title}</Text> : null}

          {/* Countdown Indicator (for spam lockout) */}
          {typeof countdown === 'number' && countdown > 0 && (
            <View style={styles.countdownBadge}>
              <Ionicons name="hourglass-outline" size={14} color="#994122" />
              <Text style={styles.countdownText}>
                Cooldown active: <Text style={styles.countdownBold}>{countdown}s</Text>
              </Text>
            </View>
          )}

          {/* Message Body */}
          {message ? <Text style={styles.messageText}>{message}</Text> : null}

          {/* Action Buttons */}
          <View style={styles.buttonStack}>
            {primaryButton && (
              <TouchableOpacity
                style={[styles.primaryBtn, { backgroundColor: theme.primaryBtnBg }]}
                onPress={primaryButton.onPress}
                activeOpacity={0.85}
              >
                {primaryButton.icon ? (
                  <View style={{ marginRight: 8 }}>{primaryButton.icon}</View>
                ) : null}
                <Text style={[styles.primaryBtnText, { color: theme.primaryBtnText }]}>
                  {primaryButton.text || 'OK'}
                </Text>
              </TouchableOpacity>
            )}

            {secondaryButton && (
              <TouchableOpacity
                style={styles.secondaryBtn}
                onPress={secondaryButton.onPress}
                activeOpacity={0.7}
              >
                <Text style={styles.secondaryBtnText}>{secondaryButton.text || 'Cancel'}</Text>
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(43, 36, 32, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  dialogContainer: {
    width: Math.min(SCREEN_WIDTH - 48, 380),
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingHorizontal: 22,
    paddingTop: 26,
    paddingBottom: 22,
    alignItems: 'center',
    shadowColor: '#2B2420',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.18,
    shadowRadius: 28,
    elevation: 12,
    borderWidth: 1,
    borderColor: '#E8DFD8',
  },
  iconBadge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 1.5,
  },
  titleText: {
    fontSize: 18.5,
    fontWeight: '700',
    color: '#2B2420',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  countdownBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FDF1EC',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#F3D5C8',
  },
  countdownText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#994122',
  },
  countdownBold: {
    fontWeight: '800',
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#5C544E',
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  buttonStack: {
    width: '100%',
    gap: 10,
  },
  primaryBtn: {
    width: '100%',
    height: 48,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2B2420',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
  primaryBtnText: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  secondaryBtn: {
    width: '100%',
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FAF8F5',
    borderWidth: 1,
    borderColor: '#E8DFD8',
  },
  secondaryBtnText: {
    fontSize: 14.5,
    fontWeight: '600',
    color: '#5C544E',
  },
});

export default CustomAlertModal;
