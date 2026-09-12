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

export default function IngredientScreen({ recipe, onBack, onAddToMealPlan, onCompare }) {
  const [data, setData] = useState(recipe || {});
  const [servings, setServings] = useState(recipe?.servings || 4);
  const [ingredients, setIngredients] = useState(recipe?.ingredients || []);
  const [loading, setLoading] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [userRating, setUserRating] = useState(0);
  const [hasCooked, setHasCooked] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [reportModalVisible, setReportModalVisible] = useState(false);

  useEffect(() => {
    if (recipe) {
      setData(recipe);
      if (recipe.ingredients && recipe.ingredients.length > 0) {
        setIngredients(
          recipe.ingredients.map((ing, idx) => ({
            id: ing.id || `ing-${idx}`,
            name: ing.name || ing.ingredient_name,
            baseQuantity: parseInt(ing.quantity) || 100,
            unit: ing.unit || ing.quantity?.replace(/[0-9]/g, '').trim() || 'g',
            baseCost: ing.estimatedPrice || ing.base_cost || 150,
            inPantry: true,
            iconName: 'food-apple',
            iconLib: 'MaterialCommunityIcons',
          }))
        );
        setSelectedIds(recipe.ingredients.map((_, idx) => `ing-${idx}`));
      }
    }
  }, [recipe]);

  const handleServingsChange = (newServings) => {
    setServings(newServings);
  };

  const handleToggleItem = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === ingredients.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(ingredients.map((i) => i.id));
    }
  };

  const totalCost = Math.round(
    ingredients
      .filter((item) => selectedIds.includes(item.id))
      .reduce((acc, item) => acc + ((item.baseCost || 150) * servings) / (recipe?.servings || 4), 0)
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
    Alert.alert('🍳 Cook Logged!', `Awesome work chef! You prepared ${data.title}.\n\n🏆 You earned +15 XP!`);
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out "${data.title}" on StockPot AI! Cook for ~Rs. ${totalCost} (${servings} servings).`,
      });
    } catch (_) {}
  };

  const handleCompare = () => {
    if (!onCompare) return;
    const items = ingredients
      .filter((item) => selectedIds.includes(item.id))
      .map((item) => ({
        id: item.id,
        name: item.name,
        quantity: `${Math.round(((item.baseQuantity * servings) / (recipe?.servings || 4)) * 10) / 10} ${item.unit}`,
        cost: Math.round(((item.baseCost || 150) * servings) / (recipe?.servings || 4)),
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

        {/* Ingredients List */}
        <IngredientList
          ingredients={ingredients}
          servings={servings}
          selectedIds={selectedIds}
          onToggleItem={handleToggleItem}
          onSelectAll={handleSelectAll}
        />

        {/* Step by Step Cooking Directions */}
        {data.steps && data.steps.length > 0 && (
          <View style={styles.stepsCard}>
            <Text style={styles.stepsTitle}>Cooking Directions</Text>
            {data.steps.map((st, idx) => (
              <View key={idx} style={styles.stepRow}>
                <View style={styles.stepNum}>
                  <Text style={styles.stepNumText}>{idx + 1}</Text>
                </View>
                <Text style={styles.stepDesc}>{st}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Compare prices button */}
        <TouchableOpacity style={styles.compareBar} onPress={handleCompare} activeOpacity={0.85}>
          <Ionicons name="cart-outline" size={18} color="#166534" />
          <Text style={styles.compareText}>Compare Prices Across Supermarkets & Local Stores</Text>
          <Ionicons name="arrow-forward" size={16} color="#166534" />
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
    justifyContent: 'center',
    gap: 8,
    marginHorizontal: 20,
    marginTop: 14,
    marginBottom: 100,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#86EFAC',
    backgroundColor: '#F0FDF4',
  },
  compareText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#166534',
  },
});
