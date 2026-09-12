import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions,
  Platform,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import Colors from '../constants/colors';
import { savingsService } from '../services';
import { useAccount } from '../context/AccountContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_PADDING = 16;

const DEFAULT_TREND = [
  { month: 'Jan', amount: 1200 },
  { month: 'Feb', amount: 1800 },
  { month: 'Mar', amount: 1500 },
  { month: 'Apr', amount: 2200 },
  { month: 'May', amount: 2400 },
  { month: 'Jun', amount: 2100 },
];

const CHALLENGES = [
  {
    id: 1,
    label: 'Zero-Waste Chef',
    status: '1/3 meals',
    icon: 'leaf',
    iconColor: '#2E7D32',
    iconBg: '#E8F5E9',
    isDone: false,
  },
  {
    id: 2,
    label: 'Budget Master',
    status: 'Rs 1,200 saved',
    icon: 'piggy-bank',
    iconColor: '#D32F2F',
    iconBg: '#FFEBEE',
    isDone: true,
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatCurrency = (n) => (n || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');

// ─── Sub-components ──────────────────────────────────────────────────────────

const SavingsHeader = ({ onBack }) => (
  <View style={styles.header}>
    <TouchableOpacity onPress={onBack} style={styles.headerBtn} activeOpacity={0.7}>
      <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
    </TouchableOpacity>
    <Text style={styles.headerTitle}>Savings</Text>
    <TouchableOpacity style={styles.headerBtn} activeOpacity={0.7}>
      <Ionicons name="settings-outline" size={22} color={Colors.textPrimary} />
    </TouchableOpacity>
  </View>
);

const TotalSavingsCard = ({ total = 0, goal = 20000 }) => {
  const safeGoal = goal > 0 ? goal : 1;
  const pct = Math.min(100, Math.round((total / safeGoal) * 100));
  return (
    <View style={styles.heroCard}>
      <Text style={styles.heroLabel}>Total Saved</Text>
      <Text style={styles.heroAmount}>Rs {formatCurrency(total)}</Text>
      <View style={styles.progressRow}>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${pct}%` }]} />
        </View>
        <Text style={styles.progressPct}>{pct}%</Text>
      </View>
      <Text style={styles.goalLabel}>Goal: Rs {formatCurrency(goal)}</Text>
    </View>
  );
};

const StatCard = ({ value, label, icon, color, bgColor }) => (
  <View style={styles.statCard}>
    <View style={[styles.statIconBg, { backgroundColor: bgColor }]}>
      <Ionicons name={icon} size={20} color={color} />
    </View>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const BarChart = ({ data = [] }) => {
  const chartData = data && data.length > 0 ? data : DEFAULT_TREND;
  const maxAmount = Math.max(...chartData.map((d) => d.amount || 100), 100);
  return (
    <View style={styles.chartCard}>
      <View style={styles.chartContainer}>
        {chartData.map((item, index) => {
          const barHeight = Math.max(10, Math.round(((item.amount || 0) / maxAmount) * 100));
          const isMax = item.amount === maxAmount;
          return (
            <View key={index} style={styles.chartColumn}>
              <View style={styles.barTrack}>
                <View
                  style={[
                    styles.barFill,
                    {
                      height: `${barHeight}%`,
                      backgroundColor: isMax ? Colors.primary : Colors.primaryLight,
                    },
                  ]}
                />
              </View>
              <Text style={styles.barLabel}>{item.month || `M${index + 1}`}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
};

const SavingsLevelCard = ({ level }) => {
  const safeLevel = level || {
    current: 'Silver Saver',
    next: 'Gold Saver',
    progress: 0.5,
    icon: '🥈',
  };
  return (
    <View style={styles.levelCard}>
      <View style={styles.levelHeader}>
        <Text style={styles.levelEmoji}>{safeLevel.icon || '🥈'}</Text>
        <View style={styles.levelTextCol}>
          <Text style={styles.levelCurrent}>{safeLevel.current}</Text>
          <Text style={styles.levelNext}>to {safeLevel.next}</Text>
        </View>
        <View style={styles.levelBadge}>
          <Text style={styles.levelBadgeText}>{Math.round((safeLevel.progress || 0) * 100)}%</Text>
        </View>
      </View>
      <View style={styles.levelProgressTrack}>
        <View style={[styles.levelProgressFill, { width: `${(safeLevel.progress || 0) * 100}%` }]} />
      </View>
    </View>
  );
};

const RecentSavingsItem = ({ item, isLast }) => (
  <View>
    <View style={styles.recentRow}>
      <View style={[styles.recentIconBg, { backgroundColor: item.iconBg || '#E8F5E9' }]}>
        <Ionicons name={item.icon || 'leaf-outline'} size={18} color={item.iconColor || '#2E7D32'} />
      </View>
      <View style={styles.recentInfo}>
        <Text style={styles.recentLabel}>{item.label || item.description || 'Smart Savings'}</Text>
        <Text style={styles.recentDate}>{item.date || item.created_at || 'Recent'}</Text>
      </View>
      <Text style={styles.recentAmount}>+Rs {item.amount || 0}</Text>
    </View>
    {!isLast && <View style={styles.divider} />}
  </View>
);

// ─── Main Component ──────────────────────────────────────────────────────────

export default function SavingsDashboard({ onBack }) {
  const { budget, profile } = useAccount();
  const [stats, setStats] = useState({
    totalSaved: profile.moneySaved || 0,
    goal: budget.savingsGoal || 20000,
    thisMonth: 0,
    weeklyAvg: 0,
    foodWasteAvoided: profile.wasteAvoided || 0,
    mealsPlanned: 0,
  });
  const [trend, setTrend] = useState(DEFAULT_TREND);
  const [recentSavings, setRecentSavings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchSavingsData = useCallback(async () => {
    setLoading(true);
    try {
      const [summaryRes, trendRes] = await Promise.allSettled([
        savingsService.getSummary(),
        savingsService.getTrend(),
      ]);

      if (summaryRes.status === 'fulfilled' && summaryRes.value) {
        const s = summaryRes.value;
        setStats({
          totalSaved: s.total_saved ?? profile.moneySaved ?? 0,
          goal: s.savings_goal ?? budget.savingsGoal ?? 20000,
          thisMonth: s.this_month ?? s.monthly_saved ?? 0,
          weeklyAvg: s.weekly_avg ?? Math.round((s.this_month || 0) / 4),
          foodWasteAvoided: s.food_waste_avoided ?? profile.wasteAvoided ?? 0,
          mealsPlanned: s.meals_planned ?? 0,
        });
        if (Array.isArray(s.recent_savings)) {
          setRecentSavings(s.recent_savings);
        }
      }

      if (trendRes.status === 'fulfilled' && Array.isArray(trendRes.value)) {
        setTrend(trendRes.value);
      }
    } catch (err) {
      console.log('[SavingsDashboard] Note on savings fetch:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [budget.savingsGoal, profile.moneySaved, profile.wasteAvoided]);

  useEffect(() => {
    fetchSavingsData();
  }, [fetchSavingsData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchSavingsData();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
      <SavingsHeader onBack={onBack} />
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
        {loading && (
          <View style={{ paddingVertical: 12, alignItems: 'center' }}>
            <ActivityIndicator size="small" color={Colors.primary} />
          </View>
        )}

        <TotalSavingsCard
          total={stats.totalSaved}
          goal={stats.goal}
        />

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <StatCard
            value={`Rs ${formatCurrency(stats.thisMonth)}`}
            label="This Month"
            icon="calendar-outline"
            color="#2E7D32"
            bgColor="#E8F5E9"
          />
          <StatCard
            value={`Rs ${formatCurrency(stats.weeklyAvg)}`}
            label="Weekly Avg"
            icon="wallet-outline"
            color="#1565C0"
            bgColor="#E3F2FD"
          />
          <StatCard
            value={`${stats.foodWasteAvoided} kg`}
            label="Waste Saved"
            icon="leaf-outline"
            color="#E53935"
            bgColor="#FFEBEE"
          />
          <StatCard
            value={stats.mealsPlanned}
            label="Meals Planned"
            icon="restaurant-outline"
            color="#7C4A00"
            bgColor="#FFF8E1"
          />
        </View>

        {/* Savings Trend */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Savings Trend</Text>
          <BarChart data={trend} />
        </View>

        {/* Savings Level */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Savings Level</Text>
          <SavingsLevelCard
            level={{
              current: stats.totalSaved > 10000 ? 'Gold Saver' : 'Silver Saver',
              next: stats.totalSaved > 10000 ? 'Platinum Saver' : 'Gold Saver',
              progress: Math.min(1, stats.totalSaved / (stats.goal || 20000)),
              icon: stats.totalSaved > 10000 ? '🥇' : '🥈',
            }}
          />
        </View>

        {/* Recent Savings */}
        {recentSavings.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Savings</Text>
            </View>
            <View style={styles.recentCard}>
              {recentSavings.map((item, index) => (
                <RecentSavingsItem
                  key={item.id || index}
                  item={item}
                  isLast={index === recentSavings.length - 1}
                />
              ))}
            </View>
          </View>
        )}

        {/* Weekly Challenges */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Weekly Challenges</Text>
          <View style={styles.challengesCard}>
            {CHALLENGES.map((c, idx) => (
              <View key={c.id}>
                <View style={styles.challengeRow}>
                  <View style={[styles.challengeIconBg, { backgroundColor: c.iconBg }]}>
                    {c.icon === 'leaf' ? (
                      <Ionicons name="leaf" size={16} color={c.iconColor} />
                    ) : (
                      <FontAwesome5 name="piggy-bank" size={14} color={c.iconColor} />
                    )}
                  </View>
                  <Text style={styles.challengeLabel}>{c.label}</Text>
                  <Text
                    style={[
                      styles.challengeStatus,
                      c.isDone && styles.challengeStatusDone,
                    ]}
                  >
                    {c.status}
                  </Text>
                </View>
                {idx < CHALLENGES.length - 1 && <View style={styles.divider} />}
              </View>
            ))}
            <View style={styles.divider} />
            <View style={styles.rewardRow}>
              <Text style={styles.rewardLabel}>REWARD POOL</Text>
              <Text style={styles.rewardPoints}>250 Pts</Text>
            </View>
          </View>
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 0,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: CARD_PADDING,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 12 : 16,
    paddingBottom: 12,
    backgroundColor: Colors.background,
  },
  headerBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 3,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    letterSpacing: -0.3,
  },

  // Hero Card
  heroCard: {
    backgroundColor: Colors.primary,
    marginHorizontal: CARD_PADDING,
    marginTop: 16,
    marginBottom: 16,
    borderRadius: 16,
    padding: 20,
  },
  heroLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 4,
  },
  heroAmount: {
    fontSize: 36,
    fontWeight: '800',
    color: Colors.textWhite,
    letterSpacing: -1,
    marginBottom: 16,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  progressTrack: {
    flex: 1,
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.textWhite,
    borderRadius: 4,
  },
  progressPct: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textWhite,
    minWidth: 35,
  },
  goalLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 8,
  },

  // Stats Grid
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingHorizontal: CARD_PADDING,
    marginBottom: 4,
  },
  statCard: {
    width: (SCREEN_WIDTH - CARD_PADDING * 2 - 12) / 2,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 14,
    shadowColor: 'rgba(0,0,0,0.06)',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 3,
  },
  statIconBg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.textSecondary,
  },

  // Section
  section: {
    marginTop: 20,
    paddingHorizontal: CARD_PADDING,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    letterSpacing: -0.3,
  },
  viewAll: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: '600',
  },

  // Bar Chart
  chartCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    marginTop: 12,
    shadowColor: 'rgba(0,0,0,0.06)',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 3,
  },
  chartContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingTop: 8,
  },
  chartColumn: {
    alignItems: 'center',
    flex: 1,
  },
  barTrack: {
    height: 120,
    width: 28,
    justifyContent: 'flex-end',
  },
  barFill: {
    width: '100%',
    borderRadius: 6,
  },
  barLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: Colors.textSecondary,
    marginTop: 6,
  },

  // Savings Level
  levelCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    marginTop: 12,
    shadowColor: 'rgba(0,0,0,0.06)',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 3,
  },
  levelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    gap: 12,
  },
  levelEmoji: {
    fontSize: 32,
  },
  levelTextCol: {
    flex: 1,
  },
  levelCurrent: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  levelNext: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  levelBadge: {
    backgroundColor: Colors.milestoneCard,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 50,
  },
  levelBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primary,
  },
  levelProgressTrack: {
    height: 8,
    backgroundColor: Colors.pillInactive,
    borderRadius: 4,
    overflow: 'hidden',
  },
  levelProgressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 4,
  },

  // Recent Savings
  recentCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 4,
    marginTop: 12,
    shadowColor: 'rgba(0,0,0,0.06)',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 3,
  },
  recentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    gap: 12,
  },
  recentIconBg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recentInfo: {
    flex: 1,
  },
  recentLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textPrimary,
  },
  recentDate: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  recentAmount: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.primary,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginHorizontal: 12,
  },

  // Weekly Challenges
  challengesCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 4,
    marginTop: 12,
    shadowColor: 'rgba(0,0,0,0.06)',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 3,
  },
  challengeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    gap: 12,
  },
  challengeIconBg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  challengeLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textPrimary,
  },
  challengeStatus: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  challengeStatusDone: {
    color: Colors.challengeDone,
  },
  rewardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 12,
  },
  rewardLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  rewardPoints: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.rewardGold,
  },
});
