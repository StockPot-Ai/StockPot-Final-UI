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
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../constants/colors';
import { useAccount } from '../context/AccountContext';
import { getApiBaseUrl, setApiBaseUrl, apiClient } from '../services/api';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const LoginScreen = ({ onSignUp, onForgotPassword }) => {
  const { login } = useAccount();

  const [email, setEmail] = useState('ammar@example.com');
  const [password, setPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Debug & Server Settings State
  const [serverUrl, setServerUrl] = useState(getApiBaseUrl());
  const [showDebug, setShowDebug] = useState(true);
  const [pingStatus, setPingStatus] = useState(null); // 'testing' | 'ok' | 'fail'
  const [pingError, setPingError] = useState(null);
  const [lastLoginError, setLastLoginError] = useState(null);

  const passwordRef = useRef(null);

  const handleTestConnection = async () => {
    setPingStatus('testing');
    setPingError(null);
    try {
      setApiBaseUrl(serverUrl);
      const res = await apiClient.get('/health');
      setPingStatus('ok');
      setPingError(`Connected! Service: ${res?.data?.service || 'StockPot API'}`);
    } catch (err) {
      setPingStatus('fail');
      setPingError(
        `Failed to reach ${serverUrl}/health:\n${err.message || err.toString()}`
      );
    }
  };

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
    } else if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      valid = false;
    } else {
      setPasswordError('');
    }

    return valid;
  };

  const handleLogin = async () => {
    if (!validate()) {
      return;
    }

    setIsSubmitting(true);
    setLastLoginError(null);

    // Ensure custom URL is saved before calling
    setApiBaseUrl(serverUrl);

    try {
      await login({ email: email.trim(), password });
    } catch (err) {
      console.log('Login failed with error:', err);
      const targetUrl = `${getApiBaseUrl()}/auth/login`;
      const detailedMsg = err.message || err.toString();
      setLastLoginError({
        message: detailedMsg,
        url: targetUrl,
        hint:
          detailedMsg.includes('Network request failed') || detailedMsg.includes('Failed to fetch')
            ? 'Your phone cannot connect to this IP. Ensure phone & PC are on the same Wi-Fi (not guest Wi-Fi) or try mobile hotspot.'
            : 'Check email and password or verify server logs.',
      });
      Alert.alert(
        'Login Failed',
        `Target: ${targetUrl}\n\nError: ${detailedMsg}\n\nTip: You can use "Bypass (Offline Dev Mode)" below if your Wi-Fi blocks device-to-device ports.`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBypass = () => {
    // Quick dev login without network block
    login();
  };

  const handleForgotPassword = () => {
    if (onForgotPassword) {
      onForgotPassword();
    } else {
      Alert.alert('Forgot Password', 'Enter your email to receive a reset link.', [
        { text: 'OK' },
      ]);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Brand */}
        <View style={styles.brandSection}>
          <Image
            source={require('../../assets/icon.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.brandName}>StockPot AI</Text>
          <Text style={styles.brandTagline}>Zero waste. Zero stress. Real savings.</Text>
        </View>

        {/* Card */}
        <View style={styles.card}>
          <Text style={styles.screenTitle}>Welcome Back</Text>
          <Text style={styles.screenSubtitle}>
            Sign in to continue to your kitchen.
          </Text>

          {/* Email */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Email</Text>
            <View
              style={[
                styles.inputWrap,
                emailError ? styles.inputWrapError : null,
              ]}
            >
              <Ionicons name="mail-outline" size={18} color={Colors.accountTextSecondary} />
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={(t) => {
                  setEmail(t);
                  if (emailError) setEmailError('');
                }}
                placeholder="you@example.com"
                placeholderTextColor="#9CA3AF"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="next"
                onSubmitEditing={() => passwordRef.current?.focus()}
                accessibilityLabel="Email input"
              />
            </View>
            {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}
          </View>

          {/* Password */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Password</Text>
            <View
              style={[
                styles.inputWrap,
                passwordError ? styles.inputWrapError : null,
              ]}
            >
              <Ionicons name="lock-closed-outline" size={18} color={Colors.accountTextSecondary} />
              <TextInput
                ref={passwordRef}
                style={styles.input}
                value={password}
                onChangeText={(t) => {
                  setPassword(t);
                  if (passwordError) setPasswordError('');
                }}
                placeholder="Enter your password"
                placeholderTextColor="#9CA3AF"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="done"
                onSubmitEditing={handleLogin}
                accessibilityLabel="Password input"
              />
              <TouchableOpacity
                onPress={() => setShowPassword((prev) => !prev)}
                style={styles.eyeBtn}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color={Colors.accountTextSecondary}
                />
              </TouchableOpacity>
            </View>
            {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}

            {/* Forgot Password */}
            <TouchableOpacity
              onPress={handleForgotPassword}
              style={styles.forgotBtn}
              activeOpacity={0.7}
            >
              <Text style={styles.forgotText}>Forgot Password?</Text>
            </TouchableOpacity>
          </View>

          {/* Error Message Box */}
          {lastLoginError && (
            <View style={styles.errorBanner}>
              <View style={styles.errorBannerTop}>
                <Ionicons name="alert-circle" size={18} color="#DC2626" />
                <Text style={styles.errorBannerTitle}>Connection / Auth Error</Text>
              </View>
              <Text style={styles.errorBannerText}>{lastLoginError.message}</Text>
              <Text style={styles.errorBannerUrl}>Target: {lastLoginError.url}</Text>
              <Text style={styles.errorBannerHint}>{lastLoginError.hint}</Text>
            </View>
          )}

          {/* Login Button */}
          <TouchableOpacity
            style={[styles.loginBtn, isSubmitting && styles.loginBtnDisabled]}
            onPress={handleLogin}
            activeOpacity={0.85}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <ActivityIndicator size="small" color="#FFFFFF" />
                <Text style={styles.loginBtnText}>Connecting to Server...</Text>
              </View>
            ) : (
              <>
                <Text style={styles.loginBtnText}>Log In</Text>
                <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
              </>
            )}
          </TouchableOpacity>

          {/* Dev Bypass Button */}
          <TouchableOpacity
            style={styles.bypassBtn}
            onPress={handleBypass}
            activeOpacity={0.75}
          >
            <Ionicons name="flash-outline" size={16} color={Colors.primary} />
            <Text style={styles.bypassBtnText}>Skip Login (Offline / Demo Mode)</Text>
          </TouchableOpacity>
        </View>

        {/* ── Server URL & Connection Debug Panel ── */}
        <View style={styles.debugCard}>
          <TouchableOpacity
            style={styles.debugToggle}
            onPress={() => setShowDebug((v) => !v)}
            activeOpacity={0.8}
          >
            <View style={styles.debugToggleLeft}>
              <Ionicons name="terminal-outline" size={16} color="#4B5563" />
              <Text style={styles.debugToggleTitle}>Backend Connection & Debug</Text>
            </View>
            <Ionicons
              name={showDebug ? 'chevron-up' : 'chevron-down'}
              size={18}
              color="#6B7280"
            />
          </TouchableOpacity>

          {showDebug && (
            <View style={styles.debugBody}>
              <Text style={styles.debugLabel}>Backend API URL</Text>
              <View style={styles.debugInputRow}>
                <TextInput
                  style={styles.debugInput}
                  value={serverUrl}
                  onChangeText={setServerUrl}
                  placeholder="http://192.168.1.15:5000/api"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity
                  style={styles.pingBtn}
                  onPress={handleTestConnection}
                  disabled={pingStatus === 'testing'}
                  activeOpacity={0.8}
                >
                  {pingStatus === 'testing' ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.pingBtnText}>Test</Text>
                  )}
                </TouchableOpacity>
              </View>

              {/* Ping Result */}
              {pingError && (
                <View
                  style={[
                    styles.pingResultBox,
                    pingStatus === 'ok' ? styles.pingSuccess : styles.pingFailure,
                  ]}
                >
                  <Ionicons
                    name={pingStatus === 'ok' ? 'checkmark-circle' : 'close-circle'}
                    size={16}
                    color={pingStatus === 'ok' ? '#059669' : '#DC2626'}
                  />
                  <Text
                    style={[
                      styles.pingResultText,
                      pingStatus === 'ok' ? styles.pingSuccessText : styles.pingFailureText,
                    ]}
                  >
                    {pingError}
                  </Text>
                </View>
              )}

              <Text style={styles.debugHint}>
                💡 If on campus/university Wi-Fi, port 5000 is often blocked between devices. Use laptop hotspot or the Bypass button above.
              </Text>
            </View>
          )}
        </View>

        {/* Create Account */}
        <View style={styles.signupRow}>
          <Text style={styles.signupQuestion}>Don't have an account?</Text>
          <TouchableOpacity onPress={onSignUp} activeOpacity={0.7}>
            <Text style={styles.signupLink}>Create Account</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
    paddingTop: Platform.OS === 'ios' ? 40 : 36,
    paddingBottom: 40,
  },
  brandSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logo: {
    width: 68,
    height: 68,
    marginBottom: 10,
  },
  brandName: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1C1917',
    letterSpacing: -0.5,
  },
  brandTagline: {
    fontSize: 13,
    color: '#78716C',
    marginTop: 4,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E7E5E4',
  },
  screenTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1C1917',
  },
  screenSubtitle: {
    fontSize: 13,
    color: '#78716C',
    marginTop: 4,
    marginBottom: 18,
  },
  fieldGroup: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#44403C',
    marginBottom: 6,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 12,
    height: 48,
  },
  inputWrapError: {
    borderColor: '#EF4444',
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: '#1C1917',
    marginLeft: 8,
  },
  eyeBtn: {
    padding: 6,
  },
  errorText: {
    fontSize: 11,
    color: '#EF4444',
    marginTop: 4,
  },
  forgotBtn: {
    alignSelf: 'flex-end',
    marginTop: 8,
  },
  forgotText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primary,
  },
  errorBanner: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
    gap: 4,
  },
  errorBannerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  errorBannerTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#DC2626',
  },
  errorBannerText: {
    fontSize: 12,
    color: '#991B1B',
  },
  errorBannerUrl: {
    fontSize: 11,
    color: '#78716C',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  errorBannerHint: {
    fontSize: 11,
    color: '#B45309',
    marginTop: 4,
  },
  loginBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 6,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  loginBtnDisabled: {
    opacity: 0.6,
  },
  loginBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  bypassBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    marginTop: 10,
    borderRadius: 12,
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FED7AA',
  },
  bypassBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primary,
  },
  debugCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  debugToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    backgroundColor: '#F9FAFB',
  },
  debugToggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  debugToggleTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  debugBody: {
    padding: 14,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  debugLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4B5563',
    marginBottom: 6,
  },
  debugInputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  debugInput: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: '#1F2937',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  pingBtn: {
    backgroundColor: '#374151',
    borderRadius: 10,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pingBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  pingResultBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    padding: 10,
    borderRadius: 8,
    marginTop: 10,
  },
  pingSuccess: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  pingFailure: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  pingResultText: {
    fontSize: 12,
    flex: 1,
  },
  pingSuccessText: {
    color: '#065F46',
  },
  pingFailureText: {
    color: '#991B1B',
  },
  debugHint: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 8,
    lineHeight: 16,
  },
  signupRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    gap: 6,
  },
  signupQuestion: {
    fontSize: 13,
    color: '#78716C',
  },
  signupLink: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primary,
  },
});

export default LoginScreen;
