import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, Feather, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import Colors from '../constants/colors';
import { aiService } from '../services';
import { useAccount } from '../context/AccountContext';
import PremiumUpgradeModal from './account/PremiumUpgradeModal';
import safeStorage from '../utils/safeStorage';
import MarkdownMessage from './common/MarkdownMessage';

const QUICK_PROMPTS = [
  'Suggest a cheap dinner for four',
  'Best grocery discounts today?',
  'Quick high-protein breakfast recipe',
  'How to reduce food waste this week?',
];

const getTodayKey = () => {
  const now = new Date();
  return `@stockpot_ai_usage_${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};

export default function AIChatModal({ visible, onClose }) {
  const { customerPlan, isPremium, isPro, profile, verifyEmailCode, sendEmailVerification } = useAccount();
  const DEFAULT_WELCOME_MSG = {
    id: 'welcome',
    role: 'assistant',
    text: '### Bonjour! I am Chef Tete👨‍🍳\n\nI am your personal culinary sous-chef and grocery savings guide! How can I help you cook delicious food, substitute ingredients, or stretch your grocery budget today? 🍲',
    source: 'gemini',
  };

  const CHAT_HISTORY_KEY = '@stockpot_ai_chat_history';

  const [messages, setMessages] = useState([DEFAULT_WELCOME_MSG]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [dailyCount, setDailyCount] = useState(0);
  const [upgradeModalVisible, setUpgradeModalVisible] = useState(false);
  const scrollViewRef = useRef(null);

  // Email verification anti-spam state
  const isEmailVerified = profile?.isEmailVerified === true;
  const [emailInput, setEmailInput] = useState(profile?.email || '');
  const [verifyCode, setVerifyCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const [verifyError, setVerifyError] = useState('');

  const handleVerifyCode = async () => {
    const code = verifyCode.trim();
    if (!code || code.length !== 6) {
      setVerifyError('Please enter the 6-digit verification code sent to your email.');
      return;
    }
    setIsVerifying(true);
    setVerifyError('');
    try {
      const target = emailInput.trim() || profile?.email;
      await verifyEmailCode(code, target);
    } catch (err) {
      setVerifyError(err.message || 'Invalid or expired code. Please check the code in your email inbox.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSendVerification = async () => {
    const target = emailInput.trim() || profile?.email;
    if (!target || !target.includes('@')) {
      setVerifyError('Please enter a valid email address.');
      return;
    }
    setIsSendingCode(true);
    setVerifyError('');
    try {
      await sendEmailVerification(target);
      setVerificationSent(true);
    } catch (err) {
      setVerifyError(err.message || 'Could not send verification code via Supabase. Please try again.');
    } finally {
      setIsSendingCode(false);
    }
  };

  // Daily Query Limits:
  // Free: 5 / day | Smart: 50 / day | Pro: Unlimited (-1)
  const maxQueries = isPro ? -1 : isPremium ? 50 : 5;

  const loadChatHistory = useCallback(async () => {
    try {
      const saved = await safeStorage.getItem(CHAT_HISTORY_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages(parsed);
          return;
        }
      }
    } catch (_) { }
    setMessages([DEFAULT_WELCOME_MSG]);
  }, []);

  const saveChatHistory = async (newMsgs) => {
    try {
      await safeStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(newMsgs.slice(-40)));
    } catch (_) { }
  };

  const handleNewChat = () => {
    setMessages([DEFAULT_WELCOME_MSG]);
    safeStorage.removeItem(CHAT_HISTORY_KEY).catch(() => { });
  };

  const loadDailyUsage = useCallback(async () => {
    try {
      const key = getTodayKey();
      const val = await safeStorage.getItem(key);
      const count = val ? parseInt(val, 10) : 0;
      setDailyCount(count);
    } catch (_) {
      setDailyCount(0);
    }
  }, []);

  useEffect(() => {
    if (visible) {
      loadDailyUsage();
      loadChatHistory();
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 150);
    }
  }, [visible, loadDailyUsage, loadChatHistory]);

  const incrementDailyUsage = async () => {
    try {
      const key = getTodayKey();
      const next = dailyCount + 1;
      setDailyCount(next);
      await safeStorage.setItem(key, String(next));
    } catch (_) { }
  };

  const isLimitReached = maxQueries !== -1 && dailyCount >= maxQueries;

  const handleSend = async (messageToSend) => {
    const text = (messageToSend || inputText).trim();
    if (!text || loading) return;

    if (isLimitReached) {
      setUpgradeModalVisible(true);
      return;
    }

    const userMsg = {
      id: Date.now().toString(),
      role: 'user',
      text,
    };

    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    saveChatHistory(nextMessages);
    setInputText('');
    setLoading(true);
    await incrementDailyUsage();

    try {
      const historyPayload = nextMessages
        .filter((m) => m.id !== 'welcome' && !m.isError)
        .slice(-8)
        .map((m) => ({ role: m.role, text: m.text }));

      const response = await aiService.chat(text, historyPayload);
      const replyText =
        typeof response === 'string'
          ? response
          : response?.response || response?.reply || 'Here is Chef Tété’s culinary advice!';
      const assistantMsg = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        text: replyText,
        source: response?.source || 'gemini',
      };
      const updatedMessages = [...nextMessages, assistantMsg];
      setMessages(updatedMessages);
      saveChatHistory(updatedMessages);
    } catch (err) {
      const errorMsg = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        text: 'Sorry, Chef Tetehad a little kitchen hiccup connecting to the network! Please check your connection and try again.',
        isError: true,
      };
      const updatedMessages = [...nextMessages, errorMsg];
      setMessages(updatedMessages);
      saveChatHistory(updatedMessages);
    } finally {
      setLoading(false);
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          style={styles.container}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.aiBadge}>
                <MaterialCommunityIcons name="chef-hat" size={18} color="#FFFFFF" />
              </View>
              <View style={styles.headerTextCol}>
                <View style={styles.headerTitleRow}>
                  <Text style={styles.headerTitle} numberOfLines={1}>Chef Tete👨‍🍳</Text>
                  {isPro ? (
                    <View style={styles.planBadgePro}>
                      <FontAwesome5 name="crown" size={9} color="#E8A93F" />
                      <Text style={styles.planBadgeTextPro}>PRO</Text>
                    </View>
                  ) : isPremium ? (
                    <View style={styles.planBadgeSmart}>
                      <Ionicons name="flash" size={10} color="#3A6847" />
                      <Text style={styles.planBadgeTextSmart}>SMART</Text>
                    </View>
                  ) : (
                    <View style={styles.planBadgeFree}>
                      <Text style={styles.planBadgeTextFree}>FREE</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.headerSubtitle} numberOfLines={1}>
                  {isPro
                    ? 'Unlimited Questions 👑'
                    : `${Math.max(0, maxQueries - dailyCount)} of ${maxQueries} queries left today`}
                </Text>
              </View>
            </View>
            <View style={styles.headerRightActions}>
              <TouchableOpacity
                onPress={handleNewChat}
                style={styles.newChatBtn}
                activeOpacity={0.75}
                accessibilityLabel="Start New Chat"
                hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
              >
                <Feather name="refresh-cw" size={13} color="#3A6847" />
                <Text style={styles.newChatBtnText}>New Chat</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  Keyboard.dismiss();
                  if (onClose) onClose();
                }}
                style={styles.closeBtn}
                activeOpacity={0.7}
                hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
                accessibilityRole="button"
                accessibilityLabel="Close AI Chef"
              >
                <Feather name="x" size={18} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Paywall Banner if Free or Smart reached limit */}
          {isLimitReached && (
            <View style={styles.paywallBanner}>
              <View style={styles.paywallLeft}>
                <Ionicons name="lock-closed" size={16} color="#994122" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.paywallTitle}>Daily Query Limit Reached</Text>
                  <Text style={styles.paywallSub}>
                    {isPremium
                      ? 'Smart tier limit is 50/day. Upgrade to Pro for unlimited AI!'
                      : 'Free tier limit is 5/day. Upgrade to Smart or Pro to continue.'}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.paywallBtn}
                onPress={() => setUpgradeModalVisible(true)}
                activeOpacity={0.85}
              >
                <Text style={styles.paywallBtnText}>Upgrade</Text>
              </TouchableOpacity>
            </View>
          )}

          {!isEmailVerified ? (
            /* Email Verification Anti-Spam Gate */
            <ScrollView
              contentContainerStyle={styles.verificationContainer}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.verificationCard}>
                <View style={styles.verificationIconBadge}>
                  <Ionicons name="shield-checkmark" size={34} color="#E8A93F" />
                </View>
                <Text style={styles.verificationTitle}>Verify Email with Supabase</Text>
                <Text style={styles.verificationSubtitle}>
                  To protect AI Sous-Chef computing capacity and prevent automated spam, we send a genuine 6-digit one-time code to your email via Supabase Auth.
                </Text>

                <View style={styles.emailInputRow}>
                  <Ionicons name="mail-outline" size={17} color="#3A6847" />
                  <TextInput
                    style={styles.emailTextInput}
                    placeholder="Enter your email address"
                    placeholderTextColor="#968880"
                    value={emailInput}
                    onChangeText={(t) => {
                      setEmailInput(t);
                      if (verifyError) setVerifyError('');
                    }}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <TouchableOpacity
                    style={[styles.sendCodeActionBtn, isSendingCode && { opacity: 0.6 }]}
                    onPress={handleSendVerification}
                    disabled={isSendingCode}
                    activeOpacity={0.8}
                  >
                    {isSendingCode ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text style={styles.sendCodeActionBtnText}>
                        {verificationSent ? 'Resend' : 'Send Code'}
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>

                {verificationSent && (
                  <View style={styles.verificationSentBanner}>
                    <Ionicons name="checkmark-circle" size={15} color="#166534" />
                    <Text style={styles.verificationSentText}>
                      Real 6-digit code dispatched to {emailInput.trim() || profile?.email}! Check your inbox & spam.
                    </Text>
                  </View>
                )}

                <View style={[styles.codeInputWrap, verifyError ? styles.codeInputWrapError : null]}>
                  <Ionicons name="key-outline" size={18} color="#968880" />
                  <TextInput
                    style={styles.codeInput}
                    placeholder="Enter 6-digit verification code"
                    placeholderTextColor="#968880"
                    value={verifyCode}
                    onChangeText={(t) => {
                      setVerifyCode(t);
                      if (verifyError) setVerifyError('');
                    }}
                    keyboardType="number-pad"
                    maxLength={6}
                  />
                </View>
                {verifyError ? <Text style={styles.verifyErrorText}>{verifyError}</Text> : null}

                <TouchableOpacity
                  style={[styles.verifySubmitBtn, isVerifying && { opacity: 0.7 }]}
                  onPress={handleVerifyCode}
                  disabled={isVerifying}
                  activeOpacity={0.85}
                >
                  {isVerifying ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <Text style={styles.verifySubmitBtnText}>Verify & Unlock Chef Tété</Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          ) : (
            <View style={{ flex: 1 }}>
              {/* Chat Messages */}
              <ScrollView
                ref={scrollViewRef}
                style={styles.chatScroll}
                contentContainerStyle={styles.chatContent}
                showsVerticalScrollIndicator={false}
              >
                {messages.map((item) => {
                  const isUser = item.role === 'user';
                  return (
                    <View
                      key={item.id}
                      style={[
                        styles.messageBubble,
                        isUser ? styles.userBubble : styles.assistantBubble,
                      ]}
                    >
                      {!isUser && (
                        <View style={styles.assistantHeader}>
                          <Ionicons name="sparkles" size={12} color="#3A6847" />
                          <Text style={styles.assistantName}>Chef Tete👨‍🍳</Text>
                        </View>
                      )}
                      <MarkdownMessage content={item.text} isUser={isUser} />
                    </View>
                  );
                })}

                {loading && (
                  <View style={[styles.messageBubble, styles.assistantBubble, styles.loadingBubble]}>
                    <ActivityIndicator size="small" color="#3A6847" />
                    <Text style={styles.loadingText}>Chef Teteis cooking up an answer...</Text>
                  </View>
                )}
              </ScrollView>

              {/* Quick Prompts */}
              {!isLimitReached && messages.length <= 2 && (
                <View style={styles.quickPromptsWrap}>
                  <Text style={styles.quickPromptLabel}>Suggested Questions</Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.quickPromptsList}
                  >
                    {QUICK_PROMPTS.map((prompt, idx) => (
                      <TouchableOpacity
                        key={idx}
                        style={styles.quickPromptChip}
                        onPress={() => handleSend(prompt)}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.quickPromptText}>{prompt}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}

              {/* Input Area */}
              <View style={styles.inputContainer}>
                <TextInput
                  style={[styles.input, isLimitReached && styles.inputDisabled]}
                  placeholder={isLimitReached ? 'Upgrade plan to ask more questions today...' : 'Ask about recipes, budget substitutions, nutrition...'}
                  placeholderTextColor="#968880"
                  value={inputText}
                  onChangeText={setInputText}
                  multiline
                  maxLength={500}
                  editable={!isLimitReached && !loading}
                />
                {isLimitReached ? (
                  <TouchableOpacity
                    style={[styles.sendBtn, { backgroundColor: '#994122' }]}
                    onPress={() => setUpgradeModalVisible(true)}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="lock-closed" size={16} color="#FFFFFF" />
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={[
                      styles.sendBtn,
                      (!inputText.trim() || loading) && styles.sendBtnDisabled,
                    ]}
                    onPress={() => handleSend()}
                    disabled={!inputText.trim() || loading}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="arrow-up" size={18} color="#FFFFFF" />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}
        </KeyboardAvoidingView>

        {/* Upgrade Modal */}
        <PremiumUpgradeModal
          visible={upgradeModalVisible}
          onClose={() => setUpgradeModalVisible(false)}
        />
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
    backgroundColor: '#FAF8F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E8DFD8',
    zIndex: 100,
    elevation: 4,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    marginRight: 8,
  },
  headerTextCol: {
    flex: 1,
    minWidth: 0,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  aiBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#3A6847',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#2B2420',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#6B5E57',
    marginTop: 1,
  },
  planBadgePro: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FEF6EB',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  planBadgeTextPro: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#C6851C',
  },
  planBadgeSmart: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: '#EAF3EC',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  planBadgeTextSmart: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#3A6847',
  },
  planBadgeFree: {
    backgroundColor: '#F5EFEB',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  planBadgeTextFree: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#6B5E57',
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 0,
  },
  newChatBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#EAF3EC',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#C2E2C8',
  },
  newChatBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#3A6847',
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F5EFEB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  paywallBanner: {
    backgroundColor: '#FCECE8',
    borderBottomWidth: 1,
    borderBottomColor: '#F5D0C7',
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  paywallLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  paywallTitle: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#994122',
  },
  paywallSub: {
    fontSize: 11,
    color: '#6B5E57',
    marginTop: 1,
  },
  paywallBtn: {
    backgroundColor: '#994122',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  paywallBtnText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  chatScroll: {
    flex: 1,
  },
  chatContent: {
    padding: 16,
    gap: 12,
    paddingBottom: 16,
  },
  messageBubble: {
    maxWidth: '82%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#3A6847',
    borderBottomRightRadius: 4,
    shadowColor: '#3A6847',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  assistantBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#E8DFD8',
    shadowColor: 'rgba(43, 36, 32, 0.04)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 1,
  },
  assistantHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 4,
  },
  assistantName: {
    fontSize: 11,
    fontWeight: '700',
    color: '#3A6847',
  },
  messageText: {
    fontSize: 13.5,
    lineHeight: 19,
  },
  userMessageText: {
    color: '#FFFFFF',
  },
  assistantMessageText: {
    color: '#2B2420',
  },
  loadingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 14,
  },
  loadingText: {
    fontSize: 12.5,
    color: '#6B5E57',
  },
  quickPromptsWrap: {
    paddingLeft: 16,
    paddingBottom: 8,
  },
  quickPromptLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6B5E57',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  quickPromptsList: {
    gap: 8,
    paddingRight: 16,
  },
  quickPromptChip: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8DFD8',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  quickPromptText: {
    fontSize: 12,
    color: '#2B2420',
    fontWeight: '500',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E8DFD8',
    gap: 10,
  },
  input: {
    flex: 1,
    backgroundColor: '#FAF8F5',
    borderWidth: 1,
    borderColor: '#E8DFD8',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 9 : 7,
    fontSize: 13,
    color: '#2B2420',
    minHeight: 40,
    maxHeight: 90,
    textAlignVertical: 'center',
  },
  inputDisabled: {
    backgroundColor: '#F5EFEB',
    borderColor: '#E8DFD8',
    color: '#968880',
  },
  sendBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#3A6847',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: '#E8DFD8',
  },
  verificationContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  verificationCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#FAF8F5',
    borderRadius: 22,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E8DFD8',
  },
  verificationIconBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FEF6EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F9E2BE',
  },
  verificationTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2B2420',
    textAlign: 'center',
    marginBottom: 8,
  },
  verificationSubtitle: {
    fontSize: 13.5,
    lineHeight: 19,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 18,
  },
  emailInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8DFD8',
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 48,
    marginBottom: 12,
    gap: 8,
  },
  emailTextInput: {
    flex: 1,
    fontSize: 13.5,
    color: '#2B2420',
    padding: 0,
  },
  sendCodeActionBtn: {
    backgroundColor: '#3A6847',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
  },
  sendCodeActionBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  verificationEmailBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F7F4F0',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    marginBottom: 14,
    width: '100%',
  },
  verificationEmailText: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#3A6847',
  },
  verificationSentBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EAF3EC',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    marginBottom: 12,
    width: '100%',
  },
  verificationSentText: {
    fontSize: 12,
    color: '#166534',
    fontWeight: '600',
    flex: 1,
  },
  codeInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8DFD8',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 48,
    marginBottom: 8,
  },
  codeInputWrapError: {
    borderColor: '#994122',
  },
  codeInput: {
    flex: 1,
    fontSize: 14,
    color: '#2B2420',
  },
  verifyErrorText: {
    fontSize: 12.5,
    color: '#994122',
    marginBottom: 10,
  },
  verifySubmitBtn: {
    width: '100%',
    height: 46,
    backgroundColor: '#3A6847',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
    marginBottom: 12,
  },
  verifySubmitBtnText: {
    color: '#FFFFFF',
    fontSize: 14.5,
    fontWeight: '700',
  },
  resendBtn: {
    paddingVertical: 6,
  },
  resendBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#994122',
  },
});
