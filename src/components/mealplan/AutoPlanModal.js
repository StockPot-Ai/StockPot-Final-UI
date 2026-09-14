import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../constants/colors';

const BUDGET_PRESETS = [5000, 7500, 10000, 15000];
const DIET_STYLES = ['Balanced Sri Lankan', 'High Protein', 'Budget Saver', 'Vegetarian', 'Quick & Easy'];
const SERVINGS = [1, 2, 4, 6];

export default function AutoPlanModal({
  visible,
  onClose,
  onGeneratePlan,
}) {
  const [budget, setBudget] = useState(7500);
  const [servings, setServings] = useState(4);
  const [diet, setDiet] = useState('Balanced Sri Lankan');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    setIsGenerating(true);
    // Simulate smart planning optimization
    setTimeout(() => {
      setIsGenerating(false);
      onGeneratePlan({
        budget,
        servings,
        diet,
      });
      onClose();
    }, 900);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Smart 7-Day Auto Plan</Text>
              <Text style={styles.sub}>Generate a balanced weekly plan within budget</Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Ionicons name="close" size={20} color="#4B5563" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.body}>
            {/* Target Weekly Budget */}
            <Text style={styles.sectionLabel}>Target Weekly Budget</Text>
            <View style={styles.presetsGrid}>
              {BUDGET_PRESETS.map((b) => (
                <TouchableOpacity
                  key={b}
                  style={[styles.presetChip, budget === b && styles.presetChipActive]}
                  onPress={() => setBudget(b)}
                >
                  <Text style={[styles.presetText, budget === b && styles.presetTextActive]}>
                    Rs. {b.toLocaleString()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Household Servings */}
            <Text style={styles.sectionLabel}>Household Servings</Text>
            <View style={styles.servingsRow}>
              {SERVINGS.map((s) => (
                <TouchableOpacity
                  key={s}
                  style={[styles.servingChip, servings === s && styles.servingChipActive]}
                  onPress={() => setServings(s)}
                >
                  <Text style={[styles.servingText, servings === s && styles.servingTextActive]}>
                    {s} {s === 1 ? 'Person' : 'People'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Diet Style */}
            <Text style={styles.sectionLabel}>Dietary Preference</Text>
            <View style={styles.dietList}>
              {DIET_STYLES.map((d) => (
                <TouchableOpacity
                  key={d}
                  style={[styles.dietItem, diet === d && styles.dietItemActive]}
                  onPress={() => setDiet(d)}
                >
                  <Ionicons
                    name={diet === d ? "radio-button-on" : "radio-button-off"}
                    size={18}
                    color={diet === d ? Colors.primary : "#9CA3AF"}
                  />
                  <Text style={[styles.dietText, diet === d && styles.dietTextActive]}>
                    {d}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          {/* Action button */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.generateBtn}
              onPress={handleGenerate}
              disabled={isGenerating}
              activeOpacity={0.85}
            >
              {isGenerating ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="sparkles" size={18} color="#FFFFFF" />
                  <Text style={styles.generateBtnText}>Generate Weekly Schedule</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
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
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },
  sub: {
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
  body: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
    marginTop: 12,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  presetsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  presetChip: {
    flex: 1,
    minWidth: '45%',
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  presetChipActive: {
    backgroundColor: '#E8F8F0',
    borderColor: Colors.primary,
  },
  presetText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#4B5563',
  },
  presetTextActive: {
    color: Colors.primary,
  },
  servingsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  servingChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#F9FAFB',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  servingChipActive: {
    backgroundColor: '#E8F8F0',
    borderColor: Colors.primary,
  },
  servingText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4B5563',
  },
  servingTextActive: {
    color: Colors.primary,
  },
  dietList: {
    gap: 8,
  },
  dietItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 10,
  },
  dietItemActive: {
    backgroundColor: '#E8F8F0',
    borderColor: Colors.primary,
  },
  dietText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  dietTextActive: {
    color: Colors.primary,
    fontWeight: '700',
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  generateBtn: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  generateBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
