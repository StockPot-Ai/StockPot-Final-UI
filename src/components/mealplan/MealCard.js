import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../constants/colors';

const getMealImage = (img) => {
  if (img && typeof img === 'string' && (img.startsWith('http') || img.startsWith('data:'))) {
    return { uri: img };
  }
  return require('../../../assets/creamy_pumpkin_pasta.jpg');
};

export default function MealCard({
  mealType = 'LUNCH',
  title = 'Planned Dish',
  image,
  servings = 2,
  price = 450,
  calories = 420,
  protein = '18g',
  cookTime = '25m',
  accentColor = '#007A3D',
  onPress,
  onSwap,
  onRemove,
  onServingsChange,
}) {
  return (
    <View style={styles.cardContainer}>
      <TouchableOpacity
        style={styles.cardMain}
        onPress={onPress}
        activeOpacity={0.88}
      >
        <Image
          source={getMealImage(image)}
          style={styles.image}
        />

        <View style={styles.details}>
          <View style={styles.topRow}>
            <View style={[styles.typeBadge, { backgroundColor: `${accentColor}18` }]}>
              <Text style={[styles.typeText, { color: accentColor }]}>
                {mealType.toUpperCase()}
              </Text>
            </View>
            <Text style={styles.timeText}>⏱️ {cookTime}</Text>
          </View>

          <Text style={styles.title} numberOfLines={2}>
            {title}
          </Text>

          {/* Macros & Servings */}
          <View style={styles.metaRow}>
            <View style={styles.macroPill}>
              <Text style={styles.macroText}>{calories} kcal</Text>
            </View>
            <View style={styles.macroPill}>
              <Text style={styles.macroText}>{protein} protein</Text>
            </View>
          </View>

          {/* Pricing Row */}
          <View style={styles.priceRow}>
            <View>
              <Text style={styles.priceTotal}>Rs. {price.toLocaleString()}</Text>
              <Text style={styles.pricePerServing}>
                ~Rs. {servings > 0 ? Math.round(price / servings) : price}/serving
              </Text>
            </View>

            {/* Quick Actions */}
            <View style={styles.actionIconsRow}>
              {onSwap && (
                <TouchableOpacity
                  style={styles.actionIconBtn}
                  onPress={onSwap}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="swap-horizontal" size={16} color="#4B5563" />
                </TouchableOpacity>
              )}
              {onRemove && (
                <TouchableOpacity
                  style={[styles.actionIconBtn, styles.deleteBtn]}
                  onPress={onRemove}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="trash-outline" size={15} color="#DC2626" />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    marginHorizontal: 16,
    marginBottom: 12,
  },
  cardMain: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    flexDirection: 'row',
    padding: 12,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    gap: 12,
  },
  image: {
    width: 96,
    height: 96,
    borderRadius: 14,
    backgroundColor: '#F3F4F6',
  },
  details: {
    flex: 1,
    justifyContent: 'space-between',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  typeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  timeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
    marginVertical: 4,
    lineHeight: 18,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  macroPill: {
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  macroText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#4B5563',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 2,
  },
  priceTotal: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.primary,
  },
  pricePerServing: {
    fontSize: 10,
    color: '#9CA3AF',
  },
  actionIconsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionIconBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtn: {
    backgroundColor: '#FEF2F2',
  },
});
