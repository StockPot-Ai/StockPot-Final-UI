import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import {
  Feather,
  Ionicons,
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
import EcoInfoModal from '../components/account/EcoInfoModal';
import BottomNav from '../components/BottomNav';

const AccountScreen = ({ onBack, onNavigateHome }) => {
  const handleNavChange = (id) => {
    if (id === 'Home' && onNavigateHome) {
      onNavigateHome();
    }
  };

  // ── Modal Visibility States
  const [editProfileVisible, setEditProfileVisible] = useState(false);
  const [householdVisible, setHouseholdVisible] = useState(false);
  const [dietaryVisible, setDietaryVisible] = useState(false);
  const [budgetVisible, setBudgetVisible] = useState(false);
  const [notificationsVisible, setNotificationsVisible] = useState(false);
  const [privacyVisible, setPrivacyVisible] = useState(false);
  const [languageVisible, setLanguageVisible] = useState(false);
  const [helpVisible, setHelpVisible] = useState(false);
  const [ecoInfoVisible, setEcoInfoVisible] = useState(false);
  const [logoutDialogVisible, setLogoutDialogVisible] = useState(false);
  const [selectedStat, setSelectedStat] = useState(null);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.accountBg} />

      {/* Header */}
      <AccountHeader
        onBack={onBack || onNavigateHome}
        onLeafPress={() => setEcoInfoVisible(true)}
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
          onEcoPress={() => setEcoInfoVisible(true)}
        />

        {/* 2x2 Stat Cards */}
        <StatGrid onSelectStat={(type) => setSelectedStat(type)} />

        {/* PERSONAL Section */}
        <MenuSection title="PERSONAL">
          <MenuItem
            icon={<Feather name="user" size={19} color="#292524" />}
            label="Edit Profile"
            onPress={() => setEditProfileVisible(true)}
          />
          <MenuItem
            icon={<Feather name="home" size={19} color="#292524" />}
            label="Household & Preferences"
            onPress={() => setHouseholdVisible(true)}
          />
          <MenuItem
            icon={
              <MaterialCommunityIcons
                name="silverware-fork-knife"
                size={19}
                color="#292524"
              />
            }
            label="Dietary Preferences"
            onPress={() => setDietaryVisible(true)}
          />
          <MenuItem
            icon={
              <MaterialCommunityIcons
                name="wallet-outline"
                size={20}
                color="#292524"
              />
            }
            label="Budget Settings"
            onPress={() => setBudgetVisible(true)}
            isLast
          />
        </MenuSection>

        {/* APP Section */}
        <MenuSection title="APP">
          <MenuItem
            icon={<Ionicons name="notifications-outline" size={20} color="#292524" />}
            label="Notifications"
            onPress={() => setNotificationsVisible(true)}
          />
          <MenuItem
            icon={<Ionicons name="shield-outline" size={20} color="#292524" />}
            label="Privacy & Security"
            onPress={() => setPrivacyVisible(true)}
          />
          <MenuItem
            icon={<Ionicons name="globe-outline" size={20} color="#292524" />}
            label="Language"
            onPress={() => setLanguageVisible(true)}
          />
          <MenuItem
            icon={<Ionicons name="help-circle-outline" size={20} color="#292524" />}
            label="Help & Support"
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
          accessibilityLabel="Log Out"
        >
          <Feather name="log-out" size={19} color={Colors.terracotta} />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>

        {/* Bottom spacing */}
        <View style={{ height: 28 }} />
      </ScrollView>

      {/* ── Bottom Navigation ── */}
      <BottomNav activeNav="Profile" onNavChange={handleNavChange} />

      {/* ── Interactive Modals ── */}
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

      <EcoInfoModal
        visible={ecoInfoVisible}
        onClose={() => setEcoInfoVisible(false)}
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
    paddingBottom: 10,
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
