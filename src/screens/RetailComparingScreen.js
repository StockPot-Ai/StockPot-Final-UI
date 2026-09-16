import React, { useMemo, useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Platform,
  StatusBar,
  Modal,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import Colors from '../constants/colors';
import ShopDiscoveryModal from '../components/store/ShopDiscoveryModal';
import ShopOwnerModal from '../components/store/ShopOwnerModal';
import ShopProfileModal from '../components/store/ShopProfileModal';
import PremiumUpgradeModal from '../components/account/PremiumUpgradeModal';
import { useAccount } from '../context/AccountContext';
import { smartBasketService, storeService, savingsService, gamificationService } from '../services';

const formatPrice = (value) => {
  const n = Math.round(Number(value) || 0);
  return 'Rs ' + n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

export default function RetailComparingScreen({ items = [], onBack }) {
  const { isPremium, isPro } = useAccount();
  const [activeStrategy, setActiveStrategy] = useState('single'); // 'single' | 'split'
  const [storeFilter, setStoreFilter] = useState('all'); // 'all' | 'supermarkets' | 'local'
  const [basketItems, setBasketItems] = useState([]);
  const [discounts, setDiscounts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [nearbyModalVisible, setNearbyModalVisible] = useState(false);
  const [shopOwnerModalVisible, setShopOwnerModalVisible] = useState(false);
  const [settingsModalVisible, setSettingsModalVisible] = useState(false);
  const [selectedShopProfile, setSelectedShopProfile] = useState(null);
  const [shopProfileVisible, setShopProfileVisible] = useState(false);
  const [upgradeModalVisible, setUpgradeModalVisible] = useState(false);

  // Settings
  const [maxStores, setMaxStores] = useState(3);
  const [minSavings, setMinSavings] = useState(150);

  useEffect(() => {
    loadComparisonData();
  }, [items]);

  const loadComparisonData = async () => {
    setLoading(true);
    try {
      const generatedBasket = smartBasketService.buildBasketFromIngredients(items);
      setBasketItems(generatedBasket);

      const activeDiscounts = await storeService.getAllDiscounts();
      setDiscounts(activeDiscounts);
    } catch (_) {}
    setLoading(false);
  };

  // Compute optimization results
  const optimization = useMemo(() => {
    return smartBasketService.optimizeBasket(basketItems, {
      maxStores,
      minSavings,
    }, discounts.length > 0 ? discounts : null);
  }, [basketItems, maxStores, minSavings, discounts]);

  const { cheapestSingleStore, sortedSingleStores, splitStrategy } = optimization;

  const filteredSingleStores = useMemo(() => {
    if (!sortedSingleStores) return [];
    if (storeFilter === 'supermarkets') {
      return sortedSingleStores.filter((s) => !s.store.isLocalShop);
    }
    if (storeFilter === 'local') {
      return sortedSingleStores.filter((s) => s.store.isLocalShop);
    }
    return sortedSingleStores;
  }, [sortedSingleStores, storeFilter]);

  const handleOpenStoreProfile = (store) => {
    if (!store) return;
    setSelectedShopProfile(store);
    setShopProfileVisible(true);
  };

  const handleAddProductFromStore = (product, store) => {
    setBasketItems((prev) => {
      const exists = prev.find((b) => b.productId === product.id || b.name === product.name);
      if (exists) {
        return prev.map((b) =>
          b.productId === product.id || b.name === product.name
            ? { ...b, quantity: (b.quantity || 1) + 1 }
            : b
        );
      }
      return [
        ...prev,
        {
          productId: product.id,
          name: product.name,
          quantity: 1,
          unit: product.unit || '1 unit',
          estimatedCost: product.storePrice || product.estimatedCost || 350,
        },
      ];
    });
  };

  const handleApplySplitSavings = async () => {
    if (splitStrategy.potentialSavings > 0) {
      const savedAmount = splitStrategy.potentialSavings;
      const storeName = splitStrategy.storesInvolved?.[0]?.name || '';

      // Record savings locally so the Savings Dashboard is updated
      await savingsService.recordSaving(savedAmount, storeName);

      await gamificationService.awardXp(
        25,
        `Saved Rs. ${savedAmount} with Split-Basket`,
        `Optimized between ${splitStrategy.storesInvolved.length} nearby stores!`
      );
      Alert.alert(
        '🎉 Savings Applied!',
        `You unlocked Rs. ${savedAmount} in estimated grocery savings!\n\n🏆 You earned +25 XP!`,
        [{ text: 'Great!' }]
      );
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAF8F5" />

      {/* Top App Bar */}
      <View style={styles.appBar}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={22} color="#2B2420" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.appBarTitle}>Price Comparison Engine</Text>
          <Text style={styles.appBarSub}>{basketItems.length} Products in Shopping Basket</Text>
        </View>
        <TouchableOpacity
          style={styles.nearbyBtn}
          onPress={() => setNearbyModalVisible(true)}
          activeOpacity={0.8}
        >
          <Ionicons name="location" size={16} color="#3A6847" />
          <Text style={styles.nearbyBtnText}>Shops</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Strategy Switcher Tab */}
        <View style={styles.strategyTabs}>
          <TouchableOpacity
            style={[styles.strategyTab, activeStrategy === 'single' && styles.strategyTabActive]}
            onPress={() => setActiveStrategy('single')}
            activeOpacity={0.8}
          >
            <Ionicons
              name="storefront-outline"
              size={17}
              color={activeStrategy === 'single' ? '#3A6847' : '#968880'}
            />
            <Text
              style={[
                styles.strategyTabText,
                activeStrategy === 'single' && styles.strategyTabTextActive,
              ]}
            >
              Cheapest Single Store
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.strategyTab, activeStrategy === 'split' && styles.strategyTabActive]}
            onPress={() => setActiveStrategy('split')}
            activeOpacity={0.8}
          >
            <Ionicons
              name="git-merge-outline"
              size={17}
              color={activeStrategy === 'split' ? '#3A6847' : '#968880'}
            />
            <Text
              style={[
                styles.strategyTabText,
                activeStrategy === 'split' && styles.strategyTabTextActive,
              ]}
            >
              Split-Basket Optimizer
            </Text>
            {!isPremium ? (
              <View style={styles.lockPill}>
                <Ionicons name="lock-closed" size={9} color="#FFFFFF" />
                <Text style={styles.lockPillText}>Smart</Text>
              </View>
            ) : splitStrategy?.potentialSavings > 0 ? (
              <View style={styles.savePill}>
                <Text style={styles.savePillText}>-Rs.{splitStrategy.potentialSavings}</Text>
              </View>
            ) : null}
          </TouchableOpacity>
        </View>

        {/* Discount Intelligence Deals Carousel */}
        {discounts.length > 0 && (
          <View style={styles.discountSection}>
            <View style={styles.discountHeader}>
              <View style={styles.discountTitleRow}>
                <Text style={styles.discountFire}>🔥</Text>
                <Text style={styles.discountSectionTitle}>Matched Discount Deals</Text>
              </View>
              <Text style={styles.discountSubTitle}>Verified live store promotions</Text>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.discountScroll}>
              {discounts.map((d) => (
                <View key={d.id} style={styles.dealCard}>
                  <View style={styles.dealBadge}>
                    <Text style={styles.dealBadgeText}>{d.discountPercent}% OFF</Text>
                  </View>
                  <Text style={styles.dealName} numberOfLines={1}>{d.productName}</Text>
                  <Text style={styles.dealStore}>{d.storeName}</Text>
                  <View style={styles.dealPriceRow}>
                    <Text style={styles.dealCurrentPrice}>Rs {d.discountedPrice}</Text>
                    <Text style={styles.dealOriginalPrice}>Rs {d.originalPrice}</Text>
                  </View>
                  <Text style={styles.dealValid}>⏳ {d.validUntil}</Text>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Loading Spinner */}
        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="small" color={Colors.primary} />
            <Text style={styles.loadingText}>Comparing 60+ store prices...</Text>
          </View>
        ) : activeStrategy === 'single' ? (
          /* ─── Strategy A: Single Store Comparison ──────────────────────── */
          <View style={styles.contentSection}>
            {/* Store Type Filter */}
            <View style={styles.storeTypeRow}>
              {[
                { key: 'all', label: 'All Stores (7)' },
                { key: 'supermarkets', label: 'Supermarkets (5)' },
                { key: 'local', label: 'Local Shops (2)' },
              ].map((f) => (
                <TouchableOpacity
                  key={f.key}
                  style={[styles.typeChip, storeFilter === f.key && styles.typeChipActive]}
                  onPress={() => setStoreFilter(f.key)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[styles.typeChipText, storeFilter === f.key && styles.typeChipTextActive]}
                  >
                    {f.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Cheapest Store Highlight Hero */}
            {cheapestSingleStore && (
              <TouchableOpacity
                style={styles.heroStoreCard}
                onPress={() => handleOpenStoreProfile(cheapestSingleStore.store)}
                activeOpacity={0.88}
              >
                <View style={styles.heroHeader}>
                  <View style={styles.heroBestBadge}>
                    <Ionicons name="trophy" size={14} color="#B45309" />
                    <Text style={styles.heroBestText}>Cheapest Single Store</Text>
                  </View>
                  <Text style={styles.heroPrice}>{formatPrice(cheapestSingleStore.totalCost)}</Text>
                </View>

                <View style={styles.heroIdentityRow}>
                  {cheapestSingleStore.store.logo ? (
                    <Image source={{ uri: cheapestSingleStore.store.logo }} style={styles.heroStoreLogo} />
                  ) : (
                    <View style={[styles.heroStoreLogoFallback, { backgroundColor: cheapestSingleStore.store.color || '#166534' }]}>
                      <Ionicons name="storefront" size={20} color="#FFFFFF" />
                    </View>
                  )}
                  <View style={{ flex: 1 }}>
                    <View style={styles.storeNameRow}>
                      <Text style={styles.heroStoreName}>{cheapestSingleStore.store.name}</Text>
                      <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                    </View>
                    <Text style={styles.heroStoreAddress}>
                      {cheapestSingleStore.store.address} • {cheapestSingleStore.store.isLocalShop ? 'Local Grocer' : 'Supermarket'}
                    </Text>
                  </View>
                </View>

                <View style={styles.heroDetails}>
                  <View style={styles.heroDetailItem}>
                    <Ionicons name="checkmark-done" size={16} color="#166534" />
                    <Text style={styles.heroDetailText}>All {basketItems.length} items in stock</Text>
                  </View>
                  <View style={styles.heroDetailItem}>
                    <Ionicons name="car-outline" size={16} color="#166534" />
                    <Text style={styles.heroDetailText}>
                      {cheapestSingleStore.store.deliveryAvailable ? 'Delivery available' : 'In-store pickup'}
                    </Text>
                  </View>
                </View>

                <View style={styles.heroActionFooter}>
                  <Text style={styles.heroActionPrompt}>Tap to view in-store catalogue & menu →</Text>
                </View>
              </TouchableOpacity>
            )}

            {/* Ranked Store List */}
            <Text style={styles.rankedTitle}>All Store Comparisons</Text>
            {filteredSingleStores.map((st, idx) => {
              const priceDiff = st.totalCost - (cheapestSingleStore?.totalCost || 0);
              return (
                <TouchableOpacity
                  key={st.store.id}
                  style={styles.storeComparisonCard}
                  onPress={() => handleOpenStoreProfile(st.store)}
                  activeOpacity={0.8}
                >
                  <View style={styles.storeRank}>
                    <Text style={styles.rankNum}>#{idx + 1}</Text>
                  </View>

                  {/* Store Logo / Icon */}
                  {st.store.logo ? (
                    <Image source={{ uri: st.store.logo }} style={styles.storeCardLogo} />
                  ) : (
                    <View style={[styles.storeIconWrap, { backgroundColor: (st.store.color || '#007A3D') + '15' }]}>
                      <MaterialCommunityIcons
                        name={st.store.isLocalShop ? 'storefront' : 'shopping'}
                        size={18}
                        color={st.store.color || '#007A3D'}
                      />
                    </View>
                  )}

                  <View style={{ flex: 1 }}>
                    <View style={styles.storeNameRow}>
                      <Text style={styles.storeTitle}>{st.store.name}</Text>
                      {st.store.isVerified && (
                        <View style={styles.verifiedMiniBadge}>
                          <Ionicons name="checkmark-circle" size={11} color="#166534" />
                          <Text style={styles.verifiedMiniText}>Verified</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.storeCatText}>
                      {st.store.category} • {st.store.openingHours}
                    </Text>
                  </View>

                  <View style={styles.storePriceCol}>
                    <Text style={styles.storeTotalText}>{formatPrice(st.totalCost)}</Text>
                    {priceDiff > 0 ? (
                      <Text style={styles.storeDiffText}>+{formatPrice(priceDiff)}</Text>
                    ) : (
                      <Text style={styles.cheapestLabel}>Best Price ⭐</Text>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        ) : !isPremium ? (
          /* ─── Strategy B: Locked Paywall for Free Users ────────────────── */
          <View style={styles.contentSection}>
            <View style={styles.lockedCard}>
              <View style={styles.lockedIconCircle}>
                <Ionicons name="git-merge" size={30} color="#994122" />
              </View>
              <View style={styles.lockedPlanTag}>
                <Ionicons name="lock-closed" size={12} color="#994122" />
                <Text style={styles.lockedPlanTagText}>SMART PLAN FEATURE</Text>
              </View>
              <Text style={styles.lockedCardTitle}>Multi-Store Split-Basket Optimizer</Text>
              <Text style={styles.lockedCardSubtitle}>
                Instead of buying everything at one store, StockPot scans 5+ local supermarkets and corner grocers in real time, routing each item to the lowest-price shop.
              </Text>

              <View style={styles.lockedTeaserBox}>
                <View style={styles.lockedTeaserRow}>
                  <View>
                    <Text style={styles.lockedTeaserLabel}>Potential Basket Savings</Text>
                    <Text style={styles.lockedTeaserValue}>
                      Save {formatPrice(splitStrategy?.potentialSavings || 380)}
                    </Text>
                  </View>
                  <View style={styles.lockedStoresPill}>
                    <Ionicons name="storefront" size={13} color="#3A6847" />
                    <Text style={styles.lockedStoresText}>
                      {splitStrategy?.storesInvolved?.length || 3} Stores
                    </Text>
                  </View>
                </View>
                <Text style={styles.lockedTeaserHint}>
                  Members save an average of Rs. 3,200/month by optimizing grocery split-trips.
                </Text>
              </View>

              <TouchableOpacity
                style={styles.lockedUpgradeBtn}
                onPress={() => setUpgradeModalVisible(true)}
                activeOpacity={0.85}
              >
                <Ionicons name="sparkles" size={17} color="#FFFFFF" />
                <Text style={styles.lockedUpgradeBtnText}>
                  Unlock Smart Plan • Rs. 499 / mo
                </Text>
              </TouchableOpacity>

              <Text style={styles.lockedFooterHint}>
                Instant activation • Also included in Pro Plan (Rs. 999/mo)
              </Text>
            </View>
          </View>
        ) : (
          /* ─── Strategy B: Smart Split-Basket Optimizer ──────────────────── */
          <View style={styles.contentSection}>
            {/* Split Highlight Hero */}
            <View style={styles.splitHeroCard}>
              <View style={styles.splitHeaderRow}>
                <View style={styles.splitTag}>
                  <Ionicons name="flash" size={14} color="#7C2D12" />
                  <Text style={styles.splitTagText}>Optimized Multi-Store Split</Text>
                </View>
                <TouchableOpacity onPress={() => setSettingsModalVisible(true)}>
                  <Ionicons name="settings-outline" size={18} color="#4B5563" />
                </TouchableOpacity>
              </View>

              <View style={styles.splitComparisonRow}>
                <View>
                  <Text style={styles.splitLabel}>Split Total</Text>
                  <Text style={styles.splitTotalAmount}>{formatPrice(splitStrategy.totalCost)}</Text>
                </View>
                <View style={styles.splitSavingsBadge}>
                  <Text style={styles.splitSavingsLabel}>Total Savings</Text>
                  <Text style={styles.splitSavingsValue}>
                    Save {formatPrice(splitStrategy.potentialSavings)}
                  </Text>
                </View>
              </View>

              <Text style={styles.splitStoresNotice}>
                Items distributed across <Text style={{ fontWeight: '700' }}>{splitStrategy.storesInvolved.length} nearby stores</Text> for maximum savings.
              </Text>

              {splitStrategy.potentialSavings > 0 && (
                <TouchableOpacity
                  style={styles.claimSavingsBtn}
                  onPress={handleApplySplitSavings}
                  activeOpacity={0.85}
                >
                  <Ionicons name="sparkles" size={16} color="#FFFFFF" />
                  <Text style={styles.claimSavingsBtnText}>Claim & Log Savings (+25 XP)</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Split Items Breakdown */}
            <Text style={styles.rankedTitle}>Item-by-Item Optimized Routing</Text>
            {splitStrategy.items.map((it, idx) => (
              <View key={idx} style={styles.splitItemCard}>
                <View style={styles.splitItemLeft}>
                  <Text style={styles.splitItemName}>{it.product.name}</Text>
                  <Text style={styles.splitItemQty}>Quantity: {it.quantity}</Text>
                  <TouchableOpacity
                    style={[styles.storePill, { backgroundColor: it.bestStore.color + '15' }]}
                    onPress={() => handleOpenStoreProfile(it.bestStore)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="cart" size={12} color={it.bestStore.color} />
                    <Text style={[styles.storePillText, { color: it.bestStore.color }]}>
                      Buy at {it.bestStore.name} →
                    </Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.splitItemRight}>
                  <Text style={styles.splitItemPrice}>{formatPrice(it.price)}</Text>
                  {it.isDiscounted && (
                    <Text style={styles.splitDiscountLabel}>Deal Applied 🔥</Text>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Local Business Portal Banner */}
        <View style={styles.shopOwnerBanner}>
          <View style={styles.shopOwnerLeft}>
            <MaterialCommunityIcons name="store-plus" size={24} color="#0F766E" />
            <View style={{ flex: 1 }}>
              <Text style={styles.shopOwnerTitle}>Are you a local grocery shop owner?</Text>
              <Text style={styles.shopOwnerSub}>
                List your business and products in StockPot's comparison engine.
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.shopOwnerBtn}
            onPress={() => setShopOwnerModalVisible(true)}
            activeOpacity={0.8}
          >
            <Text style={styles.shopOwnerBtnText}>Register Shop →</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 30 }} />
      </ScrollView>

      {/* Shop Discovery Modal */}
      <ShopDiscoveryModal
        visible={nearbyModalVisible}
        onClose={() => setNearbyModalVisible(false)}
        onSelectStore={(st) => {
          handleOpenStoreProfile(st);
        }}
      />

      {/* Interactive Shop Profile & Live Catalogue Modal */}
      <ShopProfileModal
        visible={shopProfileVisible}
        store={selectedShopProfile}
        onClose={() => setShopProfileVisible(false)}
        onAddProductToBasket={handleAddProductFromStore}
      />

      {/* Shop Owner Portal Modal */}
      <ShopOwnerModal
        visible={shopOwnerModalVisible}
        onClose={() => setShopOwnerModalVisible(false)}
        onShopRegistered={() => loadComparisonData()}
      />

      {/* Split Settings Modal */}
      <Modal visible={settingsModalVisible} animationType="fade" transparent onRequestClose={() => setSettingsModalVisible(false)}>
        <View style={styles.settingsOverlay}>
          <View style={styles.settingsCard}>
            <Text style={styles.settingsTitle}>Split Optimizer Settings</Text>

            <Text style={styles.settingsLabel}>Max Stores Allowed: {maxStores}</Text>
            <View style={styles.settingsRow}>
              {[2, 3, 4].map((num) => (
                <TouchableOpacity
                  key={num}
                  style={[styles.numBtn, maxStores === num && styles.numBtnActive]}
                  onPress={() => setMaxStores(num)}
                >
                  <Text style={[styles.numBtnText, maxStores === num && styles.numBtnTextActive]}>
                    {num} Stores
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.settingsLabel}>Min. Savings Required: Rs. {minSavings}</Text>
            <View style={styles.settingsRow}>
              {[100, 150, 250, 400].map((s) => (
                <TouchableOpacity
                  key={s}
                  style={[styles.numBtn, minSavings === s && styles.numBtnActive]}
                  onPress={() => setMinSavings(s)}
                >
                  <Text style={[styles.numBtnText, minSavings === s && styles.numBtnTextActive]}>
                    Rs {s}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={styles.closeSettingsBtn} onPress={() => setSettingsModalVisible(false)}>
              <Text style={styles.closeSettingsBtnText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Customer Premium Upgrade Modal */}
      <PremiumUpgradeModal
        visible={upgradeModalVisible}
        onClose={() => setUpgradeModalVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FAF8F5',
  },
  appBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E8DFD8',
    gap: 12,
  },
  backBtn: {
    padding: 6,
  },
  appBarTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#2B2420',
  },
  appBarSub: {
    fontSize: 12,
    color: '#968880',
  },
  nearbyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EAF3EC',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  nearbyBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#3A6847',
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  strategyTabs: {
    flexDirection: 'row',
    backgroundColor: '#F5EFEB',
    borderRadius: 14,
    padding: 4,
    marginBottom: 14,
    gap: 4,
  },
  strategyTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 10,
    gap: 5,
  },
  strategyTabActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#2B2420',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  strategyTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#968880',
  },
  strategyTabTextActive: {
    color: '#3A6847',
    fontWeight: '800',
  },
  lockPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#994122',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 3,
    gap: 3,
  },
  lockPillText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  savePill: {
    backgroundColor: '#3A6847',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 2,
  },
  savePillText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  discountSection: {
    marginBottom: 14,
  },
  discountHeader: {
    marginBottom: 8,
  },
  discountTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  discountFire: {
    fontSize: 16,
  },
  discountSectionTitle: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#2B2420',
  },
  discountSubTitle: {
    fontSize: 11.5,
    color: '#968880',
  },
  discountScroll: {
    gap: 10,
    paddingVertical: 4,
  },
  dealCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    width: 175,
    borderWidth: 1,
    borderColor: '#E8DFD8',
    shadowColor: '#2B2420',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  dealBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#FCECE8',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 6,
  },
  dealBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#994122',
  },
  dealName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2B2420',
  },
  dealStore: {
    fontSize: 11,
    color: '#968880',
    marginTop: 2,
  },
  dealPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  dealCurrentPrice: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#3A6847',
  },
  dealOriginalPrice: {
    fontSize: 11,
    color: '#968880',
    textDecorationLine: 'line-through',
  },
  dealValid: {
    fontSize: 10,
    color: '#E8A93F',
    marginTop: 4,
    fontWeight: '700',
  },
  contentSection: {
    marginBottom: 16,
  },
  storeTypeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  typeChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8DFD8',
  },
  typeChipActive: {
    backgroundColor: '#3A6847',
    borderColor: '#3A6847',
  },
  typeChipText: {
    fontSize: 11.5,
    color: '#6B5E57',
    fontWeight: '500',
  },
  typeChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  heroStoreCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#EAF3EC',
    marginBottom: 14,
    shadowColor: '#3A6847',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  heroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  heroBestBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF6EB',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    gap: 4,
  },
  heroBestText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#C6851C',
  },
  heroPrice: {
    fontSize: 18,
    fontWeight: '800',
    color: '#3A6847',
  },
  heroIdentityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 8,
    marginBottom: 4,
  },
  heroStoreLogo: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#E8DFD8',
    backgroundColor: '#FFFFFF',
  },
  heroStoreLogoFallback: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroStoreName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#2B2420',
  },
  heroStoreAddress: {
    fontSize: 12,
    color: '#968880',
    marginTop: 2,
  },
  heroActionFooter: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F5EFEB',
    alignItems: 'flex-end',
  },
  heroActionPrompt: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#3A6847',
  },
  heroDetails: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F5EFEB',
  },
  heroDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  heroDetailText: {
    fontSize: 12,
    color: '#6B5E57',
    fontWeight: '500',
  },
  rankedTitle: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#2B2420',
    marginBottom: 8,
  },
  storeComparisonCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E8DFD8',
    shadowColor: '#2B2420',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  storeRank: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#F5EFEB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  rankNum: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#6B5E57',
  },
  storeCardLogo: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#E8DFD8',
    backgroundColor: '#FFFFFF',
  },
  storeIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  storeNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  storeTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#2B2420',
    flexShrink: 1,
  },
  verifiedMiniBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EAF3EC',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 6,
    gap: 2,
  },
  verifiedMiniText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#3A6847',
  },
  storeCatText: {
    fontSize: 11,
    color: '#968880',
    marginTop: 2,
  },
  storePriceCol: {
    alignItems: 'flex-end',
    minWidth: 90,
    marginLeft: 8,
  },
  storeTotalText: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#2B2420',
  },
  storeDiffText: {
    fontSize: 11,
    color: '#994122',
    fontWeight: '600',
    marginTop: 1,
  },
  cheapestLabel: {
    fontSize: 10,
    color: '#3A6847',
    fontWeight: '800',
    marginTop: 1,
  },
  // Locked Strategy Paywall
  lockedCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E8DFD8',
    shadowColor: '#2B2420',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
    marginVertical: 4,
  },
  lockedIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FCECE8',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  lockedPlanTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FCECE8',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 5,
    marginBottom: 10,
  },
  lockedPlanTagText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#994122',
    letterSpacing: 0.5,
  },
  lockedCardTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#2B2420',
    textAlign: 'center',
    marginBottom: 8,
  },
  lockedCardSubtitle: {
    fontSize: 13,
    color: '#6B5E57',
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  lockedTeaserBox: {
    width: '100%',
    backgroundColor: '#FAF8F5',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E8DFD8',
    marginBottom: 18,
  },
  lockedTeaserRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  lockedTeaserLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B5E57',
  },
  lockedTeaserValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#3A6847',
  },
  lockedStoresPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EAF3EC',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  lockedStoresText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#3A6847',
  },
  lockedTeaserHint: {
    fontSize: 11,
    color: '#968880',
    lineHeight: 15,
  },
  lockedUpgradeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#994122',
    width: '100%',
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
    shadowColor: '#994122',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  lockedUpgradeBtnText: {
    color: '#FFFFFF',
    fontSize: 14.5,
    fontWeight: '800',
  },
  lockedFooterHint: {
    fontSize: 11.5,
    color: '#968880',
    marginTop: 10,
    textAlign: 'center',
  },
  // Split Basket Optimizer Active
  splitHeroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#E8A93F',
    marginBottom: 14,
  },
  splitHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  splitTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF6EB',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    gap: 4,
  },
  splitTagText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#C6851C',
  },
  splitComparisonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  splitLabel: {
    fontSize: 12,
    color: '#968880',
  },
  splitTotalAmount: {
    fontSize: 20,
    fontWeight: '800',
    color: '#2B2420',
  },
  splitSavingsBadge: {
    backgroundColor: '#EAF3EC',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignItems: 'flex-end',
  },
  splitSavingsLabel: {
    fontSize: 10,
    color: '#3A6847',
    fontWeight: '600',
  },
  splitSavingsValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#3A6847',
  },
  splitStoresNotice: {
    fontSize: 12,
    color: '#6B5E57',
    marginTop: 10,
    lineHeight: 16,
  },
  claimSavingsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3A6847',
    paddingVertical: 11,
    borderRadius: 12,
    marginTop: 12,
    gap: 6,
  },
  claimSavingsBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  splitItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E8DFD8',
  },
  splitItemLeft: {
    flex: 1,
  },
  splitItemName: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#2B2420',
  },
  splitItemQty: {
    fontSize: 11.5,
    color: '#968880',
    marginTop: 1,
  },
  storePill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginTop: 6,
    gap: 4,
  },
  storePillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  splitItemRight: {
    alignItems: 'flex-end',
  },
  splitItemPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2B2420',
  },
  splitDiscountLabel: {
    fontSize: 10,
    color: '#994122',
    fontWeight: '700',
    marginTop: 2,
  },
  shopOwnerBanner: {
    backgroundColor: '#FAF8F5',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E8DFD8',
    marginTop: 10,
  },
  shopOwnerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  shopOwnerTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#2B2420',
  },
  shopOwnerSub: {
    fontSize: 11.5,
    color: '#6B5E57',
    marginTop: 2,
  },
  shopOwnerBtn: {
    alignSelf: 'flex-end',
    backgroundColor: '#994122',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    marginTop: 8,
  },
  shopOwnerBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  loadingBox: {
    padding: 40,
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    fontSize: 13,
    color: '#968880',
  },
  settingsOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  settingsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    width: '100%',
    maxWidth: 380,
  },
  settingsTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#2B2420',
    marginBottom: 12,
  },
  settingsLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B5E57',
    marginTop: 10,
    marginBottom: 6,
  },
  settingsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  numBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#F5EFEB',
    alignItems: 'center',
  },
  numBtnActive: {
    backgroundColor: '#3A6847',
  },
  numBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B5E57',
  },
  numBtnTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  closeSettingsBtn: {
    backgroundColor: '#3A6847',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  closeSettingsBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
