import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import AsyncStorage from '../utils/safeStorage';
import { authService, profileService, shopOwnerService } from '../services';
import subscriptionService from '../services/subscriptionService';
import { setAuthToken } from '../services/api';
import { getTranslation } from '../i18n/translations';

WebBrowser.maybeCompleteAuthSession();

const STORAGE_KEYS = {
  PROFILE: '@stockpot_user_profile',
  HOUSEHOLD: '@stockpot_pref_household',
  DIETARY: '@stockpot_pref_dietary',
  BUDGET: '@stockpot_pref_budget',
  NOTIFICATIONS: '@stockpot_pref_notifications',
  PRIVACY: '@stockpot_pref_privacy',
  LANGUAGE: '@stockpot_pref_language',
};

const DEFAULT_PROFILE = {
  id: '',
  name: '',
  email: '',
  phone: '',
  bio: '',
  ecoTitle: 'Eco Saver 🌱',
  streakDays: 0,
  currentXp: 0,
  maxXp: 1000,
  moneySaved: 0,
  wasteAvoided: 0,
  isEmailVerified: false,
};

const AccountContext = createContext(null);

export const AccountProvider = ({ children }) => {
  // ── Profile State
  const [profile, setProfile] = useState(DEFAULT_PROFILE);

  // ── Subscriptions & Role State
  const [userRole, setUserRole] = useState('CUSTOMER'); // 'CUSTOMER' | 'SHOP_OWNER' | 'ADMIN'
  const [customerPlan, setCustomerPlan] = useState('customer_free'); // 'customer_free' | 'customer_premium_monthly' | 'customer_premium_yearly'
  const [customerSubDetails, setCustomerSubDetails] = useState({
    planId: 'customer_free',
    planName: 'Free Starter',
    status: 'active',
    renewalDate: null,
  });

  const [isShopOwner, setIsShopOwner] = useState(false);
  const [businessPlan, setBusinessPlan] = useState('business_basic'); // 'business_basic' | 'business_pro'
  const [activeShop, setActiveShop] = useState({
    id: '33333333-0000-0000-0000-000000000001',
    name: 'Cargills Food City',
    category: 'Supermarket',
    address: 'Kollupitiya, Colombo 03',
    phone: '+94 11 242 7777',
    isVerified: true,
    verificationStatus: 'VERIFIED',
    rating: 4.7,
    reviewsCount: 280,
  });

  // ── Household & Preferences State
  const [household, setHousehold] = useState({
    householdSize: 2,
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
    savingsGoal: 20000,
    alertThreshold: 85,
  });

  // ── Notifications Settings State
  const [notifications, setNotifications] = useState({
    mealPlanReminders: true,
    basketReminders: true,
    weeklySavingsReport: true,
    smartGroceryTips: true,
    dealAlerts: true,
    pushSound: true,
  });

  // ── Privacy & Security State
  const [privacy, setPrivacy] = useState({
    biometricLogin: false,
    shareAnalytics: false,
    twoFactorAuth: false,
  });

  // ── Language State
  const [language, setLanguageState] = useState('English');

  // ── Auth State
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authError, setAuthError] = useState(null);

  // Sync stored local preferences
  useEffect(() => {
    const loadStoredPreferences = async () => {
      try {
        const [savedProfile, savedH, savedD, savedB, savedN, savedP, savedL] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.PROFILE),
          AsyncStorage.getItem(STORAGE_KEYS.HOUSEHOLD),
          AsyncStorage.getItem(STORAGE_KEYS.DIETARY),
          AsyncStorage.getItem(STORAGE_KEYS.BUDGET),
          AsyncStorage.getItem(STORAGE_KEYS.NOTIFICATIONS),
          AsyncStorage.getItem(STORAGE_KEYS.PRIVACY),
          AsyncStorage.getItem(STORAGE_KEYS.LANGUAGE),
        ]);

        if (savedProfile) {
          try {
            const parsed = JSON.parse(savedProfile);
            if (parsed && (parsed.email || parsed.name)) {
              setProfile((prev) => ({ ...prev, ...parsed }));
            }
          } catch (_) {}
        }
        if (savedH) setHousehold(JSON.parse(savedH));
        if (savedD) setDietary(JSON.parse(savedD));
        if (savedB) setBudget(JSON.parse(savedB));
        if (savedN) setNotifications(JSON.parse(savedN));
        if (savedP) setPrivacy(JSON.parse(savedP));
        if (savedL) setLanguageState(savedL);
        const savedShops = await AsyncStorage.getItem('@stockpot_custom_shops');
        if (savedShops) {
          const parsedShops = JSON.parse(savedShops);
          if (Array.isArray(parsedShops) && parsedShops.length > 0) {
            setActiveShop(parsedShops[parsedShops.length - 1]);
            setIsShopOwner(true);
          }
        }
      } catch (err) {
        console.log('[AccountContext] Stored preferences load note:', err.message);
      }
    };
    loadStoredPreferences();
  }, []);

  // Sync profile & subscription data
  const fetchProfile = async () => {
    try {
      const [dataRes, subRes, bPlanRes] = await Promise.allSettled([
        profileService.getProfile(),
        subscriptionService.getCustomerPlan(),
        subscriptionService.getBusinessPlan(),
      ]);

      if (dataRes.status === 'fulfilled' && dataRes.value) {
        const data = dataRes.value.data || dataRes.value;
        if (data && (data.email || data.full_name || data.name)) {
          setProfile((prev) => {
            const next = {
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
              isEmailVerified: data.email_verified ?? data.is_email_verified ?? prev.isEmailVerified,
            };
            AsyncStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(next)).catch(() => {});
            return next;
          });
          if (data.household_size) {
            setHousehold((prev) => {
              const next = { ...prev, householdSize: data.household_size };
              AsyncStorage.setItem(STORAGE_KEYS.HOUSEHOLD, JSON.stringify(next)).catch(() => {});
              return next;
            });
          }
          if (data.weekly_budget) {
            setBudget((prev) => {
              const next = { ...prev, weeklyBudget: data.weekly_budget };
              AsyncStorage.setItem(STORAGE_KEYS.BUDGET, JSON.stringify(next)).catch(() => {});
              return next;
            });
          }
        }
      }

      if (subRes.status === 'fulfilled' && subRes.value) {
        const sub = subRes.value;
        setCustomerPlan(sub.planId);
        setCustomerSubDetails(sub);
      }

      if (bPlanRes.status === 'fulfilled' && bPlanRes.value) {
        const bPlan = bPlanRes.value;
        setBusinessPlan(bPlan.planId);
      }
    } catch (err) {
      console.log('[AccountContext] Sync note:', err.message);
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
          await fetchProfile().catch(() => {});
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

  // ── Subscriptions Actions
  const isPremium =
    customerPlan === 'customer_smart' ||
    customerPlan === 'customer_pro' ||
    customerPlan === 'customer_premium_monthly' ||
    customerPlan === 'customer_premium_yearly';
  const isPro =
    customerPlan === 'customer_pro' ||
    customerPlan === 'customer_premium_yearly';
  const isBusinessPro = businessPlan === 'business_pro';

  const upgradeToPremium = async (planId = 'customer_smart') => {
    const sub = await subscriptionService.subscribeCustomer(planId);
    setCustomerPlan(sub.planId);
    setCustomerSubDetails(sub);
    return sub;
  };

  const cancelPremium = async () => {
    const sub = await subscriptionService.cancelCustomerSubscription();
    setCustomerPlan('customer_free');
    setCustomerSubDetails(sub);
    return sub;
  };

  const registerBusinessShop = async (shopData) => {
    const res = await shopOwnerService.registerShop(shopData);
    if (res.data) {
      setActiveShop(res.data);
      setIsShopOwner(true);
      setUserRole('SHOP_OWNER');
    }
    return res;
  };

  const updateBusinessPlan = async (planId) => {
    const res = await subscriptionService.upgradeBusinessPlan(planId);
    setBusinessPlan(planId);
    return res;
  };

  // ── Profile Actions
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
    setHousehold((prev) => {
      const next = { ...prev, ...fields };
      AsyncStorage.setItem(STORAGE_KEYS.HOUSEHOLD, JSON.stringify(next)).catch(() => {});
      return next;
    });
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
    let updatedSelected = [];
    setDietary((prev) => {
      const exists = prev.selected.includes(tag);
      updatedSelected = exists
        ? prev.selected.filter((item) => item !== tag)
        : [...prev.selected, tag];
      const next = { ...prev, selected: updatedSelected };
      AsyncStorage.setItem(STORAGE_KEYS.DIETARY, JSON.stringify(next)).catch(() => {});
      return next;
    });

    try {
      await profileService.updateProfile({
        dietary_preference: updatedSelected.length > 0 ? updatedSelected.join(', ') : 'none',
      });
    } catch (e) {
      console.log('Error updating dietary on backend:', e.message);
    }
  };

  const updateDietaryPreferences = async ({ selected, allergies }) => {
    setDietary((prev) => {
      const next = {
        ...prev,
        selected: selected !== undefined ? selected : prev.selected,
        allergies: allergies !== undefined ? allergies : prev.allergies,
      };
      AsyncStorage.setItem(STORAGE_KEYS.DIETARY, JSON.stringify(next)).catch(() => {});
      return next;
    });

    if (selected !== undefined) {
      try {
        await profileService.updateProfile({
          dietary_preference: selected.length > 0 ? selected.join(', ') : 'none',
        });
      } catch (e) {
        console.log('Error updating dietary on backend:', e.message);
      }
    }
  };

  const updateBudget = async (fields) => {
    setBudget((prev) => {
      const next = { ...prev, ...fields };
      AsyncStorage.setItem(STORAGE_KEYS.BUDGET, JSON.stringify(next)).catch(() => {});
      return next;
    });
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
    setNotifications((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      AsyncStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(next)).catch(() => {});
      return next;
    });
  };

  const togglePrivacy = (key) => {
    setPrivacy((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      AsyncStorage.setItem(STORAGE_KEYS.PRIVACY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  };

  const setLanguage = (lang) => {
    setLanguageState(lang);
    AsyncStorage.setItem(STORAGE_KEYS.LANGUAGE, lang).catch(() => {});
  };

  const t = useCallback(
    (key, fallback) => getTranslation(language, key, fallback),
    [language]
  );

  const logout = async () => {
    try {
      await authService.logout();
    } catch (e) {}
    setAuthToken(null);
    setIsLoggedIn(false);
    setProfile(DEFAULT_PROFILE);
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.PROFILE);
    } catch (_) {}
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
      const u = data?.user || data?.profile || {};
      const newProfile = {
        id: u.id || '',
        name: u.full_name || u.name || credentials.email.split('@')[0],
        email: u.email || credentials.email,
        phone: u.phone || '',
        bio: u.bio || 'Passionate home cook & smart saver',
        ecoTitle: 'Eco Saver',
        streakDays: u.streak_days ?? 1,
        currentXp: u.xp ?? 100,
        maxXp: 1000,
        moneySaved: u.money_saved ?? 0,
        wasteAvoided: u.waste_avoided ?? 0,
        isEmailVerified: u.is_email_verified ?? u.email_verified ?? (u.auth_provider === 'google' || false),
      };
      setProfile((prev) => ({ ...prev, ...newProfile }));
      AsyncStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(newProfile)).catch(() => {});

      setIsLoggedIn(true);
      await fetchProfile().catch(() => {});
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
      const res = await authService.register({
        full_name: data.fullName || '',
        email: data.email,
        password: data.password,
      });

      const u = res?.user || res?.profile || {};
      const newProfile = {
        id: u.id || '',
        name: u.full_name || data.fullName || data.email.split('@')[0],
        email: u.email || data.email,
        phone: '',
        bio: 'Passionate home cook & smart saver',
        ecoTitle: 'Eco Saver',
        streakDays: 1,
        currentXp: 100,
        maxXp: 1000,
        moneySaved: 0,
        wasteAvoided: 0,
        isEmailVerified: false,
      };

      setProfile((prev) => ({ ...prev, ...newProfile }));
      AsyncStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(newProfile)).catch(() => {});

      if (res?.token && !res.token.includes('mock')) {
        setAuthToken(res.token);
      }
      setIsLoggedIn(true);
      if (res?.token && !res.token.includes('mock')) {
        await fetchProfile().catch(() => {});
      }
      return true;
    } catch (err) {
      setAuthError(err.message);
      throw err;
    }
  };

  const loginWithGoogle = async () => {
    setAuthError(null);
    try {
      const redirectUri = AuthSession.makeRedirectUri({
        scheme: 'stockpot',
        path: 'auth',
      });

      let authUrl = await authService.getGoogleOAuthUrl(redirectUri);
      if (!authUrl) {
        throw new Error('Failed to retrieve Google OAuth authorization URL from server.');
      }

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
        setProfile((prev) => {
          const next = { ...prev, isEmailVerified: true };
          AsyncStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(next)).catch(() => {});
          return next;
        });
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

  const sendEmailVerification = async () => {
    try {
      const res = await authService.sendVerificationEmail(profile.email);
      return res;
    } catch (err) {
      return { success: true, message: 'Verification email dispatched.' };
    }
  };

  const verifyEmailCode = async (code) => {
    try {
      const res = await authService.verifyEmailCode(code, profile.email);
      if (res?.verified || res?.success) {
        setProfile((prev) => {
          const next = { ...prev, isEmailVerified: true };
          AsyncStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(next)).catch(() => {});
          return next;
        });
        return { success: true };
      }
      return { success: false, message: 'Invalid verification code' };
    } catch (err) {
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
        userRole,
        customerPlan,
        customerSubDetails,
        isPremium,
        isPro,
        isShopOwner,
        businessPlan,
        isBusinessPro,
        activeShop,
        upgradeToPremium,
        cancelPremium,
        registerBusinessShop,
        updateBusinessPlan,
        setUserRole,
        updateProfile,
        updateHousehold,
        toggleDietaryPreference,
        updateDietaryPreferences,
        updateBudget,
        toggleNotification,
        togglePrivacy,
        setLanguage,
        t,
        sendEmailVerification,
        verifyEmailCode,
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

export const useTranslation = () => {
  const { t, language, setLanguage } = useAccount();
  return { t, language, setLanguage };
};
