import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Platform,
  StatusBar,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Colors from '../../constants/colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const HERO_IMAGE_HEIGHT = Math.min(SCREEN_WIDTH * 0.95, 380);

export default function IngredientHeader({
  title = 'Creamy Pumpkin Pasta',
  rating = '4.5',
  time = '20 min',
  calories = '450 kcal',
  image = require('../../../assets/creamy_pumpkin_pasta.jpg'),
  onBack,
  onFavorite,
  isFavorite = true,
}) {
  return (
    <View style={styles.container}>
      <Image source={image} style={styles.image} resizeMode="cover" />

      {/* Subtle bottom dark gradient overlay for text readability */}
      <View style={styles.bottomOverlay}>
        <Text style={styles.title}>{title}</Text>
        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Ionicons name="star" size={15} color={Colors.starGold} />
            <Text style={styles.metaText}>{rating}</Text>
          </View>
          <Text style={styles.dot}>•</Text>
          <View style={styles.metaItem}>
            <Ionicons name="time-outline" size={15} color={Colors.textWhite} />
            <Text style={styles.metaText}>{time}</Text>
          </View>
          <Text style={styles.dot}>•</Text>
          <View style={styles.metaItem}>
            <MaterialCommunityIcons name="fire" size={17} color={Colors.textWhite} />
            <Text style={styles.metaText}>{calories}</Text>
          </View>
        </View>
      </View>

      {/* Floating Top Navigation Buttons */}
      <View style={styles.topNavRow}>
        <TouchableOpacity
          style={styles.circleBtn}
          onPress={onBack}
          activeOpacity={0.8}
          accessibilityLabel="Go back"
        >
          <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.circleBtn}
          onPress={onFavorite}
          activeOpacity={0.8}
          accessibilityLabel="Favorite recipe"
        >
          <Ionicons
            name={isFavorite ? 'heart' : 'heart-outline'}
            size={22}
            color={Colors.terracotta}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: SCREEN_WIDTH,
    height: HERO_IMAGE_HEIGHT,
    position: 'relative',
    backgroundColor: '#E5E7EB',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  topNavRow: {
    position: 'absolute',
    top: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 12 : 52,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 10,
  },
  circleBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 5,
    elevation: 5,
  },
  bottomOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 48,
    paddingBottom: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: Colors.textWhite,
    letterSpacing: -0.4,
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 13.5,
    fontWeight: '600',
    color: Colors.textWhite,
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  dot: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    marginHorizontal: 2,
  },
});
