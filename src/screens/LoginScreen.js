import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import Colors from '../constants/colors';
import { useAccount } from '../context/AccountContext';
import { authService } from '../services';
import authSecurity from '../services/authSecurity';
import CustomAlertModal from '../components/common/CustomAlertModal';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const LoginScreen = ({ onSignUp }) => {
  const { login, loginWithGoogle } = useAccount();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);
  const [focusedField, setFocusedField] = useState(null);

  // Forgot password modal state
  const [forgotModalVisible, setForgotModalVisible] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotError, setForgotError] = useState('');
  const [isSendingForgot, setIsSendingForgot] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState(false);

  // Anti-Spam Login Lockout State
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutSecondsLeft, setLockoutSecondsLeft] = useState(0);
  const lockoutTimerRef = useRef(null);

  // Custom Alert Modal State
  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    type: 'info',
    title: '',
    message: '',
    primaryButton: null,
    secondaryButton: null,
    countdown: 0,
  });

  const showAlert = ({ type = 'info', title, message, primaryButton, secondaryButton, countdown }) => {
    setAlertConfig({
      visible: true,
      type,
      title,
      message,
      primaryButton: primaryButton || { text: 'OK', onPress: () => setAlertConfig((prev) => ({ ...prev, visible: false })) },
      secondaryButton: secondaryButton || null,
      countdown,
    });
  };

  const closeAlert = () => {
    setAlertConfig((prev) => ({ ...prev, visible: false }));
  };

  // Restore persistent security and lockout state upon screen mount/app reopen
  useEffect(() => {
    let isMounted = true;
    const restoreSecurityState = async () => {
      const state = await authSecurity.getLockoutState();
      if (!isMounted) return;
      if (state.isLocked && state.lockoutSecondsLeft > 0) {
        setFailedAttempts(state.failedAttempts);
        setLockoutSecondsLeft(state.lockoutSecondsLeft);
        showAlert({
          type: 'warning',
          title: 'Sign-In Temporarily Locked',
          message: `Too many failed login attempts. For your account security, sign in is locked for ${state.lockoutSecondsLeft} seconds.`,
          primaryButton: {
            text: 'Reset Password',
            onPress: () => {
              closeAlert();
              openForgotModal();
            },
          },
          secondaryButton: {
            text: 'I Will Wait',
            onPress: closeAlert,
          },
          countdown: state.lockoutSecondsLeft,
        });
      } else {
        setFailedAttempts(state.failedAttempts || 0);
      }
    };
    restoreSecurityState();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (lockoutSecondsLeft > 0) {
      lockoutTimerRef.current = setTimeout(() => {
        setLockoutSecondsLeft((prev) => {
          if (prev <= 1) {
            authSecurity.clearLockoutState().catch(() => {});
            setFailedAttempts(0);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearTimeout(lockoutTimerRef.current);
  }, [lockoutSecondsLeft]);

  const passwordRef = useRef(null);

  const validate = () => {
    let valid = true;

    if (!email.trim()) {
      setEmailError('Email is required');
      valid = false;
    } else if (!EMAIL_REGEX.test(email.trim())) {
      setEmailError('Please enter a valid email address');
      valid = false;
    } else {
      setEmailError('');
    }

    if (!password) {
      setPasswordError('Password is required');
      valid = false;
    } else {
      setPasswordError('');
    }

    return valid;
  };

  const handleLogin = async () => {
    // Re-check persistent lockout from storage
    const currentSecState = await authSecurity.getLockoutState();
    if (currentSecState.isLocked && currentSecState.lockoutSecondsLeft > 0) {
      setLockoutSecondsLeft(currentSecState.lockoutSecondsLeft);
      showAlert({
        type: 'warning',
        title: 'Sign-In Temporarily Locked',
        message: `Too many failed login attempts. For security, sign in is locked for ${currentSecState.lockoutSecondsLeft} seconds. You can reset your password if you forgot it.`,
        primaryButton: {
          text: 'Reset Password',
          onPress: () => {
            closeAlert();
            openForgotModal();
          },
        },
        secondaryButton: {
          text: 'Wait',
          onPress: closeAlert,
        },
        countdown: currentSecState.lockoutSecondsLeft,
      });
      return;
    }

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await login({ email: email.trim(), password });
      await authSecurity.clearLockoutState();
      setFailedAttempts(0);
      setLockoutSecondsLeft(0);
    } catch (err) {
      // Check if backend returned HTTP 429 Too Many Requests
      const isRateLimited =
        err.status === 429 ||
        (err.message && err.message.toLowerCase().includes('too many failed'));

      if (isRateLimited) {
        const retrySec = err.data?.retry_after || err.retryAfter || 60;
        const secRes = await authSecurity.recordServerLockout(retrySec, email);
        setFailedAttempts(secRes.failedAttempts);
        setLockoutSecondsLeft(secRes.lockoutSecondsLeft);
        showAlert({
          type: 'warning',
          title: 'Sign-In Temporarily Locked',
          message:
            err.message ||
            `Too many consecutive failed login attempts. For your account security, sign in is locked for ${secRes.lockoutSecondsLeft} seconds.`,
          primaryButton: {
            text: 'Reset Password',
            onPress: () => {
              closeAlert();
              openForgotModal();
            },
          },
          secondaryButton: {
            text: 'I Will Wait',
            onPress: closeAlert,
          },
          countdown: secRes.lockoutSecondsLeft,
        });
        return;
      }

      // Record local persistent failed attempt
      const attemptRes = await authSecurity.recordFailedAttempt(email);
      setFailedAttempts(attemptRes.failedAttempts);

      if (attemptRes.isLocked) {
        setLockoutSecondsLeft(attemptRes.lockoutSecondsLeft);
        showAlert({
          type: 'warning',
          title: 'Sign-In Temporarily Locked',
          message: `Too many consecutive failed login attempts. For your account security, sign in is locked for ${attemptRes.lockoutSecondsLeft} seconds.`,
          primaryButton: {
            text: 'Forgot Password?',
            onPress: () => {
              closeAlert();
              openForgotModal();
            },
          },
          secondaryButton: {
            text: 'I Will Wait',
            onPress: closeAlert,
          },
          countdown: attemptRes.lockoutSecondsLeft,
        });
      } else {
        const errMsg = err.message || 'Invalid email or password';
        const isGoogleConflict = errMsg.toLowerCase().includes('google');

        if (isGoogleConflict) {
          showAlert({
            type: 'warning',
            title: 'Google Account Detected',
            message: 'This account was registered using Google Sign-In. Please sign in with Google.',
            primaryButton: {
              text: 'Sign In with Google',
              onPress: () => {
                closeAlert();
                handleSocialAuth('Google');
              },
            },
            secondaryButton: {
              text: 'Cancel',
              onPress: closeAlert,
            },
          });
        } else {
          showAlert({
            type: 'error',
            title: 'Sign In Failed',
            message:
              errMsg && errMsg.includes('remaining')
                ? errMsg
                : `Invalid email or password. Please check your credentials and try again. (Attempt ${attemptRes.failedAttempts} of 5)`,
            primaryButton: {
              text: 'Try Again',
              onPress: closeAlert,
            },
            secondaryButton: attemptRes.failedAttempts >= 2 ? {
              text: 'Forgot Password?',
              onPress: () => {
                closeAlert();
                openForgotModal();
              },
            } : null,
          });
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSocialAuth = async (provider) => {
    if (provider === 'Google') {
      setIsGoogleSubmitting(true);
      try {
        await loginWithGoogle();
      } catch (err) {
        if (!err.message?.includes('cancelled') && !err.message?.includes('dismissed')) {
          showAlert({
            type: 'error',
            title: 'Google Sign-In Failed',
            message: err.message || 'Could not complete Google Sign-In. Please try again.',
            primaryButton: { text: 'OK', onPress: closeAlert },
          });
        }
      } finally {
        setIsGoogleSubmitting(false);
      }
    } else {
      showAlert({
        type: 'info',
        title: `${provider} Sign-In`,
        message: `${provider} Sign-In is available on supported iOS devices.`,
        primaryButton: { text: 'OK', onPress: closeAlert },
      });
    }
  };

  const handleSendForgotPassword = async () => {
    const cleanEmail = forgotEmail.trim();
    if (!cleanEmail || !EMAIL_REGEX.test(cleanEmail)) {
      setForgotError('Please enter a valid email address');
      return;
    }
    setForgotError('');
    setIsSendingForgot(true);
    try {
      await authService.forgotPassword(cleanEmail);
      setForgotSuccess(true);
    } catch (err) {
      setForgotSuccess(true);
    } finally {
      setIsSendingForgot(false);
    }
  };

  const openForgotModal = () => {
    setForgotEmail(email.trim());
    setForgotError('');
    setForgotSuccess(false);
    setForgotModalVisible(true);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Brand Header */}
        <View style={styles.brandSection}>
          <View style={styles.logoWrap}>
            <Image
              source={require('../../assets/logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.brandName}>
            StockPot <Text style={styles.brandAi}>AI</Text>
          </Text>
          <Text style={styles.tagline}>
            Cook Smart • Save Money • Waste Less
          </Text>
        </View>

        {/* Auth Card */}
        <View style={styles.card}>
          {/* Segmented Switch */}
          <View style={styles.tabSwitch}>
            <View style={[styles.tabBtn, styles.tabBtnActive]}>
              <Text style={[styles.tabBtnText, styles.tabBtnTextActive]}>Sign In</Text>
            </View>
            <TouchableOpacity
              style={styles.tabBtn}
              onPress={onSignUp}
              activeOpacity={0.7}
            >
              <Text style={styles.tabBtnText}>Create Account</Text>
            </TouchableOpacity>
          </View>

          {/* Email Field */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Email Address</Text>
            <View
              style={[
                styles.inputWrap,
                focusedField === 'email' && styles.inputWrapFocused,
                emailError ? styles.inputWrapError : null,
              ]}
            >
              <Ionicons
                name="mail-outline"
                size={19}
                color={focusedField === 'email' ? '#166534' : '#9CA3AF'}
              />
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={(t) => {
                  setEmail(t);
                  if (emailError) setEmailError('');
                }}
                onFocus={() => setFocusedField('email')}
                onBlur={() => setFocusedField(null)}
                placeholder="chef@stockpot.ai"
                placeholderTextColor="#9CA3AF"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="next"
                onSubmitEditing={() => passwordRef.current?.focus()}
              />
            </View>
            {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}
          </View>

          {/* Password Field */}
          <View style={styles.fieldGroup}>
            <View style={styles.passwordHeader}>
              <Text style={styles.fieldLabel}>Password</Text>
              <TouchableOpacity
                onPress={openForgotModal}
                activeOpacity={0.7}
              >
                <Text style={styles.forgotText}>Forgot?</Text>
              </TouchableOpacity>
            </View>
            <View
              style={[
                styles.inputWrap,
                focusedField === 'password' && styles.inputWrapFocused,
                passwordError ? styles.inputWrapError : null,
              ]}
            >
              <Ionicons
                name="lock-closed-outline"
                size={19}
                color={focusedField === 'password' ? '#166534' : '#9CA3AF'}
              />
              <TextInput
                ref={passwordRef}
                style={styles.input}
                value={password}
                onChangeText={(t) => {
                  setPassword(t);
                  if (passwordError) setPasswordError('');
                }}
                onFocus={() => setFocusedField('password')}
                onBlur={() => setFocusedField(null)}
                placeholder="••••••••"
                placeholderTextColor="#9CA3AF"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="done"
                onSubmitEditing={handleLogin}
              />
              <TouchableOpacity
                onPress={() => setShowPassword((prev) => !prev)}
                style={styles.eyeBtn}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color="#9CA3AF"
                />
              </TouchableOpacity>
            </View>
            {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}
          </View>

          {/* Primary Submit Button */}
          <TouchableOpacity
            style={[
              styles.primaryBtn,
              (isSubmitting || lockoutSecondsLeft > 0) && styles.primaryBtnDisabled,
              lockoutSecondsLeft > 0 && { backgroundColor: '#994122' },
            ]}
            onPress={handleLogin}
            activeOpacity={0.88}
            disabled={isSubmitting || lockoutSecondsLeft > 0}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : lockoutSecondsLeft > 0 ? (
              <>
                <Ionicons name="lock-closed" size={17} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.primaryBtnText}>Locked ({lockoutSecondsLeft}s)</Text>
              </>
            ) : (
              <>
                <Text style={styles.primaryBtnText}>Sign In</Text>
                <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
              </>
            )}
          </TouchableOpacity>

          {/* Divider with or continue with */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or continue with</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Social Sign-In Buttons - IN SAME LINE AT BOTTOM */}
          <View style={styles.socialRow}>
            {/* Apple Button */}
            <TouchableOpacity
              style={styles.socialBtnApple}
              onPress={() => handleSocialAuth('Apple')}
              activeOpacity={0.85}
            >
              <FontAwesome name="apple" size={20} color="#FFFFFF" />
              <Text style={styles.socialBtnTextApple}>Apple</Text>
            </TouchableOpacity>

            {/* Google Button */}
            <TouchableOpacity
              style={[styles.socialBtnGoogle, isGoogleSubmitting && { opacity: 0.7 }]}
              onPress={() => handleSocialAuth('Google')}
              activeOpacity={0.85}
              disabled={isGoogleSubmitting || isSubmitting}
            >
              {isGoogleSubmitting ? (
                <ActivityIndicator size="small" color="#EA4335" />
              ) : (
                <>
                  <Ionicons name="logo-google" size={18} color="#EA4335" />
                  <Text style={styles.socialBtnTextGoogle}>Google</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Footer Link */}
        <View style={styles.footerRow}>
          <Text style={styles.footerText}>New to StockPot AI?</Text>
          <TouchableOpacity onPress={onSignUp} activeOpacity={0.7}>
            <Text style={styles.footerLink}>Create Free Account</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Forgot Password Modal */}
      <Modal
        visible={forgotModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setForgotModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={styles.modalIconWrap}>
                <Ionicons name="key-outline" size={22} color="#166534" />
              </View>
              <TouchableOpacity
                onPress={() => setForgotModalVisible(false)}
                style={styles.modalCloseBtn}
              >
                <Ionicons name="close" size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalTitle}>Reset Password</Text>
            <Text style={styles.modalSubtitle}>
              Enter your account email address and we will send you a password reset link.
            </Text>

            {forgotSuccess ? (
              <View style={styles.successBox}>
                <Ionicons name="checkmark-circle" size={28} color="#166534" />
                <Text style={styles.successTitle}>Reset Email Sent!</Text>
                <Text style={styles.successDesc}>
                  We've sent password reset instructions to{' '}
                  <Text style={{ fontWeight: '700' }}>{forgotEmail}</Text>.
                </Text>
                <TouchableOpacity
                  style={styles.modalDoneBtn}
                  onPress={() => setForgotModalVisible(false)}
                >
                  <Text style={styles.modalDoneBtnText}>Back to Sign In</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={{ marginTop: 14 }}>
                <Text style={styles.fieldLabel}>Email Address</Text>
                <View style={[styles.inputWrap, forgotError ? styles.inputWrapError : null]}>
                  <Ionicons name="mail-outline" size={19} color="#9CA3AF" />
                  <TextInput
                    style={styles.input}
                    value={forgotEmail}
                    onChangeText={(t) => {
                      setForgotEmail(t);
                      if (forgotError) setForgotError('');
                    }}
                    placeholder="chef@stockpot.ai"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
                {forgotError ? <Text style={styles.errorText}>{forgotError}</Text> : null}

                <TouchableOpacity
                  style={[styles.modalSubmitBtn, isSendingForgot && styles.primaryBtnDisabled]}
                  onPress={handleSendForgotPassword}
                  disabled={isSendingForgot}
                >
                  {isSendingForgot ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <Text style={styles.modalSubmitBtnText}>Send Reset Link</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* Custom Alert Modal */}
      <CustomAlertModal
        visible={alertConfig.visible}
        type={alertConfig.type}
        title={alertConfig.title}
        message={alertConfig.message}
        primaryButton={alertConfig.primaryButton}
        secondaryButton={alertConfig.secondaryButton}
        countdown={alertConfig.countdown}
        onClose={closeAlert}
      />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAF8',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 44 : 36,
    paddingBottom: 32,
  },
  brandSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logoWrap: {
    width: 84,
    height: 84,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: 'rgba(0,0,0,0.08)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 4,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 18,
  },
  brandName: {
    fontSize: 27,
    fontWeight: '900',
    color: '#1F2937',
    letterSpacing: -0.5,
  },
  brandAi: {
    color: '#166534',
  },
  tagline: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7280',
    marginTop: 4,
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 22,
    shadowColor: 'rgba(0, 0, 0, 0.06)',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  tabSwitch: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 3,
    marginBottom: 18,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
  tabBtnActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: 'rgba(0,0,0,0.06)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 3,
    elevation: 2,
  },
  tabBtnText: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#6B7280',
  },
  tabBtnTextActive: {
    color: '#111827',
    fontWeight: '700',
  },
  fieldGroup: {
    marginBottom: 14,
  },
  passwordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 6,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 13,
    paddingHorizontal: 12,
    gap: 8,
  },
  inputWrapFocused: {
    borderColor: '#166534',
    backgroundColor: '#FFFFFF',
  },
  inputWrapError: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  input: {
    flex: 1,
    paddingVertical: 11,
    fontSize: 15,
    color: '#111827',
  },
  eyeBtn: {
    padding: 4,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  forgotText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#166534',
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#166534',
    borderRadius: 13,
    paddingVertical: 13,
    marginTop: 6,
    shadowColor: '#166534',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  primaryBtnDisabled: {
    opacity: 0.7,
  },
  primaryBtnText: {
    fontSize: 15.5,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 18,
    marginBottom: 14,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  dividerText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  socialRow: {
    flexDirection: 'row',
    gap: 12,
  },
  socialBtnApple: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#000000',
    paddingVertical: 12,
    borderRadius: 13,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 3,
    elevation: 2,
  },
  socialBtnTextApple: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  socialBtnGoogle: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: 'rgba(0,0,0,0.04)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 3,
    elevation: 1,
  },
  socialBtnTextGoogle: {
    color: '#374151',
    fontSize: 14,
    fontWeight: '700',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: 22,
  },
  footerText: {
    fontSize: 13.5,
    color: '#6B7280',
    fontWeight: '500',
  },
  footerLink: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#166534',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#1F2937',
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
    marginTop: 4,
  },
  modalSubmitBtn: {
    backgroundColor: '#166534',
    borderRadius: 13,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
  },
  modalSubmitBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  successBox: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  successTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#166534',
    marginTop: 8,
  },
  successDesc: {
    fontSize: 13,
    color: '#4B5563',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 19,
  },
  modalDoneBtn: {
    backgroundColor: '#166534',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginTop: 18,
  },
  modalDoneBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});

export default LoginScreen;
