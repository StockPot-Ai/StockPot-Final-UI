import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, Alert, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../constants/colors';
import { recipeService } from '../../services';

const REPORT_REASONS = [
  'Incorrect measurements or missing ingredients',
  'Offensive or inappropriate content / image',
  'Unsafe cooking instructions',
  'Duplicate recipe',
  'Spam / promotional content',
];

const RecipeReportModal = ({ visible, recipe, onClose }) => {
  const [selectedReason, setSelectedReason] = useState(REPORT_REASONS[0]);
  const [extraDetails, setExtraDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmitReport = async () => {
    setIsSubmitting(true);
    try {
      await recipeService.reportRecipe(recipe?.id, {
        reason: selectedReason,
        details: extraDetails,
      });
      setIsSubmitting(false);
      Alert.alert(
        'Report Received',
        'Thank you for keeping StockPot AI safe and high quality. Our culinary moderation team will review this recipe.',
        [{ text: 'OK', onPress: onClose }]
      );
    } catch (_) {
      setIsSubmitting(false);
      onClose();
    }
  };

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <View style={styles.header}>
            <Ionicons name="flag-outline" size={22} color="#DC2626" />
            <Text style={styles.headerTitle}>Report Recipe</Text>
          </View>
          <Text style={styles.subText}>
            Help us maintain quality on "{recipe?.title || 'this recipe'}":
          </Text>

          {REPORT_REASONS.map((r) => {
            const isSelected = selectedReason === r;
            return (
              <TouchableOpacity
                key={r}
                style={[styles.reasonRow, isSelected && styles.reasonRowSelected]}
                onPress={() => setSelectedReason(r)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={isSelected ? 'radio-button-on' : 'radio-button-off'}
                  size={18}
                  color={isSelected ? Colors.primary : '#9CA3AF'}
                />
                <Text style={[styles.reasonText, isSelected && styles.reasonTextSelected]}>{r}</Text>
              </TouchableOpacity>
            );
          })}

          <TextInput
            style={styles.input}
            placeholder="Additional details (optional)..."
            placeholderTextColor="#9CA3AF"
            value={extraDetails}
            onChangeText={setExtraDetails}
          />

          <View style={styles.btnRow}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.submitBtn, isSubmitting && { opacity: 0.7 }]}
              onPress={handleSubmitReport}
              disabled={isSubmitting}
            >
              <Text style={styles.submitBtnText}>{isSubmitting ? 'Submitting...' : 'Submit Report'}</Text>
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
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    width: '100%',
    maxWidth: 400,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  subText: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 14,
  },
  reasonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: '#F9FAFB',
    marginBottom: 6,
    gap: 10,
  },
  reasonRowSelected: {
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  reasonText: {
    flex: 1,
    fontSize: 12.5,
    color: '#374151',
  },
  reasonTextSelected: {
    fontWeight: '600',
    color: '#166534',
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    padding: 10,
    fontSize: 13,
    color: '#1F2937',
    marginTop: 8,
    marginBottom: 16,
  },
  btnRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  cancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
  },
  cancelBtnText: {
    fontSize: 13.5,
    color: '#4B5563',
    fontWeight: '600',
  },
  submitBtn: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 10,
    backgroundColor: '#DC2626',
  },
  submitBtnText: {
    fontSize: 13.5,
    color: '#FFFFFF',
    fontWeight: '700',
  },
});

export default RecipeReportModal;
