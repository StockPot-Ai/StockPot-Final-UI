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
import { Feather } from '@expo/vector-icons';
import Colors from '../../constants/colors';
import { useAccount } from '../../context/AccountContext';

const SKILLS = ['Beginner', 'Intermediate', 'Advanced'];
const PREP_TIMES = ['15 mins', '30 mins', '45 mins', '60+ mins'];
const MEALS = [1, 2, 3, 4];

const HouseholdModal = ({ visible, onClose }) => {
  const { household, updateHousehold } = useAccount();

  const [householdSize, setHouseholdSize] = useState(household.householdSize);
  const [cookingSkill, setCookingSkill] = useState(household.cookingSkill);
  const [prepTimeLimit, setPrepTimeLimit] = useState(household.prepTimeLimit);
  const [mealsPerDay, setMealsPerDay] = useState(household.mealsPerDay);

  const handleSave = () => {
    updateHousehold({
      householdSize,
      cookingSkill,
      prepTimeLimit,
      mealsPerDay,
    });
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.sheetContainer}>
          {/* Header */}
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Household & Preferences</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <Feather name="x" size={22} color="#4B5563" />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Household Size Stepper */}
            <View style={styles.sectionBlock}>
              <Text style={styles.label}>Household Members</Text>
              <Text style={styles.subtitle}>Number of people to cook for each meal</Text>
              <View style={styles.stepperRow}>
                <TouchableOpacity
                  style={[styles.stepBtn, householdSize <= 1 && styles.stepBtnDisabled]}
                  onPress={() => setHouseholdSize((prev) => Math.max(1, prev - 1))}
                  disabled={householdSize <= 1}
                >
                  <Feather name="minus" size={18} color={householdSize <= 1 ? '#9CA3AF' : '#1F2937'} />
                </TouchableOpacity>
                <Text style={styles.stepValue}>{householdSize} {householdSize === 1 ? 'person' : 'people'}</Text>
                <TouchableOpacity
                  style={styles.stepBtn}
                  onPress={() => setHouseholdSize((prev) => Math.min(12, prev + 1))}
                >
                  <Feather name="plus" size={18} color="#1F2937" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Cooking Skill */}
            <View style={styles.sectionBlock}>
              <Text style={styles.label}>Cooking Skill Level</Text>
              <View style={styles.pillRow}>
                {SKILLS.map((skill) => {
                  const isSelected = cookingSkill === skill;
                  return (
                    <TouchableOpacity
                      key={skill}
                      style={[styles.pill, isSelected && styles.pillSelected]}
                      onPress={() => setCookingSkill(skill)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.pillText, isSelected && styles.pillTextSelected]}>
                        {skill}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Max Prep Time */}
            <View style={styles.sectionBlock}>
              <Text style={styles.label}>Preferred Prep Time</Text>
              <View style={styles.pillRow}>
                {PREP_TIMES.map((time) => {
                  const isSelected = prepTimeLimit === time;
                  return (
                    <TouchableOpacity
                      key={time}
                      style={[styles.pill, isSelected && styles.pillSelected]}
                      onPress={() => setPrepTimeLimit(time)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.pillText, isSelected && styles.pillTextSelected]}>
                        {time}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Meals per day */}
            <View style={styles.sectionBlock}>
              <Text style={styles.label}>Meals Cooked Per Day</Text>
              <View style={styles.pillRow}>
                {MEALS.map((num) => {
                  const isSelected = mealsPerDay === num;
                  return (
                    <TouchableOpacity
                      key={num}
                      style={[styles.pill, isSelected && styles.pillSelected]}
                      onPress={() => setMealsPerDay(num)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.pillText, isSelected && styles.pillTextSelected]}>
                        {num} {num === 1 ? 'meal' : 'meals'}
                      </Text>
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
    marginBottom: 20,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.accountSectionHeader,
    letterSpacing: 0.3,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    color: Colors.accountTextSecondary,
    marginBottom: 10,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAF7F2',
    borderWidth: 1,
    borderColor: Colors.accountBorder,
    borderRadius: 14,
    padding: 6,
    justifyContent: 'space-between',
  },
  stepBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.accountBorder,
  },
  stepBtnDisabled: {
    opacity: 0.4,
  },
  stepValue: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.accountTextPrimary,
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pill: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.accountBorder,
    backgroundColor: '#FAF7F2',
  },
  pillSelected: {
    backgroundColor: Colors.forestGreen,
    borderColor: Colors.forestGreen,
  },
  pillText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.accountTextSecondary,
  },
  pillTextSelected: {
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

export default HouseholdModal;
