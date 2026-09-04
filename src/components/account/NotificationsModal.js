import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  Switch,
  StyleSheet,
  ScrollView,
  Platform,
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import Colors from '../../constants/colors';
import { useAccount } from '../../context/AccountContext';

const NotificationsModal = ({ visible, onClose }) => {
  const { notifications, toggleNotification } = useAccount();

  const toggleItems = [
    {
      key: 'mealPlanReminders',
      title: 'Meal Plan Reminders',
      desc: 'Receive alerts 30 minutes before your planned meals',
      icon: 'restaurant-outline',
    },
    {
      key: 'expiryAlerts',
      title: 'Ingredient Expiry Alerts',
      desc: 'Get notified 2 days before pantry items expire to prevent waste',
      icon: 'hourglass-outline',
    },
    {
      key: 'weeklySavingsReport',
      title: 'Weekly Savings Summary',
      desc: 'Weekly report on money saved and kg of food waste avoided',
      icon: 'trending-up-outline',
    },
    {
      key: 'smartGroceryTips',
      title: 'Smart Grocery Deals',
      desc: 'Notifications when ingredients on your list go on sale',
      icon: 'pricetag-outline',
    },
    {
      key: 'pushSound',
      title: 'Notification Sounds',
      desc: 'Play audio cues for recipe timer and reminder alerts',
      icon: 'volume-medium-outline',
    },
  ];

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.sheetContainer}>
          {/* Header */}
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Notification Preferences</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <Feather name="x" size={22} color="#4B5563" />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {toggleItems.map((item, index) => {
              const isEnabled = !!notifications[item.key];
              return (
                <View key={item.key}>
                  <View style={styles.toggleRow}>
                    <View style={styles.iconCircle}>
                      <Ionicons name={item.icon} size={20} color={Colors.forestGreen} />
                    </View>
                    <View style={styles.textWrap}>
                      <Text style={styles.toggleTitle}>{item.title}</Text>
                      <Text style={styles.toggleDesc}>{item.desc}</Text>
                    </View>
                    <Switch
                      value={isEnabled}
                      onValueChange={() => toggleNotification(item.key)}
                      trackColor={{ false: '#E5E7EB', true: Colors.forestGreen }}
                      thumbColor="#FFFFFF"
                    />
                  </View>
                  {index < toggleItems.length - 1 && <View style={styles.divider} />}
                </View>
              );
            })}
          </ScrollView>

          {/* Action Row */}
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.doneBtn} onPress={onClose} activeOpacity={0.8}>
              <Text style={styles.doneBtnText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    paddingBottom: Platform.OS === 'ios' ? 32 : 16,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3ECE4',
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.accountTextPrimary,
  },
  closeBtn: {
    padding: 4,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 12,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 12,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FAF7F2',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.accountBorder,
  },
  textWrap: {
    flex: 1,
  },
  toggleTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    color: Colors.accountTextPrimary,
    marginBottom: 2,
  },
  toggleDesc: {
    fontSize: 12,
    color: Colors.accountTextSecondary,
    lineHeight: 16,
  },
  divider: {
    height: 1,
    backgroundColor: '#F3ECE4',
  },
  actionRow: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  doneBtn: {
    paddingVertical: 13,
    borderRadius: 12,
    backgroundColor: Colors.forestGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

export default NotificationsModal;
