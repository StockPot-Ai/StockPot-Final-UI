import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  RefreshControl,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, Feather, FontAwesome5 } from '@expo/vector-icons';
import Colors from '../constants/colors';
import SelectRecipeModal from '../components/mealplan/SelectRecipeModal';
import PremiumUpgradeModal from '../components/account/PremiumUpgradeModal';
import GroceryCatalogueModal from '../components/store/GroceryCatalogueModal';
import { mealPlanService, recipeService } from '../services';
import { useAccount } from '../context/AccountContext';

const DAYS = [
  { id: 'mon', label: 'Monday', short: 'Mon' },
  { id: 'tue', label: 'Tuesday', short: 'Tue' },
  { id: 'wed', label: 'Wednesday', short: 'Wed' },
  { id: 'thu', label: 'Thursday', short: 'Thu' },
  { id: 'fri', label: 'Friday', short: 'Fri' },
  { id: 'sat', label: 'Saturday', short: 'Sat' },
  { id: 'sun', label: 'Sunday', short: 'Sun' },
];

const EMPTY_SLOT = { breakfast: null, lunch: null, dinner: null, snack: null };
const INITIAL_SCHEDULE = {
  mon: { ...EMPTY_SLOT },
  tue: { ...EMPTY_SLOT },
  wed: { ...EMPTY_SLOT },
  thu: { ...EMPTY_SLOT },
  fri: { ...EMPTY_SLOT },
  sat: { ...EMPTY_SLOT },
  sun: { ...EMPTY_SLOT },
};


const MEAL_SLOTS = [
  { key: 'breakfast', label: 'Breakfast', icon: 'sunny-outline', color: '#D97706' },
  { key: 'lunch', label: 'Lunch', icon: 'restaurant-outline', color: '#007A3D' },
  { key: 'dinner', label: 'Dinner', icon: 'moon-outline', color: '#B45309' },
  { key: 'snack', label: 'Snack / Dessert', icon: 'cafe-outline', color: '#6B7280' },
];

const getDishImage = (title, img) => {
  if (img && typeof img === 'string' && (img.startsWith('http') || img.startsWith('data:'))) {
    return { uri: img };
  }
  const lower = (title || '').toLowerCase();
  if (lower.includes('hopper') || lower.includes('string')) {
    return { uri: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=300' };
  }
  if (lower.includes('kottu') || lower.includes('roti')) {
    return { uri: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=300' };
  }
  if (lower.includes('dhal') || lower.includes('curry') || lower.includes('rice')) {
    return { uri: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=300' };
  }
  if (lower.includes('crab') || lower.includes('fish') || lower.includes('seafood')) {
    return { uri: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=300' };
  }
  if (lower.includes('pasta') || lower.includes('pumpkin')) {
    return require('../../assets/creamy_pumpkin_pasta.jpg');
  }
  return { uri: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300' };
};

export default function MealPlanScreen({
  onSelectMeal,
  onOpenRetail,
  onNavigateHome,
  initialDay,
}) {
  const { budget, isPremium, isPro } = useAccount();
  const [selectedDay, setSelectedDay] = useState(
    initialDay ? String(initialDay).toLowerCase().slice(0, 3) : 'mon'
  );
  const [schedule, setSchedule] = useState(INITIAL_SCHEDULE);
  const [refreshing, setRefreshing] = useState(false);
  const [recipeModalVisible, setRecipeModalVisible] = useState(false);
  const [activeSlot, setActiveSlot] = useState('lunch');
  const [upgradeModalVisible, setUpgradeModalVisible] = useState(false);
  const [catalogueModalVisible, setCatalogueModalVisible] = useState(false);

  useEffect(() => {
    if (initialDay) {
      const short = String(initialDay).toLowerCase().slice(0, 3);
      if (DAYS.some((d) => d.id === short)) {
        setSelectedDay(short);
      }
    }
  }, [initialDay]);

  // Load persisted meal plan on screen mount
  useEffect(() => {
    mealPlanService
      .getMealPlan()
      .then((saved) => {
        if (saved && typeof saved === 'object') {
          setSchedule(saved);
        }
      })
      .catch((err) => console.warn('[MealPlanScreen] Load error:', err));
  }, []);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const saved = await mealPlanService.getMealPlan();
      if (saved && typeof saved === 'object') {
        setSchedule(saved);
      }
    } catch (_) {}
    setRefreshing(false);
  }, []);

  const isDayPlanLocked = (dayId) => {
    if (isPremium || isPro) return false;
    return dayId === 'thu' || dayId === 'fri' || dayId === 'sat' || dayId === 'sun';
  };

  // Compute stats
  const calculateStats = () => {
    let totalCost = 0;
    let totalMeals = 0;
    Object.keys(schedule).forEach((d) => {
      const dayMeals = schedule[d] || {};
      Object.keys(dayMeals).forEach((slot) => {
        if (dayMeals[slot]) {
          totalCost += dayMeals[slot].price || 0;
          totalMeals += 1;
        }
      });
    });
    return { totalCost, totalMeals };
  };

  const { totalCost, totalMeals } = calculateStats();
  const targetBudget = budget?.weeklyBudget || 10000;
  const remainingBudget = Math.max(0, targetBudget - totalCost);
  const budgetPercentage = Math.min(100, Math.round((totalCost / targetBudget) * 100));

  const currentMeals = schedule[selectedDay] || schedule.mon || EMPTY_SLOT;
  const currentDayInfo = DAYS.find((d) => d.id === selectedDay) || DAYS[0];

  const currentDayCost = Object.values(currentMeals).reduce(
    (sum, m) => sum + (m ? m.price || 0 : 0),
    0
  );

  const handleOpenAdd = (slotKey) => {
    setActiveSlot(slotKey);
    setRecipeModalVisible(true);
  };

  const handleRecipeSelected = (recipe) => {
    const newMeal = {
      id: `m_${Date.now()}`,
      recipeId: recipe.id,
      title: recipe.title || recipe.name,
      servings: recipe.servings || 2,
      price: recipe.estimatedCost || recipe.base_cost || 450,
      time: recipe.cookTime || recipe.prepTime || '20m',
      image: recipe.image || recipe.image_url,
      ingredients: Array.isArray(recipe.ingredients)
        ? recipe.ingredients.map((i) => i.name || i).slice(0, 4).join(', ')
        : (recipe.ingredients || 'Fresh ingredients'),
    };

    setSchedule((prev) => {
      const next = {
        ...prev,
        [selectedDay]: {
          ...(prev[selectedDay] || EMPTY_SLOT),
          [activeSlot]: newMeal,
        },
      };
      mealPlanService.saveMealPlan(next);
      return next;
    });
  };

  const handleRemoveMeal = (slotKey) => {
    setSchedule((prev) => {
      const next = {
        ...prev,
        [selectedDay]: {
          ...(prev[selectedDay] || EMPTY_SLOT),
          [slotKey]: null,
        },
      };
      mealPlanService.saveMealPlan(next);
      return next;
    });
  };

  const handleCompareAllStores = () => {
    if (!onOpenRetail) return;
    const allIngredients = [];
    Object.values(schedule).forEach((dayMeals) => {
      Object.values(dayMeals).forEach((m) => {
        if (m && m.ingredients) {
          const splitIngs = typeof m.ingredients === 'string' ? m.ingredients.split(',') : [];
          splitIngs.forEach((ingName) => {
            const clean = ingName.trim();
            if (clean && !allIngredients.some((i) => i.name.toLowerCase() === clean.toLowerCase())) {
              allIngredients.push({
                id: `ing_plan_${allIngredients.length + 1}`,
                name: clean,
                quantity: '250 g',
                cost: Math.round((m.price || 400) / (splitIngs.length || 1)),
              });
            }
          });
        }
      });
    });
    onOpenRetail(allIngredients.length > 0 ? allIngredients : undefined);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Weekly Meal Plan</Text>
          <Text style={styles.headerSub}>Organize dishes & grocery spending</Text>
        </View>

        <View style={styles.headerRightActions}>
          <TouchableOpacity
            style={styles.headerCatalogueBtn}
            onPress={() => setCatalogueModalVisible(true)}
            activeOpacity={0.8}
          >
            <Ionicons name="basket" size={13} color="#007A3D" />
            <Text style={styles.headerCatalogueBtnText}>Catalogue</Text>
          </TouchableOpacity>

          <View style={styles.mealCountBadge}>
            <Text style={styles.mealCountText}>{totalMeals} Planned</Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => setRefreshing(false)}
            colors={[Colors.primary]}
          />
        }
      >
        {/* Budget Progress Card */}
        <View style={styles.budgetCard}>
          <View style={styles.budgetHeader}>
            <View>
              <Text style={styles.budgetLabel}>Weekly Grocery Spending</Text>
              <Text style={styles.budgetAmount}>
                Rs. {totalCost.toLocaleString()}{' '}
                <Text style={styles.budgetTarget}>/ Rs. {targetBudget.toLocaleString()}</Text>
              </Text>
            </View>

            <View style={[styles.statusPill, totalCost <= targetBudget ? styles.statusPillGood : styles.statusPillOver]}>
              <Ionicons
                name={totalCost <= targetBudget ? "checkmark-circle" : "alert-circle"}
                size={13}
                color={totalCost <= targetBudget ? "#007A3D" : "#DC2626"}
              />
              <Text style={[styles.statusPillText, totalCost <= targetBudget ? styles.statusTextGood : styles.statusTextOver]}>
                {totalCost <= targetBudget ? `Rs. ${remainingBudget.toLocaleString()} Left` : 'Over Budget'}
              </Text>
            </View>
          </View>

          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                { width: `${budgetPercentage}%`, backgroundColor: budgetPercentage > 95 ? '#DC2626' : Colors.primary },
              ]}
            />
          </View>
        </View>

        {/* Day Selector Segmented Bar */}
        <View style={styles.daySelectorContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.daySelectorScroll}>
            {DAYS.map((d) => {
              const isSelected = d.id === selectedDay;
              const dayMeals = schedule[d.id] || {};
              const count = Object.values(dayMeals).filter(Boolean).length;
              const isLocked = isDayPlanLocked(d.id);

              return (
                <TouchableOpacity
                  key={d.id}
                  style={[
                    styles.dayTab,
                    isSelected && styles.dayTabActive,
                    isLocked && styles.dayTabLocked,
                  ]}
                  onPress={() => setSelectedDay(d.id)}
                  activeOpacity={0.75}
                >
                  <View style={styles.dayTabLabelRow}>
                    <Text style={[styles.dayTabLabel, isSelected && styles.dayTabLabelActive]}>
                      {d.label}
                    </Text>
                    {isLocked && (
                      <Ionicons
                        name="lock-closed"
                        size={10}
                        color={isSelected ? '#FFFFFF' : '#994122'}
                        style={{ marginLeft: 3 }}
                      />
                    )}
                  </View>
                  <View style={[styles.dayTabDot, count > 0 ? (isSelected ? styles.dotWhite : styles.dotGreen) : styles.dotEmpty]}>
                    {count > 0 && <Text style={[styles.dotCountText, isSelected && styles.dotCountTextActive]}>{count}</Text>}
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Selected Day Header */}
        <View style={styles.dayHeader}>
          <Text style={styles.dayTitle}>{currentDayInfo.label}'s Menu</Text>
          {!isDayPlanLocked(selectedDay) && (
            <Text style={styles.dayCost}>Estimated: Rs. {currentDayCost.toLocaleString()}</Text>
          )}
        </View>

        {/* Paywall Card if selected day is locked for Free users */}
        {isDayPlanLocked(selectedDay) ? (
          <View style={styles.lockedDayCard}>
            <View style={styles.lockIconCircle}>
              <Ionicons name="lock-closed" size={28} color="#994122" />
            </View>
            <Text style={styles.lockedTitle}>7-Day Planning is a Smart Feature</Text>
            <Text style={styles.lockedSub}>
              Free Starter includes 3 days of meal organization (Mon – Wed). Upgrade to StockPot Smart (Rs. 499/mo) or Pro to unlock the full 7-day week, save Rs. 4,500+ monthly, and auto-sync your grocery basket!
            </Text>
            <TouchableOpacity
              style={styles.lockedUpgradeBtn}
              onPress={() => setUpgradeModalVisible(true)}
              activeOpacity={0.88}
            >
              <FontAwesome5 name="bolt" size={13} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.lockedUpgradeBtnText}>Unlock 7-Day Planning — Rs. 499/mo</Text>
            </TouchableOpacity>
          </View>
        ) : (
          /* Meal Slots List */
          MEAL_SLOTS.map((slot) => {
            const meal = currentMeals[slot.key];

            return (
              <View key={slot.key} style={styles.slotContainer}>
                <View style={styles.slotHeaderRow}>
                  <View style={styles.slotLabelGroup}>
                    <Ionicons name={slot.icon} size={15} color={slot.color} />
                    <Text style={[styles.slotLabel, { color: slot.color }]}>{slot.label.toUpperCase()}</Text>
                  </View>
                  {meal && (
                    <Text style={styles.slotMealPrice}>Rs. {meal.price.toLocaleString()}</Text>
                  )}
                </View>

                {meal ? (
                  <TouchableOpacity
                    style={styles.mealCard}
                    onPress={() => onSelectMeal && onSelectMeal(meal)}
                    activeOpacity={0.88}
                  >
                    <Image
                      source={getDishImage(meal.title, meal.image)}
                      style={styles.mealThumb}
                    />
                    <View style={styles.mealCardContent}>
                      <Text style={styles.mealTitle} numberOfLines={2}>{meal.title}</Text>
                      <Text style={styles.mealIngredients} numberOfLines={1}>
                        🧺 {typeof meal.ingredients === 'string' ? meal.ingredients : (Array.isArray(meal.ingredients) ? meal.ingredients.map((i) => typeof i === 'string' ? i : (i.name || i.title || 'Ingredient')).join(', ') : '')}
                      </Text>
                      <View style={styles.mealMetaRow}>
                        <Text style={styles.mealMetaText}>⏱️ {meal.time}</Text>
                        <Text style={styles.mealMetaText}>•</Text>
                        <Text style={styles.mealMetaText}>🍳 {meal.servings} servings</Text>
                        <Text style={styles.mealMetaText}>•</Text>
                        <Text style={styles.mealMetaPrice}>~Rs. {Math.round(meal.price / (meal.servings || 1))}/serv</Text>
                      </View>
                    </View>

                    {/* Actions */}
                    <View style={styles.mealCardActions}>
                      <TouchableOpacity
                        style={styles.cardActionBtn}
                        onPress={(e) => {
                          e.stopPropagation?.();
                          handleOpenAdd(slot.key);
                        }}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Feather name="refresh-cw" size={14} color="#4B5563" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.cardActionBtn, styles.deleteBtn]}
                        onPress={(e) => {
                          e.stopPropagation?.();
                          handleRemoveMeal(slot.key);
                        }}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Feather name="trash-2" size={14} color="#994122" />
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={styles.emptySlotBtn}
                    onPress={() => handleOpenAdd(slot.key)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="add-circle-outline" size={18} color="#3A6847" />
                    <Text style={styles.emptySlotText}>Add recipe to {slot.label}</Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          })
        )}

        {/* Supermarket Catalogue & Meal Suggester Banner */}
        <TouchableOpacity
          style={styles.catalogueBannerCard}
          onPress={() => setCatalogueModalVisible(true)}
          activeOpacity={0.88}
        >
          <View style={styles.catalogueBannerLeft}>
            <View style={styles.catalogueBadgeRow}>
              <View style={styles.catalogueLiveBadge}>
                <Ionicons name="sparkles" size={10} color="#007A3D" />
                <Text style={styles.catalogueLiveBadgeText}>SUPERMARKET CATALOGUE</Text>
              </View>
              <Text style={styles.catalogueStoresTag}>Cargills • Keells (224)</Text>
            </View>
            <Text style={styles.catalogueBannerTitle}>Shop Ingredients & Plan Meals</Text>
            <Text style={styles.catalogueBannerSub}>
              Browse real items, add ingredients to your pantry, and schedule matched meals directly into your week!
            </Text>
          </View>
          <View style={styles.catalogueBannerArrowBtn}>
            <Ionicons name="cart" size={16} color="#FFFFFF" />
            <Ionicons name="chevron-forward" size={14} color="#FFFFFF" />
          </View>
        </TouchableOpacity>

        {/* Bottom Grocery List Prompt */}
        <View style={styles.grocerySummaryCard}>
          <View style={styles.grocerySummaryLeft}>
            <Text style={styles.grocerySummaryTitle}>Weekly Grocery Basket</Text>
            <Text style={styles.grocerySummarySub}>
              {totalMeals * 3} ingredients needed across {totalMeals} planned dishes
            </Text>
          </View>
          <TouchableOpacity
            style={styles.compareRetailBtn}
            onPress={handleCompareAllStores}
            activeOpacity={0.85}
          >
            <Ionicons name="cart" size={15} color="#FFFFFF" />
            <Text style={styles.compareRetailText}>Compare Stores</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 90 }} />
      </ScrollView>

      {/* Select Recipe Modal */}
      <SelectRecipeModal
        visible={recipeModalVisible}
        mealType={activeSlot}
        onClose={() => setRecipeModalVisible(false)}
        onSelectRecipe={handleRecipeSelected}
      />

      {/* Premium & Smart Upgrade Modal */}
      <PremiumUpgradeModal
        visible={upgradeModalVisible}
        onClose={() => setUpgradeModalVisible(false)}
      />

      {/* Supermarket Catalogue & Meal Suggester Modal */}
      <GroceryCatalogueModal
        visible={catalogueModalVisible}
        onClose={() => setCatalogueModalVisible(false)}
        onCookRecipe={(recipe) => {
          setCatalogueModalVisible(false);
          if (onSelectMeal) onSelectMeal(recipe);
        }}
        onAddToMealPlan={() => {
          mealPlanService.getMealPlan().then((saved) => {
            if (saved && typeof saved === 'object') setSchedule(saved);
          });
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
  },
  headerSub: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  mealCountBadge: {
    backgroundColor: '#E8F8F0',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  mealCountText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#007A3D',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  budgetCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  budgetHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  budgetLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  budgetAmount: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
    marginTop: 2,
  },
  budgetTarget: {
    fontSize: 13,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusPillGood: {
    backgroundColor: '#E8F8F0',
  },
  statusPillOver: {
    backgroundColor: '#FEE2E2',
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  statusTextGood: {
    color: '#007A3D',
  },
  statusTextOver: {
    color: '#DC2626',
  },
  progressTrack: {
    height: 6,
    backgroundColor: '#F3F4F6',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  daySelectorContainer: {
    marginVertical: 10,
  },
  daySelectorScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  dayTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 6,
  },
  dayTabActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  dayTabLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#4B5563',
  },
  dayTabLabelActive: {
    color: '#FFFFFF',
  },
  dayTabLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dayTabLocked: {
    borderColor: '#F5D0C7',
    backgroundColor: '#FDFBF9',
  },
  dayTabDot: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  dotWhite: {
    backgroundColor: '#FFFFFF',
  },
  dotGreen: {
    backgroundColor: '#E8F8F0',
  },
  dotEmpty: {
    backgroundColor: 'transparent',
  },
  dotCountText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#007A3D',
  },
  dotCountTextActive: {
    color: Colors.primary,
  },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: 6,
    marginBottom: 10,
  },
  dayTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
  },
  dayCost: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6B7280',
  },
  slotContainer: {
    marginHorizontal: 16,
    marginBottom: 12,
  },
  slotHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
    paddingHorizontal: 4,
  },
  slotLabelGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  slotLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  slotMealPrice: {
    fontSize: 12,
    fontWeight: '700',
    color: '#374151',
  },
  mealCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  mealThumb: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
  },
  mealCardContent: {
    flex: 1,
  },
  mealTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 3,
  },
  mealIngredients: {
    fontSize: 11.5,
    color: '#6B7280',
    marginBottom: 6,
  },
  mealMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  mealMetaText: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  mealMetaPrice: {
    fontSize: 11,
    fontWeight: '700',
    color: '#007A3D',
  },
  mealCardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cardActionBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtn: {
    backgroundColor: '#FEE2E2',
  },
  emptySlotBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    borderRadius: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  emptySlotText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#6B7280',
  },
  grocerySummaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginHorizontal: 16,
    marginTop: 10,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  grocerySummaryLeft: {
    flex: 1,
    paddingRight: 10,
  },
  grocerySummaryTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#111827',
  },
  grocerySummarySub: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
  compareRetailBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 5,
  },
  compareRetailText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  lockedDayCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#F5D0C7',
    shadowColor: 'rgba(43, 36, 32, 0.08)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 3,
    marginTop: 6,
    marginBottom: 20,
  },
  lockIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FCECE8',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  lockedTitle: {
    fontSize: 16.5,
    fontWeight: '800',
    color: '#2B2420',
    textAlign: 'center',
    marginBottom: 8,
  },
  lockedSub: {
    fontSize: 12.5,
    color: '#6B5E57',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 18,
    paddingHorizontal: 8,
  },
  lockedUpgradeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#994122',
    paddingVertical: 13,
    paddingHorizontal: 20,
    borderRadius: 14,
    shadowColor: '#994122',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
    width: '100%',
  },
  lockedUpgradeBtnText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '800',
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerCatalogueBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  headerCatalogueBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#007A3D',
  },
  catalogueBannerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#BBF7D0',
    padding: 16,
    marginTop: 14,
    marginBottom: 8,
    shadowColor: '#007A3D',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
    gap: 12,
  },
  catalogueBannerLeft: {
    flex: 1,
  },
  catalogueBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  catalogueLiveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 99,
    gap: 3,
  },
  catalogueLiveBadgeText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#007A3D',
    letterSpacing: 0.4,
  },
  catalogueStoresTag: {
    fontSize: 11,
    fontWeight: '600',
    color: '#4B5563',
  },
  catalogueBannerTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 4,
  },
  catalogueBannerSub: {
    fontSize: 12,
    color: '#4B5563',
    lineHeight: 17,
  },
  catalogueBannerArrowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007A3D',
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: 14,
    gap: 2,
  },
});
