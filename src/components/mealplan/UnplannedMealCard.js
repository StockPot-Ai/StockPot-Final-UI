import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Colors from '../../constants/colors';

export default function UnplannedMealCard({
  mealType = 'Dinner',
  title = 'Dinner not planned',
  subtitle = 'You have ingredients left in your pantry.',
  buttonText = 'Suggest a Meal',
  onSuggestMeal,
}) {
  return (
    <View style={styles.card}>
      {/* Centered Cutlery Icon */}
      <View style={styles.iconCircle}>
        <MaterialCommunityIcons
          name="silverware-fork-knife"
          size={20}
          color={Colors.textPrimary}
        />
      </View>

      {/* Title & Pantry Subtext */}
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>

      {/* Suggest a Meal Button */}
      <TouchableOpacity
        style={styles.suggestBtn}
        onPress={onSuggestMeal}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel={buttonText}
      >
        <Text style={styles.suggestBtnText}>{buttonText}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1.5,
    borderColor: '#F2D7C7',
    borderStyle: 'dashed',
    borderRadius: 18,
    backgroundColor: '#FFFDFB',
    marginHorizontal: 16,
    paddingVertical: 22,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginBottom: 20,
  },
  iconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F0ECE8',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    letterSpacing: -0.2,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: '#4B5563',
    marginBottom: 16,
    textAlign: 'center',
  },
  suggestBtn: {
    borderWidth: 1.5,
    borderColor: Colors.primary,
    borderRadius: 24,
    paddingVertical: 10,
    paddingHorizontal: 28,
    backgroundColor: '#FFFFFF',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 1,
  },
  suggestBtnText: {
    fontSize: 14.5,
    fontWeight: '700',
    color: Colors.primary,
  },
});
