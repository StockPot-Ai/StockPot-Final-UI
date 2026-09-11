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
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Colors from '../constants/colors';
import { storeService, shoppingService } from '../services';

const formatPrice = (value) => {
  const n = Math.round(Number(value) || 0);
  return 'Rs ' + n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

const computeStoreItems = (items, factor = 1.0) =>
  items.map((item) => {
    const price = Math.round((((item.cost || 100) * factor) / 5) * 5);
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
  onBack,
  onEcoPress,
}) {
  const [filterExpanded, setFilterExpanded] = useState(false);
  const [detailStore, setDetailStore] = useState(null);
  const [itemsModalOpen, setItemsModalOpen] = useState(false);
  const [apiStores, setApiStores] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchStoresData = useCallback(async () => {
    setLoading(true);
    try {
      const stores = await storeService.getStores();
      if (Array.isArray(stores) && stores.length > 0) {
        setApiStores(
          stores.map((s, idx) => ({
            id: s.id || `store-${idx}`,
            name: s.name || s.store_name || 'Retail Supermarket',
            factor: s.price_multiplier || s.factor || (idx === 0 ? 0.93 : idx === 1 ? 0.98 : 1.05),
            kmAway: s.distance_km || s.distance || (1.2 + idx * 0.8),
            hasDelivery: s.delivery_available ?? s.hasDelivery ?? true,
          }))
        );
      } else {
        setApiStores([
          { id: 'cargills', name: 'Cargills Food City', factor: 0.92, kmAway: 1.2, hasDelivery: true },
          { id: 'keells', name: 'Keells Super', factor: 0.97, kmAway: 2.4, hasDelivery: true },
          { id: 'local', name: 'Local Farmers Market', factor: 1.04, kmAway: 0.85, hasDelivery: false },
        ]);
      }
    } catch (err) {
      console.log('[RetailComparingScreen] Note on stores API:', err.message);
      setApiStores([
        { id: 'cargills', name: 'Cargills Food City', factor: 0.92, kmAway: 1.2, hasDelivery: true },
        { id: 'keells', name: 'Keells Super', factor: 0.97, kmAway: 2.4, hasDelivery: true },
        { id: 'local', name: 'Local Farmers Market', factor: 1.04, kmAway: 0.85, hasDelivery: false },
      ]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStoresData();
  }, [fetchStoresData]);

  const comparedItems = useMemo(
    () =>
      items.map((item) => ({
        ...item,
        quantity: item.quantity || item.baseQuantity || 1,
        unit: item.unit || 'g',
        cost: item.cost ?? item.baseCost ?? 100,
      })),
    [items]
  );

  const storeData = useMemo(() => {
    const computed = apiStores.map((store) => {
      const storeItems = computeStoreItems(comparedItems, store.factor);
      return {
        ...store,
        items: storeItems,
        total: computeStoreTotal(storeItems),
      };
    });
    const sorted = [...computed].sort((a, b) => a.total - b.total);
    const cheapest = sorted[0] || { total: 0, savings: 0 };
    const nextBest = sorted[1] || cheapest;
    cheapest.savings = Math.max(0, (nextBest.total || 0) - (cheapest.total || 0));
    sorted.forEach((store) => {
      store.diff = store.total - cheapest.total;
      store.isCheapest = store.total === cheapest.total;
    });
    return { sorted, cheapest };
  }, [apiStores, comparedItems]);

  const { sorted: sortedStores, cheapest } = storeData;

  const itemsCount = comparedItems.length;

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
          <Text style={styles.topBarTitle}>Shopping List</Text>
          <Text style={styles.topBarSubtitle}>
            {itemsCount} {itemsCount === 1 ? 'Item' : 'Items'}
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
              itemsCount={itemsCount}
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
                Save Rs {cheapest.savings} vs. next best
              </Text>
            </View>
          </View>
          <View style={styles.summaryPill}>
            <Text style={styles.summaryPillText}>
              Rs {cheapest.savings}
            </Text>
          </View>
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
          <Text style={styles.modalTitle}>Compare Items</Text>
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

// ─── Helpers ────────────────────────────────────────────────────────────────

const formatQty = (q) => {
  const num = Number(q);
  if (Number.isInteger(num)) return String(num);
  return num.toFixed(1).replace(/\.0$/, '');
};

// ─── Styles ────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.retailBg,
  },

  // ── Top App Bar
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: Colors.retailBg,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(43,36,32,0.1)',
    shadowColor: 'rgba(43,36,32,0.04)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 2,
  },
  iconButton: {
    padding: 8,
    marginLeft: -8,
    marginRight: -8,
    borderRadius: 999,
  },
  topBarCenter: {
    alignItems: 'center',
  },
  topBarTitle: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '700',
    color: Colors.retailTerracotta,
  },
  topBarSubtitle: {
    fontSize: 11,
    lineHeight: 12,
    letterSpacing: 0.5,
    color: Colors.retailMuted,
    fontWeight: '700',
    textTransform: 'uppercase',
  },

  // ── Scroll content
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 120,
    gap: 16,
  },

  // ── Collapsible Filter
  filterCard: {
    backgroundColor: Colors.retailSurface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(220,193,185,0.4)',
    shadowColor: 'rgba(43,36,32,0.04)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 1,
  },
  filterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  filterTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.retailCharcoal,
  },
  filterSubtitle: {
    fontSize: 14,
    lineHeight: 18,
    color: Colors.retailMuted,
    marginTop: 2,
  },
  filterBody: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 10,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  filterRowLabel: {
    fontSize: 14,
    color: Colors.retailCharcoal,
  },
  filterRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  foundBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: Colors.retailCheapestBg,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  foundBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.retailBasil,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  filterRowPrice: {
    fontSize: 13,
    fontFamily: 'monospace',
    fontWeight: '500',
    color: Colors.retailCharcoal,
  },

  // ── Store Cards
  storeList: {
    flexDirection: 'column',
    gap: 12,
  },
  storeCard: {
    backgroundColor: Colors.retailCard,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(43,36,32,0.1)',
    shadowColor: 'rgba(43,36,32,0.04)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 1,
    overflow: 'hidden',
    opacity: 1,
  },
  storeCardCheapest: {
    borderWidth: 2,
    borderColor: Colors.retailBasil,
  },
  cheapestBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: Colors.retailBasil,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderBottomLeftRadius: 8,
  },
  cheapestBadgeText: {
    fontSize: 11,
    lineHeight: 12,
    letterSpacing: 0.5,
    fontWeight: '700',
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
  storeCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingRight: 44,
  },
  storeName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.retailCharcoal,
  },
  storePriceBlock: {
    flexDirection: 'column',
    alignItems: 'flex-end',
  },
  storePrice: {
    fontSize: 16,
    lineHeight: 16,
    fontFamily: 'monospace',
    fontWeight: '700',
    color: Colors.retailCharcoal,
  },
  storePriceDim: {
    color: 'rgba(43,36,32,0.6)',
  },
  storeDiffText: {
    fontSize: 11,
    lineHeight: 12,
    letterSpacing: 0.5,
    fontWeight: '700',
    color: Colors.retailTerracotta,
    marginTop: 4,
    textTransform: 'uppercase',
  },
  storeMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  storeMetaText: {
    fontSize: 13,
    color: Colors.retailMuted,
  },
  storeMetaSep: {
    color: 'rgba(43,36,32,0.2)',
    marginHorizontal: 4,
    fontSize: 12,
  },
  receiptDashed: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(43,36,32,0.1)',
    borderStyle: 'dashed',
    marginBottom: 12,
  },
  receiptDashedCheapest: {
    borderBottomColor: 'rgba(58,104,71,0.35)',
  },
  savingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.retailSurfaceLow,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  savingsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  savingsText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    color: Colors.retailBasil,
  },
  savingsRowMuted: {
    alignItems: 'flex-start',
  },
  savingsMutedText: {
    fontSize: 12,
    color: Colors.retailMuted,
  },

  // ── Best Price Summary Banner
  summaryBanner: {
    marginTop: 4,
    backgroundColor: 'rgba(232,169,63,0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(232,169,63,0.2)',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: 'rgba(43,36,32,0.04)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 1,
  },
  summaryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  summaryTrophy: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.retailTurmeric,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.retailCharcoal,
  },
  summarySubtitle: {
    fontSize: 12,
    color: Colors.retailMuted,
    marginTop: 2,
  },
  summaryPill: {
    backgroundColor: Colors.retailBasil,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
  },
  summaryPillText: {
    fontSize: 13,
    lineHeight: 14,
    fontFamily: 'monospace',
    fontWeight: '500',
    color: '#FFFFFF',
  },

  // ── Sticky Bottom CTA
  bottomCtaWrap: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 32,
    paddingBottom: Platform.OS === 'ios' ? 24 : 16,
    backgroundColor: 'transparent',
    overflow: 'hidden',
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
  },
  bottomCta: {
    backgroundColor: Colors.retailTerracotta,
    height: 52,
    borderRadius: 26,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: 'rgba(43,36,32,0.2)',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 6,
  },
  bottomCtaText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },

  // ── Modal shared
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  modalSheet: {
    backgroundColor: Colors.retailBg,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: Platform.OS === 'ios' ? 28 : 16,
    maxHeight: '80%',
  },
  modalHandle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.retailOutlineWarm,
    marginBottom: 12,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.retailCharcoal,
  },
  modalPrice: {
    fontSize: 26,
    fontFamily: 'monospace',
    fontWeight: '700',
    color: Colors.retailCharcoal,
  },
  modalSub: {
    fontSize: 13,
    color: Colors.retailMuted,
    marginBottom: 8,
  },
  modalList: {
    flexGrow: 0,
  },
  modalListContent: {
    paddingBottom: 16,
  },
  modalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(43,36,32,0.05)',
  },
  modalRowLeft: {
    flex: 1,
    paddingRight: 12,
  },
  modalItemName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.retailCharcoal,
  },
  modalItemQty: {
    fontSize: 12,
    color: Colors.retailMuted,
    marginTop: 1,
  },
  modalItemPrice: {
    fontSize: 14,
    fontFamily: 'monospace',
    fontWeight: '500',
    color: Colors.retailCharcoal,
  },
  modalTotalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
  },
  modalTotalLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.retailCharcoal,
  },
  modalTotalValue: {
    fontSize: 16,
    fontFamily: 'monospace',
    fontWeight: '700',
    color: Colors.retailBasil,
  },

  // ── Compare items modal
  compareItemCard: {
    backgroundColor: Colors.retailCard,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.retailOutlineWarm,
    padding: 12,
    marginBottom: 10,
    gap: 6,
  },
  compareItemName: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.retailCharcoal,
    marginBottom: 2,
  },
  compareRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  compareStoreName: {
    fontSize: 13,
    color: Colors.retailMuted,
  },
  compareRowPrice: {
    fontSize: 13,
    fontFamily: 'monospace',
    color: Colors.retailCharcoal,
  },
  compareBestWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  compareBestPrice: {
    fontSize: 13,
    fontFamily: 'monospace',
    fontWeight: '700',
    color: Colors.retailBasil,
  },
});
