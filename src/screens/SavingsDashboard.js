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
import { Ionicons, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import Colors from '../constants/colors';
import { savingsService, gamificationService } from '../services';
import { useAccount } from '../context/AccountContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_PADDING = 16;

const DEFAULT_TREND = [
  { month: 'Jan', amount: 1200 },
  { month: 'Feb', amount: 1800 },
  { month: 'Mar', amount: 1500 },
  { month: 'Apr', amount: 2200 },
  { month: 'May', amount: 2400 },
  { month: 'Jun', amount: 2850 },
];

const CHALLENGES = [
  {
    id: 1,
    label: 'Zero-Waste Chef',
    status: '1/3 meals cooked',
    icon: 'leaf',
    iconColor: '#2E7D32',
    iconBg: '#E8F5E9',
    isDone: false,
    reward: '+50 XP',
  },
  {
    id: 2,
    label: 'Smart Split-Basket',
    status: 'Rs 1,250 saved',
    icon: 'shopping-cart',
    iconColor: '#007A3D',
    iconBg: '#E8F8F0',
    isDone: true,
    reward: '+80 XP',
  },
  {
    id: 3,
    label: 'Community Contributor',
    status: '1 recipe shared',
    icon: 'star',
    iconColor: '#D97706',
    iconBg: '#FEF3C7',
    isDone: true,
    reward: '+50 XP',
  },
];

const formatCurrency = (n) => (n || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');

// ─── Sub-components ──────────────────────────────────────────────────────────

const SavingsHeader = ({ onBack, activeTab, setActiveTab }) => (
  <View style={styles.header}>
    <View style={styles.headerTop}>
      <TouchableOpacity onPress={onBack} style={styles.headerBtn} activeOpacity={0.7}>
        <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
      </TouchableOpacity>
      <View style={{ alignItems: 'center' }}>
        <Text style={styles.headerEyebrow}>StockPot AI</Text>
        <Text style={styles.headerTitle}>Savings & Gamification</Text>
      </View>
      <View style={styles.headerBtnPlaceholder} />
    </View>

    {/* Tab Selector */}
    <View style={styles.tabContainer}>
      <TouchableOpacity
        style={[styles.tabButton, activeTab === 'financial' && styles.tabButtonActive]}
        onPress={() => setActiveTab('financial')}
        activeOpacity={0.8}
      >
        <Ionicons
          name="wallet-outline"
          size={16}
          color={activeTab === 'financial' ? '#FFFFFF' : Colors.textSecondary}
        />
        <Text style={[styles.tabText, activeTab === 'financial' && styles.tabTextActive]}>
          Financial Analytics
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.tabButton, activeTab === 'gamification' && styles.tabButtonActive]}
        onPress={() => setActiveTab('gamification')}
        activeOpacity={0.8}
      >
        <FontAwesome5
          name="trophy"
          size={14}
          color={activeTab === 'gamification' ? '#FFFFFF' : Colors.textSecondary}
        />
        <Text style={[styles.tabText, activeTab === 'gamification' && styles.tabTextActive]}>
          Level & Badges
        </Text>
      </TouchableOpacity>
    </View>
  </View>
);

const TotalSavingsCard = ({ total = 0, goal = 20000 }) => {
  const safeGoal = goal > 0 ? goal : 1;
  const pct = Math.min(100, Math.round((total / safeGoal) * 100));
  return (
    <View style={styles.heroCard}>
      <View style={styles.heroTopRow}>
        <Text style={styles.heroLabel}>Total Smart Savings</Text>
        <View style={styles.heroTag}>
          <Ionicons name="trending-up" size={13} color="#FFFFFF" />
          <Text style={styles.heroTagText}>+24% vs Last Month</Text>
        </View>
      </View>
      <Text style={styles.heroAmount}>Rs. {formatCurrency(total)}</Text>
      <View style={styles.progressRow}>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${pct}%` }]} />
        </View>
        <Text style={styles.progressPct}>{pct}%</Text>
      </View>
      <View style={styles.heroFooter}>
        <Text style={styles.goalLabel}>Target Goal: Rs. {formatCurrency(goal)}</Text>
        <Text style={styles.goalRemaining}>
          Rs. {formatCurrency(Math.max(0, goal - total))} to reach goal
        </Text>
      </View>
    </View>
  );
};

const BudgetTrackerCard = ({ spent = 3200, budget = 10000 }) => {
  const pct = Math.min(100, Math.round((spent / budget) * 100));
  const remaining = Math.max(0, budget - spent);
  return (
    <View style={styles.budgetCard}>
      <View style={styles.budgetHeader}>
        <View>
          <Text style={styles.budgetTitle}>Weekly Grocery Budget</Text>
          <Text style={styles.budgetSubtitle}>Limit: Rs. {formatCurrency(budget)}</Text>
        </View>
        <View style={styles.budgetStatusPill}>
          <Ionicons name="checkmark-circle" size={14} color="#007A3D" />
          <Text style={styles.budgetStatusText}>Under Budget</Text>
        </View>
      </View>

      <View style={styles.budgetAmountRow}>
        <View>
          <Text style={styles.budgetLabel}>Spent This Week</Text>
          <Text style={styles.budgetSpend}>Rs. {formatCurrency(spent)}</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={styles.budgetLabel}>Remaining</Text>
          <Text style={styles.budgetRemaining}>Rs. {formatCurrency(remaining)}</Text>
        </View>
      </View>

      <View style={styles.budgetTrack}>
        <View style={[styles.budgetFill, { width: `${pct}%` }]} />
      </View>
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
          const barHeight = Math.max(12, Math.round(((item.amount || 0) / maxAmount) * 100));
          const isMax = item.amount === maxAmount;
          return (
            <View key={index} style={styles.chartColumn}>
              <Text style={styles.barValueText}>Rs {Math.round((item.amount || 0) / 1000)}k</Text>
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

// ─── Gamification Cards ──────────────────────────────────────────────────────

const GamificationLevelHero = ({ gamificationData }) => {
  const { xp, currentLevel, nextLevel, progressPct, streakDays } = gamificationData;
  return (
    <View style={styles.gamificationHero}>
      <View style={styles.gamHeroTop}>
        <View style={styles.levelIconCircle}>
          <FontAwesome5 name={currentLevel.icon || 'crown'} size={24} color="#D97706" />
        </View>
        <View style={{ flex: 1 }}>
          <View style={styles.levelNameRow}>
            <Text style={styles.gamLevelTitle}>Level {currentLevel.level}: {currentLevel.name}</Text>
            <View style={styles.streakBadge}>
              <Ionicons name="flame" size={14} color="#EA580C" />
              <Text style={styles.streakText}>{streakDays}d Streak</Text>
            </View>
          </View>
          <Text style={styles.gamXpCount}>{xp} XP Earned</Text>
        </View>
      </View>

      <View style={styles.gamProgressContainer}>
        <View style={styles.gamProgressHeader}>
          <Text style={styles.gamProgressLabel}>Progress to {nextLevel.name}</Text>
          <Text style={styles.gamProgressValue}>{xp} / {nextLevel.minXp || currentLevel.maxXp} XP</Text>
        </View>
        <View style={styles.gamProgressTrack}>
          <View style={[styles.gamProgressFill, { width: `${progressPct}%` }]} />
        </View>
      </View>
    </View>
  );
};

const BadgeGridItem = ({ badge }) => (
  <View style={[styles.badgeItemCard, !badge.unlocked && styles.badgeItemLocked]}>
    <View style={[styles.badgeIconCircle, badge.unlocked ? styles.badgeIconUnlocked : styles.badgeIconLockedBg]}>
      <FontAwesome5
        name={badge.icon || 'medal'}
        size={20}
        color={badge.unlocked ? '#D97706' : '#9CA3AF'}
      />
    </View>
    <Text style={[styles.badgeItemName, !badge.unlocked && styles.badgeTextMuted]} numberOfLines={1}>
      {badge.name}
    </Text>
    <Text style={styles.badgeItemDesc} numberOfLines={2}>
      {badge.description}
    </Text>
    <View style={[styles.badgeXpChip, badge.unlocked ? styles.badgeXpUnlocked : styles.badgeXpLocked]}>
      <Text style={[styles.badgeXpText, badge.unlocked ? styles.badgeXpTextUnlocked : styles.badgeXpTextLocked]}>
        {badge.unlocked ? '✓ Unlocked' : `+${badge.xpBonus} XP`}
      </Text>
    </View>
  </View>
);

const ActivityLogItem = ({ item, isLast }) => (
  <View>
    <View style={styles.activityRow}>
      <View style={styles.activityIconCircle}>
        <Ionicons
          name={
            item.type === 'cook'
              ? 'restaurant'
              : item.type === 'savings'
              ? 'wallet'
              : item.type === 'create'
              ? 'add-circle'
              : 'sparkles'
          }
          size={16}
          color={Colors.primary}
        />
      </View>
      <View style={styles.activityTextCol}>
        <Text style={styles.activityTitle}>{item.title}</Text>
        <Text style={styles.activityDetails}>{item.details || item.timestamp}</Text>
      </View>
      <View style={styles.activityXpBadge}>
        <Text style={styles.activityXpText}>+{item.xp || 15} XP</Text>
      </View>
    </View>
    {!isLast && <View style={styles.divider} />}
  </View>
);

const ContributorLeaderboardItem = ({ item, rank }) => (
  <View style={styles.contributorRow}>
    <Text style={styles.rankNum}>#{rank}</Text>
    <View style={styles.contribAvatar}>
      <Text style={styles.contribAvatarText}>{item.name?.charAt(0) || 'C'}</Text>
    </View>
    <View style={{ flex: 1 }}>
      <Text style={styles.contribName}>{item.name}</Text>
      <Text style={styles.contribTier}>{item.tier} • {item.recipesCount} recipes</Text>
    </View>
    <View style={styles.contribRating}>
      <Ionicons name="star" size={13} color="#F59E0B" />
      <Text style={styles.contribRatingText}>{item.ratingAvg || '4.9'}</Text>
    </View>
  </View>
);

// ─── Main Component ──────────────────────────────────────────────────────────

export default function SavingsDashboard({ onBack }) {
  const { budget, profile } = useAccount();
  const [activeTab, setActiveTab] = useState('financial');
  const [stats, setStats] = useState({
    totalSaved: profile.moneySaved || 3450,
    goal: budget.savingsGoal || 20000,
    thisMonth: 3450,
    weeklyAvg: 850,
    foodWasteAvoided: profile.wasteAvoided || 4.2,
    mealsPlanned: 18,
    avgTripSaving: 420,
    weeklySpend: 3850,
    weeklyBudget: budget.weeklyBudget || 10000,
  });
  const [trend, setTrend] = useState(DEFAULT_TREND);
  const [gamificationData, setGamificationData] = useState({
    xp: 450,
    currentLevel: { level: 2, name: 'Home Cook', minXp: 200, maxXp: 500, icon: 'utensils' },
    nextLevel: { level: 3, name: 'Kitchen Pro', minXp: 500, maxXp: 1000, icon: 'award' },
    progressPct: 83,
    streakDays: 5,
    badges: [],
  });
  const [activityLogs, setActivityLogs] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      const [savingsRes, gamRes, logsRes, contribRes] = await Promise.allSettled([
        savingsService.getSummary(),
        gamificationService.getProfile(),
        gamificationService.getActivityLogs(),
        gamificationService.getLeaderboard(),
      ]);

      if (savingsRes.status === 'fulfilled' && savingsRes.value) {
        const s = savingsRes.value;
        setStats((prev) => ({
          ...prev,
          totalSaved: s.total_saved ?? prev.totalSaved,
          thisMonth: s.this_month ?? prev.thisMonth,
          weeklyAvg: s.weekly_saved ?? prev.weeklyAvg,
          avgTripSaving: s.avg_trip_saving ?? prev.avgTripSaving,
          mealsPlanned: s.meals_planned ?? prev.mealsPlanned,
        }));
      }

      if (gamRes.status === 'fulfilled' && gamRes.value) {
        setGamificationData(gamRes.value);
      }

      if (logsRes.status === 'fulfilled' && Array.isArray(logsRes.value)) {
        setActivityLogs(logsRes.value);
      }

      if (contribRes.status === 'fulfilled' && Array.isArray(contribRes.value)) {
        setLeaderboard(contribRes.value);
      }
    } catch (err) {
      console.log('[SavingsDashboard] Data load note:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
      <SavingsHeader onBack={onBack} activeTab={activeTab} setActiveTab={setActiveTab} />

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

        {/* ─── FINANCIAL ANALYTICS TAB ─── */}
        {activeTab === 'financial' && (
          <View>
            <TotalSavingsCard total={stats.totalSaved} goal={stats.goal} />

            <View style={styles.section}>
              <BudgetTrackerCard spent={stats.weeklySpend} budget={stats.weeklyBudget} />
            </View>

            {/* Stats Grid */}
            <View style={styles.statsGrid}>
              <StatCard
                value={`Rs ${formatCurrency(stats.thisMonth)}`}
                label="This Month"
                icon="calendar-outline"
                color="#007A3D"
                bgColor="#E8F8F0"
              />
              <StatCard
                value={`Rs ${formatCurrency(stats.avgTripSaving)}`}
                label="Avg Trip Savings"
                icon="cart-outline"
                color="#1565C0"
                bgColor="#E3F2FD"
              />
              <StatCard
                value={`${stats.foodWasteAvoided} kg`}
                label="Waste Avoided"
                icon="leaf-outline"
                color="#E53935"
                bgColor="#FFEBEE"
              />
              <StatCard
                value={stats.mealsPlanned}
                label="Meals Cooked"
                icon="restaurant-outline"
                color="#D97706"
                bgColor="#FEF3C7"
              />
            </View>

            {/* Savings Trend */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Savings Growth (Monthly)</Text>
              <BarChart data={trend} />
            </View>

            {/* Weekly Challenges */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Zero-Waste & Budget Missions</Text>
                <View style={styles.rewardPoolBadge}>
                  <Text style={styles.rewardPoolText}>+180 XP Available</Text>
                </View>
              </View>
              <View style={styles.challengesCard}>
                {CHALLENGES.map((c, idx) => (
                  <View key={c.id}>
                    <View style={styles.challengeRow}>
                      <View style={[styles.challengeIconBg, { backgroundColor: c.iconBg }]}>
                        {c.icon === 'leaf' ? (
                          <Ionicons name="leaf" size={16} color={c.iconColor} />
                        ) : c.icon === 'star' ? (
                          <Ionicons name="star" size={16} color={c.iconColor} />
                        ) : (
                          <FontAwesome5 name="shopping-cart" size={14} color={c.iconColor} />
                        )}
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.challengeLabel}>{c.label}</Text>
                        <Text style={styles.challengeStatus}>{c.status}</Text>
                      </View>
                      <View style={[styles.missionRewardPill, c.isDone && styles.missionRewardDone]}>
                        <Text style={[styles.missionRewardText, c.isDone && styles.missionRewardDoneText]}>
                          {c.isDone ? 'Completed ✓' : c.reward}
                        </Text>
                      </View>
                    </View>
                    {idx < CHALLENGES.length - 1 && <View style={styles.divider} />}
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* ─── LEVEL & BADGES TAB ─── */}
        {activeTab === 'gamification' && (
          <View>
            <View style={{ paddingHorizontal: CARD_PADDING, marginTop: 12 }}>
              <GamificationLevelHero gamificationData={gamificationData} />
            </View>

            {/* Badges Showcase */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Culinary & Budget Badges</Text>
                <Text style={styles.badgeCountText}>
                  {gamificationData.badges.filter((b) => b.unlocked).length} / {gamificationData.badges.length} Unlocked
                </Text>
              </View>

              <View style={styles.badgesGrid}>
                {gamificationData.badges.map((badge) => (
                  <BadgeGridItem key={badge.id} badge={badge} />
                ))}
              </View>
            </View>

            {/* Community Leaderboard */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Top Recipe Contributors</Text>
                <Text style={styles.viewLeaderboardText}>Sri Lanka Hub</Text>
              </View>
              <View style={styles.cardContainer}>
                {leaderboard.map((item, idx) => (
                  <View key={item.id}>
                    <ContributorLeaderboardItem item={item} rank={idx + 1} />
                    {idx < leaderboard.length - 1 && <View style={styles.divider} />}
                  </View>
                ))}
              </View>
            </View>

            {/* Activity & XP Audit Feed */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>XP Activity History</Text>
              <View style={styles.cardContainer}>
                {activityLogs.slice(0, 6).map((item, index) => (
                  <ActivityLogItem
                    key={item.id || index}
                    item={item}
                    isLast={index === Math.min(activityLogs.length, 6) - 1}
                  />
                ))}
              </View>
            </View>
          </View>
        )}

        <View style={{ height: 32 }} />
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
    paddingBottom: 24,
  },

  // Header
  header: {
    paddingHorizontal: CARD_PADDING,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 8 : 12,
    paddingBottom: 12,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  headerBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerBtnPlaceholder: {
    width: 38,
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

  // Tabs
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 4,
    gap: 4,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: 9,
    gap: 6,
  },
  tabButtonActive: {
    backgroundColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  tabTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  // Hero Card
  heroCard: {
    backgroundColor: '#007A3D',
    marginHorizontal: CARD_PADDING,
    marginTop: 14,
    marginBottom: 12,
    borderRadius: 18,
    padding: 20,
    shadowColor: '#007A3D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  heroLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.85)',
  },
  heroTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    gap: 4,
  },
  heroTagText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  heroAmount: {
    fontSize: 34,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.8,
    marginVertical: 8,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 4,
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
    backgroundColor: '#FFFFFF',
    borderRadius: 4,
  },
  progressPct: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    minWidth: 35,
  },
  heroFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  goalLabel: {
    fontSize: 11.5,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
  },
  goalRemaining: {
    fontSize: 11.5,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '600',
  },

  // Budget Tracker Card
  budgetCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: 'rgba(0,0,0,0.04)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 2,
  },
  budgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  budgetTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  budgetSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  budgetStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F8F0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  budgetStatusText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#007A3D',
  },
  budgetAmountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  budgetLabel: {
    fontSize: 11.5,
    color: Colors.textSecondary,
  },
  budgetSpend: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: 2,
  },
  budgetRemaining: {
    fontSize: 16,
    fontWeight: '700',
    color: '#007A3D',
    marginTop: 2,
  },
  budgetTrack: {
    height: 7,
    backgroundColor: '#F3F4F6',
    borderRadius: 4,
    overflow: 'hidden',
  },
  budgetFill: {
    height: '100%',
    backgroundColor: '#007A3D',
    borderRadius: 4,
  },

  // Stats Grid
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingHorizontal: CARD_PADDING,
    marginTop: 12,
  },
  statCard: {
    width: (SCREEN_WIDTH - CARD_PADDING * 2 - 12) / 2,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: 'rgba(0,0,0,0.04)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 1,
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
    fontSize: 17,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11.5,
    fontWeight: '500',
    color: Colors.textSecondary,
  },

  // Section
  section: {
    marginTop: 18,
    paddingHorizontal: CARD_PADDING,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    letterSpacing: -0.2,
  },
  rewardPoolBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  rewardPoolText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#D97706',
  },
  badgeCountText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  viewLeaderboardText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primary,
  },

  // Bar Chart
  chartCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: 'rgba(0,0,0,0.04)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 1,
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
  barValueText: {
    fontSize: 9.5,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 4,
  },
  barTrack: {
    height: 110,
    width: 24,
    justifyContent: 'flex-end',
    backgroundColor: '#F3F4F6',
    borderRadius: 6,
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
    borderRadius: 6,
  },
  barLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginTop: 6,
  },

  // Challenges
  challengesCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  challengeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
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
    fontSize: 13.5,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  challengeStatus: {
    fontSize: 11.5,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  missionRewardPill: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
  },
  missionRewardDone: {
    backgroundColor: '#E8F8F0',
  },
  missionRewardText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#4B5563',
  },
  missionRewardDoneText: {
    color: '#007A3D',
  },

  // Gamification Hero
  gamificationHero: {
    backgroundColor: '#1E293B',
    borderRadius: 18,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  gamHeroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  levelIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(217, 119, 6, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(217, 119, 6, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  gamLevelTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(234, 88, 12, 0.2)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 3,
  },
  streakText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FB923C',
  },
  gamXpCount: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 2,
  },
  gamProgressContainer: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  gamProgressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  gamProgressLabel: {
    fontSize: 11.5,
    color: '#94A3B8',
  },
  gamProgressValue: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#FBBF24',
  },
  gamProgressTrack: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  gamProgressFill: {
    height: '100%',
    backgroundColor: '#F59E0B',
    borderRadius: 4,
  },

  // Badges Grid
  badgesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  badgeItemCard: {
    width: (SCREEN_WIDTH - CARD_PADDING * 2 - 10) / 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  badgeItemLocked: {
    backgroundColor: '#F9FAFB',
    opacity: 0.75,
  },
  badgeIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  badgeIconUnlocked: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  badgeIconLockedBg: {
    backgroundColor: '#E5E7EB',
  },
  badgeItemName: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  badgeTextMuted: {
    color: '#6B7280',
  },
  badgeItemDesc: {
    fontSize: 10.5,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 2,
    marginBottom: 8,
    lineHeight: 14,
  },
  badgeXpChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeXpUnlocked: {
    backgroundColor: '#E8F8F0',
  },
  badgeXpLocked: {
    backgroundColor: '#F3F4F6',
  },
  badgeXpText: {
    fontSize: 10.5,
    fontWeight: '700',
  },
  badgeXpTextUnlocked: {
    color: '#007A3D',
  },
  badgeXpTextLocked: {
    color: '#6B7280',
  },

  // Card Container Generic
  cardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginHorizontal: 12,
  },

  // Activity Feed
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    gap: 12,
  },
  activityIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#E8F8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityTextCol: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  activityDetails: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  activityXpBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  activityXpText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#D97706',
  },

  // Leaderboard Row
  contributorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    gap: 10,
  },
  rankNum: {
    fontSize: 13,
    fontWeight: '800',
    color: '#6B7280',
    width: 24,
  },
  contribAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contribAvatarText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  contribName: {
    fontSize: 13.5,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  contribTier: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  contribRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  contribRatingText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#B45309',
  },
});
