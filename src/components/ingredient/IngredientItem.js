import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Colors from '../../constants/colors';

const INGREDIENT_PHOTOS = {
  rice: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=150',
  basmati: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=150',
  samba: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=150',
  chicken: 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=150',
  meat: 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=150',
  onion: 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=150',
  tomato: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=150',
  potato: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=150',
  garlic: 'https://images.unsplash.com/photo-1615477550927-6ec7e3e78696?w=150',
  ginger: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=150',
  coconut: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=150',
  pol: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=150',
  dhal: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=150',
  parippu: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=150',
  lentil: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=150',
  egg: 'https://images.unsplash.com/photo-1587486913049-53fc88980cfc?w=150',
  chili: 'https://images.unsplash.com/photo-1588252303782-cb80119abd6d?w=150',
  oil: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=150',
  flour: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=150',
  milk: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=150',
  fish: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=150',
  seafood: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=150',
  carrot: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=150',
  lime: 'https://images.unsplash.com/photo-1590502593747-42a996133562?w=150',
  curry: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=150',
  spice: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=150',
  salt: 'https://images.unsplash.com/photo-1518110925495-5fe2fda0442c?w=150',
  sugar: 'https://images.unsplash.com/photo-1587735243615-c03f25aaff15?w=150',
};

const resolveIngredientPhoto = (name, customImage) => {
  if (customImage && typeof customImage === 'string' && customImage.startsWith('http')) {
    return customImage;
  }
  const lower = (name || '').toLowerCase();
  for (const [key, url] of Object.entries(INGREDIENT_PHOTOS)) {
    if (lower.includes(key)) return url;
  }
  return null;
};

export default function IngredientItem({
  name,
  quantity,
  unit,
  cost,
  image,
  inPantry = false,
  iconName = 'nutrition-outline',
  iconLib = 'Ionicons',
  iconBg = '#FFF3EB',
  iconColor = '#C2410C',
  isSelected = true,
  onToggle,
}) {
  const [imgError, setImgError] = useState(false);
  const resolvedImg = resolveIngredientPhoto(name, image);

  return (
    <TouchableOpacity
      style={[styles.container, isSelected && styles.containerSelected]}
      onPress={onToggle}
      activeOpacity={0.7}
    >
      {/* Ingredient Photo Thumbnail with fallback */}
      <View style={styles.thumbnailWrap}>
        {resolvedImg && !imgError ? (
          <Image
            source={{ uri: resolvedImg }}
            style={styles.thumbnailImg}
            resizeMode="cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <View style={[styles.iconContainer, { backgroundColor: iconBg }]}>
            {iconLib === 'MaterialCommunityIcons' ? (
              <MaterialCommunityIcons name={iconName} size={20} color={iconColor} />
            ) : (
              <Ionicons name={iconName} size={20} color={iconColor} />
            )}
          </View>
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
  thumbnailWrap: {
    marginRight: 14,
  },
  thumbnailImg: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
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
