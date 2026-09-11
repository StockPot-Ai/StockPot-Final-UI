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
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../constants/colors';
import MealPlanHeader from '../components/mealplan/MealPlanHeader';
import WeeklyBudgetCard from '../components/mealplan/WeeklyBudgetCard';
import DaySelector from '../components/mealplan/DaySelector';
import MealCard from '../components/mealplan/MealCard';
import UnplannedMealCard from '../components/mealplan/UnplannedMealCard';
import { mealPlanService, recipeService } from '../services';
import { useAccount } from '../context/AccountContext';

const DEFAULT_DAYS_STRUCTURE = {
  mon: { dayName: "Monday's Plan", total: 0, meals: [], unplanned: null },
  tue: { dayName: "Tuesday's Plan", total: 0, meals: [], unplanned: null },
  wed: { dayName: "Wednesday's Plan", total: 0, meals: [], unplanned: null },
  thu: { dayName: "Thursday's Plan", total: 0, meals: [], unplanned: null },
  fri: { dayName: "Friday's Plan", total: 0, meals: [], unplanned: null },
  sat: { dayName: "Saturday's Plan", total: 0, meals: [], unplanned: null },
  sun: { dayName: "Sunday's Plan", total: 0, meals: [], unplanned: null },
};

const DAY_NAMES = {
  mon: "Monday's Plan",
  tue: "Tuesday's Plan",
  wed: "Wednesday's Plan",
  thu: "Thursday's Plan",
  fri: "Friday's Plan",
  sat: "Saturday's Plan",
  sun: "Sunday's Plan",
};

export default function MealPlanScreen({
  onSelectMeal,
  onNavigateHome,
}) {
  const { budget } = useAccount();
  const [selectedDayId, setSelectedDayId] = useState('mon');
  const [daysData, setDaysData] = useState(DEFAULT_DAYS_STRUCTURE);
  const [planId, setPlanId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [budgetSpent, setBudgetSpent] = useState(0);

  const fetchMealPlan = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const plan = await mealPlanService.getCurrentMealPlan();
      if (plan) {
        setPlanId(plan.id);
        const days = {
          mon: { dayName: "Monday's Plan", total: 0, meals: [] },
          tue: { dayName: "Tuesday's Plan", total: 0, meals: [] },
          wed: { dayName: "Wednesday's Plan", total: 0, meals: [] },
          thu: { dayName: "Thursday's Plan", total: 0, meals: [] },
          fri: { dayName: "Friday's Plan", total: 0, meals: [] },
          sat: { dayName: "Saturday's Plan", total: 0, meals: [] },
          sun: { dayName: "Sunday's Plan", total: 0, meals: [] },
        };

        const items = plan.items || plan.meals || [];
        let totalCostAll = 0;

        items.forEach((item) => {
          const rawDay = (item.day || item.day_of_week || 'mon').toLowerCase().slice(0, 3);
          const dayKey = days[rawDay] ? rawDay : 'mon';
          const mealCost = item.cost || item.price || item.estimated_cost || 0;
          totalCostAll += mealCost;

          days[dayKey].meals.push({
            id: item.id || Math.random().toString(),
            type: item.meal_type || item.type || 'LUNCH',
            title: item.title || item.recipe_name || item.name || 'Planned Meal',
            image: item.image || item.image_url,
            badgeType: item.badge_type || 'match',
            badgeText: item.badge_text || '95% Match',
            servings: item.servings || 2,
            price: mealCost,
            accentColor:
              (item.meal_type || item.type || '').toUpperCase() === 'BREAKFAST'
                ? '#F59E0B'
                : (item.meal_type || item.type || '').toUpperCase() === 'DINNER'
                ? '#2E7D32'
                : '#7C2D12',
          });
          days[dayKey].total += mealCost;
        });

        // Set unplanned markers for days with missing dinner
        Object.keys(days).forEach((dk) => {
          const hasDinner = days[dk].meals.some((m) => m.type.toUpperCase() === 'DINNER');
          if (!hasDinner && days[dk].meals.length > 0) {
            days[dk].unplanned = {
              type: 'Dinner',
              title: 'Dinner not planned',
            };
          }
        });

        setDaysData(days);
        setBudgetSpent(totalCostAll);
      }
    } catch (err) {
      console.log('[MealPlanScreen] Fetch error:', err.message);
      setError(err.message || 'Could not load meal plan from server');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchMealPlan();
  }, [fetchMealPlan]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchMealPlan();
  };

  const currentDayData = daysData[selectedDayId] || {
    dayName: DAY_NAMES[selectedDayId] || "Today's Plan",
    total: 0,
    meals: [],
    unplanned: null,
  };

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
          text: 'Remove from Plan',
          style: 'destructive',
          onPress: async () => {
            if (planId && meal.id) {
              try {
                await mealPlanService.deleteItem(planId, meal.id);
              } catch (e) {
                console.log('Error deleting meal from API:', e.message);
              }
            }
            setDaysData((prev) => {
              const updated = { ...prev };
              if (updated[selectedDayId]) {
                const filtered = updated[selectedDayId].meals.filter((m) => m.id !== meal.id);
                updated[selectedDayId] = {
                  ...updated[selectedDayId],
                  meals: filtered,
                  total: Math.max(0, updated[selectedDayId].total - meal.price),
                };
              }
              return updated;
            });
            setBudgetSpent((prev) => Math.max(0, prev - meal.price));
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const handleSuggestMeal = () => {
    Alert.alert(
      'Suggested Meal',
      'Based on your pantry ingredients, we suggest Creamy Pumpkin Pasta!',
      [
        {
          text: 'View Recipe',
          onPress: () => {
            if (onSelectMeal) {
              onSelectMeal({
                title: 'Creamy Pumpkin Pasta',
                type: 'DINNER',
                price: 780,
                servings: 2,
              });
            }
          },
        },
        {
          text: 'Add to Dinner',
          onPress: () => {
            const newMeal = {
              id: `${selectedDayId}-3`,
              type: 'DINNER',
              title: 'Creamy Pumpkin Pasta',
              image: require('../../assets/creamy_pumpkin_pasta.jpg'),
              badgeType: 'match',
              badgeText: '98% Match',
              servings: 2,
              price: 780,
              accentColor: '#2E7D32',
            };

            setDaysData((prev) => {
              const day = prev[selectedDayId];
              return {
                ...prev,
                [selectedDayId]: {
                  ...day,
                  meals: [...day.meals, newMeal],
                  total: day.total + 780,
                  unplanned: null,
                },
              };
            });
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const handleFabPress = () => {
    Alert.alert(
      'Plan a Meal',
      `Add a meal to ${currentDayData.dayName}`,
      [
        {
          text: 'Add Creamy Pumpkin Pasta',
          onPress: handleSuggestMeal,
        },
        {
          text: 'Browse Recipes',
          onPress: () => onNavigateHome && onNavigateHome(),
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

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
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[Colors.primary]}
            tintColor={Colors.primary}
          />
        }
      >
        {/* Weekly Budget Banner */}
        <WeeklyBudgetCard
          target={budget?.weeklyBudget || 10000}
          spent={budgetSpent}
          status={budgetSpent <= (budget?.weeklyBudget || 10000) ? 'ON TRACK' : 'OVER BUDGET'}
        />

        {loading && (
          <View style={{ paddingVertical: 20, alignItems: 'center' }}>
            <ActivityIndicator size="small" color={Colors.primary} />
            <Text style={{ fontSize: 13, color: Colors.textSecondary, marginTop: 6 }}>
              Syncing meal plan from server...
            </Text>
          </View>
        )}

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

        {/* Empty meals placeholder if none planned */}
        {currentDayData.meals.length === 0 && !loading && (
          <View style={{ padding: 24, alignItems: 'center', backgroundColor: '#F9FAFB', marginHorizontal: 16, borderRadius: 16, marginBottom: 16 }}>
            <Ionicons name="calendar-outline" size={32} color="#9CA3AF" />
            <Text style={{ fontSize: 14, fontWeight: '600', color: Colors.textPrimary, marginTop: 8 }}>
              No meals planned for {currentDayData.dayName}
            </Text>
            <Text style={{ fontSize: 12, color: Colors.textSecondary, textAlign: 'center', marginTop: 4 }}>
              Tap '+' below or browse recipes to add meals to your schedule.
            </Text>
          </View>
        )}

        {/* Unplanned Meal State (e.g. Dinner not planned) */}
        {currentDayData.unplanned && (
          <UnplannedMealCard
            mealType={currentDayData.unplanned.type}
            title={currentDayData.unplanned.title}
            subtitle="You have ingredients left in your pantry."
            buttonText="Suggest a Meal"
            onSuggestMeal={handleSuggestMeal}
          />
        )}

        {/* Extra scroll padding to clear bottom nav & FAB */}
        <View style={{ height: 90 }} />
      </ScrollView>

      {/* Floating Action Button (+) */}
      <TouchableOpacity
        style={styles.fab}
        onPress={handleFabPress}
        activeOpacity={0.88}
        accessibilityRole="button"
        accessibilityLabel="Plan a new meal"
      >
        <Ionicons name="add" size={32} color="#FFFFFF" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    letterSpacing: -0.2,
  },
  sectionTotal: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.terracottaDeep,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.terracottaDeep,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
    zIndex: 10,
  },
});
