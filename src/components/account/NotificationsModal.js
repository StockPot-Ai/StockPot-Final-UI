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
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../constants/colors';
import { useAccount } from '../../context/AccountContext';

const NotificationsModal = ({ visible, onClose }) => {
  const { notifications, toggleNotification } = useAccount();

  const toggleItems = [
    {
      key: 'mealPlanReminders',
      title: 'Meal Plan Reminders',
      desc: 'Receive alerts 30 mins before your planned meals',
      icon: 'restaurant',
    },
    {
      key: 'expiryAlerts',
      title: 'Ingredient Expiry Alerts',
      desc: 'Notified 2 days before pantry items expire',
      icon: 'hourglass',
    },
    {
      key: 'weeklySavingsReport',
      title: 'Weekly Savings Summary',
      desc: 'Weekly report on money saved and waste avoided',
      icon: 'trending-up',
    },
    {
      key: 'smartGroceryTips',
      title: 'Smart Grocery Deals',
      desc: 'Alerts when ingredients on your list go on sale',
      icon: 'pricetag',
    },
    {
      key: 'pushSound',
      title: 'Notification Sounds',
      desc: 'Play audio cues for recipe timers and alerts',
      icon: 'volume-medium',
    },
  ];

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.sheetContainer}>
          {/* Apple Grabber Bar */}
          <View style={styles.grabberWrap}>
            <View style={styles.grabber} />
          </View>

          {/* Header */}
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Notifications</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <Ionicons name="close" size={18} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            <Text style={styles.sectionHeader}>ALERTS & NOTIFICATIONS</Text>
            <View style={styles.groupedCard}>
              {toggleItems.map((item, index) => {
                const isEnabled = !!notifications[item.key];
                const isLast = index === toggleItems.length - 1;
                return (
                  <View key={item.key}>
                    <View style={styles.toggleRow}>
                      <View style={styles.iconCircle}>
                        <Ionicons name={item.icon} size={18} color="#166534" />
                      </View>
                      <View style={styles.textWrap}>
                        <Text style={styles.toggleTitle}>{item.title}</Text>
                        <Text style={styles.toggleDesc}>{item.desc}</Text>
                      </View>
                      <Switch
                        value={isEnabled}
                        onValueChange={() => toggleNotification(item.key)}
                        trackColor={{ false: '#E5E5EA', true: '#166534' }}
                        thumbColor="#FFFFFF"
                      />
                    </View>
                    {!isLast && <View style={styles.separator} />}
                  </View>
                );
              })}
            </View>
          </ScrollView>

          {/* Action Row */}
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.doneBtn} onPress={onClose} activeOpacity={0.85}>
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
    backgroundColor: 'rgba(0,0,0,0.42)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#F9FAFB',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '90%',
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 8,
  },
  grabberWrap: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 4,
  },
  grabber: {
    width: 38,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#D1D5DB',
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 14,
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: -0.4,
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 6,
    paddingBottom: 14,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6B7280',
    letterSpacing: 0.6,
    marginBottom: 8,
    marginLeft: 4,
  },
  groupedCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: 'rgba(0,0,0,0.03)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 1,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    gap: 12,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F0FDF4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: {
    flex: 1,
    paddingRight: 8,
  },
  toggleTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 2,
  },
  toggleDesc: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 16,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#E5E7EB',
    marginLeft: 48,
  },
  actionRow: {
    paddingHorizontal: 18,
    paddingTop: 10,
  },
  doneBtn: {
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: '#166534',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#166534',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 2,
  },
  doneBtnText: {
    fontSize: 15.5,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
});

export default NotificationsModal;
