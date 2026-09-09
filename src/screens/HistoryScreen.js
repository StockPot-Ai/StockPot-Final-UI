import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Platform,
  Alert,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import Colors from '../constants/colors';
import { activityService } from '../services';

const INITIAL_GROUPS = [
  { id: 'today', title: 'Today', date: 'September 9, 2026', dotColor: 'retailTerracotta' },
  { id: 'week', title: 'Earlier This Week', date: 'September 3, 2026', dotColor: 'retailBasil' },
  { id: 'past', title: 'Past Activity', date: 'August 30, 2026', dotColor: 'retailTurmeric' },
];

const INITIAL_ACTIVITIES = [
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
    groupId: 'past',
    kind: 'savings',
    title: 'Smart Savings Recorded',
    time: '6:20 PM',
    amount: 1250,
    description:
      'Compared prices across Keells, Cargills & Local Market to optimize grocery list.',
  },
  {
    id: 'act-4',
    groupId: 'past',
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
  { id: 'purchases', label: 'Purchases' },
  { id: 'meal_plans', label: 'Meal Plans' },
  { id: 'savings', label: 'Savings' },
];

const STORE_BADGES = {
  keells: { bg: '#ECFDF5', text: '#1F4A2B', border: '#A7F3D0' },
  cargills: { bg: '#FFF7ED', text: Colors.retailTerracotta || '#EA580C', border: '#FED7AA' },
  glomark: { bg: '#EFF6FF', text: '#1E40AF', border: '#BFDBFE' },
  default: { bg: '#F5F5F4', text: '#44403C', border: '#E7E5E4' },
};

const formatCurrency = (n) => {
  const val = Math.round(Number(n) || 0);
  return val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

const computeStats = (items) => {
  const activities = items.length;
  const totalSpent = items
    .filter((a) => a.kind === 'purchase' || a.type === 'purchase')
    .reduce((sum, a) => sum + (Number(a.amount) || 0), 0);
  const totalSaved = items.reduce((sum, a) => sum + (Number(a.saved) || (a.kind === 'savings' ? Number(a.amount) : 0)), 0);
  return { activities, totalSpent, totalSaved };
};

const HistoryHeader = ({ onBack }) => (
  <View style={styles.header}>
    <TouchableOpacity onPress={onBack} style={styles.headerBtn} activeOpacity={0.7}>
      <Ionicons name="arrow-back" size={22} color={Colors.retailCharcoal || '#292524'} />
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
      <Ionicons name="calendar-outline" size={20} color={Colors.retailCharcoal || '#292524'} />
    </TouchableOpacity>
  </View>
);

const FilterChips = ({ active, onChange }) => (
  <ScrollView
    horizontal
    showsHorizontalScrollIndicator={false}
    contentContainerStyle={styles.filterRow}
  >
    {FILTERS.map((f) => {
      const isSelected = f.id === active;
      return (
        <TouchableOpacity
          key={f.id}
          onPress={() => onChange(f.id)}
          style={[styles.chip, isSelected && styles.chipActive]}
          activeOpacity={0.8}
        >
          <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
            {f.label}
          </Text>
        </TouchableOpacity>
      );
    })}
  </ScrollView>
);

const SummaryCard = ({ stats, monthLabel = 'Sep 2026' }) => (
  <View style={styles.summaryCard}>
    <View style={styles.summaryTop}>
      <Text style={styles.summaryMonth}>{monthLabel} Overview</Text>
      <View style={styles.summaryTag}>
        <Ionicons name="stats-chart" size={12} color={Colors.retailBasil || '#2E7D32'} />
        <Text style={styles.summaryTagText}>{stats.activities} Activities</Text>
      </View>
    </View>
    <View style={styles.summaryDivider} />
    <View style={styles.summaryColumns}>
      <View style={styles.summaryCol}>
        <Text style={styles.summaryColLabel}>Total Spent</Text>
        <Text style={styles.summaryColVal}>Rs. {formatCurrency(stats.totalSpent)}</Text>
      </View>
      <View style={styles.summaryColSep} />
      <View style={styles.summaryCol}>
        <Text style={styles.summaryColLabel}>Total Saved</Text>
        <Text style={[styles.summaryColVal, { color: Colors.retailBasil || '#2E7D32' }]}>
          Rs. {formatCurrency(stats.totalSaved)}
        </Text>
      </View>
    </View>
  </View>
);

const PurchaseCard = ({ activity }) => {
  const badgeKey = (activity.storeBadge || activity.store || '').toLowerCase();
  const badge = STORE_BADGES[badgeKey] || STORE_BADGES.default;

  return (
    <View style={styles.card}>
      <View style={styles.cardTopRow}>
        <View style={styles.cardLeft}>
          <View style={[styles.iconTile, styles.iconTileTerracotta]}>
            <Ionicons name="cart-outline" size={20} color={Colors.retailTerracotta || '#EA580C'} />
          </View>
          <View style={styles.cardTextCol}>
            <View style={styles.badgeRow}>
              <Text style={styles.cardTitle}>{activity.title}</Text>
              {activity.store ? (
                <View style={[styles.storeBadge, { backgroundColor: badge.bg, borderColor: badge.border }]}>
                  <Text style={[styles.storeBadgeText, { color: badge.text }]}>{activity.store}</Text>
                </View>
              ) : null}
            </View>
            <View style={styles.metaRow}>
              <Ionicons name="time-outline" size={13} color={Colors.retailMuted || '#78716C'} />
              <Text style={styles.cardMeta}>
                {activity.time} {activity.location ? `• ${activity.location}` : ''}
              </Text>
            </View>
          </View>
        </View>
        <View style={styles.cardRight}>
          <Text style={styles.amountText}>Rs. {formatCurrency(activity.amount)}</Text>
          {activity.saved ? (
            <Text style={styles.savedText}>-Rs. {formatCurrency(activity.saved)}</Text>
          ) : null}
        </View>
      </View>
      {(activity.bought || activity.savingsNote || activity.description) ? (
        <View style={styles.innerCard}>
          {activity.bought && activity.bought.length > 0 ? (
            <Text style={styles.innerBought}>
              <Text style={styles.innerBoughtLabel}>Bought: </Text>
              {Array.isArray(activity.bought) ? activity.bought.join(', ') : activity.bought}
            </Text>
          ) : null}
          {activity.description ? (
            <Text style={styles.innerBought}>{activity.description}</Text>
          ) : null}
          {activity.savingsNote ? (
            <View style={styles.savingRow}>
              <FontAwesome5 name="piggy-bank" size={14} color={Colors.retailBasil || '#2E7D32'} />
              <Text style={styles.savingText}>{activity.savingsNote}</Text>
            </View>
          ) : null}
        </View>
      ) : null}
    </View>
  );
};

const MealPlanCard = ({ activity }) => (
  <View style={styles.card}>
    <View style={styles.cardTopRow}>
      <View style={styles.cardLeft}>
        <View style={[styles.iconTile, styles.iconTileBasil]}>
          <MaterialCommunityIcons name="chef-hat" size={20} color={Colors.retailBasil || '#2E7D32'} />
        </View>
        <View style={styles.cardTextCol}>
          <View style={styles.badgeRow}>
            <Text style={styles.cardTitle}>{activity.title}</Text>
            <View style={styles.plannedBadge}>
              <Text style={styles.plannedBadgeText}>{activity.badgeText || 'Planned'}</Text>
            </View>
          </View>
          <View style={styles.metaRow}>
            <Ionicons name="time-outline" size={13} color={Colors.retailMuted || '#78716C'} />
            <Text style={styles.cardMeta}>{activity.time}</Text>
          </View>
        </View>
      </View>
      <Ionicons name="checkmark-circle" size={22} color={Colors.retailBasil || '#2E7D32'} />
    </View>
    <View style={styles.mealInnerCard}>
      <Text style={styles.mealNote}>{activity.note || activity.description || 'Weekly meal plan'}</Text>
      <View style={styles.savingRow}>
        <Ionicons name="leaf" size={14} color={Colors.retailBasil || '#2E7D32'} />
        <Text style={styles.wasteText}>{activity.wasteNote || 'Zero waste avoided'}</Text>
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
            <Ionicons name="time-outline" size={13} color={Colors.retailMuted || '#78716C'} />
            <Text style={styles.cardMeta}>{activity.time}</Text>
          </View>
        </View>
      </View>
      <View style={styles.savingsPill}>
        <Text style={styles.savingsPillText}>+Rs. {formatCurrency(activity.amount || activity.saved)}</Text>
      </View>
    </View>
    {activity.description ? (
      <View style={styles.innerCard}>
        <Text style={styles.innerBought}>{activity.description}</Text>
      </View>
    ) : null}
  </View>
);

const ActivityCard = ({ activity }) => {
  const kind = activity.kind || activity.type;
  if (kind === 'purchase') return <PurchaseCard activity={activity} />;
  if (kind === 'mealplan' || kind === 'meal_plan' || kind === 'meal_plans') return <MealPlanCard activity={activity} />;
  return <SavingsCard activity={activity} />;
};

const GroupHeader = ({ title, date, dotColor }) => (
  <View style={styles.groupHeader}>
    <View style={[styles.groupDot, { backgroundColor: Colors[dotColor] || Colors.primary }]} />
    <Text style={styles.groupTitle}>{title}</Text>
    <Text style={styles.groupDate}>{date}</Text>
  </View>
);

export default function HistoryScreen({ onBack }) {
  const [activeFilter, setActiveFilter] = useState('all');
  const [activities, setActivities] = useState(INITIAL_ACTIVITIES);
  const [groups, setGroups] = useState(INITIAL_GROUPS);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    setLoading(true);

    activityService
      .getActivity(activeFilter)
      .then((data) => {
        if (!mounted) return;
        if (Array.isArray(data) && data.length > 0) {
          const mapped = data.map((item, idx) => {
            const isMeal = item.type === 'meal_plan' || item.type === 'meal_plans';
            const isSavings = item.type === 'savings' || item.type === 'shop_comparison';
            const kind = isMeal ? 'mealplan' : isSavings ? 'savings' : 'purchase';

            let groupId = 'today';
            if (idx === 1) groupId = 'week';
            if (idx > 1) groupId = 'past';

            return {
              id: item.id || `act-${idx}`,
              groupId,
              kind,
              title: item.title,
              store: item.store,
              storeBadge: item.store ? item.store.toLowerCase() : undefined,
              time: item.created_at ? new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '2:45 PM',
              location: item.store ? `${item.store} Super` : undefined,
              amount: item.amount || 0,
              saved: item.saved || 0,
              bought: item.bought || ['Fresh Vegetables', 'Dairy', 'Produce'],
              savingsNote: item.saved ? `Saved Rs. ${item.saved} via StockPot Smart Basket` : undefined,
              description: item.description,
              note: item.description,
              wasteNote: '3.5 kg waste avoided',
            };
          });
          setActivities(mapped);
        }
      })
      .catch((err) => console.log('Activity fetch note:', err.message))
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [activeFilter]);

  const stats = computeStats(activities);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.retailBg || '#FAFAF8'} />
      <HistoryHeader onBack={onBack} />
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <FilterChips active={activeFilter} onChange={setActiveFilter} />
        <SummaryCard stats={stats} monthLabel="Sep 2026" />

        {loading ? (
          <View style={{ paddingVertical: 40, alignItems: 'center' }}>
            <ActivityIndicator size="small" color={Colors.primary} />
          </View>
        ) : (
          groups.map((group) => {
            const items = activities.filter((a) => a.groupId === group.id);
            if (items.length === 0) return null;
            return (
              <View key={group.id} style={styles.timelineSection}>
                <GroupHeader title={group.title} date={group.date} dotColor={group.dotColor} />
                {items.map((item) => (
                  <ActivityCard key={item.id} activity={item} />
                ))}
              </View>
            );
          })
        )}
        <View style={styles.scrollEndSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.retailBg || '#FAFAF8',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  scrollEndSpacer: {
    height: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0EFEA',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  headerBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F5F5F4',
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
    color: '#EA580C',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1C1917',
    marginTop: 2,
  },
  filterRow: {
    gap: 8,
    paddingVertical: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E7E5E4',
    marginRight: 6,
  },
  chipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#78716C',
  },
  chipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginVertical: 12,
    borderWidth: 1,
    borderColor: '#E7E5E4',
  },
  summaryTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryMonth: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1C1917',
  },
  summaryTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  summaryTagText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },
  summaryDivider: {
    height: 1,
    backgroundColor: '#F5F5F4',
    marginVertical: 12,
  },
  summaryColumns: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryCol: {
    alignItems: 'center',
    flex: 1,
  },
  summaryColSep: {
    width: 1,
    backgroundColor: '#F5F5F4',
  },
  summaryColLabel: {
    fontSize: 12,
    color: '#78716C',
    marginBottom: 4,
  },
  summaryColVal: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1C1917',
  },
  timelineSection: {
    marginTop: 16,
    gap: 12,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  groupDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  groupTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1C1917',
  },
  groupDate: {
    fontSize: 12,
    color: '#78716C',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E7E5E4',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  iconTile: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconTileTerracotta: {
    backgroundColor: '#FFF7ED',
  },
  iconTileBasil: {
    backgroundColor: '#ECFDF5',
  },
  iconTileTurmeric: {
    backgroundColor: '#FEF3C7',
  },
  cardTextCol: {
    flex: 1,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1C1917',
  },
  storeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  storeBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 3,
  },
  cardMeta: {
    fontSize: 11,
    color: '#78716C',
  },
  cardRight: {
    alignItems: 'flex-end',
  },
  amountText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1C1917',
  },
  savedText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#059669',
    marginTop: 2,
  },
  innerCard: {
    marginTop: 10,
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    padding: 10,
    gap: 6,
  },
  innerBought: {
    fontSize: 12,
    color: '#4B5563',
  },
  innerBoughtLabel: {
    fontWeight: '700',
    color: '#1C1917',
  },
  savingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  savingText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#059669',
  },
  plannedBadge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  plannedBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#059669',
  },
  mealInnerCard: {
    marginTop: 10,
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    padding: 10,
    gap: 6,
  },
  mealNote: {
    fontSize: 12,
    color: '#4B5563',
  },
  wasteText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#059669',
  },
  savingsPill: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  savingsPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#B45309',
  },
});