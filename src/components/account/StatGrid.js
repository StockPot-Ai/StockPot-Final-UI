import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import Colors from '../../constants/colors';
import { useAccount } from '../../context/AccountContext';

const StatCard = ({ iconComponent, title, value, onPress }) => (
  <TouchableOpacity
    style={styles.card}
    onPress={onPress}
    activeOpacity={0.75}
    accessibilityRole="button"
    accessibilityLabel={`${title}: ${value}`}
  >
    <View style={styles.iconWrapper}>{iconComponent}</View>
    <Text style={styles.title}>{title}</Text>
    <Text style={styles.value} numberOfLines={1} adjustsFontSizeToFit>
      {value}
    </Text>
  </TouchableOpacity>
);

const StatGrid = ({ onSelectStat }) => {
  const { profile } = useAccount();

  return (
    <View style={styles.gridContainer}>
      {/* Row 1 */}
      <View style={styles.row}>
        {/* Money Saved */}
        <StatCard
          iconComponent={
            <View style={[styles.iconCircle, { backgroundColor: Colors.statMintBg }]}>
              <MaterialCommunityIcons
                name="piggy-bank-outline"
                size={18}
                color={Colors.statMintIcon}
              />
            </View>
          }
          title="MONEY SAVED"
          value={`Rs.  ${profile.moneySaved.toLocaleString()}`}
          onPress={() => onSelectStat('money')}
        />

        {/* Waste Avoided */}
        <StatCard
          iconComponent={
            <View style={[styles.iconCircle, { backgroundColor: Colors.statPinkBg }]}>
              <MaterialCommunityIcons
                name="delete-outline"
                size={18}
                color={Colors.statPinkIcon}
              />
            </View>
          }
          title="WASTE AVOIDED"
          value={`${profile.wasteAvoided} kg`}
          onPress={() => onSelectStat('waste')}
        />
      </View>

      {/* Row 2 */}
      <View style={styles.row}>
        {/* Streak */}
        <StatCard
          iconComponent={
            <View style={[styles.iconCircle, { backgroundColor: Colors.statRustBg }]}>
              <Ionicons name="flame" size={17} color={Colors.statRustIcon} />
            </View>
          }
          title="STREAK"
          value={`${profile.streakDays} days`}
          onPress={() => onSelectStat('streak')}
        />

        {/* Total XP */}
        <StatCard
          iconComponent={
            <View style={[styles.iconCircle, { backgroundColor: Colors.statAmberBg }]}>
              <Ionicons name="star" size={16} color={Colors.statAmberIcon} />
            </View>
          }
          title="TOTAL XP"
          value={profile.currentXp.toLocaleString()}
          onPress={() => onSelectStat('xp')}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  gridContainer: {
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 20,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  card: {
    flex: 1,
    backgroundColor: Colors.accountCardBg,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.accountBorder,
    shadowColor: 'rgba(0,0,0,0.04)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 2,
  },
  iconWrapper: {
    marginBottom: 0,
  },
  iconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  title: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.accountSectionHeader,
    letterSpacing: 0.8,
    marginBottom: 5,
  },
  value: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.accountTextPrimary,
    letterSpacing: -0.4,
  },
});

export default StatGrid;
