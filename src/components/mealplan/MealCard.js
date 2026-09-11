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

export default function MealCard({
  mealType = 'BREAKFAST',
  title = 'Avocado & Egg Toast',
  image = require('../../../assets/avocado_sourdough.jpg'),
  badgeType = 'match', // 'match' or 'tag'
  badgeText = '95% Match',
  servings = 2,
  price = 850,
  accentColor = '#F59E0B',
  onPress,
  onOptionsPress,
}) {
  return (
    <TouchableOpacity
      style={[styles.card, { borderLeftColor: accentColor }]}
      onPress={onPress}
      activeOpacity={0.88}
      accessibilityRole="button"
      accessibilityLabel={`${mealType}: ${title}, ${servings} Servings, Rs ${price}`}
    >
      {/* Top Header: Meal Type & 3-dots Menu */}
      <View style={styles.topRow}>
        <Text style={styles.mealType}>{mealType.toUpperCase()}</Text>
        <TouchableOpacity
          style={styles.menuBtn}
          onPress={onOptionsPress}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          activeOpacity={0.7}
        >
          <Ionicons name="ellipsis-vertical" size={17} color={Colors.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* Dish Title */}
      <Text style={styles.title} numberOfLines={1}>
        {title}
      </Text>

      {/* Bottom Content Row */}
      <View style={styles.contentRow}>
        <Image
          source={
            typeof image === 'string' && (image.startsWith('http') || image.startsWith('data:'))
              ? { uri: image }
              : image || require('../../../assets/avocado_sourdough.jpg')
          }
          style={styles.thumbnail}
        />

        <View style={styles.middleInfo}>
          {badgeType === 'match' ? (
            <View style={styles.matchBadge}>
              <Ionicons name="shield-checkmark-outline" size={12} color={Colors.matchGreen} />
              <Text style={styles.matchText}>{badgeText}</Text>
            </View>
          ) : (
            <View style={styles.tagBadge}>
              <Text style={styles.tagText}>{badgeText}</Text>
            </View>
          )}

          <Text style={styles.servingsText}>{servings} Servings</Text>
        </View>

        <View style={styles.priceContainer}>
          <Text style={styles.price}>Rs  {price.toLocaleString()}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 14,
    padding: 14,
    borderLeftWidth: 4.5,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: 'rgba(0, 0, 0, 0.05)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 2,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  mealType: {
    fontSize: 11,
    fontWeight: '800',
    color: '#4B5563',
    letterSpacing: 0.6,
  },
  menuBtn: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    letterSpacing: -0.2,
    marginBottom: 10,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  thumbnail: {
    width: 68,
    height: 68,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
  },
  middleInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  matchBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.matchGreenBg,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  matchText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.matchGreen,
  },
  tagBadge: {
    backgroundColor: '#FFF8F5',
    borderWidth: 1,
    borderColor: '#FEE8DC',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  tagText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  servingsText: {
    fontSize: 13.5,
    color: Colors.textPrimary,
    fontWeight: '500',
    marginTop: 8,
  },
  priceContainer: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    marginLeft: 8,
  },
  price: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
});
