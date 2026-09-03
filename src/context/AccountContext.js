import React, { createContext, useContext, useState } from 'react';

const AccountContext = createContext(null);

export const AccountProvider = ({ children }) => {
  // ── Profile State
  const [profile, setProfile] = useState({
    name: 'Ammar Dharma',
    email: 'ammar@example.com',
    phone: '+92 300 1234567',
    bio: 'Passionate home chef focused on zero-waste cooking.',
    ecoTitle: 'Eco Saver',
    streakDays: 7,
    currentXp: 2450,
    maxXp: 3000,
    moneySaved: 12450,
    wasteAvoided: 8.5,
  });

  // ── Household & Preferences State
  const [household, setHousehold] = useState({
    householdSize: 3,
    cookingSkill: 'Intermediate',
    prepTimeLimit: '30 mins',
    mealsPerDay: 3,
  });

  // ── Dietary Preferences State
  const [dietary, setDietary] = useState({
    selected: ['Halal', 'Low-Carb', 'High-Protein'],
    allergies: ['Shellfish'],
  });

  // ── Budget Settings State
  const [budget, setBudget] = useState({
    weeklyBudget: 15000,
    currency: 'Rs.',
    savingsGoal: 4000,
    alertThreshold: 85,
  });

  // ── Notifications Settings State
  const [notifications, setNotifications] = useState({
    mealPlanReminders: true,
    expiryAlerts: true,
    weeklySavingsReport: true,
    smartGroceryTips: true,
    pushSound: true,
  });

  // ── Privacy & Security State
  const [privacy, setPrivacy] = useState({
    biometricLogin: true,
    shareAnalytics: false,
    twoFactorAuth: false,
  });

  // ── Language State
  const [language, setLanguage] = useState('English');

  // ── Auth State
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // ── Actions
  const updateProfile = (fields) => {
    setProfile((prev) => ({ ...prev, ...fields }));
  };

  const updateHousehold = (fields) => {
    setHousehold((prev) => ({ ...prev, ...fields }));
  };

  const toggleDietaryPreference = (tag) => {
    setDietary((prev) => {
      const exists = prev.selected.includes(tag);
      return {
        ...prev,
        selected: exists
          ? prev.selected.filter((item) => item !== tag)
          : [...prev.selected, tag],
      };
    });
  };

  const updateBudget = (fields) => {
    setBudget((prev) => ({ ...prev, ...fields }));
  };

  const toggleNotification = (key) => {
    setNotifications((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const togglePrivacy = (key) => {
    setPrivacy((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const logout = () => {
    setIsLoggedIn(false);
  };

  const login = () => {
    setIsLoggedIn(true);
  };

  return (
    <AccountContext.Provider
      value={{
        profile,
        household,
        dietary,
        budget,
        notifications,
        privacy,
        language,
        isLoggedIn,
        updateProfile,
        updateHousehold,
        toggleDietaryPreference,
        updateBudget,
        toggleNotification,
        togglePrivacy,
        setLanguage,
        logout,
        login,
      }}
    >
      {children}
    </AccountContext.Provider>
  );
};

export const useAccount = () => {
  const context = useContext(AccountContext);
  if (!context) {
    throw new Error('useAccount must be used within an AccountProvider');
  }
  return context;
};
