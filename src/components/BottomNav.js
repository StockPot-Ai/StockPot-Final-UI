import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../constants/colors';

const NAV_ITEMS = [
  { id: 'Home', icon: 'home', label: 'Home' },
  { id: 'Savings', icon: 'wallet-outline', label: 'Savings' },
  { id: 'MealPlan', icon: 'calendar-outline', label: 'Meal Plan' },
  { id: 'Shopping', icon: 'cart-outline', label: 'Shopping' },
  { id: 'Profile', icon: 'person-outline', label: 'Profile' },
];

const BottomNav = ({ activeNav, onNavChange }) => {
  return (
    <View style={styles.bottomNav}>
      {NAV_ITEMS.map((item) => {
        const isActive = item.id === activeNav;
        return (
          <TouchableOpacity
            key={item.id}
            style={styles.navItem}
            onPress={() => onNavChange(item.id)}
            activeOpacity={0.7}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            accessibilityLabel={item.label}
          >
            <View style={[styles.navIconWrap, isActive && styles.navIconWrapActive]}>
              <Ionicons
                name={item.icon}
                size={22}
                color={isActive ? Colors.primary : Colors.tabInactive}
              />
            </View>
            <Text style={[styles.navLabel, isActive && styles.navLabelActive]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  bottomNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: Colors.tabBackground,
    paddingVertical: 8,
    paddingBottom: Platform.OS === 'ios' ? 20 : 10,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    shadowColor: 'rgba(0,0,0,0.06)',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 10,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
  },
  navIconWrap: {
    width: 44,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navIconWrapActive: {
    backgroundColor: Colors.milestoneCard,
  },
  navLabel: {
    fontSize: 11,
    color: Colors.tabInactive,
    fontWeight: '500',
  },
  navLabelActive: {
    color: Colors.tabActive,
    fontWeight: '600',
  },
});

export default BottomNav;
