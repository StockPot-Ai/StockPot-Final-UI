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
import { Feather, Ionicons } from '@expo/vector-icons';
import Colors from '../../constants/colors';
import { useAccount } from '../../context/AccountContext';

const PrivacySecurityModal = ({ visible, onClose }) => {
  const { privacy, togglePrivacy } = useAccount();

  const handleClearCache = () => {
    Alert.alert(
      'Cache Cleared',
      'Local cached recipe images and offline data have been successfully cleared.',
      [{ text: 'OK' }]
    );
  };

  const handleExportData = () => {
    Alert.alert(
      'Data Export Requested',
      'A copy of your meal plans, shopping logs, and savings history will be sent to your email shortly.',
      [{ text: 'OK' }]
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.sheetContainer}>
          {/* Header */}
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Privacy & Security</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <Feather name="x" size={22} color="#4B5563" />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Biometric Toggle */}
            <View style={styles.toggleRow}>
              <View style={styles.iconCircle}>
                <Ionicons name="finger-print-outline" size={20} color={Colors.forestGreen} />
              </View>
              <View style={styles.textWrap}>
                <Text style={styles.toggleTitle}>Biometric Authentication</Text>
                <Text style={styles.toggleDesc}>
                  Use Face ID or fingerprint to securely open StockPot AI
                </Text>
              </View>
              <Switch
                value={privacy.biometricLogin}
                onValueChange={() => togglePrivacy('biometricLogin')}
                trackColor={{ false: '#E5E7EB', true: Colors.forestGreen }}
                thumbColor="#FFFFFF"
              />
            </View>

            <View style={styles.divider} />

            {/* 2FA Toggle */}
            <View style={styles.toggleRow}>
              <View style={styles.iconCircle}>
                <Ionicons name="shield-checkmark-outline" size={20} color={Colors.forestGreen} />
              </View>
              <View style={styles.textWrap}>
                <Text style={styles.toggleTitle}>Two-Factor Authentication</Text>
                <Text style={styles.toggleDesc}>
                  Require an SMS verification code upon login
                </Text>
              </View>
              <Switch
                value={privacy.twoFactorAuth}
                onValueChange={() => togglePrivacy('twoFactorAuth')}
                trackColor={{ false: '#E5E7EB', true: Colors.forestGreen }}
                thumbColor="#FFFFFF"
              />
            </View>

            <View style={styles.divider} />

            {/* Analytics Toggle */}
            <View style={styles.toggleRow}>
              <View style={styles.iconCircle}>
                <Ionicons name="analytics-outline" size={20} color={Colors.forestGreen} />
              </View>
              <View style={styles.textWrap}>
                <Text style={styles.toggleTitle}>Anonymous Analytics</Text>
                <Text style={styles.toggleDesc}>
                  Share anonymous usage to improve meal recommendation algorithms
                </Text>
              </View>
              <Switch
                value={privacy.shareAnalytics}
                onValueChange={() => togglePrivacy('shareAnalytics')}
                trackColor={{ false: '#E5E7EB', true: Colors.forestGreen }}
                thumbColor="#FFFFFF"
              />
            </View>

            <View style={styles.divider} />

            {/* Clear Cache & Data Buttons */}
            <TouchableOpacity
              style={styles.actionItem}
              onPress={handleClearCache}
              activeOpacity={0.7}
            >
              <Ionicons name="trash-bin-outline" size={20} color="#4B5563" />
              <Text style={styles.actionItemText}>Clear Offline Image Cache</Text>
              <Feather name="chevron-right" size={18} color="#9CA3AF" />
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity
              style={styles.actionItem}
              onPress={handleExportData}
              activeOpacity={0.7}
            >
              <Ionicons name="download-outline" size={20} color="#4B5563" />
              <Text style={styles.actionItemText}>Download My Account Data</Text>
              <Feather name="chevron-right" size={18} color="#9CA3AF" />
            </TouchableOpacity>
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
    paddingTop: 10,
    paddingBottom: 12,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 12,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FAF7F2',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.accountBorder,
  },
  textWrap: {
    flex: 1,
  },
  toggleTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    color: Colors.accountTextPrimary,
    marginBottom: 2,
  },
  toggleDesc: {
    fontSize: 12,
    color: Colors.accountTextSecondary,
    lineHeight: 16,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 12,
  },
  actionItemText: {
    flex: 1,
    fontSize: 14.5,
    fontWeight: '600',
    color: Colors.accountTextPrimary,
  },
  divider: {
    height: 1,
    backgroundColor: '#F3ECE4',
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

export default PrivacySecurityModal;
