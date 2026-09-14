import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import Colors from '../../constants/colors';

const DAYS_OF_WEEK = [
  { id: 'mon', day: 'Mon', date: '15' },
  { id: 'tue', day: 'Tue', date: '16' },
  { id: 'wed', day: 'Wed', date: '17' },
  { id: 'thu', day: 'Thu', date: '18' },
  { id: 'fri', day: 'Fri', date: '19' },
  { id: 'sat', day: 'Sat', date: '20' },
  { id: 'sun', day: 'Sun', date: '21' },
];

export default function DaySelector({
  selectedDayId = 'mon',
  onSelectDay,
  mealCounts = {},
}) {
  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {DAYS_OF_WEEK.map((item) => {
          const isSelected = item.id === selectedDayId;
          const count = mealCounts[item.id] || 0;

          return (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.dayCard,
                isSelected && styles.dayCardSelected,
              ]}
              onPress={() => onSelectDay && onSelectDay(item.id)}
              activeOpacity={0.8}
            >
              <Text style={[styles.dayLabel, isSelected && styles.dayLabelSelected]}>
                {item.day}
              </Text>
              <Text style={[styles.dateNumber, isSelected && styles.dateNumberSelected]}>
                {item.date}
              </Text>
              
              {/* Meal count dot indicator */}
              <View style={styles.dotRow}>
                {count > 0 ? (
                  <View style={[styles.activeDot, isSelected && styles.activeDotSelected]} />
                ) : (
                  <View style={styles.emptyDot} />
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
  },
  scrollContent: {
    paddingHorizontal: 16,
    flexDirection: 'row',
    gap: 8,
  },
  dayCard: {
    width: 52,
    height: 70,
    borderRadius: 16,
    backgroundColor: '#F9FAFB',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
  },
  dayCardSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  dayLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 2,
  },
  dayLabelSelected: {
    color: 'rgba(255, 255, 255, 0.85)',
  },
  dateNumber: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1F2937',
    marginBottom: 4,
  },
  dateNumberSelected: {
    color: '#FFFFFF',
  },
  dotRow: {
    height: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: Colors.primary,
  },
  activeDotSelected: {
    backgroundColor: '#FFFFFF',
  },
  emptyDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'transparent',
  },
});
