import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  Text,
  StyleSheet,
  StatusBar,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../constants/colors';
import IngredientHeader from '../components/ingredient/IngredientHeader';
import AvailableIngredientsCard from '../components/ingredient/AvailableIngredientsCard';
import DescriptionCard from '../components/ingredient/DescriptionCard';
import ServingsControl from '../components/ingredient/ServingsControl';
import IngredientList from '../components/ingredient/IngredientList';
import AddToMealPlanBar from '../components/ingredient/AddToMealPlanBar';
import { recipeService, mealPlanService } from '../services';

export default function IngredientScreen({ recipe, onBack, onAddToMealPlan, onCompare }) {
  const data = recipe || {};
  const [servings, setServings] = useState(data.base_servings || 2);
  const [isFavorite, setIsFavorite] = useState(true);
  const [loadingRecipe, setLoadingRecipe] = useState(false);
  const [recipeDetail, setRecipeDetail] = useState(data);

  // Normalize ingredients format
  const normalizeIngredients = (rawList = []) => {
    return rawList.map((item, idx) => ({
      id: item.ingredient_id || item.id || `ing-${idx}`,
      name: item.name,
      baseQuantity: item.base_quantity || item.quantity || 100,
      quantity: item.quantity || item.base_quantity || 100,
      unit: item.unit || 'g',
      baseCost: item.baseCost ?? (item.estimated_cost ? Math.round(item.estimated_cost / (item.base_servings || 2)) : 80),
      inPantry: Boolean(item.in_pantry ?? item.inPantry),
      iconName: item.iconName || 'food-apple-outline',
      iconLib: item.iconLib || 'MaterialCommunityIcons',
      iconBg: item.iconBg || '#FFF7ED',
      iconColor: item.iconColor || '#EA580C',
    }));
  };

  const [ingredients, setIngredients] = useState(
    normalizeIngredients(data.ingredients || [])
  );
  const [selectedIds, setSelectedIds] = useState(ingredients.map((item) => item.id));
  const [ingredientFilter, setIngredientFilter] = useState('all');

  // Load recipe details if only basic info was passed
  useEffect(() => {
    if (data.id && (!data.ingredients || data.ingredients.length === 0)) {
      setLoadingRecipe(true);
      recipeService
        .getRecipeById(data.id)
        .then((fullRecipe) => {
          if (fullRecipe) {
            setRecipeDetail(fullRecipe);
            const norm = normalizeIngredients(fullRecipe.ingredients || []);
            setIngredients(norm);
            setSelectedIds(norm.map((i) => i.id));
          }
        })
        .catch((err) => console.log('Recipe details note:', err.message))
        .finally(() => setLoadingRecipe(false));
    }
  }, [data.id]);

  // Load scaled ingredients when servings change
  useEffect(() => {
    if (data.id && data.id.includes('-')) {
      recipeService
        .getRecipeIngredients(data.id, servings)
        .then((result) => {
          if (result && Array.isArray(result.ingredients)) {
            const norm = normalizeIngredients(result.ingredients);
            setIngredients(norm);
          }
        })
        .catch((err) => console.log('Scaled ingredients note:', err.message));
    }
  }, [data.id, servings]);

  const handleToggleItem = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === ingredients.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(ingredients.map((i) => i.id));
    }
  };

  // Calculate total cost based on servings and selected ingredients
  const totalCost = Math.round(
    ingredients
      .filter((item) => selectedIds.includes(item.id))
      .reduce((acc, item) => acc + (item.baseCost * servings) / 2, 0)
  );

  // Filtered ingredients
  const displayedIngredients = ingredients.filter((item) => {
    if (ingredientFilter === 'available') return item.inPantry;
    return true;
  });

  const availableCount = ingredients.filter((i) => i.inPantry).length;

  const handleAddToMealPlan = async () => {
    try {
      // Try to add to backend meal plan
      const currentPlan = await mealPlanService.getCurrentMealPlan();
      if (currentPlan?.id) {
        const todayStr = new Date().toISOString().split('T')[0];
        await mealPlanService.addItem(currentPlan.id, {
          recipe_id: data.id || '22222222-0000-0000-0000-000000000001',
          meal_date: todayStr,
          meal_type: data.category || 'dinner',
          servings,
        });

        Alert.alert(
          'Added to Meal Plan',
          `${recipeDetail.title || recipeDetail.name || 'Recipe'} (${servings} servings, Rs ${totalCost}) was added to your weekly meal plan!`,
          [{ text: 'OK' }]
        );
        return;
      }
    } catch (err) {
      console.log('Meal plan API note:', err.message);
    }

    if (onAddToMealPlan) {
      onAddToMealPlan({
        title: recipeDetail.title || recipeDetail.name || 'Recipe',
        servings,
        cost: totalCost,
        ingredients: ingredients.filter((i) => selectedIds.includes(i.id)),
      });
    } else {
      Alert.alert(
        'Added to Meal Plan',
        `${recipeDetail.title || recipeDetail.name || 'Recipe'} (${servings} servings, Rs ${totalCost}) was added to your meal plan.`,
        [{ text: 'OK' }]
      );
    }
  };

  const handleCompare = () => {
    if (!onCompare) return;
    const items = ingredients
      .filter((item) => selectedIds.includes(item.id))
      .map((item) => ({
        id: item.id,
        name: item.name,
        quantity: Math.round(((item.baseQuantity * servings) / 2) * 10) / 10,
        unit: item.unit,
        cost: Math.round((item.baseCost * servings) / 2),
      }));
    onCompare(items);
  };

  const title = recipeDetail.title || recipeDetail.name || 'Recipe Details';
  const rating = recipeDetail.rating || '4.8';
  const time = recipeDetail.time || `${recipeDetail.prep_time || 25} min`;
  const calories = recipeDetail.calories ? `${recipeDetail.calories} kcal` : '350 kcal';
  const description = recipeDetail.description || 'Delicious home cooked meal with balanced nutrients and fresh ingredients.';
  const image = recipeDetail.image_url ? { uri: recipeDetail.image_url } : (recipeDetail.image || require('../../assets/creamy_pumpkin_pasta.jpg'));

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {loadingRecipe ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <IngredientHeader
            title={title}
            rating={rating}
            time={time}
            calories={calories}
            image={image}
            onBack={onBack}
            onFavorite={() => setIsFavorite(!isFavorite)}
            isFavorite={isFavorite}
          />

          <AvailableIngredientsCard
            availableCount={availableCount}
            totalCount={ingredients.length}
            availableItems={recipeDetail.availableItems || ['Yellow Onion', 'Garlic']}
            onFilterChange={setIngredientFilter}
          />

          <DescriptionCard description={description} />

          <ServingsControl
            servings={servings}
            onServingsChange={setServings}
            min={1}
            max={10}
          />

          <IngredientList
            ingredients={displayedIngredients}
            servings={servings}
            selectedIds={selectedIds}
            onToggleItem={handleToggleItem}
            onSelectAll={handleSelectAll}
          />

          <View style={styles.compareContainer}>
            <TouchableOpacity
              style={styles.compareBtn}
              onPress={handleCompare}
              activeOpacity={0.8}
            >
              <Ionicons name="cart-outline" size={20} color={Colors.primary} />
              <Text style={styles.compareBtnText}>Compare Retail Prices</Text>
              <Ionicons name="arrow-forward" size={16} color={Colors.primary} />
            </TouchableOpacity>
          </View>

          <View style={styles.bottomPadding} />
        </ScrollView>
      )}

      <AddToMealPlanBar
        totalCost={totalCost}
        onAddToMealPlan={handleAddToMealPlan}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F6F2',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  compareContainer: {
    paddingHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
  },
  compareBtn: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    shadowColor: 'rgba(0,0,0,0.04)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 2,
  },
  compareBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.primary,
  },
  bottomPadding: {
    height: 100,
  },
});
