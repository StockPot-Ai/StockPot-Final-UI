import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../constants/colors';
import MealPlanHeader from '../components/mealplan/MealPlanHeader';
import WeeklyBudgetCard from '../components/mealplan/WeeklyBudgetCard';
import DaySelector from '../components/mealplan/DaySelector';
import MealCard from '../components/mealplan/MealCard';
import UnplannedMealCard from '../components/mealplan/UnplannedMealCard';
import { mealPlanService, shoppingService, recipeService } from '../services';
import { useAccount } from '../context/AccountContext';

const INITIAL_DAYS_DATA = {
  mon: {
    dayName: "Monday's Plan",
    total: 1850,
    meals: [
      {
        id: 'mon-1',
        type: 'BREAKFAST',
        title: 'Overnight Chia Oats',
        image: require('../../assets/avocado_sourdough.jpg'),
        badgeType: 'tag',
        badgeText: 'Low Calorie',
        servings: 1,
        price: 450,
        accentColor: '#F59E0B',
      },
      {
        id: 'mon-2',
        type: 'LUNCH',
        title: 'Quinoa Super Bowl',
        image: require('../../assets/quinoa_bowl.jpg'),
        badgeType: 'match',
        badgeText: '90% Match',
        servings: 2,
        price: 1400,
        accentColor: '#7C2D12',
      },
    ],
    unplanned: {
      type: 'Dinner',
      title: 'Dinner not planned',
    },
  },
  tue: {
    dayName: "Tuesday's Plan",
    total: 2150,
    meals: [
      {
        id: 'tue-1',
        type: 'BREAKFAST',
        title: 'Avocado & Egg Toast',
        image: require('../../assets/avocado_sourdough.jpg'),
        badgeType: 'match',
        badgeText: '95% Match',
        servings: 2,
        price: 850,
        accentColor: '#F59E0B',
      },
      {
        id: 'tue-2',
        type: 'LUNCH',
        title: 'Sri Lankan Chicken Curry',
        image: require('../../assets/sri_lankan_chicken_curry.jpg'),
        badgeType: 'tag',
        badgeText: 'High Protein',
        servings: 3,
        price: 1300,
        accentColor: '#7C2D12',
      },
    ],
    unplanned: {
      type: 'Dinner',
      title: 'Dinner not planned',
    },
  },
  wed: {
    dayName: "Wednesday's Plan",
    total: 2380,
    meals: [
      {
        id: 'wed-1',
        type: 'BREAKFAST',
        title: 'Avocado Sourdough',
        image: require('../../assets/avocado_sourdough.jpg'),
        badgeType: 'match',
        badgeText: '88% Match',
        servings: 2,
        price: 850,
        accentColor: '#F59E0B',
      },
      {
        id: 'wed-2',
        type: 'LUNCH',
        title: 'Quinoa Super Bowl',
        image: require('../../assets/quinoa_bowl.jpg'),
        badgeType: 'match',
        badgeText: '92% Match',
        servings: 2,
        price: 1530,
        accentColor: '#7C2D12',
      },
    ],
    unplanned: {
      type: 'Dinner',
      title: 'Dinner not planned',
    },
  },
  thu: {
    dayName: "Thursday's Plan",
    total: 2200,
    meals: [
      {
        id: 'thu-1',
        type: 'BREAKFAST',
        title: 'Overnight Chia Oats',
        image: require('../../assets/avocado_sourdough.jpg'),
        badgeType: 'tag',
        badgeText: 'Low Calorie',
        servings: 2,
        price: 900,
        accentColor: '#F59E0B',
      },
      {
        id: 'thu-2',
        type: 'LUNCH',
        title: 'Sri Lankan Chicken Curry',
        image: require('../../assets/sri_lankan_chicken_curry.jpg'),
        badgeType: 'tag',
        badgeText: 'High Protein',
        servings: 3,
        price: 1300,
        accentColor: '#7C2D12',
      },
    ],
    unplanned: {
      type: 'Dinner',
      title: 'Dinner not planned',
    },
  },
  fri: {
    dayName: "Friday's Plan",
    total: 2150,
    meals: [
      {
        id: 'fri-1',
        type: 'BREAKFAST',
        title: 'Avocado & Egg Toast',
        image: require('../../assets/avocado_sourdough.jpg'),
        badgeType: 'match',
        badgeText: '91% Match',
        servings: 2,
        price: 850,
        accentColor: '#F59E0B',
      },
      {
        id: 'fri-2',
        type: 'LUNCH',
        title: 'Quinoa Super Bowl',
        image: require('../../assets/quinoa_bowl.jpg'),
        badgeType: 'match',
        badgeText: '94% Match',
        servings: 2,
        price: 1300,
        accentColor: '#7C2D12',
      },
    ],
    unplanned: {
      type: 'Dinner',
      title: 'Dinner not planned',
    },
  },
  sat: {
    dayName: "Saturday's Plan",
    total: 0,
    meals: [],
    unplanned: {
      type: 'All Day',
      title: 'Weekend meals not planned',
    },
  },
  sun: {
    dayName: "Sunday's Plan",
    total: 0,
    meals: [],
    unplanned: {
      type: 'All Day',
      title: 'Weekend meals not planned',
    },
  },
};

export default function MealPlanScreen({
  onSelectMeal,
  onNavigateHome,
  onOpenRetail,
}) {
  const { budget } = useAccount();
  const [selectedDayId, setSelectedDayId] = useState('tue');
  const [daysData, setDaysData] = useState(INITIAL_DAYS_DATA);
  const [currentPlan, setCurrentPlan] = useState(null);
  const [planSummary, setPlanSummary] = useState(null);
  const [generatingList, setGeneratingList] = useState(false);

  // Load active meal plan from backend
  const loadMealPlan = useCallback(async () => {
    try {
      const plan = await mealPlanService.getCurrentMealPlan();
      if (plan && plan.id) {
        setCurrentPlan(plan);

        // Fetch summary
        const summary = await mealPlanService.getSummary(plan.id);
        if (summary) setPlanSummary(summary);

        // Map items into days
        if (Array.isArray(plan.items) && plan.items.length > 0) {
          const daysMap = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
          setDaysData((prev) => {
            const nextDays = { ...prev };
            plan.items.forEach((item) => {
              const d = new Date(item.meal_date);
              const dayKey = isNaN(d.getDay()) ? 'mon' : daysMap[d.getDay()];
              if (nextDays[dayKey]) {
                const existing = nextDays[dayKey].meals.find((m) => m.backendId === item.id);
                if (!existing) {
                  nextDays[dayKey] = {
                    ...nextDays[dayKey],
                    meals: [
                      ...nextDays[dayKey].meals,
                      {
                        id: item.id,
                        backendId: item.id,
                        recipeId: item.recipe_id,
                        type: (item.meal_type || 'LUNCH').toUpperCase(),
                        title: item.recipe_name || 'Delicious Meal',
                        image: item.image_url ? { uri: item.image_url } : require('../../assets/creamy_pumpkin_pasta.jpg'),
                        badgeType: 'match',
                        badgeText: '96% Match',
                        servings: item.servings || 2,
                        price: Math.round(item.estimated_cost || 600),
                        accentColor: item.meal_type === 'dinner' ? '#2E7D32' : '#7C2D12',
                      },
                    ],
                    total: nextDays[dayKey].total + Math.round(item.estimated_cost || 600),
                  };
                }
              }
            });
            return nextDays;
          });
        }
      }
    } catch (err) {
      console.log('Load meal plan note:', err.message);
    }
  }, []);

  useEffect(() => {
    loadMealPlan();
  }, [loadMealPlan]);

  const currentDayData = daysData[selectedDayId] || daysData['tue'];

  const handleMealPress = (meal) => {
    if (onSelectMeal) {
      onSelectMeal(meal);
    } else {
      Alert.alert(meal.title, `Type: ${meal.type}\nServings: ${meal.servings}\nCost: Rs ${meal.price}`);
    }
  };

  const handleMealOptions = (meal) => {
    Alert.alert(
      meal.title,
      'Choose an option',
      [
        {
          text: 'View Recipe & Ingredients',
          onPress: () => onSelectMeal && onSelectMeal(meal),
        },
        {
          text: 'Swap Meal',
          onPress: () => Alert.alert('Swap Meal', `Finding alternative recipes for ${meal.title}...`),
        },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            if (currentPlan?.id && meal.backendId) {
              try {
                await mealPlanService.deleteItem(currentPlan.id, meal.backendId);
              } catch (e) {
                console.log('Delete item error:', e.message);
              }
            }

            setDaysData((prev) => {
              const updated = { ...prev };
              if (updated[selectedDayId]) {
                updated[selectedDayId] = {
                  ...updated[selectedDayId],
                  meals: updated[selectedDayId].meals.filter((m) => m.id !== meal.id),
                  total: Math.max(0, updated[selectedDayId].total - meal.price),
                };
              }
              return updated;
            });

            // refresh summary
            if (currentPlan?.id) {
              mealPlanService.getSummary(currentPlan.id).then(setPlanSummary).catch(() => {});
            }
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const handleSuggestMeal = async () => {
    try {
      const suggestions = await recipeService.getSuggestions({
        meal_type: 'dinner',
        servings: 2,
        budget: 2000,
        dietary_preference: 'none',
      });
      const suggestedRecipe = (suggestions && suggestions[0]) || {
        name: 'Creamy Pumpkin Pasta',
        estimated_cost: 780,
      };

      Alert.alert(
        'Suggested Meal',
        `Based on your pantry and preferences, we suggest ${suggestedRecipe.name} (Rs ${suggestedRecipe.estimated_cost})!`,
        [
          {
            text: 'Add to Plan',
            onPress: async () => {
              if (currentPlan?.id) {
                try {
                  await mealPlanService.addItem(currentPlan.id, {
                    recipe_id: suggestedRecipe.id || '22222222-0000-0000-0000-000000000001',
                    meal_date: '2026-09-09',
                    meal_type: 'dinner',
                    servings: 2,
                  });
                  loadMealPlan();
                  return;
                } catch (e) {
                  console.log('Add meal error:', e.message);
                }
              }

              const newMeal = {
                id: `${selectedDayId}-3`,
                type: 'DINNER',
                title: suggestedRecipe.name,
                image: suggestedRecipe.image_url ? { uri: suggestedRecipe.image_url } : require('../../assets/creamy_pumpkin_pasta.jpg'),
                badgeType: 'match',
                badgeText: '98% Match',
                servings: 2,
                price: suggestedRecipe.estimated_cost || 780,
                accentColor: '#2E7D32',
              };

              setDaysData((prev) => {
                const day = prev[selectedDayId];
                return {
                  ...prev,
                  [selectedDayId]: {
                    ...day,
                    meals: [...day.meals, newMeal],
                    total: day.total + (suggestedRecipe.estimated_cost || 780),
                    unplanned: null,
                  },
                };
              });
            },
          },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
    } catch (e) {
      Alert.alert('Suggested Meal', 'Creamy Pumpkin Pasta is a great match for today!');
    }
  };

  const handleGenerateShoppingList = async () => {
    setGeneratingList(true);
    try {
      const planId = currentPlan?.id || 'plan-00000000';
      const shoppingList = await shoppingService.generateFromMealPlan(planId);
      if (onOpenRetail) {
        onOpenRetail(shoppingList.items || [], shoppingList.id);
      } else {
        Alert.alert(
          'Shopping List Generated',
          `Created smart basket with ${shoppingList.items?.length || 0} consolidated items. Ready to compare prices!`,
          [{ text: 'OK' }]
        );
      }
    } catch (err) {
      console.log('Generate shopping list error:', err.message);
      if (onOpenRetail) {
        onOpenRetail();
      }
    } finally {
      setGeneratingList(false);
    }
  };

  const targetBudget = planSummary?.weekly_budget || budget?.weeklyBudget || 15000;
  const spentBudget = planSummary?.estimated_spending || 11450;
  const isOverBudget = spentBudget > targetBudget;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Top Header */}
      <MealPlanHeader
        title="Meal Plan"
        onNotificationPress={() => Alert.alert('Notifications', 'No new notifications')}
      />

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Weekly Budget Banner */}
        <WeeklyBudgetCard
          target={targetBudget}
          spent={spentBudget}
          status={isOverBudget ? 'OVER BUDGET' : 'ON TRACK'}
        />

        {/* Generate Shopping List CTA Button */}
        <View style={styles.ctaWrapper}>
          <TouchableOpacity
            style={styles.generateListBtn}
            onPress={handleGenerateShoppingList}
            disabled={generatingList}
            activeOpacity={0.85}
          >
            {generatingList ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="cart-outline" size={18} color="#FFFFFF" />
                <Text style={styles.generateListBtnText}>
                  Generate Shopping List & Compare Prices
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Day Selector (Mon, Tue, Wed, Thu, Fri, Sat, Sun) */}
        <DaySelector
          selectedDayId={selectedDayId}
          onSelectDay={setSelectedDayId}
        />

        {/* Day Section Title & Daily Total */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{currentDayData.dayName}</Text>
          <Text style={styles.sectionTotal}>
            Total:  Rs  {currentDayData.total.toLocaleString()}
          </Text>
        </View>

        {/* Planned Meals */}
        {currentDayData.meals.map((meal) => (
          <MealCard
            key={meal.id}
            mealType={meal.type}
            title={meal.title}
            image={meal.image}
            badgeType={meal.badgeType}
            badgeText={meal.badgeText}
            servings={meal.servings}
            price={meal.price}
            accentColor={meal.accentColor}
            onPress={() => handleMealPress(meal)}
            onOptionsPress={() => handleMealOptions(meal)}
          />
        ))}

        {/* Unplanned Meal Slot */}
        {currentDayData.unplanned && (
          <UnplannedMealCard
            mealType={currentDayData.unplanned.type}
            title={currentDayData.unplanned.title}
            onSuggestPress={handleSuggestMeal}
          />
        )}

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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  ctaWrapper: {
    paddingHorizontal: 16,
    marginTop: 12,
  },
  generateListBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  generateListBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginTop: 20,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  sectionTotal: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
});
