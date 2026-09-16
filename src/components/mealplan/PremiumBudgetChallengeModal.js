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
import PremiumUpgradeModal from '../account/PremiumUpgradeModal';

const PremiumBudgetChallengeModal = ({ visible, onClose, onChallengeAccepted }) => {
  const { isPremium, isPro } = useAccount();
  const [upgradeModalVisible, setUpgradeModalVisible] = useState(false);
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
    if (!isPro) {
      setUpgradeModalVisible(true);
      return;
    }

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
                <FontAwesome5 name="trophy" size={17} color="#E8A93F" />
              </View>
              <View>
                <Text style={styles.headerTitle}>Budget Challenge Simulator</Text>
                <Text style={styles.headerSub}>AI Meal Planning & Store Routing Engine</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color="#968880" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {/* Pro Plan Feature Alert if not Pro */}
            {!isPro && (
              <View style={styles.proLockBanner}>
                <View style={styles.proLockBadge}>
                  <Ionicons name="lock-closed" size={11} color="#994122" />
                  <Text style={styles.proLockBadgeText}>PRO PLAN EXCLUSIVE</Text>
                </View>
                <Text style={styles.proLockTitle}>Automated Budget Challenge is a Pro Feature</Text>
                <Text style={styles.proLockDesc}>
                  Simulate and lock in whole-week meal budgets with automated grocery routing across nearby stores. Upgrade to StockPot Pro for Rs. 999/mo to activate.
                </Text>
                <TouchableOpacity
                  style={styles.proUpgradeBannerBtn}
                  onPress={() => setUpgradeModalVisible(true)}
                  activeOpacity={0.85}
                >
                  <Ionicons name="sparkles" size={14} color="#FFFFFF" />
                  <Text style={styles.proUpgradeBannerBtnText}>Unlock Pro Plan • Rs. 999 / mo</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Example Preset Banner */}
            <View style={styles.presetBanner}>
              <Ionicons name="sparkles" size={18} color="#3A6847" />
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
              placeholderTextColor="#968880"
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
                  <Text style={[styles.metricValue, { color: '#3A6847' }]}>
                    Rs. {challengeResult.estimatedCost.toLocaleString()}
                  </Text>
                </View>
                <View style={styles.metricDivider} />
                <View style={styles.metricCol}>
                  <Text style={styles.metricLabel}>Remaining Surplus</Text>
                  <Text style={[styles.metricValue, { color: '#E8A93F' }]}>
                    Rs. {challengeResult.remainingBudget.toLocaleString()}
                  </Text>
                </View>
              </View>

              <View style={styles.savingsCallout}>
                <Ionicons name="cart" size={16} color="#3A6847" />
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
            {!isPro ? (
              <TouchableOpacity
                style={[styles.acceptBtn, styles.lockedProBtn]}
                onPress={() => setUpgradeModalVisible(true)}
                activeOpacity={0.88}
              >
                <Ionicons name="sparkles" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.acceptBtnText}>Unlock Pro to Accept Challenge (Rs. 999/mo)</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.acceptBtn}
                onPress={handleAcceptChallenge}
                activeOpacity={0.88}
              >
                <FontAwesome5 name="check-circle" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.acceptBtnText}>Accept Challenge & Log (+100 XP)</Text>
              </TouchableOpacity>
            )}
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
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(43, 36, 32, 0.65)',
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
    borderBottomColor: '#E8DFD8',
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
    backgroundColor: '#FEF6EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#2B2420',
  },
  headerSub: {
    fontSize: 11.5,
    color: '#968880',
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
  proLockBanner: {
    backgroundColor: '#FAF8F5',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#E8DFD8',
    marginBottom: 14,
  },
  proLockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#FCECE8',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
    marginBottom: 6,
  },
  proLockBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#994122',
    letterSpacing: 0.5,
  },
  proLockTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#2B2420',
    marginBottom: 4,
  },
  proLockDesc: {
    fontSize: 12,
    color: '#6B5E57',
    lineHeight: 17,
    marginBottom: 10,
  },
  proUpgradeBannerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#994122',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  proUpgradeBannerBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  presetBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAF8F5',
    borderWidth: 1,
    borderColor: '#E8DFD8',
    borderRadius: 14,
    padding: 12,
    gap: 10,
    marginBottom: 14,
  },
  presetTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#3A6847',
    textTransform: 'uppercase',
  },
  presetDesc: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#2B2420',
    marginTop: 1,
  },
  configLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2B2420',
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
    backgroundColor: '#F5EFEB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipActive: {
    backgroundColor: '#3A6847',
  },
  chipText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#6B5E57',
  },
  chipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  budgetInput: {
    backgroundColor: '#FAF8F5',
    borderWidth: 1,
    borderColor: '#E8DFD8',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#2B2420',
    fontWeight: '700',
    marginBottom: 14,
  },
  calculationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#E8DFD8',
    marginBottom: 16,
    shadowColor: '#2B2420',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
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
    color: '#2B2420',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  statusSuccess: {
    backgroundColor: '#EAF3EC',
  },
  statusWarning: {
    backgroundColor: '#FEF6EB',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  statusTextSuccess: {
    color: '#3A6847',
  },
  statusTextWarning: {
    color: '#C6851C',
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
    backgroundColor: '#E8DFD8',
  },
  metricLabel: {
    fontSize: 10.5,
    color: '#968880',
    fontWeight: '600',
  },
  metricValue: {
    fontSize: 15,
    fontWeight: '800',
    color: '#2B2420',
    marginTop: 2,
  },
  savingsCallout: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAF8F5',
    padding: 10,
    borderRadius: 10,
    marginTop: 10,
    gap: 8,
    borderWidth: 1,
    borderColor: '#E8DFD8',
  },
  savingsCalloutText: {
    fontSize: 11,
    color: '#3A6847',
    flex: 1,
    lineHeight: 15,
  },
  scheduleTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#2B2420',
    marginBottom: 10,
  },
  dayCard: {
    backgroundColor: '#FAF8F5',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E8DFD8',
  },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#E8DFD8',
    paddingBottom: 4,
  },
  dayName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2B2420',
  },
  dayCost: {
    fontSize: 13,
    fontWeight: '700',
    color: '#3A6847',
  },
  mealLine: {
    fontSize: 12,
    color: '#6B5E57',
    marginTop: 3,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E8DFD8',
    backgroundColor: '#FFFFFF',
  },
  acceptBtn: {
    backgroundColor: '#3A6847',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    shadowColor: '#3A6847',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  lockedProBtn: {
    backgroundColor: '#994122',
    shadowColor: '#994122',
  },
  acceptBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
});

export default PremiumBudgetChallengeModal;
