import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import Colors from '../../constants/colors';
import { useAccount } from '../../context/AccountContext';

const ProfileCard = ({ onEditProfile, onStreakPress, onEcoPress }) => {
  const { profile } = useAccount();

  const xpPercent = Math.min(
    100,
    Math.max(0, Math.round((profile.currentXp / profile.maxXp) * 100))
  );

  return (
    <View style={styles.card}>
      {/* Avatar */}
      <Image
        source={require('../../../assets/ammar_avatar.jpg')}
        style={styles.avatar}
      />

      {/* Name & Email */}
      <Text style={styles.name}>{profile.name}</Text>
      <Text style={styles.email}>{profile.email}</Text>

      {/* Edit Profile Pill Button */}
      <TouchableOpacity
        style={styles.editBtn}
        onPress={onEditProfile}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel="Edit Profile"
      >
        <Text style={styles.editBtnText}>Edit Profile</Text>
      </TouchableOpacity>

      {/* Eco Saver & Streak Row */}
      <View style={styles.badgeRow}>
        <TouchableOpacity
          style={styles.ecoBadge}
          onPress={onEcoPress}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons
            name="flower-outline"
            size={19}
            color={Colors.forestGreen}
          />
          <Text style={styles.ecoText}>{profile.ecoTitle}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.streakBadge}
          onPress={onStreakPress}
          activeOpacity={0.7}
        >
          <Text style={styles.streakText}>{profile.streakDays} days</Text>
          <Ionicons name="flame" size={18} color={Colors.terracotta} />
        </TouchableOpacity>
      </View>

      {/* XP Progress Section */}
      <View style={styles.xpSection}>
        <View style={styles.xpLabelRow}>
          <Text style={styles.xpTitle}>XP PROGRESS</Text>
          <Text style={styles.xpNumbers}>
            {profile.currentXp.toLocaleString()} / {profile.maxXp.toLocaleString()} XP
          </Text>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressBarTrack}>
          <View style={[styles.progressBarFill, { width: `${xpPercent}%` }]} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.accountCardBg,
    borderRadius: 20,
    marginHorizontal: 16,
    marginTop: 4,
    marginBottom: 16,
    paddingVertical: 24,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.accountBorder,
    shadowColor: 'rgba(0,0,0,0.05)',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 3,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    marginBottom: 14,
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  name: {
    fontSize: 21,
    fontWeight: '800',
    color: Colors.accountTextPrimary,
    letterSpacing: -0.2,
    marginBottom: 3,
    textAlign: 'center',
  },
  email: {
    fontSize: 13.5,
    fontWeight: '400',
    color: Colors.accountTextSecondary,
    marginBottom: 16,
    textAlign: 'center',
  },
  editBtn: {
    borderWidth: 1.5,
    borderColor: Colors.forestGreen,
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 22,
    marginBottom: 18,
    backgroundColor: '#FFFFFF',
  },
  editBtnText: {
    color: Colors.forestGreen,
    fontSize: 13.5,
    fontWeight: '700',
  },
  badgeRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  ecoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#D1FAE5',
  },
  ecoText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.forestGreen,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFF7ED',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FED7AA',
  },
  streakText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.terracotta,
  },
  xpSection: {
    width: '100%',
    paddingHorizontal: 4,
  },
  xpLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  xpTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.accountSectionHeader,
    letterSpacing: 0.8,
  },
  xpNumbers: {
    fontSize: 11.5,
    fontWeight: '700',
    color: Colors.accountTextPrimary,
    letterSpacing: 0.2,
  },
  progressBarTrack: {
    width: '100%',
    height: 7,
    backgroundColor: Colors.progressTrack,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.progressFill,
    borderRadius: 4,
  },
});

export default ProfileCard;
