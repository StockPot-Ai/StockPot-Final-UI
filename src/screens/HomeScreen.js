import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import Colors from '../constants/colors';
import AIChatModal from '../components/AIChatModal';
import CreateRecipeModal from '../components/recipe/CreateRecipeModal';
import NearbyShopsModal from '../components/store/NearbyShopsModal';
import ShopDiscoveryModal from '../components/store/ShopDiscoveryModal';
import ShopOwnerModal from '../components/store/ShopOwnerModal';
import PremiumUpgradeModal from '../components/account/PremiumUpgradeModal';
import ShopOwnerPortalScreen from './ShopOwnerPortalScreen';
import { recipeService, savingsService, gamificationService } from '../services';
import ShopProfileModal from '../components/store/ShopProfileModal';
import { useAccount } from '../context/AccountContext';
import { useNotifications } from '../context/NotificationContext';

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

import locationService from '../services/locationService';

const AnimatedWave = () => {
  const waveAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const waveLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(waveAnim, { toValue: 1, duration: 240, useNativeDriver: true }),
        Animated.timing(waveAnim, { toValue: -1, duration: 300, useNativeDriver: true }),
        Animated.timing(waveAnim, { toValue: 1, duration: 240, useNativeDriver: true }),
        Animated.timing(waveAnim, { toValue: 0, duration: 240, useNativeDriver: true }),
        Animated.delay(2000),
      ])
    );
    waveLoop.start();
    return () => waveLoop.stop();
  }, [waveAnim]);

  const rotateInterpolation = waveAnim.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: ['-18deg', '0deg', '22deg'],
  });

  return (
    <Animated.View style={[styles.waveWrap, { transform: [{ rotate: rotateInterpolation }] }]}>
      <Text style={styles.wave}>👋</Text>
    </Animated.View>
  );
};

const Header = ({
  profile,
  isPremium,
  isPro,
  gpsLocation,
  locationLoading,
  onOpenPremium,
  onOpenProfile,
  t,
}) => {
  const { unreadCount, openNotificationCenter } = useNotifications();

  const getFirstName = () => {
    if (profile?.name && typeof profile.name === 'string' && profile.name.trim()) {
      return profile.name.trim().split(' ')[0];
    }
    if (profile?.full_name && typeof profile.full_name === 'string' && profile.full_name.trim()) {
      return profile.full_name.trim().split(' ')[0];
    }
    if (profile?.email && profile.email.includes('@')) {
      const uname = profile.email.split('@')[0];
      return uname.charAt(0).toUpperCase() + uname.slice(1);
    }
    return 'Chef';
  };

  const getTimeGreeting = () => {
    const hr = new Date().getHours();
    if (hr < 12) return t ? t('good_morning', 'Good morning') : 'Good morning';
    if (hr < 17) return t ? t('good_afternoon', 'Good afternoon') : 'Good afternoon';
    return t ? t('good_evening', 'Good evening') : 'Good evening';
  };

  const firstName = getFirstName();
  const initial = (firstName.charAt(0) || 'C').toUpperCase();

  // Animated live pulse for GPS indicator
  const pulseAnim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.4,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulseAnim]);

  return (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        <TouchableOpacity
          onPress={onOpenProfile}
          activeOpacity={0.8}
          style={styles.avatarTouch}
        >
          {profile?.avatarUrl || profile?.avatar_url ? (
            <Image
              source={{ uri: profile.avatarUrl || profile.avatar_url }}
              style={styles.avatar}
            />
          ) : (
            <View style={styles.initialsAvatar}>
              <Text style={styles.initialsText}>{initial}</Text>
            </View>
          )}
        </TouchableOpacity>

        <View style={styles.greetingWrap}>
          <Text style={styles.greetingSub}>{getTimeGreeting()}</Text>
          <View style={styles.greetingRow}>
            <Text style={styles.greeting}>{firstName}</Text>
            <AnimatedWave />
          </View>
          <View style={styles.gpsRow}>
            {locationLoading ? (
              <View style={styles.locationLoadingRow}>
                <ActivityIndicator size={9} color="#3A6847" />
                <Text style={styles.gpsLocationLoadingText}>{t ? t('detecting_location', 'Detecting location...') : 'Detecting location...'}</Text>
              </View>
            ) : (
              <>
                <Text style={styles.gpsLocationText} numberOfLines={1}>
                  {(gpsLocation && !/^\d/.test(gpsLocation) && !/\d+\.\d+/.test(gpsLocation) && gpsLocation.replace(/[^a-zA-Z]/g, '').length >= 2) ? gpsLocation : 'Current Location'}
                </Text>
                {gpsLocation ? (
                  <Animated.View style={[styles.gpsLiveDot, { transform: [{ scale: pulseAnim }] }]} />
                ) : null}
              </>
            )}
          </View>
        </View>
      </View>

      <View style={styles.headerRight}>
        {isPro ? (
          <View style={styles.premiumHeaderTag}>
            <FontAwesome5 name="crown" size={10} color="#E8A93F" />
            <Text style={styles.premiumHeaderTagText}>PRO</Text>
          </View>
        ) : isPremium ? (
          <View style={[styles.premiumHeaderTag, { backgroundColor: '#EAF3EC', borderColor: '#E8DFD8' }]}>
            <Ionicons name="flash" size={10} color="#3A6847" />
            <Text style={[styles.premiumHeaderTagText, { color: '#3A6847' }]}>SMART</Text>
          </View>
        ) : (
          <TouchableOpacity style={styles.crownNavBtn} onPress={onOpenPremium} activeOpacity={0.82}>
            <FontAwesome5 name="crown" size={11} color="#E8A93F" />
            <Text style={styles.crownNavBtnText}>{t ? t('plans', 'Plans') : 'Plans'}</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.headerBellBtn}
          onPress={openNotificationCenter}
          activeOpacity={0.8}
          accessibilityLabel="Notifications"
          accessibilityRole="button"
        >
          <Ionicons name="notifications-outline" size={18} color="#2B2420" />
          {unreadCount > 0 && (
            <View style={styles.bellBadge}>
              <Text style={styles.bellBadgeText}>
                {unreadCount > 9 ? '9+' : unreadCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const SearchAndFilterBar = ({ search, onSearchChange, onOpenFilter, onOpenAI, activeFilterCount, t }) => (
  <View style={styles.searchRow}>
    <View style={styles.searchBar}>
      <Ionicons name="search" size={18} color="#968880" />
      <TextInput
        style={styles.searchInput}
        placeholder={t ? t('search_placeholder', 'Search recipes, dhal, stores, budget...') : 'Search recipes, dhal, stores, budget...'}
        placeholderTextColor="#968880"
        value={search}
        onChangeText={onSearchChange}
      />
      {search.length > 0 ? (
        <TouchableOpacity onPress={() => onSearchChange('')}>
          <Ionicons name="close-circle" size={18} color="#968880" />
        </TouchableOpacity>
      ) : (
        <TouchableOpacity onPress={onOpenAI} style={styles.searchAiBtn} activeOpacity={0.7}>
          <MaterialCommunityIcons name="chef-hat" size={16} color="#3A6847" />
        </TouchableOpacity>
      )}
    </View>
    <TouchableOpacity
      style={[styles.filterBtn, activeFilterCount > 0 && styles.filterBtnActive]}
      onPress={onOpenFilter}
      activeOpacity={0.8}
    >
      <Ionicons name="options-outline" size={20} color={activeFilterCount > 0 ? '#FFFFFF' : '#3A6847'} />
      {activeFilterCount > 0 && (
        <View style={styles.filterBadge}>
          <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
        </View>
      )}
    </TouchableOpacity>
  </View>
);

// ── Beautiful, Animated Weekly Milestone Banner ──
const MilestoneBanner = ({ onPress, savingsAmount = 0, streakDays = 0, weeklyGoal = 5000, t }) => {
  const flameAnim = useRef(new Animated.Value(1)).current;
  const pressAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(flameAnim, {
          toValue: 1.25,
          duration: 750,
          useNativeDriver: true,
        }),
        Animated.timing(flameAnim, {
          toValue: 1,
          duration: 750,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [flameAnim]);

  const handlePressIn = () => {
    Animated.spring(pressAnim, {
      toValue: 0.97,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(pressAnim, {
      toValue: 1,
      friction: 4,
      useNativeDriver: true,
    }).start();
  };

  const progressPct = weeklyGoal > 0 ? Math.min(100, Math.round(((savingsAmount || 0) / weeklyGoal) * 100)) : 0;

  return (
    <Animated.View style={{ transform: [{ scale: pressAnim }] }}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.92}
        style={styles.milestoneBanner}
      >
        <View style={styles.milestoneLeft}>
          <View style={styles.milestoneHeaderRow}>
            <View style={styles.milestoneTag}>
              <Ionicons name="sparkles" size={10} color="#007A3D" />
              <Text style={styles.milestoneTagText}>{t ? t('weekly_milestone', 'WEEKLY MILESTONE') : 'WEEKLY MILESTONE'}</Text>
            </View>
            <View style={styles.streakPill}>
              <Animated.Text style={[styles.milestoneFlame, { transform: [{ scale: flameAnim }] }]}>
                🔥
              </Animated.Text>
              <Text style={styles.streakPillText}>{streakDays > 0 ? `${streakDays} ${t ? t('day_streak', 'day streak') : 'day streak'}` : (t ? t('ready_to_cook', 'Ready to cook') : 'Ready to cook')}</Text>
            </View>
          </View>
          <Text style={styles.milestoneSavings}>
            {savingsAmount > 0
              ? `Rs. ${savingsAmount.toLocaleString()} ${t ? t('saved_this_week', 'saved this week') : 'saved this week'}`
              : (t ? t('ready_to_save', 'Start your grocery savings journey 🍲') : 'Start your grocery savings journey 🍲')}
          </Text>

          {/* Micro Progress Bar */}
          <View style={styles.miniProgressTrack}>
            <View style={[styles.miniProgressFill, { width: `${progressPct}%` }]} />
          </View>
          <Text style={styles.miniProgressText}>
            {progressPct > 0 ? `${progressPct}% of Rs. ${weeklyGoal.toLocaleString()} target` : `Weekly target: Rs. ${weeklyGoal.toLocaleString()}`}
          </Text>
        </View>

        <View style={styles.trendCircle}>
          <Ionicons name="trending-up" size={22} color="#FFFFFF" />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const MEAL_TAB_MAP = {
  'All': 'all_categories',
  'Breakfast': 'breakfast',
  'Lunch': 'lunch',
  'Dinner': 'dinner',
  'Trending 🔥': 'trending',
  'Top Rated ⭐': 'top_rated',
  'Budget Friendly 💰': 'budget_friendly',
  'Quick Meals ⚡': 'quick_meals',
  'Community Picks 👨‍🍳': 'community_picks',
};

const MealFilterTabs = ({ activeTab, onTabChange, t }) => (
  <ScrollView
    horizontal
    showsHorizontalScrollIndicator={false}
    contentContainerStyle={styles.tabsContainer}
  >
    {MEAL_TABS.map((tab) => {
      const isActive = tab === activeTab;
      const label = t && MEAL_TAB_MAP[tab] ? t(MEAL_TAB_MAP[tab], tab) : tab;
      return (
        <TouchableOpacity
          key={tab}
          style={[styles.tab, isActive && styles.tabActive]}
          onPress={() => onTabChange(tab)}
          activeOpacity={0.75}
        >
          <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
            {label}
          </Text>
        </TouchableOpacity>
      );
    })}
  </ScrollView>
);

const LocalMerchantHub = ({ onFindShops, onRegisterShop, onSelectShop, stores = [], t }) => {
  const displayStores = stores || [];

  return (
    <View style={styles.localShopsBanner}>
      <View style={styles.localShopsContent}>
        <View style={styles.localShopsHeaderRow}>
          <View style={styles.localShopsBadge}>
            <Ionicons name="storefront" size={13} color="#007A3D" />
            <Text style={styles.localShopsBadgeText}>LOCAL GROCERY HUB</Text>
          </View>
          {displayStores.length > 0 && (
            <Text style={styles.verifiedStoreCount}>{displayStores.length}+ Verified Stores</Text>
          )}
        </View>
        <Text style={styles.localShopsTitle}>Compare Local Supermarkets & Groceries</Text>
        <Text style={styles.localShopsDesc}>
          Find cheaper prices near you across verified supermarkets and neighborhood grocers.
        </Text>

        {/* Horizontal store pills/cards */}
        {displayStores.length > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.hubStoresScroll}
          >
            {displayStores.map((st) => (
              <TouchableOpacity
                key={st.id}
                style={styles.hubStoreCard}
                onPress={() => onSelectShop && onSelectShop(st)}
                activeOpacity={0.78}
              >
                <View style={[styles.hubStoreLogoFallback, { backgroundColor: (st.color || '#007A3D') + '20' }]}>
                  <Ionicons name={st.isLocalShop ? 'storefront' : 'cart'} size={16} color={st.color || '#007A3D'} />
                </View>
                <View style={{ flex: 1, justifyContent: 'center' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                    <Text style={styles.hubStoreName} numberOfLines={1}>{st.name}</Text>
                    {st.isVerified && <Ionicons name="checkmark-circle" size={11} color="#007A3D" />}
                  </View>
                  <Text style={styles.hubStoreSub}>
                    ⭐ {st.rating || 4.5} • {st.distanceKm ? `${st.distanceKm} km` : (st.isLocalShop ? 'Local' : 'Supermarket')}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        ) : (
          <View style={{ paddingVertical: 12 }}>
            <Text style={{ fontSize: 13, color: '#4B5563', fontStyle: 'italic' }}>
              No nearby registered grocery stores detected within 8km. Discover all verified shops or register your neighborhood store!
            </Text>
          </View>
        )}

        <View style={styles.localShopsBtnRow}>
          <TouchableOpacity style={styles.findShopsBtn} onPress={onFindShops} activeOpacity={0.8}>
            <Ionicons name="map-outline" size={14} color="#FFFFFF" />
            <Text style={styles.findShopsBtnText}>{t ? t('discover_stores', 'Discover All Stores') : 'Discover All Stores'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.ownerPortalBtn} onPress={onRegisterShop} activeOpacity={0.8}>
            <Ionicons name="storefront-outline" size={14} color="#007A3D" />
            <Text style={styles.ownerPortalBtnText}>{t ? t('shop_owner_portal', 'Shop Owner Portal') : 'Shop Owner Portal'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const TopContributorsSection = () => {
  const [contributors, setContributors] = useState([]);

  useEffect(() => {
    gamificationService.getLeaderboard().then((res) => {
      if (Array.isArray(res) && res.length > 0) {
        setContributors(res);
      }
    }).catch(() => {});
  }, []);

  if (!contributors || contributors.length === 0) return null;

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionHeaderTitleWrap}>
          <Text style={styles.sectionTitle} numberOfLines={1}>Community Chef Highlights</Text>
          <Text style={styles.sectionSub} numberOfLines={1}>Top verified home recipe creators</Text>
        </View>
        <View style={styles.communityVerifiedPill}>
          <MaterialCommunityIcons name="check-decagram" size={13} color="#34B7F1" />
          <Text style={styles.communityVerifiedText}>{contributors.length} Verified</Text>
        </View>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.contributorsRow}
      >
        {contributors.map((c) => (
          <View key={c.id} style={styles.contributorCard}>
            <View style={styles.contributorAvatarWrap}>
              {c.avatar ? (
                <Image source={{ uri: c.avatar }} style={styles.contributorAvatar} />
              ) : (
                <View style={[styles.contributorAvatar, { backgroundColor: '#E5E7EB', alignItems: 'center', justifyContent: 'center' }]}>
                  <Ionicons name="person" size={20} color="#6B7280" />
                </View>
              )}
            </View>

            <View style={styles.contributorNameRow}>
              <Text style={styles.contributorName} numberOfLines={1}>
                {c.name}
              </Text>
              <MaterialCommunityIcons name="check-decagram" size={13} color="#34B7F1" />
            </View>

            <View style={styles.contributorBadge}>
              <Text style={styles.contributorBadgeText}>{c.badge || 'Creator'}</Text>
            </View>

            <Text style={styles.contributorSpecialty} numberOfLines={1}>
              {c.specialty || 'Home Cook'}
            </Text>

            <View style={styles.contributorStatsRow}>
              <Text style={styles.contributorStatLine} numberOfLines={1}>
                <Text style={styles.contributorRatingText}>⭐ {c.ratingAvg || 4.9}</Text>
                <Text style={styles.contributorDotText}> • </Text>
                <Text style={styles.contributorCookText}>🍳 {c.recipesCount || 0} dishes</Text>
              </Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const RecipeThumbnail = ({ img, style }) => {
  const [hasError, setHasError] = useState(false);
  const fallback = require('../../assets/creamy_pumpkin_pasta.jpg');

  if (hasError || !img) {
    return <Image source={fallback} style={style} resizeMode="cover" />;
  }

  const src = (typeof img === 'string' && (img.startsWith('http') || img.startsWith('data:')))
    ? { uri: img }
    : fallback;

  return (
    <Image
      source={src}
      style={style}
      resizeMode="cover"
      onError={() => setHasError(true)}
    />
  );
};

const FeaturedDishCard = ({ featured, onSelectDish }) => {
  const flamePulse = useRef(new Animated.Value(1)).current;
  const cardScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(flamePulse, {
          toValue: 1.28,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(flamePulse, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [flamePulse]);

  return (
    <Animated.View style={{ transform: [{ scale: cardScale }] }}>
      <TouchableOpacity
        style={styles.featuredCard}
        onPress={() => onSelectDish && onSelectDish(featured)}
        onPressIn={() =>
          Animated.spring(cardScale, {
            toValue: 0.98,
            useNativeDriver: true,
          }).start()
        }
        onPressOut={() =>
          Animated.spring(cardScale, {
            toValue: 1,
            friction: 4,
            useNativeDriver: true,
          }).start()
        }
        activeOpacity={0.92}
      >
        <RecipeThumbnail
          img={featured.image || featured.image_url}
          style={styles.featuredImage}
        />

        {/* #1 Trending Badge */}
        <View style={styles.trendingRibbon}>
          <Animated.View style={{ transform: [{ scale: flamePulse }] }}>
            <Ionicons name="flame" size={13} color="#FFFFFF" />
          </Animated.View>
          <Text style={styles.trendingRibbonText}>#1 TRENDING DISH</Text>
        </View>

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
              <Text style={styles.metaText}> • </Text>
              <Text style={styles.metaText}>🍳 {featured.cooksCount || 85} cooked</Text>
            </View>
          </View>
          <View style={styles.plusBtn}>
            <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
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

  // Pick #1 Trending recipe: highest rating or cooks
  const sortedRecipes = [...recipes].sort((a, b) => {
    const scoreA = (a.rating || 4.5) * 100 + (a.likesCount || 0) + (a.cooksCount || 0);
    const scoreB = (b.rating || 4.5) * 100 + (b.likesCount || 0) + (b.cooksCount || 0);
    return scoreB - scoreA;
  });

  const featured = sortedRecipes[0];
  const others = sortedRecipes.slice(1);

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <View>
          <Text style={styles.sectionTitle}>Featured Dishes ({recipes.length})</Text>
          <Text style={styles.sectionSub}>Hand-picked Sri Lankan & global meals</Text>
        </View>
        <Text style={styles.viewAllText}>Tap to cook</Text>
      </View>

      {featured && (
        <FeaturedDishCard featured={featured} onSelectDish={onSelectDish} />
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
              <RecipeThumbnail
                img={recipe.image || recipe.image_url}
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

const HomeScreen = ({ onSelectRecipe, onMilestonePress, onOpenProfile }) => {
  const { profile, isPremium, isPro, t } = useAccount();
  const [activeTab, setActiveTab] = useState('All');
  const [search, setSearch] = useState('');
  const [recipes, setRecipes] = useState([]);
  const [loadingRecipes, setLoadingRecipes] = useState(true);
  const [recipeError, setRecipeError] = useState(null);
  const [weeklySavings, setWeeklySavings] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [gpsLocation, setGpsLocation] = useState(
    locationService.getCachedLocation()?.formatted || 'Locating...'
  );
  const [locationLoading, setLocationLoading] = useState(false);
  const [nearbyStores, setNearbyStores] = useState([]);
  const [aiModalVisible, setAiModalVisible] = useState(false);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [nearbyShopsVisible, setNearbyShopsVisible] = useState(false);
  const [shopOwnerVisible, setShopOwnerVisible] = useState(false);
  const [premiumModalVisible, setPremiumModalVisible] = useState(false);
  const [shopOwnerPortalVisible, setShopOwnerPortalVisible] = useState(false);
  const [selectedShopProfile, setSelectedShopProfile] = useState(null);
  const [shopProfileVisible, setShopProfileVisible] = useState(false);

  // Advanced Filter state
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [selectedCuisine, setSelectedCuisine] = useState('All');
  const [maxCookTime, setMaxCookTime] = useState(60);
  const [maxBudget, setMaxBudget] = useState(2000);

  // Animated pulse for floating AI Chef button
  const fabPulseAnim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(fabPulseAnim, {
          toValue: 1.06,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(fabPulseAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [fabPulseAnim]);

  const refreshLocationAndStores = useCallback(() => {
    locationService
      .getCoordinates()
      .then((loc) => {
        if (loc && loc.formatted) {
          setGpsLocation(loc.formatted);
        }
        if (loc && loc.latitude && loc.longitude) {
          storeService
            .getNearbyStores(loc.latitude, loc.longitude, { city: loc.city })
            .then((stores) => {
              if (Array.isArray(stores) && stores.length > 0) {
                setNearbyStores(stores.slice(0, 8));
              }
            })
            .catch(() => {});
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    refreshLocationAndStores();
  }, [refreshLocationAndStores]);

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
        setWeeklySavings(savingsRes.weekly_saved ?? savingsRes.this_month ?? profile?.moneySaved ?? 0);
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
    refreshLocationAndStores();
  };

  const activeFilterCount = (selectedCuisine !== 'All' ? 1 : 0) + (maxCookTime < 60 ? 1 : 0) + (maxBudget < 2000 ? 1 : 0);

  if (shopOwnerPortalVisible) {
    return <ShopOwnerPortalScreen onBack={() => setShopOwnerPortalVisible(false)} />;
  }

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
            profile={profile}
            isPremium={isPremium}
            isPro={isPro}
            gpsLocation={gpsLocation}
            locationLoading={locationLoading}
            onOpenPremium={() => setPremiumModalVisible(true)}
            onOpenProfile={onOpenProfile}
            t={t}
          />

          <SearchAndFilterBar
            search={search}
            onSearchChange={setSearch}
            onOpenFilter={() => setFilterModalVisible(true)}
            onOpenAI={() => setAiModalVisible(true)}
            activeFilterCount={activeFilterCount}
            t={t}
          />

          {/* Elevated Cute Milestone Banner */}
          <MilestoneBanner
            onPress={onMilestonePress}
            savingsAmount={weeklySavings || profile?.moneySaved || 0}
            streakDays={profile?.streakDays || 0}
            t={t}
          />

          <MealFilterTabs activeTab={activeTab} onTabChange={setActiveTab} t={t} />

          <LocalMerchantHub
            stores={nearbyStores}
            onFindShops={() => setNearbyShopsVisible(true)}
            onRegisterShop={() => setShopOwnerPortalVisible(true)}
            onSelectShop={(st) => {
              setSelectedShopProfile(st);
              setShopProfileVisible(true);
            }}
            t={t}
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

        {/* Shop Discovery Modal */}
        <ShopDiscoveryModal
          visible={nearbyShopsVisible}
          onClose={() => setNearbyShopsVisible(false)}
        />

        {/* Shop Profile & In-Store Catalogue Modal */}
        <ShopProfileModal
          visible={shopProfileVisible}
          store={selectedShopProfile}
          onClose={() => setShopProfileVisible(false)}
        />

        {/* Customer Premium Upgrade Modal */}
        <PremiumUpgradeModal
          visible={premiumModalVisible}
          onClose={() => setPremiumModalVisible(false)}
        />

        {/* Shop Owner Registration Portal */}
        <ShopOwnerModal
          visible={shopOwnerVisible}
          onClose={() => setShopOwnerVisible(false)}
          onShopRegistered={() => {
            fetchHomeData();
            setShopOwnerPortalVisible(true);
          }}
        />

        {/* Shop Owner Business Portal Screen Modal */}
        <Modal
          visible={shopOwnerPortalVisible}
          animationType="slide"
          onRequestClose={() => setShopOwnerPortalVisible(false)}
        >
          <ShopOwnerPortalScreen
            onBack={() => {
              setShopOwnerPortalVisible(false);
              fetchHomeData();
            }}
          />
        </Modal>

        {/* Advanced Filter Modal */}
        <Modal visible={filterModalVisible} animationType="slide" transparent onRequestClose={() => setFilterModalVisible(false)}>
          <View style={styles.filterModalOverlay}>
            <TouchableOpacity
              style={styles.filterModalBackdrop}
              activeOpacity={1}
              onPress={() => setFilterModalVisible(false)}
            />
            <View style={styles.filterModalContent}>
              <View style={styles.grabberWrap}>
                <View style={styles.grabber} />
              </View>

              <View style={styles.filterHeader}>
                <Text style={styles.filterTitle}>Filter Recipes</Text>
                <TouchableOpacity onPress={() => setFilterModalVisible(false)} style={styles.filterCloseBtn}>
                  <Ionicons name="close" size={20} color="#6B7280" />
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

        {/* Animated Floating Chef TeteAssistant */}
        <Animated.View style={[styles.floatingAiFabWrap, { transform: [{ scale: fabPulseAnim }] }]}>
          <TouchableOpacity
            style={styles.floatingAiFab}
            onPress={() => setAiModalVisible(true)}
            activeOpacity={0.88}
          >
            <View style={styles.fabIconWrap}>
              <MaterialCommunityIcons name="chef-hat" size={18} color="#FFFFFF" />
            </View>
            <Text style={styles.floatingAiFabText}>Ask Tete👨‍🍳</Text>
          </TouchableOpacity>
        </Animated.View>
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
    flex: 1,
    gap: 10,
    marginRight: 8,
  },
  avatarTouch: {
    position: 'relative',
    flexShrink: 0,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#DCFCE7',
  },
  initialsAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007A3D',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#007A3D',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  initialsText: {
    fontSize: 16.5,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  greetingWrap: {
    flex: 1,
    justifyContent: 'center',
  },
  greetingSub: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#007A3D',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'nowrap',
    marginVertical: 1,
  },
  greeting: {
    fontSize: 17.5,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: -0.3,
  },
  waveWrap: {
    width: 22,
    height: 22,
    marginLeft: 4,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  wave: {
    fontSize: 16,
  },
  gpsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 1,
    flexWrap: 'nowrap',
  },
  locationLoadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexWrap: 'nowrap',
  },
  gpsLocationLoadingText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#007A3D',
    fontStyle: 'italic',
  },
  gpsLocationText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#4B5563',
  },
  gpsLiveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
    marginLeft: 2,
    flexShrink: 0,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 0,
  },
  crownNavBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 16,
    gap: 5,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  crownNavBtnText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#D97706',
    letterSpacing: 0.2,
  },
  premiumHeaderTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 4,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  premiumHeaderTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#92400E',
    letterSpacing: 0.5,
  },
  headerBellBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  bellBadge: {
    position: 'absolute',
    top: -3,
    right: -3,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    zIndex: 10,
  },
  bellBadgeText: {
    color: '#FFFFFF',
    fontSize: 9.5,
    fontWeight: '800',
    lineHeight: 11,
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
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#1F2937',
    padding: 0,
  },
  searchAiBtn: {
    padding: 4,
  },
  filterBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  filterBtnActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
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
    backgroundColor: '#ECFDF5',
    borderWidth: 1.5,
    borderColor: '#A7F3D0',
    marginHorizontal: 0,
    marginTop: 4,
    marginBottom: 14,
    borderRadius: 20,
    padding: 16,
    shadowColor: '#007A3D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  milestoneLeft: {
    flex: 1,
  },
  milestoneHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginBottom: 4,
  },
  milestoneTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 8,
  },
  milestoneTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#007A3D',
    letterSpacing: 0.5,
  },
  streakPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 8,
  },
  streakPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#B45309',
  },
  milestoneSavings: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
    lineHeight: 22,
    marginVertical: 4,
  },
  milestoneFlame: {
    fontSize: 12,
  },
  miniProgressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#D1FAE5',
    overflow: 'hidden',
    marginTop: 3,
    marginBottom: 4,
    width: '92%',
  },
  miniProgressFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: '#007A3D',
  },
  miniProgressText: {
    fontSize: 10.5,
    color: '#047857',
    fontWeight: '600',
  },
  trendCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#007A3D',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#007A3D',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
    marginLeft: 12,
  },

  // ── Floating AI Chef FAB ──
  floatingAiFabWrap: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 24 : 16,
    right: 16,
    zIndex: 999,
  },
  floatingAiFab: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007A3D',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 25,
    gap: 8,
    shadowColor: '#007A3D',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 1.5,
    borderColor: '#34D399',
  },
  fabIconWrap: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  floatingAiFabText: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3,
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
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#E8F8F0',
    padding: 16,
    marginTop: 12,
    marginBottom: 4,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  localShopsContent: {
    gap: 4,
  },
  localShopsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  localShopsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F8F0',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
  },
  localShopsBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#007A3D',
    letterSpacing: 0.5,
  },
  verifiedStoreCount: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
  },
  localShopsTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111827',
    marginTop: 2,
  },
  localShopsDesc: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 17,
    marginTop: 2,
  },
  hubStoresScroll: {
    gap: 8,
    paddingVertical: 10,
  },
  hubStoreCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 8,
    width: 165,
  },
  hubStoreLogo: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
  },
  hubStoreLogoFallback: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hubStoreName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#111827',
  },
  hubStoreSub: {
    fontSize: 10,
    color: '#6B7280',
    marginTop: 1,
  },
  localShopsBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 4,
  },
  findShopsBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
  },
  findShopsBtnText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '700',
  },
  ownerPortalBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
  },
  ownerPortalBtnText: {
    color: '#374151',
    fontSize: 12.5,
    fontWeight: '700',
  },

  // City Selector Modal
  cityModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  cityModalContent: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 5,
  },
  cityModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  cityModalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#111827',
  },
  cityModalSub: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 14,
  },
  cityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 4,
    gap: 10,
  },
  cityItemActive: {
    backgroundColor: '#E8F8F0',
  },
  cityItemText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  cityItemTextActive: {
    color: Colors.primary,
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
  sectionHeaderTitleWrap: {
    flex: 1,
    marginRight: 8,
  },
  communityVerifiedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 8,
    flexShrink: 0,
  },
  communityVerifiedText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0284C7',
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
  trendingRibbon: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EA580C',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
    shadowColor: '#EA580C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
    elevation: 3,
  },
  trendingRibbonText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
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
    gap: 12,
  },
  contributorCard: {
    width: 156,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  contributorAvatarWrap: {
    marginBottom: 8,
  },
  contributorAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
  },
  contributorNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    width: '100%',
  },
  contributorName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
    maxWidth: 110,
    textAlign: 'center',
  },
  contributorBadge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 4,
    marginBottom: 3,
  },
  contributorBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#007A3D',
  },
  contributorSpecialty: {
    fontSize: 10.5,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 8,
  },
  contributorStatsRow: {
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contributorStatLine: {
    fontSize: 10.5,
    textAlign: 'center',
  },
  contributorRatingText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#4B5563',
  },
  contributorDotText: {
    fontSize: 10.5,
    color: '#9CA3AF',
  },
  contributorCookText: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#4B5563',
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
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
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
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  filterModalBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  filterModalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  grabberWrap: {
    alignItems: 'center',
    paddingTop: 4,
    paddingBottom: 10,
  },
  grabber: {
    width: 38,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#D1D5DB',
  },
  filterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  filterTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: -0.3,
  },
  filterCloseBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterSectionLabel: {
    fontSize: 12.5,
    fontWeight: '700',
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
    marginTop: 22,
  },
  resetBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    borderRadius: 14,
    backgroundColor: '#F3F4F6',
  },
  resetBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4B5563',
  },
  applyBtn: {
    flex: 2,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 2,
  },
  applyBtnText: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

export default HomeScreen;
