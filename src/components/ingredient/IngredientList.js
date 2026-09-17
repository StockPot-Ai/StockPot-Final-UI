import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import IngredientItem from './IngredientItem';
import Colors from '../../constants/colors';

export default function IngredientList({
  ingredients = [],
  servings = 2,
  baseServings = 4,
  selectedIds = [],
  onToggleItem,
  onSelectAll,
}) {
  const safeList = Array.isArray(ingredients) ? ingredients : [];
  const safeSelected = Array.isArray(selectedIds) ? selectedIds : [];
  const allSelected = safeList.length > 0 && safeSelected.length === safeList.length;

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.title}>Ingredients</Text>
          <Text style={styles.subtitle}>{safeList.length} items needed</Text>
        </View>
        {safeList.length > 0 && (
          <TouchableOpacity
            onPress={onSelectAll}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.selectAllText}>
              {allSelected ? 'Deselect All' : 'Select All'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {safeList.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No ingredients listed for this meal.</Text>
        </View>
      ) : (
        <View style={styles.list}>
          {safeList.map((item, index) => {
            // Scale quantity proportionally by servings
            const baseCount = Number(baseServings) || 4;
            const scaledQuantity = Math.round((((Number(item.baseQuantity) || 100) * (Number(servings) || 1)) / baseCount) * 10) / 10;
            const scaledCost = Math.round(((Number(item.baseCost) || 150) * (Number(servings) || 1)) / baseCount);
            const itemId = String(item.id || item.name || `ing-${index}`);
            const isSelected = safeSelected.includes(itemId) || (item.id && safeSelected.includes(String(item.id)));

            return (
              <IngredientItem
                key={itemId}
                name={item.name || 'Ingredient'}
                quantity={scaledQuantity}
                unit={item.unit || 'g'}
                cost={scaledCost}
                image={item.image || item.image_url}
                inPantry={item.inPantry}
                iconName={item.iconName}
                iconLib={item.iconLib}
                iconBg={item.iconBg}
                iconColor={item.iconColor}
                isSelected={isSelected}
                onToggle={() => onToggleItem && onToggleItem(itemId)}
              />
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 24,
    paddingHorizontal: 20,
    marginBottom: 16,
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
  emptyContainer: {
    paddingVertical: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  emptyText: {
    fontSize: 13,
    color: '#9CA3AF',
  },
});
