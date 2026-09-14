import AsyncStorage from '@react-native-async-storage/async-storage';
import { SUBSCRIPTION_PLANS } from '../data/seedData';
import apiClient from './api';

const CUSTOMER_SUB_KEY = '@stockpot_customer_subscription';
const BUSINESS_SUB_KEY = '@stockpot_business_subscription';

export const subscriptionService = {
  // ── Plan Definitions & Feature Retrieval ──────────────────────────────────
  getPlans: async () => {
    try {
      const res = await apiClient.get('/subscription/plans');
      return res.data || SUBSCRIPTION_PLANS;
    } catch (_) {
      return SUBSCRIPTION_PLANS;
    }
  },

  getCustomerPlan: async () => {
    try {
      const stored = await AsyncStorage.getItem(CUSTOMER_SUB_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (_) {}

    return {
      planId: 'customer_free',
      planName: 'Free Starter',
      status: 'active',
      type: 'customer',
      price: 0,
      billingPeriod: 'free',
      isTrial: false,
      renewalDate: null,
    };
  },

  getBusinessPlan: async () => {
    try {
      const stored = await AsyncStorage.getItem(BUSINESS_SUB_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (_) {}

    return {
      planId: 'business_basic',
      planName: 'Business Basic',
      status: 'active',
      type: 'business',
      price: 1499,
      billingPeriod: 'monthly',
      renewalDate: '2026-10-15',
    };
  },

  // ── Centralized Feature Gating ─────────────────────────────────────────────
  canAccessFeature: (featureKey, userContext = { customerPlan: 'customer_free', businessPlan: 'business_basic', role: 'CUSTOMER' }) => {
    const isPremium =
      userContext.customerPlan === 'customer_premium_monthly' ||
      userContext.customerPlan === 'customer_premium_yearly' ||
      userContext.isPremium;

    const isBusinessPro =
      userContext.businessPlan === 'business_pro' ||
      userContext.isBusinessPro;

    switch (featureKey) {
      // Customer Premium Features
      case 'unlimited_ai':
      case 'advanced_meal_planning':
      case 'dietary_allergen_optimizer':
      case 'deal_alerts':
      case 'budget_challenges':
      case 'advanced_savings_analytics':
      case 'macro_nutrition':
      case 'household_sharing':
      case 'store_performance_comparison':
        return !!isPremium;

      // Available to Free Customers as well
      case 'browse_recipes':
      case 'create_recipes':
      case 'basic_meal_plan':
      case 'single_store_comparison':
      case 'split_basket_optimizer':
      case 'nearby_shop_discovery':
      case 'basic_gamification':
        return true;

      // Business Pro Features
      case 'bulk_csv_import':
      case 'bulk_price_updates':
      case 'advanced_shop_analytics':
      case 'multiple_branches':
      case 'featured_store_badge':
      case 'advanced_promotions':
        return !!isBusinessPro;

      // Business Basic & Pro Features
      case 'manage_catalogue':
      case 'update_prices':
      case 'add_discounts':
      case 'basic_shop_analytics':
      case 'shop_discovery_presence':
        return true;

      default:
        return true;
    }
  },

  // ── Customer Actions ───────────────────────────────────────────────────────
  subscribeCustomer: async (planId = 'customer_premium_monthly') => {
    const selectedPlan =
      SUBSCRIPTION_PLANS.customer.find((p) => p.id === planId) ||
      SUBSCRIPTION_PLANS.customer[1];

    const subData = {
      planId: selectedPlan.id,
      planName: selectedPlan.name,
      status: 'active',
      type: 'customer',
      price: selectedPlan.price,
      billingPeriod: selectedPlan.billingPeriod,
      startDate: new Date().toISOString(),
      renewalDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      isTrial: false,
    };

    try {
      await apiClient.post('/subscription/subscribe', { planId });
    } catch (_) {}

    try {
      await AsyncStorage.setItem(CUSTOMER_SUB_KEY, JSON.stringify(subData));
    } catch (_) {}

    return subData;
  },

  cancelCustomerSubscription: async () => {
    const freePlan = SUBSCRIPTION_PLANS.customer[0];
    const subData = {
      planId: freePlan.id,
      planName: freePlan.name,
      status: 'active',
      type: 'customer',
      price: 0,
      billingPeriod: 'free',
      cancelledAt: new Date().toISOString(),
    };

    try {
      await apiClient.post('/subscription/cancel');
    } catch (_) {}

    try {
      await AsyncStorage.setItem(CUSTOMER_SUB_KEY, JSON.stringify(subData));
    } catch (_) {}

    return subData;
  },

  // ── Business Actions ───────────────────────────────────────────────────────
  upgradeBusinessPlan: async (planId = 'business_pro') => {
    const selectedPlan =
      SUBSCRIPTION_PLANS.business.find((p) => p.id === planId) ||
      SUBSCRIPTION_PLANS.business[1];

    const subData = {
      planId: selectedPlan.id,
      planName: selectedPlan.name,
      status: 'active',
      type: 'business',
      price: selectedPlan.price,
      billingPeriod: selectedPlan.billingPeriod,
      startDate: new Date().toISOString(),
      renewalDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    };

    try {
      await apiClient.post('/business/subscription/upgrade', { planId });
    } catch (_) {}

    try {
      await AsyncStorage.setItem(BUSINESS_SUB_KEY, JSON.stringify(subData));
    } catch (_) {}

    return subData;
  },
};

export default subscriptionService;
