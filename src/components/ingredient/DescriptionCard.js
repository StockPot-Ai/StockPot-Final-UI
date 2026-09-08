import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Colors from '../../constants/colors';

export default function DescriptionCard({
  description = 'A comforting, autumnal classic made with roasted pumpkin puree, a touch of cream, and fresh sage. This quick 20-minute recipe delivers a rich, velvety sauce that perfectly coats your favorite pasta. Ideal for a cozy weeknight dinner.',
}) {
  return (
    <View style={styles.wrapper}>
      <Text style={styles.title}>Description</Text>
      <Text style={styles.body}>{description}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginTop: 22,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    letterSpacing: -0.3,
    marginBottom: 8,
  },
  body: {
    fontSize: 14.5,
    lineHeight: 23,
    color: '#4B5563',
    letterSpacing: 0.1,
  },
});
