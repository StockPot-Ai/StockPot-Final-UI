import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import Colors from '../../constants/colors';
import { useAccount } from '../../context/AccountContext';

const PREMIUM_FEATURES = [
  { icon: 'sparkles', title: 'Unlimited AI Sous-Chef', desc: 'Ask unlimited culinary questions, recipe substitutions & meal ideas' },
  { icon: 'calendar', title: '7-Day Smart Meal Planning', desc: 'Dietary & allergen-aware automated schedules tailored to your family' },
  { icon: 'git-merge', title: 'Split-Basket Optimizer', desc: 'Compare supermarkets & local grocers to find the maximum possible savings' },
  { icon: 'trophy', title: 'Premium Budget Challenges', desc: 'Feed 4 for 7 days under Rs. 7,500 with full price calculation & surplus tracking' },
  { icon: 'flame', title: 'Live Deal & Flash Sale Alerts', desc: 'Personalized discount notifications relevant to your shopping list' },
  { icon: 'pie-chart', title: 'Advanced Analytics & Trends', desc: 'Weekly, monthly & yearly savings dashboards and store benchmarks' },
  { icon: 'fitness', title: 'Macro & Nutrition Goals', desc: 'Protein-focused, calorie-aware and customized macro tracking' },
  { icon: 'people', title: 'Household Sharing', desc: 'Shared grocery lists, budgets & real-time household syncing' },
];

const PremiumUpgradeModal = ({ visible, onClose }) => {
  const { isPremium, customerPlan, upgradeToPremium, cancelPremium } = useAccount();
  const [billingCycle, setBillingCycle] = useState('monthly'); // 'monthly' | 'yearly'
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async () => {
    setLoading(true);
    try {
      const planId = billingCycle === 'yearly' ? 'customer_premium_yearly' : 'customer_premium_monthly';
      await upgradeToPremium(planId);
      setLoading(false);
      Alert.alert(
        '🎉 Welcome to StockPot Premium!',
        'You have unlocked unlimited AI intelligence, 7-day meal optimization, and budget challenges.\n\n🏆 You earned +100 XP bonus!',
        [{ text: 'Start Cooking Smart', onPress: onClose }]
      );
    } catch (err) {
      setLoading(false);
      Alert.alert('Error', err.message || 'Could not complete subscription.');
    }
  };

  const handleCancel = () => {
    Alert.alert(
      'Cancel Premium?',
      'Are you sure you want to cancel your Premium subscription? You will revert to the Free plan at the end of your billing cycle.',
      [
        { text: 'Keep Premium', style: 'cancel' },
        {
          text: 'Cancel Subscription',
          style: 'destructive',
          onPress: async () => {
            await cancelPremium();
            Alert.alert('Subscription Cancelled', 'You have reverted to the Free plan.');
            onClose();
          },
        },
      ]
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.starCircle}>
                <FontAwesome5 name="crown" size={18} color="#D97706" />
              </View>
              <View>
                <Text style={styles.headerTitle}>StockPot Premium</Text>
                <Text style={styles.headerSub}>Elevate your cooking & maximize grocery savings</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {/* Active Status Badge if already premium */}
            {isPremium ? (
              <View style={styles.activeBanner}>
                <Ionicons name="checkmark-circle" size={22} color="#166534" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.activeTitle}>You are a Premium Member ⭐</Text>
                  <Text style={styles.activeSub}>
                    Active plan: {customerPlan === 'customer_premium_yearly' ? 'Annual (Rs. 4,499/yr)' : 'Monthly (Rs. 499/mo)'}
                  </Text>
                </View>
              </View>
            ) : (
              <>
                {/* Billing Cycle Switcher */}
                <View style={styles.cycleSwitch}>
                  <TouchableOpacity
                    style={[styles.cycleBtn, billingCycle === 'monthly' && styles.cycleBtnActive]}
                    onPress={() => setBillingCycle('monthly')}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.cycleBtnText, billingCycle === 'monthly' && styles.cycleBtnTextActive]}>
                      Monthly
                    </Text>
                    <Text style={[styles.cyclePrice, billingCycle === 'monthly' && styles.cyclePriceActive]}>
                      Rs. 499/mo
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.cycleBtn, billingCycle === 'yearly' && styles.cycleBtnActive]}
                    onPress={() => setBillingCycle('yearly')}
                    activeOpacity={0.8}
                  >
                    <View style={styles.saveTag}>
                      <Text style={styles.saveTagText}>SAVE 25%</Text>
                    </View>
                    <Text style={[styles.cycleBtnText, billingCycle === 'yearly' && styles.cycleBtnTextActive]}>
                      Yearly
                    </Text>
                    <Text style={[styles.cyclePrice, billingCycle === 'yearly' && styles.cyclePriceActive]}>
                      Rs. 4,499/yr (Rs. 375/mo)
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}

            {/* Feature Checklist */}
            <Text style={styles.featuresHeading}>Everything in StockPot Premium</Text>
            {PREMIUM_FEATURES.map((item, idx) => (
              <View key={idx} style={styles.featureRow}>
                <View style={styles.featureIconWrap}>
                  <Ionicons name={item.icon} size={18} color="#007A3D" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.featureTitle}>{item.title}</Text>
                  <Text style={styles.featureDesc}>{item.desc}</Text>
                </View>
              </View>
            ))}

            {/* Comparison Matrix Note */}
            <View style={styles.freeVsPremBox}>
              <Text style={styles.freeVsPremTitle}>Free Plan vs. Premium Plan</Text>
              <Text style={styles.freeVsPremDesc}>
                Free users can always browse, create, like, rate recipes, use basic meal planning and check nearby shop prices. Premium brings the power of full AI automation and maximum multi-store split optimization.
              </Text>
            </View>

            <View style={{ height: 20 }} />
          </ScrollView>

          {/* Footer CTA */}
          <View style={styles.footer}>
            {isPremium ? (
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={handleCancel}
                activeOpacity={0.8}
              >
                <Text style={styles.cancelBtnText}>Manage / Cancel Subscription</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.subscribeBtn, loading && { opacity: 0.7 }]}
                onPress={handleSubscribe}
                disabled={loading}
                activeOpacity={0.88}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <FontAwesome5 name="crown" size={15} color="#FDE68A" style={{ marginRight: 6 }} />
                    <Text style={styles.subscribeBtnText}>
                      Upgrade to Premium — {billingCycle === 'yearly' ? 'Rs. 4,499 / Year' : 'Rs. 499 / Month'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  content: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    height: '88%',
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
    gap: 10,
  },
  starCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },
  headerSub: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 1,
  },
  closeBtn: {
    padding: 6,
  },
  body: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 14,
  },
  activeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    borderRadius: 14,
    padding: 14,
    gap: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  activeTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#166534',
  },
  activeSub: {
    fontSize: 12,
    color: '#166534',
    marginTop: 2,
  },
  cycleSwitch: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  cycleBtn: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  cycleBtnActive: {
    backgroundColor: '#ECFDF5',
    borderColor: '#007A3D',
  },
  saveTag: {
    position: 'absolute',
    top: -9,
    right: 10,
    backgroundColor: '#D97706',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  saveTagText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  cycleBtnText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#4B5563',
  },
  cycleBtnTextActive: {
    color: '#007A3D',
  },
  cyclePrice: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
    fontWeight: '600',
  },
  cyclePriceActive: {
    color: '#007A3D',
    fontWeight: '700',
  },
  featuresHeading: {
    fontSize: 14,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 10,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
  },
  featureIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  featureTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#111827',
  },
  featureDesc: {
    fontSize: 11.5,
    color: '#6B7280',
    lineHeight: 16,
    marginTop: 1,
  },
  freeVsPremBox: {
    backgroundColor: '#F9FAFB',
    borderRadius: 14,
    padding: 14,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  freeVsPremTitle: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 4,
  },
  freeVsPremDesc: {
    fontSize: 11.5,
    color: '#6B7280',
    lineHeight: 16,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  subscribeBtn: {
    backgroundColor: '#007A3D',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    shadowColor: '#007A3D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  subscribeBtnText: {
    color: '#FFFFFF',
    fontSize: 14.5,
    fontWeight: '800',
  },
  cancelBtn: {
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
  },
  cancelBtnText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#DC2626',
  },
});

export default PremiumUpgradeModal;
