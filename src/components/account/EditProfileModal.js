import React, { useState } from 'react';
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
  Alert,
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import Colors from '../../constants/colors';
import { useAccount } from '../../context/AccountContext';

const BADGE_OPTIONS = [
  'Eco Saver',
  'Zero Waste Master',
  'Green Gourmet',
  'Sustainable Chef',
];

const EditProfileModal = ({ visible, onClose }) => {
  const { profile, updateProfile } = useAccount();

  const [name, setName] = useState(profile.name);
  const [email, setEmail] = useState(profile.email);
  const [phone, setPhone] = useState(profile.phone);
  const [bio, setBio] = useState(profile.bio);
  const [ecoTitle, setEcoTitle] = useState(profile.ecoTitle);

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert('Validation Error', 'Name cannot be empty.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      Alert.alert('Validation Error', 'Please enter a valid email address.');
      return;
    }

    updateProfile({
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      bio: bio.trim(),
      ecoTitle,
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
          {/* Header */}
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Edit Profile</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <Feather name="x" size={22} color="#4B5563" />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Field: Full Name */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Full Name</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Enter full name"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            {/* Field: Email */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Email Address</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholder="Enter email"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            {/* Field: Phone */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Phone Number</Text>
              <TextInput
                style={styles.input}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                placeholder="Enter phone number"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            {/* Field: Bio */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Bio</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={bio}
                onChangeText={setBio}
                multiline
                numberOfLines={3}
                placeholder="Tell us about your cooking style..."
                placeholderTextColor="#9CA3AF"
              />
            </View>

            {/* Field: Eco Badge Title */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Eco Title</Text>
              <View style={styles.pillRow}>
                {BADGE_OPTIONS.map((badge) => {
                  const isSelected = ecoTitle === badge;
                  return (
                    <TouchableOpacity
                      key={badge}
                      style={[styles.badgePill, isSelected && styles.badgePillSelected]}
                      onPress={() => setEcoTitle(badge)}
                      activeOpacity={0.7}
                    >
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
            </View>
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose} activeOpacity={0.7}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.8}>
              <Text style={styles.saveBtnText}>Save Changes</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
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
    maxHeight: '90%',
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
    paddingTop: 16,
    paddingBottom: 12,
  },
  fieldGroup: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 12.5,
    fontWeight: '700',
    color: Colors.accountSectionHeader,
    letterSpacing: 0.4,
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#FAF7F2',
    borderWidth: 1,
    borderColor: Colors.accountBorder,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14.5,
    color: Colors.accountTextPrimary,
  },
  textArea: {
    height: 72,
    textAlignVertical: 'top',
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  badgePill: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.accountBorder,
    backgroundColor: '#FAF7F2',
  },
  badgePillSelected: {
    backgroundColor: Colors.forestGreen,
    borderColor: Colors.forestGreen,
  },
  badgePillText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: Colors.accountTextSecondary,
  },
  badgePillTextSelected: {
    color: '#FFFFFF',
  },
  actionRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 10,
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.accountBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.accountTextSecondary,
  },
  saveBtn: {
    flex: 2,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: Colors.forestGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

export default EditProfileModal;
