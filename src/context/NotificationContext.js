import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import notificationService, { NOTIFICATION_TYPES, PRESET_TEST_NOTIFICATIONS } from '../services/notificationService';

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [activeBanner, setActiveBanner] = useState(null);
  const [notificationsModalVisible, setNotificationsModalVisible] = useState(false);
  const bannerTimerRef = useRef(null);

  // Load notifications from local storage on mount
  const loadNotifications = useCallback(async () => {
    const list = await notificationService.getNotifications();
    setNotifications(list);
  }, []);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const dismissBanner = useCallback(() => {
    if (bannerTimerRef.current) {
      clearTimeout(bannerTimerRef.current);
      bannerTimerRef.current = null;
    }
    setActiveBanner(null);
  }, []);

  const sendNotification = useCallback(
    async ({ title, message, type = NOTIFICATION_TYPES.SYSTEM, action = null, data = null, showBanner = true }) => {
      const res = await notificationService.addNotification({
        title,
        message,
        type,
        action,
        data,
      });

      if (res && res.newNotification) {
        setNotifications(res.all);

        if (showBanner) {
          dismissBanner();
          setActiveBanner(res.newNotification);
          // Auto-dismiss after 4.5 seconds
          bannerTimerRef.current = setTimeout(() => {
            setActiveBanner(null);
          }, 4500);
        }
        return res.newNotification;
      }
      return null;
    },
    [dismissBanner]
  );

  // Test notification trigger for Admin Mode testing
  const triggerTestNotification = useCallback(
    async (presetIdOrCustom) => {
      let payload;
      if (typeof presetIdOrCustom === 'string') {
        const found = PRESET_TEST_NOTIFICATIONS.find((p) => p.id === presetIdOrCustom);
        payload = found || PRESET_TEST_NOTIFICATIONS[0];
      } else if (typeof presetIdOrCustom === 'object' && presetIdOrCustom !== null) {
        payload = presetIdOrCustom;
      } else {
        payload = PRESET_TEST_NOTIFICATIONS[0];
      }

      return await sendNotification({
        title: payload.title,
        message: payload.message,
        type: payload.type || NOTIFICATION_TYPES.DEAL,
        action: payload.action || 'test',
        showBanner: true,
      });
    },
    [sendNotification]
  );

  const markAsRead = useCallback(async (id) => {
    const updated = await notificationService.markAsRead(id);
    setNotifications(updated);
  }, []);

  const markAllAsRead = useCallback(async () => {
    const updated = await notificationService.markAllAsRead();
    setNotifications(updated);
  }, []);

  const deleteNotification = useCallback(async (id) => {
    const updated = await notificationService.deleteNotification(id);
    setNotifications(updated);
  }, []);

  const clearAll = useCallback(async () => {
    const updated = await notificationService.clearAll();
    setNotifications(updated);
  }, []);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        activeBanner,
        notificationsModalVisible,
        setNotificationsModalVisible,
        sendNotification,
        triggerTestNotification,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        clearAll,
        dismissBanner,
        openNotificationCenter: () => setNotificationsModalVisible(true),
        closeNotificationCenter: () => setNotificationsModalVisible(false),
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export default NotificationContext;
