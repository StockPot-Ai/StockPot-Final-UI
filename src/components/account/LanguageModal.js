import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import Colors from '../../constants/colors';
import { useAccount } from '../../context/AccountContext';

import { LANGUAGES, getTranslation } from '../../i18n/translations';

const LanguageModal = ({ visible, onClose }) => {
  const { language, setLanguage } = useAccount();

  const handleSelect = (langLabel) => {
    setLanguage(langLabel);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.sheetContainer}>
          {/* iOS Grabber Pill */}
          <View style={styles.grabber} />

          {/* Header */}
          <View style={styles.sheetHeader}>
            <View>
              <Text style={styles.sheetTitle}>{getTranslation(language, 'select_language', 'Select Language')}</Text>
              <Text style={styles.sheetSub}>{getTranslation(language, 'choose_language_sub', 'Choose your preferred display language')}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <Feather name="x" size={18} color="#4B5563" />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            <View style={styles.groupCard}>
              {LANGUAGES.map((lang, idx) => {
                const isSelected = language === lang.label;
                return (
                  <View key={lang.code}>
                    <TouchableOpacity
                      style={styles.langRow}
                      onPress={() => handleSelect(lang.label)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.textWrap}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                          <Text style={{ fontSize: 18 }}>{lang.flag}</Text>
                          <Text style={[styles.langLabel, isSelected && styles.langLabelSelected]}>
                            {lang.label}
                          </Text>
                        </View>
                        <Text style={styles.langNative}>{lang.native}</Text>
                      </View>
                      {isSelected ? (
                        <View style={styles.checkCircle}>
                          <Ionicons name="checkmark" size={15} color="#FFFFFF" />
                        </View>
                      ) : (
                        <View style={styles.radioCircle} />
                      )}
                    </TouchableOpacity>
                    {idx < LANGUAGES.length - 1 && <View style={styles.divider} />}
                  </View>
                );
              })}
            </View>
          </ScrollView>

          {/* Action Row */}
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.doneBtn} onPress={onClose} activeOpacity={0.8}>
              <Text style={styles.doneBtnText}>{getTranslation(language, 'done', 'Done')}</Text>
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
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#F9FAFB',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '85%',
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
  },
  grabber: {
    width: 38,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#D1D5DB',
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 6,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 14,
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    letterSpacing: -0.3,
  },
  sheetSub: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
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
    paddingHorizontal: 20,
    paddingTop: 6,
    paddingBottom: 12,
  },
  groupCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  langRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  textWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  langLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  langLabelSelected: {
    color: '#166534',
    fontWeight: '700',
  },
  langNative: {
    fontSize: 13,
    color: '#9CA3AF',
  },
  checkCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#166534',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginLeft: 16,
  },
  actionRow: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  doneBtn: {
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: '#166534',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#166534',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  doneBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

export default LanguageModal;
