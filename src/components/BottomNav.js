import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../constants/colors';

const NAV_ITEMS = [
  { id: 'Home', icon: 'home-outline', activeIcon: 'home', label: 'Home' },
  { id: 'MealPlan', icon: 'calendar-outline', activeIcon: 'calendar', label: 'Meal Plan' },
  { id: 'Savings', icon: 'wallet-outline', activeIcon: 'wallet', label: 'Savings' },
  { id: 'History', icon: 'receipt-outline', activeIcon: 'receipt', label: 'History' },
  { id: 'Profile', icon: 'person-outline', activeIcon: 'person', label: 'Profile' },
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
                name={isActive ? item.activeIcon : item.icon}
                size={22}
                color={isActive ? '#166534' : '#9CA3AF'}
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
    backgroundColor: '#FFFFFF',
    paddingVertical: 6,
    paddingBottom: Platform.OS === 'ios' ? 24 : 10,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 8,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  navIconWrap: {
    width: 44,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navIconWrapActive: {
    backgroundColor: '#DCFCE7',
  },
  navLabel: {
    fontSize: 10.5,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  navLabelActive: {
    color: '#166534',
    fontWeight: '700',
  },
});

export default BottomNav;
