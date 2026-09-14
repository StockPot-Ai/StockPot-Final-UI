import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, StatusBar } from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import Colors from '../../constants/colors';

const AccountHeader = ({ onBack, onSettingsPress }) => {
  return (
    <View style={styles.header}>
      <TouchableOpacity
        style={styles.actionBtn}
        onPress={onBack}
        activeOpacity={0.7}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        accessibilityLabel="Go back"
        accessibilityRole="button"
      >
        <Feather name="arrow-left" size={22} color="#111827" />
      </TouchableOpacity>

      <Text style={styles.title}>Account & Profile</Text>

      <TouchableOpacity
        style={styles.actionBtn}
        onPress={onSettingsPress}
        activeOpacity={0.7}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        accessibilityLabel="Settings"
        accessibilityRole="button"
      >
        <Ionicons name="settings-outline" size={21} color="#374151" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 8 : 12,
    paddingBottom: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  actionBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: -0.3,
  },
});

export default AccountHeader;
