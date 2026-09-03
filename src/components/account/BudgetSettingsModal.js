import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
} from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import Colors from '../../constants/colors';
import { useAccount } from '../../context/AccountContext';

const CURRENCIES = ['Rs.', '$', '€', '£'];
const THRESHOLDS = [75, 80, 85, 90];

const BudgetSettingsModal = ({ visible, onClose }) => {
  const { budget, updateBudget } = useAccount();

  const [weeklyBudget, setWeeklyBudget] = useState(String(budget.weeklyBudget));
  const [savingsGoal, setSavingsGoal] = useState(String(budget.savingsGoal));
  const [currency, setCurrency] = useState(budget.currency);
  const [alertThreshold, setAlertThreshold] = useState(budget.alertThreshold);

  const handleSave = () => {
    updateBudget({
      weeklyBudget: Number(weeklyBudget) || budget.weeklyBudget,
      savingsGoal: Number(savingsGoal) || budget.savingsGoal,
      currency,
      alertThreshold,
    });
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.sheetContainer}>
          {/* Header */}
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Budget Settings</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <Feather name="x" size={22} color="#4B5563" />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Preferred Currency */}
            <View style={styles.sectionBlock}>
              <Text style={styles.label}>Currency</Text>
              <View style={styles.pillRow}>
                {CURRENCIES.map((curr) => {
                  const isSelected = currency === curr;
                  return (
                    <TouchableOpacity
                      key={curr}
                      style={[styles.pill, isSelected && styles.pillSelected]}
                      onPress={() => setCurrency(curr)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.pillText, isSelected && styles.pillTextSelected]}>
                        {curr}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Weekly Budget Input */}
            <View style={styles.sectionBlock}>
              <Text style={styles.label}>Target Weekly Grocery Budget</Text>
              <Text style={styles.subtitle}>Maximum recommended spend for your meal plans</Text>
              <View style={styles.inputWrapper}>
                <Text style={styles.currencyPrefix}>{currency}</Text>
                <TextInput
                  style={styles.input}
                  value={weeklyBudget}
                  onChangeText={setWeeklyBudget}
                  keyboardType="numeric"
                  placeholder="15000"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
            </View>

            {/* Monthly Savings Target */}
            <View style={styles.sectionBlock}>
              <Text style={styles.label}>Monthly Savings Target</Text>
              <Text style={styles.subtitle}>Goal for reducing food waste and grocery costs</Text>
              <View style={styles.inputWrapper}>
                <Text style={styles.currencyPrefix}>{currency}</Text>
                <TextInput
                  style={styles.input}
                  value={savingsGoal}
                  onChangeText={setSavingsGoal}
                  keyboardType="numeric"
                  placeholder="4000"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
            </View>

            {/* Budget Alert Threshold */}
            <View style={styles.sectionBlock}>
              <Text style={styles.label}>Alert When Spend Reaches</Text>
              <View style={styles.pillRow}>
                {THRESHOLDS.map((thresh) => {
                  const isSelected = alertThreshold === thresh;
                  return (
                    <TouchableOpacity
                      key={thresh}
                      style={[styles.pill, isSelected && styles.pillSelected]}
                      onPress={() => setAlertThreshold(thresh)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.pillText, isSelected && styles.pillTextSelected]}>
                        {thresh}% of budget
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
              <Text style={styles.saveBtnText}>Save Settings</Text>
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
    fontSize: 13.5,
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
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAF7F2',
    borderWidth: 1,
    borderColor: Colors.accountBorder,
    borderRadius: 12,
    paddingHorizontal: 14,
  },
  currencyPrefix: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.forestGreen,
    marginRight: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 15,
    fontWeight: '600',
    color: Colors.accountTextPrimary,
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

export default BudgetSettingsModal;
