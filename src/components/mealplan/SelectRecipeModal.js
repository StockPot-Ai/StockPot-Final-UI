import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../constants/colors';
import { recipeService } from '../../services';

const CATEGORIES = ['All', 'Curry', 'Rice & Bread', 'Healthy', 'Quick (<20m)', 'Budget'];

const getRecipeThumb = (img) => {
  if (img && typeof img === 'string' && (img.startsWith('http') || img.startsWith('data:'))) {
    return { uri: img };
  }
  return require('../../../assets/creamy_pumpkin_pasta.jpg');
};

export default function SelectRecipeModal({
  visible,
  onClose,
  mealType = 'Lunch',
  onSelectRecipe,
}) {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  useEffect(() => {
    if (visible) {
      loadRecipes();
    }
  }, [visible]);

  const loadRecipes = async () => {
    setLoading(true);
    try {
      const data = await recipeService.getRecipes();
      setRecipes(data || []);
    } catch (e) {
      console.log('Error loading recipes for meal planner:', e.message);
    } finally {
      setLoading(false);
    }
  };

  const filtered = recipes.filter((r) => {
    const titleMatch = (r.title || r.name || '').toLowerCase().includes(search.toLowerCase());
    if (!titleMatch) return false;
    if (selectedCategory === 'All') return true;
    if (selectedCategory === 'Quick (<20m)') return (r.cookTime && r.cookTime.includes('15') || (r.prepTime && r.prepTime.includes('15')));
    if (selectedCategory === 'Budget') return (r.estimatedCost || r.base_cost || 0) < 600;
    return true;
  });

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.sheetTitle}>Select {mealType}</Text>
              <Text style={styles.sheetSub}>Pick a recipe to add to your plan</Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Ionicons name="close" size={20} color="#4B5563" />
            </TouchableOpacity>
          </View>

          {/* Search bar */}
          <View style={styles.searchRow}>
            <Ionicons name="search" size={17} color="#9CA3AF" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search recipes, ingredients..."
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

          {/* Categories */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryScroll}
          >
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.catChip,
                  selectedCategory === cat && styles.catChipActive,
                ]}
                onPress={() => setSelectedCategory(cat)}
              >
                <Text
                  style={[
                    styles.catText,
                    selectedCategory === cat && styles.catTextActive,
                  ]}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Recipe List */}
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={Colors.primary} />
              <Text style={styles.loadingText}>Loading recipes...</Text>
            </View>
          ) : (
            <ScrollView
              style={styles.listScroll}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.listContent}
            >
              {filtered.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Ionicons name="restaurant-outline" size={32} color="#9CA3AF" />
                  <Text style={styles.emptyTitle}>No matching recipes</Text>
                  <Text style={styles.emptySub}>Try searching with different keywords</Text>
                </View>
              ) : (
                filtered.map((item) => {
                  const cost = item.estimatedCost || item.base_cost || 450;
                  return (
                    <TouchableOpacity
                      key={item.id}
                      style={styles.recipeCard}
                      onPress={() => {
                        onSelectRecipe(item);
                        onClose();
                      }}
                      activeOpacity={0.8}
                    >
                      <Image
                        source={getRecipeThumb(item.image || item.image_url)}
                        style={styles.recipeImg}
                      />
                      <View style={styles.recipeInfo}>
                        <Text style={styles.recipeTitle} numberOfLines={1}>
                          {item.title || item.name}
                        </Text>
                        <Text style={styles.recipeMeta}>
                          ⏱️ {item.cookTime || item.prepTime || '25m'} • 🍳 {item.servings || 2} servings
                        </Text>
                        <Text style={styles.recipeCost}>
                          Rs. {cost.toLocaleString()}
                        </Text>
                      </View>
                      <View style={styles.addIconCircle}>
                        <Ionicons name="add" size={20} color="#FFFFFF" />
                      </View>
                    </TouchableOpacity>
                  );
                })
              )}
            </ScrollView>
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
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    paddingTop: 18,
    paddingBottom: 28,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 14,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },
  sheetSub: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    marginHorizontal: 20,
    paddingHorizontal: 12,
    height: 42,
    marginBottom: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#111827',
  },
  categoryScroll: {
    paddingHorizontal: 20,
    gap: 8,
    marginBottom: 14,
  },
  catChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
  },
  catChipActive: {
    backgroundColor: Colors.primary,
  },
  catText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4B5563',
  },
  catTextActive: {
    color: '#FFFFFF',
  },
  listScroll: {
    paddingHorizontal: 20,
  },
  listContent: {
    paddingBottom: 20,
  },
  recipeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 10,
    backgroundColor: '#FFFFFF',
    gap: 12,
  },
  recipeImg: {
    width: 58,
    height: 58,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
  },
  recipeInfo: {
    flex: 1,
  },
  recipeTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 2,
  },
  recipeMeta: {
    fontSize: 11,
    color: '#6B7280',
    marginBottom: 4,
  },
  recipeCost: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.primary,
  },
  addIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    fontSize: 13,
    color: '#6B7280',
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    gap: 6,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#374151',
  },
  emptySub: {
    fontSize: 12,
    color: '#9CA3AF',
  },
});
