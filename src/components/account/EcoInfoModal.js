import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
} from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import Colors from '../../constants/colors';
import { useAccount } from '../../context/AccountContext';

const EcoInfoModal = ({ visible, onClose }) => {
  const { profile } = useAccount();

  const TIPS = [
    {
      title: 'Store Fresh Herbs Like Bouquets',
      desc: 'Place stems in a glass of water inside the fridge to double cilantro and parsley shelf life.',
    },
    {
      title: 'Veggie Scrap Broth',
      desc: 'Keep a freezer bag of onion ends, carrot peels, and celery tips to make homemade vegetable stock.',
    },
    {
      title: 'Stale Bread Croutons',
      desc: 'Toss dry sourdough cubes with olive oil, garlic, and herbs, then bake for 10 minutes at 180°C.',
    },
  ];

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.sheetContainer}>
          {/* Header */}
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Eco Impact & Green Tips</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <Feather name="x" size={22} color="#4B5563" />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Eco Badge Overview */}
            <View style={styles.heroCard}>
              <View style={styles.iconCircle}>
                <MaterialCommunityIcons name="flower-outline" size={32} color={Colors.forestGreen} />
              </View>
              <Text style={styles.heroTitle}>{profile.ecoTitle}</Text>
              <Text style={styles.heroSub}>
                You are in the top 5% of eco-conscious StockPot home cooks!
              </Text>
            </View>

            {/* Quick Tips */}
            <Text style={styles.sectionHeader}>Zero-Waste Kitchen Tips</Text>
            {TIPS.map((tip) => (
              <View key={tip.title} style={styles.tipCard}>
                <View style={styles.tipIconWrap}>
                  <MaterialCommunityIcons name="leaf" size={18} color={Colors.forestGreen} />
                </View>
                <View style={styles.tipTextWrap}>
                  <Text style={styles.tipTitle}>{tip.title}</Text>
                  <Text style={styles.tipDesc}>{tip.desc}</Text>
                </View>
              </View>
            ))}
          </ScrollView>

          {/* Action Row */}
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.doneBtn} onPress={onClose} activeOpacity={0.8}>
              <Text style={styles.doneBtnText}>Got It!</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    paddingBottom: Platform.OS === 'ios' ? 32 : 16,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3ECE4',
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.accountTextPrimary,
  },
  closeBtn: {
    padding: 4,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  heroCard: {
    backgroundColor: '#FAF7F2',
    borderWidth: 1,
    borderColor: Colors.accountBorder,
    borderRadius: 18,
    padding: 18,
    alignItems: 'center',
    marginBottom: 20,
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.statMintBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.forestGreen,
    marginBottom: 4,
  },
  heroSub: {
    fontSize: 13,
    color: Colors.accountTextSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  sectionHeader: {
    fontSize: 13.5,
    fontWeight: '700',
    color: Colors.accountSectionHeader,
    letterSpacing: 0.3,
    marginBottom: 10,
  },
  tipCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Colors.accountBorder,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    gap: 12,
    alignItems: 'flex-start',
  },
  tipIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.statMintBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  tipTextWrap: {
    flex: 1,
  },
  tipTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.accountTextPrimary,
    marginBottom: 2,
  },
  tipDesc: {
    fontSize: 12.5,
    color: Colors.accountTextSecondary,
    lineHeight: 17,
  },
  actionRow: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  doneBtn: {
    paddingVertical: 13,
    borderRadius: 12,
    backgroundColor: Colors.forestGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

export default EcoInfoModal;
