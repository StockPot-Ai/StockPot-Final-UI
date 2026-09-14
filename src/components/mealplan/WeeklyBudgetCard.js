import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../constants/colors';

export default function WeeklyBudgetCard({
  target = 10000,
  spent = 6800,
  totalMeals = 18,
}) {
  const remaining = Math.max(0, target - spent);
  const percentage = Math.min(Math.max((spent / (target || 1)) * 100, 0), 100);
  const isOnTrack = spent <= target;

  return (
    <View style={styles.card}>
      {/* Top metrics row */}
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.label}>Weekly Grocery Budget</Text>
          <View style={styles.amountRow}>
            <Text style={styles.spentText}>Rs. {spent.toLocaleString()}</Text>
            <Text style={styles.targetText}> / Rs. {target.toLocaleString()}</Text>
          </View>
        </View>

        <View style={[styles.statusBadge, isOnTrack ? styles.badgeSuccess : styles.badgeWarning]}>
          <Ionicons
            name={isOnTrack ? "checkmark-circle" : "alert-circle"}
            size={13}
            color={isOnTrack ? "#007A3D" : "#DC2626"}
          />
          <Text style={[styles.statusBadgeText, isOnTrack ? styles.textSuccess : styles.textWarning]}>
            {isOnTrack ? `Rs. ${remaining.toLocaleString()} Left` : 'Over Budget'}
          </Text>
        </View>
      </View>

      {/* Progress Track */}
      <View style={styles.progressTrack}>
        <View
          style={[
            styles.progressFill,
            {
              width: `${percentage}%`,
              backgroundColor: percentage > 95 ? '#DC2626' : Colors.primary,
            },
          ]}
        />
      </View>

      {/* Summary Footer */}
      <View style={styles.footerRow}>
        <Text style={styles.footerText}>
          📅 {totalMeals} Meals Planned This Week
        </Text>
        <Text style={styles.footerSubText}>
          Avg ~Rs. {totalMeals > 0 ? Math.round(spent / totalMeals) : 0}/meal
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 6,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  spentText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
  },
  targetText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 4,
  },
  badgeSuccess: {
    backgroundColor: '#E8F8F0',
  },
  badgeWarning: {
    backgroundColor: '#FEF2F2',
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  textSuccess: {
    color: '#007A3D',
  },
  textWarning: {
    color: '#DC2626',
  },
  progressTrack: {
    height: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 10,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 2,
  },
  footerText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4B5563',
  },
  footerSubText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
  },
});
