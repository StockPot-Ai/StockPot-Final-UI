import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  Modal,
  Image,
  TouchableOpacity,
  ScrollView,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import Colors from '../../constants/colors';
import cargillsCatalog from '../../data/cargills_catalog.json';
import keellsCatalog from '../../data/keells_catalog.json';
import { pantryService, recipeService, mealPlanService } from '../../services';

const CATEGORIES = [
  { id: 'All', label: 'All Items', icon: 'apps' },
  { id: 'Rice', label: 'Rice & Grains 🍚', icon: 'rice' },
  { id: 'Produce', label: 'Produce 🥦', icon: 'fruit-watermelon' },
  { id: 'Meat', label: 'Meat & Seafood 🍗', icon: 'food-drumstick' },
  { id: 'Dairy', label: 'Dairy & Eggs 🥛', icon: 'egg' },
  { id: 'Spices', label: 'Spices & Curry 🌶️', icon: 'chili-mild' },
  { id: 'Beverages', label: 'Beverages 🧃', icon: 'cup' },
  { id: 'Pantry', label: 'Pantry & Snacks 🥫', icon: 'basket' },
];

const STORE_FILTERS = [
  { id: 'all', label: 'All Supermarkets', badge: '224 Items' },
  { id: 'cargills', label: 'Cargills Food City', badge: '🔴 224 Items' },
  { id: 'keells', label: 'Keells Super', badge: '🟢 224 Items' },
];

export default function GroceryCatalogueModal({
  visible,
  onClose,
  onCookRecipe,
  onAddToMealPlan,
  initialStore = 'all',
}) {
  const [activeTab, setActiveTab] = useState('catalogue'); // 'catalogue' | 'pantry' | 'meals'
  const [selectedStore, setSelectedStore] = useState(initialStore);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [pantryItems, setPantryItems] = useState([]);
  const [allRecipes, setAllRecipes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mealPlanDay, setMealPlanDay] = useState('mon');
  const [selectedMealForPlan, setSelectedMealForPlan] = useState(null);

  // Load pantry and recipes on mount / open
  const loadPantryAndRecipes = useCallback(async () => {
    try {
      const [storedPantry, recipes] = await Promise.all([
        pantryService.getPantryIngredients(),
        recipeService.getRecipes(),
      ]);
      setPantryItems(storedPantry || []);
      setAllRecipes(recipes || []);
    } catch (_) {}
  }, []);

  useEffect(() => {
    if (visible) {
      loadPantryAndRecipes();
      if (initialStore) setSelectedStore(initialStore);
    }
  }, [visible, initialStore, loadPantryAndRecipes]);

  // Combine products based on store selection
  const catalogProducts = useMemo(() => {
    const cargills = (Array.isArray(cargillsCatalog) ? cargillsCatalog : []).map((p) => ({
      ...p,
      store: 'Cargills Food City',
      storeColor: '#D97706',
    }));
    const keells = (Array.isArray(keellsCatalog) ? keellsCatalog : []).map((p) => ({
      ...p,
      store: 'Keells Super',
      storeColor: '#007A3D',
    }));

    if (selectedStore === 'cargills') return cargills;
    if (selectedStore === 'keells') return keells;
    return [...cargills, ...keells];
  }, [selectedStore]);

  // Filter products by category and search
  const filteredProducts = useMemo(() => {
    return catalogProducts.filter((p) => {
      const matchSearch =
        !search.trim() ||
        (p.name || '').toLowerCase().includes(search.toLowerCase().trim()) ||
        (p.category || '').toLowerCase().includes(search.toLowerCase().trim());

      if (!matchSearch) return false;
      if (selectedCategory === 'All') return true;

      const pCat = (p.category || '').toLowerCase();
      const sCat = selectedCategory.toLowerCase();
      if (sCat === 'rice') return pCat.includes('rice') || pCat.includes('grain');
      if (sCat === 'produce') return pCat.includes('produce') || pCat.includes('veg');
      if (sCat === 'meat') return pCat.includes('meat') || pCat.includes('fish') || pCat.includes('chicken');
      if (sCat === 'dairy') return pCat.includes('dairy') || pCat.includes('egg') || pCat.includes('milk');
      if (sCat === 'spices') return pCat.includes('spice') || pCat.includes('curry') || pCat.includes('powder');
      if (sCat === 'beverages') return pCat.includes('beverage') || pCat.includes('tea') || pCat.includes('drink');
      if (sCat === 'pantry') return pCat.includes('pantry') || pCat.includes('snack') || pCat.includes('flour') || pCat.includes('pasta');

      return pCat.includes(sCat);
    });
  }, [catalogProducts, selectedCategory, search]);

  // Dynamic suggested meals matching user's pantry
  const suggestedMeals = useMemo(() => {
    return pantryService.getSuggestedRecipes(pantryItems, allRecipes);
  }, [pantryItems, allRecipes]);

  // Add item to pantry
  const handleAddIngredient = async (item) => {
    const updated = await pantryService.addPantryIngredient(item);
    setPantryItems(updated);
  };

  // Remove item from pantry
  const handleRemoveIngredient = async (id) => {
    const updated = await pantryService.removePantryIngredient(id);
    setPantryItems(updated);
  };

  // Add quick starter pack
  const handleAddStarterKit = async () => {
    const starterItems = [
      catalogProducts.find((p) => (p.name || '').toLowerCase().includes('basmati')) || catalogProducts[0],
      catalogProducts.find((p) => (p.name || '').toLowerCase().includes('chicken')) || catalogProducts[1],
      catalogProducts.find((p) => (p.name || '').toLowerCase().includes('coconut')) || catalogProducts[2],
      catalogProducts.find((p) => (p.name || '').toLowerCase().includes('curry powder')) || catalogProducts[3],
    ].filter(Boolean);

    for (const it of starterItems) {
      await pantryService.addPantryIngredient(it);
    }
    const updated = await pantryService.getPantryIngredients();
    setPantryItems(updated);
    setActiveTab('meals');
  };

  // Direct Cook Recipe
  const handleCookSuggestedRecipe = (recipe) => {
    onClose();
    if (onCookRecipe) {
      onCookRecipe(recipe);
    }
  };

  // Direct Add to Meal Plan
  const handleConfirmAddToMealPlan = async (recipe, day = 'mon', slot = 'lunch') => {
    try {
      await mealPlanService.addMealToPlan(
        {
          id: recipe.id,
          title: recipe.title || recipe.name,
          name: recipe.name || recipe.title,
          cookTime: recipe.cookTime || '25 mins',
          estimatedCost: recipe.estimatedCost || 450,
          image: recipe.image || recipe.image_url,
          ingredients: recipe.ingredients,
        },
        day,
        slot
      );
      setSelectedMealForPlan(null);
      Alert.alert(
        'Added to Meal Plan! 📅',
        `"${recipe.title || recipe.name}" has been scheduled for ${day.toUpperCase()} (${slot.toUpperCase()}).`,
        [{ text: 'OK' }]
      );
      if (onAddToMealPlan) {
        onAddToMealPlan({ day, slot, recipe });
      }
    } catch (_) {
      Alert.alert('Meal Plan', 'Saved to your weekly meal plan.');
    }
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheetContainer}>
          {/* Apple-style Grabber */}
          <View style={styles.grabberWrap}>
            <View style={styles.grabber} />
          </View>

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.headerIconWrap}>
                <Ionicons name="basket" size={20} color="#007A3D" />
              </View>
              <View>
                <Text style={styles.headerTitle}>Supermarket Catalogue</Text>
                <Text style={styles.headerSub}>
                  Live prices & ingredients from Cargills & Keells
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <Ionicons name="close" size={20} color="#4B5563" />
            </TouchableOpacity>
          </View>

          {/* Top Segmented Navigation Tabs */}
          <View style={styles.navTabsWrap}>
            <TouchableOpacity
              style={[styles.navTab, activeTab === 'catalogue' && styles.navTabActive]}
              onPress={() => setActiveTab('catalogue')}
              activeOpacity={0.8}
            >
              <Ionicons
                name="grid-outline"
                size={14}
                color={activeTab === 'catalogue' ? '#FFFFFF' : '#4B5563'}
              />
              <Text style={[styles.navTabText, activeTab === 'catalogue' && styles.navTabTextActive]}>
                Supermarket (224)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.navTab, activeTab === 'pantry' && styles.navTabActive]}
              onPress={() => setActiveTab('pantry')}
              activeOpacity={0.8}
            >
              <Ionicons
                name="cube-outline"
                size={14}
                color={activeTab === 'pantry' ? '#FFFFFF' : '#4B5563'}
              />
              <Text style={[styles.navTabText, activeTab === 'pantry' && styles.navTabTextActive]}>
                In Pantry ({pantryItems.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.navTab, activeTab === 'meals' && styles.navTabActiveMeals]}
              onPress={() => setActiveTab('meals')}
              activeOpacity={0.8}
            >
              <Ionicons
                name="restaurant"
                size={14}
                color={activeTab === 'meals' ? '#FFFFFF' : '#D97706'}
              />
              <Text
                style={[
                  styles.navTabText,
                  activeTab === 'meals'
                    ? styles.navTabTextActive
                    : { color: '#D97706', fontWeight: '800' },
                ]}
              >
                Cook Meals ({suggestedMeals.length})
              </Text>
            </TouchableOpacity>
          </View>

          {/* ══════════════════════════════════════════════════════════════════════════
              TAB 1: SUPERMARKET CATALOGUE
             ══════════════════════════════════════════════════════════════════════════ */}
          {activeTab === 'catalogue' && (
            <View style={{ flex: 1 }}>
              {/* Store Switcher Pills */}
              <View style={styles.storeFilterRow}>
                {STORE_FILTERS.map((st) => {
                  const isSel = selectedStore === st.id;
                  return (
                    <TouchableOpacity
                      key={st.id}
                      style={[styles.storePill, isSel && styles.storePillActive]}
                      onPress={() => setSelectedStore(st.id)}
                      activeOpacity={0.75}
                    >
                      <Text style={[styles.storePillText, isSel && styles.storePillTextActive]}>
                        {st.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Search Bar */}
              <View style={styles.searchWrap}>
                <Ionicons name="search" size={16} color="#9CA3AF" style={{ marginRight: 8 }} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search basmati rice, chicken, dhal, milk..."
                  placeholderTextColor="#9CA3AF"
                  value={search}
                  onChangeText={setSearch}
                />
                {search.length > 0 && (
                  <TouchableOpacity onPress={() => setSearch('')}>
                    <Ionicons name="close-circle" size={16} color="#9CA3AF" />
                  </TouchableOpacity>
                )}
              </View>

              {/* Category Pills */}
              <View style={styles.categoriesWrap}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesRow}>
                  {CATEGORIES.map((cat) => {
                    const isSel = selectedCategory === cat.id;
                    return (
                      <TouchableOpacity
                        key={cat.id}
                        style={[styles.categoryChip, isSel && styles.categoryChipActive]}
                        onPress={() => setSelectedCategory(cat.id)}
                        activeOpacity={0.75}
                      >
                        <Text style={[styles.categoryChipText, isSel && styles.categoryChipTextActive]}>
                          {cat.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>

              {/* Product Grid */}
              <ScrollView
                style={styles.productsScroll}
                contentContainerStyle={styles.productsContent}
                showsVerticalScrollIndicator={false}
              >
                {filteredProducts.length === 0 ? (
                  <View style={styles.emptyProducts}>
                    <Ionicons name="search-outline" size={38} color="#9CA3AF" />
                    <Text style={styles.emptyTitle}>No matching products found</Text>
                    <Text style={styles.emptySub}>Try searching for "rice", "curry", or select another category</Text>
                  </View>
                ) : (
                  <View style={styles.productsGrid}>
                    {filteredProducts.map((prod) => {
                      const inPantryItem = pantryItems.find(
                        (p) => p.id === prod.id || (p.name && prod.name && p.name.toLowerCase() === prod.name.toLowerCase())
                      );
                      const isAdded = Boolean(inPantryItem);
                      const qty = inPantryItem?.quantity || 0;

                      return (
                        <View key={prod.id} style={styles.productCard}>
                          {/* Store Pill */}
                          <View
                            style={[
                              styles.cardStoreBadge,
                              { backgroundColor: (prod.store || '').includes('Cargills') ? '#FEF3C7' : '#DCFCE7' },
                            ]}
                          >
                            <Text
                              style={[
                                styles.cardStoreBadgeText,
                                { color: (prod.store || '').includes('Cargills') ? '#B45309' : '#15803D' },
                              ]}
                            >
                              {(prod.store || '').includes('Cargills') ? 'Cargills' : 'Keells'}
                            </Text>
                          </View>

                          {/* Image Thumbnail */}
                          <View style={styles.productImgWrap}>
                            {prod.image ? (
                              <Image source={{ uri: prod.image }} style={styles.productImg} resizeMode="contain" />
                            ) : (
                              <View style={styles.productImgPlaceholder}>
                                <Ionicons name="basket" size={24} color="#007A3D" />
                              </View>
                            )}
                          </View>

                          {/* Product Details */}
                          <Text style={styles.productName} numberOfLines={2}>
                            {prod.name}
                          </Text>

                          <View style={styles.unitRow}>
                            <Text style={styles.unitText}>{prod.unit || '1 unit'}</Text>
                            <Text style={styles.inStockText}>• In Stock</Text>
                          </View>

                          {/* Price & Action Row */}
                          <View style={styles.cardFooter}>
                            <View>
                              <Text style={styles.productPrice}>Rs. {Number(prod.price || prod.storePrice || 0).toLocaleString()}</Text>
                              {prod.mrp && prod.mrp > (prod.price || prod.storePrice) && (
                                <Text style={styles.mrpText}>Rs. {Number(prod.mrp).toLocaleString()}</Text>
                              )}
                            </View>

                            {isAdded ? (
                              <TouchableOpacity
                                style={styles.addedPillBtn}
                                onPress={() => handleAddIngredient(prod)}
                                activeOpacity={0.8}
                              >
                                <Ionicons name="checkmark-circle" size={14} color="#007A3D" />
                                <Text style={styles.addedPillText}>Added ({qty})</Text>
                              </TouchableOpacity>
                            ) : (
                              <TouchableOpacity
                                style={styles.addBtn}
                                onPress={() => handleAddIngredient(prod)}
                                activeOpacity={0.8}
                              >
                                <Ionicons name="add" size={15} color="#FFFFFF" />
                                <Text style={styles.addBtnText}>Add</Text>
                              </TouchableOpacity>
                            )}
                          </View>
                        </View>
                      );
                    })}
                  </View>
                )}
                <View style={{ height: 60 }} />
              </ScrollView>
            </View>
          )}

          {/* ══════════════════════════════════════════════════════════════════════════
              TAB 2: IN PANTRY INGREDIENTS
             ══════════════════════════════════════════════════════════════════════════ */}
          {activeTab === 'pantry' && (
            <ScrollView style={styles.pantryScroll} contentContainerStyle={styles.pantryContent} showsVerticalScrollIndicator={false}>
              <View style={styles.pantryHeaderCard}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.pantryHeaderTitle}>Your Available Ingredients ({pantryItems.length})</Text>
                  <Text style={styles.pantryHeaderSub}>Items you have at home or bought from supermarkets</Text>
                </View>
                {pantryItems.length > 0 && (
                  <TouchableOpacity
                    style={styles.clearBtn}
                    onPress={() => {
                      Alert.alert('Clear Pantry', 'Remove all items from your pantry list?', [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Clear All', style: 'destructive', onPress: async () => setPantryItems(await pantryService.clearPantry()) },
                      ]);
                    }}
                  >
                    <Text style={styles.clearBtnText}>Clear All</Text>
                  </TouchableOpacity>
                )}
              </View>

              {pantryItems.length === 0 ? (
                <View style={styles.emptyPantryBox}>
                  <Ionicons name="cube-outline" size={48} color="#D1D5DB" />
                  <Text style={styles.emptyPantryTitle}>No Ingredients in Pantry Yet</Text>
                  <Text style={styles.emptyPantrySub}>
                    Browse the supermarket catalogue and tap "+ Add" to save items to your kitchen pantry.
                  </Text>
                  <TouchableOpacity style={styles.browsePantryBtn} onPress={() => setActiveTab('catalogue')}>
                    <Text style={styles.browsePantryBtnText}>Browse Supermarket Products →</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.pantryList}>
                  {pantryItems.map((item) => (
                    <View key={item.id} style={styles.pantryItemRow}>
                      {item.image ? (
                        <Image source={{ uri: item.image }} style={styles.pantryItemImg} resizeMode="contain" />
                      ) : (
                        <View style={styles.pantryItemImgFallback}>
                          <Ionicons name="basket" size={18} color="#007A3D" />
                        </View>
                      )}
                      <View style={{ flex: 1, paddingHorizontal: 10 }}>
                        <Text style={styles.pantryItemName} numberOfLines={1}>{item.name}</Text>
                        <Text style={styles.pantryItemMeta}>
                          {item.unit || '1 unit'} • Rs. {Number(item.price || 0).toLocaleString()} • {item.store || 'Supermarket'}
                        </Text>
                      </View>
                      <View style={styles.pantryQtyControls}>
                        <TouchableOpacity
                          style={styles.qtyBtn}
                          onPress={() => handleRemoveIngredient(item.id)}
                          activeOpacity={0.7}
                        >
                          <Ionicons name="trash-outline" size={15} color="#EF4444" />
                        </TouchableOpacity>
                        <View style={styles.qtyBadge}>
                          <Text style={styles.qtyBadgeText}>{item.quantity || 1}</Text>
                        </View>
                        <TouchableOpacity
                          style={styles.qtyBtn}
                          onPress={() => handleAddIngredient(item)}
                          activeOpacity={0.7}
                        >
                          <Ionicons name="add" size={16} color="#007A3D" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}

                  {/* Call to Action: Cook with Pantry */}
                  <TouchableOpacity
                    style={styles.cookWithPantryBanner}
                    onPress={() => setActiveTab('meals')}
                    activeOpacity={0.88}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={styles.cookWithPantryTitle}>🍳 Ready to Cook?</Text>
                      <Text style={styles.cookWithPantrySub}>
                        {suggestedMeals.length > 0
                          ? `We found ${suggestedMeals.length} recipes matching your pantry items!`
                          : 'Discover delicious meals matching your ingredients.'}
                      </Text>
                    </View>
                    <View style={styles.cookWithPantryPill}>
                      <Text style={styles.cookWithPantryPillText}>See Meals →</Text>
                    </View>
                  </TouchableOpacity>
                </View>
              )}
              <View style={{ height: 40 }} />
            </ScrollView>
          )}

          {/* ══════════════════════════════════════════════════════════════════════════
              TAB 3: SUGGESTED MEALS YOU CAN COOK
             ══════════════════════════════════════════════════════════════════════════ */}
          {activeTab === 'meals' && (
            <ScrollView style={styles.mealsScroll} contentContainerStyle={styles.mealsContent} showsVerticalScrollIndicator={false}>
              <View style={styles.mealsHeaderCard}>
                <Ionicons name="flame" size={24} color="#EA580C" style={{ marginRight: 10 }} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.mealsHeaderTitle}>Suggested Meals ({suggestedMeals.length})</Text>
                  <Text style={styles.mealsHeaderSub}>
                    Recipes calculated directly from your added supermarket ingredients
                  </Text>
                </View>
              </View>

              {suggestedMeals.length === 0 ? (
                <View style={styles.emptyMealsCard}>
                  <MaterialCommunityIcons name="chef-hat" size={48} color="#D97706" />
                  <Text style={styles.emptyMealsTitle}>No Matching Recipes Yet</Text>
                  <Text style={styles.emptyMealsSub}>
                    Add essential ingredients like Basmati Rice, Chicken, Eggs, or Spices from the catalogue to see matching dishes!
                  </Text>
                  <TouchableOpacity
                    style={styles.addStarterPackBtn}
                    onPress={handleAddStarterKit}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="flash" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                    <Text style={styles.addStarterPackText}>Add Sri Lankan Starter Kit (Rice, Chicken, Curry)</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.suggestedMealsList}>
                  {suggestedMeals.map((recipe) => {
                    const matchPct = recipe.matchPercentage || 70;
                    const isHighMatch = matchPct >= 60;

                    return (
                      <View key={recipe.id} style={styles.suggestedMealCard}>
                        <View style={styles.mealCardTop}>
                          <Image
                            source={
                              recipe.image || recipe.image_url
                                ? { uri: recipe.image || recipe.image_url }
                                : require('../../../assets/creamy_pumpkin_pasta.jpg')
                            }
                            style={styles.mealThumb}
                          />
                          <View style={styles.mealInfo}>
                            <View style={styles.mealMatchRow}>
                              <View
                                style={[
                                  styles.matchBadge,
                                  isHighMatch ? styles.matchBadgeHigh : styles.matchBadgeMedium,
                                ]}
                              >
                                <Ionicons
                                  name="sparkles"
                                  size={11}
                                  color={isHighMatch ? '#15803D' : '#B45309'}
                                  style={{ marginRight: 3 }}
                                />
                                <Text
                                  style={[
                                    styles.matchBadgeText,
                                    isHighMatch ? styles.matchTextHigh : styles.matchTextMedium,
                                  ]}
                                >
                                  {matchPct}% Match ({recipe.matchCount || 2} in pantry)
                                </Text>
                              </View>
                            </View>

                            <Text style={styles.mealCardTitle} numberOfLines={1}>
                              {recipe.title || recipe.name}
                            </Text>

                            <View style={styles.mealMetaRow}>
                              <Text style={styles.mealMetaItem}>⏱️ {recipe.cookTime || recipe.prep_time || '25m'}</Text>
                              <Text style={styles.mealMetaItem}> • </Text>
                              <Text style={styles.mealMetaItem}>Rs. {recipe.estimatedCost || recipe.estimated_cost || 450}</Text>
                              <Text style={styles.mealMetaItem}> • </Text>
                              <Text style={styles.mealMetaItem}>⭐ {recipe.rating || 4.8}</Text>
                            </View>
                          </View>
                        </View>

                        {/* Matched Ingredients Chips */}
                        {Array.isArray(recipe.matchedIngs) && recipe.matchedIngs.length > 0 && (
                          <View style={styles.matchedIngsRow}>
                            <Text style={styles.matchedIngsLabel}>Ready: </Text>
                            {recipe.matchedIngs.slice(0, 4).map((ingName, idx) => (
                              <View key={idx} style={styles.matchedIngTag}>
                                <Text style={styles.matchedIngTagText}>✓ {ingName}</Text>
                              </View>
                            ))}
                          </View>
                        )}

                        {/* Actions: Cook Now or Add to Meal Plan */}
                        <View style={styles.mealActionsRow}>
                          <TouchableOpacity
                            style={styles.cookNowBtn}
                            onPress={() => handleCookSuggestedRecipe(recipe)}
                            activeOpacity={0.82}
                          >
                            <Ionicons name="restaurant" size={14} color="#FFFFFF" style={{ marginRight: 6 }} />
                            <Text style={styles.cookNowBtnText}>Cook Recipe 🍲</Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={styles.planMealBtn}
                            onPress={() => handleConfirmAddToMealPlan(recipe, 'mon', 'lunch')}
                            activeOpacity={0.82}
                          >
                            <Ionicons name="calendar-outline" size={14} color="#007A3D" style={{ marginRight: 4 }} />
                            <Text style={styles.planMealBtnText}>+ Meal Plan</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}
              <View style={{ height: 40 }} />
            </ScrollView>
          )}

          {/* Floating Bottom Pantry Bar when in Catalogue tab and items are added */}
          {activeTab === 'catalogue' && pantryItems.length > 0 && (
            <TouchableOpacity
              style={styles.floatingPantryBar}
              onPress={() => setActiveTab('meals')}
              activeOpacity={0.9}
            >
              <View style={styles.floatingPantryLeft}>
                <View style={styles.floatingCountBadge}>
                  <Text style={styles.floatingCountText}>{pantryItems.length}</Text>
                </View>
                <Text style={styles.floatingPantryTitle}>
                  {pantryItems.length} ingredients in pantry
                </Text>
              </View>
              <View style={styles.floatingPantryRight}>
                <Text style={styles.floatingPantryBtnText}>
                  See {suggestedMeals.length} Meals ➔
                </Text>
              </View>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    height: '92%',
    overflow: 'hidden',
  },
  grabberWrap: {
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 4,
  },
  grabber: {
    width: 40,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#D1D5DB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: -0.3,
  },
  headerSub: {
    fontSize: 11.5,
    color: '#6B7280',
    marginTop: 1,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Segmented Navigation Tabs
  navTabsWrap: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    backgroundColor: '#F9FAFB',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  navTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  navTabActive: {
    backgroundColor: '#007A3D',
    borderColor: '#007A3D',
  },
  navTabActiveMeals: {
    backgroundColor: '#EA580C',
    borderColor: '#EA580C',
  },
  navTabText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4B5563',
  },
  navTabTextActive: {
    color: '#FFFFFF',
  },

  // Store Filter Pills
  storeFilterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 10,
    gap: 8,
  },
  storePill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 9999,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  storePillActive: {
    backgroundColor: '#111827',
    borderColor: '#111827',
  },
  storePillText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#4B5563',
  },
  storePillTextActive: {
    color: '#FFFFFF',
  },

  // Search
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 10,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#111827',
    padding: 0,
  },

  // Categories
  categoriesWrap: {
    marginTop: 10,
  },
  categoriesRow: {
    paddingHorizontal: 16,
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  categoryChipActive: {
    backgroundColor: '#DCFCE7',
    borderColor: '#007A3D',
  },
  categoryChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4B5563',
  },
  categoryChipTextActive: {
    color: '#007A3D',
    fontWeight: '800',
  },

  // Products Grid
  productsScroll: {
    flex: 1,
    marginTop: 10,
  },
  productsContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },
  productCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 10,
    borderWidth: 1,
    borderColor: '#EAE5E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
    position: 'relative',
  },
  cardStoreBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    zIndex: 2,
  },
  cardStoreBadgeText: {
    fontSize: 9.5,
    fontWeight: '800',
  },
  productImgWrap: {
    width: '100%',
    height: 100,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    marginTop: 12,
  },
  productImg: {
    width: '85%',
    height: '85%',
  },
  productImgPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  productName: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#111827',
    height: 34,
    lineHeight: 17,
  },
  unitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
    marginBottom: 6,
  },
  unitText: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '600',
  },
  inStockText: {
    fontSize: 10.5,
    color: '#15803D',
    fontWeight: '600',
    marginLeft: 3,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  productPrice: {
    fontSize: 13,
    fontWeight: '800',
    color: '#007A3D',
  },
  mrpText: {
    fontSize: 10,
    color: '#9CA3AF',
    textDecorationLine: 'line-through',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#007A3D',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  addBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  addedPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  addedPillText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#007A3D',
  },
  emptyProducts: {
    alignItems: 'center',
    padding: 36,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#374151',
    marginTop: 10,
  },
  emptySub: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 4,
  },

  // Pantry Tab
  pantryScroll: {
    flex: 1,
  },
  pantryContent: {
    padding: 16,
  },
  pantryHeaderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F9FAFB',
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  pantryHeaderTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#111827',
  },
  pantryHeaderSub: {
    fontSize: 11.5,
    color: '#6B7280',
    marginTop: 2,
  },
  clearBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  clearBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#EF4444',
  },
  emptyPantryBox: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  emptyPantryTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#374151',
    marginTop: 12,
  },
  emptyPantrySub: {
    fontSize: 12.5,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  browsePantryBtn: {
    marginTop: 16,
    backgroundColor: '#007A3D',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
  },
  browsePantryBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  pantryList: {
    gap: 10,
  },
  pantryItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  pantryItemImg: {
    width: 42,
    height: 42,
    borderRadius: 8,
  },
  pantryItemImgFallback: {
    width: 42,
    height: 42,
    borderRadius: 8,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pantryItemName: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#111827',
  },
  pantryItemMeta: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
  pantryQtyControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  qtyBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyBadge: {
    paddingHorizontal: 6,
  },
  qtyBadgeText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#111827',
  },
  cookWithPantryBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF7ED',
    borderRadius: 16,
    padding: 14,
    marginTop: 14,
    borderWidth: 1,
    borderColor: '#FED7AA',
  },
  cookWithPantryTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#C2410C',
  },
  cookWithPantrySub: {
    fontSize: 11.5,
    color: '#9A3412',
    marginTop: 2,
  },
  cookWithPantryPill: {
    backgroundColor: '#EA580C',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
  },
  cookWithPantryPillText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  // Meals Tab
  mealsScroll: {
    flex: 1,
  },
  mealsContent: {
    padding: 16,
  },
  mealsHeaderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF7ED',
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#FFEDD5',
  },
  mealsHeaderTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#9A3412',
  },
  mealsHeaderSub: {
    fontSize: 11.5,
    color: '#C2410C',
    marginTop: 2,
  },
  emptyMealsCard: {
    alignItems: 'center',
    padding: 36,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  emptyMealsTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#374151',
    marginTop: 12,
  },
  emptyMealsSub: {
    fontSize: 12.5,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  addStarterPackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007A3D',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    marginTop: 16,
  },
  addStarterPackText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  suggestedMealsList: {
    gap: 14,
  },
  suggestedMealCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 12,
    borderWidth: 1,
    borderColor: '#EAE5E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  mealCardTop: {
    flexDirection: 'row',
    gap: 12,
  },
  mealThumb: {
    width: 78,
    height: 78,
    borderRadius: 12,
  },
  mealInfo: {
    flex: 1,
  },
  mealMatchRow: {
    marginBottom: 4,
  },
  matchBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 6,
  },
  matchBadgeHigh: {
    backgroundColor: '#DCFCE7',
  },
  matchBadgeMedium: {
    backgroundColor: '#FEF3C7',
  },
  matchBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  matchTextHigh: {
    color: '#15803D',
  },
  matchTextMedium: {
    color: '#B45309',
  },
  mealCardTitle: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#111827',
  },
  mealMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  mealMetaItem: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '600',
  },
  matchedIngsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 5,
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  matchedIngsLabel: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#007A3D',
  },
  matchedIngTag: {
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 0.5,
    borderColor: '#86EFAC',
  },
  matchedIngTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#166534',
  },
  mealActionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  cookNowBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007A3D',
    paddingVertical: 9,
    borderRadius: 12,
  },
  cookNowBtnText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  planMealBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#86EFAC',
    paddingVertical: 9,
    borderRadius: 12,
  },
  planMealBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#007A3D',
  },

  // Floating Pantry Bar
  floatingPantryBar: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    backgroundColor: '#111827',
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8,
  },
  floatingPantryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  floatingCountBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#007A3D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  floatingCountText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  floatingPantryTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  floatingPantryRight: {
    backgroundColor: '#EA580C',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  floatingPantryBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
