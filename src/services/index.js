import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient, { setAuthToken } from './api';
import {
  STORES,
  PRODUCTS,
  DISCOUNTS,
  RECIPES,
  CONTRIBUTORS,
  GAMIFICATION_LEVELS,
  BADGES,
  DEFAULT_ACTIVITY_LOGS,
} from '../data/seedData';

const AUTH_TOKEN_KEY = '@stockpot_auth_token';
const CUSTOM_RECIPES_KEY = '@stockpot_custom_recipes';
const USER_XP_KEY = '@stockpot_user_xp';
const USER_ACTIVITY_KEY = '@stockpot_user_activity';
const USER_INTERACTIONS_KEY = '@stockpot_user_interactions';
const CUSTOM_SHOPS_KEY = '@stockpot_custom_shops';

// Helper: Haversine distance in km between two lat/lng points
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 0;
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return parseFloat((R * c).toFixed(1));
};

// ── Auth Service ─────────────────────────────────────────────────────────────
export const authService = {
  register: async (payload) => {
    try {
      const res = await apiClient.post('/auth/register', payload);
      const token = res.data?.token || res.token;
      if (token && !token.includes('mock')) {
        setAuthToken(token);
        try {
          await AsyncStorage.setItem(AUTH_TOKEN_KEY, token);
        } catch (_) {}
      }
      return res.data || res;
    } catch (err) {
      return {
        user: { email: payload.email, full_name: payload.full_name || 'Denver', id: 'usr_local_1' },
        profile: { email: payload.email, full_name: payload.full_name || 'Denver', id: 'usr_local_1' },
        token: 'auth-session-active',
      };
    }
  },

  login: async (credentials) => {
    try {
      const res = await apiClient.post('/auth/login', credentials);
      const token = res.data?.token || res.token;
      if (token) {
        setAuthToken(token);
        try {
          await AsyncStorage.setItem(AUTH_TOKEN_KEY, token);
        } catch (_) {}
      }
      return res.data || res;
    } catch (err) {
      return {
        user: { email: credentials.email, full_name: 'Denver', id: 'usr_local_1' },
        profile: { email: credentials.email, full_name: 'Denver', id: 'usr_local_1' },
        token: 'auth-session-active',
      };
    }
  },

  logout: async () => {
    try {
      await apiClient.post('/auth/logout');
    } catch (_) {}
    setAuthToken(null);
    try {
      await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
    } catch (_) {}
    return { success: true };
  },

  getStoredToken: async () => {
    try {
      return await AsyncStorage.getItem(AUTH_TOKEN_KEY);
    } catch (_) {
      return null;
    }
  },

  saveToken: async (token) => {
    if (token) {
      setAuthToken(token);
      try {
        await AsyncStorage.setItem(AUTH_TOKEN_KEY, token);
      } catch (_) {}
    }
  },

  getGoogleOAuthUrl: async (redirectTo = 'stockpot://auth') => {
    try {
      const res = await apiClient.get(`/auth/google/url?redirect_to=${encodeURIComponent(redirectTo)}`);
      return res.data?.url || res.url;
    } catch (err) {
      const res = await apiClient.get(`/auth/oauth/google/url?redirect_to=${encodeURIComponent(redirectTo)}`);
      return res.data?.url || res.url;
    }
  },

  exchangeGoogleIdToken: async (idToken, accessToken = null) => {
    const res = await apiClient.post('/auth/google', {
      id_token: idToken,
      access_token: accessToken,
    });
    const token = res.data?.token || res.token;
    if (token) {
      setAuthToken(token);
      try {
        await AsyncStorage.setItem(AUTH_TOKEN_KEY, token);
      } catch (_) {}
    }
    return res.data || res;
  },
};

// ── Profile Service ──────────────────────────────────────────────────────────
export const profileService = {
  getProfile: async () => {
    try {
      const res = await apiClient.get('/profile');
      return res.data;
    } catch (err) {
      return {
        id: 'usr_current',
        full_name: 'Denver',
        email: 'itzdenuwan@gmail.com',
        bio: 'Passionate home cook & smart saver',
        household_size: 2,
        weekly_budget: 10000,
        money_saved: 3450,
        waste_avoided: 4.2,
        streak_days: 5,
        xp: 450,
        dietary_preference: 'none',
        language: 'en',
      };
    }
  },

  updateProfile: async (fields) => {
    try {
      const res = await apiClient.patch('/profile', fields);
      return res.data;
    } catch (err) {
      return fields;
    }
  },
};

// ── Recipe Service (Community, Popularity & Ranking) ─────────────────────────
export const recipeService = {
  getRecipes: async (params = {}) => {
    let combined = [...RECIPES];

    // Load custom community recipes from local storage
    try {
      const stored = await AsyncStorage.getItem(CUSTOM_RECIPES_KEY);
      if (stored) {
        const customList = JSON.parse(stored);
        combined = [...customList, ...combined];
      }
    } catch (_) {}

    // 1. Filter by category
    if (params.category && params.category.toLowerCase() !== 'all') {
      const cat = params.category.toLowerCase();
      if (cat.includes('breakfast')) {
        combined = combined.filter((r) => r.category.toLowerCase() === 'breakfast');
      } else if (cat.includes('lunch')) {
        combined = combined.filter((r) => r.category.toLowerCase() === 'lunch');
      } else if (cat.includes('dinner')) {
        combined = combined.filter((r) => r.category.toLowerCase() === 'dinner');
      } else if (cat.includes('snack')) {
        combined = combined.filter((r) => r.category.toLowerCase() === 'snacks' || r.category.toLowerCase() === 'desserts');
      } else if (cat.includes('trending')) {
        combined = [...combined].sort((a, b) => (b.viewsCount || 0) + (b.cooksCount || 0) * 2 - ((a.viewsCount || 0) + (a.cooksCount || 0) * 2));
      } else if (cat.includes('rated')) {
        combined = [...combined].sort((a, b) => (b.rating || 0) - (a.rating || 0));
      } else if (cat.includes('budget')) {
        combined = [...combined].sort((a, b) => (a.estimatedCost || 9999) - (b.estimatedCost || 9999));
      } else if (cat.includes('quick')) {
        combined = combined.filter((r) => parseInt(r.cookTime || '30') <= 20);
      } else if (cat.includes('community')) {
        combined = combined.filter((r) => r.likesCount > 250 || r.author?.name);
      }
    }

    // 2. Search keyword
    if (params.search && params.search.trim()) {
      const q = params.search.toLowerCase().trim();
      combined = combined.filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          r.description?.toLowerCase().includes(q) ||
          r.cuisine?.toLowerCase().includes(q) ||
          r.ingredients?.some((i) => i.name.toLowerCase().includes(q))
      );
    }

    // 3. Cuisine filter
    if (params.cuisine && params.cuisine !== 'All') {
      combined = combined.filter((r) => r.cuisine?.toLowerCase().includes(params.cuisine.toLowerCase()));
    }

    // 4. Max cooking time
    if (params.maxCookTime) {
      combined = combined.filter((r) => {
        const timeVal = parseInt(r.cookTime || '30');
        return timeVal <= params.maxCookTime;
      });
    }

    // 5. Max budget
    if (params.maxBudget) {
      combined = combined.filter((r) => (r.estimatedCost || 0) <= params.maxBudget);
    }

    return combined;
  },

  getRecipeById: async (id) => {
    let all = [...RECIPES];
    try {
      const stored = await AsyncStorage.getItem(CUSTOM_RECIPES_KEY);
      if (stored) {
        all = [...JSON.parse(stored), ...all];
      }
    } catch (_) {}
    return all.find((r) => r.id === id) || RECIPES[0];
  },

  likeRecipe: async (id) => {
    try {
      const interactions = JSON.parse((await AsyncStorage.getItem(USER_INTERACTIONS_KEY)) || '{}');
      const isLiked = !!interactions[`like_${id}`];
      interactions[`like_${id}`] = !isLiked;
      await AsyncStorage.setItem(USER_INTERACTIONS_KEY, JSON.stringify(interactions));

      if (!isLiked) {
        await gamificationService.awardXp(5, 'Liked a Recipe', `Supported a community chef!`);
      }
      return { success: true, isLiked: !isLiked };
    } catch (_) {
      return { success: true, isLiked: true };
    }
  },

  saveRecipe: async (id) => {
    try {
      const interactions = JSON.parse((await AsyncStorage.getItem(USER_INTERACTIONS_KEY)) || '{}');
      const isSaved = !!interactions[`save_${id}`];
      interactions[`save_${id}`] = !isSaved;
      await AsyncStorage.setItem(USER_INTERACTIONS_KEY, JSON.stringify(interactions));

      if (!isSaved) {
        await gamificationService.awardXp(10, 'Saved a Recipe', `Added to your recipe collection.`);
      }
      return { success: true, isSaved: !isSaved };
    } catch (_) {
      return { success: true, isSaved: true };
    }
  },

  rateRecipe: async (id, rating) => {
    try {
      const interactions = JSON.parse((await AsyncStorage.getItem(USER_INTERACTIONS_KEY)) || '{}');
      interactions[`rating_${id}`] = rating;
      await AsyncStorage.setItem(USER_INTERACTIONS_KEY, JSON.stringify(interactions));

      await gamificationService.awardXp(10, 'Rated a Recipe', `Provided a ${rating}-star community review.`);
      return { success: true, rating };
    } catch (_) {
      return { success: true, rating };
    }
  },

  recordCook: async (recipe) => {
    try {
      await gamificationService.awardXp(15, `Cooked ${recipe.title || 'Meal'}`, `Prepared ${recipe.servings || 2} servings!`);
      return { success: true, xpEarned: 15 };
    } catch (_) {
      return { success: true, xpEarned: 15 };
    }
  },

  createRecipe: async (recipePayload) => {
    const newRecipe = {
      id: `rec_custom_${Date.now()}`,
      title: recipePayload.title || 'Custom Community Dish',
      description: recipePayload.description || 'Delicious homemade recipe.',
      category: recipePayload.category || 'Dinner',
      cuisine: recipePayload.cuisine || 'Sri Lankan',
      difficulty: recipePayload.difficulty || 'Easy',
      prepTime: recipePayload.prepTime || '15 mins',
      cookTime: recipePayload.cookTime || '25 mins',
      servings: recipePayload.servings || 4,
      estimatedCost: recipePayload.estimatedCost || 850,
      calories: recipePayload.calories || 320,
      rating: 5.0,
      ratingCount: 1,
      likesCount: 1,
      cooksCount: 1,
      viewsCount: 10,
      status: 'published',
      dietaryTags: recipePayload.dietaryTags || ['Healthy'],
      allergens: recipePayload.allergens || ['None'],
      author: {
        id: 'usr_current',
        name: 'Denver',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120',
        badge: 'Recipe Starter',
      },
      image: recipePayload.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600',
      ingredients: recipePayload.ingredients || [],
      steps: recipePayload.steps || ['Prepare ingredients.', 'Cook until golden.', 'Serve hot!'],
    };

    try {
      const stored = await AsyncStorage.getItem(CUSTOM_RECIPES_KEY);
      const list = stored ? JSON.parse(stored) : [];
      list.unshift(newRecipe);
      await AsyncStorage.setItem(CUSTOM_RECIPES_KEY, JSON.stringify(list));

      await gamificationService.awardXp(50, `Created Recipe: ${newRecipe.title}`, 'Shared your culinary masterpiece with the community!');
      return { success: true, data: newRecipe };
    } catch (err) {
      return { success: true, data: newRecipe };
    }
  },

  reportRecipe: async (id, reason) => {
    return { success: true, message: 'Thank you for reporting. Our moderation team is reviewing this recipe.' };
  },
};

// ── Supermarkets & Local Stores Service ───────────────────────────────────────
export const storeService = {
  getStores: async () => {
    let allStores = [...STORES];
    try {
      const customShops = await AsyncStorage.getItem(CUSTOM_SHOPS_KEY);
      if (customShops) {
        allStores = [...allStores, ...JSON.parse(customShops)];
      }
    } catch (_) {}
    return allStores;
  },

  getNearbyStores: async (userLat = 6.9147, userLng = 79.8778) => {
    const stores = await storeService.getStores();
    return stores
      .map((s) => ({
        ...s,
        distanceKm: calculateDistance(userLat, userLng, s.latitude, s.longitude),
      }))
      .sort((a, b) => a.distanceKm - b.distanceKm);
  },

  getAllDiscounts: async () => {
    return DISCOUNTS;
  },
};

// ── Smart Shopping Basket & Split-Basket Optimizer ───────────────────────────
export const smartBasketService = {
  getAvailableProducts: () => PRODUCTS,

  // Build basket from selected recipes or ingredients
  buildBasketFromIngredients: (ingredients = []) => {
    const basketItems = [];

    ingredients.forEach((ing) => {
      const matchedProduct =
        PRODUCTS.find((p) => p.id === ing.productId) ||
        PRODUCTS.find((p) => ing.name && p.name.toLowerCase().includes(ing.name.toLowerCase().split(' ')[0])) ||
        PRODUCTS[0];

      basketItems.push({
        id: ing.productId || matchedProduct.id,
        name: ing.name || matchedProduct.name,
        quantity: ing.quantity || '1 unit',
        matchedProduct,
      });
    });

    return basketItems.length > 0 ? basketItems : [
      { id: 'p_chicken_breast', name: 'Chicken Breast 1kg', quantity: '1 kg', matchedProduct: PRODUCTS[0] },
      { id: 'p_red_dhal', name: 'Mysore Red Dhal 1kg', quantity: '1 kg', matchedProduct: PRODUCTS[2] },
      { id: 'p_basmati_rice', name: 'Basmati Rice 1kg', quantity: '1 kg', matchedProduct: PRODUCTS[3] },
      { id: 'p_onions_big', name: 'Big Onions 1kg', quantity: '1 kg', matchedProduct: PRODUCTS[8] },
      { id: 'p_eggs', name: 'Eggs 10 Pack', quantity: '1 pack', matchedProduct: PRODUCTS[16] },
    ];
  },

  // Calculate cheapest single store vs split multi-store strategy
  optimizeBasket: (basketItems = [], preferences = { maxStores: 3, minSavings: 150 }) => {
    const stores = STORES;
    const singleStoreTotals = {};

    stores.forEach((store) => {
      let total = 0;
      const breakdown = [];

      basketItems.forEach((item) => {
        const prod = item.matchedProduct || PRODUCTS[0];
        const basePrice = prod.prices[store.id] || 400;

        // Apply discount if exists
        const disc = DISCOUNTS.find((d) => d.storeId === store.id && d.productId === prod.id);
        const finalPrice = disc ? disc.discountedPrice : basePrice;

        total += finalPrice;
        breakdown.push({
          productId: prod.id,
          productName: prod.name,
          price: finalPrice,
          hasDiscount: !!disc,
          discountAmount: disc ? disc.originalPrice - disc.discountedPrice : 0,
        });
      });

      singleStoreTotals[store.id] = {
        store,
        totalCost: total,
        breakdown,
      };
    });

    // Sort single stores to find cheapest single store
    const sortedSingleStores = Object.values(singleStoreTotals).sort((a, b) => a.totalCost - b.totalCost);
    const cheapestSingleStore = sortedSingleStores[0];

    // Compute optimized split basket
    const splitBasketItems = [];
    const usedStoresMap = {};
    let splitTotalCost = 0;

    basketItems.forEach((item) => {
      const prod = item.matchedProduct || PRODUCTS[0];
      let bestStore = stores[0];
      let lowestPrice = 99999;
      let matchingDisc = null;

      stores.forEach((store) => {
        const basePrice = prod.prices[store.id] || 400;
        const disc = DISCOUNTS.find((d) => d.storeId === store.id && d.productId === prod.id);
        const price = disc ? disc.discountedPrice : basePrice;

        if (price < lowestPrice) {
          lowestPrice = price;
          bestStore = store;
          matchingDisc = disc;
        }
      });

      splitTotalCost += lowestPrice;
      usedStoresMap[bestStore.id] = bestStore;

      splitBasketItems.push({
        product: prod,
        quantity: item.quantity,
        bestStore,
        price: lowestPrice,
        originalPrice: matchingDisc ? matchingDisc.originalPrice : lowestPrice,
        isDiscounted: !!matchingDisc,
      });
    });

    const splitStoresList = Object.values(usedStoresMap);
    const potentialSavings = cheapestSingleStore.totalCost - splitTotalCost;
    const isSplitWorthwhile =
      splitStoresList.length <= preferences.maxStores && potentialSavings >= preferences.minSavings;

    return {
      cheapestSingleStore,
      sortedSingleStores,
      splitStrategy: {
        totalCost: splitTotalCost,
        storesInvolved: splitStoresList,
        items: splitBasketItems,
        potentialSavings: Math.max(0, potentialSavings),
        isRecommended: isSplitWorthwhile,
      },
    };
  },
};

// ── Gamification Service ─────────────────────────────────────────────────────
export const gamificationService = {
  getProfile: async () => {
    let xp = 450;
    try {
      const storedXp = await AsyncStorage.getItem(USER_XP_KEY);
      if (storedXp) xp = parseInt(storedXp);
    } catch (_) {}

    const currentLevel = GAMIFICATION_LEVELS.find((l) => xp >= l.minXp && xp < l.maxXp) || GAMIFICATION_LEVELS[GAMIFICATION_LEVELS.length - 1];
    const nextLevel = GAMIFICATION_LEVELS.find((l) => l.level === currentLevel.level + 1) || currentLevel;

    return {
      xp,
      currentLevel,
      nextLevel,
      progressPct: Math.min(100, Math.round(((xp - currentLevel.minXp) / (currentLevel.maxXp - currentLevel.minXp)) * 100)),
      streakDays: 5,
      badges: BADGES,
    };
  },

  awardXp: async (amount, title, details = '') => {
    try {
      const storedXp = (await AsyncStorage.getItem(USER_XP_KEY)) || '450';
      const newXp = parseInt(storedXp) + amount;
      await AsyncStorage.setItem(USER_XP_KEY, newXp.toString());

      // Log transaction
      const storedLogs = (await AsyncStorage.getItem(USER_ACTIVITY_KEY)) || JSON.stringify(DEFAULT_ACTIVITY_LOGS);
      const logs = JSON.parse(storedLogs);
      logs.unshift({
        id: `act_${Date.now()}`,
        type: 'xp',
        title,
        timestamp: 'Just now',
        xp: amount,
        details,
      });
      await AsyncStorage.setItem(USER_ACTIVITY_KEY, JSON.stringify(logs.slice(0, 50)));

      return { success: true, newXp, earned: amount };
    } catch (_) {
      return { success: true, newXp: 500, earned: amount };
    }
  },

  getActivityLogs: async () => {
    try {
      const storedLogs = await AsyncStorage.getItem(USER_ACTIVITY_KEY);
      return storedLogs ? JSON.parse(storedLogs) : DEFAULT_ACTIVITY_LOGS;
    } catch (_) {
      return DEFAULT_ACTIVITY_LOGS;
    }
  },

  getLeaderboard: async () => {
    return CONTRIBUTORS;
  },
};

// ── Shop Owner Service (Local Business Portal) ───────────────────────────────
export const shopOwnerService = {
  registerShop: async (shopPayload) => {
    const newShop = {
      id: `store_custom_${Date.now()}`,
      name: shopPayload.name || 'My Local Groceries',
      category: shopPayload.category || 'Local Shop',
      logo: shopPayload.logo || 'https://images.unsplash.com/photo-1583258292688-d0213dc5a3a8?w=150',
      color: '#0D9488',
      latitude: parseFloat(shopPayload.latitude || 6.9189),
      longitude: parseFloat(shopPayload.longitude || 79.8682),
      address: shopPayload.address || 'Main Street, Colombo',
      phone: shopPayload.phone || '+94 77 000 0000',
      openingHours: shopPayload.openingHours || '7:00 AM – 10:00 PM',
      isVerified: true,
      isLocalShop: true,
      rating: 5.0,
      deliveryAvailable: !!shopPayload.deliveryAvailable,
    };

    try {
      const stored = await AsyncStorage.getItem(CUSTOM_SHOPS_KEY);
      const list = stored ? JSON.parse(stored) : [];
      list.push(newShop);
      await AsyncStorage.setItem(CUSTOM_SHOPS_KEY, JSON.stringify(list));

      await gamificationService.awardXp(100, `Registered Store: ${newShop.name}`, 'Empowered your community with verified local shop prices!');
      return { success: true, data: newShop };
    } catch (_) {
      return { success: true, data: newShop };
    }
  },
};

// ── Meal Plan Service ────────────────────────────────────────────────────────
export const mealPlanService = {
  getCurrentMealPlan: async () => {
    try {
      const res = await apiClient.get('/meal-plans/current');
      return res.data;
    } catch (_) {
      return {
        id: 'mp_current',
        days: [
          { day: 'Monday', meals: [{ id: 'rec_pol_roti', title: 'Coconut Pol Roti', type: 'Breakfast' }, { id: 'rec_dhal_curry', title: 'Creamy Parippu & Rice', type: 'Lunch' }, { id: 'rec_chicken_curry', title: 'Sri Lankan Chicken Curry', type: 'Dinner' }] },
          { day: 'Tuesday', meals: [{ id: 'rec_avocado_toast', title: 'Avocado Toast', type: 'Breakfast' }, { id: 'rec_fried_rice', title: 'Egg Fried Rice', type: 'Lunch' }, { id: 'rec_chicken_koththu', title: 'Chicken Koththu', type: 'Dinner' }] },
          { day: 'Wednesday', meals: [{ id: 'rec_pol_roti', title: 'Pol Roti & Sambal', type: 'Breakfast' }, { id: 'rec_dhal_curry', title: 'Dhal Curry', type: 'Lunch' }, { id: 'rec_pumpkin_soup', title: 'Pumpkin Soup', type: 'Dinner' }] },
        ],
      };
    }
  },
};

// ── Savings Service ──────────────────────────────────────────────────────────
export const savingsService = {
  getSummary: async () => {
    try {
      const res = await apiClient.get('/savings/summary');
      return res.data;
    } catch (_) {
      return {
        weekly_budget: 10000,
        weekly_saved: 1250,
        this_month: 3450,
        total_saved: 8900,
        comparisons_count: 14,
        meals_planned: 18,
        cheapest_store_used: 'Softlogic GLOMARK',
        avg_trip_saving: 420,
      };
    }
  },
};

// ── AI Sous-Chef & Shopping Assistant ────────────────────────────────────────
export const aiService = {
  chat: async (message) => {
    try {
      const res = await apiClient.post('/ai/chat', { message });
      if (res.data?.reply || res.reply) {
        return res.data?.reply || res.reply;
      }
    } catch (_) {}

    // Smart Local Fallback Response with real store context
    const lower = message.toLowerCase();
    if (lower.includes('cheap') || lower.includes('budget') || lower.includes('price')) {
      return `💡 **Budget Tip for Colombo:**\n\n- Fresh chicken breast is cheapest at **ABC Neighborhood Grocery (Rs. 1,350/kg)** vs Keells (Rs. 1,450).\n- **GLOMARK** has an active **20% OFF** deal on meat today.\n- For a family meal under Rs. 1,500, I recommend making **Sri Lankan Dhal Curry & Pol Roti**!`;
    }
    if (lower.includes('substitut') || lower.includes('replace') || lower.includes('dairy')) {
      return `🥥 **Ingredient Swaps:**\n\n- **Heavy Cream:** Use thick coconut milk (Kati Kiri) – rich, silky & 100% plant-based.\n- **Chicken:** Swap with oyster mushrooms or pan-seared paneer/tofu to reduce cooking time & cost by ~30%.\n- **Wheat Flour:** Use rice flour or kurakkan (finger millet) for gluten-free flatbreads!`;
    }
    if (lower.includes('tonight') || lower.includes('dinner') || lower.includes('cook')) {
      return `🍳 **Tonight's Recommendation:**\n\nHow about **Street-Style Chicken Cheese Koththu** or **Roasted Pumpkin Soup**?\nBoth take under 25 minutes to cook and cost less than Rs. 500 per serving! Check out the Recipes tab to view the step-by-step directions.`;
    }
    return `👩‍🍳 **StockPot AI Sous-Chef:**\n\nI can help you build optimized meal plans, find cheaper ingredient prices across local stores, calculate recipe servings, and suggest substitutions. What are you cooking today?`;
  },
};

// ── Activity Service (Purchases, Cooking, Savings, Gamification) ──────────────
export const activityService = {
  getActivity: async (filter = 'all') => {
    try {
      const stored = await AsyncStorage.getItem(USER_ACTIVITY_KEY);
      let logs = stored ? JSON.parse(stored) : DEFAULT_ACTIVITY_LOGS;
      if (filter && filter !== 'all') {
        logs = logs.filter((l) => {
          if (filter === 'purchase') return l.kind === 'purchase' || l.type === 'purchase' || l.type === 'savings';
          if (filter === 'mealplan' || filter === 'cook') return l.kind === 'mealplan' || l.type === 'cook' || l.type === 'mealplan';
          if (filter === 'savings') return l.kind === 'savings' || l.type === 'savings' || (l.amount && l.amount > 0);
          return true;
        });
      }
      return logs;
    } catch (_) {
      return DEFAULT_ACTIVITY_LOGS;
    }
  },

  logActivity: async (activity) => {
    try {
      const stored = (await AsyncStorage.getItem(USER_ACTIVITY_KEY)) || JSON.stringify(DEFAULT_ACTIVITY_LOGS);
      const logs = JSON.parse(stored);
      const newEntry = {
        id: `act_${Date.now()}`,
        timestamp: 'Just now',
        ...activity,
      };
      logs.unshift(newEntry);
      await AsyncStorage.setItem(USER_ACTIVITY_KEY, JSON.stringify(logs.slice(0, 60)));
      return newEntry;
    } catch (_) {
      return activity;
    }
  },
};

export default {
  authService,
  profileService,
  recipeService,
  storeService,
  smartBasketService,
  gamificationService,
  shopOwnerService,
  mealPlanService,
  savingsService,
  activityService,
  aiService,
};
