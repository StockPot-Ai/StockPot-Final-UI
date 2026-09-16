import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Colors from '../../constants/colors';
import { useAccount } from '../../context/AccountContext';

const DIETARY_OPTIONS = [
  { id: 'Halal', icon: 'food-halal', label: 'Halal' },
  { id: 'Vegetarian', icon: 'leaf', label: 'Vegetarian' },
  { id: 'Vegan', icon: 'sprout', label: 'Vegan' },
  { id: 'Gluten-Free', icon: 'barley-off', label: 'Gluten-Free' },
  { id: 'Dairy-Free', icon: 'cup-off-outline', label: 'Dairy-Free' },
  { id: 'Low-Carb', icon: 'scale-bathroom', label: 'Low-Carb' },
  { id: 'Keto', icon: 'fire', label: 'Keto' },
  { id: 'High-Protein', icon: 'arm-flex-outline', label: 'High-Protein' },
  { id: 'Pescatarian', icon: 'fish', label: 'Pescatarian' },
  { id: 'Nut-Free', icon: 'peanut-off-outline', label: 'Nut-Free' },
];

const ALLERGIES_OPTIONS = [
  'Peanuts',
  'Tree Nuts',
  'Dairy',
  'Eggs',
  'Shellfish',
  'Soy',
  'Wheat',
  'Fish',
];

const DietaryPreferencesModal = ({ visible, onClose }) => {
  const { dietary, updateDietaryPreferences } = useAccount();

  const [selectedDiet, setSelectedDiet] = useState(dietary?.selected || []);
  const [selectedAllergies, setSelectedAllergies] = useState(dietary?.allergies || []);

  useEffect(() => {
    if (visible) {
      setSelectedDiet(dietary?.selected || []);
      setSelectedAllergies(dietary?.allergies || []);
    }
  }, [visible, dietary]);

  const toggleDiet = (id) => {
    setSelectedDiet((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleAllergy = (allergy) => {
    setSelectedAllergies((prev) =>
      prev.includes(allergy)
        ? prev.filter((item) => item !== allergy)
        : [...prev, allergy]
    );
  };

  const handleSave = () => {
    if (updateDietaryPreferences) {
      updateDietaryPreferences({
        selected: selectedDiet,
        allergies: selectedAllergies,
      });
    }
    onClose();
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
            <Text style={styles.sheetTitle}>Dietary Preferences</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <Ionicons name="close" size={18} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Dietary Tags */}
            <Text style={styles.sectionHeader}>DIETS & LIFESTYLES</Text>
            <View style={styles.tagsContainer}>
              {DIETARY_OPTIONS.map((item) => {
                const isSelected = selectedDiet.includes(item.id);
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[styles.tagItem, isSelected && styles.tagItemSelected]}
                    onPress={() => toggleDiet(item.id)}
                    activeOpacity={0.7}
                  >
                    <MaterialCommunityIcons
                      name={item.icon}
                      size={17}
                      color={isSelected ? '#FFFFFF' : '#4B5563'}
                    />
                    <Text
                      style={[
                        styles.tagText,
                        isSelected && styles.tagTextSelected,
                      ]}
                    >
                      {item.label}
                    </Text>
                    {isSelected && (
                      <Ionicons name="checkmark" size={14} color="#FFFFFF" style={{ marginLeft: 2 }} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Allergies */}
            <Text style={[styles.sectionHeader, { marginTop: 18 }]}>EXCLUDED ALLERGIES</Text>
            <View style={styles.tagsContainer}>
              {ALLERGIES_OPTIONS.map((allergy) => {
                const isSelected = selectedAllergies.includes(allergy);
                return (
                  <TouchableOpacity
                    key={allergy}
                    style={[styles.tagItem, isSelected && styles.tagItemAllergy]}
                    onPress={() => toggleAllergy(allergy)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.tagText,
                        isSelected && styles.tagTextSelected,
                      ]}
                    >
                      {allergy}
                    </Text>
                    {isSelected && (
                      <Ionicons name="close-circle" size={14} color="#FFFFFF" style={{ marginLeft: 4 }} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>

          {/* Action Row */}
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.85}>
              <Text style={styles.saveBtnText}>Done</Text>
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
    marginBottom: 10,
    marginLeft: 4,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    gap: 6,
  },
  tagItemSelected: {
    backgroundColor: '#3A6847',
    borderColor: '#3A6847',
  },
  tagItemAllergy: {
    backgroundColor: '#994122',
    borderColor: '#994122',
  },
  tagText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  tagTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  actionRow: {
    paddingHorizontal: 18,
    paddingTop: 10,
  },
  saveBtn: {
    paddingVertical: 14,
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
    fontSize: 15.5,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
});

export default DietaryPreferencesModal;
