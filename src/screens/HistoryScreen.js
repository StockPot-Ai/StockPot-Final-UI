import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Platform,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import Colors from '../constants/colors';
import { activityService } from '../services';

const FILTERS = [
  { id: 'all', label: 'All Activity' },
  { id: 'cook', label: 'Cooked Meals 🍳' },
  { id: 'savings', label: 'Savings & Deals 💰' },
  { id: 'purchase', label: 'Purchases 🛒' },
];

const STORE_BADGES = {
  store_keells: { bg: '#ECFDF5', text: '#1F4A2B', border: '#A7F3D0', name: 'Keells' },
  store_cargills: { bg: '#FFF7ED', text: '#C2410C', border: '#FED7AA', name: 'Cargills' },
  store_glomark: { bg: '#FFFBEB', text: '#D97706', border: '#FDE68A', name: 'GLOMARK' },
  store_abc_grocery: { bg: '#EFF6FF', text: '#1D4ED8', border: '#BFDBFE', name: 'ABC Grocery' },
};

const formatCurrency = (n) => (n || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');

const computeStats = (items) => {
  const activities = items.length;
  const totalSpent = items
    .filter((a) => a.kind === 'purchase' || a.type === 'purchase')
    .reduce((sum, a) => sum + (a.amount || 0), 0);
  const totalSaved = items
    .filter((a) => a.kind === 'savings' || a.type === 'savings' || a.saved)
    .reduce((sum, a) => sum + (a.saved || a.amount || 0), 0);
  const totalXp = items.reduce((sum, a) => sum + (a.xp || 0), 0);

  return { activities, totalSpent, totalSaved, totalXp };
};

// ─── Sub-components ──────────────────────────────────────────────────────────

const HistoryHeader = ({ onBack }) => (
  <View style={styles.header}>
    <TouchableOpacity onPress={onBack} style={styles.headerBtn} activeOpacity={0.7}>
      <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
    </TouchableOpacity>
    <View style={styles.headerTitleCol}>
      <Text style={styles.headerEyebrow}>StockPot AI</Text>
      <Text style={styles.headerTitle}>Activity & Logs</Text>
    </View>
    <TouchableOpacity
      onPress={() => Alert.alert('Activity Logs', 'Showing your latest cooking actions, grocery savings, and community contributions.')}
      style={styles.headerBtn}
      activeOpacity={0.7}
    >
      <Ionicons name="calendar-outline" size={20} color={Colors.textPrimary} />
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
          <Ionicons name="sparkles" size={16} color={Colors.primary} />
        </View>
        <Text style={styles.summaryLabel}>Recent Milestone Summary</Text>
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
        <Text style={[styles.summaryValue, styles.summaryValueSaved]}>
          Rs. {formatCurrency(stats.totalSaved)}
        </Text>
        <Text style={[styles.summaryCaption, styles.summaryCaptionSaved]}>Smart Saved</Text>
      </View>
      <View style={styles.summaryCol}>
        <Text style={[styles.summaryValue, styles.summaryValueXp]}>+{stats.totalXp} XP</Text>
        <Text style={[styles.summaryCaption, styles.summaryCaptionXp]}>Total Earned</Text>
      </View>
    </View>
  </View>
);

const ActivityCard = ({ activity }) => {
  const type = activity.type || activity.kind || 'cook';

  let iconName = 'restaurant';
  let iconBg = '#E8F8F0';
  let iconColor = '#007A3D';
  let typeLabel = 'Cooked Dish';

  if (type === 'savings') {
    iconName = 'wallet';
    iconBg = '#ECFDF5';
    iconColor = '#059669';
    typeLabel = 'Savings';
  } else if (type === 'purchase') {
    iconName = 'cart';
    iconBg = '#EFF6FF';
    iconColor = '#2563EB';
    typeLabel = 'Grocery Trip';
  } else if (type === 'create') {
    iconName = 'add-circle';
    iconBg = '#FEF3C7';
    iconColor = '#D97706';
    typeLabel = 'Recipe Shared';
  } else if (type === 'rate') {
    iconName = 'star';
    iconBg = '#FFFBEB';
    iconColor = '#F59E0B';
    typeLabel = 'Review';
  } else if (type === 'badge') {
    iconName = 'medal';
    iconBg = '#F3E8FF';
    iconColor = '#7C3AED';
    typeLabel = 'Badge Unlocked';
  }

  return (
    <View style={styles.card}>
      <View style={styles.cardTopRow}>
        <View style={styles.cardLeft}>
          <View style={[styles.iconTile, { backgroundColor: iconBg }]}>
            {type === 'badge' ? (
              <FontAwesome5 name="medal" size={17} color={iconColor} />
            ) : type === 'rate' ? (
              <Ionicons name="star" size={18} color={iconColor} />
            ) : type === 'savings' ? (
              <Ionicons name="wallet-outline" size={18} color={iconColor} />
            ) : type === 'create' ? (
              <Ionicons name="restaurant-outline" size={18} color={iconColor} />
            ) : (
              <Ionicons name={iconName} size={18} color={iconColor} />
            )}
          </View>
          <View style={styles.cardTextCol}>
            <View style={styles.badgeRow}>
              <Text style={styles.cardTitle}>{activity.title || 'StockPot Activity'}</Text>
            </View>
            <Text style={styles.cardTime}>{activity.timestamp || activity.time || 'Recently'}</Text>
          </View>
        </View>
        <View style={styles.xpBadge}>
          <Text style={styles.xpBadgeText}>+{activity.xp || 0} XP</Text>
        </View>
      </View>

      {activity.details ? (
        <View style={styles.detailsBox}>
          <Text style={styles.detailsText}>{activity.details}</Text>
        </View>
      ) : null}
    </View>
  );
};

// ─── Main Component ──────────────────────────────────────────────────────────

export default function HistoryScreen({ onBack }) {
  const [activeFilter, setActiveFilter] = useState('all');
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchActivities = useCallback(async () => {
    setLoading(true);
    try {
      const data = await activityService.getActivity(activeFilter);
      if (Array.isArray(data)) {
        setActivities(data);
      } else if (data?.activities && Array.isArray(data.activities)) {
        setActivities(data.activities);
      } else {
        setActivities([]);
      }
    } catch (err) {
      console.log('[HistoryScreen] Activity fetch note:', err.message);
      setActivities([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeFilter]);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchActivities();
  };

  const filtered = activities.filter((a) => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'cook') return a.type === 'cook' || a.kind === 'mealplan';
    if (activeFilter === 'savings') return a.type === 'savings' || a.kind === 'savings';
    if (activeFilter === 'purchase') return a.type === 'purchase' || a.kind === 'purchase';
    return true;
  });

  const stats = computeStats(filtered);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <HistoryHeader onBack={onBack} />
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[Colors.primary]}
            tintColor={Colors.primary}
          />
        }
      >
        <FilterChips active={activeFilter} onChange={setActiveFilter} />
        <SummaryCard stats={stats} monthLabel="Live Stats" />

        {loading && (
          <View style={{ paddingVertical: 24, alignItems: 'center' }}>
            <ActivityIndicator size="small" color={Colors.primary} />
            <Text style={{ fontSize: 13, color: Colors.textSecondary, marginTop: 6 }}>
              Loading activity history...
            </Text>
          </View>
        )}

        {filtered.length === 0 && !loading && (
          <View style={styles.emptyCard}>
            <Ionicons name="sparkles-outline" size={36} color="#9CA3AF" />
            <Text style={styles.emptyTitle}>No Activity Recorded Yet</Text>
            <Text style={styles.emptySubtitle}>
              Cook a recipe, rate a community dish, or run a smart shopping comparison to earn XP and record your progress!
            </Text>
          </View>
        )}

        {filtered.length > 0 && (
          <View style={styles.timelineSection}>
            <View style={styles.groupHeader}>
              <View style={styles.groupHeaderLeft}>
                <View style={styles.groupDot} />
                <Text style={styles.groupTitle}>Activity Feed</Text>
              </View>
              <Text style={styles.groupDate}>{filtered.length} Actions</Text>
            </View>

            {filtered.map((item, idx) => (
              <ActivityCard key={item.id || idx} activity={item} />
            ))}
          </View>
        )}

        <View style={styles.scrollEndSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F9FAFB',
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
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 8 : 12,
    paddingBottom: 12,
  },
  headerBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F3F4F6',
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
    color: Colors.primary,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.textPrimary,
  },

  // Filter chips
  chipsRow: {
    gap: 8,
    paddingBottom: 4,
  },
  chip: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  chipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  chipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  // Summary card
  summaryCard: {
    marginTop: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    padding: 16,
    shadowColor: 'rgba(0,0,0,0.03)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 1,
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
    backgroundColor: '#E8F8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: Colors.textSecondary,
  },
  monthPill: {
    backgroundColor: '#E8F8F0',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  monthPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.primary,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginBottom: 12,
  },
  summaryGrid: {
    flexDirection: 'row',
  },
  summaryCol: {
    flex: 1,
  },
  summaryValue: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  summaryValueSaved: {
    color: '#007A3D',
  },
  summaryValueXp: {
    color: '#D97706',
  },
  summaryCaption: {
    marginTop: 2,
    fontSize: 10.5,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  summaryCaptionSaved: {
    color: '#007A3D',
    fontWeight: '600',
  },
  summaryCaptionXp: {
    color: '#D97706',
    fontWeight: '600',
  },

  // Timeline group
  timelineSection: {
    marginTop: 18,
    gap: 10,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    marginBottom: 2,
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
    backgroundColor: Colors.primary,
  },
  groupTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  groupDate: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
  },

  // Activity card
  card: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    padding: 14,
    shadowColor: 'rgba(0,0,0,0.03)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 1,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
  },
  cardTextCol: {
    flex: 1,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  cardTime: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  iconTile: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  xpBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  xpBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#D97706',
  },
  detailsBox: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  detailsText: {
    fontSize: 11.5,
    color: Colors.textSecondary,
    lineHeight: 16,
  },

  // Empty state
  emptyCard: {
    padding: 32,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginTop: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: 10,
  },
  emptySubtitle: {
    fontSize: 12.5,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
  },
});