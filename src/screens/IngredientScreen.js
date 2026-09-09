import React, { useState } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  Text,
  StyleSheet,
  StatusBar,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../constants/colors';
import IngredientHeader from '../components/ingredient/IngredientHeader';
import AvailableIngredientsCard from '../components/ingredient/AvailableIngredientsCard';
import DescriptionCard from '../components/ingredient/DescriptionCard';
import ServingsControl from '../components/ingredient/ServingsControl';
import IngredientList from '../components/ingredient/IngredientList';
import AddToMealPlanBar from '../components/ingredient/AddToMealPlanBar';

export default function IngredientScreen({ recipe, onBack, onAddToMealPlan, onCompare }) {
  // Fallback so the screen still renders if opened without a recipe.
  const defaultIngredients = [];
  const data = recipe || {};

  const ingredients = data.ingredients || defaultIngredients;

  const [servings, setServings] = useState(2);
  const [isFavorite, setIsFavorite] = useState(true);
  const [selectedIds, setSelectedIds] = useState(
    ingredients.map((item) => item.id)
  );
  const [ingredientFilter, setIngredientFilter] = useState('all');

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

  const handleAddToMealPlan = () => {
    if (onAddToMealPlan) {
      onAddToMealPlan({
        title: data.title || 'Recipe',
        servings,
        cost: totalCost,
        ingredients: ingredients.filter((i) => selectedIds.includes(i.id)),
      });
    } else {
      Alert.alert(
        'Added to Meal Plan',
        `${data.title || 'Recipe'} (${servings} servings, Rs ${totalCost}) was added to your meal plan.`,
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
          title={data.title}
          rating={data.rating}
          time={data.time}
          calories={data.calories}
          image={data.image}
          onBack={onBack}
          onFavorite={() => setIsFavorite(!isFavorite)}
          isFavorite={isFavorite}
        />

        {/* Available Ingredients Section */}
        <AvailableIngredientsCard
          availableCount={availableCount}
          totalCount={ingredients.length}
          availableItems={data.availableItems || []}
          onFilterChange={setIngredientFilter}
        />

        {/* Description Section */}
        <DescriptionCard description={data.description} />

        {/* Servings Stepper Control */}
        <ServingsControl
          servings={servings}
          onServingsChange={setServings}
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
