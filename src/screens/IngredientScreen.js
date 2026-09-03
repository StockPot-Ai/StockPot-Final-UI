import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  StatusBar,
  Alert,
} from 'react-native';
import Colors from '../constants/colors';
import IngredientHeader from '../components/ingredient/IngredientHeader';
import AvailableIngredientsCard from '../components/ingredient/AvailableIngredientsCard';
import DescriptionCard from '../components/ingredient/DescriptionCard';
import ServingsControl from '../components/ingredient/ServingsControl';
import IngredientList from '../components/ingredient/IngredientList';
import AddToMealPlanBar from '../components/ingredient/AddToMealPlanBar';

const INITIAL_INGREDIENTS = [
  {
    id: '1',
    name: 'Rigatoni Pasta',
    baseQuantity: 200,
    unit: 'g',
    baseCost: 160,
    inPantry: true,
    iconName: 'pasta',
    iconLib: 'MaterialCommunityIcons',
    iconBg: '#FFF7ED',
    iconColor: '#EA580C',
  },
  {
    id: '2',
    name: 'Roasted Pumpkin Puree',
    baseQuantity: 200,
    unit: 'g',
    baseCost: 140,
    inPantry: true,
    iconName: 'pumpkin',
    iconLib: 'MaterialCommunityIcons',
    iconBg: '#FEF3C7',
    iconColor: '#D97706',
  },
  {
    id: '3',
    name: 'Heavy Cream',
    baseQuantity: 80,
    unit: 'ml',
    baseCost: 110,
    inPantry: false,
    iconName: 'cup-outline',
    iconLib: 'MaterialCommunityIcons',
    iconBg: '#EFF6FF',
    iconColor: '#2563EB',
  },
  {
    id: '4',
    name: 'Fresh Sage Leaves',
    baseQuantity: 8,
    unit: 'leaves',
    baseCost: 60,
    inPantry: false,
    iconName: 'leaf',
    iconLib: 'Ionicons',
    iconBg: '#ECFDF5',
    iconColor: '#059669',
  },
  {
    id: '5',
    name: 'Grated Parmesan',
    baseQuantity: 40,
    unit: 'g',
    baseCost: 130,
    inPantry: true,
    iconName: 'cheese',
    iconLib: 'MaterialCommunityIcons',
    iconBg: '#FEF9C3',
    iconColor: '#CA8A04',
  },
  {
    id: '6',
    name: 'Garlic Cloves',
    baseQuantity: 2,
    unit: 'cloves',
    baseCost: 20,
    inPantry: true,
    iconName: 'flower-outline',
    iconLib: 'Ionicons',
    iconBg: '#F3E8FF',
    iconColor: '#9333EA',
  },
  {
    id: '7',
    name: 'Extra Virgin Olive Oil',
    baseQuantity: 1.5,
    unit: 'tbsp',
    baseCost: 40,
    inPantry: true,
    iconName: 'water-outline',
    iconLib: 'Ionicons',
    iconBg: '#ECFCCB',
    iconColor: '#65A30D',
  },
  {
    id: '8',
    name: 'Toasted Walnuts',
    baseQuantity: 30,
    unit: 'g',
    baseCost: 120,
    inPantry: false,
    iconName: 'seed-outline',
    iconLib: 'MaterialCommunityIcons',
    iconBg: '#FFEDD5',
    iconColor: '#C2410C',
  },
];

export default function IngredientScreen({ recipe, onBack, onAddToMealPlan }) {
  const recipeTitle = recipe?.title || 'Creamy Pumpkin Pasta';
  const recipeImage = recipe?.image || require('../../assets/creamy_pumpkin_pasta.jpg');

  const [servings, setServings] = useState(recipe?.servings || 2);
  const [isFavorite, setIsFavorite] = useState(true);
  const [selectedIds, setSelectedIds] = useState(
    INITIAL_INGREDIENTS.map((item) => item.id)
  );
  const [ingredientFilter, setIngredientFilter] = useState('all');

  const handleToggleItem = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === INITIAL_INGREDIENTS.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(INITIAL_INGREDIENTS.map((i) => i.id));
    }
  };

  // Calculate total cost based on servings and selected ingredients
  const totalCost = Math.round(
    INITIAL_INGREDIENTS.filter((item) => selectedIds.includes(item.id)).reduce(
      (acc, item) => acc + (item.baseCost * servings) / 2,
      0
    )
  );

  // Filtered ingredients
  const displayedIngredients = INITIAL_INGREDIENTS.filter((item) => {
    if (ingredientFilter === 'available') return item.inPantry;
    return true;
  });

  const availableCount = INITIAL_INGREDIENTS.filter((i) => i.inPantry).length;

  const handleAddToMealPlan = () => {
    if (onAddToMealPlan) {
      onAddToMealPlan({
        title: 'Creamy Pumpkin Pasta',
        servings,
        cost: totalCost,
        ingredients: INITIAL_INGREDIENTS.filter((i) => selectedIds.includes(i.id)),
      });
    } else {
      Alert.alert(
        'Added to Meal Plan',
        `Creamy Pumpkin Pasta (${servings} servings, Rs ${totalCost}) was added to your meal plan.`,
        [{ text: 'OK' }]
      );
    }
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
          title={recipeTitle}
          rating="4.5"
          time="20 min"
          calories="450 kcal"
          image={recipeImage}
          onBack={onBack}
          onFavorite={() => setIsFavorite(!isFavorite)}
          isFavorite={isFavorite}
        />

        {/* Available Ingredients Section */}
        <AvailableIngredientsCard
          availableCount={availableCount}
          totalCount={INITIAL_INGREDIENTS.length}
          availableItems={['Rigatoni Pasta', 'Pumpkin Puree', 'Garlic', 'Olive Oil']}
          onFilterChange={setIngredientFilter}
        />

        {/* Description Section */}
        <DescriptionCard
          description="A comforting, autumnal classic made with roasted pumpkin puree, a touch of cream, and fresh sage. This quick 20-minute recipe delivers a rich, velvety sauce that perfectly coats your favorite pasta. Ideal for a cozy weeknight dinner."
        />

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
});
