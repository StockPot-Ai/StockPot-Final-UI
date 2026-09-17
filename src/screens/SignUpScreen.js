import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Keyboard,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
  ActivityIndicator,
} from 'react-native';
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import Colors from '../constants/colors';
import { useAccount } from '../context/AccountContext';
import CustomAlertModal from '../components/common/CustomAlertModal';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const SignUpScreen = ({ onSignIn }) => {
  const { signup, loginWithGoogle } = useAccount();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);
  const [focusedField, setFocusedField] = useState(null);

  // Custom Alert Modal State
  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    type: 'info',
    title: '',
    message: '',
    primaryButton: null,
    secondaryButton: null,
  });

  const showAlert = ({ type = 'info', title, message, primaryButton, secondaryButton }) => {
    setAlertConfig({
      visible: true,
      type,
      title,
      message,
      primaryButton: primaryButton || { text: 'OK', onPress: () => setAlertConfig((prev) => ({ ...prev, visible: false })) },
      secondaryButton: secondaryButton || null,
    });
  };

  const closeAlert = () => {
    setAlertConfig((prev) => ({ ...prev, visible: false }));
  };

  const emailRef = useRef(null);
  const passwordRef = useRef(null);
  const confirmPasswordRef = useRef(null);

  // Keyboard and Scroll Management
  const scrollViewRef = useRef(null);
  const cardY = useRef(0);
  const fieldLayouts = useRef({});
  const currentFocusedFieldRef = useRef(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const onKeyboardShow = (e) => {
      const height = e?.endCoordinates?.height || (Platform.OS === 'ios' ? 336 : 280);
      setKeyboardHeight(height);
      if (currentFocusedFieldRef.current) {
        const fieldToScroll = currentFocusedFieldRef.current;
        setTimeout(() => {
          scrollToField(fieldToScroll);
        }, 50);
      }
    };

    const onKeyboardHide = () => {
      setKeyboardHeight(0);
      currentFocusedFieldRef.current = null;
    };

    const showSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      onKeyboardShow
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      onKeyboardHide
    );

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const scrollToField = (fieldName) => {
    if (!fieldName || !scrollViewRef.current) return;
    const fieldOffset = fieldLayouts.current[fieldName]?.y || 0;
    const targetY = (cardY.current || 0) + fieldOffset;
    if (targetY > 0) {
      scrollViewRef.current.scrollTo({
        y: Math.max(0, targetY - (Platform.OS === 'ios' ? 50 : 35)),
        animated: true,
      });
    }
  };

  const handleFieldFocus = (fieldName) => {
    setFocusedField(fieldName);
    currentFocusedFieldRef.current = fieldName;
    setTimeout(() => {
      scrollToField(fieldName);
    }, 100);
  };

  const validate = () => {
    const newErrors = {};

    if (!fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }

    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!EMAIL_REGEX.test(email.trim())) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignUp = async () => {
    if (!validate()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await signup({
        fullName: fullName.trim(),
        email: email.trim(),
        password,
      });
    } catch (err) {
      const errMsg = err.message || '';
      const isGoogleConflict =
        errMsg.toLowerCase().includes('google') ||
        errMsg.toLowerCase().includes('google sign-in');
      const isExistingAccount =
        errMsg.toLowerCase().includes('already') ||
        errMsg.toLowerCase().includes('exists');

      if (isGoogleConflict) {
        showAlert({
          type: 'warning',
          title: 'Google Account Detected',
          message: `An account with ${email.trim()} was registered using Google Sign-In. You can sign in immediately using Google.`,
          primaryButton: {
            text: 'Sign In with Google',
            onPress: () => {
              closeAlert();
              handleSocialAuth('Google');
            },
          },
          secondaryButton: {
            text: 'Switch to Sign In',
            onPress: () => {
              closeAlert();
              onSignIn();
            },
          },
        });
      } else if (isExistingAccount) {
        showAlert({
          type: 'error',
          title: 'Account Already Exists',
          message: `An account for ${email.trim()} is already registered. Please sign in with your credentials or reset your password.`,
          primaryButton: {
            text: 'Switch to Sign In',
            onPress: () => {
              closeAlert();
              onSignIn();
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
          title: 'Registration Failed',
          message: errMsg || 'Could not complete registration. Passwords must be at least 8 characters.',
          primaryButton: {
            text: 'Try Again',
            onPress: closeAlert,
          },
        });
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
            message: err.message || 'Could not complete Google Sign-In.',
            primaryButton: { text: 'OK', onPress: closeAlert },
          });
        }
      } finally {
        setIsGoogleSubmitting(false);
      }
    } else {
      showAlert({
        type: 'info',
        title: `${provider} Sign-Up`,
        message: `${provider} Sign-Up is available on supported iOS devices.`,
        primaryButton: { text: 'OK', onPress: closeAlert },
      });
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          keyboardHeight > 0 && {
            paddingBottom: Math.max(keyboardHeight + 24, 220),
            justifyContent: 'flex-start',
          },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <View style={styles.innerTouchable}>
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
            <View
              style={styles.card}
              onLayout={(e) => {
                cardY.current = e.nativeEvent.layout.y;
              }}
            >
              {/* Segmented Switch */}
              <View style={styles.tabSwitch}>
                <TouchableOpacity
                  style={styles.tabBtn}
                  onPress={onSignIn}
                  activeOpacity={0.7}
                >
                  <Text style={styles.tabBtnText}>Sign In</Text>
                </TouchableOpacity>
                <View style={[styles.tabBtn, styles.tabBtnActive]}>
                  <Text style={[styles.tabBtnText, styles.tabBtnTextActive]}>Create Account</Text>
                </View>
              </View>

              {/* Full Name */}
              <View
                style={styles.fieldGroup}
                onLayout={(e) => {
                  fieldLayouts.current['fullName'] = e.nativeEvent.layout;
                }}
              >
                <Text style={styles.fieldLabel}>Full Name</Text>
                <View
                  style={[
                    styles.inputWrap,
                    focusedField === 'fullName' && styles.inputWrapFocused,
                    errors.fullName ? styles.inputWrapError : null,
                  ]}
                >
                  <Ionicons
                    name="person-outline"
                    size={19}
                    color={focusedField === 'fullName' ? '#166534' : '#9CA3AF'}
                  />
                  <TextInput
                    style={styles.input}
                    value={fullName}
                    onChangeText={(t) => {
                      setFullName(t);
                      if (errors.fullName) setErrors((prev) => ({ ...prev, fullName: null }));
                    }}
                    onFocus={() => handleFieldFocus('fullName')}
                    onBlur={() => {
                      setFocusedField(null);
                      if (currentFocusedFieldRef.current === 'fullName') {
                        currentFocusedFieldRef.current = null;
                      }
                    }}
                    placeholder="Ammar Dharma"
                    placeholderTextColor="#9CA3AF"
                    autoCapitalize="words"
                    autoCorrect={false}
                    returnKeyType="next"
                    onSubmitEditing={() => emailRef.current?.focus()}
                  />
                </View>
                {errors.fullName ? <Text style={styles.errorText}>{errors.fullName}</Text> : null}
              </View>

              {/* Email Address */}
              <View
                style={styles.fieldGroup}
                onLayout={(e) => {
                  fieldLayouts.current['email'] = e.nativeEvent.layout;
                }}
              >
                <Text style={styles.fieldLabel}>Email Address</Text>
                <View
                  style={[
                    styles.inputWrap,
                    focusedField === 'email' && styles.inputWrapFocused,
                    errors.email ? styles.inputWrapError : null,
                  ]}
                >
                  <Ionicons
                    name="mail-outline"
                    size={19}
                    color={focusedField === 'email' ? '#166534' : '#9CA3AF'}
                  />
                  <TextInput
                    ref={emailRef}
                    style={styles.input}
                    value={email}
                    onChangeText={(t) => {
                      setEmail(t);
                      if (errors.email) setErrors((prev) => ({ ...prev, email: null }));
                    }}
                    onFocus={() => handleFieldFocus('email')}
                    onBlur={() => {
                      setFocusedField(null);
                      if (currentFocusedFieldRef.current === 'email') {
                        currentFocusedFieldRef.current = null;
                      }
                    }}
                    placeholder="chef@stockpot.ai"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType="next"
                    onSubmitEditing={() => passwordRef.current?.focus()}
                  />
                </View>
                {errors.email ? <Text style={styles.errorText}>{errors.email}</Text> : null}
              </View>

              {/* Password */}
              <View
                style={styles.fieldGroup}
                onLayout={(e) => {
                  fieldLayouts.current['password'] = e.nativeEvent.layout;
                }}
              >
                <Text style={styles.fieldLabel}>Password</Text>
                <View
                  style={[
                    styles.inputWrap,
                    focusedField === 'password' && styles.inputWrapFocused,
                    errors.password ? styles.inputWrapError : null,
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
                      if (errors.password) setErrors((prev) => ({ ...prev, password: null }));
                    }}
                    onFocus={() => handleFieldFocus('password')}
                    onBlur={() => {
                      setFocusedField(null);
                      if (currentFocusedFieldRef.current === 'password') {
                        currentFocusedFieldRef.current = null;
                      }
                    }}
                    placeholder="At least 6 characters"
                    placeholderTextColor="#9CA3AF"
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType="next"
                    onSubmitEditing={() => confirmPasswordRef.current?.focus()}
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
                {errors.password ? <Text style={styles.errorText}>{errors.password}</Text> : null}
              </View>

              {/* Confirm Password */}
              <View
                style={styles.fieldGroup}
                onLayout={(e) => {
                  fieldLayouts.current['confirmPassword'] = e.nativeEvent.layout;
                }}
              >
                <Text style={styles.fieldLabel}>Confirm Password</Text>
                <View
                  style={[
                    styles.inputWrap,
                    focusedField === 'confirmPassword' && styles.inputWrapFocused,
                    errors.confirmPassword ? styles.inputWrapError : null,
                  ]}
                >
                  <Ionicons
                    name="shield-checkmark-outline"
                    size={19}
                    color={focusedField === 'confirmPassword' ? '#166534' : '#9CA3AF'}
                  />
                  <TextInput
                    ref={confirmPasswordRef}
                    style={styles.input}
                    value={confirmPassword}
                    onChangeText={(t) => {
                      setConfirmPassword(t);
                      if (errors.confirmPassword) setErrors((prev) => ({ ...prev, confirmPassword: null }));
                    }}
                    onFocus={() => handleFieldFocus('confirmPassword')}
                    onBlur={() => {
                      setFocusedField(null);
                      if (currentFocusedFieldRef.current === 'confirmPassword') {
                        currentFocusedFieldRef.current = null;
                      }
                    }}
                    placeholder="Re-enter password"
                    placeholderTextColor="#9CA3AF"
                    secureTextEntry={!showConfirmPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType="done"
                    onSubmitEditing={handleSignUp}
                  />
                  <TouchableOpacity
                    onPress={() => setShowConfirmPassword((prev) => !prev)}
                    style={styles.eyeBtn}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={20}
                      color="#9CA3AF"
                    />
                  </TouchableOpacity>
                </View>
                {errors.confirmPassword ? <Text style={styles.errorText}>{errors.confirmPassword}</Text> : null}
              </View>

              {/* Create Account Button */}
              <TouchableOpacity
                style={[styles.primaryBtn, isSubmitting && styles.primaryBtnDisabled]}
                onPress={handleSignUp}
                activeOpacity={0.88}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <>
                    <Text style={styles.primaryBtnText}>Create Account</Text>
                    <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
                  </>
                )}
              </TouchableOpacity>

              {/* Divider */}
              <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>or register with</Text>
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

            {/* Footer info */}
            <View style={styles.footerRow}>
              <Text style={styles.footerText}>Already have an account?</Text>
              <TouchableOpacity onPress={onSignIn} activeOpacity={0.7}>
                <Text style={styles.footerLink}>Sign In</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </ScrollView>

      {/* Custom Alert Modal */}
      <CustomAlertModal
        visible={alertConfig.visible}
        type={alertConfig.type}
        title={alertConfig.title}
        message={alertConfig.message}
        primaryButton={alertConfig.primaryButton}
        secondaryButton={alertConfig.secondaryButton}
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
  innerTouchable: {
    width: '100%',
  },
  brandSection: {
    alignItems: 'center',
    marginBottom: 16,
  },
  logoWrap: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: 'rgba(0,0,0,0.08)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 4,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  logo: {
    width: 64,
    height: 64,
    borderRadius: 16,
  },
  brandName: {
    fontSize: 26,
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
    marginTop: 3,
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
    marginBottom: 16,
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
    marginBottom: 12,
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
    paddingVertical: 10,
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
    marginTop: 16,
    marginBottom: 12,
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
    marginTop: 18,
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
});

export default SignUpScreen;
