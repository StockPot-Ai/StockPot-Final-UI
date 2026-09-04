import React, { useRef } from 'react';
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
} from 'react-native';
import { Ionicons, MaterialCommunityIcons, Feather, FontAwesome5 } from '@expo/vector-icons';
import Colors from './src/constants/colors';
import SavingsDashboard from './src/screens/SavingsDashboard';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─── Data ─────────────────────────────────────────────────────────────────────

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

// ─── Sub-components ────────────────────────────────────────────────────────────

const Header = () => (
  <View style={styles.header}>
    <View style={styles.headerLeft}>
      <Image
        source={require('./assets/user_avatar.jpg')}
        style={styles.avatar}
      />
      <Text style={styles.greeting}>
        Hi Ammar <Text style={styles.wave}>👋</Text>
      </Text>
    </View>
    <TouchableOpacity style={styles.bellBtn} activeOpacity={0.7}>
      <Ionicons name="notifications-outline" size={22} color={Colors.textPrimary} />
    </TouchableOpacity>
  </View>
);

const MilestoneBanner = ({ onPress }) => (
  <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={styles.milestoneBanner}>
    <View style={styles.milestoneLeft}>
      <Text style={styles.milestoneTitle}>Weekly Milestone</Text>
      <Text style={styles.milestoneSavings}>You've saved Rs 2,500 this week!</Text>
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
      source={require('./assets/farm_fresh_veggies.jpg')}
      style={styles.farmImage}
    />
  </View>
);

const MatchBadge = () => (
  <View style={styles.matchBadge}>
    <Ionicons name="star" size={11} color="#FFD700" />
    <Text style={styles.matchBadgeText}>98% Match</Text>
  </View>
);

const PopularDishes = () => (
  <View style={styles.section}>
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>Popular Dishes</Text>
      <TouchableOpacity activeOpacity={0.7}>
        <Text style={styles.viewAll}>View All</Text>
      </TouchableOpacity>
    </View>

    {/* Featured large dish card */}
    <View style={styles.featuredCard}>
      <Image
        source={require('./assets/pumpkin_soup.jpg')}
        style={styles.featuredImage}
      />
      <MatchBadge />
      <View style={styles.featuredInfo}>
        <View style={styles.featuredInfoLeft}>
          <Text style={styles.featuredTitle}>Roasted Pumpkin Soup</Text>
          <View style={styles.metaRow}>
            <Ionicons name="time-outline" size={13} color={Colors.textSecondary} />
            <Text style={styles.metaText}>25m</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.plusBtn} activeOpacity={0.8}>
          <Ionicons name="add" size={22} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </View>

    {/* Two small dish cards */}
    <View style={styles.smallCardsRow}>
      <SmallDishCard
        image={require('./assets/avocado_sourdough.jpg')}
        title="Avocado Sourdough"
        price="Rs  450"
      />
      <SmallDishCard
        image={require('./assets/quinoa_bowl.jpg')}
        title="Quinoa Super Bowl"
        price="Rs  780"
      />
    </View>
  </View>
);

const SmallDishCard = ({ image, title, price }) => (
  <View style={styles.smallCard}>
    <Image source={image} style={styles.smallImage} />
    <Text style={styles.smallTitle} numberOfLines={2}>{title}</Text>
    <View style={styles.smallCardFooter}>
      <Text style={styles.smallPrice}>{price}</Text>
      <TouchableOpacity style={styles.smallPlusBtn} activeOpacity={0.8}>
        <Ionicons name="add" size={18} color={Colors.primary} />
      </TouchableOpacity>
    </View>
  </View>
);

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

const BottomNav = ({ activeNav, onNavChange }) => {
  const navItems = [
    { id: 'Home', icon: 'home', label: 'Home', lib: 'Ionicons' },
    { id: 'Savings', icon: 'wallet-outline', label: 'Savings', lib: 'Ionicons' },
    { id: 'MealPlan', icon: 'calendar-outline', label: 'Meal Plan', lib: 'Ionicons' },
    { id: 'Shopping', icon: 'cart-outline', label: 'Shopping', lib: 'Ionicons' },
    { id: 'Profile', icon: 'person-outline', label: 'Profile', lib: 'Ionicons' },
  ];

  return (
    <View style={styles.bottomNav}>
      {navItems.map((item) => {
        const isActive = item.id === activeNav;
        return (
          <TouchableOpacity
            key={item.id}
            style={styles.navItem}
            onPress={() => onNavChange(item.id)}
            activeOpacity={0.7}
          >
            <View style={[styles.navIconWrap, isActive && styles.navIconWrapActive]}>
              <Ionicons
                name={item.icon}
                size={22}
                color={isActive ? Colors.primary : Colors.tabInactive}
              />
            </View>
            <Text style={[styles.navLabel, isActive && styles.navLabelActive]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

// ─── Main Screen ───────────────────────────────────────────────────────────────

export default function App() {
  const [activeTab, setActiveTab] = React.useState('Breakfast');
  const [currentScreen, setCurrentScreen] = React.useState('Home');

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
      {currentScreen === 'Home' && (
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <Header />
          <MilestoneBanner onPress={() => setCurrentScreen('Savings')} />
          <MealFilterTabs activeTab={activeTab} onTabChange={setActiveTab} />
          <FarmFreshBanner />
          <PopularDishes />
          <WeeklyChallenges />
          {/* Bottom spacing so content isn't hidden behind nav bar */}
          <View style={{ height: 20 }} />
        </ScrollView>
      )}
      {currentScreen === 'Savings' && (
        <SavingsDashboard onBack={() => setCurrentScreen('Home')} />
      )}
      <BottomNav
        activeNav={currentScreen}
        onNavChange={(nav) => setCurrentScreen(nav === 'Savings' ? 'Savings' : 'Home')}
      />
    </SafeAreaView>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────

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

  // ── Header
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

  // ── Milestone Banner
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

  // ── Meal Filter Tabs
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

  // ── Farm Fresh Banner
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

  // ── Section
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

  // ── Featured Card
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

  // ── Small Cards Row
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

  // ── Weekly Challenges
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

  // ── Bottom Navigation
  bottomNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: Colors.tabBackground,
    paddingVertical: 8,
    paddingBottom: Platform.OS === 'ios' ? 20 : 10,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    shadowColor: 'rgba(0,0,0,0.06)',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 10,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
  },
  navIconWrap: {
    width: 44,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navIconWrapActive: {
    backgroundColor: Colors.milestoneCard,
  },
  navLabel: {
    fontSize: 11,
    color: Colors.tabInactive,
    fontWeight: '500',
  },
  navLabelActive: {
    color: Colors.tabActive,
    fontWeight: '600',
  },
});
