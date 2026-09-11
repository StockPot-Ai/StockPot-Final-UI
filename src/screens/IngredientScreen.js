import React, { useState, useEffect, useCallback } from 'react';
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
  const [data, setData] = useState(recipe || {});
  const [servings, setServings] = useState(recipe?.servings || 2);
  const [ingredients, setIngredients] = useState(recipe?.ingredients || []);
  const [loading, setLoading] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [ingredientFilter, setIngredientFilter] = useState('all');

  const fetchIngredients = useCallback(async (recipeId, currentServings) => {
    if (!recipeId) return;
    setLoading(true);
    try {
      const res = await recipeService.getRecipeIngredients(recipeId, currentServings);
      const ingredientList = Array.isArray(res) ? res : res?.ingredients || [];
      if (ingredientList.length > 0) {
        setIngredients(
          ingredientList.map((ing, idx) => ({
            id: ing.id || `ing-${idx}`,
            name: ing.name || ing.ingredient_name,
            baseQuantity: ing.quantity || ing.base_quantity || 100,
            unit: ing.unit || 'g',
            baseCost: ing.cost || ing.base_cost || ing.price || 100,
            inPantry: ing.in_pantry ?? ing.available ?? false,
            iconName: ing.icon || 'food-apple',
            iconLib: 'MaterialCommunityIcons',
            iconBg: ing.in_pantry ? '#ECFDF5' : '#FFF7ED',
            iconColor: ing.in_pantry ? '#059669' : '#EA580C',
          }))
        );
      }
    } catch (err) {
      console.log('[IngredientScreen] Note on ingredients fetch:', err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (recipe) {
      setData(recipe);
      if (recipe.ingredients && recipe.ingredients.length > 0) {
        setIngredients(recipe.ingredients);
        setSelectedIds(recipe.ingredients.map((i) => i.id));
      } else if (recipe.id) {
        fetchIngredients(recipe.id, servings);
      }
    }
  }, [recipe, fetchIngredients]);

  useEffect(() => {
    if (ingredients.length > 0 && selectedIds.length === 0) {
      setSelectedIds(ingredients.map((i) => i.id));
    }
  }, [ingredients]);

  const handleServingsChange = (newServings) => {
    setServings(newServings);
    if (data.id) {
      fetchIngredients(data.id, newServings);
    }
  };

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
      .reduce((acc, item) => acc + ((item.baseCost || 100) * servings) / 2, 0)
  );

  // Filtered ingredients
  const displayedIngredients = ingredients.filter((item) => {
    if (ingredientFilter === 'available') return item.inPantry;
    return true;
  });

  const availableCount = ingredients.filter((i) => i.inPantry).length;

  const handleAddToMealPlan = async () => {
    const payload = {
      recipe_id: data.id,
      title: data.title || data.name || 'Recipe',
      servings,
      cost: totalCost,
      meal_type: 'LUNCH',
      day: 'mon',
      ingredients: ingredients.filter((i) => selectedIds.includes(i.id)),
    };

    try {
      const currentPlan = await mealPlanService.getCurrentMealPlan();
      if (currentPlan && currentPlan.id) {
        await mealPlanService.addItem(currentPlan.id, payload);
      }
    } catch (err) {
      console.log('[IngredientScreen] Direct meal plan add note:', err.message);
    }

    if (onAddToMealPlan) {
      onAddToMealPlan(payload);
    } else {
      Alert.alert(
        'Added to Meal Plan',
        `${data.title || data.name || 'Recipe'} (${servings} servings, Rs ${totalCost}) was added to your meal plan.`,
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
        cost: Math.round(((item.baseCost || 100) * servings) / 2),
      }));
    onCompare(items);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Top Hero Image Header with Navigation Buttons and Recipe Meta */}
        <IngredientHeader
          title={data.title || data.name}
          rating={data.rating || '4.5'}
          time={data.prep_time || data.time || '20 min'}
          calories={data.calories ? `${data.calories} kcal` : '450 kcal'}
          image={data.image || data.image_url}
          onBack={onBack}
          onFavorite={() => setIsFavorite(!isFavorite)}
          isFavorite={isFavorite}
        />

        {loading && (
          <View style={{ paddingVertical: 16, alignItems: 'center' }}>
            <ActivityIndicator size="small" color={Colors.primary} />
            <Text style={{ fontSize: 12, color: Colors.textSecondary, marginTop: 4 }}>
              Loading ingredients...
            </Text>
          </View>
        )}

        {/* Available Ingredients Section */}
        <AvailableIngredientsCard
          availableCount={availableCount}
          totalCount={ingredients.length}
          availableItems={
            data.availableItems ||
            ingredients.filter((i) => i.inPantry).map((i) => i.name)
          }
          onFilterChange={setIngredientFilter}
        />

        {/* Description Section */}
        <DescriptionCard description={data.description || 'A delicious, wholesome recipe prepared with fresh ingredients.'} />

        {/* Servings Stepper Control */}
        <ServingsControl
          servings={servings}
          onServingsChange={handleServingsChange}
          min={1}
          max={10}
        />

        {/* Ingredient List with Scaled Quantities and Costs */}
        <IngredientList
          ingredients={displayedIngredients}
          servings={servings}
          selectedIds={selectedIds}
          onToggleItem={handleToggleItem}
          onSelectAll={handleSelectAll}
        />

        {/* Compare prices across stores action */}
        <TouchableOpacity
          style={styles.compareBar}
          onPress={handleCompare}
          activeOpacity={0.85}
        >
          <Ionicons name="pricetags-outline" size={18} color={Colors.terracottaDark} />
          <Text style={styles.compareText}>Compare prices across stores</Text>
          <Ionicons name="arrow-forward" size={18} color={Colors.terracottaDark} />
        </TouchableOpacity>
      </ScrollView>

      {/* Floating Bottom CTA Button */}
      <AddToMealPlanBar cost={totalCost} onPress={handleAddToMealPlan} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  compareBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginHorizontal: 20,
    marginTop: 12,
    marginBottom: 100,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.terracottaDark,
    backgroundColor: '#FFF4EE',
  },
  compareText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.terracottaDark,
    letterSpacing: -0.2,
  },
});
