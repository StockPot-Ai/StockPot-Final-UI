import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../constants/colors';
import MealPlanHeader from '../components/mealplan/MealPlanHeader';
import WeeklyBudgetCard from '../components/mealplan/WeeklyBudgetCard';
import DaySelector from '../components/mealplan/DaySelector';
import MealCard from '../components/mealplan/MealCard';
import UnplannedMealCard from '../components/mealplan/UnplannedMealCard';

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
        title: 'Roasted Pumpkin Soup',
        image: require('../../assets/creamy_pumpkin_pasta.jpg'),
        badgeType: 'match',
        badgeText: '98% Match',
        servings: 2,
        price: 750,
        accentColor: '#7C2D12',
      },
      {
        id: 'wed-3',
        type: 'DINNER',
        title: 'Creamy Pumpkin Pasta',
        image: require('../../assets/creamy_pumpkin_pasta.jpg'),
        badgeType: 'match',
        badgeText: '95% Match',
        servings: 2,
        price: 780,
        accentColor: '#2E7D32',
      },
    ],
  },
  thu: {
    dayName: "Thursday's Plan",
    total: 1950,
    meals: [
      {
        id: 'thu-1',
        type: 'BREAKFAST',
        title: 'Avocado & Egg Toast',
        image: require('../../assets/avocado_sourdough.jpg'),
        badgeType: 'match',
        badgeText: '92% Match',
        servings: 2,
        price: 850,
        accentColor: '#F59E0B',
      },
      {
        id: 'thu-2',
        type: 'LUNCH',
        title: 'Sri Lankan Chicken Curry',
        image: require('../../assets/sri_lankan_chicken_curry.jpg'),
        badgeType: 'tag',
        badgeText: 'High Protein',
        servings: 2,
        price: 1100,
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
    total: 2100,
    meals: [
      {
        id: 'fri-1',
        type: 'BREAKFAST',
        title: 'Berry Granola Bowl',
        image: require('../../assets/avocado_sourdough.jpg'),
        badgeType: 'match',
        badgeText: '90% Match',
        servings: 2,
        price: 800,
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
};

export default function MealPlanScreen({
  onSelectMeal,
  onNavigateHome,
}) {
  const [selectedDayId, setSelectedDayId] = useState('tue');
  const [daysData, setDaysData] = useState(INITIAL_DAYS_DATA);

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
          onPress: () => {
            setDaysData((prev) => {
              const updated = { ...prev };
              if (updated[selectedDayId]) {
                updated[selectedDayId] = {
                  ...updated[selectedDayId],
                  meals: updated[selectedDayId].meals.filter((m) => m.id !== meal.id),
                  total: updated[selectedDayId].total - meal.price,
                };
              }
              return updated;
            });
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
      >
        {/* Weekly Budget Banner */}
        <WeeklyBudgetCard
          target={15000}
          spent={11450}
          status="ON TRACK"
        />

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
