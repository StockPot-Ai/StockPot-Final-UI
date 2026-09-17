import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../constants/colors';
import { useAccount } from '../../context/AccountContext';
import CustomAlertModal from '../common/CustomAlertModal';

const BADGE_OPTIONS = [
  'Eco Saver 🌱',
  'Zero Waste Master ♻️',
  'Green Gourmet 🥗',
  'Sustainable Chef 🌿',
  'Budget Hero 🛡️',
  'Smart Shopper 🛒',
];

const CHEF_AVATARS = [
  { id: '1', url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200', label: 'Chef 1' },
  { id: '2', url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200', label: 'Chef 2' },
  { id: '3', url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200', label: 'Chef 3' },
  { id: '4', url: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=200', label: 'Chef 4' },
  { id: '5', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200', label: 'Chef 5' },
  { id: '6', url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200', label: 'Chef 6' },
];

const EditProfileModal = ({ visible, onClose }) => {
  const { profile, updateProfile, sendEmailVerification, verifyEmailCode } = useAccount();

  const [name, setName] = useState(profile.name || '');
  const [email, setEmail] = useState(profile.email || '');
  const [phone, setPhone] = useState(profile.phone || '');
  const [bio, setBio] = useState(profile.bio || '');
  const [ecoTitle, setEcoTitle] = useState(profile.ecoTitle || 'Eco Saver');
  const [avatarUrl, setAvatarUrl] = useState(
    profile.avatarUrl || profile.avatar_url || CHEF_AVATARS[0].url
  );

  // Custom Alert State
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

  useEffect(() => {
    if (visible) {
      setName(profile.name || '');
      setEmail(profile.email || '');
      setPhone(profile.phone || '');
      setBio(profile.bio || '');
      setEcoTitle(profile.ecoTitle || 'Eco Saver');
      setAvatarUrl(profile.avatarUrl || profile.avatar_url || CHEF_AVATARS[0].url);
    }
  }, [visible, profile]);

  const handleSave = () => {
    if (!name.trim()) {
      showAlert({
        type: 'error',
        title: 'Missing Name',
        message: 'Your name cannot be empty.',
      });
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      showAlert({
        type: 'error',
        title: 'Invalid Email',
        message: 'Please enter a valid email address.',
      });
      return;
    }

    updateProfile({
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      bio: bio.trim(),
      ecoTitle,
      avatarUrl,
      avatar_url: avatarUrl,
    });
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.modalOverlay}
      >
        <View style={styles.sheetContainer}>
          {/* Apple-style Grabber Bar */}
          <View style={styles.grabberWrap}>
            <View style={styles.grabber} />
          </View>

          {/* Header */}
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Edit Profile</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <Ionicons name="close" size={18} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Avatar Selection Card */}
            <View style={styles.avatarCard}>
              <View style={styles.avatarPreviewWrap}>
                <Image source={{ uri: avatarUrl }} style={styles.avatarPreviewImg} />
                <View style={styles.avatarCameraBadge}>
                  <Ionicons name="camera" size={13} color="#FFFFFF" />
                </View>
              </View>

              <Text style={styles.avatarSectionTitle}>Choose Chef Profile Picture</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.avatarRow}>
                {CHEF_AVATARS.map((av) => {
                  const isSelected = avatarUrl === av.url;
                  return (
                    <TouchableOpacity
                      key={av.id}
                      style={[styles.avatarOption, isSelected && styles.avatarOptionSelected]}
                      onPress={() => setAvatarUrl(av.url)}
                      activeOpacity={0.75}
                    >
                      <Image source={{ uri: av.url }} style={styles.avatarOptionImg} />
                      {isSelected && (
                        <View style={styles.avatarCheckBadge}>
                          <Ionicons name="checkmark" size={10} color="#FFFFFF" />
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              <View style={styles.customAvatarInputRow}>
                <Ionicons name="link-outline" size={15} color="#9CA3AF" style={{ marginRight: 6 }} />
                <TextInput
                  style={styles.customAvatarInput}
                  placeholder="Or paste custom image URL (https://...)"
                  placeholderTextColor="#9CA3AF"
                  value={avatarUrl}
                  onChangeText={setAvatarUrl}
                />
              </View>
            </View>

            {/* Form Group */}
            <View style={styles.formCard}>
              {/* Field: Full Name */}
              <View style={styles.fieldRow}>
                <Text style={styles.fieldLabel}>Name</Text>
                <TextInput
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
                  placeholder="Your Name"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <View style={styles.separator} />

              {/* Field: Email */}
              <View style={styles.fieldRow}>
                <Text style={styles.fieldLabel}>Email</Text>
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  placeholder="chef@stockpot.ai"
                  placeholderTextColor="#9CA3AF"
                />
                {profile?.isEmailVerified ? (
                  <View style={styles.verifiedBadge}>
                    <Ionicons name="checkmark-circle" size={13} color="#3A6847" />
                    <Text style={styles.verifiedBadgeText}>Verified</Text>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.unverifiedBadge}
                    onPress={() => {
                      sendEmailVerification();
                      showAlert({
                        type: 'info',
                        title: 'Verification Link Sent',
                        message: `A verification link and test code (123456) has been dispatched to ${email}.`,
                      });
                    }}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="alert-circle" size={13} color="#C6851C" />
                    <Text style={styles.unverifiedBadgeText}>Verify</Text>
                  </TouchableOpacity>
                )}
              </View>

              <View style={styles.separator} />

              {/* Field: Phone */}
              <View style={styles.fieldRow}>
                <Text style={styles.fieldLabel}>Phone</Text>
                <TextInput
                  style={styles.input}
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                  placeholder="+94 77 123 4567"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <View style={styles.separator} />

              {/* Field: Bio */}
              <View style={[styles.fieldRow, { alignItems: 'flex-start', paddingTop: 12 }]}>
                <Text style={[styles.fieldLabel, { marginTop: 2 }]}>Bio</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={bio}
                  onChangeText={setBio}
                  multiline
                  numberOfLines={2}
                  placeholder="Tell us about your cooking style..."
                  placeholderTextColor="#9CA3AF"
                />
              </View>
            </View>

            {/* Field: Eco Badge Title */}
            <Text style={styles.sectionHeader}>ECO BADGE TITLE</Text>
            <View style={styles.pillGroup}>
              {BADGE_OPTIONS.map((badge) => {
                const isSelected = ecoTitle === badge;
                return (
                  <TouchableOpacity
                    key={badge}
                    style={[styles.badgePill, isSelected && styles.badgePillSelected]}
                    onPress={() => setEcoTitle(badge)}
                    activeOpacity={0.7}
                  >
                    {isSelected && (
                      <Ionicons name="checkmark" size={14} color="#FFFFFF" style={{ marginRight: 4 }} />
                    )}
                    <Text
                      style={[
                        styles.badgePillText,
                        isSelected && styles.badgePillTextSelected,
                      ]}
                    >
                      {badge}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose} activeOpacity={0.7}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.85}>
              <Text style={styles.saveBtnText}>Save Changes</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>

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
    paddingTop: 8,
    paddingBottom: 14,
  },
  avatarCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#EAE5E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  avatarPreviewWrap: {
    position: 'relative',
    marginBottom: 10,
  },
  avatarPreviewImg: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2.5,
    borderColor: '#007A3D',
  },
  avatarCameraBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#007A3D',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  avatarSectionTitle: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 10,
  },
  avatarRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 4,
    marginBottom: 12,
  },
  avatarOption: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
  },
  avatarOptionSelected: {
    borderColor: '#007A3D',
  },
  avatarOptionImg: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
  },
  avatarCheckBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 15,
    height: 15,
    borderRadius: 7.5,
    backgroundColor: '#007A3D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  customAvatarInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    width: '100%',
  },
  customAvatarInput: {
    flex: 1,
    fontSize: 12,
    color: '#1F2937',
    padding: 0,
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingVertical: 4,
    marginBottom: 20,
    shadowColor: 'rgba(0,0,0,0.03)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 1,
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  fieldLabel: {
    width: 80,
    fontSize: 14,
    fontWeight: '700',
    color: '#374151',
  },
  input: {
    flex: 1,
    fontSize: 14.5,
    color: '#111827',
    paddingVertical: 6,
  },
  textArea: {
    height: 50,
    textAlignVertical: 'top',
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#E5E7EB',
    marginLeft: 80,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6B7280',
    letterSpacing: 0.6,
    marginBottom: 10,
    marginLeft: 4,
  },
  pillGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  badgePillSelected: {
    backgroundColor: '#166534',
    borderColor: '#166534',
  },
  badgePillText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4B5563',
  },
  badgePillTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  actionRow: {
    flexDirection: 'row',
    paddingHorizontal: 18,
    paddingTop: 10,
    gap: 10,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#6B7280',
  },
  saveBtn: {
    flex: 2,
    paddingVertical: 13,
    borderRadius: 14,
    backgroundColor: '#3A6847',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#3A6847',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 2,
  },
  saveBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EAF3EC',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#C7DEC9',
  },
  verifiedBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#3A6847',
  },
  unverifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF6EB',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#F9E2BE',
  },
  unverifiedBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#C6851C',
  },
});

export default EditProfileModal;
