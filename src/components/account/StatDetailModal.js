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
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Colors from '../../constants/colors';
import { useAccount } from '../../context/AccountContext';

const StatDetailModal = ({ visible, statType, onClose }) => {
  const { profile } = useAccount();

  if (!visible || !statType) return null;

  const renderContent = () => {
    switch (statType) {
      case 'money':
        return (
          <>
            <View style={styles.topIconBadge}>
              <View style={[styles.largeCircle, { backgroundColor: '#DCFCE7' }]}>
                <MaterialCommunityIcons
                  name="piggy-bank-outline"
                  size={32}
                  color="#166534"
                />
              </View>
              <Text style={styles.statLargeVal}>Rs. {profile.moneySaved.toLocaleString()}</Text>
              <Text style={styles.statLargeLabel}>Total Groceries Saved</Text>
            </View>

            <View style={styles.breakdownCard}>
              <Text style={styles.breakdownHeader}>SAVINGS BREAKDOWN</Text>
              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownTitle}>Pantry Ingredient Reuse</Text>
                <Text style={styles.breakdownAmount}>Rs. 6,800</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownTitle}>Discount Store Comparison</Text>
                <Text style={styles.breakdownAmount}>Rs. 3,450</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownTitle}>Waste Reduction Prevention</Text>
                <Text style={styles.breakdownAmount}>Rs. 2,200</Text>
              </View>
            </View>
          </>
        );

      case 'recipes':
        return (
          <>
            <View style={styles.topIconBadge}>
              <View style={[styles.largeCircle, { backgroundColor: '#FEE2E2' }]}>
                <MaterialCommunityIcons
                  name="silverware-fork-knife"
                  size={30}
                  color="#DC2626"
                />
              </View>
              <Text style={styles.statLargeVal}>{profile.recipesCooked || 34} Meals</Text>
              <Text style={styles.statLargeLabel}>Home Cooked Meals</Text>
            </View>

            <View style={styles.breakdownCard}>
              <Text style={styles.breakdownHeader}>RECIPES ACTIVITY</Text>
              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownTitle}>Traditional Sri Lankan Curries</Text>
                <Text style={styles.breakdownAmount}>18 Dishes</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownTitle}>Quick Meals (&lt;20 mins)</Text>
                <Text style={styles.breakdownAmount}>10 Dishes</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownTitle}>Community Recipes Shared</Text>
                <Text style={styles.breakdownAmount}>6 Recipes</Text>
              </View>
            </View>
          </>
        );

      case 'budget':
        return (
          <>
            <View style={styles.topIconBadge}>
              <View style={[styles.largeCircle, { backgroundColor: '#E0F2FE' }]}>
                <Feather name="target" size={28} color="#0284C7" />
              </View>
              <Text style={styles.statLargeVal}>Rs. 10,000 / wk</Text>
              <Text style={styles.statLargeLabel}>Weekly Spending Cap</Text>
            </View>

            <View style={styles.breakdownCard}>
              <Text style={styles.breakdownHeader}>BUDGET ALLOCATION</Text>
              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownTitle}>Vegetables & Fresh Produce</Text>
                <Text style={styles.breakdownAmount}>~Rs. 3,500</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownTitle}>Pantry Grains, Dhal & Spices</Text>
                <Text style={styles.breakdownAmount}>~Rs. 3,200</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownTitle}>Proteins & Dairy</Text>
                <Text style={styles.breakdownAmount}>~Rs. 3,300</Text>
              </View>
            </View>
          </>
        );

      case 'streak':
        return (
          <>
            <View style={styles.topIconBadge}>
              <View style={[styles.largeCircle, { backgroundColor: '#FFEDD5' }]}>
                <Ionicons name="flame" size={32} color="#EA580C" />
              </View>
              <Text style={styles.statLargeVal}>{profile.streakDays} Days</Text>
              <Text style={styles.statLargeLabel}>Active Cooking Streak</Text>
            </View>

            <View style={styles.breakdownCard}>
              <Text style={styles.breakdownHeader}>STREAK MILESTONES</Text>
              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownTitle}>Current Streak</Text>
                <Text style={styles.breakdownAmount}>{profile.streakDays} Days 🔥</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownTitle}>Longest Streak</Text>
                <Text style={styles.breakdownAmount}>14 Days</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownTitle}>Next Bonus Milestone</Text>
                <Text style={styles.breakdownAmount}>10 Days (+200 XP)</Text>
              </View>
            </View>
          </>
        );

      case 'xp':
      default:
        return (
          <>
            <View style={styles.topIconBadge}>
              <View style={[styles.largeCircle, { backgroundColor: '#FEF3C7' }]}>
                <Ionicons name="star" size={30} color="#D97706" />
              </View>
              <Text style={styles.statLargeVal}>{profile.currentXp.toLocaleString()} XP</Text>
              <Text style={styles.statLargeLabel}>Level 6 Chef Rank</Text>
            </View>

            <View style={styles.breakdownCard}>
              <Text style={styles.breakdownHeader}>XP LEVEL BREAKDOWN</Text>
              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownTitle}>Planned Meals Logged</Text>
                <Text style={styles.breakdownAmount}>+1,200 XP</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownTitle}>Zero-Waste Challenges</Text>
                <Text style={styles.breakdownAmount}>+750 XP</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownTitle}>Weekly Shopping Log</Text>
                <Text style={styles.breakdownAmount}>+500 XP</Text>
              </View>
            </View>
          </>
        );
    }
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
              <Text style={styles.sheetTitle}>Achievement & Stats</Text>
              <Text style={styles.sheetSub}>Detailed insights & progress history</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <Feather name="x" size={18} color="#4B5563" />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {renderContent()}
          </ScrollView>

          {/* Action Row */}
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.doneBtn} onPress={onClose} activeOpacity={0.8}>
              <Text style={styles.doneBtnText}>Close</Text>
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
    paddingTop: 8,
    paddingBottom: 12,
  },
  topIconBadge: {
    alignItems: 'center',
    marginBottom: 20,
  },
  largeCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statLargeVal: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  statLargeLabel: {
    fontSize: 13.5,
    color: '#6B7280',
    fontWeight: '500',
  },
  breakdownCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 16,
    marginBottom: 10,
    shadowColor: 'rgba(0,0,0,0.03)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 1,
  },
  breakdownHeader: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6B7280',
    letterSpacing: 0.6,
    marginBottom: 12,
  },
  breakdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  breakdownTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  breakdownAmount: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#166534',
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
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

export default StatDetailModal;
