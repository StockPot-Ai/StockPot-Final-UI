import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAccount } from '../context/AccountContext';

const NAV_ITEMS = [
  { id: 'Home', icon: 'home-outline', activeIcon: 'home', key: 'nav_home', label: 'Home' },
  { id: 'MealPlan', icon: 'calendar-outline', activeIcon: 'calendar', key: 'nav_meal_plan', label: 'Meal Plan' },
  { id: 'Savings', icon: 'wallet-outline', activeIcon: 'wallet', key: 'nav_savings', label: 'Savings' },
  { id: 'History', icon: 'receipt-outline', activeIcon: 'receipt', key: 'nav_history', label: 'History' },
  { id: 'Profile', icon: 'person-outline', activeIcon: 'person', key: 'nav_profile', label: 'Profile' },
];

const BottomNav = ({ activeNav, onNavChange }) => {
  const { t } = useAccount();

  return (
    <View style={styles.bottomNav}>
      {NAV_ITEMS.map((item) => {
        const isActive = item.id === activeNav;
        const translatedLabel = t ? t(item.key, item.label) : item.label;
        return (
          <TouchableOpacity
            key={item.id}
            style={styles.navItem}
            onPress={() => onNavChange(item.id)}
            activeOpacity={0.7}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            accessibilityLabel={translatedLabel}
          >
            <View style={[styles.navIconWrap, isActive && styles.navIconWrapActive]}>
              <Ionicons
                name={isActive ? item.activeIcon : item.icon}
                size={22}
                color={isActive ? '#3A6847' : '#968880'}
              />
            </View>
            <Text style={[styles.navLabel, isActive && styles.navLabelActive]}>
              {translatedLabel}
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
    borderTopColor: '#E8DFD8',
    shadowColor: '#2B2420',
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
    backgroundColor: '#EAF3EC',
  },
  navLabel: {
    fontSize: 10.5,
    color: '#968880',
    fontWeight: '500',
  },
  navLabelActive: {
    color: '#3A6847',
    fontWeight: '700',
  },
});

export default BottomNav;
