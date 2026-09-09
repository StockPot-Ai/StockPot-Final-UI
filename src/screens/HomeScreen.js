import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions,
  SafeAreaView,
  StatusBar,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import Colors from '../constants/colors';
import { useAccount } from '../context/AccountContext';
import { recipeService, savingsService } from '../services';
import AIChatModal from '../components/AIChatModal';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const MEAL_TABS = ['Breakfast', 'Lunch', 'Dinner', 'Snacks'];

const CHALLENGES = [
  {
    id: '1',
    icon: 'leaf',
    iconColor: '#2E7D32',
    iconBg: '#E8F5E9',
    label: 'Meatless Monday',
    status: '0/1',
    isDone: false,
  },
  {
    id: '2',
    icon: 'piggy-bank',
    iconColor: '#E53935',
    iconBg: '#FFEBEE',
    label: 'Under Budget Week',
    status: 'Done',
    isDone: true,
  },
];

const Header = ({ userName }) => (
  <View style={styles.header}>
    <View style={styles.headerLeft}>
      <Image
        source={require('../../assets/user_avatar.jpg')}
        style={styles.avatar}
      />
      <Text style={styles.greeting}>
        Hi {userName || 'Ammar'} <Text style={styles.wave}>👋</Text>
      </Text>
    </View>
    <TouchableOpacity style={styles.bellBtn} activeOpacity={0.7}>
      <Ionicons name="notifications-outline" size={22} color={Colors.textPrimary} />
    </TouchableOpacity>
  </View>
);

const MilestoneBanner = ({ onPress, savedAmount }) => (
  <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={styles.milestoneBanner}>
    <View style={styles.milestoneLeft}>
      <Text style={styles.milestoneTitle}>Weekly Milestone</Text>
      <Text style={styles.milestoneSavings}>
        You've saved Rs {savedAmount ? Number(savedAmount).toLocaleString() : '2,500'} this week!
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

const MatchBadge = ({ matchPercent = 98 }) => (
  <View style={styles.matchBadge}>
    <Ionicons name="star" size={11} color="#FFD700" />
    <Text style={styles.matchBadgeText}>{matchPercent}% Match</Text>
  </View>
);

const SmallDishCard = ({ image, title, price, onPress }) => (
  <TouchableOpacity style={styles.smallCard} onPress={onPress} activeOpacity={0.8}>
    {typeof image === 'string' ? (
      <Image source={{ uri: image }} style={styles.smallImage} />
    ) : (
      <Image source={image} style={styles.smallImage} />
    )}
    <Text style={styles.smallTitle} numberOfLines={2}>{title}</Text>
    <View style={styles.smallCardFooter}>
      <Text style={styles.smallPrice}>{price}</Text>
      <View style={styles.smallPlusBtn}>
        <Ionicons name="add" size={18} color={Colors.primary} />
      </View>
    </View>
  </TouchableOpacity>
);

const PopularDishes = ({ recipes = [], loading = false, onSelectDish }) => {
  if (loading) {
    return (
      <View style={[styles.section, { paddingVertical: 30, alignItems: 'center' }]}>
        <ActivityIndicator size="small" color={Colors.primary} />
      </View>
    );
  }

  const featured = recipes[0];
  const otherRecipes = recipes.slice(1, 3);

  const fallbackFeaturedImage = require('../../assets/pumpkin_soup.jpg');
  const fallbackImages = [
    require('../../assets/avocado_sourdough.jpg'),
    require('../../assets/quinoa_bowl.jpg'),
  ];

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Popular Dishes</Text>
        <TouchableOpacity activeOpacity={0.7}>
          <Text style={styles.viewAll}>View All</Text>
        </TouchableOpacity>
      </View>

      {/* Featured Card */}
      {featured ? (
        <TouchableOpacity
          style={styles.featuredCard}
          onPress={() => onSelectDish && onSelectDish(featured)}
          activeOpacity={0.85}
        >
          {featured.image_url ? (
            <Image source={{ uri: featured.image_url }} style={styles.featuredImage} />
          ) : (
            <Image source={fallbackFeaturedImage} style={styles.featuredImage} />
          )}
          <MatchBadge matchPercent={featured.match || 98} />
          <View style={styles.featuredInfo}>
            <View style={styles.featuredInfoLeft}>
              <Text style={styles.featuredTitle}>{featured.name}</Text>
              <View style={styles.metaRow}>
                <Ionicons name="time-outline" size={13} color={Colors.textSecondary} />
                <Text style={styles.metaText}>{featured.prep_time || 25}m</Text>
                <Text style={[styles.metaText, { marginLeft: 8 }]}>•  Rs {featured.estimated_cost}</Text>
              </View>
            </View>
            <View style={styles.plusBtn}>
              <Ionicons name="add" size={22} color="#FFFFFF" />
            </View>
          </View>
        </TouchableOpacity>
      ) : null}

      {/* Small Cards */}
      <View style={styles.smallCardsRow}>
        {otherRecipes.length > 0 ? (
          otherRecipes.map((r, idx) => (
            <SmallDishCard
              key={r.id || idx}
              image={r.image_url || fallbackImages[idx % fallbackImages.length]}
              title={r.name}
              price={`Rs ${r.estimated_cost || 450}`}
              onPress={() => onSelectDish && onSelectDish(r)}
            />
          ))
        ) : (
          <>
            <SmallDishCard
              image={require('../../assets/avocado_sourdough.jpg')}
              title="Avocado Sourdough"
              price="Rs 450"
              onPress={() => onSelectDish && onSelectDish('Avocado Sourdough')}
            />
            <SmallDishCard
              image={require('../../assets/quinoa_bowl.jpg')}
              title="Quinoa Super Bowl"
              price="Rs 780"
              onPress={() => onSelectDish && onSelectDish('Quinoa Super Bowl')}
            />
          </>
        )}
      </View>
    </View>
  );
};

const WeeklyChallenges = () => (
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
      <View style={styles.challengeDivider} />
      <View style={styles.rewardRow}>
        <Text style={styles.rewardLabel}>REWARD POOL</Text>
        <Text style={styles.rewardPoints}>250 Pts</Text>
      </View>
    </View>
  </View>
);

const HomeScreen = ({ onSelectRecipe, onMilestonePress }) => {
  const { profile } = useAccount();
  const [activeTab, setActiveTab] = useState('Breakfast');
  const [recipes, setRecipes] = useState([]);
  const [loadingRecipes, setLoadingRecipes] = useState(false);
  const [savedAmount, setSavedAmount] = useState(1995);
  const [aiModalVisible, setAiModalVisible] = useState(false);

  // Load savings summary
  useEffect(() => {
    let mounted = true;
    savingsService
      .getSummary()
      .then((data) => {
        if (mounted && data) {
          setSavedAmount(data.this_month || data.total_saved || 1995);
        }
      })
      .catch((err) => console.log('Savings summary fetch note:', err.message));
    return () => {
      mounted = false;
    };
  }, []);

  // Fetch recipes by category
  useEffect(() => {
    let mounted = true;
    setLoadingRecipes(true);
    const categoryParam = activeTab === 'Snacks' ? 'snack' : activeTab.toLowerCase();
    recipeService
      .getRecipes({ category: categoryParam })
      .then((data) => {
        if (mounted && Array.isArray(data) && data.length > 0) {
          setRecipes(data);
        } else if (mounted) {
          // If category has no items from backend, fetch all
          recipeService.getRecipes().then((allData) => {
            if (mounted && Array.isArray(allData)) {
              setRecipes(allData);
            }
          });
        }
      })
      .catch((err) => {
        console.log('Recipe fetch note:', err.message);
      })
      .finally(() => {
        if (mounted) setLoadingRecipes(false);
      });

    return () => {
      mounted = false;
    };
  }, [activeTab]);

  const firstName = profile?.name ? profile.name.split(' ')[0] : 'Ammar';

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
      <View style={{ flex: 1 }}>
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <Header userName={firstName} />
          <MilestoneBanner onPress={onMilestonePress} savedAmount={savedAmount} />
          <MealFilterTabs activeTab={activeTab} onTabChange={setActiveTab} />
          <FarmFreshBanner />
          <PopularDishes
            recipes={recipes}
            loading={loadingRecipes}
            onSelectDish={onSelectRecipe}
          />
          <WeeklyChallenges />
          <View style={{ height: 40 }} />
        </ScrollView>

        {/* Floating AI Assistant Action Button */}
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
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: CARD_PADDING,
    paddingTop: Platform.OS === 'android' ? 12 : 8,
    paddingBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
  },
  greeting: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  wave: {
    fontSize: 20,
  },
  bellBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  milestoneBanner: {
    marginHorizontal: CARD_PADDING,
    marginTop: 4,
    backgroundColor: Colors.milestoneBg,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  milestoneLeft: {
    flex: 1,
  },
  milestoneTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  milestoneSavings: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: 2,
  },
  milestoneFlame: {
    fontSize: 14,
    marginTop: 2,
  },
  trendCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  tabsContainer: {
    paddingHorizontal: CARD_PADDING,
    paddingTop: 16,
    paddingBottom: 4,
    gap: 8,
  },
  tab: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    marginRight: 8,
  },
  tabActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  tabTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  farmBanner: {
    marginHorizontal: CARD_PADDING,
    marginTop: 16,
    backgroundColor: Colors.farmBannerBg,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  farmBannerContent: {
    flex: 1,
    paddingRight: 8,
  },
  farmTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1B4D3E',
  },
  farmSubtitle: {
    fontSize: 12,
    color: '#2E6B55',
    marginTop: 4,
    lineHeight: 17,
  },
  shopBtn: {
    marginTop: 10,
    alignSelf: 'flex-start',
  },
  shopBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1B4D3E',
  },
  farmImage: {
    width: 90,
    height: 90,
    borderRadius: 12,
    resizeMode: 'cover',
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
  },
  viewAll: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primary,
  },
  featuredCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: 'rgba(0,0,0,0.06)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 3,
  },
  featuredImage: {
    width: '100%',
    height: 170,
    resizeMode: 'cover',
  },
  matchBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  matchBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
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
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  metaText: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginLeft: 3,
  },
  plusBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  smallCardsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  smallCard: {
    width: SMALL_CARD_WIDTH,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: 'rgba(0,0,0,0.05)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 2,
    paddingBottom: 10,
  },
  smallImage: {
    width: '100%',
    height: 105,
    resizeMode: 'cover',
  },
  smallTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginTop: 8,
    marginHorizontal: 10,
  },
  smallCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
    marginHorizontal: 10,
  },
  smallPrice: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primary,
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
});

export default HomeScreen;
