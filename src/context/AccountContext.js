import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService, profileService } from '../services';
import { setAuthToken } from '../services/api';

const AccountContext = createContext(null);

export const AccountProvider = ({ children }) => {
  // ── Profile State
  const [profile, setProfile] = useState({
    id: '00000000-0000-0000-0000-000000000001',
    name: 'Ammar Dharma',
    email: 'ammar@example.com',
    phone: '+94 77 123 4567',
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
    householdSize: 4,
    cookingSkill: 'Intermediate',
    prepTimeLimit: '30 mins',
    mealsPerDay: 3,
  });

  // ── Dietary Preferences State
  const [dietary, setDietary] = useState({
    selected: ['Halal', 'High-Protein'],
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
  const [isLoggedIn, setIsLoggedIn] = useState(true); // default true for immediate development testing
  const [authError, setAuthError] = useState(null);

  // Sync profile from backend
  const fetchProfile = async () => {
    try {
      const data = await profileService.getProfile();
      if (data) {
        setProfile((prev) => ({
          ...prev,
          id: data.id || prev.id,
          name: data.full_name || prev.name,
          email: data.email || prev.email,
        }));
        if (data.household_size) {
          setHousehold((prev) => ({ ...prev, householdSize: data.household_size }));
        }
        if (data.weekly_budget) {
          setBudget((prev) => ({ ...prev, weeklyBudget: data.weekly_budget }));
        }
        if (data.dietary_preference && data.dietary_preference !== 'none') {
          setDietary((prev) => ({
            ...prev,
            selected: Array.from(new Set([...prev.selected, data.dietary_preference])),
          }));
        }
      }
    } catch (err) {
      console.log('Backend profile sync note:', err.message);
    }
  };

  useEffect(() => {
    if (isLoggedIn) {
      fetchProfile();
    }
  }, [isLoggedIn]);

  // ── Actions
  const updateProfile = async (fields) => {
    setProfile((prev) => ({ ...prev, ...fields }));
    try {
      await profileService.updateProfile({
        full_name: fields.name,
      });
    } catch (e) {
      console.log('Error updating profile on backend:', e.message);
    }
  };

  const updateHousehold = async (fields) => {
    setHousehold((prev) => ({ ...prev, ...fields }));
    if (fields.householdSize !== undefined) {
      try {
        await profileService.updateProfile({
          household_size: fields.householdSize,
        });
      } catch (e) {
        console.log('Error updating household on backend:', e.message);
      }
    }
  };

  const toggleDietaryPreference = async (tag) => {
    const exists = dietary.selected.includes(tag);
    const updatedSelected = exists
      ? dietary.selected.filter((item) => item !== tag)
      : [...dietary.selected, tag];

    setDietary((prev) => ({
      ...prev,
      selected: updatedSelected,
    }));

    try {
      await profileService.updateProfile({
        dietary_preference: updatedSelected.length > 0 ? updatedSelected.join(', ') : 'none',
      });
    } catch (e) {
      console.log('Error updating dietary on backend:', e.message);
    }
  };

  const updateBudget = async (fields) => {
    setBudget((prev) => ({ ...prev, ...fields }));
    if (fields.weeklyBudget !== undefined) {
      try {
        await profileService.updateProfile({
          weekly_budget: fields.weeklyBudget,
        });
      } catch (e) {
        console.log('Error updating budget on backend:', e.message);
      }
    }
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

  const logout = async () => {
    try {
      await authService.logout();
    } catch (e) {
      // ignore
    }
    setAuthToken(null);
    setIsLoggedIn(false);
  };

  const login = async (credentials) => {
    setAuthError(null);
    if (!credentials || !credentials.email) {
      setAuthToken('mock-token');
      setIsLoggedIn(true);
      fetchProfile();
      return true;
    }

    try {
      const data = await authService.login(credentials);
      if (data?.token) {
        setAuthToken(data.token);
      }
      setIsLoggedIn(true);
      fetchProfile();
      return true;
    } catch (err) {
      setAuthError(err.message);
      throw err;
    }
  };

  const signup = async (data) => {
    setAuthError(null);
    if (!data || !data.email) {
      setIsLoggedIn(true);
      return true;
    }

    try {
      const res = await authService.register({
        full_name: data.fullName || 'New User',
        email: data.email,
        password: data.password || 'password123',
      });
      if (res?.token) {
        setAuthToken(res.token);
      }
      if (data.fullName) {
        updateProfile({ name: data.fullName });
      }
      if (data.email) {
        updateProfile({ email: data.email });
      }
      setIsLoggedIn(true);
      fetchProfile();
      return true;
    } catch (err) {
      setAuthError(err.message);
      throw err;
    }
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
        authError,
        updateProfile,
        updateHousehold,
        toggleDietaryPreference,
        updateBudget,
        toggleNotification,
        togglePrivacy,
        setLanguage,
        logout,
        login,
        signup,
        fetchProfile,
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
