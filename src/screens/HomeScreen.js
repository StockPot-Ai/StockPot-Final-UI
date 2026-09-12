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
  TextInput,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import Colors from '../constants/colors';
import AIChatModal from '../components/AIChatModal';
import CreateRecipeModal from '../components/recipe/CreateRecipeModal';
import NearbyShopsModal from '../components/store/NearbyShopsModal';
import ShopOwnerModal from '../components/store/ShopOwnerModal';
import { recipeService, savingsService, gamificationService } from '../services';
import { CONTRIBUTORS } from '../data/seedData';
import { useAccount } from '../context/AccountContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_PADDING = 16;
const SMALL_CARD_WIDTH = (SCREEN_WIDTH - CARD_PADDING * 2 - 12) / 2;

const MEAL_TABS = [
  'All',
  'Breakfast',
  'Lunch',
  'Dinner',
  'Snacks',
  'Trending 🔥',
  'Top Rated ⭐',
  'Budget Friendly 💰',
  'Quick Meals ⚡',
  'Community Picks 👨‍🍳',
];

const CUISINES = ['All', 'Sri Lankan', 'Indian', 'Italian', 'Asian Fusion', 'Continental'];

const Header = ({ userName, onOpenCreate, onOpenNearbyShops, onOpenShopOwner }) => (
  <View style={styles.header}>
    <View style={styles.headerLeft}>
      <Image
        source={require('../../assets/user_avatar.jpg')}
        style={styles.avatar}
      />
      <View>
        <Text style={styles.greeting}>
          Hi {userName || 'Chef'} <Text style={styles.wave}>👋</Text>
        </Text>
        <Text style={styles.subGreeting}>Let's cook smart & save today!</Text>
      </View>
    </View>

    <View style={styles.headerActions}>
      <TouchableOpacity style={styles.shopNavBtn} onPress={onOpenNearbyShops} activeOpacity={0.8}>
        <Ionicons name="location-outline" size={17} color="#007A3D" />
      </TouchableOpacity>
      <TouchableOpacity style={styles.createBtn} onPress={onOpenCreate} activeOpacity={0.8}>
        <Ionicons name="add" size={17} color="#FFFFFF" />
        <Text style={styles.createBtnText}>Recipe</Text>
      </TouchableOpacity>
    </View>
  </View>
);

const SearchAndFilterBar = ({ search, onSearchChange, onOpenFilter, activeFilterCount }) => (
  <View style={styles.searchRow}>
    <View style={styles.searchBar}>
      <Ionicons name="search" size={18} color="#9CA3AF" />
      <TextInput
        style={styles.searchInput}
        placeholder="Search curries, dhal, stores, budget..."
        placeholderTextColor="#9CA3AF"
        value={search}
        onChangeText={onSearchChange}
      />
      {search.length > 0 && (
        <TouchableOpacity onPress={() => onSearchChange('')}>
          <Ionicons name="close-circle" size={18} color="#9CA3AF" />
        </TouchableOpacity>
      )}
    </View>
    <TouchableOpacity style={styles.filterBtn} onPress={onOpenFilter} activeOpacity={0.8}>
      <Ionicons name="options-outline" size={20} color="#007A3D" />
      {activeFilterCount > 0 && (
        <View style={styles.filterBadge}>
          <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
        </View>
      )}
    </TouchableOpacity>
  </View>
);

// ── Beautiful, Cute Weekly Milestone Banner ──
const MilestoneBanner = ({ onPress, savingsAmount = 1250, streakDays = 5 }) => (
  <TouchableOpacity onPress={onPress} activeOpacity={0.88} style={styles.milestoneBanner}>
    <View style={styles.milestoneLeft}>
      <View style={styles.milestoneHeaderRow}>
        <Text style={styles.milestoneTitle}>Weekly Milestone</Text>
        <Ionicons name="sparkles" size={12} color="#007A3D" />
      </View>
      <Text style={styles.milestoneSavings}>
        Save Rs. {savingsAmount ? savingsAmount.toLocaleString() : '1,200'} this week
      </Text>
      <Text style={styles.milestoneFlame}>🔥 {streakDays}-day cooking streak!</Text>
    </View>
    <View style={styles.trendCircle}>
      <Ionicons name="trending-up" size={22} color="#FFFFFF" />
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

const LocalShopsPromoBanner = ({ onFindShops, onRegisterShop }) => (
  <View style={styles.localShopsBanner}>
    <View style={styles.localShopsContent}>
      <View style={styles.localShopsBadge}>
        <Ionicons name="storefront" size={12} color="#D97706" />
        <Text style={styles.localShopsBadgeText}>Neighborhood Markets</Text>
      </View>
      <Text style={styles.localShopsTitle}>Compare Local Supermarkets & Shops</Text>
      <Text style={styles.localShopsDesc}>
        Find cheaper prices near you across Keells, Cargills, Glomark, and verified neighborhood grocers.
      </Text>
      <View style={styles.localShopsBtnRow}>
        <TouchableOpacity style={styles.findShopsBtn} onPress={onFindShops} activeOpacity={0.8}>
          <Text style={styles.findShopsBtnText}>Find Nearby Shops 📍</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.ownerPortalBtn} onPress={onRegisterShop} activeOpacity={0.8}>
          <Text style={styles.ownerPortalBtnText}>Add My Store +</Text>
        </TouchableOpacity>
      </View>
    </View>
  </View>
);

const TopContributorsSection = () => (
  <View style={styles.section}>
    <View style={styles.sectionHeader}>
      <View>
        <Text style={styles.sectionTitle}>Community Chef Highlights</Text>
        <Text style={styles.sectionSub}>Top home recipe contributors</Text>
      </View>
      <View style={styles.communityHeartPill}>
        <Text style={styles.communityHeartText}>👨‍🍳 4 Active Chefs</Text>
      </View>
    </View>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.contributorsRow}>
      {CONTRIBUTORS.map((c) => (
        <View key={c.id} style={styles.contributorCard}>
          <Image source={{ uri: c.avatar }} style={styles.contributorAvatar} />
          <Text style={styles.contributorName} numberOfLines={1}>{c.name}</Text>
          <View style={styles.contributorBadge}>
            <Ionicons name="ribbon" size={11} color="#007A3D" />
            <Text style={styles.contributorBadgeText}>{c.badge}</Text>
          </View>
          <Text style={styles.contributorStats}>
            ❤️ {c.totalLikes} • 🍳 {c.recipesCount} dishes
          </Text>
        </View>
      ))}
    </ScrollView>
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
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={Colors.primary} />
          <Text style={styles.loadingText}>Finding best recipe matches...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.section}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={24} color="#DC2626" />
          <Text style={styles.errorText}>Could not load recipes: {error}</Text>
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
        <View style={styles.emptyContainer}>
          <Ionicons name="restaurant-outline" size={28} color="#9CA3AF" />
          <Text style={styles.emptyText}>No matching recipes found.</Text>
        </View>
      </View>
    );
  }

  const featured = recipes[0];
  const others = recipes.slice(1);

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Featured Dishes ({recipes.length})</Text>
        <Text style={styles.viewAllText}>Tap to cook</Text>
      </View>

      {featured && (
        <TouchableOpacity
          style={styles.featuredCard}
          onPress={() => onSelectDish && onSelectDish(featured)}
          activeOpacity={0.88}
        >
          <Image
            source={getRecipeImage(featured.image || featured.image_url)}
            style={styles.featuredImage}
          />
          <View style={styles.ratingBadge}>
            <Ionicons name="star" size={12} color="#F59E0B" />
            <Text style={styles.ratingBadgeText}>{featured.rating || '4.9'}</Text>
          </View>
          <View style={styles.featuredInfo}>
            <View style={styles.featuredInfoLeft}>
              <Text style={styles.featuredTitle}>{featured.title || featured.name}</Text>
              <View style={styles.metaRow}>
                <Ionicons name="time-outline" size={13} color={Colors.textSecondary} />
                <Text style={styles.metaText}>{featured.cookTime || featured.prepTime || '25m'}</Text>
                <Text style={styles.metaText}> • </Text>
                <Text style={styles.metaPrice}>Rs. {featured.estimatedCost || 850}</Text>
                <Text style={styles.metaText}> • </Text>
                <Text style={styles.metaText}>❤️ {featured.likesCount || 120}</Text>
              </View>
            </View>
            <View style={styles.plusBtn}>
              <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
            </View>
          </View>
        </TouchableOpacity>
      )}

      {others.length > 0 && (
        <View style={styles.grid}>
          {others.map((recipe) => (
            <TouchableOpacity
              key={recipe.id}
              style={styles.smallCard}
              onPress={() => onSelectDish && onSelectDish(recipe)}
              activeOpacity={0.85}
            >
              <Image
                source={getRecipeImage(recipe.image || recipe.image_url)}
                style={styles.smallCardImage}
              />
              <View style={styles.smallCardRating}>
                <Ionicons name="star" size={10} color="#F59E0B" />
                <Text style={styles.smallCardRatingText}>{recipe.rating || '4.8'}</Text>
              </View>
              <Text style={styles.smallCardTitle} numberOfLines={2}>
                {recipe.title || recipe.name}
              </Text>
              <View style={styles.smallCardFooter}>
                <Text style={styles.smallPrice}>
                  Rs. {recipe.estimatedCost ?? recipe.base_cost ?? 450}
                </Text>
                <Text style={styles.cookCountText}>🍳 {recipe.cooksCount || 50}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
};

const HomeScreen = ({ onSelectRecipe, onMilestonePress }) => {
  const { profile } = useAccount();
  const [activeTab, setActiveTab] = useState('All');
  const [search, setSearch] = useState('');
  const [recipes, setRecipes] = useState([]);
  const [loadingRecipes, setLoadingRecipes] = useState(true);
  const [recipeError, setRecipeError] = useState(null);
  const [weeklySavings, setWeeklySavings] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [aiModalVisible, setAiModalVisible] = useState(false);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [nearbyShopsVisible, setNearbyShopsVisible] = useState(false);
  const [shopOwnerVisible, setShopOwnerVisible] = useState(false);
  
  // Advanced Filter state
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [selectedCuisine, setSelectedCuisine] = useState('All');
  const [maxCookTime, setMaxCookTime] = useState(60);
  const [maxBudget, setMaxBudget] = useState(2000);

  const fetchHomeData = useCallback(async () => {
    setLoadingRecipes(true);
    setRecipeError(null);
    try {
      const [recipesList, savingsRes] = await Promise.all([
        recipeService.getRecipes({
          category: activeTab,
          search,
          cuisine: selectedCuisine,
          maxCookTime,
          maxBudget,
        }),
        savingsService.getSummary(),
      ]);

      setRecipes(recipesList);
      if (savingsRes) {
        setWeeklySavings(savingsRes.weekly_saved || savingsRes.this_month || 1250);
      }
    } catch (err) {
      setRecipeError(err.message || 'API connection note');
    } finally {
      setLoadingRecipes(false);
      setRefreshing(false);
    }
  }, [activeTab, search, selectedCuisine, maxCookTime, maxBudget]);

  useEffect(() => {
    fetchHomeData();
  }, [fetchHomeData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchHomeData();
  };

  const activeFilterCount = (selectedCuisine !== 'All' ? 1 : 0) + (maxCookTime < 60 ? 1 : 0) + (maxBudget < 2000 ? 1 : 0);

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
          <Header
            userName={profile.name}
            onOpenCreate={() => setCreateModalVisible(true)}
            onOpenNearbyShops={() => setNearbyShopsVisible(true)}
            onOpenShopOwner={() => setShopOwnerVisible(true)}
          />
          
          <SearchAndFilterBar
            search={search}
            onSearchChange={setSearch}
            onOpenFilter={() => setFilterModalVisible(true)}
            activeFilterCount={activeFilterCount}
          />

          {/* Elevated Cute Milestone Banner */}
          <MilestoneBanner
            onPress={onMilestonePress}
            savingsAmount={weeklySavings || profile.moneySaved || 1250}
            streakDays={profile.streakDays || 5}
          />

          <MealFilterTabs activeTab={activeTab} onTabChange={setActiveTab} />

          <LocalShopsPromoBanner
            onFindShops={() => setNearbyShopsVisible(true)}
            onRegisterShop={() => setShopOwnerVisible(true)}
          />

          <PopularDishes
            recipes={recipes}
            loading={loadingRecipes}
            error={recipeError}
            onSelectDish={onSelectRecipe}
            onRetry={fetchHomeData}
          />

          <TopContributorsSection />
          <View style={{ height: 28 }} />
        </ScrollView>

        {/* Floating AI Chat Assistant */}
        <TouchableOpacity
          style={styles.aiFab}
          onPress={() => setAiModalVisible(true)}
          activeOpacity={0.85}
        >
          <Ionicons name="sparkles" size={17} color="#FFFFFF" />
          <Text style={styles.aiFabText}>Ask AI Chef</Text>
        </TouchableOpacity>

        {/* AI Chat Modal */}
        <AIChatModal
          visible={aiModalVisible}
          onClose={() => setAiModalVisible(false)}
        />

        {/* Create Recipe Modal */}
        <CreateRecipeModal
          visible={createModalVisible}
          onClose={() => setCreateModalVisible(false)}
          onRecipeCreated={() => {
            fetchHomeData();
          }}
        />

        {/* Nearby Stores Modal */}
        <NearbyShopsModal
          visible={nearbyShopsVisible}
          onClose={() => setNearbyShopsVisible(false)}
        />

        {/* Shop Owner Registration Portal */}
        <ShopOwnerModal
          visible={shopOwnerVisible}
          onClose={() => setShopOwnerVisible(false)}
          onShopRegistered={() => {
            fetchHomeData();
          }}
        />

        {/* Advanced Filter Modal */}
        <Modal visible={filterModalVisible} animationType="slide" transparent onRequestClose={() => setFilterModalVisible(false)}>
          <View style={styles.filterModalOverlay}>
            <View style={styles.filterModalContent}>
              <View style={styles.filterHeader}>
                <Text style={styles.filterTitle}>Filter Recipes</Text>
                <TouchableOpacity onPress={() => setFilterModalVisible(false)}>
                  <Ionicons name="close" size={22} color="#6B7280" />
                </TouchableOpacity>
              </View>

              <Text style={styles.filterSectionLabel}>Cuisine</Text>
              <View style={styles.filterChipsRow}>
                {CUISINES.map((c) => (
                  <TouchableOpacity
                    key={c}
                    style={[styles.cuisineChip, selectedCuisine === c && styles.cuisineChipActive]}
                    onPress={() => setSelectedCuisine(c)}
                  >
                    <Text style={[styles.cuisineChipText, selectedCuisine === c && styles.cuisineChipTextActive]}>
                      {c}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.filterSectionLabel}>Max Cooking Time: {maxCookTime} mins</Text>
              <View style={styles.presetRow}>
                {[15, 30, 45, 60].map((mins) => (
                  <TouchableOpacity
                    key={mins}
                    style={[styles.presetChip, maxCookTime === mins && styles.presetChipActive]}
                    onPress={() => setMaxCookTime(mins)}
                  >
                    <Text style={[styles.presetText, maxCookTime === mins && styles.presetTextActive]}>
                      ≤ {mins}m
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.filterSectionLabel}>Max Budget: Rs. {maxBudget}</Text>
              <View style={styles.presetRow}>
                {[500, 1000, 1500, 2000].map((b) => (
                  <TouchableOpacity
                    key={b}
                    style={[styles.presetChip, maxBudget === b && styles.presetChipActive]}
                    onPress={() => setMaxBudget(b)}
                  >
                    <Text style={[styles.presetText, maxBudget === b && styles.presetTextActive]}>
                      ≤ Rs {b}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.filterActions}>
                <TouchableOpacity
                  style={styles.resetBtn}
                  onPress={() => {
                    setSelectedCuisine('All');
                    setMaxCookTime(60);
                    setMaxBudget(2000);
                  }}
                >
                  <Text style={styles.resetBtnText}>Reset</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.applyBtn}
                  onPress={() => setFilterModalVisible(false)}
                >
                  <Text style={styles.applyBtnText}>Apply Filters</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: CARD_PADDING,
    paddingBottom: Platform.OS === 'ios' ? 100 : 80,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    paddingBottom: 8,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: '#DCFCE7',
  },
  greeting: {
    fontSize: 17,
    fontWeight: '800',
    color: '#111827',
  },
  subGreeting: {
    fontSize: 11.5,
    color: '#6B7280',
    marginTop: 1,
  },
  wave: {
    fontSize: 16,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  shopNavBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 4,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  createBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginVertical: 10,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#1F2937',
    padding: 0,
  },
  filterBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBadge: {
    position: 'absolute',
    top: 5,
    right: 5,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBadgeText: {
    color: '#FFFFFF',
    fontSize: 9.5,
    fontWeight: '700',
  },

  // ── Beautiful Mint Milestone Banner ──
  milestoneBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.milestoneCard,
    marginHorizontal: 0,
    marginTop: 4,
    marginBottom: 14,
    borderRadius: 18,
    padding: 16,
    shadowColor: 'rgba(0, 122, 61, 0.08)',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  milestoneLeft: {
    flex: 1,
  },
  milestoneHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 2,
  },
  milestoneTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#007A3D',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  milestoneSavings: {
    fontSize: 15.5,
    fontWeight: '800',
    color: Colors.textPrimary,
    lineHeight: 21,
    marginVertical: 2,
  },
  milestoneFlame: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#D97706',
    marginTop: 2,
  },
  trendCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.trendCircle,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: 'rgba(0,0,0,0.15)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 3,
    marginLeft: 12,
  },

  // Meal Filter Tabs
  tabsContainer: {
    paddingVertical: 4,
    gap: 8,
  },
  tab: {
    paddingHorizontal: 15,
    paddingVertical: 7.5,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  tabActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  tabText: {
    fontSize: 12.5,
    color: '#4B5563',
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  // Local Shops Promo Banner
  localShopsBanner: {
    backgroundColor: '#FFFBEB',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FDE68A',
    padding: 14,
    marginTop: 12,
    marginBottom: 4,
  },
  localShopsContent: {
    gap: 4,
  },
  localShopsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 6,
    gap: 4,
  },
  localShopsBadgeText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#92400E',
    textTransform: 'uppercase',
  },
  localShopsTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#78350F',
    marginTop: 2,
  },
  localShopsDesc: {
    fontSize: 11.5,
    color: '#92400E',
    lineHeight: 16,
    marginTop: 1,
  },
  localShopsBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  findShopsBtn: {
    backgroundColor: '#007A3D',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  findShopsBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  ownerPortalBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D97706',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  ownerPortalBtnText: {
    color: '#92400E',
    fontSize: 12,
    fontWeight: '700',
  },

  // Section
  section: {
    marginTop: 18,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16.5,
    fontWeight: '800',
    color: '#111827',
  },
  sectionSub: {
    fontSize: 11.5,
    color: '#6B7280',
    marginTop: 1,
  },
  viewAllText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primary,
  },
  communityHeartPill: {
    backgroundColor: '#E8F8F0',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  communityHeartText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#007A3D',
  },

  // Featured Dish Card
  featuredCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 12,
    shadowColor: 'rgba(0,0,0,0.04)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 2,
  },
  featuredImage: {
    width: '100%',
    height: 180,
    backgroundColor: '#E5E7EB',
  },
  ratingBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.92)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  ratingBadgeText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#111827',
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
    fontSize: 15.5,
    fontWeight: '700',
    color: '#111827',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  metaText: {
    fontSize: 12,
    color: '#6B7280',
  },
  metaPrice: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#007A3D',
  },
  plusBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Grid
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  smallCard: {
    width: SMALL_CARD_WIDTH,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  smallCardImage: {
    width: '100%',
    height: 105,
    borderRadius: 10,
    backgroundColor: '#E5E7EB',
    marginBottom: 8,
  },
  smallCardRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginBottom: 3,
  },
  smallCardRatingText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#4B5563',
  },
  smallCardTitle: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#111827',
    height: 34,
  },
  smallCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  smallPrice: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#007A3D',
  },
  cookCountText: {
    fontSize: 10.5,
    color: '#6B7280',
  },

  // Contributors
  contributorsRow: {
    paddingVertical: 6,
    gap: 10,
  },
  contributorCard: {
    width: 140,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  contributorAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginBottom: 6,
  },
  contributorName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
  },
  contributorBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginVertical: 4,
  },
  contributorBadgeText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#166534',
  },
  contributorStats: {
    fontSize: 10,
    color: '#6B7280',
    marginTop: 2,
  },

  // Floating AI Chef FAB
  aiFab: {
    position: 'absolute',
    bottom: 20,
    right: 18,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007A3D',
    paddingHorizontal: 16,
    paddingVertical: 11,
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

  // Loading & Error States
  loadingContainer: {
    paddingVertical: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    gap: 8,
  },
  loadingText: {
    fontSize: 13,
    color: '#6B7280',
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
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    gap: 8,
  },
  emptyText: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },

  // Filter Modal
  filterModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  filterModalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
  },
  filterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  filterTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  filterSectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginTop: 12,
    marginBottom: 8,
  },
  filterChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  cuisineChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: '#F3F4F6',
  },
  cuisineChipActive: {
    backgroundColor: Colors.primary,
  },
  cuisineChipText: {
    fontSize: 12,
    color: '#4B5563',
    fontWeight: '500',
  },
  cuisineChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  presetRow: {
    flexDirection: 'row',
    gap: 8,
  },
  presetChip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
  },
  presetChipActive: {
    backgroundColor: Colors.primary,
  },
  presetText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4B5563',
  },
  presetTextActive: {
    color: '#FFFFFF',
  },
  filterActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  resetBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
  },
  resetBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4B5563',
  },
  applyBtn: {
    flex: 2,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: Colors.primary,
  },
  applyBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

export default HomeScreen;
