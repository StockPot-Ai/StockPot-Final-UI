import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../constants/colors';

export default function AvailableIngredientsCard({
  availableCount = 4,
  totalCount = 8,
  availableItems = ['Rigatoni Pasta', 'Garlic Cloves', 'Olive Oil', 'Parmesan'],
  onFilterChange,
}) {
  const [activeFilter, setActiveFilter] = useState('all');

  const handleToggle = (filterKey) => {
    const nextFilter = activeFilter === filterKey ? 'all' : filterKey;
    setActiveFilter(nextFilter);
    if (onFilterChange) onFilterChange(nextFilter);
  };

  return (
    <View style={styles.wrapper}>
      <Text style={styles.sectionTitle}>Available Ingredients</Text>

      <View style={styles.card}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Outlined indicator pill matching the design */}
          <TouchableOpacity
            style={[
              styles.pillOutline,
              activeFilter === 'available' && styles.pillActive,
            ]}
            onPress={() => handleToggle('available')}
            activeOpacity={0.7}
          >
            {activeFilter === 'available' ? (
              <Ionicons name="checkmark" size={14} color={Colors.primary} />
            ) : null}
          </TouchableOpacity>

          {/* Available tags */}
          <TouchableOpacity
            style={[
              styles.summaryChip,
              activeFilter === 'available' && styles.summaryChipActive,
            ]}
            onPress={() => handleToggle('available')}
            activeOpacity={0.7}
          >
            <Ionicons
              name="cube-outline"
              size={13}
              color={activeFilter === 'available' ? Colors.primaryDark : '#4B5563'}
            />
            <Text
              style={[
                styles.summaryText,
                activeFilter === 'available' && styles.summaryTextActive,
              ]}
            >
              {availableCount} of {totalCount} in Pantry
            </Text>
          </TouchableOpacity>

          {availableItems.map((item, idx) => (
            <View key={idx} style={styles.itemChip}>
              <Text style={styles.itemChipText}>{item}</Text>
            </View>
          ))}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    letterSpacing: -0.3,
    marginBottom: 12,
  },
  card: {
    backgroundColor: '#FFF8F5',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#FEEFE7',
  },
  scrollContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 2,
  },
  pillOutline: {
    width: 42,
    height: 26,
    borderRadius: 13,
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillActive: {
    borderColor: Colors.primary,
    backgroundColor: '#E8F5E9',
  },
  summaryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  summaryChipActive: {
    borderColor: Colors.primary,
    backgroundColor: '#F0FDF4',
  },
  summaryText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#4B5563',
  },
  summaryTextActive: {
    color: Colors.primaryDark,
  },
  itemChip: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  itemChipText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
});
