import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import Colors from '../../constants/colors';
import { useAccount } from '../../context/AccountContext';
import { GAMIFICATION_LEVELS } from '../../data/seedData';

const ProfileCard = ({ onEditProfile, onStreakPress, onEcoPress }) => {
  const { profile } = useAccount();

  const userXp = profile.currentXp || profile.xp || 0;
  const currentLevel =
    GAMIFICATION_LEVELS.find((l) => userXp >= l.minXp && userXp < l.maxXp) ||
    (userXp >= 2000 ? GAMIFICATION_LEVELS[4] : GAMIFICATION_LEVELS[0]);

  const levelProgress = Math.min(
    100,
    Math.max(
      8,
      Math.round(
        ((userXp - currentLevel.minXp) / (currentLevel.maxXp - currentLevel.minXp)) * 100
      )
    )
  );
  const initial = (profile.name || profile.full_name || 'Chef').charAt(0).toUpperCase();

  return (
    <View style={styles.card}>
      {/* Avatar - matches Homepage profile icon */}
      {profile.avatarUrl || profile.avatar_url ? (
        <Image
          source={{ uri: profile.avatarUrl || profile.avatar_url }}
          style={styles.avatar}
        />
      ) : (
        <View style={styles.initialsAvatar}>
          <Text style={styles.initialsText}>{initial}</Text>
        </View>
      )}

      {/* Name & Email */}
      <Text style={styles.name}>{profile.name || 'StockPot Chef'}</Text>
      <Text style={styles.email}>{profile.email || 'chef@stockpot.ai'}</Text>

      {/* Account Bio */}
      <View style={styles.bioContainer}>
        <Text style={styles.bioText} numberOfLines={3}>
          {profile.bio?.trim()
            ? profile.bio.trim()
            : 'Passionate home cook exploring delicious zero-waste recipes & smart grocery savings 🍲'}
        </Text>
      </View>

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

      {/* Eco Badge & Streak Row */}
      <View style={styles.badgeRow}>
        <TouchableOpacity
          style={styles.ecoBadge}
          onPress={onEcoPress}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons
            name="flower-outline"
            size={18}
            color={Colors.forestGreen}
          />
          <Text style={styles.ecoText}>{profile.ecoTitle || 'Eco Saver 🌱'}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.streakBadge}
          onPress={onStreakPress}
          activeOpacity={0.7}
        >
          <Text style={styles.streakText}>{profile.streakDays || 7} days</Text>
          <Ionicons name="flame" size={18} color={Colors.terracotta} />
        </TouchableOpacity>
      </View>

      {/* Level & XP Progress Section */}
      <View style={styles.xpSection}>
        <View style={styles.xpLabelRow}>
          <View style={styles.levelBadgeChip}>
            <MaterialCommunityIcons
              name="chef-hat"
              size={14}
              color="#994122"
            />
            <Text style={styles.xpTitle}>
              LEVEL {currentLevel.level}: {currentLevel.name.toUpperCase()}
            </Text>
          </View>
          <Text style={styles.xpNumbers}>
            {userXp.toLocaleString()} / {currentLevel.maxXp.toLocaleString()} XP
          </Text>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressBarTrack}>
          <View style={[styles.progressBarFill, { width: `${levelProgress}%` }]} />
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
  initialsAvatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#007A3D',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#007A3D',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 4,
  },
  initialsText: {
    fontSize: 34,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
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
    marginBottom: 6,
    textAlign: 'center',
  },
  bioContainer: {
    backgroundColor: '#FAF8F5',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginTop: 6,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#EFEAE4',
    maxWidth: '94%',
  },
  bioText: {
    fontSize: 13,
    lineHeight: 18,
    color: '#6E615A',
    textAlign: 'center',
    fontStyle: 'italic',
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
  levelBadgeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  xpTitle: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#994122',
    letterSpacing: 0.6,
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
