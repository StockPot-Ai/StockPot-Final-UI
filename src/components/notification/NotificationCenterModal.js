import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Platform,
  Dimensions,
} from 'react-native';
import { Ionicons, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNotifications } from '../../context/NotificationContext';
import Colors from '../../constants/colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const FILTER_TABS = [
  { id: 'all', label: 'All' },
  { id: 'unread', label: 'Unread' },
  { id: 'deal', label: 'Deals 💰' },
  { id: 'meal', label: 'Meals 🍳' },
  { id: 'milestone', label: 'Savings 🎯' },
  { id: 'system', label: 'Updates 🔔' },
];

const getNotificationTheme = (type) => {
  switch (type) {
    case 'deal':
      return {
        icon: 'pricetag',
        color: '#E8A93F',
        bg: '#FEF6EB',
        border: '#E8DFD8',
        badge: 'PRICE DROP',
      };
    case 'meal':
      return {
        icon: 'restaurant',
        color: '#3A6847',
        bg: '#EAF3EC',
        border: '#E8DFD8',
        badge: 'MEAL PREP',
      };
    case 'milestone':
      return {
        icon: 'trophy',
        color: '#E8A93F',
        bg: '#FEF6EB',
        border: '#E8DFD8',
        badge: 'MILESTONE',
      };
    case 'shopping':
      return {
        icon: 'cart',
        color: '#3A6847',
        bg: '#EAF3EC',
        border: '#E8DFD8',
        badge: 'GROCERY BASKET',
      };
    case 'admin':
      return {
        icon: 'shield-checkmark',
        color: '#2B2420',
        bg: '#F5EFEB',
        border: '#E8DFD8',
        badge: 'SYSTEM',
      };
    default:
      return {
        icon: 'notifications',
        color: '#3A6847',
        bg: '#FAF8F5',
        border: '#E8DFD8',
        badge: 'UPDATE',
      };
  }
};

const formatTimeAgo = (timestamp) => {
  if (!timestamp) return 'Just now';
  const diffMs = Date.now() - new Date(timestamp).getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  return `${diffDays}d ago`;
};

const NotificationCenterModal = () => {
  const {
    notifications,
    unreadCount,
    notificationsModalVisible,
    closeNotificationCenter,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
  } = useNotifications();

  const [activeTab, setActiveTab] = useState('all');

  const filteredNotifications = notifications.filter((item) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'unread') return !item.read;
    return item.type === activeTab;
  });

  return (
    <Modal
      visible={notificationsModalVisible}
      animationType="slide"
      transparent
      onRequestClose={closeNotificationCenter}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.sheetContainer}>
          {/* Grabber */}
          <View style={styles.grabberWrap}>
            <View style={styles.grabber} />
          </View>

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.titleRow}>
                <Text style={styles.headerTitle}>Notifications</Text>
                {unreadCount > 0 && (
                  <View style={styles.unreadPill}>
                    <Text style={styles.unreadPillText}>{unreadCount} new</Text>
                  </View>
                )}
              </View>
              <Text style={styles.headerSubtitle}>
                Stay updated on deals, meal alerts & savings
              </Text>
            </View>

            <View style={styles.headerActions}>
              <TouchableOpacity
                onPress={closeNotificationCenter}
                style={styles.closeBtn}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={18} color="#6B7280" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Filter Tabs */}
          <View style={styles.filterScrollWrap}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterTabsContainer}
            >
              {FILTER_TABS.map((tab) => {
                const isActive = activeTab === tab.id;
                let count = 0;
                if (tab.id === 'all') count = notifications.length;
                else if (tab.id === 'unread') count = unreadCount;
                else count = notifications.filter((n) => n.type === tab.id).length;

                return (
                  <TouchableOpacity
                    key={tab.id}
                    style={[styles.filterTab, isActive && styles.filterTabActive]}
                    onPress={() => setActiveTab(tab.id)}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[styles.filterTabText, isActive && styles.filterTabTextActive]}
                    >
                      {tab.label}
                    </Text>
                    {count > 0 && (
                      <View
                        style={[
                          styles.tabCountBadge,
                          isActive && styles.tabCountBadgeActive,
                        ]}
                      >
                        <Text
                          style={[
                            styles.tabCountText,
                            isActive && styles.tabCountTextActive,
                          ]}
                        >
                          {count}
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Action Bar (Mark all read / Clear) */}
          <View style={styles.subActionsBar}>
            <Text style={styles.itemCountSummary}>
              Showing {filteredNotifications.length} notification
              {filteredNotifications.length === 1 ? '' : 's'}
            </Text>
            <View style={styles.subActionsRight}>
              {unreadCount > 0 && (
                <TouchableOpacity
                  onPress={markAllAsRead}
                  style={styles.actionLinkBtn}
                  activeOpacity={0.7}
                >
                  <Ionicons name="checkmark-done" size={15} color="#007A3D" />
                  <Text style={styles.actionLinkText}>Mark read</Text>
                </TouchableOpacity>
              )}
              {notifications.length > 0 && (
                <TouchableOpacity
                  onPress={clearAll}
                  style={styles.actionLinkBtn}
                  activeOpacity={0.7}
                >
                  <Ionicons name="trash-outline" size={14} color="#DC2626" />
                  <Text style={[styles.actionLinkText, { color: '#DC2626' }]}>Clear</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Notification List */}
          <ScrollView
            style={styles.scrollList}
            contentContainerStyle={styles.scrollListContent}
            showsVerticalScrollIndicator={false}
          >
            {filteredNotifications.length === 0 ? (
              <View style={styles.emptyWrap}>
                <View style={styles.emptyIconCircle}>
                  <Ionicons name="notifications-off-outline" size={32} color="#9CA3AF" />
                </View>
                <Text style={styles.emptyTitle}>All caught up!</Text>
                <Text style={styles.emptySub}>
                  {activeTab === 'unread'
                    ? 'No unread notifications at the moment.'
                    : 'No alerts in this category.'}
                </Text>
                <TouchableOpacity
                  style={styles.testAlertEmptyBtn}
                  onPress={closeNotificationCenter}
                  activeOpacity={0.85}
                >
                  <Ionicons name="checkmark-outline" size={15} color="#007A3D" />
                  <Text style={styles.testAlertEmptyBtnText}>Back to App</Text>
                </TouchableOpacity>
              </View>
            ) : (
              filteredNotifications.map((item) => {
                const theme = getNotificationTheme(item.type);
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.notifCard,
                      !item.read && styles.notifCardUnread,
                      { borderColor: !item.read ? theme.border : '#F3F4F6' },
                    ]}
                    onPress={() => markAsRead(item.id)}
                    activeOpacity={0.88}
                  >
                    <View style={[styles.cardIconWrap, { backgroundColor: theme.bg }]}>
                      <Ionicons name={theme.icon} size={19} color={theme.color} />
                    </View>

                    <View style={styles.cardContent}>
                      <View style={styles.cardTopRow}>
                        <View
                          style={[
                            styles.typeBadge,
                            { backgroundColor: theme.bg },
                          ]}
                        >
                          <Text style={[styles.typeBadgeText, { color: theme.color }]}>
                            {theme.badge}
                          </Text>
                        </View>
                        <View style={styles.cardTimeWrap}>
                          <Text style={styles.cardTimeText}>{formatTimeAgo(item.timestamp)}</Text>
                          {!item.read && <View style={styles.unreadDot} />}
                        </View>
                      </View>

                      <Text
                        style={[
                          styles.cardTitle,
                          !item.read && styles.cardTitleUnread,
                        ]}
                      >
                        {item.title}
                      </Text>
                      <Text style={styles.cardMessage}>{item.message}</Text>
                    </View>

                    <TouchableOpacity
                      style={styles.cardDeleteBtn}
                      onPress={() => deleteNotification(item.id)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      activeOpacity={0.6}
                    >
                      <Ionicons name="close" size={16} color="#9CA3AF" />
                    </TouchableOpacity>
                  </TouchableOpacity>
                );
              })
            )}
          </ScrollView>

          {/* Done button */}
          <View style={styles.footerWrap}>
            <TouchableOpacity
              style={styles.doneBtn}
              onPress={closeNotificationCenter}
              activeOpacity={0.85}
            >
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
    backgroundColor: 'rgba(0,0,0,0.48)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '92%',
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.15,
    shadowRadius: 18,
    elevation: 12,
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
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 10,
  },
  headerLeft: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: -0.4,
  },
  unreadPill: {
    backgroundColor: '#007A3D',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  unreadPillText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  headerActions: {
    marginLeft: 12,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  adminStudioBanner: {
    marginHorizontal: 16,
    marginBottom: 10,
    backgroundColor: '#F5F3FF',
    borderWidth: 1.5,
    borderColor: '#DDD6FE',
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  adminBannerIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EDE9FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  adminBannerTextWrap: {
    flex: 1,
  },
  adminBannerTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6D28D9',
  },
  adminBannerSub: {
    fontSize: 11,
    color: '#7C3AED',
    marginTop: 1,
  },
  adminLaunchBtn: {
    backgroundColor: '#7C3AED',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  adminLaunchBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  adminPromoStrip: {
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingVertical: 7,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  adminPromoText: {
    fontSize: 11.5,
    color: '#6B7280',
    flex: 1,
  },
  adminPromoBold: {
    fontWeight: '700',
    color: '#7C3AED',
  },
  filterScrollWrap: {
    marginBottom: 8,
  },
  filterTabsContainer: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: 14,
    backgroundColor: '#F3F4F6',
  },
  filterTabActive: {
    backgroundColor: '#007A3D',
  },
  filterTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4B5563',
  },
  filterTabTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  tabCountBadge: {
    backgroundColor: '#E5E7EB',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 8,
  },
  tabCountBadgeActive: {
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  tabCountText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4B5563',
  },
  tabCountTextActive: {
    color: '#FFFFFF',
  },
  subActionsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  itemCountSummary: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  subActionsRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  actionLinkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
  },
  actionLinkText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#007A3D',
  },
  scrollList: {
    maxHeight: 380,
  },
  scrollListContent: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 20,
    gap: 10,
  },
  emptyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 44,
    paddingHorizontal: 20,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 4,
  },
  emptySub: {
    fontSize: 13,
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 16,
  },
  testAlertEmptyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#E8F8F0',
    borderWidth: 1,
    borderColor: '#C6F0DC',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },
  testAlertEmptyBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#007A3D',
  },
  notifCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FAFAFA',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1.5,
    borderColor: '#F3F4F6',
    gap: 12,
  },
  notifCardUnread: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  cardIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  cardContent: {
    flex: 1,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  typeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  typeBadgeText: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  cardTimeWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cardTimeText: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  unreadDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#007A3D',
  },
  cardTitle: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#374151',
    lineHeight: 18,
    marginBottom: 3,
  },
  cardTitleUnread: {
    fontWeight: '700',
    color: '#111827',
  },
  cardMessage: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 16.5,
  },
  cardDeleteBtn: {
    padding: 4,
  },
  footerWrap: {
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  doneBtn: {
    paddingVertical: 13,
    borderRadius: 14,
    backgroundColor: '#007A3D',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#007A3D',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 2,
  },
  doneBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
});

export default NotificationCenterModal;
