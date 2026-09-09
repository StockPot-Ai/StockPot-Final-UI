import apiClient, { setAuthToken } from './api';

// ── Auth Service ─────────────────────────────────────────────────────────────
export const authService = {
  register: async (payload) => {
    const res = await apiClient.post('/auth/register', payload);
    if (res.data?.token) {
      setAuthToken(res.data.token);
    }
    return res.data;
  },

  login: async (credentials) => {
    const res = await apiClient.post('/auth/login', credentials);
    if (res.data?.token) {
      setAuthToken(res.data.token);
    }
    return res.data;
  },

  logout: async () => {
    const res = await apiClient.post('/auth/logout');
    setAuthToken(null);
    return res.data;
  },

  getMe: async () => {
    const res = await apiClient.get('/auth/me');
    return res.data;
  },
};

// ── Profile Service ──────────────────────────────────────────────────────────
export const profileService = {
  getProfile: async () => {
    const res = await apiClient.get('/profile');
    return res.data;
  },

  updateProfile: async (fields) => {
    const res = await apiClient.patch('/profile', fields);
    return res.data;
  },
};

// ── Recipe Service ───────────────────────────────────────────────────────────
export const recipeService = {
  getRecipes: async (params = {}) => {
    const query = new URLSearchParams();
    if (params.category && params.category !== 'all') {
      query.append('category', params.category.toLowerCase());
    }
    if (params.search) {
      query.append('search', params.search);
    }
    if (params.limit) {
      query.append('limit', params.limit.toString());
    }
    if (params.page) {
      query.append('page', params.page.toString());
    }
    const qs = query.toString() ? `?${query.toString()}` : '';
    const res = await apiClient.get(`/recipes${qs}`);
    return res.data || [];
  },

  getRecipeById: async (id) => {
    const res = await apiClient.get(`/recipes/${id}`);
    return res.data;
  },

  getRecipeIngredients: async (id, servings = 2) => {
    const res = await apiClient.get(`/recipes/${id}/ingredients?servings=${servings}`);
    return res.data;
  },

  getSuggestions: async (criteria) => {
    const res = await apiClient.post('/recipes/suggestions', criteria);
    return res.data || [];
  },
};

// ── Meal Plan Service ────────────────────────────────────────────────────────
export const mealPlanService = {
  getCurrentMealPlan: async () => {
    const res = await apiClient.get('/meal-plans/current');
    return res.data;
  },

  createMealPlan: async (payload) => {
    const res = await apiClient.post('/meal-plans', payload);
    return res.data;
  },

  addItem: async (mealPlanId, item) => {
    const res = await apiClient.post(`/meal-plans/${mealPlanId}/items`, item);
    return res.data;
  },

  updateItem: async (mealPlanId, itemId, payload) => {
    const res = await apiClient.patch(`/meal-plans/${mealPlanId}/items/${itemId}`, payload);
    return res.data;
  },

  deleteItem: async (mealPlanId, itemId) => {
    const res = await apiClient.delete(`/meal-plans/${mealPlanId}/items/${itemId}`);
    return res.data;
  },

  getSummary: async (mealPlanId) => {
    const res = await apiClient.get(`/meal-plans/${mealPlanId}/summary`);
    return res.data;
  },
};

// ── Shopping List Service ────────────────────────────────────────────────────
export const shoppingService = {
  generateFromMealPlan: async (mealPlanId) => {
    const res = await apiClient.post(`/shopping-lists/from-meal-plan/${mealPlanId}`);
    return res.data;
  },

  getCurrentShoppingList: async () => {
    const res = await apiClient.get('/shopping-lists/current');
    return res.data;
  },

  getShoppingList: async (id) => {
    const res = await apiClient.get(`/shopping-lists/${id}`);
    return res.data;
  },

  updateItem: async (listId, itemId, updates) => {
    const res = await apiClient.patch(`/shopping-lists/${listId}/items/${itemId}`, updates);
    return res.data;
  },

  compareStores: async (listId, latitude = 6.8531, longitude = 80.2625) => {
    const query = new URLSearchParams();
    if (latitude) query.append('latitude', latitude.toString());
    if (longitude) query.append('longitude', longitude.toString());
    const qs = query.toString() ? `?${query.toString()}` : '';
    const res = await apiClient.get(`/shopping-lists/${listId}/compare${qs}`);
    return res.data;
  },

  getDiscounts: async (listId) => {
    const res = await apiClient.get(`/shopping-lists/${listId}/discounts`);
    return res.data || [];
  },
};

// ── Supermarkets / Stores Service ───────────────────────────────────────────
export const storeService = {
  getStores: async () => {
    const res = await apiClient.get('/stores');
    return res.data || [];
  },

  getStoreDiscounts: async (storeId) => {
    const res = await apiClient.get(`/stores/${storeId}/discounts`);
    return res.data || [];
  },
};

// ── Savings Service ──────────────────────────────────────────────────────────
export const savingsService = {
  getSummary: async () => {
    const res = await apiClient.get('/savings/summary');
    return res.data;
  },

  getTrend: async () => {
    const res = await apiClient.get('/savings/trend');
    return res.data;
  },

  recordSavings: async (payload) => {
    const res = await apiClient.post('/savings', payload);
    return res.data;
  },
};

// ── Activity Service ─────────────────────────────────────────────────────────
export const activityService = {
  getActivity: async (type = 'all') => {
    const query = type && type !== 'all' ? `?type=${type}` : '';
    const res = await apiClient.get(`/activity${query}`);
    return res.data || [];
  },
};

// ── AI Chatbot Service ───────────────────────────────────────────────────────
export const aiService = {
  chat: async (message) => {
    const res = await apiClient.post('/ai/chat', { message });
    return res.data;
  },
};

export default {
  authService,
  profileService,
  recipeService,
  mealPlanService,
  shoppingService,
  storeService,
  savingsService,
  activityService,
  aiService,
};
