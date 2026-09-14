import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons, Ionicons, Feather } from '@expo/vector-icons';
import Colors from '../../constants/colors';
import { useAccount } from '../../context/AccountContext';

const StatCard = ({ iconComponent, title, value, subtitle, onPress }) => (
  <TouchableOpacity
    style={styles.card}
    onPress={onPress}
    activeOpacity={0.75}
    accessibilityRole="button"
    accessibilityLabel={`${title}: ${value}`}
  >
    <View style={styles.topRow}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.iconWrapper}>{iconComponent}</View>
    </View>
    <Text style={styles.value} numberOfLines={1}>
      {value}
    </Text>
    {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
  </TouchableOpacity>
);

const StatGrid = ({ onSelectStat }) => {
  const { profile, budget } = useAccount();

  return (
    <View style={styles.gridContainer}>
      {/* Row 1 */}
      <View style={styles.row}>
        {/* Money Saved */}
        <StatCard
          iconComponent={
            <View style={[styles.iconCircle, { backgroundColor: '#E8F8F0' }]}>
              <Ionicons name="wallet-outline" size={17} color="#007A3D" />
            </View>
          }
          title="MONEY SAVED"
          value={`Rs. ${(profile.moneySaved || 18450).toLocaleString()}`}
          subtitle="Split-basket savings"
          onPress={() => onSelectStat && onSelectStat('money')}
        />

        {/* Dishes Cooked */}
        <StatCard
          iconComponent={
            <View style={[styles.iconCircle, { backgroundColor: '#FEE2E2' }]}>
              <MaterialCommunityIcons name="silverware-fork-knife" size={17} color="#DC2626" />
            </View>
          }
          title="DISHES COOKED"
          value={`${profile.recipesCooked || 34} Meals`}
          subtitle="3 cooked this week"
          onPress={() => onSelectStat && onSelectStat('recipes')}
        />
      </View>

      {/* Row 2 */}
      <View style={styles.row}>
        {/* Cooking Streak */}
        <StatCard
          iconComponent={
            <View style={[styles.iconCircle, { backgroundColor: '#FEF3C7' }]}>
              <Ionicons name="flame" size={18} color="#D97706" />
            </View>
          }
          title="COOKING STREAK"
          value={`${profile.streakDays || 7} Days 🔥`}
          subtitle="Best streak: 14 days"
          onPress={() => onSelectStat && onSelectStat('streak')}
        />

        {/* Weekly Budget Target */}
        <StatCard
          iconComponent={
            <View style={[styles.iconCircle, { backgroundColor: '#E0F2FE' }]}>
              <Feather name="target" size={17} color="#0284C7" />
            </View>
          }
          title="WEEKLY BUDGET"
          value={`Rs. ${(budget?.weeklyBudget || 10000).toLocaleString()}`}
          subtitle="Status: On Track"
          onPress={() => onSelectStat && onSelectStat('budget')}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  gridContainer: {
    paddingHorizontal: 16,
    gap: 10,
    marginBottom: 20,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  card: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
    justifyContent: 'space-between',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  title: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#6B7280',
    letterSpacing: 0.5,
  },
  iconWrapper: {},
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 11,
    fontWeight: '500',
    color: '#9CA3AF',
  },
});

export default StatGrid;
