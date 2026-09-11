import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, StatusBar } from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import Colors from '../../constants/colors';

const AccountHeader = ({ onBack, onLeafPress }) => {
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
        <Feather name="arrow-left" size={24} color={Colors.accountTextPrimary} />
      </TouchableOpacity>

      <Text style={styles.title}>StockPot AI</Text>

      <TouchableOpacity
        style={styles.actionBtn}
        onPress={onLeafPress}
        activeOpacity={0.7}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        accessibilityLabel="Eco info"
        accessibilityRole="button"
      >
        <MaterialCommunityIcons name="leaf" size={24} color="#374151" />
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
    backgroundColor: Colors.accountBg,
  },
  actionBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 21,
    fontWeight: '800',
    color: Colors.terracotta,
    letterSpacing: -0.4,
  },
});

export default AccountHeader;
