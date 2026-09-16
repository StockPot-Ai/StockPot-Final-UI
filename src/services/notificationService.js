import AsyncStorage from '../utils/safeStorage';
import { apiClient } from './api';

const NOTIFICATIONS_STORAGE_KEY = '@stockpot_notifications_list';

export const NOTIFICATION_TYPES = {
  DEAL: 'deal',
  MEAL: 'meal',
  MILESTONE: 'milestone',
  SHOPPING: 'shopping',
  COMMUNITY: 'community',
  SYSTEM: 'system',
  ADMIN: 'admin',
};

const INITIAL_NOTIFICATIONS = [
  {
    id: 'notif_welcome',
    title: 'Welcome to StockPot! 🎉',
    message: 'Start meal planning and compare prices across Keells, Cargills & Glomark to save big this week.',
    type: NOTIFICATION_TYPES.SYSTEM,
    timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 mins ago
    read: false,
    action: 'explore',
  },
  {
    id: 'notif_milestone',
    title: 'Weekly Milestone Update 🎯',
    message: 'Great start! You have already saved Rs. 1,250 this week. Keep up the home-cooking streak!',
    type: NOTIFICATION_TYPES.MILESTONE,
    timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(), // 2 hours ago
    read: false,
    action: 'savings',
  },
  {
    id: 'notif_deal_keells',
    title: 'Smart Price Drop Alert ⚡',
    message: 'Supermarket Deal: Fresh Red Dhal & Samba Rice are 15% off today nearby in your local area.',
    type: NOTIFICATION_TYPES.DEAL,
    timestamp: new Date(Date.now() - 1000 * 60 * 360).toISOString(), // 6 hours ago
    read: false,
    action: 'retail',
  },
  {
    id: 'notif_chef_dish',
    title: 'Chef Kasun shared a dish 👨‍🍳',
    message: 'New recipe added: Traditional Sri Lankan Fish Ambul Thiyal. Tap to view ingredients.',
    type: NOTIFICATION_TYPES.COMMUNITY,
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
    read: true,
    action: 'recipe',
  },
];

export const PRESET_TEST_NOTIFICATIONS = [
  {
    id: 'test_deal',
    title: '🔥 Keells Super Price Drop Alert',
    message: 'Basmati Rice 5kg price dropped from Rs. 1,450 to Rs. 1,180 (Save Rs. 270)!',
    type: NOTIFICATION_TYPES.DEAL,
  },
  {
    id: 'test_meal',
    title: '🍳 Dinner Prep Reminder',
    message: 'Time to prepare: Sri Lankan Dhal Curry & Pol Roti in 30 mins for your family.',
    type: NOTIFICATION_TYPES.MEAL,
  },
  {
    id: 'test_milestone',
    title: '🏆 Savings Milestone Unlocked!',
    message: 'Congratulations! You reached 100% of your weekly savings target (Rs. 5,000 saved).',
    type: NOTIFICATION_TYPES.MILESTONE,
  },
  {
    id: 'test_shopping',
    title: '🛒 Weekly Grocery Shopping Reminder',
    message: 'Your weekly shopping basket is ready with lowest prices across 3 nearby stores. Review and compare now!',
    type: NOTIFICATION_TYPES.SHOPPING,
  },
  {
    id: 'test_admin_broadcast',
    title: '🛡️ Admin System Broadcast',
    message: 'StockPot 2.0 Maintenance Complete: Live GPS store comparing is now active island-wide.',
    type: NOTIFICATION_TYPES.ADMIN,
  },
];

export const notificationService = {
  getNotifications: async () => {
    try {
      const stored = await AsyncStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
      // Initialize with defaults if empty
      await AsyncStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(INITIAL_NOTIFICATIONS));
      return INITIAL_NOTIFICATIONS;
    } catch (err) {
      console.log('[NotificationService] Load error:', err.message);
      return INITIAL_NOTIFICATIONS;
    }
  },

  addNotification: async (item) => {
    try {
      const current = await notificationService.getNotifications();
      const newNotification = {
        id: item.id || `notif_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        title: item.title || 'StockPot Notification',
        message: item.message || '',
        type: item.type || NOTIFICATION_TYPES.SYSTEM,
        timestamp: item.timestamp || new Date().toISOString(),
        read: false,
        action: item.action || null,
        data: item.data || null,
      };

      const updated = [newNotification, ...current];
      await AsyncStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(updated));
      return { newNotification, all: updated };
    } catch (err) {
      console.log('[NotificationService] Add error:', err.message);
      return null;
    }
  },

  markAsRead: async (id) => {
    try {
      const current = await notificationService.getNotifications();
      const updated = current.map((n) => (n.id === id ? { ...n, read: true } : n));
      await AsyncStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(updated));

      // Mark as read in database / backend
      try {
        await apiClient.put(`/notifications/${id}/read`);
      } catch (_) {
        try {
          await apiClient.patch(`/notifications/${id}`, { is_read: true, read: true });
        } catch (_) {}
      }

      return updated;
    } catch (err) {
      return [];
    }
  },

  markAllAsRead: async () => {
    try {
      const current = await notificationService.getNotifications();
      const updated = current.map((n) => ({ ...n, read: true }));
      await AsyncStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(updated));

      // Mark all as read in database / backend
      try {
        await apiClient.put('/notifications/read-all');
      } catch (_) {
        try {
          await apiClient.post('/notifications/mark-all-read');
        } catch (_) {}
      }

      return updated;
    } catch (err) {
      return [];
    }
  },

  deleteNotification: async (id) => {
    try {
      const current = await notificationService.getNotifications();
      const updated = current.filter((n) => n.id !== id);
      await AsyncStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(updated));

      // Delete from database / backend
      try {
        await apiClient.delete(`/notifications/${id}`);
      } catch (_) {}

      return updated;
    } catch (err) {
      return [];
    }
  },

  clearAll: async () => {
    try {
      await AsyncStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify([]));
      return [];
    } catch (err) {
      return [];
    }
  },

  getPresets: () => PRESET_TEST_NOTIFICATIONS,
};

export default notificationService;
