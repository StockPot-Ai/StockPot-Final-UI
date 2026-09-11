import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions,
  StatusBar,
  Platform,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import Colors from '../constants/colors';
import AIChatModal from '../components/AIChatModal';
import { recipeService, savingsService } from '../services';
import { useAccount } from '../context/AccountContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const MEAL_TABS = ['Breakfast', 'Lunch', 'Dinner', 'Snacks'];

const Header = ({ userName }) => (
  <View style={styles.header}>
    <View style={styles.headerLeft}>
      <Image
        source={require('../../assets/user_avatar.jpg')}
        style={styles.avatar}
      />
      <Text style={styles.greeting}>
        Hi {userName || 'Chef'} <Text style={styles.wave}>👋</Text>
      </Text>
    </View>
    <TouchableOpacity style={styles.bellBtn} activeOpacity={0.7}>
      <Ionicons name="notifications-outline" size={22} color={Colors.textPrimary} />
    </TouchableOpacity>
  </View>
);

const MilestoneBanner = ({ onPress, savingsAmount }) => (
  <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={styles.milestoneBanner}>
    <View style={styles.milestoneLeft}>
      <Text style={styles.milestoneTitle}>Weekly Milestone</Text>
      <Text style={styles.milestoneSavings}>
        You've saved Rs {savingsAmount ? savingsAmount.toLocaleString() : '0'} this week!
      </Text>
      <Text style={styles.milestoneFlame}>🔥</Text>
    </View>
    <View style={styles.trendCircle}>
      <Ionicons name="trending-down" size={22} color={Colors.primary} />
    </View>
  </TouchableOpacity>
);

const MealFilterTabs = ({ activeTab, onTabChange }) => (
  <ScrollView
    horizontal
    showsHorizontalScrollIndicator={false}
    contentContainerStyle={styles.tabsContainer}
  >
    {MEAL_TABS.map((tab) => {
      const isActive = tab === activeTab;
      return (
        <TouchableOpacity
          key={tab}
          style={[styles.tab, isActive && styles.tabActive]}
          onPress={() => onTabChange(tab)}
          activeOpacity={0.75}
        >
          <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
            {tab}
          </Text>
        </TouchableOpacity>
      );
    })}
  </ScrollView>
);

const FarmFreshBanner = () => (
  <View style={styles.farmBanner}>
    <View style={styles.farmBannerContent}>
      <Text style={styles.farmTitle}>Farm Fresh Delivery</Text>
      <Text style={styles.farmSubtitle}>
        Get 20% off organic greens this{'\n'}weekend.
      </Text>
      <TouchableOpacity style={styles.shopBtn} activeOpacity={0.8}>
        <Text style={styles.shopBtnText}>Shop Now →</Text>
      </TouchableOpacity>
    </View>
    <Image
      source={require('../../assets/farm_fresh_veggies.jpg')}
      style={styles.farmImage}
    />
  </View>
);

const MatchBadge = ({ matchText = '98% Match' }) => (
  <View style={styles.matchBadge}>
    <Ionicons name="star" size={11} color="#FFD700" />
    <Text style={styles.matchBadgeText}>{matchText}</Text>
  </View>
);

const getRecipeImage = (img) => {
  if (img && typeof img === 'string' && (img.startsWith('http') || img.startsWith('data:'))) {
    return { uri: img };
  }
  return require('../../assets/creamy_pumpkin_pasta.jpg');
};

const PopularDishes = ({ recipes, loading, error, onSelectDish, onRetry }) => {
  if (loading) {
    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Popular Dishes</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={Colors.primary} />
          <Text style={styles.loadingText}>Fetching recipes from API...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Popular Dishes</Text>
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={24} color={Colors.error || '#DC2626'} />
          <Text style={styles.errorText}>Failed to load recipes: {error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={onRetry}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (!recipes || recipes.length === 0) {
    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Popular Dishes</Text>
        </View>
        <View style={styles.emptyContainer}>
          <Ionicons name="restaurant-outline" size={28} color={Colors.retailMuted || '#9CA3AF'} />
          <Text style={styles.emptyText}>No recipes available for this category.</Text>
        </View>
      </View>
    );
  }

  const featured = recipes[0];
  const others = recipes.slice(1);

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Popular Dishes</Text>
        <TouchableOpacity activeOpacity={0.7}>
          <Text style={styles.viewAll}>{recipes.length} Available</Text>
        </TouchableOpacity>
      </View>

      {featured && (
        <TouchableOpacity
          style={styles.featuredCard}
          onPress={() => onSelectDish && onSelectDish(featured)}
          activeOpacity={0.85}
        >
          <Image
            source={getRecipeImage(featured.image || featured.image_url)}
            style={styles.featuredImage}
          />
          <MatchBadge matchText={featured.match_percentage ? `${featured.match_percentage}% Match` : '98% Match'} />
          <View style={styles.featuredInfo}>
            <View style={styles.featuredInfoLeft}>
              <Text style={styles.featuredTitle}>{featured.title || featured.name}</Text>
              <View style={styles.metaRow}>
                <Ionicons name="time-outline" size={13} color={Colors.textSecondary} />
                <Text style={styles.metaText}>{featured.prep_time || featured.time || '20m'}</Text>
                {featured.calories && (
                  <>
                    <Text style={styles.metaText}> • </Text>
                    <Text style={styles.metaText}>{featured.calories} kcal</Text>
                  </>
                )}
              </View>
            </View>
            <View style={styles.plusBtn}>
              <Ionicons name="add" size={22} color="#FFFFFF" />
            </View>
          </View>
        </TouchableOpacity>
      )}

      {others.length > 0 && (
        <View style={styles.smallCardsRow}>
          {others.slice(0, 4).map((recipe, idx) => (
            <TouchableOpacity
              key={recipe.id || idx}
              style={styles.smallCard}
              onPress={() => onSelectDish && onSelectDish(recipe)}
              activeOpacity={0.8}
            >
              <Image
                source={getRecipeImage(recipe.image || recipe.image_url)}
                style={styles.smallImage}
              />
              <Text style={styles.smallTitle} numberOfLines={2}>
                {recipe.title || recipe.name}
              </Text>
              <View style={styles.smallCardFooter}>
                <Text style={styles.smallPrice}>
                  Rs {recipe.estimated_cost ?? recipe.base_cost ?? recipe.price ?? 450}
                </Text>
                <View style={styles.smallPlusBtn}>
                  <Ionicons name="add" size={18} color={Colors.primary} />
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
};

const WeeklyChallenges = ({ challenges = [] }) => {
  if (!challenges || challenges.length === 0) return null;

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Weekly Challenges</Text>
      <View style={styles.challengesCard}>
        {challenges.map((c, idx) => (
          <View key={c.id || idx}>
            <View style={styles.challengeRow}>
              <View style={[styles.challengeIconBg, { backgroundColor: c.iconBg || '#E8F5E9' }]}>
                {c.icon === 'leaf' ? (
                  <Ionicons name="leaf" size={16} color={c.iconColor || '#2E7D32'} />
                ) : (
                  <FontAwesome5 name="piggy-bank" size={14} color={c.iconColor || '#E53935'} />
                )}
              </View>
              <Text style={styles.challengeLabel}>{c.label || c.title}</Text>
              <Text
                style={[
                  styles.challengeStatus,
                  c.isDone && styles.challengeStatusDone,
                ]}
              >
                {c.status || (c.isDone ? 'Done' : '0/1')}
              </Text>
            </View>
            {idx < challenges.length - 1 && <View style={styles.challengeDivider} />}
          </View>
        ))}
        <View style={styles.challengeDivider} />
        <View style={styles.rewardRow}>
          <Text style={styles.rewardLabel}>REWARD POOL</Text>
          <Text style={styles.rewardPoints}>250 Pts</Text>
        </View>
      </View>
    </View>
  );
};

const HomeScreen = ({ onSelectRecipe, onMilestonePress }) => {
  const { profile } = useAccount();
  const [activeTab, setActiveTab] = useState('Breakfast');
  const [recipes, setRecipes] = useState([]);
  const [loadingRecipes, setLoadingRecipes] = useState(true);
  const [recipeError, setRecipeError] = useState(null);
  const [weeklySavings, setWeeklySavings] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [aiModalVisible, setAiModalVisible] = useState(false);

  const fetchHomeData = useCallback(async () => {
    setLoadingRecipes(true);
    setRecipeError(null);
    try {
      const [recipesRes, savingsRes] = await Promise.allSettled([
        recipeService.getRecipes({ category: activeTab }),
        savingsService.getSummary(),
      ]);

      if (recipesRes.status === 'fulfilled') {
        const recipeList = Array.isArray(recipesRes.value)
          ? recipesRes.value
          : recipesRes.value?.recipes || [];
        setRecipes(recipeList);
      } else {
        const errMsg = recipesRes.reason?.message || 'Failed to fetch recipes from API';
        setRecipeError(errMsg);
      }

      if (savingsRes.status === 'fulfilled' && savingsRes.value) {
        setWeeklySavings(savingsRes.value.weekly_saved || savingsRes.value.this_month || 0);
      }
    } catch (err) {
      setRecipeError(err.message || 'API connection failed');
    } finally {
      setLoadingRecipes(false);
      setRefreshing(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchHomeData();
  }, [fetchHomeData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchHomeData();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
      <View style={{ flex: 1 }}>
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
          <Header userName={profile.name} />
          <MilestoneBanner onPress={onMilestonePress} savingsAmount={weeklySavings || profile.moneySaved} />
          <MealFilterTabs activeTab={activeTab} onTabChange={setActiveTab} />
          <FarmFreshBanner />
          <PopularDishes
            recipes={recipes}
            loading={loadingRecipes}
            error={recipeError}
            onSelectDish={onSelectRecipe}
            onRetry={fetchHomeData}
          />
          <WeeklyChallenges />
          <View style={{ height: 20 }} />
        </ScrollView>

        {/* Floating AI Chat Assistant */}
        <TouchableOpacity
          style={styles.aiFab}
          onPress={() => setAiModalVisible(true)}
          activeOpacity={0.85}
        >
          <Ionicons name="sparkles" size={18} color="#FFFFFF" />
          <Text style={styles.aiFabText}>Ask AI</Text>
        </TouchableOpacity>

        <AIChatModal
          visible={aiModalVisible}
          onClose={() => setAiModalVisible(false)}
        />
      </View>
    </SafeAreaView>
  );
};

const CARD_PADDING = 16;
const SMALL_CARD_WIDTH = (SCREEN_WIDTH - CARD_PADDING * 2 - 12) / 2;

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

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: CARD_PADDING,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 8 : 12,
    paddingBottom: 8,
    backgroundColor: Colors.background,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
  },
  greeting: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    letterSpacing: -0.3,
  },
  wave: {
    fontSize: 18,
  },
  bellBtn: {
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

  milestoneBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.milestoneCard,
    marginHorizontal: CARD_PADDING,
    marginTop: 8,
    marginBottom: 16,
    borderRadius: 16,
    padding: 16,
  },
  milestoneLeft: {
    flex: 1,
  },
  milestoneTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  milestoneSavings: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    lineHeight: 22,
    marginBottom: 4,
  },
  milestoneFlame: {
    fontSize: 20,
    marginTop: 2,
  },
  trendCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.trendCircle,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: 'rgba(0,0,0,0.12)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 3,
    marginLeft: 12,
  },

  tabsContainer: {
    paddingHorizontal: CARD_PADDING,
    paddingBottom: 4,
    gap: 8,
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 50,
    backgroundColor: Colors.pillInactive,
  },
  tabActive: {
    backgroundColor: Colors.pillActive,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.pillTextInactive,
  },
  tabTextActive: {
    color: Colors.pillTextActive,
    fontWeight: '600',
  },

  farmBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bannerCard,
    marginHorizontal: CARD_PADDING,
    marginTop: 16,
    marginBottom: 4,
    borderRadius: 16,
    padding: 16,
    overflow: 'hidden',
  },
  farmBannerContent: {
    flex: 1,
    paddingRight: 8,
  },
  farmTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textAmber,
    marginBottom: 4,
  },
  farmSubtitle: {
    fontSize: 13,
    color: Colors.textAmber,
    lineHeight: 19,
    marginBottom: 12,
    opacity: 0.85,
  },
  shopBtn: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.shopNowBtn,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 50,
  },
  shopBtnText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 13,
  },
  farmImage: {
    width: 90,
    height: 90,
    borderRadius: 45,
  },

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

  featuredCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
    shadowColor: 'rgba(0,0,0,0.08)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 4,
  },
  featuredImage: {
    width: '100%',
    height: 190,
    resizeMode: 'cover',
  },
  matchBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.matchBadge,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 50,
    gap: 4,
  },
  matchBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  featuredInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
  },
  featuredInfoLeft: {
    flex: 1,
  },
  featuredTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  plusBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.plusBtn,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 5,
  },

  smallCardsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  smallCard: {
    width: SMALL_CARD_WIDTH,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: 'rgba(0,0,0,0.07)',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 3,
  },
  smallImage: {
    width: '100%',
    height: 110,
    resizeMode: 'cover',
  },
  smallTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textPrimary,
    paddingHorizontal: 10,
    paddingTop: 8,
    lineHeight: 18,
  },
  smallCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  smallPrice: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  smallPlusBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },

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
  challengeDivider: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginHorizontal: 12,
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
  aiFab: {
    position: 'absolute',
    bottom: 20,
    right: 18,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
    gap: 6,
  },
  aiFabText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  loadingContainer: {
    paddingVertical: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    gap: 8,
  },
  loadingText: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  errorContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF2F2',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FCA5A5',
    gap: 8,
  },
  errorText: {
    fontSize: 13,
    color: '#991B1B',
    textAlign: 'center',
    fontWeight: '500',
  },
  retryBtn: {
    marginTop: 6,
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  retryText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  emptyContainer: {
    paddingVertical: 36,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    gap: 8,
  },
  emptyText: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
});

export default HomeScreen;
