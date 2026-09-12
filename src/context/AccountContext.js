import React, { createContext, useContext, useState, useEffect } from 'react';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import { authService, profileService } from '../services';
import { setAuthToken } from '../services/api';

WebBrowser.maybeCompleteAuthSession();

const AccountContext = createContext(null);

export const AccountProvider = ({ children }) => {
  // ── Profile State
  const [profile, setProfile] = useState({
    id: '',
    name: 'User',
    email: '',
    phone: '',
    bio: '',
    ecoTitle: 'Eco Saver',
    streakDays: 0,
    currentXp: 0,
    maxXp: 1000,
    moneySaved: 0,
    wasteAvoided: 0,
  });

  // ── Household & Preferences State
  const [household, setHousehold] = useState({
    householdSize: 1,
    cookingSkill: 'Intermediate',
    prepTimeLimit: '30 mins',
    mealsPerDay: 3,
  });

  // ── Dietary Preferences State
  const [dietary, setDietary] = useState({
    selected: [],
    allergies: [],
  });

  // ── Budget Settings State
  const [budget, setBudget] = useState({
    weeklyBudget: 10000,
    currency: 'Rs.',
    savingsGoal: 2500,
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
    biometricLogin: false,
    shareAnalytics: false,
    twoFactorAuth: false,
  });

  // ── Language State
  const [language, setLanguage] = useState('English');

  // ── Auth State
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authError, setAuthError] = useState(null);

  // Sync profile from backend
  const fetchProfile = async () => {
    try {
      const data = await profileService.getProfile();
      if (data) {
        setProfile((prev) => ({
          ...prev,
          id: data.id || prev.id,
          name: data.full_name || data.name || prev.name,
          email: data.email || prev.email,
          phone: data.phone || prev.phone,
          bio: data.bio || prev.bio,
          moneySaved: data.money_saved ?? data.total_saved ?? prev.moneySaved,
          wasteAvoided: data.waste_avoided ?? prev.wasteAvoided,
          streakDays: data.streak_days ?? prev.streakDays,
          currentXp: data.xp ?? prev.currentXp,
        }));
        if (data.household_size) {
          setHousehold((prev) => ({ ...prev, householdSize: data.household_size }));
        }
        if (data.weekly_budget) {
          setBudget((prev) => ({ ...prev, weeklyBudget: data.weekly_budget }));
        }
        if (data.dietary_preference && data.dietary_preference !== 'none') {
          const splitDietary = data.dietary_preference.includes(',')
            ? data.dietary_preference.split(',').map((s) => s.trim())
            : [data.dietary_preference];
          setDietary((prev) => ({
            ...prev,
            selected: Array.from(new Set([...prev.selected, ...splitDietary])),
          }));
        }
      }
    } catch (err) {
      console.log('[AccountContext] Profile sync error:', err.message);
    }
  };

  // Restore session token on app startup
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const storedToken = await authService.getStoredToken();
        if (storedToken) {
          setAuthToken(storedToken);
          setIsLoggedIn(true);
          await fetchProfile();
        }
      } catch (err) {
        console.log('[AccountContext] Token restore error:', err.message);
      }
    };
    restoreSession();
  }, []);

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
        bio: fields.bio,
        phone: fields.phone,
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
    if (!credentials || !credentials.email || !credentials.password) {
      const err = new Error('Please enter both email and password');
      setAuthError(err.message);
      throw err;
    }

    try {
      const data = await authService.login(credentials);
      if (data?.token) {
        setAuthToken(data.token);
      }
      if (data?.user || data?.profile) {
        const u = data.user || data.profile;
        setProfile((prev) => ({
          ...prev,
          id: u.id || prev.id,
          name: u.full_name || u.name || prev.name,
          email: u.email || credentials.email || prev.email,
        }));
      }
      setIsLoggedIn(true);
      await fetchProfile();
      return true;
    } catch (err) {
      setAuthError(err.message);
      throw err;
    }
  };

  const signup = async (data) => {
    setAuthError(null);
    if (!data || !data.email || !data.password) {
      const err = new Error('Please provide email and password for registration');
      setAuthError(err.message);
      throw err;
    }

    try {
      // Immediately set user profile info in state
      if (data.fullName) {
        setProfile((prev) => ({
          ...prev,
          name: data.fullName,
          email: data.email,
        }));
      }

      const res = await authService.register({
        full_name: data.fullName || 'New User',
        email: data.email,
        password: data.password,
      });

      if (res?.user || res?.profile) {
        const u = res.user || res.profile;
        setProfile((prev) => ({
          ...prev,
          id: u.id || prev.id,
          name: u.full_name || u.name || data.fullName || prev.name,
          email: u.email || data.email || prev.email,
        }));
      }

      if (res?.token) {
        setAuthToken(res.token);
      }
      setIsLoggedIn(true);
      await fetchProfile();
      return true;
    } catch (err) {
      setAuthError(err.message);
      throw err;
    }
  };

  const loginWithGoogle = async () => {
    setAuthError(null);
    try {
      // 1. Create redirect URI for both Expo Go and standalone apps
      const redirectUri = AuthSession.makeRedirectUri({
        scheme: 'stockpot',
        path: 'auth',
      });

      console.log('[Google Auth] Starting login with redirectUri:', redirectUri);

      let authUrl = await authService.getGoogleOAuthUrl(redirectUri);
      if (!authUrl) {
        throw new Error('Failed to retrieve Google OAuth authorization URL from server.');
      }

      // Pass prompt to both Supabase and Google provider params
      const separator = authUrl.includes('?') ? '&' : '?';
      authUrl += `${separator}prompt=select_account&queryParams[prompt]=select_account&queryParams[access_type]=offline`;

      const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUri, {
        showInRecents: true,
        preferEphemeralSession: false,
      });

      if (result.type === 'success' && result.url) {
        let token = null;

        if (result.url.includes('#')) {
          const hashPart = result.url.split('#')[1];
          const hashParams = new URLSearchParams(hashPart);
          token = hashParams.get('access_token') || hashParams.get('token');
        }
        if (!token && result.url.includes('?')) {
          const queryPart = result.url.split('?')[1]?.split('#')[0];
          const queryParams = new URLSearchParams(queryPart);
          token = queryParams.get('access_token') || queryParams.get('token');
        }

        if (!token) {
          throw new Error('Authentication completed, but no access token was returned.');
        }

        await authService.saveToken(token);
        setAuthToken(token);
        setIsLoggedIn(true);
        await fetchProfile();
        return { success: true, token };
      } else if (result.type === 'cancel' || result.type === 'dismiss') {
        return { success: false, cancelled: true };
      } else {
        throw new Error(result.error || 'Google login could not be completed.');
      }
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
        loginWithGoogle,
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
