import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Platform,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../constants/colors';

export default function MealPlanHeader({
  avatar = require('../../../assets/user_avatar.jpg'),
  title = 'Meal Plan',
  onNotificationPress,
  onAvatarPress,
}) {
  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={onAvatarPress} activeOpacity={0.8}>
        <Image source={avatar} style={styles.avatar} />
      </TouchableOpacity>

      <Text style={styles.title}>{title}</Text>

      <TouchableOpacity
        style={styles.bellBtn}
        onPress={onNotificationPress}
        activeOpacity={0.7}
        accessibilityLabel="Notifications"
      >
        <Ionicons name="notifications-outline" size={24} color={Colors.textPrimary} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 8 : 12,
    paddingBottom: 10,
    backgroundColor: '#FFFFFF',
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.terracottaDeep,
    letterSpacing: -0.3,
  },
  bellBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
