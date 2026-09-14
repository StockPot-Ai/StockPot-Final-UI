import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  StyleSheet,
  Alert,
} from 'react-native';
import { Ionicons, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import Colors from '../../constants/colors';
import { mealPlanService, gamificationService } from '../../services';
import { useAccount } from '../../context/AccountContext';

const PremiumBudgetChallengeModal = ({ visible, onClose, onChallengeAccepted }) => {
  const { isPremium } = useAccount();
  const [peopleCount, setPeopleCount] = useState(4);
  const [daysCount, setDaysCount] = useState(7);
  const [targetBudget, setTargetBudget] = useState('7500');
  const [isSimulating, setIsSimulating] = useState(false);

  const budgetNumber = parseInt(targetBudget) || 7500;

  // Run calculation
  const challengeResult = useMemo(() => {
    return mealPlanService.generateBudgetChallengePlan(peopleCount, daysCount, budgetNumber);
  }, [peopleCount, daysCount, budgetNumber]);

  const handleAcceptChallenge = async () => {
    await gamificationService.awardXp(
      100,
      `Accepted ${daysCount}-Day Budget Challenge`,
      `Target: Rs. ${budgetNumber.toLocaleString()} for ${peopleCount} people`
    );

    Alert.alert(
      '🎯 Budget Challenge Accepted!',
      `Your 7-day optimized meal plan and split shopping basket are now active.\n\nEstimated Total: Rs. ${challengeResult.estimatedCost.toLocaleString()}\nProjected Remaining: Rs. ${challengeResult.remainingBudget.toLocaleString()}\n\n🏆 You earned +100 XP!`,
      [
        {
          text: 'View Schedule',
          onPress: () => {
            onChallengeAccepted && onChallengeAccepted(challengeResult);
            onClose();
          },
        },
      ]
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.crownCircle}>
                <FontAwesome5 name="trophy" size={17} color="#D97706" />
              </View>
              <View>
                <Text style={styles.headerTitle}>Premium Budget Challenge</Text>
                <Text style={styles.headerSub}>AI Meal Planning & Multi-Store Cost Calculator</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {/* Example Preset Banner */}
            <View style={styles.presetBanner}>
              <Ionicons name="sparkles" size={18} color="#007A3D" />
              <View style={{ flex: 1 }}>
                <Text style={styles.presetTitle}>Challenge Target</Text>
                <Text style={styles.presetDesc}>
                  "Feed {peopleCount} people for {daysCount} days under Rs. {budgetNumber.toLocaleString()}"
                </Text>
              </View>
            </View>

            {/* Config Controls */}
            <Text style={styles.configLabel}>Family / Household Size</Text>
            <View style={styles.chipRow}>
              {[1, 2, 4, 6].map((num) => (
                <TouchableOpacity
                  key={num}
                  style={[styles.chip, peopleCount === num && styles.chipActive]}
                  onPress={() => setPeopleCount(num)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.chipText, peopleCount === num && styles.chipTextActive]}>
                    {num} {num === 1 ? 'Person' : 'People'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.configLabel}>Challenge Duration</Text>
            <View style={styles.chipRow}>
              {[3, 5, 7].map((days) => (
                <TouchableOpacity
                  key={days}
                  style={[styles.chip, daysCount === days && styles.chipActive]}
                  onPress={() => setDaysCount(days)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.chipText, daysCount === days && styles.chipTextActive]}>
                    {days} Days
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.configLabel}>Target Budget (Rs.)</Text>
            <TextInput
              style={styles.budgetInput}
              keyboardType="numeric"
              value={targetBudget}
              onChangeText={setTargetBudget}
              placeholder="e.g. 7500"
              placeholderTextColor="#9CA3AF"
            />

            {/* Output Calculation Breakdown Card */}
            <View style={styles.calculationCard}>
              <View style={styles.calcHeader}>
                <Text style={styles.calcTitle}>StockPot Cost Optimization Breakdown</Text>
                <View style={[styles.statusBadge, challengeResult.isUnderBudget ? styles.statusSuccess : styles.statusWarning]}>
                  <Text style={[styles.statusText, challengeResult.isUnderBudget ? styles.statusTextSuccess : styles.statusTextWarning]}>
                    {challengeResult.isUnderBudget ? '✓ Under Budget' : '⚠️ Adjust Budget'}
                  </Text>
                </View>
              </View>

              <View style={styles.metricsRow}>
                <View style={styles.metricCol}>
                  <Text style={styles.metricLabel}>Target Budget</Text>
                  <Text style={styles.metricValue}>Rs. {budgetNumber.toLocaleString()}</Text>
                </View>
                <View style={styles.metricDivider} />
                <View style={styles.metricCol}>
                  <Text style={styles.metricLabel}>Optimized Cost</Text>
                  <Text style={[styles.metricValue, { color: '#007A3D' }]}>
                    Rs. {challengeResult.estimatedCost.toLocaleString()}
                  </Text>
                </View>
                <View style={styles.metricDivider} />
                <View style={styles.metricCol}>
                  <Text style={styles.metricLabel}>Remaining Surplus</Text>
                  <Text style={[styles.metricValue, { color: '#D97706' }]}>
                    Rs. {challengeResult.remainingBudget.toLocaleString()}
                  </Text>
                </View>
              </View>

              <View style={styles.savingsCallout}>
                <Ionicons name="cart" size={16} color="#166534" />
                <Text style={styles.savingsCalloutText}>
                  Prices calculated using cheapest available items across Keells, Cargills & ABC Neighborhood Grocery.
                </Text>
              </View>
            </View>

            {/* Schedule Preview */}
            <Text style={styles.scheduleTitle}>7-Day AI Meal Schedule Preview</Text>
            {challengeResult.schedule.map((item, idx) => (
              <View key={idx} style={styles.dayCard}>
                <View style={styles.dayHeader}>
                  <Text style={styles.dayName}>{item.day}</Text>
                  <Text style={styles.dayCost}>Rs. {item.dailyCost.toLocaleString()}</Text>
                </View>
                <Text style={styles.mealLine}>🍳 Breakfast: {item.breakfast}</Text>
                <Text style={styles.mealLine}>🍛 Lunch: {item.lunch}</Text>
                <Text style={styles.mealLine}>🍲 Dinner: {item.dinner}</Text>
              </View>
            ))}

            <View style={{ height: 20 }} />
          </ScrollView>

          {/* Footer CTA */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.acceptBtn}
              onPress={handleAcceptChallenge}
              activeOpacity={0.88}
            >
              <FontAwesome5 name="check-circle" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.acceptBtnText}>Accept Challenge & Log (+100 XP)</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  content: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    height: '90%',
    paddingTop: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  crownCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#111827',
  },
  headerSub: {
    fontSize: 11.5,
    color: '#6B7280',
    marginTop: 1,
  },
  closeBtn: {
    padding: 6,
  },
  body: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 14,
  },
  presetBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 14,
    padding: 12,
    gap: 10,
    marginBottom: 14,
  },
  presetTitle: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#166534',
    textTransform: 'uppercase',
  },
  presetDesc: {
    fontSize: 14,
    fontWeight: '800',
    color: '#166534',
    marginTop: 1,
  },
  configLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
    marginTop: 10,
    marginBottom: 6,
  },
  chipRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  chip: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipActive: {
    backgroundColor: '#007A3D',
  },
  chipText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#4B5563',
  },
  chipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  budgetInput: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#111827',
    fontWeight: '700',
    marginBottom: 14,
  },
  calculationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#86EFAC',
    marginBottom: 16,
    shadowColor: '#007A3D',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  calcHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  calcTitle: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#111827',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  statusSuccess: {
    backgroundColor: '#DCFCE7',
  },
  statusWarning: {
    backgroundColor: '#FEF3C7',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  statusTextSuccess: {
    color: '#166534',
  },
  statusTextWarning: {
    color: '#92400E',
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  metricCol: {
    flex: 1,
    alignItems: 'center',
  },
  metricDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#E5E7EB',
  },
  metricLabel: {
    fontSize: 10.5,
    color: '#6B7280',
    fontWeight: '600',
  },
  metricValue: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111827',
    marginTop: 2,
  },
  savingsCallout: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    padding: 10,
    borderRadius: 10,
    marginTop: 10,
    gap: 8,
  },
  savingsCalloutText: {
    fontSize: 11,
    color: '#166534',
    flex: 1,
    lineHeight: 15,
  },
  scheduleTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 10,
  },
  dayCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingBottom: 4,
  },
  dayName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
  },
  dayCost: {
    fontSize: 13,
    fontWeight: '700',
    color: '#007A3D',
  },
  mealLine: {
    fontSize: 12,
    color: '#4B5563',
    marginTop: 3,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  acceptBtn: {
    backgroundColor: '#007A3D',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    shadowColor: '#007A3D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  acceptBtnText: {
    color: '#FFFFFF',
    fontSize: 14.5,
    fontWeight: '800',
  },
});

export default PremiumBudgetChallengeModal;
