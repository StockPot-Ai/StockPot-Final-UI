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
        <Text style={styles.name} numberOfLines={1}>
          {name}
        </Text>
        <View style={styles.metaRow}>
          <Text style={styles.quantity}>
            {quantity} {unit}
          </Text>
          {inPantry && (
            <View style={styles.pantryBadge}>
              <Ionicons name="checkmark-circle" size={12} color={Colors.primary} />
              <Text style={styles.pantryText}>In Pantry</Text>
            </View>
          )}
        </View>
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
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: 'rgba(0,0,0,0.04)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 1,
  },
  containerSelected: {
    borderColor: '#FED7AA',
    backgroundColor: '#FFFDFB',
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textPrimary,
    letterSpacing: -0.2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 5,
  },
  pantryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 9,
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
    gap: 8,
    marginLeft: 10,
  },
  cost: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  checkbox: {
    width: 21,
    height: 21,
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
