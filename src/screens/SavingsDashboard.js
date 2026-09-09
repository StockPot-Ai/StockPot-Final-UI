import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import Colors from '../constants/colors';
import { savingsService, activityService } from '../services';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_PADDING = 16;

const INITIAL_SAVINGS_STATS = {
  totalSaved: 1995,
  goal: 20000,
  thisMonth: 1995,
  weeklyAvg: 498.75,
  foodWasteAvoided: 3.2,
  mealsPlanned: 15,
};

const INITIAL_MONTHLY_TREND = [
  { month: 'Jun', amount: 1100 },
  { month: 'Jul', amount: 1400 },
  { month: 'Aug', amount: 1500 },
  { month: 'Sep', amount: 1995 },
];

const SAVINGS_LEVEL = {
  current: 'Silver Saver',
  next: 'Gold Saver',
  progress: 0.62,
  icon: '\u{1F949}',
};

const INITIAL_RECENT_SAVINGS = [
  { id: '1', label: 'Meal Planning', amount: 450, icon: 'restaurant-outline', iconColor: '#2E7D32', iconBg: '#E8F5E9', date: 'Today' },
  { id: '2', label: 'Smart Shopping', amount: 320, icon: 'cart-outline', iconColor: '#1565C0', iconBg: '#E3F2FD', date: 'Yesterday' },
  { id: '3', label: 'Food Saved', amount: 280, icon: 'leaf-outline', iconColor: '#E53935', iconBg: '#FFEBEE', date: '2 days ago' },
  { id: '4', label: 'Bulk Purchase', amount: 550, icon: 'basket-outline', iconColor: '#7C4A00', iconBg: '#FFF8E1', date: '3 days ago' },
];

const CHALLENGES = [
  { id: '1', icon: 'leaf', iconColor: '#2E7D32', iconBg: '#E8F5E9', label: 'Meatless Monday', status: '0/1', isDone: false },
  { id: '2', icon: 'piggy-bank', iconColor: '#E53935', iconBg: '#FFEBEE', label: 'Under Budget Week', status: 'Done', isDone: true },
];

const formatCurrency = (n) => {
  const val = Math.round(Number(n) || 0);
  return val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

const SavingsHeader = ({ onBack }) => (
  <View style={styles.header}>
    <TouchableOpacity onPress={onBack} style={styles.headerBtn} activeOpacity={0.7}>
      <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
    </TouchableOpacity>
    <Text style={styles.headerTitle}>Savings Dashboard</Text>
    <TouchableOpacity style={styles.headerBtn} activeOpacity={0.7}>
      <Ionicons name="settings-outline" size={22} color={Colors.textPrimary} />
    </TouchableOpacity>
  </View>
);

const TotalSavingsCard = ({ total, goal }) => {
  const pct = Math.min(100, Math.round((total / (goal || 1)) * 100));
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
  const amounts = data.map((d) => d.amount || 0);
  const maxAmount = Math.max(...amounts, 1);
  return (
    <View style={styles.chartCard}>
      <View style={styles.chartContainer}>
        {data.map((item, index) => {
          const barHeight = Math.max(12, Math.round(((item.amount || 0) / maxAmount) * 100));
          const isMax = item.amount === maxAmount;
          return (
            <View key={index} style={styles.chartColumn}>
              <View style={styles.barTrack}>
                <View
                  style={[
                    styles.barFill,
                    {
                      height: barHeight,
                      backgroundColor: isMax ? Colors.primary : '#E2E8F0',
                    },
                  ]}
                />
              </View>
              <Text style={[styles.monthLabel, isMax && styles.monthLabelActive]}>
                {item.month}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
};

const SavingsLevelCard = ({ level }) => (
  <View style={styles.levelCard}>
    <View style={styles.levelHeader}>
      <View style={styles.levelLeft}>
        <Text style={styles.levelIcon}>{level.icon}</Text>
        <View>
          <Text style={styles.levelTitle}>{level.current}</Text>
          <Text style={styles.levelSubtitle}>Next: {level.next}</Text>
        </View>
      </View>
      <Text style={styles.levelPct}>{Math.round(level.progress * 100)}%</Text>
    </View>
    <View style={styles.levelTrack}>
      <View style={[styles.levelFill, { width: `${level.progress * 100}%` }]} />
    </View>
  </View>
);

const RecentSavingsItem = ({ item, isLast }) => (
  <View style={[styles.recentItem, !isLast && styles.recentItemBorder]}>
    <View style={[styles.recentIconBg, { backgroundColor: item.iconBg || '#E8F5E9' }]}>
      <Ionicons name={item.icon || 'wallet-outline'} size={18} color={item.iconColor || '#2E7D32'} />
    </View>
    <View style={styles.recentInfo}>
      <Text style={styles.recentLabel}>{item.label || item.title}</Text>
      <Text style={styles.recentDate}>{item.date || item.created_at?.split('T')[0] || 'Recent'}</Text>
    </View>
    <Text style={styles.recentAmount}>+Rs {formatCurrency(item.amount || item.saved)}</Text>
  </View>
);

export default function SavingsDashboard({ onBack }) {
  const [stats, setStats] = useState(INITIAL_SAVINGS_STATS);
  const [trend, setTrend] = useState(INITIAL_MONTHLY_TREND);
  const [recentSavings, setRecentSavings] = useState(INITIAL_RECENT_SAVINGS);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    setLoading(true);

    Promise.all([
      savingsService.getSummary().catch(() => null),
      savingsService.getTrend().catch(() => null),
      activityService.getActivity('savings').catch(() => []),
    ])
      .then(([summaryData, trendData, activityData]) => {
        if (!mounted) return;

        if (summaryData) {
          setStats({
            totalSaved: summaryData.total_saved ?? 1995,
            goal: summaryData.goal ?? 20000,
            thisMonth: summaryData.this_month ?? 1995,
            weeklyAvg: summaryData.weekly_average ?? 498.75,
            foodWasteAvoided: 3.2,
            mealsPlanned: summaryData.meals_planned ?? 15,
          });
        }

        if (trendData?.months && Array.isArray(trendData.months)) {
          setTrend(trendData.months);
        }

        if (Array.isArray(activityData) && activityData.length > 0) {
          const mapped = activityData.slice(0, 4).map((a) => ({
            id: a.id,
            label: a.title || 'Smart Savings',
            amount: a.amount || a.saved || 250,
            icon: 'wallet-outline',
            iconColor: '#2E7D32',
            iconBg: '#E8F5E9',
            date: a.created_at ? a.created_at.split('T')[0] : 'Recent',
          }));
          setRecentSavings(mapped);
        }
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <SavingsHeader onBack={onBack} />

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <TotalSavingsCard total={stats.totalSaved} goal={stats.goal} />

        {/* 2x2 Stats Grid */}
        <View style={styles.grid}>
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
            icon="trending-up-outline"
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
          <SavingsLevelCard level={SAVINGS_LEVEL} />
        </View>

        {/* Recent Savings */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Savings</Text>
            <TouchableOpacity activeOpacity={0.7}>
              <Text style={styles.viewAll}>View All</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.recentCard}>
            {recentSavings.map((item, index) => (
              <RecentSavingsItem
                key={item.id}
                item={item}
                isLast={index === recentSavings.length - 1}
              />
            ))}
          </View>
        </View>

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
                {idx < CHALLENGES.length - 1 && <View style={styles.challengeDivider} />}
              </View>
            ))}
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FAFAF8',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: CARD_PADDING,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0EFEA',
  },
  headerBtn: {
    padding: 6,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: CARD_PADDING,
    paddingBottom: 40,
  },
  heroCard: {
    backgroundColor: Colors.primary,
    borderRadius: 20,
    padding: 22,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  heroLabel: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  heroAmount: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 6,
    marginBottom: 16,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  progressTrack: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
  },
  progressPct: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  goalLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 8,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 16,
  },
  statCard: {
    width: (SCREEN_WIDTH - CARD_PADDING * 2 - 12) / 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#ECEAE4',
  },
  statIconBg: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  statValue: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  section: {
    marginTop: 22,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  viewAll: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primary,
  },
  chartCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#ECEAE4',
  },
  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 120,
  },
  chartColumn: {
    alignItems: 'center',
    flex: 1,
  },
  barTrack: {
    width: 24,
    height: 90,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  barFill: {
    width: '100%',
    borderRadius: 6,
  },
  monthLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 8,
    fontWeight: '500',
  },
  monthLabelActive: {
    color: Colors.primary,
    fontWeight: '700',
  },
  levelCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#ECEAE4',
  },
  levelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  levelLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  levelIcon: {
    fontSize: 24,
  },
  levelTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  levelSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  levelPct: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primary,
  },
  levelTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#F1F5F9',
    overflow: 'hidden',
  },
  levelFill: {
    height: '100%',
    backgroundColor: '#F59E0B',
    borderRadius: 3,
  },
  recentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#ECEAE4',
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
  },
  recentItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F4',
  },
  recentIconBg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  recentInfo: {
    flex: 1,
  },
  recentLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  recentDate: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  recentAmount: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2E7D32',
  },
  challengesCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 6,
    borderWidth: 1,
    borderColor: '#ECEAE4',
  },
  challengeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 10,
    gap: 12,
  },
  challengeIconBg: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  challengeLabel: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    color: Colors.textPrimary,
  },
  challengeStatus: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  challengeStatusDone: {
    color: Colors.challengeDone,
  },
  challengeDivider: {
    height: 1,
    backgroundColor: '#F5F5F4',
    marginHorizontal: 10,
  },
});
