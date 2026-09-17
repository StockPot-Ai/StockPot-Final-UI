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
  ActivityIndicator,
  Image,
} from 'react-native';
import { Ionicons, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import Colors from '../../constants/colors';
import { recipeService } from '../../services';
import { useAccount } from '../../context/AccountContext';

const CUISINES = ['Sri Lankan', 'Indian', 'Italian', 'Asian Fusion', 'Continental', 'Mexican'];
const CATEGORIES = ['Breakfast', 'Lunch', 'Dinner', 'Snacks', 'Desserts'];
const DIFFICULTIES = ['Easy', 'Medium', 'Hard'];

const RECIPE_PRESET_IMAGES = [
  { label: 'Curry & Rice', uri: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=600' },
  { label: 'Creamy Pasta', uri: 'https://images.unsplash.com/photo-1621996346565-e3d5d6281691?w=600' },
  { label: 'Seafood', uri: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=600' },
  { label: 'Roti / Kottu', uri: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600' },
  { label: 'Healthy Bowl', uri: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600' },
];

const CreateRecipeModal = ({ visible, onClose, onRecipeCreated }) => {
  const { profile } = useAccount();
  const userEmail = profile?.email || '';

  const [step, setStep] = useState(1); // 1 = Details, 2 = Email Verification
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
  const [cookingSteps, setCookingSteps] = useState([
    'Chop and prepare all fresh vegetables and spices.',
    'Heat oil in a pan, sauté aromatics, and cook ingredients thoroughly.',
    'Season with salt and herbs, garnish, and serve hot.',
  ]);
  const [newStep, setNewStep] = useState('');

  const [dietaryTags, setDietaryTags] = useState(['Healthy', 'Gluten-Free']);
  const [allergens, setAllergens] = useState('None');
  
  // Email confirmation state
  const [verificationCode, setVerificationCode] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [isSendingOtp, setIsSendingOtp] = useState(false);
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
    setCookingSteps((prev) => [...prev, newStep.trim()]);
    setNewStep('');
  };

  const handleRemoveStep = (index) => {
    setCookingSteps((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleDirectPublish = async () => {
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
        steps: cookingSteps,
        dietaryTags,
        allergens: [allergens.trim() || 'None'],
        authorEmail: userEmail,
        authorName: profile?.name || 'Home Cook',
      };

      const res = await recipeService.createRecipe(payload);
      setIsSubmitting(false);

      if (res?.success) {
        Alert.alert(
          '🎉 Recipe Published!',
          `Your recipe "${payload.title}" is now live on StockPot Community!\n\n🏆 You earned +50 XP!`,
          [
            {
              text: 'Awesome!',
              onPress: () => {
                onRecipeCreated && onRecipeCreated(res.data || payload);
                handleClose();
              },
            },
          ]
        );
      } else {
        Alert.alert('Published', 'Recipe saved to community creations!');
        onRecipeCreated && onRecipeCreated(res?.data || payload);
        handleClose();
      }
    } catch (err) {
      setIsSubmitting(false);
      Alert.alert('Publish Note', err.message || 'Could not publish recipe.');
    }
  };

  const handleProceedToVerification = async () => {
    if (!title.trim()) {
      Alert.alert('Required', 'Please enter a recipe title');
      return;
    }
    if (ingredients.length === 0) {
      Alert.alert('Required', 'Please add at least one ingredient');
      return;
    }

    setIsSendingOtp(true);
    const res = await recipeService.sendRecipeEmailVerification(userEmail, title);
    setIsSendingOtp(false);
    setGeneratedCode(res.code);
    setStep(2);
  };

  const handleVerifyAndPublish = async () => {
    if (!verificationCode.trim() || verificationCode.trim().length < 4) {
      Alert.alert('Verification Code', 'Please enter the 6-digit confirmation code sent to your email.');
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
        steps: cookingSteps,
        dietaryTags,
        allergens: [allergens.trim() || 'None'],
        authorEmail: userEmail,
      };

      const res = await recipeService.verifyRecipeEmailAndPublish(verificationCode, payload);
      setIsSubmitting(false);

      if (res.success) {
        Alert.alert(
          '🎉 Recipe Verified & Published!',
          `Your recipe "${payload.title}" is now live on the Community Hub with Verified Author status!\n\n🏆 You earned +50 XP!`,
          [
            {
              text: 'Awesome!',
              onPress: () => {
                onRecipeCreated && onRecipeCreated(res.data);
                handleClose();
              },
            },
          ]
        );
      } else {
        Alert.alert('Verification Failed', res.message || 'Invalid code');
      }
    } catch (_) {
      setIsSubmitting(false);
      handleClose();
    }
  };

  const handleClose = () => {
    setStep(1);
    setVerificationCode('');
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
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
                <Text style={styles.headerTitle}>
                  {step === 1 ? 'Create Community Recipe' : 'Verify Author Email'}
                </Text>
                <Text style={styles.headerSub}>
                  {step === 1 ? 'Step 1 of 2: Recipe Details' : 'Step 2 of 2: Email Confirmation'}
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={handleClose} style={styles.closeBtn} activeOpacity={0.7}>
              <Ionicons name="close" size={22} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {step === 1 ? (
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

              {/* Recipe Cover Photo */}
              <Text style={styles.sectionLabel}>Dish Photo</Text>
              <View style={styles.photoPreviewCard}>
                <Image source={{ uri: imageUrl }} style={styles.photoPreviewImg} resizeMode="cover" />
                <View style={styles.photoOverlayBadge}>
                  <Ionicons name="camera" size={13} color="#FFFFFF" />
                  <Text style={styles.photoOverlayText}>Cover Preview</Text>
                </View>
              </View>

              <Text style={[styles.sectionLabel, { fontSize: 11.5, color: '#6B7280', marginTop: 8 }]}>Quick Presets or Custom URL:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
                {RECIPE_PRESET_IMAGES.map((preset) => {
                  const isSelected = imageUrl === preset.uri;
                  return (
                    <TouchableOpacity
                      key={preset.label}
                      style={[styles.photoPresetChip, isSelected && styles.photoPresetChipActive]}
                      onPress={() => setImageUrl(preset.uri)}
                      activeOpacity={0.75}
                    >
                      <Text style={[styles.photoPresetText, isSelected && styles.photoPresetTextActive]}>
                        {preset.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
              <TextInput
                style={[styles.input, { fontSize: 12, paddingVertical: 8, marginTop: 4 }]}
                placeholder="Or paste custom image URL (https://...)"
                placeholderTextColor="#9CA3AF"
                value={imageUrl}
                onChangeText={setImageUrl}
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
              <Text style={styles.sectionHeading}>Cooking Directions ({cookingSteps.length} steps)</Text>

              {cookingSteps.map((st, idx) => (
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
          ) : (
            /* Step 2: Email Confirmation Required View */
            <ScrollView style={styles.scrollBody} showsVerticalScrollIndicator={false}>
              <View style={styles.otpCard}>
                <View style={styles.emailIconCircle}>
                  <Ionicons name="mail-open" size={32} color="#007A3D" />
                </View>
                <Text style={styles.otpCardTitle}>Author Verification Required</Text>
                <Text style={styles.otpCardDesc}>
                  To prevent spam and maintain verified recipe quality on StockPot, please confirm your registered email:
                </Text>
                <View style={styles.emailChip}>
                  <Ionicons name="person-circle" size={16} color="#007A3D" />
                  <Text style={styles.emailChipText}>{userEmail}</Text>
                </View>

                <Text style={styles.otpPromptLabel}>Enter 6-digit confirmation code:</Text>
                <TextInput
                  style={styles.otpInput}
                  placeholder="e.g. 742910"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                  maxLength={6}
                  value={verificationCode}
                  onChangeText={setVerificationCode}
                />

                {generatedCode ? (
                  <TouchableOpacity
                    style={styles.demoCodePill}
                    onPress={() => setVerificationCode(generatedCode)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="flash" size={14} color="#D97706" />
                    <Text style={styles.demoCodeText}>
                      Auto-fill verification code: <Text style={{ fontWeight: '800' }}>{generatedCode}</Text>
                    </Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            </ScrollView>
          )}

          {/* Footer CTA */}
          <View style={styles.footer}>
            {step === 1 ? (
              <View style={{ gap: 8 }}>
                <TouchableOpacity
                  style={styles.submitBtn}
                  onPress={handleDirectPublish}
                  disabled={isSubmitting}
                  activeOpacity={0.85}
                >
                  {isSubmitting ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Ionicons name="sparkles" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                      <Text style={styles.submitBtnText}>Publish Recipe (+50 XP) 🚀</Text>
                    </>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.backStepBtn}
                  onPress={handleProceedToVerification}
                  activeOpacity={0.7}
                >
                  <Text style={styles.backStepText}>Optional: Verify with email code →</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={{ gap: 8 }}>
                <TouchableOpacity
                  style={styles.submitBtn}
                  onPress={handleVerifyAndPublish}
                  disabled={isSubmitting}
                  activeOpacity={0.85}
                >
                  {isSubmitting ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Ionicons name="checkmark-done" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                      <Text style={styles.submitBtnText}>Confirm Code & Publish</Text>
                    </>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.backStepBtn}
                  onPress={() => setStep(1)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.backStepText}>← Edit Recipe Details</Text>
                </TouchableOpacity>
              </View>
            )}
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
  photoPreviewCard: {
    width: '100%',
    height: 140,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#F3F4F6',
    position: 'relative',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 6,
  },
  photoPreviewImg: {
    width: '100%',
    height: '100%',
  },
  photoOverlayBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  photoOverlayText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  photoPresetChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  photoPresetChipActive: {
    backgroundColor: '#DCFCE7',
    borderColor: '#007A3D',
  },
  photoPresetText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4B5563',
  },
  photoPresetTextActive: {
    color: '#007A3D',
    fontWeight: '700',
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

  // OTP Card
  otpCard: {
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 18,
    padding: 24,
    marginTop: 12,
  },
  emailIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  otpCardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 6,
  },
  otpCardDesc: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 14,
  },
  emailChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F8F0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
    marginBottom: 18,
  },
  emailChipText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#007A3D',
  },
  otpPromptLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  otpInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: Colors.primary,
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 12,
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 6,
    textAlign: 'center',
    color: '#1E293B',
    width: '75%',
    marginBottom: 12,
  },
  demoCodePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 6,
    marginTop: 4,
  },
  demoCodeText: {
    fontSize: 12,
    color: '#92400E',
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
  backStepBtn: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  backStepText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
});

export default CreateRecipeModal;
