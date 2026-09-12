import React, { useMemo, useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
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
import NearbyShopsModal from '../components/store/NearbyShopsModal';
import ShopOwnerModal from '../components/store/ShopOwnerModal';
import { smartBasketService, storeService, savingsService, gamificationService } from '../services';

const formatPrice = (value) => {
  const n = Math.round(Number(value) || 0);
  return 'Rs ' + n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

export default function RetailComparingScreen({ items = [], onBack }) {
  const [activeStrategy, setActiveStrategy] = useState('single'); // 'single' | 'split'
  const [storeFilter, setStoreFilter] = useState('all'); // 'all' | 'supermarkets' | 'local'
  const [basketItems, setBasketItems] = useState([]);
  const [discounts, setDiscounts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [nearbyModalVisible, setNearbyModalVisible] = useState(false);
  const [shopOwnerModalVisible, setShopOwnerModalVisible] = useState(false);
  const [settingsModalVisible, setSettingsModalVisible] = useState(false);

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
    });
  }, [basketItems, maxStores, minSavings]);

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

  const handleApplySplitSavings = async () => {
    if (splitStrategy.potentialSavings > 0) {
      await gamificationService.awardXp(
        25,
        `Saved Rs. ${splitStrategy.potentialSavings} with Split-Basket`,
        `Optimized between ${splitStrategy.storesInvolved.length} nearby stores!`
      );
      Alert.alert(
        '🎉 Savings Applied!',
        `You unlocked Rs. ${splitStrategy.potentialSavings} in estimated grocery savings!\n\n🏆 You earned +25 XP!`,
        [{ text: 'Great!' }]
      );
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAFAF8" />

      {/* Top App Bar */}
      <View style={styles.appBar}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={22} color="#111827" />
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
          <Ionicons name="location" size={16} color="#166534" />
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
              color={activeStrategy === 'single' ? '#166534' : '#6B7280'}
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
              color={activeStrategy === 'split' ? '#166534' : '#6B7280'}
            />
            <Text
              style={[
                styles.strategyTabText,
                activeStrategy === 'split' && styles.strategyTabTextActive,
              ]}
            >
              Split-Basket Optimizer
            </Text>
            {splitStrategy?.potentialSavings > 0 && (
              <View style={styles.savePill}>
                <Text style={styles.savePillText}>-Rs.{splitStrategy.potentialSavings}</Text>
              </View>
            )}
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
              <View style={styles.heroStoreCard}>
                <View style={styles.heroHeader}>
                  <View style={styles.heroBestBadge}>
                    <Ionicons name="trophy" size={14} color="#B45309" />
                    <Text style={styles.heroBestText}>Cheapest Single Store</Text>
                  </View>
                  <Text style={styles.heroPrice}>{formatPrice(cheapestSingleStore.totalCost)}</Text>
                </View>

                <Text style={styles.heroStoreName}>{cheapestSingleStore.store.name}</Text>
                <Text style={styles.heroStoreAddress}>
                  {cheapestSingleStore.store.address} • {cheapestSingleStore.store.isLocalShop ? 'Local Grocer' : 'Supermarket'}
                </Text>

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
              </View>
            )}

            {/* Ranked Store List */}
            <Text style={styles.rankedTitle}>All Store Comparisons</Text>
            {filteredSingleStores.map((st, idx) => {
              const priceDiff = st.totalCost - (cheapestSingleStore?.totalCost || 0);
              return (
                <View key={st.store.id} style={styles.storeComparisonCard}>
                  <View style={styles.storeRank}>
                    <Text style={styles.rankNum}>#{idx + 1}</Text>
                  </View>

                  <View style={{ flex: 1 }}>
                    <View style={styles.storeNameRow}>
                      <Text style={styles.storeTitle}>{st.store.name}</Text>
                      {st.store.isVerified && (
                        <View style={styles.verifiedMiniBadge}>
                          <Ionicons name="checkmark-circle" size={12} color="#166534" />
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
                </View>
              );
            })}
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
                  <View style={[styles.storePill, { backgroundColor: it.bestStore.color + '15' }]}>
                    <Ionicons name="cart" size={12} color={it.bestStore.color} />
                    <Text style={[styles.storePillText, { color: it.bestStore.color }]}>
                      Buy at {it.bestStore.name}
                    </Text>
                  </View>
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

      {/* Nearby Stores Modal */}
      <NearbyShopsModal
        visible={nearbyModalVisible}
        onClose={() => setNearbyModalVisible(false)}
        onSelectStore={(st) => {
          Alert.alert(st.name, `Address: ${st.address}\nOpening: ${st.openingHours}\nPhone: ${st.phone}`);
        }}
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FAFAF8',
  },
  appBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    gap: 12,
  },
  backBtn: {
    padding: 6,
  },
  appBarTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
  },
  appBarSub: {
    fontSize: 12,
    color: '#6B7280',
  },
  nearbyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  nearbyBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#166534',
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  strategyTabs: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 12,
  },
  strategyTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  strategyTabActive: {
    backgroundColor: '#DCFCE7',
  },
  strategyTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  strategyTabTextActive: {
    color: '#166534',
    fontWeight: '700',
  },
  savePill: {
    backgroundColor: '#166534',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  savePillText: {
    fontSize: 10,
    fontWeight: '700',
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
    fontWeight: '700',
    color: '#111827',
  },
  discountSubTitle: {
    fontSize: 11.5,
    color: '#6B7280',
  },
  discountScroll: {
    gap: 10,
    paddingVertical: 4,
  },
  dealCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    width: 170,
    borderWidth: 1,
    borderColor: '#FED7AA',
  },
  dealBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFEDD5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginBottom: 6,
  },
  dealBadgeText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#C2410C',
  },
  dealName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
  },
  dealStore: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
  dealPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  dealCurrentPrice: {
    fontSize: 13,
    fontWeight: '700',
    color: '#166534',
  },
  dealOriginalPrice: {
    fontSize: 11,
    color: '#9CA3AF',
    textDecorationLine: 'line-through',
  },
  dealValid: {
    fontSize: 10,
    color: '#9A3412',
    marginTop: 4,
    fontWeight: '500',
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
    borderColor: '#E5E7EB',
  },
  typeChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  typeChipText: {
    fontSize: 11.5,
    color: '#4B5563',
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
    borderColor: '#86EFAC',
    marginBottom: 14,
    shadowColor: '#166534',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
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
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    gap: 4,
  },
  heroBestText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#92400E',
  },
  heroPrice: {
    fontSize: 18,
    fontWeight: '800',
    color: '#166534',
  },
  heroStoreName: {
    fontSize: 17,
    fontWeight: '800',
    color: '#111827',
    marginTop: 4,
  },
  heroStoreAddress: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  heroDetails: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  heroDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  heroDetailText: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '500',
  },
  rankedTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#111827',
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
    borderColor: '#E5E7EB',
  },
  storeRank: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  rankNum: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4B5563',
  },
  storeNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  storeTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#111827',
  },
  verifiedMiniBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 6,
    gap: 2,
  },
  verifiedMiniText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#166534',
  },
  storeCatText: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
  storePriceCol: {
    alignItems: 'flex-end',
  },
  storeTotalText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  storeDiffText: {
    fontSize: 11,
    color: '#DC2626',
    fontWeight: '600',
  },
  cheapestLabel: {
    fontSize: 10.5,
    color: '#166534',
    fontWeight: '700',
  },
  splitHeroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#FDBA74',
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
    backgroundColor: '#FFEDD5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    gap: 4,
  },
  splitTagText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#9A3412',
  },
  splitComparisonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  splitLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  splitTotalAmount: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
  },
  splitSavingsBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignItems: 'flex-end',
  },
  splitSavingsLabel: {
    fontSize: 10,
    color: '#166534',
    fontWeight: '600',
  },
  splitSavingsValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#166534',
  },
  splitStoresNotice: {
    fontSize: 12,
    color: '#4B5563',
    marginTop: 10,
    lineHeight: 16,
  },
  claimSavingsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 10,
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
    borderColor: '#E5E7EB',
  },
  splitItemLeft: {
    flex: 1,
  },
  splitItemName: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#111827',
  },
  splitItemQty: {
    fontSize: 11.5,
    color: '#6B7280',
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
    color: '#111827',
  },
  splitDiscountLabel: {
    fontSize: 10,
    color: '#C2410C',
    fontWeight: '700',
    marginTop: 2,
  },
  shopOwnerBanner: {
    backgroundColor: '#F0FDFA',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#99F6E4',
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
    color: '#115E59',
  },
  shopOwnerSub: {
    fontSize: 11.5,
    color: '#0F766E',
    marginTop: 2,
  },
  shopOwnerBtn: {
    alignSelf: 'flex-end',
    backgroundColor: '#0F766E',
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
    color: '#6B7280',
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
    color: '#111827',
    marginBottom: 12,
  },
  settingsLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
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
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  numBtnActive: {
    backgroundColor: Colors.primary,
  },
  numBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4B5563',
  },
  numBtnTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  closeSettingsBtn: {
    backgroundColor: Colors.primary,
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
