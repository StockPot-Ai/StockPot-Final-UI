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
              <View style={[styles.largeCircle, { backgroundColor: Colors.statMintBg }]}>
                <MaterialCommunityIcons
                  name="piggy-bank-outline"
                  size={32}
                  color={Colors.statMintIcon}
                />
              </View>
              <Text style={styles.statLargeVal}>Rs. {profile.moneySaved.toLocaleString()}</Text>
              <Text style={styles.statLargeLabel}>Total Groceries Saved</Text>
            </View>

            <View style={styles.breakdownCard}>
              <Text style={styles.breakdownHeader}>Savings Sources</Text>
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

      case 'waste':
        return (
          <>
            <View style={styles.topIconBadge}>
              <View style={[styles.largeCircle, { backgroundColor: Colors.statPinkBg }]}>
                <MaterialCommunityIcons
                  name="delete-outline"
                  size={32}
                  color={Colors.statPinkIcon}
                />
              </View>
              <Text style={styles.statLargeVal}>{profile.wasteAvoided} kg</Text>
              <Text style={styles.statLargeLabel}>Food Waste Prevented</Text>
            </View>

            <View style={styles.breakdownCard}>
              <Text style={styles.breakdownHeader}>Environmental Impact</Text>
              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownTitle}>Fresh Produce Saved</Text>
                <Text style={styles.breakdownAmount}>4.8 kg</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownTitle}>Dairy & Bakery Rescued</Text>
                <Text style={styles.breakdownAmount}>2.1 kg</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownTitle}>CO2 Emissions Reduced</Text>
                <Text style={styles.breakdownAmount}>15.2 kg eq</Text>
              </View>
            </View>
          </>
        );

      case 'streak':
        return (
          <>
            <View style={styles.topIconBadge}>
              <View style={[styles.largeCircle, { backgroundColor: Colors.statRustBg }]}>
                <Ionicons name="flame" size={32} color="#FFFFFF" />
              </View>
              <Text style={styles.statLargeVal}>{profile.streakDays} Days</Text>
              <Text style={styles.statLargeLabel}>Active Cooking Streak</Text>
            </View>

            <View style={styles.breakdownCard}>
              <Text style={styles.breakdownHeader}>Streak Milestones</Text>
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
              <View style={[styles.largeCircle, { backgroundColor: Colors.statAmberBg }]}>
                <Ionicons name="star" size={30} color="#FFFFFF" />
              </View>
              <Text style={styles.statLargeVal}>{profile.currentXp.toLocaleString()} XP</Text>
              <Text style={styles.statLargeLabel}>Level 6 Chef Rank</Text>
            </View>

            <View style={styles.breakdownCard}>
              <Text style={styles.breakdownHeader}>XP Level Breakdown</Text>
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
          {/* Header */}
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Achievement & Stats</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <Feather name="x" size={22} color="#4B5563" />
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
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
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
  topIconBadge: {
    alignItems: 'center',
    marginBottom: 20,
  },
  largeCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  statLargeVal: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.accountTextPrimary,
    marginBottom: 4,
  },
  statLargeLabel: {
    fontSize: 13,
    color: Colors.accountTextSecondary,
  },
  breakdownCard: {
    backgroundColor: '#FAF7F2',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.accountBorder,
    padding: 16,
    marginBottom: 10,
  },
  breakdownHeader: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.accountSectionHeader,
    letterSpacing: 0.3,
    marginBottom: 12,
  },
  breakdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  breakdownTitle: {
    fontSize: 13.5,
    fontWeight: '600',
    color: Colors.accountTextPrimary,
  },
  breakdownAmount: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.forestGreen,
  },
  divider: {
    height: 1,
    backgroundColor: '#EDE5DC',
  },
  actionRow: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  doneBtn: {
    paddingVertical: 13,
    borderRadius: 12,
    backgroundColor: Colors.forestGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

export default StatDetailModal;
