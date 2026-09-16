import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../constants/colors';
import { useAccount } from '../../context/AccountContext';

const FAQS = [
  {
    q: 'How does StockPot AI calculate money saved?',
    a: 'We track the retail prices of ingredients you already own at home and compare them with real supermarket prices across Keells, Cargills, Glomark, and Arpico.',
  },
  {
    q: 'How is waste avoided measured?',
    a: 'Every ingredient you mark as used in recipes is tracked in kilograms based on portion estimations, preventing food waste and saving money.',
  },
  {
    q: 'Can I customize recipe servings for large families?',
    a: 'Yes! You can configure your household size in Household & Preferences to automatically rescale all ingredient portions and grocery shopping lists.',
  },
  {
    q: 'How do streaks & badges work?',
    a: 'Logging at least one planned meal or updated grocery item each day keeps your streak active and unlocks eco-saver XP achievements.',
  },
];

const HelpSupportModal = ({ visible, onClose }) => {
  const { profile } = useAccount();
  const [expandedIndex, setExpandedIndex] = useState(0);
  const [contactSent, setContactSent] = useState(false);

  const toggleExpand = (index) => {
    setExpandedIndex((prev) => (prev === index ? null : index));
  };

  const handleContactSupport = () => {
    setContactSent(true);
    setTimeout(() => {
      setContactSent(false);
    }, 4000);
  };

  const userEmail = profile?.email || 'your registered email';

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.sheetContainer}>
          {/* Apple-style Grabber Bar */}
          <View style={styles.grabberWrap}>
            <View style={styles.grabber} />
          </View>

          {/* Header */}
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Help & Support</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <Ionicons name="close" size={18} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Success Banner */}
            {contactSent ? (
              <View style={styles.successBanner}>
                <Ionicons name="checkmark-circle" size={20} color="#166534" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.successTitle}>Support Request Dispatched</Text>
                  <Text style={styles.successSub}>
                    Our culinary team will reply to <Text style={{ fontWeight: '700' }}>{userEmail}</Text> shortly.
                  </Text>
                </View>
              </View>
            ) : (
              /* Quick Contact Card */
              <View style={styles.contactCard}>
                <View style={styles.contactIcon}>
                  <Ionicons name="headset" size={22} color="#166534" />
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
            )}

            {/* Inset Grouped FAQs */}
            <Text style={styles.sectionHeader}>FREQUENTLY ASKED QUESTIONS</Text>
            <View style={styles.faqGroup}>
              {FAQS.map((faq, index) => {
                const isExpanded = expandedIndex === index;
                const isLast = index === FAQS.length - 1;
                return (
                  <View key={faq.q} style={[styles.faqItem, isLast && { borderBottomWidth: 0 }]}>
                    <TouchableOpacity
                      style={styles.faqQuestionRow}
                      onPress={() => toggleExpand(index)}
                      activeOpacity={0.6}
                    >
                      <Text style={styles.faqQuestion}>{faq.q}</Text>
                      <Ionicons
                        name={isExpanded ? 'chevron-up' : 'chevron-down'}
                        size={17}
                        color="#9CA3AF"
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
            </View>

            {/* Version Footer */}
            <View style={styles.versionWrap}>
              <Text style={styles.versionText}>StockPot AI</Text>
              <Text style={styles.versionSub}>Version 1.0.0 • Production Build</Text>
            </View>
          </ScrollView>

          {/* Apple Bottom Action */}
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.doneBtn} onPress={onClose} activeOpacity={0.85}>
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
    backgroundColor: 'rgba(0, 0, 0, 0.42)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#F9FAFB',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '88%',
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 8,
  },
  grabberWrap: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 4,
  },
  grabber: {
    width: 38,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#D1D5DB',
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 14,
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: -0.4,
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 4,
    paddingBottom: 16,
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#86EFAC',
    borderRadius: 16,
    padding: 14,
    marginBottom: 18,
    gap: 12,
  },
  successTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#166534',
  },
  successSub: {
    fontSize: 12,
    color: '#15803D',
    marginTop: 2,
    lineHeight: 16,
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    marginBottom: 18,
    gap: 12,
    shadowColor: 'rgba(0,0,0,0.03)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 1,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  contactIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F0FDF4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactInfo: {
    flex: 1,
  },
  contactTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 2,
  },
  contactSub: {
    fontSize: 12,
    color: '#6B7280',
  },
  contactBtn: {
    backgroundColor: '#166534',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  contactBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6B7280',
    letterSpacing: 0.6,
    marginBottom: 8,
    marginLeft: 4,
    textTransform: 'uppercase',
  },
  faqGroup: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: 'rgba(0,0,0,0.03)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 1,
  },
  faqItem: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
  },
  faqQuestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  faqQuestion: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginRight: 10,
    lineHeight: 19,
  },
  faqAnswerWrap: {
    paddingHorizontal: 16,
    paddingBottom: 14,
    paddingTop: 2,
  },
  faqAnswer: {
    fontSize: 13,
    color: '#4B5563',
    lineHeight: 19,
  },
  versionWrap: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 8,
  },
  versionText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#4B5563',
  },
  versionSub: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 2,
  },
  actionRow: {
    paddingHorizontal: 18,
    paddingTop: 10,
  },
  doneBtn: {
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: '#166534',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#166534',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 2,
  },
  doneBtnText: {
    fontSize: 15.5,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
});

export default HelpSupportModal;
