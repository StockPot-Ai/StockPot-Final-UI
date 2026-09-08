import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import Colors from '../../constants/colors';

const DEFAULT_DAYS = [
  { id: 'mon', day: 'MON', date: '12', isPast: true },
  { id: 'tue', day: 'TUE', date: '13', isPast: false },
  { id: 'wed', day: 'WED', date: '14', isPast: false },
  { id: 'thu', day: 'THU', date: '15', isPast: false },
  { id: 'fri', day: 'FRI', date: '16', isPast: false },
  { id: 'sat', day: 'SAT', date: '17', isPast: false },
  { id: 'sun', day: 'SUN', date: '18', isPast: false },
];

export default function DaySelector({
  days = DEFAULT_DAYS,
  selectedDayId = 'tue',
  onSelectDay,
}) {
  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {days.map((item) => {
          const isSelected = item.id === selectedDayId;

          return (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.dayCard,
                item.isPast && !isSelected && styles.dayCardPast,
                isSelected && styles.dayCardSelected,
              ]}
              onPress={() => onSelectDay && onSelectDay(item.id)}
              activeOpacity={0.75}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
              accessibilityLabel={`${item.day} ${item.date}`}
            >
              <Text
                style={[
                  styles.dayLabel,
                  item.isPast && !isSelected && styles.dayLabelPast,
                  isSelected && styles.dayLabelSelected,
                ]}
              >
                {item.day}
              </Text>
              <Text
                style={[
                  styles.dateNumber,
                  item.isPast && !isSelected && styles.dateNumberPast,
                  isSelected && styles.dateNumberSelected,
                ]}
              >
                {item.date}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  scrollContent: {
    paddingHorizontal: 16,
    flexDirection: 'row',
    gap: 10,
  },
  dayCard: {
    width: 58,
    height: 64,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#FEE8DC',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  dayCardPast: {
    backgroundColor: '#EFECE8',
    borderColor: '#EFECE8',
  },
  dayCardSelected: {
    backgroundColor: Colors.terracottaDeep,
    borderColor: Colors.terracottaDeep,
    shadowColor: Colors.terracottaDeep,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 4,
  },
  dayLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textPrimary,
    letterSpacing: 0.2,
  },
  dayLabelPast: {
    color: '#6B7280',
  },
  dayLabelSelected: {
    color: '#FFFFFF',
  },
  dateNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  dateNumberPast: {
    color: '#1A1A1A',
  },
  dateNumberSelected: {
    color: '#FFFFFF',
  },
});
