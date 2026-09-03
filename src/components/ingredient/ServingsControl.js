import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../constants/colors';

export default function ServingsControl({
  servings = 2,
  onServingsChange,
  min = 1,
  max = 12,
}) {
  const handleDecrement = () => {
    if (servings > min && onServingsChange) {
      onServingsChange(servings - 1);
    }
  };

  const handleIncrement = () => {
    if (servings < max && onServingsChange) {
      onServingsChange(servings + 1);
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.left}>
        <Text style={styles.title}>Servings</Text>
      </View>

      <View style={styles.stepperPill}>
        <TouchableOpacity
          style={[styles.stepperBtn, servings <= min && styles.stepperBtnDisabled]}
          onPress={handleDecrement}
          disabled={servings <= min}
          activeOpacity={0.6}
          accessibilityLabel="Decrease servings"
        >
          <Ionicons
            name="remove"
            size={18}
            color={servings <= min ? '#CBD5E1' : '#4B5563'}
          />
        </TouchableOpacity>

        <Text style={styles.servingsCount}>{servings}</Text>

        <TouchableOpacity
          style={[styles.stepperBtn, servings >= max && styles.stepperBtnDisabled]}
          onPress={handleIncrement}
          disabled={servings >= max}
          activeOpacity={0.6}
          accessibilityLabel="Increase servings"
        >
          <Ionicons
            name="add"
            size={18}
            color={servings >= max ? '#CBD5E1' : '#4B5563'}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFF8F5',
    borderRadius: 16,
    marginHorizontal: 20,
    marginTop: 20,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#FEEFE7',
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  stepperPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 12,
  },
  stepperBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperBtnDisabled: {
    opacity: 0.5,
  },
  servingsCount: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    minWidth: 20,
    textAlign: 'center',
  },
});
