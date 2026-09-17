import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Feather,
  Ionicons,
  FontAwesome5,
  MaterialCommunityIcons,
} from '@expo/vector-icons';
import Colors from '../constants/colors';
import AccountHeader from '../components/account/AccountHeader';
import ProfileCard from '../components/account/ProfileCard';
import StatGrid from '../components/account/StatGrid';
import { MenuSection, MenuItem } from '../components/account/MenuSection';
import EditProfileModal from '../components/account/EditProfileModal';
import HouseholdModal from '../components/account/HouseholdModal';
import DietaryPreferencesModal from '../components/account/DietaryPreferencesModal';
import BudgetSettingsModal from '../components/account/BudgetSettingsModal';
import NotificationsModal from '../components/account/NotificationsModal';
import PrivacySecurityModal from '../components/account/PrivacySecurityModal';
import LanguageModal from '../components/account/LanguageModal';
import HelpSupportModal from '../components/account/HelpSupportModal';
import StatDetailModal from '../components/account/StatDetailModal';
import LogoutDialog from '../components/account/LogoutDialog';
import PremiumUpgradeModal from '../components/account/PremiumUpgradeModal';
import ShopOwnerModal from '../components/store/ShopOwnerModal';
import ShopOwnerPortalScreen from './ShopOwnerPortalScreen';
import { useAccount } from '../context/AccountContext';
import { useNotifications } from '../context/NotificationContext';

const AccountScreen = ({ onBack, onNavigateHome }) => {
  const { isPremium, isPro, customerPlan, isShopOwner, businessPlan, language, t } = useAccount();
  const { unreadCount, openNotificationCenter } = useNotifications();

  // ── Modal Visibility States
  const [editProfileVisible, setEditProfileVisible] = useState(false);
  const [householdVisible, setHouseholdVisible] = useState(false);
  const [dietaryVisible, setDietaryVisible] = useState(false);
  const [budgetVisible, setBudgetVisible] = useState(false);
  const [notificationsVisible, setNotificationsVisible] = useState(false);
  const [privacyVisible, setPrivacyVisible] = useState(false);
  const [languageVisible, setLanguageVisible] = useState(false);
  const [helpVisible, setHelpVisible] = useState(false);
  const [logoutDialogVisible, setLogoutDialogVisible] = useState(false);
  const [selectedStat, setSelectedStat] = useState(null);

  // Premium & Shop Owner Modals / Screens
  const [premiumModalVisible, setPremiumModalVisible] = useState(false);
  const [shopOwnerRegisterVisible, setShopOwnerRegisterVisible] = useState(false);
  const [shopOwnerPortalVisible, setShopOwnerPortalVisible] = useState(false);

  if (shopOwnerPortalVisible) {
    return <ShopOwnerPortalScreen onBack={() => setShopOwnerPortalVisible(false)} />;
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.accountBg} />

      {/* Header */}
      <AccountHeader
        onBack={onBack || onNavigateHome}
        onSettingsPress={() => setPrivacyVisible(true)}
      />

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Profile Card */}
        <ProfileCard
          onEditProfile={() => setEditProfileVisible(true)}
          onStreakPress={() => setSelectedStat('streak')}
        />

        {/* 2x2 Stat Cards */}
        <StatGrid onSelectStat={(type) => setSelectedStat(type)} />

        {/* ── STOCKPOT MEMBERSHIPS & BUSINESS SECTION ── */}
        <MenuSection title="STOCKPOT ECOSYSTEM & TIERS">
          <MenuItem
            icon={<FontAwesome5 name="crown" size={17} color="#E8A93F" />}
            label={
              isPro
                ? "StockPot Pro (Active 👑)"
                : isPremium
                ? "StockPot Smart (Active ⭐)"
                : "Upgrade to Smart (Rs. 499) or Pro (Rs. 999)"
            }
            onPress={() => setPremiumModalVisible(true)}
          />
          <MenuItem
            icon={<MaterialCommunityIcons name="storefront-outline" size={20} color="#3A6847" />}
            label="Shop Owner Portal & Catalogue"
            onPress={() => setShopOwnerPortalVisible(true)}
          />
          <MenuItem
            icon={<Ionicons name="storefront-outline" size={19} color="#2B2420" />}
            label="Register a New Local Store"
            onPress={() => setShopOwnerRegisterVisible(true)}
            isLast
          />
        </MenuSection>

        {/* PERSONAL Section */}
        <MenuSection title={t ? t('personal', 'PERSONAL') : 'PERSONAL'}>
          <MenuItem
            icon={<Feather name="user" size={19} color="#2B2420" />}
            label={t ? t('edit_profile', 'Edit Profile') : 'Edit Profile'}
            onPress={() => setEditProfileVisible(true)}
          />
          <MenuItem
            icon={<Feather name="home" size={19} color="#2B2420" />}
            label={t ? t('household_pref', 'Household & Preferences') : 'Household & Preferences'}
            onPress={() => setHouseholdVisible(true)}
          />
          <MenuItem
            icon={
              <MaterialCommunityIcons
                name="silverware-fork-knife"
                size={19}
                color="#2B2420"
              />
            }
            label={t ? t('dietary_pref', 'Dietary Preferences') : 'Dietary Preferences'}
            onPress={() => setDietaryVisible(true)}
          />
          <MenuItem
            icon={
              <MaterialCommunityIcons
                name="wallet-outline"
                size={20}
                color="#2B2420"
              />
            }
            label={t ? t('budget_settings', 'Budget Settings') : 'Budget Settings'}
            onPress={() => setBudgetVisible(true)}
            isLast
          />
        </MenuSection>

        {/* APP Section */}
        <MenuSection title={t ? t('app_notifications', 'APP & NOTIFICATIONS') : 'APP & NOTIFICATIONS'}>
          <MenuItem
            icon={<Ionicons name="notifications-outline" size={20} color="#2B2420" />}
            label={unreadCount > 0 ? `${t ? t('notification_center', 'Notification Center') : 'Notification Center'} (${unreadCount})` : (t ? t('notification_center', 'Notification Center') : 'Notification Center')}
            onPress={openNotificationCenter}
          />
          <MenuItem
            icon={<Ionicons name="options-outline" size={20} color="#2B2420" />}
            label={t ? t('notification_pref', 'Notification Preferences') : 'Notification Preferences'}
            onPress={() => setNotificationsVisible(true)}
          />
          <MenuItem
            icon={<Ionicons name="shield-outline" size={20} color="#2B2420" />}
            label={t ? t('privacy_security', 'Privacy & Security') : 'Privacy & Security'}
            onPress={() => setPrivacyVisible(true)}
          />
          <MenuItem
            icon={<Ionicons name="globe-outline" size={20} color="#2B2420" />}
            label={`${t ? t('language', 'Language') : 'Language'}: ${language || 'English'}`}
            onPress={() => setLanguageVisible(true)}
          />
          <MenuItem
            icon={<Ionicons name="help-circle-outline" size={20} color="#2B2420" />}
            label={t ? t('help_support', 'Help & Support') : 'Help & Support'}
            onPress={() => setHelpVisible(true)}
            isLast
          />
        </MenuSection>

        {/* Log Out Row */}
        <TouchableOpacity
          style={styles.logoutRow}
          onPress={() => setLogoutDialogVisible(true)}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={t ? t('log_out', 'Log Out') : 'Log Out'}
        >
          <Feather name="log-out" size={19} color={Colors.terracotta} />
          <Text style={styles.logoutText}>{t ? t('log_out', 'Log Out') : 'Log Out'}</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* ── Interactive Modals ── */}
      <PremiumUpgradeModal
        visible={premiumModalVisible}
        onClose={() => setPremiumModalVisible(false)}
      />

      <ShopOwnerModal
        visible={shopOwnerRegisterVisible}
        onClose={() => setShopOwnerRegisterVisible(false)}
        onShopRegistered={() => setShopOwnerPortalVisible(true)}
      />

      <EditProfileModal
        visible={editProfileVisible}
        onClose={() => setEditProfileVisible(false)}
      />

      <HouseholdModal
        visible={householdVisible}
        onClose={() => setHouseholdVisible(false)}
      />

      <DietaryPreferencesModal
        visible={dietaryVisible}
        onClose={() => setDietaryVisible(false)}
      />

      <BudgetSettingsModal
        visible={budgetVisible}
        onClose={() => setBudgetVisible(false)}
      />

      <NotificationsModal
        visible={notificationsVisible}
        onClose={() => setNotificationsVisible(false)}
      />

      <PrivacySecurityModal
        visible={privacyVisible}
        onClose={() => setPrivacyVisible(false)}
      />

      <LanguageModal
        visible={languageVisible}
        onClose={() => setLanguageVisible(false)}
      />

      <HelpSupportModal
        visible={helpVisible}
        onClose={() => setHelpVisible(false)}
      />

      <StatDetailModal
        visible={!!selectedStat}
        statType={selectedStat}
        onClose={() => setSelectedStat(null)}
      />

      <LogoutDialog
        visible={logoutDialogVisible}
        onCancel={() => setLogoutDialogVisible(false)}
        onConfirm={() => {
          setLogoutDialogVisible(false);
          if (onNavigateHome) onNavigateHome();
        }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.accountBg,
  },
  scrollView: {
    flex: 1,
    backgroundColor: Colors.accountBg,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  logoutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 6,
    marginBottom: 20,
    paddingVertical: 10,
  },
  logoutText: {
    fontSize: 15.5,
    fontWeight: '700',
    color: Colors.terracotta,
    letterSpacing: -0.2,
  },
});

export default AccountScreen;
