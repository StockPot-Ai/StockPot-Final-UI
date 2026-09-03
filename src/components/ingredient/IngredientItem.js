import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Colors from '../../constants/colors';

export default function IngredientItem({
  name,
  quantity,
  unit,
  cost,
  inPantry = false,
  iconName = 'nutrition-outline',
  iconLib = 'Ionicons',
  iconBg = '#FFF3EB',
  iconColor = '#C2410C',
  isSelected = true,
  onToggle,
}) {
  return (
    <TouchableOpacity
      style={[styles.container, isSelected && styles.containerSelected]}
      onPress={onToggle}
      activeOpacity={0.7}
    >
      {/* Icon */}
      <View style={[styles.iconContainer, { backgroundColor: iconBg }]}>
        {iconLib === 'MaterialCommunityIcons' ? (
          <MaterialCommunityIcons name={iconName} size={20} color={iconColor} />
        ) : (
          <Ionicons name={iconName} size={20} color={iconColor} />
        )}
      </View>

      {/* Details */}
      <View style={styles.info}>
        <View style={styles.nameRow}>
          <Text style={styles.name} numberOfLines={1}>
            {name}
          </Text>
          {inPantry && (
            <View style={styles.pantryBadge}>
              <Ionicons name="checkmark-circle" size={12} color={Colors.primary} />
              <Text style={styles.pantryText}>In Pantry</Text>
            </View>
          )}
        </View>
        <Text style={styles.quantity}>
          {quantity} {unit}
        </Text>
      </View>

      {/* Cost & Selection */}
      <View style={styles.rightSide}>
        <Text style={styles.cost}>Rs {cost}</Text>
        <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
          {isSelected && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  containerSelected: {
    borderColor: '#FED7AA',
    backgroundColor: '#FFFDFB',
  },
  iconContainer: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  info: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 3,
  },
  name: {
    fontSize: 14.5,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  pantryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  pantryText: {
    fontSize: 10.5,
    color: Colors.primaryDark,
    fontWeight: '600',
  },
  quantity: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  rightSide: {
    alignItems: 'flex-end',
    gap: 6,
    marginLeft: 8,
  },
  cost: {
    fontSize: 13.5,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: Colors.terracotta,
    borderColor: Colors.terracotta,
  },
});
