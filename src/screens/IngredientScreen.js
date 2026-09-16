import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  Text,
  StyleSheet,
  StatusBar,
  Alert,
  ActivityIndicator,
  Share,
} from 'react-native';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import Colors from '../constants/colors';
import IngredientHeader from '../components/ingredient/IngredientHeader';
import ServingsControl from '../components/ingredient/ServingsControl';
import IngredientList from '../components/ingredient/IngredientList';
import AddToMealPlanBar from '../components/ingredient/AddToMealPlanBar';
import RecipeReportModal from '../components/recipe/RecipeReportModal';
import { recipeService, mealPlanService, gamificationService } from '../services';

export const normalizeIngredients = (rawIngredients, defaultCost = 150) => {
  if (!rawIngredients) return [];

  // Case 1: Comma-separated string (e.g. from meal plan schedule: "Rice flour, eggs, onions, chili")
  if (typeof rawIngredients === 'string') {
    return rawIngredients
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
      .map((name, idx) => ({
        id: `ing-${idx}`,
        name,
        baseQuantity: 100,
        unit: 'g',
        baseCost: defaultCost,
        inPantry: true,
        iconName: 'food-apple',
        iconLib: 'MaterialCommunityIcons',
      }));
  }

  // Case 2: Array of items (either strings or objects)
  if (Array.isArray(rawIngredients)) {
    return rawIngredients
      .filter(Boolean)
      .map((ing, idx) => {
        if (typeof ing === 'string') {
          return {
            id: `ing-${idx}`,
            name: ing.trim(),
            baseQuantity: 100,
            unit: 'g',
            baseCost: defaultCost,
            inPantry: true,
            iconName: 'food-apple',
            iconLib: 'MaterialCommunityIcons',
          };
        }

        const name = ing.name || ing.ingredient_name || ing.title || `Ingredient ${idx + 1}`;
        const rawQty = ing.quantity != null ? ing.quantity : 100;
        let baseQty = 100;
        let unit = ing.unit || 'g';

        if (typeof rawQty === 'number') {
          baseQty = Math.round(rawQty) || 100;
        } else if (typeof rawQty === 'string') {
          const parsed = parseFloat(rawQty);
          if (!isNaN(parsed)) baseQty = parsed;
          const extractedUnit = rawQty.replace(/[0-9.]/g, '').trim();
          if (extractedUnit && !ing.unit) {
            unit = extractedUnit;
          }
        }

        const baseCost = Number(ing.estimatedPrice ?? ing.base_cost ?? ing.cost ?? ing.price) || defaultCost;

        return {
          id: String(ing.id || ing.ingredient_id || ing.productId || `ing-${idx}`),
          name: String(name),
          baseQuantity: baseQty,
          unit: unit || 'g',
          baseCost,
          inPantry: ing.inPantry !== false,
          iconName: ing.iconName || 'food-apple',
          iconLib: ing.iconLib || 'MaterialCommunityIcons',
          iconBg: ing.iconBg,
          iconColor: ing.iconColor,
        };
      });
  }

  return [];
};

export default function IngredientScreen({ recipe, onBack, onAddToMealPlan, onCompare }) {
  const [data, setData] = useState(recipe || {});
  const [servings, setServings] = useState(recipe?.servings || recipe?.base_servings || 4);
  const [ingredients, setIngredients] = useState(() =>
    normalizeIngredients(recipe?.ingredients, Math.round((recipe?.estimatedCost || recipe?.price || 600) / 4))
  );
  const [loading, setLoading] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [userRating, setUserRating] = useState(0);
  const [hasCooked, setHasCooked] = useState(false);
  const [selectedIds, setSelectedIds] = useState(() =>
    normalizeIngredients(recipe?.ingredients, Math.round((recipe?.estimatedCost || recipe?.price || 600) / 4)).map((i) => i.id)
  );
  const [reportModalVisible, setReportModalVisible] = useState(false);

  useEffect(() => {
    if (!recipe) return;

    setData(recipe);
    if (recipe.servings || recipe.base_servings) {
      setServings(recipe.servings || recipe.base_servings);
    }

    const norm = normalizeIngredients(
      recipe.ingredients,
      Math.round((recipe.estimatedCost || recipe.price || 600) / 4)
    );
    if (norm.length > 0) {
      setIngredients(norm);
      setSelectedIds(norm.map((i) => i.id));
    }

    // If recipe has an ID and needs full details (e.g. from backend API list which doesn't include ingredients/steps)
    if (recipe.id && (norm.length === 0 || !recipe.steps || recipe.steps.length === 0)) {
      setLoading(true);
      recipeService
        .getRecipeById(recipe.id)
        .then((full) => {
          if (full) {
            setData((prev) => ({ ...prev, ...full }));
            if (full.servings || full.base_servings) {
              setServings(full.servings || full.base_servings);
            }
            const fullNorm = normalizeIngredients(
              full.ingredients,
              Math.round((full.estimatedCost || 600) / 4)
            );
            if (fullNorm.length > 0) {
              setIngredients(fullNorm);
              setSelectedIds(fullNorm.map((i) => i.id));
            }
          }
        })
        .catch((err) => {
          console.warn('[IngredientScreen] Failed to fetch full recipe details:', err?.message || err);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [recipe]);

  const handleServingsChange = (newServings) => {
    setServings(newServings);
  };

  const handleToggleItem = (id) => {
    setSelectedIds((prev) => {
      const safePrev = Array.isArray(prev) ? prev : [];
      return safePrev.includes(id)
        ? safePrev.filter((item) => item !== id)
        : [...safePrev, id];
    });
  };

  const handleSelectAll = () => {
    const safeIngredients = Array.isArray(ingredients) ? ingredients : [];
    const safeSelectedIds = Array.isArray(selectedIds) ? selectedIds : [];
    if (safeSelectedIds.length === safeIngredients.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(safeIngredients.map((i) => i.id));
    }
  };

  const baseServings = Number(data?.servings || recipe?.servings || recipe?.base_servings) || 4;
  const safeIngredients = Array.isArray(ingredients) ? ingredients : [];
  const safeSelectedIds = Array.isArray(selectedIds) ? selectedIds : [];

  const totalCost = Math.round(
    safeIngredients
      .filter((item) => item && safeSelectedIds.includes(item.id))
      .reduce((acc, item) => acc + ((Number(item.baseCost) || 150) * (servings || 1)) / (baseServings || 4), 0)
  );

  const handleLike = async () => {
    const res = await recipeService.likeRecipe(data.id);
    setIsLiked(res.isLiked);
  };

  const handleSave = async () => {
    const res = await recipeService.saveRecipe(data.id);
    setIsSaved(res.isSaved);
    Alert.alert(res.isSaved ? 'Saved to Collection' : 'Removed from Collection', 'Recipe saved for quick cooking.');
  };

  const handleRate = async (stars) => {
    setUserRating(stars);
    await recipeService.rateRecipe(data.id, stars);
    Alert.alert('🌟 Rating Submitted!', `Thank you for rating ${stars} stars! (+10 XP earned)`);
  };

  const handleMarkCooked = async () => {
    setHasCooked(true);
    await recipeService.recordCook(data);
    Alert.alert('🍳 Cook Logged!', `Awesome work chef! You prepared ${data.title || data.name}.\n\n🏆 You earned +15 XP!`);
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out "${data.title || data.name}" on StockPot AI! Cook for ~Rs. ${totalCost} (${servings} servings).`,
      });
    } catch (_) {}
  };

  const handleCompare = () => {
    if (!onCompare) return;
    const items = safeIngredients
      .filter((item) => item && safeSelectedIds.includes(item.id))
      .map((item) => ({
        id: item.id,
        name: item.name,
        quantity: `${Math.round((((item.baseQuantity || 100) * servings) / (baseServings || 4)) * 10) / 10} ${item.unit || 'g'}`,
        cost: Math.round(((Number(item.baseCost) || 150) * servings) / (baseServings || 4)),
      }));
    onCompare(items);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <IngredientHeader
          title={data.title || data.name}
          rating={data.rating || '4.9'}
          time={data.prepTime || data.time || '25 min'}
          calories={data.calories ? `${data.calories} kcal` : '380 kcal'}
          image={data.image || data.image_url}
          onBack={onBack}
          onFavorite={handleSave}
          isFavorite={isSaved}
        />

        {/* Social Interaction Strip */}
        <View style={styles.interactionStrip}>
          <TouchableOpacity style={[styles.pillBtn, isLiked && styles.pillBtnActive]} onPress={handleLike}>
            <Ionicons name={isLiked ? 'heart' : 'heart-outline'} size={18} color={isLiked ? '#EF4444' : '#4B5563'} />
            <Text style={[styles.pillBtnText, isLiked && { color: '#EF4444' }]}>
              {isLiked ? (data.likesCount || 100) + 1 : data.likesCount || 100} Likes
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.pillBtn} onPress={handleShare}>
            <Ionicons name="share-social-outline" size={17} color="#4B5563" />
            <Text style={styles.pillBtnText}>Share</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.cookPillBtn, hasCooked && styles.cookPillBtnActive]}
            onPress={handleMarkCooked}
          >
            <FontAwesome5 name="check" size={13} color={hasCooked ? '#FFFFFF' : Colors.primary} />
            <Text style={[styles.cookPillText, hasCooked && { color: '#FFFFFF' }]}>
              {hasCooked ? 'Cooked! (+15 XP)' : 'I Cooked This'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setReportModalVisible(true)} style={styles.flagBtn}>
            <Ionicons name="flag-outline" size={16} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        {/* Author / Community Creator Card */}
        {data.author && (
          <View style={styles.authorCard}>
            <View style={styles.authorLeft}>
              <View style={styles.authorAvatarWrap}>
                <Ionicons name="person" size={18} color={Colors.primary} />
              </View>
              <View>
                <Text style={styles.authorName}>{data.author.name}</Text>
                <View style={styles.badgeTag}>
                  <Ionicons name="ribbon" size={11} color="#166534" />
                  <Text style={styles.badgeTagText}>{data.author.badge || 'Community Chef'}</Text>
                </View>
              </View>
            </View>
            <Text style={styles.authorCuisine}>{data.cuisine || 'Sri Lankan'}</Text>
          </View>
        )}

        {/* 1-5 Star Interactive Rating */}
        <View style={styles.ratingCard}>
          <Text style={styles.ratingPrompt}>Rate this community recipe:</Text>
          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity key={star} onPress={() => handleRate(star)} activeOpacity={0.7}>
                <Ionicons
                  name={star <= (userRating || Math.floor(data.rating || 5)) ? 'star' : 'star-outline'}
                  size={26}
                  color="#F59E0B"
                />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Servings Stepper */}
        <ServingsControl servings={servings} onServingsChange={handleServingsChange} min={1} max={10} />

        {/* Loading indicator if fetching ingredients from backend */}
        {loading && safeIngredients.length === 0 && (
          <View style={{ paddingVertical: 24, alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator size="small" color={Colors.primary} />
            <Text style={{ marginTop: 8, fontSize: 13, color: '#6B7280' }}>
              Fetching ingredients & recipe details...
            </Text>
          </View>
        )}

        {/* Ingredients List */}
        <IngredientList
          ingredients={safeIngredients}
          servings={servings}
          baseServings={baseServings}
          selectedIds={safeSelectedIds}
          onToggleItem={handleToggleItem}
          onSelectAll={handleSelectAll}
        />

        {/* Step by Step Cooking Directions */}
        {data.steps && Array.isArray(data.steps) && data.steps.length > 0 && (
          <View style={styles.stepsCard}>
            <Text style={styles.stepsTitle}>Cooking Directions</Text>
            {data.steps.map((st, idx) => (
              <View key={idx} style={styles.stepRow}>
                <View style={styles.stepNum}>
                  <Text style={styles.stepNumText}>{idx + 1}</Text>
                </View>
                <Text style={styles.stepDesc}>
                  {typeof st === 'string' ? st : (st?.description || st?.step || JSON.stringify(st))}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Compare prices button */}
        <TouchableOpacity style={styles.compareBar} onPress={handleCompare} activeOpacity={0.88}>
          <View style={styles.compareIconCircle}>
            <Ionicons name="cart" size={18} color="#007A3D" />
          </View>
          <View style={styles.compareTextCol}>
            <Text style={styles.compareTitle}>Compare Grocery Store Prices</Text>
            <Text style={styles.compareSubtitle}>Find cheapest supermarkets & local shops near you</Text>
          </View>
          <View style={styles.compareArrowCircle}>
            <Ionicons name="arrow-forward" size={16} color="#007A3D" />
          </View>
        </TouchableOpacity>
      </ScrollView>

      {/* Add To Meal Plan CTA */}
      <AddToMealPlanBar cost={totalCost} onPress={onAddToMealPlan} />

      {/* Report Modal */}
      <RecipeReportModal
        visible={reportModalVisible}
        recipe={data}
        onClose={() => setReportModalVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  interactionStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  pillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 5,
  },
  pillBtnActive: {
    backgroundColor: '#FEE2E2',
  },
  pillBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  cookPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 5,
  },
  cookPillBtnActive: {
    backgroundColor: Colors.primary,
  },
  cookPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#166534',
  },
  flagBtn: {
    marginLeft: 'auto',
    padding: 6,
  },
  authorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 20,
    marginTop: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  authorLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  authorAvatarWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  authorName: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#111827',
  },
  badgeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 2,
  },
  badgeTagText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#166534',
  },
  authorCuisine: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  ratingCard: {
    marginHorizontal: 20,
    marginTop: 12,
    backgroundColor: '#FFFBEB',
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  ratingPrompt: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#92400E',
    marginBottom: 6,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  stepsCard: {
    marginHorizontal: 20,
    marginTop: 14,
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  stepsTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 10,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
    gap: 10,
  },
  stepNum: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  stepNumText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#166534',
  },
  stepDesc: {
    flex: 1,
    fontSize: 13,
    color: '#374151',
    lineHeight: 18,
  },
  compareBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 90,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#DCFCE7',
    backgroundColor: '#F0FDF4',
    gap: 12,
    shadowColor: '#007A3D',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  compareIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  compareTextCol: {
    flex: 1,
  },
  compareTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#111827',
  },
  compareSubtitle: {
    fontSize: 11,
    color: '#007A3D',
    fontWeight: '500',
    marginTop: 2,
  },
  compareArrowCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#DCFCE7',
  },
});
