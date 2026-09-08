import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import IngredientItem from './IngredientItem';
import Colors from '../../constants/colors';

export default function IngredientList({
  ingredients,
  servings = 2,
  selectedIds = [],
  onToggleItem,
  onSelectAll,
}) {
  const allSelected = selectedIds.length === ingredients.length;

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.title}>Ingredients</Text>
          <Text style={styles.subtitle}>{ingredients.length} items needed</Text>
        </View>
        <TouchableOpacity
          onPress={onSelectAll}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.selectAllText}>
            {allSelected ? 'Deselect All' : 'Select All'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.list}>
        {ingredients.map((item) => {
          // Scale quantity proportionally by servings (base recipe is 2 servings)
          const scaledQuantity = Math.round(((item.baseQuantity * servings) / 2) * 10) / 10;
          const scaledCost = Math.round((item.baseCost * servings) / 2);
          const isSelected = selectedIds.includes(item.id);

          return (
            <IngredientItem
              key={item.id}
              name={item.name}
              quantity={scaledQuantity}
              unit={item.unit}
              cost={scaledCost}
              inPantry={item.inPantry}
              iconName={item.iconName}
              iconLib={item.iconLib}
              iconBg={item.iconBg}
              iconColor={item.iconColor}
              isSelected={isSelected}
              onToggle={() => onToggleItem(item.id)}
            />
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 24,
    paddingHorizontal: 20,
    marginBottom: 100, // Bottom padding to ensure scroll clears floating CTA button
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 12.5,
    color: Colors.textSecondary,
    marginTop: 3,
  },
  selectAllText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primary,
  },
  list: {
    marginTop: 4,
  },
});
