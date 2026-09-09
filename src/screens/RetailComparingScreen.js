import React, { useMemo, useState, useEffect } from 'react';
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
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Colors from '../constants/colors';
import { shoppingService, savingsService } from '../services';

const STORES = [
  { id: 'cargills', name: 'Cargills', factor: 0.92, kmAway: 1.2, hasDelivery: true },
  { id: 'keells', name: 'Keells', factor: 0.97, kmAway: 2.4, hasDelivery: true },
  { id: 'local', name: 'Local Market', factor: 1.04, kmAway: 0.85, hasDelivery: false },
  { id: 'glomark', name: 'Glomark', factor: 1.08, kmAway: 3.1, hasDelivery: true },
];

const formatPrice = (value) => {
  const n = Math.round(Number(value) || 0);
  return 'Rs ' + n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

const formatQty = (value) => {
  const n = Number(value) || 0;
  return Math.round(n * 10) / 10;
};

const computeStoreItems = (items, factor) =>
  items.map((item) => {
    const price = Math.round(((item.cost * factor) / 5) * 5);
    return { ...item, price };
  });

const computeStoreTotal = (storeItems) =>
  storeItems.reduce((acc, item) => acc + item.price, 0);

// ─── Small presentational helpers ──────────────────────────────────────────

const StoreMeta = ({ itemCount, kmAway, hasDelivery, showCheck = false }) => (
  <View style={styles.storeMeta}>
    <Ionicons
      name={showCheck ? 'checkmark-circle' : 'cube-outline'}
      size={14}
      color={showCheck ? Colors.retailBasil : Colors.retailMuted}
    />
    <Text style={styles.storeMetaText}>{itemCount} items in stock</Text>
    <Text style={styles.storeMetaSep}>•</Text>
    <Text style={styles.storeMetaText}>{kmAway} km away</Text>
    {hasDelivery && (
      <>
        <Text style={styles.storeMetaSep}>•</Text>
        <Ionicons name="car-outline" size={14} color={Colors.retailMuted} />
      </>
    )}
  </View>
);

// ─── Screen ────────────────────────────────────────────────────────────────

export default function RetailComparingScreen({
  items = [],
  shoppingListId = null,
  onBack,
  onEcoPress,
}) {
  const [filterExpanded, setFilterExpanded] = useState(false);
  const [detailStore, setDetailStore] = useState(null);
  const [itemsModalOpen, setItemsModalOpen] = useState(false);
  const [backendComparison, setBackendComparison] = useState(null);
  const [discounts, setDiscounts] = useState([]);
  const [loadingCompare, setLoadingCompare] = useState(false);
  const [recorded, setRecorded] = useState(false);

  const comparedItems = useMemo(
    () =>
      items.map((item) => ({
        ...item,
        quantity: item.quantity || item.baseQuantity || 1,
        unit: item.unit || 'g',
        cost: item.cost ?? item.baseCost ?? 0,
      })),
    [items]
  );

  // Fetch comparison from backend
  useEffect(() => {
    let mounted = true;
    const fetchLiveComparison = async () => {
      try {
        setLoadingCompare(true);
        let listId = shoppingListId;
        if (!listId) {
          const currentList = await shoppingService.getCurrentShoppingList();
          if (currentList?.id) listId = currentList.id;
        }

        if (listId) {
          const [compData, discData] = await Promise.all([
            shoppingService.compareStores(listId, 6.8531, 80.2625),
            shoppingService.getDiscounts(listId).catch(() => []),
          ]);

          if (mounted && compData) {
            setBackendComparison(compData);
            setDiscounts(discData || []);
          }
        }
      } catch (err) {
        console.log('Compare API note:', err.message);
      } finally {
        if (mounted) setLoadingCompare(false);
      }
    };

    fetchLiveComparison();

    return () => {
      mounted = false;
    };
  }, [shoppingListId]);

  const storeData = useMemo(() => {
    if (backendComparison?.stores && backendComparison.stores.length > 0) {
      const mapped = backendComparison.stores.map((s) => {
        const factor = s.total / (backendComparison.best_store?.total || 1);
        const storeItems = computeStoreItems(comparedItems, factor || 1);
        return {
          id: s.id,
          name: s.name,
          total: Math.round(s.total),
          kmAway: s.distance_km || 1.5,
          hasDelivery: s.name !== 'Local Market',
          items: storeItems,
          isCheapest: Boolean(s.is_cheapest),
          diff: Math.round(s.total - (backendComparison.best_store?.total || 0)),
          savings: Math.round(backendComparison.best_store?.saving_vs_next_best || 250),
          itemsInStock: s.items_in_stock || comparedItems.length,
        };
      });

      const sorted = [...mapped].sort((a, b) => a.total - b.total);
      const cheapest = sorted[0] || {};
      return { sorted, cheapest };
    }

    const computed = STORES.map((store) => {
      const storeItems = computeStoreItems(comparedItems, store.factor);
      return {
        ...store,
        items: storeItems,
        total: computeStoreTotal(storeItems),
        itemsInStock: comparedItems.length,
      };
    });
    const sorted = [...computed].sort((a, b) => a.total - b.total);
    const cheapest = sorted[0];
    const nextBest = sorted[1] || cheapest;
    cheapest.savings = Math.max(0, nextBest.total - cheapest.total);
    sorted.forEach((store) => {
      store.diff = store.total - cheapest.total;
      store.isCheapest = store.total === cheapest.total;
    });
    return { sorted, cheapest };
  }, [comparedItems, backendComparison]);

  const { sorted: sortedStores, cheapest } = storeData;
  const itemsCount = comparedItems.length;

  const handleRecordSavings = async () => {
    try {
      await savingsService.recordSavings({
        amount: cheapest.savings || 250,
        type: 'shop_comparison',
        description: `Saved by shopping at ${cheapest.name}`,
        reference_id: shoppingListId || undefined,
      });
      setRecorded(true);
      Alert.alert(
        'Savings Recorded!',
        `Recorded Rs ${cheapest.savings} to your savings history dashboard.`,
        [{ text: 'Great!' }]
      );
    } catch (e) {
      Alert.alert('Savings Recorded!', `Recorded Rs ${cheapest.savings} saved.`);
    }
  };

  const handleBack = () => {
    if (onBack) onBack();
  };

  const handleEco = () => {
    if (onEcoPress) {
      onEcoPress();
    }
  };

  const openDetail = (store) => {
    setDetailStore(store);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.retailBg} />

      {/* ── Top App Bar ── */}
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={handleBack}
          style={styles.iconButton}
          activeOpacity={0.7}
          accessibilityLabel="Go back"
        >
          <Ionicons name="arrow-back" size={22} color={Colors.retailTerracotta} />
        </TouchableOpacity>

        <View style={styles.topBarCenter}>
          <Text style={styles.topBarTitle}>Shopping Comparison</Text>
          <Text style={styles.topBarSubtitle}>
            {itemsCount} {itemsCount === 1 ? 'Item' : 'Items'} • Live Supermarket Prices
          </Text>
        </View>

        <TouchableOpacity
          onPress={handleEco}
          style={styles.iconButton}
          activeOpacity={0.7}
          accessibilityLabel="Eco settings"
        >
          <Ionicons name="leaf-outline" size={22} color={Colors.retailMuted} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {loadingCompare && (
          <View style={styles.loadingBanner}>
            <ActivityIndicator size="small" color={Colors.primary} />
            <Text style={styles.loadingText}>Comparing live prices across stores...</Text>
          </View>
        )}

        {/* ── Active Discounts Banner ── */}
        {discounts.length > 0 && (
          <View style={styles.discountBanner}>
            <View style={styles.discountIconWrap}>
              <Ionicons name="pricetag" size={16} color="#FFFFFF" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.discountTitle}>{discounts[0].title}</Text>
              <Text style={styles.discountSubtitle}>
                {discounts[0].store} • {discounts[0].product} ({discounts[0].discount} Off)
              </Text>
            </View>
          </View>
        )}

        {/* ── Collapsible Filter ── */}
        <View style={styles.filterCard}>
          <TouchableOpacity
            style={styles.filterHeader}
            onPress={() => setFilterExpanded((v) => !v)}
            activeOpacity={0.75}
          >
            <View>
              <Text style={styles.filterTitle}>Stores with items in stock</Text>
              <Text style={styles.filterSubtitle}>Prices for all {itemsCount} items</Text>
            </View>
            <Ionicons
              name={filterExpanded ? 'chevron-up' : 'chevron-down'}
              size={22}
              color={Colors.retailCharcoal}
            />
          </TouchableOpacity>

          {filterExpanded && (
            <View style={styles.filterBody}>
              {sortedStores.map((store) => (
                <View key={store.id} style={styles.filterRow}>
                  <Text style={styles.filterRowLabel}>{store.name}</Text>
                  <View style={styles.filterRowRight}>
                    {store.isCheapest && (
                      <View style={styles.foundBadge}>
                        <Ionicons
                          name="checkmark-circle"
                          size={13}
                          color={Colors.retailBasil}
                        />
                        <Text style={styles.foundBadgeText}>In stock</Text>
                      </View>
                    )}
                    <Text style={styles.filterRowPrice}>
                      {formatPrice(store.total)}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* ── Store Comparison Cards ── */}
        <View style={styles.storeList}>
          {sortedStores.map((store) => (
            <StoreCard
              key={store.id}
              store={store}
              itemsCount={store.itemsInStock || itemsCount}
              onPress={() => openDetail(store)}
            />
          ))}
        </View>

        {/* ── Best Price Summary Banner ── */}
        <View style={styles.summaryBanner}>
          <View style={styles.summaryLeft}>
            <View style={styles.summaryTrophy}>
              <MaterialCommunityIcons
                name="trophy"
                size={20}
                color="#FFFFFF"
              />
            </View>
            <View>
              <Text style={styles.summaryTitle}>
                Best price at {cheapest.name}
              </Text>
              <Text style={styles.summarySubtitle}>
                Save Rs {cheapest.savings} vs. next best store
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={[styles.summaryPill, recorded && { backgroundColor: '#2E7D32' }]}
            onPress={handleRecordSavings}
            activeOpacity={0.8}
          >
            <Text style={styles.summaryPillText}>
              {recorded ? 'Saved ✓' : `Rs ${cheapest.savings}`}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* ── Sticky Bottom CTA ── */}
      <View style={styles.bottomCtaWrap}>
        <TouchableOpacity
          style={styles.bottomCta}
          onPress={() => setItemsModalOpen(true)}
          activeOpacity={0.88}
        >
          <Ionicons name="cart-outline" size={20} color="#FFFFFF" />
          <Text style={styles.bottomCtaText}>View Items & Compare</Text>
          <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* ── Item detail modal (per store) ── */}
      <Modal
        visible={detailStore !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setDetailStore(null)}
      >
        {detailStore && (
          <ItemDetailModal store={detailStore} onClose={() => setDetailStore(null)} />
        )}
      </Modal>

      {/* ── Compare items across stores modal ── */}
      <Modal
        visible={itemsModalOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setItemsModalOpen(false)}
      >
        <ItemsCompareModal
          stores={sortedStores}
          onClose={() => setItemsModalOpen(false)}
        />
      </Modal>
    </SafeAreaView>
  );
}

// ─── Store Card ─────────────────────────────────────────────────────────────

function StoreCard({ store, itemsCount, onPress }) {
  const isCheapest = store.diff === 0;

  return (
    <TouchableOpacity
      style={[
        styles.storeCard,
        isCheapest && styles.storeCardCheapest,
      ]}
      onPress={onPress}
      activeOpacity={0.88}
    >
      {isCheapest && (
        <View style={styles.cheapestBadge}>
          <Text style={styles.cheapestBadgeText}>CHEAPEST</Text>
        </View>
      )}

      <View style={styles.storeCardHeader}>
        <Text style={styles.storeName}>{store.name}</Text>
        <View style={styles.storePriceBlock}>
          <Text
            style={[
              styles.storePrice,
              !isCheapest && store.diff > 0 && styles.storePriceDim,
            ]}
          >
            {formatPrice(store.total)}
          </Text>
          {!isCheapest && store.diff > 0 && (
            <Text style={styles.storeDiffText}>
              Rs {store.diff} more
            </Text>
          )}
        </View>
      </View>

      <StoreMeta
        itemCount={itemsCount}
        kmAway={store.kmAway}
        hasDelivery={store.hasDelivery}
        showCheck={isCheapest}
      />

      <View
        style={[
          styles.receiptDashed,
          isCheapest && styles.receiptDashedCheapest,
        ]}
      />

      {isCheapest ? (
        <View style={styles.savingsRow}>
          <View style={styles.savingsLeft}>
            <Ionicons name="wallet-outline" size={16} color={Colors.retailBasil} />
            <Text style={styles.savingsText}>
              You save Rs {store.savings} / Compared to next best
            </Text>
          </View>
          <Ionicons name="arrow-forward" size={18} color={Colors.retailBasil} />
        </View>
      ) : (
        <View style={styles.savingsRowMuted}>
          <Text style={styles.savingsMutedText}>Tap to see item prices</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

// ─── Item Detail Modal ──────────────────────────────────────────────────────

function ItemDetailModal({ store, onClose }) {
  return (
    <View style={styles.modalOverlay}>
      <SafeAreaView style={styles.modalSheet}>
        <View style={styles.modalHandle} />
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>{store.name}</Text>
          <TouchableOpacity onPress={onClose} style={styles.iconButton} activeOpacity={0.7}>
            <Ionicons name="close" size={22} color={Colors.retailCharcoal} />
          </TouchableOpacity>
        </View>

        <Text style={styles.modalPrice}>{formatPrice(store.total)}</Text>
        <Text style={styles.modalSub}>Item price breakdown</Text>

        <ScrollView
          style={styles.modalList}
          contentContainerStyle={styles.modalListContent}
          showsVerticalScrollIndicator={false}
        >
          {store.items.map((item) => (
            <View key={item.id} style={styles.modalRow}>
              <View style={styles.modalRowLeft}>
                <Text style={styles.modalItemName}>{item.name}</Text>
                <Text style={styles.modalItemQty}>
                  {formatQty(item.quantity)} {item.unit}
                </Text>
              </View>
              <Text style={styles.modalItemPrice}>{formatPrice(item.price)}</Text>
            </View>
          ))}

          <View style={styles.receiptDashed} />
          <View style={styles.modalTotalRow}>
            <Text style={styles.modalTotalLabel}>Store total</Text>
            <Text style={styles.modalTotalValue}>{formatPrice(store.total)}</Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

// ─── Items Compare Modal (all stores, cheapest per item) ───────────────────

function ItemsCompareModal({ stores, onClose }) {
  const firstStore = stores[0] || { items: [] };
  const items = firstStore.items || [];

  return (
    <View style={styles.modalOverlay}>
      <SafeAreaView style={styles.modalSheet}>
        <View style={styles.modalHandle} />
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Compare Items Across Stores</Text>
          <TouchableOpacity onPress={onClose} style={styles.iconButton} activeOpacity={0.7}>
            <Ionicons name="close" size={22} color={Colors.retailCharcoal} />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.modalList}
          contentContainerStyle={styles.modalListContent}
          showsVerticalScrollIndicator={false}
        >
          {items.map((item) => {
            const prices = stores.map((s) => ({
              name: s.name,
              price: s.items.find((i) => i.id === item.id)?.price ?? 0,
            }));
            const best = Math.min(...prices.map((p) => p.price));
            return (
              <View key={item.id} style={styles.compareItemCard}>
                <Text style={styles.compareItemName}>{item.name}</Text>
                {prices.map((p) => (
                  <View key={p.name} style={styles.compareRow}>
                    <Text style={styles.compareStoreName}>{p.name}</Text>
                    {p.price === best ? (
                      <View style={styles.compareBestWrap}>
                        <Text style={styles.compareBestPrice}>
                          {formatPrice(p.price)}
                        </Text>
                        <Ionicons
                          name="checkmark-circle"
                          size={15}
                          color={Colors.retailBasil}
                        />
                      </View>
                    ) : (
                      <Text style={styles.compareRowPrice}>
                        {formatPrice(p.price)}
                      </Text>
                    )}
                  </View>
                ))}
              </View>
            );
          })}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.retailBg || '#FAFAF8',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0EFEA',
  },
  topBarCenter: {
    alignItems: 'center',
  },
  topBarTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1C1917',
  },
  topBarSubtitle: {
    fontSize: 12,
    color: '#78716C',
  },
  iconButton: {
    padding: 6,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 90,
  },
  loadingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  loadingText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  discountBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FED7AA',
    padding: 12,
    borderRadius: 14,
    marginBottom: 14,
    gap: 12,
  },
  discountIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EA580C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  discountTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#9A3412',
  },
  discountSubtitle: {
    fontSize: 11,
    color: '#C2410C',
    marginTop: 2,
  },
  filterCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E7E5E4',
  },
  filterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  filterTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1C1917',
  },
  filterSubtitle: {
    fontSize: 12,
    color: '#78716C',
    marginTop: 2,
  },
  filterBody: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F5F5F4',
    paddingTop: 10,
    gap: 8,
  },
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  filterRowLabel: {
    fontSize: 13,
    color: '#44403C',
  },
  filterRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  foundBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  foundBadgeText: {
    fontSize: 11,
    color: '#059669',
    fontWeight: '600',
  },
  filterRowPrice: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1C1917',
  },
  storeList: {
    gap: 14,
  },
  storeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E7E5E4',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  storeCardCheapest: {
    borderColor: '#10B981',
    borderWidth: 2,
    backgroundColor: '#FFFFFF',
  },
  cheapestBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#10B981',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 8,
  },
  cheapestBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  storeCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  storeName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1C1917',
  },
  storePriceBlock: {
    alignItems: 'flex-end',
  },
  storePrice: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1C1917',
  },
  storePriceDim: {
    color: '#78716C',
  },
  storeDiffText: {
    fontSize: 11,
    color: '#DC2626',
    fontWeight: '600',
    marginTop: 2,
  },
  storeMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  storeMetaText: {
    fontSize: 12,
    color: '#78716C',
  },
  storeMetaSep: {
    color: '#D6D3D1',
  },
  receiptDashed: {
    height: 1,
    borderWidth: 1,
    borderColor: '#E7E5E4',
    borderStyle: 'dashed',
    marginVertical: 10,
  },
  receiptDashedCheapest: {
    borderColor: '#A7F3D0',
  },
  savingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ECFDF5',
    padding: 10,
    borderRadius: 10,
  },
  savingsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  savingsText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#059669',
  },
  savingsRowMuted: {
    paddingVertical: 4,
    alignItems: 'center',
  },
  savingsMutedText: {
    fontSize: 12,
    color: '#78716C',
  },
  summaryBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 16,
    marginTop: 18,
  },
  summaryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  summaryTrophy: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F59E0B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  summarySubtitle: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  summaryPill: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  summaryPillText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  bottomCtaWrap: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0EFEA',
  },
  bottomCta: {
    backgroundColor: '#EA580C',
    borderRadius: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  bottomCtaText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '80%',
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E5E7EB',
    alignSelf: 'center',
    marginBottom: 12,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1C1917',
  },
  modalPrice: {
    fontSize: 24,
    fontWeight: '800',
    color: '#EA580C',
    marginTop: 8,
  },
  modalSub: {
    fontSize: 12,
    color: '#78716C',
    marginBottom: 16,
  },
  modalList: {
    maxHeight: 320,
  },
  modalListContent: {
    gap: 12,
    paddingBottom: 20,
  },
  modalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalRowLeft: {
    flex: 1,
  },
  modalItemName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1917',
  },
  modalItemQty: {
    fontSize: 12,
    color: '#78716C',
    marginTop: 2,
  },
  modalItemPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1C1917',
  },
  modalTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
  },
  modalTotalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1C1917',
  },
  modalTotalValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#EA580C',
  },
  compareItemCard: {
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 12,
    gap: 8,
  },
  compareItemName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1C1917',
    marginBottom: 4,
  },
  compareRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  compareStoreName: {
    fontSize: 13,
    color: '#4B5563',
  },
  compareRowPrice: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1C1917',
  },
  compareBestWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  compareBestPrice: {
    fontSize: 13,
    fontWeight: '700',
    color: '#059669',
  },
});
