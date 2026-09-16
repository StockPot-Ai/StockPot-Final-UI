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
  Dimensions,
} from 'react-native';
import { Ionicons, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import Colors from '../../constants/colors';
import { useAccount } from '../../context/AccountContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const PLANS_CONFIG = [
  {
    id: 'customer_smart',
    name: 'StockPot Smart',
    tagline: 'Essential AI cooking & smart grocery savings',
    price: 499,
    formattedPrice: 'Rs. 499',
    period: '/ month',
    badge: 'Popular ⭐',
    badgeColor: '#007A3D',
    badgeBg: '#DCFCE7',
    cardBorder: '#86EFAC',
    activeBg: '#F0FDF4',
    icon: 'flash',
    features: [
      'AI Sous-Chef assistance (50 queries/day)',
      '7-Day budget & allergen meal planning',
      'Multi-Store Split-Basket Price Optimizer',
      'Supermarket price drop & deal alerts',
      'Smart shopping basket auto-sync',
      'Weekly & monthly savings tracking',
    ],
  },
  {
    id: 'customer_pro',
    name: 'StockPot Pro',
    tagline: 'Unlimited AI power, macro optimizer & family syncing',
    price: 999,
    formattedPrice: 'Rs. 999',
    period: '/ month',
    badge: 'Ultimate Power 👑',
    badgeColor: '#B45309',
    badgeBg: '#FEF3C7',
    cardBorder: '#FCD34D',
    activeBg: '#FFFBEB',
    icon: 'crown',
    features: [
      'Unlimited AI Sous-Chef & photo recipe generation',
      '14-Day automated meal & macro schedule',
      'Multi-Member Household Sharing & sync',
      'High-priority flash sale & price drop alerts',
      'Calorie, protein & macro nutrient tracking',
      'VIP Budget Challenges (Feed 4 under Rs. 7.5k)',
      'Yearly savings reports & store benchmarks',
      'VIP Chef Profile Badge & 24/7 priority support',
    ],
  },
];

const PremiumUpgradeModal = ({ visible, onClose }) => {
  const { isPremium, isPro, customerPlan, upgradeToPremium, cancelPremium } = useAccount();
  const [selectedPlanId, setSelectedPlanId] = useState(
    customerPlan === 'customer_pro' ? 'customer_pro' : 'customer_smart'
  );
  const [loading, setLoading] = useState(false);

  const selectedPlan = PLANS_CONFIG.find((p) => p.id === selectedPlanId) || PLANS_CONFIG[0];
  const isCurrentlyActivePlan = customerPlan === selectedPlanId;

  const handleSubscribe = () => {
    Alert.alert(
      '🚀 Coming Soon!',
      `StockPot ${selectedPlan.name} (${selectedPlan.formattedPrice}/mo) and online payment processing are coming soon in our next release.\n\nYour account will not be charged. Stay tuned!`,
      [{ text: 'OK', style: 'default' }]
    );
  };

  const handleCancel = () => {
    Alert.alert(
      'Cancel Membership?',
      'Are you sure you want to cancel your active plan? You will revert to the Free Starter plan at the end of your billing cycle.',
      [
        { text: 'Keep My Plan', style: 'cancel' },
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
                <Text style={styles.headerTitle}>StockPot Memberships</Text>
                <Text style={styles.headerSub}>Choose the plan that fits your kitchen goals</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <Ionicons name="close" size={22} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {/* Active Status Banner if user already subscribed */}
            {isPremium && (
              <View style={styles.activeBanner}>
                <Ionicons name="checkmark-circle" size={22} color="#166534" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.activeTitle}>
                    You are on {customerPlan === 'customer_pro' ? 'StockPot Pro (Rs. 999/mo) 👑' : 'StockPot Smart (Rs. 499/mo) ⭐'}
                  </Text>
                  <Text style={styles.activeSub}>Tap another plan below to switch or upgrade anytime.</Text>
                </View>
              </View>
            )}

            {/* Plan Cards Selector */}
            <Text style={styles.sectionHeading}>SELECT YOUR PLAN</Text>
            <View style={styles.plansContainer}>
              {PLANS_CONFIG.map((plan) => {
                const isSelected = selectedPlanId === plan.id;
                const isCurrent = customerPlan === plan.id;

                return (
                  <TouchableOpacity
                    key={plan.id}
                    style={[
                      styles.planCard,
                      isSelected && {
                        borderColor: plan.cardBorder,
                        backgroundColor: plan.activeBg,
                        borderWidth: 2,
                      },
                    ]}
                    onPress={() => setSelectedPlanId(plan.id)}
                    activeOpacity={0.9}
                  >
                    {/* Badge */}
                    <View style={[styles.planBadge, { backgroundColor: plan.badgeBg }]}>
                      <Text style={[styles.planBadgeText, { color: plan.badgeColor }]}>
                        {isCurrent ? 'Current Plan 🌟' : plan.badge}
                      </Text>
                    </View>

                    <View style={styles.planCardHeader}>
                      <View style={styles.radioRow}>
                        <View style={[styles.radioCircle, isSelected && styles.radioCircleActive]}>
                          {isSelected && <View style={styles.radioInner} />}
                        </View>
                        <Text style={styles.planName}>{plan.name}</Text>
                      </View>
                      <View style={styles.priceWrap}>
                        <Text style={styles.priceAmount}>{plan.formattedPrice}</Text>
                        <Text style={styles.pricePeriod}>{plan.period}</Text>
                      </View>
                    </View>

                    <Text style={styles.planTagline}>{plan.tagline}</Text>

                    {/* Features in this card */}
                    <View style={styles.cardFeaturesList}>
                      {plan.features.slice(0, 3).map((feat, idx) => (
                        <View key={idx} style={styles.cardFeatureItem}>
                          <Ionicons name="checkmark" size={14} color="#007A3D" />
                          <Text style={styles.cardFeatureText} numberOfLines={1}>
                            {feat}
                          </Text>
                        </View>
                      ))}
                      <Text style={styles.moreFeaturesHint}>
                        + {plan.features.length - 3} more {plan.id === 'customer_pro' ? 'Pro perks' : 'features'}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Selected Plan In-Depth Features */}
            <View style={styles.fullFeaturesCard}>
              <View style={styles.featuresHeadingRow}>
                <Ionicons
                  name={selectedPlan.id === 'customer_pro' ? 'ribbon-outline' : 'sparkles-outline'}
                  size={18}
                  color={selectedPlan.id === 'customer_pro' ? '#D97706' : '#007A3D'}
                />
                <Text style={styles.fullFeaturesHeading}>
                  What's included in {selectedPlan.name}:
                </Text>
              </View>

              {selectedPlan.features.map((item, idx) => (
                <View key={idx} style={styles.fullFeatureRow}>
                  <View
                    style={[
                      styles.featureIconWrap,
                      selectedPlan.id === 'customer_pro' && { backgroundColor: '#FEF3C7' },
                    ]}
                  >
                    <Ionicons
                      name="checkmark-circle"
                      size={17}
                      color={selectedPlan.id === 'customer_pro' ? '#D97706' : '#007A3D'}
                    />
                  </View>
                  <Text style={styles.fullFeatureText}>{item}</Text>
                </View>
              ))}
            </View>

            {/* Guarantee Note */}
            <View style={styles.guaranteeBox}>
              <Ionicons name="shield-checkmark" size={18} color="#007A3D" />
              <Text style={styles.guaranteeText}>
                Cancel anytime with zero hassle. Money-back satisfaction guarantee on both Smart and Pro plans.
              </Text>
            </View>

            <View style={{ height: 18 }} />
          </ScrollView>

          {/* Footer CTA */}
          <View style={styles.footer}>
            {isCurrentlyActivePlan ? (
              <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel} activeOpacity={0.8}>
                <Text style={styles.cancelBtnText}>Manage / Cancel Subscription</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[
                  styles.subscribeBtn,
                  selectedPlan.id === 'customer_pro' && styles.subscribeBtnPro,
                  loading && { opacity: 0.7 },
                ]}
                onPress={handleSubscribe}
                disabled={loading}
                activeOpacity={0.88}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <FontAwesome5
                      name={selectedPlan.id === 'customer_pro' ? 'crown' : 'bolt'}
                      size={14}
                      color="#FFFFFF"
                      style={{ marginRight: 8 }}
                    />
                    <Text style={styles.subscribeBtnText}>
                      Coming Soon — {selectedPlan.name} ({selectedPlan.formattedPrice}/mo)
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
    backgroundColor: 'rgba(0,0,0,0.58)',
    justifyContent: 'flex-end',
  },
  content: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    height: '92%',
    paddingTop: 14,
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
    paddingHorizontal: 18,
    paddingTop: 12,
  },
  activeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    borderRadius: 14,
    padding: 12,
    gap: 10,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  activeTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#166534',
  },
  activeSub: {
    fontSize: 11.5,
    color: '#166534',
    marginTop: 1,
  },
  sectionHeading: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#6B7280',
    letterSpacing: 0.6,
    marginBottom: 8,
    marginLeft: 4,
  },
  plansContainer: {
    gap: 12,
    marginBottom: 16,
  },
  planCard: {
    backgroundColor: '#FAFAFA',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    position: 'relative',
  },
  planBadge: {
    position: 'absolute',
    top: -9,
    right: 14,
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 10,
  },
  planBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  planCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleActive: {
    borderColor: '#007A3D',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#007A3D',
  },
  planName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
  },
  priceWrap: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  priceAmount: {
    fontSize: 17,
    fontWeight: '800',
    color: '#111827',
  },
  pricePeriod: {
    fontSize: 11.5,
    color: '#6B7280',
    fontWeight: '600',
    marginLeft: 2,
  },
  planTagline: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
    marginBottom: 10,
    lineHeight: 16,
  },
  cardFeaturesList: {
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 8,
    gap: 4,
  },
  cardFeatureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cardFeatureText: {
    fontSize: 12,
    color: '#374151',
    flex: 1,
  },
  moreFeaturesHint: {
    fontSize: 11,
    fontWeight: '700',
    color: '#007A3D',
    marginTop: 2,
  },
  fullFeaturesCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 14,
  },
  featuresHeadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  fullFeaturesHeading: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#111827',
  },
  fullFeatureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 9,
  },
  featureIconWrap: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullFeatureText: {
    fontSize: 12.5,
    color: '#374151',
    flex: 1,
    lineHeight: 17,
  },
  guaranteeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 14,
    padding: 12,
  },
  guaranteeText: {
    fontSize: 11.5,
    color: '#065F46',
    flex: 1,
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
  subscribeBtnPro: {
    backgroundColor: '#D97706',
    shadowColor: '#D97706',
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
