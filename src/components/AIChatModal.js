import React, { useState, useRef, useEffect } from 'react';
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
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../constants/colors';
import { aiService } from '../services';

const QUICK_PROMPTS = [
  'Suggest a cheap dinner for four people',
  'What are the best grocery discounts today?',
  'Quick high-protein breakfast recipe',
  'How can I reduce food waste this week?',
];

export default function AIChatModal({ visible, onClose }) {
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      text: 'Hello! I am your StockPot AI Chef. How can I help you plan budget-friendly, zero-waste meals today?',
      source: 'gemini',
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollViewRef = useRef(null);

  useEffect(() => {
    if (visible) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 150);
    }
  }, [visible, messages]);

  const handleSend = async (messageToSend) => {
    const text = (messageToSend || inputText).trim();
    if (!text || loading) return;

    const userMsg = {
      id: Date.now().toString(),
      role: 'user',
      text,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setLoading(true);

    try {
      const response = await aiService.chat(text);
      const assistantMsg = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        text: response.response || 'I found a great recipe suggestion for you!',
        source: response.source || 'gemini',
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          text:
            'Sorry, I could not connect to the StockPot AI service right now. Please check that the Flask server is running.',
          isError: true,
        },
      ]);
    } finally {
      setLoading(false);
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          style={styles.container}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.aiBadge}>
                <Ionicons name="sparkles" size={16} color="#FFFFFF" />
              </View>
              <View>
                <Text style={styles.headerTitle}>StockPot AI Assistant</Text>
                <Text style={styles.headerSubtitle}>Powered by Google Gemini</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <Ionicons name="close" size={24} color={Colors.textPrimary} />
            </TouchableOpacity>
          </View>

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
                      <Ionicons name="sparkles" size={12} color={Colors.primary} />
                      <Text style={styles.assistantLabel}>StockPot AI</Text>
                    </View>
                  )}
                  <Text
                    style={[
                      styles.messageText,
                      isUser ? styles.userText : styles.assistantText,
                    ]}
                  >
                    {item.text}
                  </Text>
                </View>
              );
            })}

            {loading && (
              <View style={[styles.messageBubble, styles.assistantBubble, styles.loadingBubble]}>
                <ActivityIndicator size="small" color={Colors.primary} />
                <Text style={styles.loadingText}>StockPot AI is thinking...</Text>
              </View>
            )}
          </ScrollView>

          {/* Quick suggestions */}
          <View style={styles.quickPromptsWrapper}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.quickPromptsContent}
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

          {/* Input Box */}
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Ask about recipes, budget, stores..."
              placeholderTextColor={Colors.textSecondary}
              value={inputText}
              onChangeText={setInputText}
              onSubmitEditing={() => handleSend()}
              returnKeyType="send"
            />
            <TouchableOpacity
              style={[
                styles.sendBtn,
                (!inputText.trim() || loading) && styles.sendBtnDisabled,
              ]}
              onPress={() => handleSend()}
              disabled={!inputText.trim() || loading}
              activeOpacity={0.8}
            >
              <Ionicons name="arrow-up" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
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
    backgroundColor: '#FAFAF8',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0EFEA',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  aiBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  closeBtn: {
    padding: 6,
  },
  chatScroll: {
    flex: 1,
  },
  chatContent: {
    padding: 16,
    gap: 12,
  },
  messageBubble: {
    maxWidth: '82%',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 16,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: Colors.primary,
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#ECEAE4',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  assistantHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  assistantLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.primary,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  userText: {
    color: '#FFFFFF',
  },
  assistantText: {
    color: Colors.textPrimary,
  },
  loadingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
  quickPromptsWrapper: {
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F0EFEA',
  },
  quickPromptsContent: {
    paddingHorizontal: 12,
    gap: 8,
  },
  quickPromptChip: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  quickPromptText: {
    fontSize: 12,
    color: Colors.textPrimary,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    opacity: 0.4,
  },
});
