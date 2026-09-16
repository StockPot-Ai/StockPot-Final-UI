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
import PremiumUpgradeModal from './PremiumUpgradeModal';

const SKILLS = ['Beginner', 'Intermediate', 'Advanced'];
const PREP_TIMES = ['15 mins', '30 mins', '45 mins', '60+ mins'];
const MEALS = [1, 2, 3, 4];

const HouseholdModal = ({ visible, onClose }) => {
  const { household, updateHousehold, isPro } = useAccount();
  const [upgradeModalVisible, setUpgradeModalVisible] = useState(false);

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
          {/* Grabber Bar */}
          <View style={styles.grabberWrap}>
            <View style={styles.grabber} />
          </View>

          {/* Header */}
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Household & Servings</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <Ionicons name="close" size={18} color="#968880" />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Household Size Card */}
            <View style={styles.groupedCard}>
              <View style={styles.cardHeader}>
                <View>
                  <Text style={styles.cardTitle}>Household Members</Text>
                  <Text style={styles.cardSubtitle}>Rescales recipe portions and groceries</Text>
                </View>
              </View>
              <View style={styles.stepperRow}>
                <TouchableOpacity
                  style={[styles.stepBtn, householdSize <= 1 && styles.stepBtnDisabled]}
                  onPress={() => setHouseholdSize((prev) => Math.max(1, prev - 1))}
                  disabled={householdSize <= 1}
                  activeOpacity={0.7}
                >
                  <Ionicons name="remove" size={20} color={householdSize <= 1 ? '#D1D5DB' : '#2B2420'} />
                </TouchableOpacity>
                <View style={styles.stepValueWrap}>
                  <Text style={styles.stepValue}>{householdSize}</Text>
                  <Text style={styles.stepUnit}>{householdSize === 1 ? 'Person' : 'People'}</Text>
                </View>
                <TouchableOpacity
                  style={styles.stepBtn}
                  onPress={() => setHouseholdSize((prev) => Math.min(12, prev + 1))}
                  activeOpacity={0.7}
                >
                  <Ionicons name="add" size={20} color="#2B2420" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Live Household Family Sync (Pro Feature) */}
            <View style={styles.syncCard}>
              <View style={styles.syncHeaderRow}>
                <View style={styles.syncLeft}>
                  <Ionicons name="people" size={18} color="#3A6847" />
                  <Text style={styles.syncTitle}>Live Household Sync</Text>
                </View>
                <View style={styles.proPill}>
                  <Ionicons name="sparkles" size={10} color="#C6851C" />
                  <Text style={styles.proPillText}>PRO</Text>
                </View>
              </View>
              <Text style={styles.syncDesc}>
                Sync saved ingredients, shared split grocery baskets, and weekly meal schedules in real time across family devices.
              </Text>
              {!isPro ? (
                <TouchableOpacity
                  style={styles.syncUnlockBtn}
                  onPress={() => setUpgradeModalVisible(true)}
                  activeOpacity={0.85}
                >
                  <Ionicons name="lock-closed" size={13} color="#994122" />
                  <Text style={styles.syncUnlockBtnText}>Unlock Family Sync • Rs. 999 / mo</Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.syncActiveRow}>
                  <Ionicons name="checkmark-circle" size={16} color="#3A6847" />
                  <Text style={styles.syncActiveText}>Active • Family Cloud Sync Enabled</Text>
                </View>
              )}
            </View>

            {/* Cooking Skill */}
            <Text style={styles.sectionHeader}>COOKING SKILL LEVEL</Text>
            <View style={styles.pillGroup}>
              {SKILLS.map((skill) => {
                const isSelected = cookingSkill === skill;
                return (
                  <TouchableOpacity
                    key={skill}
                    style={[styles.pill, isSelected && styles.pillSelected]}
                    onPress={() => setCookingSkill(skill)}
                    activeOpacity={0.7}
                  >
                    {isSelected && (
                      <Ionicons name="checkmark" size={14} color="#FFFFFF" style={{ marginRight: 4 }} />
                    )}
                    <Text style={[styles.pillText, isSelected && styles.pillTextSelected]}>
                      {skill}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Preferred Prep Time */}
            <Text style={styles.sectionHeader}>PREFERRED PREP TIME</Text>
            <View style={styles.pillGroup}>
              {PREP_TIMES.map((time) => {
                const isSelected = prepTimeLimit === time;
                return (
                  <TouchableOpacity
                    key={time}
                    style={[styles.pill, isSelected && styles.pillSelected]}
                    onPress={() => setPrepTimeLimit(time)}
                    activeOpacity={0.7}
                  >
                    {isSelected && (
                      <Ionicons name="checkmark" size={14} color="#FFFFFF" style={{ marginRight: 4 }} />
                    )}
                    <Text style={[styles.pillText, isSelected && styles.pillTextSelected]}>
                      {time}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Meals per Day */}
            <Text style={styles.sectionHeader}>MEALS COOKED PER DAY</Text>
            <View style={styles.pillGroup}>
              {MEALS.map((num) => {
                const isSelected = mealsPerDay === num;
                return (
                  <TouchableOpacity
                    key={num}
                    style={[styles.pill, isSelected && styles.pillSelected]}
                    onPress={() => setMealsPerDay(num)}
                    activeOpacity={0.7}
                  >
                    {isSelected && (
                      <Ionicons name="checkmark" size={14} color="#FFFFFF" style={{ marginRight: 4 }} />
                    )}
                    <Text style={[styles.pillText, isSelected && styles.pillTextSelected]}>
                      {num} {num === 1 ? 'Meal' : 'Meals'}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>

          {/* Action Row */}
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose} activeOpacity={0.7}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.85}>
              <Text style={styles.saveBtnText}>Save Preferences</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Customer Premium Upgrade Modal */}
      <PremiumUpgradeModal
        visible={upgradeModalVisible}
        onClose={() => setUpgradeModalVisible(false)}
      />
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(43, 36, 32, 0.45)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#FAF8F5',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '90%',
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    shadowColor: '#2B2420',
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
    backgroundColor: '#E8DFD8',
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
    color: '#2B2420',
    letterSpacing: -0.4,
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#F5EFEB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 6,
    paddingBottom: 14,
  },
  groupedCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E8DFD8',
    marginBottom: 14,
    shadowColor: '#2B2420',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  cardHeader: {
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2B2420',
    marginBottom: 2,
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#968880',
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F5EFEB',
    borderRadius: 14,
    padding: 6,
  },
  stepBtn: {
    width: 44,
    height: 44,
    borderRadius: 11,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2B2420',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
  },
  stepBtnDisabled: {
    opacity: 0.4,
  },
  stepValueWrap: {
    alignItems: 'center',
  },
  stepValue: {
    fontSize: 19,
    fontWeight: '800',
    color: '#2B2420',
  },
  stepUnit: {
    fontSize: 11,
    fontWeight: '600',
    color: '#968880',
    marginTop: 1,
  },
  syncCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E8DFD8',
    marginBottom: 20,
    shadowColor: '#2B2420',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  syncHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  syncLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  syncTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2B2420',
  },
  proPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF6EB',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 3,
  },
  proPillText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#C6851C',
  },
  syncDesc: {
    fontSize: 12,
    color: '#6B5E57',
    lineHeight: 17,
    marginBottom: 10,
  },
  syncUnlockBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FCECE8',
    paddingVertical: 9,
    borderRadius: 10,
    gap: 6,
  },
  syncUnlockBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#994122',
  },
  syncActiveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EAF3EC',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  syncActiveText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#3A6847',
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '700',
    color: '#968880',
    letterSpacing: 0.6,
    marginBottom: 10,
    marginLeft: 4,
  },
  pillGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 18,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
    paddingHorizontal: 15,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E8DFD8',
    backgroundColor: '#FFFFFF',
  },
  pillSelected: {
    backgroundColor: '#3A6847',
    borderColor: '#3A6847',
  },
  pillText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B5E57',
  },
  pillTextSelected: {
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
    borderColor: '#E8DFD8',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#968880',
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
});

export default HouseholdModal;
