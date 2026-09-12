import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  Switch,
  StyleSheet,
  ScrollView,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../constants/colors';
import { useAccount } from '../../context/AccountContext';

const PrivacySecurityModal = ({ visible, onClose }) => {
  const { privacy, togglePrivacy, profile } = useAccount();

  const handleClearCache = () => {
    Alert.alert(
      'Cache Cleared',
      'Local cached recipe images and temporary offline data have been cleared.',
      [{ text: 'OK' }]
    );
  };

  const handleExportData = () => {
    const email = profile?.email || 'your account email';
    Alert.alert(
      'Data Export Requested',
      `A secure archive of your meal plans and savings history will be sent to ${email} within 24 hours.`,
      [{ text: 'OK' }]
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.sheetContainer}>
          {/* Apple Grabber Bar */}
          <View style={styles.grabberWrap}>
            <View style={styles.grabber} />
          </View>

          {/* Header */}
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Privacy & Security</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <Ionicons name="close" size={18} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Security Settings Card */}
            <Text style={styles.sectionHeader}>SECURITY CONTROLS</Text>
            <View style={styles.groupedCard}>
              {/* Biometric Toggle */}
              <View style={styles.toggleRow}>
                <View style={styles.iconCircle}>
                  <Ionicons name="finger-print" size={18} color="#166534" />
                </View>
                <View style={styles.textWrap}>
                  <Text style={styles.toggleTitle}>Biometric Lock</Text>
                  <Text style={styles.toggleDesc}>Use Face ID or fingerprint to unlock</Text>
                </View>
                <Switch
                  value={privacy.biometricLogin}
                  onValueChange={() => togglePrivacy('biometricLogin')}
                  trackColor={{ false: '#E5E5EA', true: '#166534' }}
                  thumbColor="#FFFFFF"
                />
              </View>

              <View style={styles.separator} />

              {/* 2FA Toggle */}
              <View style={styles.toggleRow}>
                <View style={styles.iconCircle}>
                  <Ionicons name="shield-checkmark" size={18} color="#166534" />
                </View>
                <View style={styles.textWrap}>
                  <Text style={styles.toggleTitle}>Two-Factor Authentication</Text>
                  <Text style={styles.toggleDesc}>Require SMS code upon login</Text>
                </View>
                <Switch
                  value={privacy.twoFactorAuth}
                  onValueChange={() => togglePrivacy('twoFactorAuth')}
                  trackColor={{ false: '#E5E5EA', true: '#166534' }}
                  thumbColor="#FFFFFF"
                />
              </View>

              <View style={styles.separator} />

              {/* Analytics Toggle */}
              <View style={styles.toggleRow}>
                <View style={styles.iconCircle}>
                  <Ionicons name="analytics" size={18} color="#166534" />
                </View>
                <View style={styles.textWrap}>
                  <Text style={styles.toggleTitle}>Anonymous Analytics</Text>
                  <Text style={styles.toggleDesc}>Help improve recommendation AI</Text>
                </View>
                <Switch
                  value={privacy.shareAnalytics}
                  onValueChange={() => togglePrivacy('shareAnalytics')}
                  trackColor={{ false: '#E5E5EA', true: '#166534' }}
                  thumbColor="#FFFFFF"
                />
              </View>
            </View>

            {/* Account Data Card */}
            <Text style={styles.sectionHeader}>DATA & STORAGE</Text>
            <View style={styles.groupedCard}>
              <TouchableOpacity
                style={styles.actionItem}
                onPress={handleClearCache}
                activeOpacity={0.7}
              >
                <View style={styles.iconCircle}>
                  <Ionicons name="trash-outline" size={18} color="#4B5563" />
                </View>
                <Text style={styles.actionItemText}>Clear Offline Image Cache</Text>
                <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
              </TouchableOpacity>

              <View style={styles.separator} />

              <TouchableOpacity
                style={styles.actionItem}
                onPress={handleExportData}
                activeOpacity={0.7}
              >
                <View style={styles.iconCircle}>
                  <Ionicons name="download-outline" size={18} color="#4B5563" />
                </View>
                <Text style={styles.actionItemText}>Download Account Archive</Text>
                <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
              </TouchableOpacity>
            </View>
          </ScrollView>

          {/* Action Row */}
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
    backgroundColor: 'rgba(0,0,0,0.42)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#F9FAFB',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '90%',
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
    paddingTop: 6,
    paddingBottom: 14,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6B7280',
    letterSpacing: 0.6,
    marginBottom: 8,
    marginLeft: 4,
  },
  groupedCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 18,
    shadowColor: 'rgba(0,0,0,0.03)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 1,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    gap: 12,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: {
    flex: 1,
    paddingRight: 8,
  },
  toggleTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 2,
  },
  toggleDesc: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 16,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    gap: 12,
  },
  actionItemText: {
    flex: 1,
    fontSize: 14.5,
    fontWeight: '600',
    color: '#111827',
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#E5E7EB',
    marginLeft: 48,
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

export default PrivacySecurityModal;
