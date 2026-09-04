import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
  Alert,
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import Colors from '../../constants/colors';

const FAQS = [
  {
    q: 'How does StockPot AI calculate money saved?',
    a: 'We track the retail prices of ingredients you already own in your pantry and subtract that from the cost of dining out or buying redundant groceries.',
  },
  {
    q: 'How is waste avoided measured?',
    a: 'Every ingredient you mark as used before its expiry date is weighted in kilograms based on standard USDA portions.',
  },
  {
    q: 'Can I customize recipe servings for large families?',
    a: 'Yes! You can configure your household size in the Household & Preferences section to automatically rescale ingredient portions.',
  },
  {
    q: 'How do streaks work?',
    a: 'Logging at least one planned meal or updated grocery pantry item each day keeps your streak active and unlocks XP badges.',
  },
];

const HelpSupportModal = ({ visible, onClose }) => {
  const [expandedIndex, setExpandedIndex] = useState(0);

  const toggleExpand = (index) => {
    setExpandedIndex((prev) => (prev === index ? null : index));
  };

  const handleContactSupport = () => {
    Alert.alert(
      'Support Team Contacted',
      'Thank you! Our kitchen & culinary support team will respond to ammar@example.com within 24 hours.',
      [{ text: 'OK' }]
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.sheetContainer}>
          {/* Header */}
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Help & Support</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <Feather name="x" size={22} color="#4B5563" />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Quick Contact Card */}
            <View style={styles.contactCard}>
              <View style={styles.contactIcon}>
                <Ionicons name="headset-outline" size={24} color={Colors.forestGreen} />
              </View>
              <View style={styles.contactInfo}>
                <Text style={styles.contactTitle}>Need personalized help?</Text>
                <Text style={styles.contactSub}>Reach out to our 24/7 kitchen concierge</Text>
              </View>
              <TouchableOpacity
                style={styles.contactBtn}
                onPress={handleContactSupport}
                activeOpacity={0.8}
              >
                <Text style={styles.contactBtnText}>Contact</Text>
              </TouchableOpacity>
            </View>

            {/* FAQs */}
            <Text style={styles.sectionHeader}>Frequently Asked Questions</Text>

            {FAQS.map((faq, index) => {
              const isExpanded = expandedIndex === index;
              return (
                <View key={faq.q} style={styles.faqItem}>
                  <TouchableOpacity
                    style={styles.faqQuestionRow}
                    onPress={() => toggleExpand(index)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.faqQuestion}>{faq.q}</Text>
                    <Feather
                      name={isExpanded ? 'chevron-up' : 'chevron-down'}
                      size={18}
                      color="#6B7280"
                    />
                  </TouchableOpacity>
                  {isExpanded && (
                    <View style={styles.faqAnswerWrap}>
                      <Text style={styles.faqAnswer}>{faq.a}</Text>
                    </View>
                  )}
                </View>
              );
            })}

            {/* Version Footer */}
            <View style={styles.versionWrap}>
              <Text style={styles.versionText}>StockPot AI Mobile App</Text>
              <Text style={styles.versionSub}>Version 1.2.0 • Build 2026.09</Text>
            </View>
          </ScrollView>

          {/* Action Row */}
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.doneBtn} onPress={onClose} activeOpacity={0.8}>
              <Text style={styles.doneBtnText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    paddingBottom: Platform.OS === 'ios' ? 32 : 16,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3ECE4',
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.accountTextPrimary,
  },
  closeBtn: {
    padding: 4,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 12,
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAF7F2',
    borderWidth: 1,
    borderColor: Colors.accountBorder,
    borderRadius: 16,
    padding: 14,
    marginBottom: 20,
    gap: 12,
  },
  contactIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.accountBorder,
  },
  contactInfo: {
    flex: 1,
  },
  contactTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.accountTextPrimary,
    marginBottom: 2,
  },
  contactSub: {
    fontSize: 11.5,
    color: Colors.accountTextSecondary,
  },
  contactBtn: {
    backgroundColor: Colors.forestGreen,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  contactBtnText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '700',
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.accountSectionHeader,
    letterSpacing: 0.3,
    marginBottom: 10,
  },
  faqItem: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Colors.accountBorder,
    borderRadius: 14,
    marginBottom: 10,
    overflow: 'hidden',
  },
  faqQuestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
  },
  faqQuestion: {
    flex: 1,
    fontSize: 13.5,
    fontWeight: '700',
    color: Colors.accountTextPrimary,
    marginRight: 8,
  },
  faqAnswerWrap: {
    paddingHorizontal: 14,
    paddingBottom: 14,
    paddingTop: 2,
  },
  faqAnswer: {
    fontSize: 12.5,
    color: Colors.accountTextSecondary,
    lineHeight: 18,
  },
  versionWrap: {
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  versionText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.accountSectionHeader,
  },
  versionSub: {
    fontSize: 11,
    color: Colors.accountTextSecondary,
    marginTop: 2,
  },
  actionRow: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  doneBtn: {
    paddingVertical: 13,
    borderRadius: 12,
    backgroundColor: Colors.forestGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

export default HelpSupportModal;
