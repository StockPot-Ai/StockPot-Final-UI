import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import Colors from '../../constants/colors';
import { recipeService } from '../../services';

const CUISINES = ['Sri Lankan', 'Indian', 'Italian', 'Asian Fusion', 'Continental', 'Mexican'];
const CATEGORIES = ['Breakfast', 'Lunch', 'Dinner', 'Snacks', 'Desserts'];
const DIFFICULTIES = ['Easy', 'Medium', 'Hard'];

const CreateRecipeModal = ({ visible, onClose, onRecipeCreated }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Dinner');
  const [cuisine, setCuisine] = useState('Sri Lankan');
  const [difficulty, setDifficulty] = useState('Easy');
  const [prepTime, setPrepTime] = useState('15 mins');
  const [cookTime, setCookTime] = useState('25 mins');
  const [servings, setServings] = useState('4');
  const [estimatedCost, setEstimatedCost] = useState('850');
  const [calories, setCalories] = useState('320');
  const [imageUrl, setImageUrl] = useState('https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600');
  
  // Ingredients list
  const [ingredients, setIngredients] = useState([
    { name: 'Fresh Ingredients', quantity: '500g', estimatedPrice: 400 },
  ]);
  const [newIngName, setNewIngName] = useState('');
  const [newIngQty, setNewIngQty] = useState('');

  // Steps
  const [steps, setSteps] = useState([
    'Chop and prepare all fresh vegetables and spices.',
    'Heat oil in a pan, sauté aromatics, and cook ingredients thoroughly.',
    'Season with salt and herbs, garnish, and serve hot.',
  ]);
  const [newStep, setNewStep] = useState('');

  const [dietaryTags, setDietaryTags] = useState(['Healthy', 'Gluten-Free']);
  const [allergens, setAllergens] = useState('None');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddIngredient = () => {
    if (!newIngName.trim()) return;
    setIngredients((prev) => [
      ...prev,
      { name: newIngName.trim(), quantity: newIngQty.trim() || '1 cup', estimatedPrice: 150 },
    ]);
    setNewIngName('');
    setNewIngQty('');
  };

  const handleRemoveIngredient = (index) => {
    setIngredients((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleAddStep = () => {
    if (!newStep.trim()) return;
    setSteps((prev) => [...prev, newStep.trim()]);
    setNewStep('');
  };

  const handleRemoveStep = (index) => {
    setSteps((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert('Required', 'Please enter a recipe title');
      return;
    }
    if (ingredients.length === 0) {
      Alert.alert('Required', 'Please add at least one ingredient');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        title: title.trim(),
        description: description.trim() || 'A delicious homemade recipe.',
        category,
        cuisine,
        difficulty,
        prepTime,
        cookTime,
        servings: parseInt(servings) || 4,
        estimatedCost: parseInt(estimatedCost) || 800,
        calories: parseInt(calories) || 300,
        image: imageUrl,
        ingredients,
        steps,
        dietaryTags,
        allergens: [allergens.trim() || 'None'],
      };

      const res = await recipeService.createRecipe(payload);
      setIsSubmitting(false);

      Alert.alert(
        '🎉 Recipe Published!',
        'Your recipe has been published to the community feed!\n\n🏆 You earned +50 XP and the Recipe Starter badge!',
        [{ text: 'Great!', onPress: () => {
          onRecipeCreated && onRecipeCreated(res.data);
          onClose();
        }}]
      );
    } catch (err) {
      setIsSubmitting(false);
      Alert.alert('Error', 'Could not save recipe.');
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.modalOverlay}
      >
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.iconCircle}>
                <Ionicons name="restaurant" size={20} color={Colors.primary} />
              </View>
              <View>
                <Text style={styles.headerTitle}>Create Community Recipe</Text>
                <Text style={styles.headerSub}>Earn +50 XP for contributing</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <Ionicons name="close" size={22} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollBody} showsVerticalScrollIndicator={false}>
            {/* Title & Description */}
            <Text style={styles.sectionLabel}>Recipe Title *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Crispy Jaffna Crab Curry"
              placeholderTextColor="#9CA3AF"
              value={title}
              onChangeText={setTitle}
            />

            <Text style={styles.sectionLabel}>Short Description</Text>
            <TextInput
              style={[styles.input, { height: 64 }]}
              placeholder="A brief appetizing story or overview of the dish..."
              placeholderTextColor="#9CA3AF"
              multiline
              value={description}
              onChangeText={setDescription}
            />

            {/* Category Chips */}
            <Text style={styles.sectionLabel}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
              {CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.chip, category === cat && styles.chipActive]}
                  onPress={() => setCategory(cat)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.chipText, category === cat && styles.chipTextActive]}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Cuisine Chips */}
            <Text style={styles.sectionLabel}>Cuisine</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
              {CUISINES.map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[styles.chip, cuisine === c && styles.chipActive]}
                  onPress={() => setCuisine(c)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.chipText, cuisine === c && styles.chipTextActive]}>{c}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Timing & Budget Row */}
            <View style={styles.rowInputs}>
              <View style={{ flex: 1 }}>
                <Text style={styles.sectionLabel}>Prep Time</Text>
                <TextInput
                  style={styles.input}
                  value={prepTime}
                  onChangeText={setPrepTime}
                  placeholder="15 mins"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
              <View style={{ flex: 1, marginHorizontal: 8 }}>
                <Text style={styles.sectionLabel}>Cook Time</Text>
                <TextInput
                  style={styles.input}
                  value={cookTime}
                  onChangeText={setCookTime}
                  placeholder="25 mins"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.sectionLabel}>Est. Cost (Rs.)</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={estimatedCost}
                  onChangeText={setEstimatedCost}
                  placeholder="850"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
            </View>

            {/* Ingredients Section */}
            <View style={styles.divider} />
            <Text style={styles.sectionHeading}>Ingredients List ({ingredients.length})</Text>

            {ingredients.map((ing, idx) => (
              <View key={idx} style={styles.itemRow}>
                <Ionicons name="checkmark-circle" size={16} color={Colors.primary} />
                <Text style={styles.itemText}>
                  {ing.name} <Text style={styles.itemQty}>({ing.quantity})</Text>
                </Text>
                <TouchableOpacity onPress={() => handleRemoveIngredient(idx)}>
                  <Ionicons name="trash-outline" size={16} color="#EF4444" />
                </TouchableOpacity>
              </View>
            ))}

            <View style={styles.addRow}>
              <TextInput
                style={[styles.input, { flex: 2, marginBottom: 0 }]}
                placeholder="Ingredient name"
                placeholderTextColor="#9CA3AF"
                value={newIngName}
                onChangeText={setNewIngName}
              />
              <TextInput
                style={[styles.input, { flex: 1, marginHorizontal: 6, marginBottom: 0 }]}
                placeholder="Qty (e.g. 200g)"
                placeholderTextColor="#9CA3AF"
                value={newIngQty}
                onChangeText={setNewIngQty}
              />
              <TouchableOpacity style={styles.addBtn} onPress={handleAddIngredient}>
                <Ionicons name="add" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            {/* Cooking Steps Section */}
            <View style={styles.divider} />
            <Text style={styles.sectionHeading}>Cooking Directions ({steps.length} steps)</Text>

            {steps.map((st, idx) => (
              <View key={idx} style={styles.stepItem}>
                <View style={styles.stepBadge}>
                  <Text style={styles.stepBadgeText}>{idx + 1}</Text>
                </View>
                <Text style={styles.stepText}>{st}</Text>
                <TouchableOpacity onPress={() => handleRemoveStep(idx)}>
                  <Ionicons name="close" size={16} color="#9CA3AF" />
                </TouchableOpacity>
              </View>
            ))}

            <View style={styles.addRow}>
              <TextInput
                style={[styles.input, { flex: 1, marginRight: 8, marginBottom: 0 }]}
                placeholder="Add step description..."
                placeholderTextColor="#9CA3AF"
                value={newStep}
                onChangeText={setNewStep}
              />
              <TouchableOpacity style={styles.addBtn} onPress={handleAddStep}>
                <Ionicons name="add" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            <View style={{ height: 30 }} />
          </ScrollView>

          {/* Footer CTA */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.submitBtn, isSubmitting && { opacity: 0.7 }]}
              onPress={handleSubmit}
              disabled={isSubmitting}
              activeOpacity={0.85}
            >
              <FontAwesome5 name="paper-plane" size={16} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.submitBtnText}>
                {isSubmitting ? 'Publishing...' : 'Publish Recipe (+50 XP)'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '90%',
    paddingTop: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1F2937',
  },
  headerSub: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '600',
  },
  closeBtn: {
    padding: 6,
  },
  scrollBody: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 14,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
    marginTop: 10,
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 10,
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#1F2937',
    marginBottom: 8,
  },
  chipScroll: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    marginRight: 8,
  },
  chipActive: {
    backgroundColor: Colors.primary,
  },
  chipText: {
    fontSize: 12.5,
    color: '#4B5563',
    fontWeight: '500',
  },
  chipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  rowInputs: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 14,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 10,
    borderRadius: 10,
    marginBottom: 6,
    gap: 8,
  },
  itemText: {
    flex: 1,
    fontSize: 13.5,
    color: '#1F2937',
    fontWeight: '500',
  },
  itemQty: {
    color: '#6B7280',
    fontWeight: '400',
  },
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  addBtn: {
    backgroundColor: Colors.primary,
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F9FAFB',
    padding: 10,
    borderRadius: 10,
    marginBottom: 8,
    gap: 10,
  },
  stepBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  stepBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#166534',
  },
  stepText: {
    flex: 1,
    fontSize: 13,
    color: '#374151',
    lineHeight: 18,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  submitBtn: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});

export default CreateRecipeModal;
