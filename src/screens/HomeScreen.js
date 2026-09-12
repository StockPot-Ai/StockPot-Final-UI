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
import { recipeService, savingsService, gamificationService } from '../services';
import { CONTRIBUTORS } from '../data/seedData';
import { useAccount } from '../context/AccountContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

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

const Header = ({ userName, onOpenCreate }) => (
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
        <Text style={styles.subGreeting}>What would you like to cook today?</Text>
      </View>
    </View>
    <TouchableOpacity style={styles.createBtn} onPress={onOpenCreate} activeOpacity={0.8}>
      <Ionicons name="add" size={18} color="#FFFFFF" />
      <Text style={styles.createBtnText}>Recipe</Text>
    </TouchableOpacity>
  </View>
);

const SearchAndFilterBar = ({ search, onSearchChange, onOpenFilter, activeFilterCount }) => (
  <View style={styles.searchRow}>
    <View style={styles.searchBar}>
      <Ionicons name="search" size={18} color="#9CA3AF" />
      <TextInput
        style={styles.searchInput}
        placeholder="Search recipes, ingredients, cuisines..."
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
      <Ionicons name="options-outline" size={20} color="#166534" />
      {activeFilterCount > 0 && (
        <View style={styles.filterBadge}>
          <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
        </View>
      )}
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

const TopContributorsSection = () => (
  <View style={styles.section}>
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>Top Community Chefs</Text>
      <Text style={styles.sectionSub}>Recognized creators</Text>
    </View>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.contributorsRow}>
      {CONTRIBUTORS.map((c) => (
        <View key={c.id} style={styles.contributorCard}>
          <Image source={{ uri: c.avatar }} style={styles.contributorAvatar} />
          <Text style={styles.contributorName} numberOfLines={1}>{c.name}</Text>
          <View style={styles.contributorBadge}>
            <Ionicons name="ribbon" size={12} color="#166534" />
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
          <Text style={styles.loadingText}>Loading recipes...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.section}>
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
        <Text style={styles.sectionTitle}>Community Recipes ({recipes.length})</Text>
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
          <View style={styles.ratingBadge}>
            <Ionicons name="star" size={12} color="#F59E0B" />
            <Text style={styles.ratingBadgeText}>{featured.rating || '4.9'}</Text>
          </View>
          <View style={styles.featuredInfo}>
            <View style={styles.featuredInfoLeft}>
              <Text style={styles.featuredTitle}>{featured.title || featured.name}</Text>
              <View style={styles.metaRow}>
                <Ionicons name="time-outline" size={13} color={Colors.textSecondary} />
                <Text style={styles.metaText}>{featured.prepTime || featured.time || '20m'}</Text>
                <Text style={styles.metaText}> • </Text>
                <Text style={styles.metaPrice}>Rs {featured.estimatedCost || 450}</Text>
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
                  Rs {recipe.estimatedCost ?? recipe.base_cost ?? 450}
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
        setWeeklySavings(savingsRes.weekly_saved || savingsRes.this_month || 0);
      }
    } catch (err) {
      setRecipeError(err.message || 'API connection failed');
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
          <Header userName={profile.name} onOpenCreate={() => setCreateModalVisible(true)} />
          
          <SearchAndFilterBar
            search={search}
            onSearchChange={setSearch}
            onOpenFilter={() => setFilterModalVisible(true)}
            activeFilterCount={activeFilterCount}
          />

          <MilestoneBanner
            onPress={onMilestonePress}
            savingsAmount={weeklySavings || profile.moneySaved}
          />

          <MealFilterTabs activeTab={activeTab} onTabChange={setActiveTab} />

          <PopularDishes
            recipes={recipes}
            loading={loadingRecipes}
            error={recipeError}
            onSelectDish={onSelectRecipe}
            onRetry={fetchHomeData}
          />

          <TopContributorsSection />
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

        {/* AI Modal */}
        <AIChatModal
          visible={aiModalVisible}
          onClose={() => setAiModalVisible(false)}
        />

        {/* Create Recipe Modal */}
        <CreateRecipeModal
          visible={createModalVisible}
          onClose={() => setCreateModalVisible(false)}
          onRecipeCreated={(newRec) => {
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

const CARD_PADDING = 16;
const SMALL_CARD_WIDTH = (SCREEN_WIDTH - CARD_PADDING * 2 - 12) / 2;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FAFAF8',
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
    paddingBottom: 10,
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
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },
  subGreeting: {
    fontSize: 12,
    color: '#6B7280',
  },
  wave: {
    fontSize: 16,
  },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    gap: 4,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  createBtnText: {
    color: '#FFFFFF',
    fontSize: 12.5,
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
    fontSize: 13.5,
    color: '#1F2937',
    padding: 0,
  },
  filterBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
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
  milestoneBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  milestoneLeft: {
    flex: 1,
  },
  milestoneTitle: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  milestoneSavings: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    marginTop: 2,
  },
  milestoneFlame: {
    fontSize: 14,
    marginTop: 2,
  },
  trendCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabsContainer: {
    paddingVertical: 6,
    gap: 8,
  },
  tab: {
    paddingHorizontal: 15,
    paddingVertical: 8,
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
  section: {
    marginTop: 18,
  },
  sectionHeader: {
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#111827',
  },
  sectionSub: {
    fontSize: 12,
    color: '#6B7280',
  },
  featuredCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 12,
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
    fontSize: 16,
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
    color: Colors.primary,
  },
  plusBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
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
    fontSize: 13,
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
    color: Colors.primary,
  },
  cookCountText: {
    fontSize: 10.5,
    color: '#6B7280',
  },
  contributorsRow: {
    paddingVertical: 6,
    gap: 10,
  },
  contributorCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    width: 140,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  contributorAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginBottom: 6,
  },
  contributorName: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
  },
  contributorBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginTop: 4,
    gap: 3,
  },
  contributorBadgeText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#166534',
  },
  contributorStats: {
    fontSize: 10,
    color: '#6B7280',
    marginTop: 6,
  },
  loadingContainer: {
    padding: 30,
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    fontSize: 13,
    color: '#6B7280',
  },
  emptyContainer: {
    padding: 30,
    alignItems: 'center',
    gap: 8,
  },
  emptyText: {
    fontSize: 13,
    color: '#6B7280',
  },
  errorContainer: {
    padding: 20,
    alignItems: 'center',
    gap: 8,
  },
  errorText: {
    fontSize: 13,
    color: Colors.error || '#DC2626',
  },
  retryBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 8,
  },
  retryText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  aiFab: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 24 : 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 24,
    gap: 6,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  aiFabText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '700',
  },
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
    maxHeight: '75%',
  },
  filterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  filterTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#111827',
  },
  filterSectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
    marginTop: 12,
    marginBottom: 8,
  },
  filterChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  cuisineChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
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
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  presetChipActive: {
    backgroundColor: Colors.primary,
  },
  presetText: {
    fontSize: 12,
    color: '#4B5563',
    fontWeight: '600',
  },
  presetTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  filterActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
  },
  resetBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  resetBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4B5563',
  },
  applyBtn: {
    flex: 2,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: 'center',
  },
  applyBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

export default HomeScreen;
