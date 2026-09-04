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
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
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
  const { dietary } = useAccount();

  const [selectedDiet, setSelectedDiet] = useState(dietary.selected || []);
  const [selectedAllergies, setSelectedAllergies] = useState(dietary.allergies || []);

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
    // Save to context if needed or persist
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.sheetContainer}>
          {/* Header */}
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Dietary Preferences</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <Feather name="x" size={22} color="#4B5563" />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Dietary Tags */}
            <View style={styles.sectionBlock}>
              <Text style={styles.label}>Diets & Lifestyles</Text>
              <Text style={styles.subtitle}>Select dietary requirements for recipes</Text>
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
                        color={isSelected ? '#FFFFFF' : Colors.accountTextSecondary}
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
                        <Feather name="check" size={14} color="#FFFFFF" style={{ marginLeft: 2 }} />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Allergies */}
            <View style={styles.sectionBlock}>
              <Text style={styles.label}>Food Allergies & Intolerances</Text>
              <Text style={styles.subtitle}>We will strictly exclude recipes with these items</Text>
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
                        <Feather name="x" size={14} color="#FFFFFF" style={{ marginLeft: 4 }} />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </ScrollView>

          {/* Action Row */}
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose} activeOpacity={0.7}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.8}>
              <Text style={styles.saveBtnText}>Save Preferences</Text>
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
    paddingTop: 16,
    paddingBottom: 12,
  },
  sectionBlock: {
    marginBottom: 22,
  },
  label: {
    fontSize: 13.5,
    fontWeight: '700',
    color: Colors.accountSectionHeader,
    letterSpacing: 0.3,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    color: Colors.accountTextSecondary,
    marginBottom: 12,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.accountBorder,
    backgroundColor: '#FAF7F2',
    gap: 6,
  },
  tagItemSelected: {
    backgroundColor: Colors.forestGreen,
    borderColor: Colors.forestGreen,
  },
  tagItemAllergy: {
    backgroundColor: '#EF4444',
    borderColor: '#EF4444',
  },
  tagText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.accountTextSecondary,
  },
  tagTextSelected: {
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

export default DietaryPreferencesModal;
