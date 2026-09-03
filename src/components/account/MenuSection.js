import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import Colors from '../../constants/colors';

export const MenuItem = ({ icon, label, onPress, isLast }) => (
  <View>
    <TouchableOpacity
      style={styles.itemRow}
      onPress={onPress}
      activeOpacity={0.65}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <View style={styles.iconWrap}>{icon}</View>
      <Text style={styles.itemLabel}>{label}</Text>
      <Feather name="chevron-right" size={18} color="#6B7280" />
    </TouchableOpacity>
    {!isLast && <View style={styles.divider} />}
  </View>
);

export const MenuSection = ({ title, children }) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>{title}</Text>
    <View style={styles.card}>{children}</View>
  </View>
);

const styles = StyleSheet.create({
  section: {
    marginBottom: 20,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.accountSectionHeader,
    letterSpacing: 0.8,
    marginBottom: 8,
    marginLeft: 2,
  },
  card: {
    backgroundColor: Colors.accountCardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.accountBorder,
    shadowColor: 'rgba(0,0,0,0.03)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 5,
    elevation: 2,
    overflow: 'hidden',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  iconWrap: {
    width: 32,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  itemLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: Colors.accountTextPrimary,
    letterSpacing: -0.2,
  },
  divider: {
    height: 1,
    backgroundColor: '#F3ECE4',
    marginLeft: 48,
    marginRight: 16,
  },
});

export default MenuSection;
