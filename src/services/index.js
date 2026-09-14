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
  MOCK_SHOP_ANALYTICS,
  SUBSCRIPTION_PLANS,
} from '../data/seedData';
import subscriptionService from './subscriptionService';

const AUTH_TOKEN_KEY = '@stockpot_auth_token';
const CUSTOM_RECIPES_KEY = '@stockpot_custom_recipes';
const USER_XP_KEY = '@stockpot_user_xp';
const USER_ACTIVITY_KEY = '@stockpot_user_activity';
const USER_INTERACTIONS_KEY = '@stockpot_user_interactions';
const CUSTOM_SHOPS_KEY = '@stockpot_custom_shops';
const SHOP_PRODUCTS_KEY = '@stockpot_shop_products';
const PRICE_HISTORY_KEY = '@stockpot_price_history';
const SHOP_DISCOUNTS_KEY = '@stockpot_shop_discounts';
const FAVOURITE_SHOPS_KEY = '@stockpot_favourite_shops';

// Helper: Haversine distance in km between two lat/lng points
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 0.5;
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
    const res = await apiClient.post('/auth/register', payload);
    const token = res.data?.token || res.token;
    if (token && !token.includes('mock')) {
      setAuthToken(token);
      try {
        await AsyncStorage.setItem(AUTH_TOKEN_KEY, token);
      } catch (_) {}
    }
    return res.data || res;
  },

  login: async (credentials) => {
    const res = await apiClient.post('/auth/login', credentials);
    const token = res.data?.token || res.token;
    if (token && !token.includes('mock')) {
      setAuthToken(token);
      try {
        await AsyncStorage.setItem(AUTH_TOKEN_KEY, token);
      } catch (_) {}
    }
    return res.data || res;
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
    const res = await apiClient.get('/profile');
    return res.data || res;
  },

  updateProfile: async (fields) => {
    const res = await apiClient.patch('/profile', fields);
    return res.data || res;
  },
};

// ── Recipe Service (Community, Popularity & Ranking) ─────────────────────────
export const recipeService = {
  getRecipes: async (params = {}) => {
    let combined = [...RECIPES];

    // Try fetching live recipes from Flask backend API first
    try {
      const res = await apiClient.get('/recipes', { params });
      const apiRecipes = res.data?.recipes || res.data || res;
      if (Array.isArray(apiRecipes) && apiRecipes.length > 0) {
        combined = apiRecipes;
      }
    } catch (_) {}

    // Load custom community recipes from local storage
    try {
      const stored = await AsyncStorage.getItem(CUSTOM_RECIPES_KEY);
      if (stored) {
        const customList = JSON.parse(stored);
        combined = [...customList, ...combined];
      }
    } catch (_) {}

    // 1. Filter by category or ranking collections
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
        combined = [...combined].sort((a, b) => (b.viewsCount || 0) + (b.cooksCount || 0) * 3 - ((a.viewsCount || 0) + (a.cooksCount || 0) * 3));
      } else if (cat.includes('rated') || cat.includes('top')) {
        combined = [...combined].sort((a, b) => (b.rating || 0) - (a.rating || 0));
      } else if (cat.includes('budget')) {
        combined = [...combined].sort((a, b) => (a.estimatedCost || 9999) - (b.estimatedCost || 9999));
      } else if (cat.includes('quick')) {
        combined = combined.filter((r) => parseInt(r.cookTime || '30') <= 20);
      } else if (cat.includes('community')) {
        combined = combined.filter((r) => (r.likesCount || 0) > 200 || r.author?.badge);
      } else if (cat.includes('recent')) {
        combined = [...combined].reverse();
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
        await gamificationService.awardXp(5, 'Liked a Community Recipe', `Supported a fellow home chef!`);
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

      await gamificationService.awardXp(5, 'Rated a Recipe', `Gave a ${rating}-star community review.`);
      return { success: true, rating };
    } catch (_) {
      return { success: true, rating };
    }
  },

  recordCook: async (recipe) => {
    try {
      await gamificationService.awardXp(10, `Cooked ${recipe.title || 'Meal'}`, `Prepared ${recipe.servings || 2} servings!`);
      return { success: true, xpEarned: 10 };
    } catch (_) {
      return { success: true, xpEarned: 10 };
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
      protein: recipePayload.protein || 24,
      carbs: recipePayload.carbs || 36,
      fat: recipePayload.fat || 12,
      rating: 5.0,
      ratingCount: 1,
      likesCount: 1,
      cooksCount: 1,
      savesCount: 1,
      viewsCount: 15,
      status: 'published',
      dietaryTags: recipePayload.dietaryTags || ['Healthy'],
      allergens: recipePayload.allergens || ['None'],
      author: {
        id: 'usr_current',
        name: recipePayload.authorName || recipePayload.author?.name || 'Home Cook',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120',
        badge: 'Recipe Starter',
      },
      image: recipePayload.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600',
      ingredients: recipePayload.ingredients || [],
      steps: recipePayload.steps || ['Prepare fresh ingredients.', 'Cook on medium heat until fragrant.', 'Serve warm and enjoy!'],
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
    try {
      await apiClient.post('/recipes/report', { id, reason });
    } catch (_) {}
    return { success: true, message: 'Thank you for reporting. Our moderation team is reviewing this recipe.' };
  },
};

// ── Supermarkets & Local Stores Service (Shop Discovery) ──────────────────────
export const storeService = {
  getStores: async () => {
    let allStores = [...STORES];

    // Try fetching live stores from Flask backend API first
    try {
      const res = await apiClient.get('/stores');
      const apiStores = res.data?.stores || res.data || res;
      if (Array.isArray(apiStores) && apiStores.length > 0) {
        allStores = apiStores.map((s) => ({
          ...s,
          distanceKm: s.distanceKm || 1.2,
        }));
      }
    } catch (_) {}

    try {
      const customShops = await AsyncStorage.getItem(CUSTOM_SHOPS_KEY);
      if (customShops) {
        allStores = [...allStores, ...JSON.parse(customShops)];
      }
    } catch (_) {}
    return allStores;
  },

  getNearbyStores: async (userLat = 6.9147, userLng = 79.8778, params = {}) => {
    const stores = await storeService.getStores();
    let list = stores.map((s) => ({
      ...s,
      distanceKm: calculateDistance(userLat, userLng, s.latitude, s.longitude),
    }));

    // Category filter
    if (params.category && params.category !== 'All') {
      list = list.filter((s) => s.category.toLowerCase().includes(params.category.toLowerCase()));
    }

    // Search query
    if (params.search && params.search.trim()) {
      const q = params.search.toLowerCase().trim();
      list = list.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.address.toLowerCase().includes(q) ||
          s.category.toLowerCase().includes(q)
      );
    }

    // Sort by distance
    return list.sort((a, b) => a.distanceKm - b.distanceKm);
  },

  getAllDiscounts: async () => {
    let list = [...DISCOUNTS];
    try {
      const customDiscounts = await AsyncStorage.getItem(SHOP_DISCOUNTS_KEY);
      if (customDiscounts) {
        list = [...JSON.parse(customDiscounts), ...list];
      }
    } catch (_) {}
    return list;
  },

  toggleFavouriteShop: async (shopId) => {
    try {
      const stored = (await AsyncStorage.getItem(FAVOURITE_SHOPS_KEY)) || '[]';
      let favs = JSON.parse(stored);
      if (favs.includes(shopId)) {
        favs = favs.filter((id) => id !== shopId);
      } else {
        favs.push(shopId);
      }
      await AsyncStorage.setItem(FAVOURITE_SHOPS_KEY, JSON.stringify(favs));
      return { success: true, favourites: favs, isFav: favs.includes(shopId) };
    } catch (_) {
      return { success: true, favourites: [shopId], isFav: true };
    }
  },

  getFavouriteShops: async () => {
    try {
      const stored = (await AsyncStorage.getItem(FAVOURITE_SHOPS_KEY)) || '[]';
      return JSON.parse(stored);
    } catch (_) {
      return [];
    }
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

    return basketItems.length > 0
      ? basketItems
      : [
          { id: 'p_chicken_breast', name: 'Fresh Chicken Breast 1kg', quantity: '1 kg', matchedProduct: PRODUCTS[5] },
          { id: 'p_red_dhal', name: 'Mysore Red Dhal 1kg', quantity: '1 kg', matchedProduct: PRODUCTS[4] },
          { id: 'p_basmati_rice', name: 'Basmati Rice 1kg', quantity: '1 kg', matchedProduct: PRODUCTS[0] },
          { id: 'p_onions_big', name: 'Big Onions 1kg', quantity: '1 kg', matchedProduct: PRODUCTS[16] },
          { id: 'p_eggs', name: 'Farm Brown Eggs 10s', quantity: '1 pack', matchedProduct: PRODUCTS[29] },
          { id: 'p_coconut_oil', name: 'Pure Coconut Oil 1L', quantity: '1 L', matchedProduct: PRODUCTS[42] },
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
        const basePrice = prod.prices[store.id] || 450;

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
        const basePrice = prod.prices[store.id] || 450;
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

// ── Gamification & XP Service ────────────────────────────────────────────────
export const gamificationService = {
  getProfile: async () => {
    let xp = 650;
    try {
      const storedXp = await AsyncStorage.getItem(USER_XP_KEY);
      if (storedXp) xp = parseInt(storedXp);
    } catch (_) {}

    const currentLevel =
      GAMIFICATION_LEVELS.find((l) => xp >= l.minXp && xp < l.maxXp) ||
      GAMIFICATION_LEVELS[GAMIFICATION_LEVELS.length - 1];
    const nextLevel =
      GAMIFICATION_LEVELS.find((l) => l.level === currentLevel.level + 1) || currentLevel;

    return {
      xp,
      currentLevel,
      nextLevel,
      progressPct: Math.min(
        100,
        Math.round(((xp - currentLevel.minXp) / (currentLevel.maxXp - currentLevel.minXp)) * 100)
      ),
      streakDays: 7,
      badges: BADGES,
    };
  },

  awardXp: async (amount, title, details = '') => {
    try {
      const storedXp = (await AsyncStorage.getItem(USER_XP_KEY)) || '650';
      const newXp = parseInt(storedXp) + amount;
      await AsyncStorage.setItem(USER_XP_KEY, newXp.toString());

      // Log transaction
      const storedLogs =
        (await AsyncStorage.getItem(USER_ACTIVITY_KEY)) || JSON.stringify(DEFAULT_ACTIVITY_LOGS);
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
      return { success: true, newXp: 700, earned: amount };
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

// ── Shop Owner Business Portal Service (Catalogue, Prices, Discounts, Analytics)
export const shopOwnerService = {
  parseGoogleMapsUrl: (url) => {
    if (!url || typeof url !== 'string') return null;
    const cleanUrl = url.trim();
    let name = '';
    let address = 'Colombo, Sri Lanka';
    let lat = 6.9189;
    let lng = 79.8682;

    const coordMatch =
      cleanUrl.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/) || cleanUrl.match(/q=(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (coordMatch) {
      lat = parseFloat(coordMatch[1]);
      lng = parseFloat(coordMatch[2]);
    }

    const placeMatch = cleanUrl.match(/\/place\/([^\/@?]+)/);
    if (placeMatch) {
      name = decodeURIComponent(placeMatch[1].replace(/\+/g, ' '));
    }

    return {
      url: cleanUrl,
      name: name || 'Local Neighborhood Fresh Mart',
      address: name ? `${name}, Central Road, Colombo` : address,
      latitude: lat,
      longitude: lng,
      rating: 4.8,
      reviewsCount: 142,
      isGoogleVerified: true,
    };
  },

  registerShop: async (shopPayload) => {
    const newShop = {
      id: `store_custom_${Date.now()}`,
      name: shopPayload.name || 'My Local Groceries',
      category: shopPayload.category || 'Grocery',
      logo: shopPayload.logo || 'https://images.unsplash.com/photo-1583258292688-d0213dc5a3a8?w=150',
      color: '#0D9488',
      latitude: parseFloat(shopPayload.latitude || 6.9189),
      longitude: parseFloat(shopPayload.longitude || 79.8682),
      address: shopPayload.address || 'Main Street, Colombo',
      phone: shopPayload.phone || '+94 77 000 0000',
      openingHours: shopPayload.openingHours || '7:00 AM – 10:00 PM',
      googleMapsUrl: shopPayload.googleMapsUrl || '',
      isVerified: true,
      verificationStatus: 'VERIFIED',
      isLocalShop: true,
      rating: 4.8,
      reviewsCount: 1,
      deliveryAvailable: !!shopPayload.deliveryAvailable,
      submittedAt: new Date().toISOString(),
    };

    try {
      const stored = await AsyncStorage.getItem(CUSTOM_SHOPS_KEY);
      const list = stored ? JSON.parse(stored) : [];
      list.push(newShop);
      await AsyncStorage.setItem(CUSTOM_SHOPS_KEY, JSON.stringify(list));

      await gamificationService.awardXp(
        100,
        `Registered Shop: ${newShop.name}`,
        'Business presence created in StockPot Business Ecosystem!'
      );
      return { success: true, data: newShop };
    } catch (_) {
      return { success: true, data: newShop };
    }
  },

  getShopProducts: async (shopId) => {
    try {
      const stored = await AsyncStorage.getItem(`${SHOP_PRODUCTS_KEY}_${shopId}`);
      if (stored) return JSON.parse(stored);
    } catch (_) {}

    // Default mock shop products
    return [
      { id: 'sp_1', name: 'Fresh Chicken Breast 1kg', category: 'Meat', price: 1350, discountPrice: 1250, stockStatus: 'IN_STOCK', unit: '1 kg', updatedAt: '2 hours ago' },
      { id: 'sp_2', name: 'Mysore Red Dhal 1kg', category: 'Rice & Grains', price: 340, discountPrice: null, stockStatus: 'IN_STOCK', unit: '1 kg', updatedAt: '3 hours ago' },
      { id: 'sp_3', name: 'Big Onions (B Lunu) 1kg', category: 'Vegetables', price: 350, discountPrice: null, stockStatus: 'IN_STOCK', unit: '1 kg', updatedAt: 'Just now' },
      { id: 'sp_4', name: 'Fresh Farm Brown Eggs 10s', category: 'Eggs', price: 430, discountPrice: 380, stockStatus: 'IN_STOCK', unit: '10s', updatedAt: '1 hour ago' },
      { id: 'sp_5', name: 'Pure White Coconut Oil 1L', category: 'Cooking Essentials', price: 890, discountPrice: null, stockStatus: 'LOW_STOCK', unit: '1 L', updatedAt: '4 hours ago' },
      { id: 'sp_6', name: 'Keeri Samba Rice 5kg', category: 'Rice & Grains', price: 1350, discountPrice: null, stockStatus: 'IN_STOCK', unit: '5 kg', updatedAt: '2 hours ago' },
      { id: 'sp_7', name: 'Roasted Curry Powder 250g', category: 'Spices', price: 340, discountPrice: null, stockStatus: 'IN_STOCK', unit: '250 g', updatedAt: '5 hours ago' },
    ];
  },

  saveShopProduct: async (shopId, productPayload) => {
    try {
      const currentList = await shopOwnerService.getShopProducts(shopId);
      let updatedList = [];
      const isEdit = !!productPayload.id;

      if (isEdit) {
        updatedList = currentList.map((p) =>
          p.id === productPayload.id
            ? { ...p, ...productPayload, updatedAt: 'Just now' }
            : p
        );
      } else {
        const newProduct = {
          id: `sp_${Date.now()}`,
          name: productPayload.name,
          category: productPayload.category || 'General',
          price: parseFloat(productPayload.price || 0),
          discountPrice: productPayload.discountPrice ? parseFloat(productPayload.discountPrice) : null,
          stockStatus: productPayload.stockStatus || 'IN_STOCK',
          unit: productPayload.unit || '1 kg',
          updatedAt: 'Just now',
        };
        updatedList = [newProduct, ...currentList];
      }

      await AsyncStorage.setItem(`${SHOP_PRODUCTS_KEY}_${shopId}`, JSON.stringify(updatedList));

      // Log price history if price changed
      if (productPayload.price) {
        await shopOwnerService.logPriceChange(shopId, productPayload.name, productPayload.oldPrice || productPayload.price, productPayload.price);
      }

      return { success: true, products: updatedList };
    } catch (_) {
      return { success: true, products: [] };
    }
  },

  deleteShopProduct: async (shopId, productId) => {
    try {
      const currentList = await shopOwnerService.getShopProducts(shopId);
      const filtered = currentList.filter((p) => p.id !== productId);
      await AsyncStorage.setItem(`${SHOP_PRODUCTS_KEY}_${shopId}`, JSON.stringify(filtered));
      return { success: true, products: filtered };
    } catch (_) {
      return { success: true };
    }
  },

  // Bulk CSV Import parser & processor
  importProductsCsv: async (shopId, csvText) => {
    if (!csvText || typeof csvText !== 'string') {
      throw new Error('Please provide valid CSV content.');
    }

    const lines = csvText.trim().split('\n');
    if (lines.length < 2) {
      throw new Error('CSV must contain a header row and at least 1 product row.');
    }

    const imported = [];
    // Skip header line
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      const parts = line.split(',').map((p) => p.trim());
      if (parts.length >= 4) {
        imported.push({
          id: `sp_csv_${Date.now()}_${i}`,
          name: parts[0],
          category: parts[1] || 'General',
          unit: parts[2] || '1 kg',
          price: parseFloat(parts[3] || 0),
          discountPrice: parts[4] && !isNaN(parts[4]) ? parseFloat(parts[4]) : null,
          stockStatus: parts[5] || 'IN_STOCK',
          updatedAt: 'Just now (CSV Import)',
        });
      }
    }

    const currentList = await shopOwnerService.getShopProducts(shopId);
    const combined = [...imported, ...currentList];
    await AsyncStorage.setItem(`${SHOP_PRODUCTS_KEY}_${shopId}`, JSON.stringify(combined));

    return { success: true, importedCount: imported.length, products: combined };
  },

  // Bulk Price Update (e.g. +5% inflation adjust or -5% holiday promo)
  bulkUpdatePrices: async (shopId, percentageDelta) => {
    const currentList = await shopOwnerService.getShopProducts(shopId);
    const multiplier = 1 + percentageDelta / 100;
    const updated = currentList.map((p) => {
      const newPrice = Math.round(p.price * multiplier);
      return {
        ...p,
        price: newPrice,
        updatedAt: 'Just now (Bulk Updated)',
      };
    });

    await AsyncStorage.setItem(`${SHOP_PRODUCTS_KEY}_${shopId}`, JSON.stringify(updated));
    return { success: true, products: updated };
  },

  logPriceChange: async (shopId, productName, previousPrice, newPrice) => {
    try {
      const stored = (await AsyncStorage.getItem(`${PRICE_HISTORY_KEY}_${shopId}`)) || '[]';
      const history = JSON.parse(stored);
      history.unshift({
        id: `ph_${Date.now()}`,
        productName,
        previousPrice,
        newPrice,
        updatedBy: 'Store Owner',
        updatedAt: 'Just now',
      });
      await AsyncStorage.setItem(`${PRICE_HISTORY_KEY}_${shopId}`, JSON.stringify(history.slice(0, 50)));
    } catch (_) {}
  },

  getPriceHistory: async (shopId) => {
    try {
      const stored = await AsyncStorage.getItem(`${PRICE_HISTORY_KEY}_${shopId}`);
      if (stored) return JSON.parse(stored);
    } catch (_) {}

    return [
      { id: 'ph_1', productName: 'Big Onions (B Lunu) 1kg', previousPrice: 360, newPrice: 350, updatedBy: 'Store Owner', updatedAt: '1 hour ago' },
      { id: 'ph_2', productName: 'Fresh Chicken Breast 1kg', previousPrice: 1400, newPrice: 1350, updatedBy: 'Store Owner', updatedAt: 'Yesterday' },
      { id: 'ph_3', productName: 'Mysore Red Dhal 1kg', previousPrice: 350, newPrice: 340, updatedBy: 'Store Owner', updatedAt: '3 days ago' },
    ];
  },

  getShopAnalytics: async (shopId) => {
    return MOCK_SHOP_ANALYTICS;
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
          { day: 'Wednesday', meals: [{ id: 'rec_string_hoppers', title: 'String Hoppers & Kiri Hodi', type: 'Breakfast' }, { id: 'rec_dhal_curry', title: 'Dhal Curry', type: 'Lunch' }, { id: 'rec_pumpkin_soup', title: 'Pumpkin Soup', type: 'Dinner' }] },
        ],
      };
    }
  },

  // Premium 7-day automated budget planner
  generateBudgetChallengePlan: (peopleCount = 4, daysCount = 7, targetBudget = 7500) => {
    const mealRecipes = [
      { day: 'Day 1', breakfast: 'Coconut Pol Roti with Lunu Miris', lunch: 'Creamy Parippu & Basmati Rice', dinner: 'Authentic Sri Lankan Chicken Curry', dailyCost: 980 },
      { day: 'Day 2', breakfast: 'Sourdough Avocado & Poached Egg', lunch: 'Quick Veggie Egg Fried Rice', dinner: 'Street-Style Chicken Koththu', dailyCost: 1050 },
      { day: 'Day 3', breakfast: 'String Hoppers & Kiri Hodi', lunch: 'Creamy Dhal Curry & Samba Rice', dinner: 'Roasted Pumpkin & Coconut Soup', dailyCost: 890 },
      { day: 'Day 4', breakfast: 'Coconut Pol Roti & Dhal Curry', lunch: 'Egg Fried Rice & Chilli Paste', dinner: 'Sri Lankan Chicken Curry', dailyCost: 1020 },
      { day: 'Day 5', breakfast: 'Avocado Toast with Farm Eggs', lunch: 'Red Rice & Parippu', dinner: 'Garlic Butter Penne Pasta', dailyCost: 940 },
      { day: 'Day 6', breakfast: 'String Hoppers with Pol Sambol', lunch: 'Vegetable Dhal Curry & Rice', dinner: 'Chicken Cheese Koththu', dailyCost: 1100 },
      { day: 'Day 7', breakfast: 'Fresh Fruit & Pol Roti', lunch: 'Egg Fried Rice & Mixed Veggies', dinner: 'Comforting Pumpkin Soup', dailyCost: 820 },
    ];

    const activeDays = mealRecipes.slice(0, daysCount);
    const estimatedCost = activeDays.reduce((sum, d) => sum + d.dailyCost, 0);
    const remainingBudget = targetBudget - estimatedCost;

    return {
      peopleCount,
      daysCount,
      targetBudget,
      estimatedCost,
      remainingBudget: Math.max(0, remainingBudget),
      isUnderBudget: estimatedCost <= targetBudget,
      savingsPct: Math.round(((targetBudget - estimatedCost) / targetBudget) * 100),
      schedule: activeDays,
    };
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
        weekly_saved: 1450,
        this_month: 5450,
        total_saved: 12400,
        comparisons_count: 18,
        meals_planned: 24,
        cheapest_store_used: 'ABC Neighborhood Grocery',
        avg_trip_saving: 460,
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
      return `💡 **Budget Tip for Colombo:**\n\n- Fresh chicken breast is cheapest at **Wellawatte Butcher (Rs. 1,290/kg)** and **ABC Neighborhood Grocery (Rs. 1,350/kg)** vs Keells (Rs. 1,450).\n- **GLOMARK** has an active **20% OFF** deal on meat today.\n- For a family meal under Rs. 1,500, I recommend making **Sri Lankan Dhal Curry & Pol Roti**!`;
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
  subscriptionService,
};
