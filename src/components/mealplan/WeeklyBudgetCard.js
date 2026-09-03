import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Colors from '../../constants/colors';

export default function WeeklyBudgetCard({
  target = 15000,
  spent = 11450,
  status = 'ON TRACK',
}) {
  const percentage = Math.min(Math.max((spent / target) * 100, 0), 100);

  return (
    <View style={styles.card}>
      {/* Top Row: Budget Info & Spent Amount */}
      <View style={styles.topRow}>
        <View>
          <Text style={styles.title}>Weekly Budget</Text>
          <Text style={styles.targetText}>Rs {target.toLocaleString()} target</Text>
        </View>
        <Text style={styles.spentAmount}>Rs  {spent.toLocaleString()}</Text>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${percentage}%` }]} />
      </View>

      {/* Status Text */}
      <View style={styles.statusRow}>
        <Text style={styles.statusText}>{status}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFF8F5',
    borderRadius: 18,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FEEFE7',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    letterSpacing: -0.2,
  },
  targetText: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  spentAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.terracottaDeep,
    letterSpacing: -0.3,
  },
  progressTrack: {
    height: 12,
    backgroundColor: Colors.budgetTrack,
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 6,
  },
  statusRow: {
    alignItems: 'flex-end',
    marginTop: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.primary,
    letterSpacing: 0.8,
  },
});
