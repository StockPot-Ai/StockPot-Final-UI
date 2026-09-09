import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import Colors from '../constants/colors';

// ─── Mock Data (replace with real activity feed later) ─────────────────────────

const HISTORY_GROUPS = [
  { id: 'today', title: 'Today', date: 'September 3, 2026', dotColor: 'retailTerracotta' },
  { id: 'week', title: 'Earlier This Week', date: 'September 1, 2026', dotColor: 'retailBasil' },
  { id: 'aug30', title: 'Past Activity', date: 'August 30, 2026', dotColor: 'retailTurmeric' },
  { id: 'aug28', title: 'Past Activity', date: 'August 28, 2026', dotColor: 'retailOutlineWarm' },
];

const ACTIVITIES = [
  {
    id: 'act-1',
    groupId: 'today',
    kind: 'purchase',
    title: 'Grocery Purchase',
    store: 'Keells',
    storeBadge: 'keells',
    time: '2:45 PM',
    location: 'Keells Super',
    amount: 4850,
    saved: 650,
    bought: ['Rice', 'Chicken', 'Eggs', 'Milk'],
    savingsNote: 'Saved Rs. 650 via StockPot Smart Basket',
  },
  {
    id: 'act-2',
    groupId: 'week',
    kind: 'mealplan',
    title: 'Meal Plan Completed',
    badgeText: 'Planned',
    time: '10:15 AM',
    note: 'Weekly meal plan — 5 zero-waste meals planned',
    wasteNote: '4.8 kg projected waste avoided',
  },
  {
    id: 'act-3',
    groupId: 'aug30',
    kind: 'savings',
    title: 'Smart Savings Recorded',
    time: '6:20 PM',
    amount: 1250,
    description:
      'Compared prices across Keells, Cargills & Local Market to optimize grocery list.',
  },
  {
    id: 'act-4',
    groupId: 'aug28',
    kind: 'purchase',
    title: 'Grocery Purchase',
    store: 'Cargills',
    storeBadge: 'cargills',
    time: '4:10 PM',
    location: 'Cargills Food City',
    amount: 3200,
    saved: 420,
    bought: ['Vegetables', 'Pasta', 'Cheese'],
    savingsNote: 'Saved Rs. 420 using in-season substitution',
  },
];

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'purchase', label: 'Purchases' },
  { id: 'mealplan', label: 'Meal Plans' },
  { id: 'savings', label: 'Savings' },
];

const STORE_BADGES = {
  keells: { bg: '#ECFDF5', text: '#1F4A2B', border: '#A7F3D0' },
  cargills: { bg: '#FFF7ED', text: Colors.retailTerracotta, border: '#FED7AA' },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatCurrency = (n) => n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');

const computeStats = (items) => {
  const activities = items.length;
  const totalSpent = items
    .filter((a) => a.kind === 'purchase')
    .reduce((sum, a) => sum + a.amount, 0);
  const totalSaved = items
    .filter((a) => a.kind === 'savings')
    .reduce((sum, a) => sum + a.amount, 0);
  return { activities, totalSpent, totalSaved };
};

// ─── Sub-components ──────────────────────────────────────────────────────────

const HistoryHeader = ({ onBack }) => (
  <View style={styles.header}>
    <TouchableOpacity onPress={onBack} style={styles.headerBtn} activeOpacity={0.7}>
      <Ionicons name="arrow-back" size={22} color={Colors.retailCharcoal} />
    </TouchableOpacity>
    <View style={styles.headerTitleCol}>
      <Text style={styles.headerEyebrow}>StockPot AI</Text>
      <Text style={styles.headerTitle}>Activity History</Text>
    </View>
    <TouchableOpacity
      onPress={() => Alert.alert('Calendar', 'Choose a date to filter activity.')}
      style={styles.headerBtn}
      activeOpacity={0.7}
    >
      <Ionicons name="calendar-outline" size={20} color={Colors.retailCharcoal} />
    </TouchableOpacity>
  </View>
);

const FilterChips = ({ active, onChange }) => (
  <ScrollView
    horizontal
    showsHorizontalScrollIndicator={false}
    contentContainerStyle={styles.chipsRow}
  >
    {FILTERS.map((f) => {
      const isActive = f.id === active;
      return (
        <TouchableOpacity
          key={f.id}
          onPress={() => onChange(f.id)}
          activeOpacity={0.7}
          style={[styles.chip, isActive && styles.chipActive]}
        >
          <Text style={[styles.chipText, isActive && styles.chipTextActive]}>{f.label}</Text>
        </TouchableOpacity>
      );
    })}
  </ScrollView>
);

const SummaryCard = ({ stats, monthLabel }) => (
  <View style={styles.summaryCard}>
    <View style={styles.summaryHeaderRow}>
      <View style={styles.summaryHeaderLeft}>
        <View style={styles.summaryIconChip}>
          <Ionicons name="receipt" size={16} color={Colors.retailTerracotta} />
        </View>
        <Text style={styles.summaryLabel}>Recent Summary</Text>
      </View>
      <View style={styles.monthPill}>
        <Text style={styles.monthPillText}>{monthLabel}</Text>
      </View>
    </View>
    <View style={styles.summaryDivider} />
    <View style={styles.summaryGrid}>
      <View style={styles.summaryCol}>
        <Text style={styles.summaryValue}>{stats.activities}</Text>
        <Text style={styles.summaryCaption}>Activities</Text>
      </View>
      <View style={styles.summaryCol}>
        <Text style={styles.summaryValue}>Rs. {formatCurrency(stats.totalSpent)}</Text>
        <Text style={styles.summaryCaption}>Total Spent</Text>
      </View>
      <View style={styles.summaryCol}>
        <Text style={[styles.summaryValue, styles.summaryValueSaved]}>
          Rs. {formatCurrency(stats.totalSaved)}
        </Text>
        <Text style={[styles.summaryCaption, styles.summaryCaptionSaved]}>Total Saved</Text>
      </View>
    </View>
  </View>
);

const GroupHeader = ({ title, date, dotColor }) => (
  <View style={styles.groupHeader}>
    <View style={styles.groupHeaderLeft}>
      <View style={[styles.groupDot, { backgroundColor: Colors[dotColor] }]} />
      <Text style={styles.groupTitle}>{title}</Text>
    </View>
    <Text style={styles.groupDate}>{date.toUpperCase()}</Text>
  </View>
);

const PurchaseCard = ({ activity }) => {
  const badge = STORE_BADGES[activity.storeBadge] || STORE_BADGES.keells;
  return (
    <View style={styles.card}>
      <View style={styles.cardTopRow}>
        <View style={styles.cardLeft}>
          <View style={[styles.iconTile, styles.iconTileTerracotta]}>
            <Ionicons name="cart" size={20} color={Colors.retailTerracotta} />
          </View>
          <View style={styles.cardTextCol}>
            <View style={styles.badgeRow}>
              <Text style={styles.cardTitle}>{activity.title}</Text>
              <View style={[styles.storeBadge, { backgroundColor: badge.bg, borderColor: badge.border }]}>
                <Text style={[styles.storeBadgeText, { color: badge.text }]}>{activity.store}</Text>
              </View>
            </View>
            <View style={styles.metaRow}>
              <Ionicons name="time-outline" size={13} color={Colors.retailMuted} />
              <Text style={styles.cardMeta}>
                {activity.time} • {activity.location}
              </Text>
            </View>
          </View>
        </View>
        <View style={styles.cardRight}>
          <Text style={styles.amountText}>Rs. {formatCurrency(activity.amount)}</Text>
          <Text style={styles.savedText}>-Rs. {formatCurrency(activity.saved)}</Text>
        </View>
      </View>
      <View style={styles.innerCard}>
        <Text style={styles.innerBought}>
          <Text style={styles.innerBoughtLabel}>Bought: </Text>
          {activity.bought.join(', ')}
        </Text>
        <View style={styles.savingRow}>
          <FontAwesome5 name="piggy-bank" size={14} color={Colors.retailBasil} />
          <Text style={styles.savingText}>{activity.savingsNote}</Text>
        </View>
      </View>
    </View>
  );
};

const MealPlanCard = ({ activity }) => (
  <View style={styles.card}>
    <View style={styles.cardTopRow}>
      <View style={styles.cardLeft}>
        <View style={[styles.iconTile, styles.iconTileBasil]}>
          <MaterialCommunityIcons name="chef-hat" size={20} color={Colors.retailBasil} />
        </View>
        <View style={styles.cardTextCol}>
          <View style={styles.badgeRow}>
            <Text style={styles.cardTitle}>{activity.title}</Text>
            <View style={styles.plannedBadge}>
              <Text style={styles.plannedBadgeText}>{activity.badgeText}</Text>
            </View>
          </View>
          <View style={styles.metaRow}>
            <Ionicons name="time-outline" size={13} color={Colors.retailMuted} />
            <Text style={styles.cardMeta}>{activity.time}</Text>
          </View>
        </View>
      </View>
      <Ionicons name="checkmark-circle" size={22} color={Colors.retailBasil} />
    </View>
    <View style={styles.mealInnerCard}>
      <Text style={styles.mealNote}>{activity.note}</Text>
      <View style={styles.savingRow}>
        <Ionicons name="leaf" size={14} color={Colors.retailBasil} />
        <Text style={styles.wasteText}>{activity.wasteNote}</Text>
      </View>
    </View>
  </View>
);

const SavingsCard = ({ activity }) => (
  <View style={styles.card}>
    <View style={styles.cardTopRow}>
      <View style={styles.cardLeft}>
        <View style={[styles.iconTile, styles.iconTileTurmeric]}>
          <FontAwesome5 name="piggy-bank" size={20} color="#B87B14" />
        </View>
        <View style={styles.cardTextCol}>
          <Text style={styles.cardTitle}>{activity.title}</Text>
          <View style={styles.metaRow}>
            <Ionicons name="time-outline" size={13} color={Colors.retailMuted} />
            <Text style={styles.cardMeta}>{activity.time}</Text>
          </View>
        </View>
      </View>
      <View style={styles.savingsPill}>
        <Text style={styles.savingsPillText}>+Rs. {formatCurrency(activity.amount)}</Text>
      </View>
    </View>
    <Text style={styles.cardDescription}>{activity.description}</Text>
  </View>
);

const ActivityCard = ({ activity }) => {
  if (activity.kind === 'purchase') return <PurchaseCard activity={activity} />;
  if (activity.kind === 'mealplan') return <MealPlanCard activity={activity} />;
  return <SavingsCard activity={activity} />;
};

// ─── Main Component ──────────────────────────────────────────────────────────

export default function HistoryScreen({ onBack }) {
  const [activeFilter, setActiveFilter] = useState('all');

  const filtered = ACTIVITIES.filter(
    (a) => activeFilter === 'all' || a.kind === activeFilter
  );
  const stats = computeStats(filtered);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.retailBg} />
      <HistoryHeader onBack={onBack} />
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <FilterChips active={activeFilter} onChange={setActiveFilter} />
        <SummaryCard stats={stats} monthLabel="Sep 2026" />
        {HISTORY_GROUPS.map((group) => {
          const items = filtered.filter((a) => a.groupId === group.id);
          if (items.length === 0) return null;
          return (
            <View key={group.id} style={styles.timelineSection}>
              <GroupHeader title={group.title} date={group.date} dotColor={group.dotColor} />
              {items.map((item) => (
                <ActivityCard key={item.id} activity={item} />
              ))}
            </View>
          );
        })}
        <View style={styles.scrollEndSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.retailBg,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  scrollEndSpacer: {
    height: 32,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.retailBg,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(220, 193, 185, 0.3)',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 8 : 12,
    paddingBottom: 12,
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.retailSurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleCol: {
    alignItems: 'center',
  },
  headerEyebrow: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: Colors.retailTerracotta,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.retailCharcoal,
    lineHeight: 22,
  },

  // Filter chips
  chipsRow: {
    gap: 8,
    paddingBottom: 4,
  },
  chip: {
    backgroundColor: Colors.retailSurface,
    borderWidth: 1,
    borderColor: 'rgba(220, 193, 185, 0.4)',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  chipActive: {
    backgroundColor: Colors.retailTerracotta,
    borderColor: Colors.retailTerracotta,
  },
  chipText: {
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 0.5,
    color: Colors.retailCharcoal,
  },
  chipTextActive: {
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Summary card
  summaryCard: {
    marginTop: 16,
    backgroundColor: '#FFF6EF',
    borderWidth: 1,
    borderColor: 'rgba(220, 193, 185, 0.6)',
    borderRadius: 16,
    padding: 16,
    shadowColor: 'rgba(153, 65, 34, 0.06)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 2,
  },
  summaryHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  summaryHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  summaryIconChip: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(153, 65, 34, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: Colors.retailMuted,
  },
  monthPill: {
    backgroundColor: 'rgba(153, 65, 34, 0.1)',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  monthPillText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: Colors.retailTerracotta,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: 'rgba(220, 193, 185, 0.4)',
    marginBottom: 12,
  },
  summaryGrid: {
    flexDirection: 'row',
  },
  summaryCol: {
    flex: 1,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.retailCharcoal,
    lineHeight: 22,
  },
  summaryValueSaved: {
    color: Colors.retailBasil,
  },
  summaryCaption: {
    marginTop: 2,
    fontSize: 10,
    color: Colors.retailMuted,
  },
  summaryCaptionSaved: {
    color: Colors.retailBasil,
    fontWeight: '600',
  },

  // Timeline group
  timelineSection: {
    marginTop: 20,
    gap: 10,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  groupHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  groupDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  groupTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.retailCharcoal,
  },
  groupDate: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: Colors.retailMuted,
  },

  // Activity card
  card: {
    backgroundColor: Colors.retailCard,
    borderWidth: 1,
    borderColor: 'rgba(220, 193, 185, 0.5)',
    borderRadius: 16,
    padding: 16,
    shadowColor: 'rgba(0,0,0,0.06)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 1,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
    gap: 10,
  },
  cardTextCol: {
    flex: 1,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.retailCharcoal,
    lineHeight: 18,
  },
  cardRight: {
    alignItems: 'flex-end',
  },
  iconTile: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconTileTerracotta: {
    backgroundColor: 'rgba(153, 65, 34, 0.1)',
  },
  iconTileBasil: {
    backgroundColor: 'rgba(58, 104, 71, 0.15)',
  },
  iconTileTurmeric: {
    backgroundColor: 'rgba(232, 169, 63, 0.2)',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  cardMeta: {
    fontSize: 11,
    color: Colors.retailMuted,
  },
  storeBadge: {
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  storeBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  plannedBadge: {
    backgroundColor: 'rgba(185, 236, 194, 0.7)',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  plannedBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#1F4A2B',
  },
  amountText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.retailCharcoal,
    lineHeight: 18,
  },
  savedText: {
    marginTop: 2,
    fontSize: 10,
    fontWeight: '700',
    color: Colors.retailBasil,
  },
  innerCard: {
    backgroundColor: Colors.retailSurfaceLow,
    borderRadius: 8,
    padding: 10,
    marginTop: 4,
    gap: 6,
  },
  innerBought: {
    fontSize: 11,
    color: Colors.retailCharcoal,
    lineHeight: 16,
  },
  innerBoughtLabel: {
    color: Colors.retailMuted,
    fontWeight: '500',
  },
  savingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  savingText: {
    fontSize: 11,
    color: Colors.retailBasil,
    fontWeight: '500',
  },
  mealInnerCard: {
    backgroundColor: '#F1F8F3',
    borderWidth: 1,
    borderColor: 'rgba(58, 104, 71, 0.2)',
    borderRadius: 8,
    padding: 10,
    marginTop: 4,
    gap: 6,
  },
  mealNote: {
    fontSize: 11,
    color: Colors.retailCharcoal,
    marginBottom: 2,
  },
  wasteText: {
    fontSize: 11,
    color: '#1F4A2B',
    fontWeight: '600',
  },
  savingsPill: {
    backgroundColor: 'rgba(185, 236, 194, 0.8)',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  savingsPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.retailBasil,
  },
  cardDescription: {
    fontSize: 11,
    color: Colors.retailMuted,
    lineHeight: 17,
  },
});