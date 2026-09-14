import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  Modal,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Linking,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { Ionicons, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import Colors from '../../constants/colors';
import { storeService } from '../../services';

const CATEGORIES = [
  'All',
  'Supermarkets',
  'Grocery',
  'Bakery',
  'Butcher',
  'Fruits & Vegetables',
  'Specialty Food',
];

const ShopDiscoveryModal = ({ visible, onClose, onSelectStore }) => {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'map'
  const [favouriteIds, setFavouriteIds] = useState([]);
  const [selectedStorePreview, setSelectedStorePreview] = useState(null);

  useEffect(() => {
    if (visible) {
      loadStores();
      loadFavourites();
    }
  }, [visible, activeCategory, searchQuery]);

  const loadStores = async () => {
    setLoading(true);
    try {
      const list = await storeService.getNearbyStores(6.9147, 79.8778, {
        category: activeCategory,
        search: searchQuery,
      });
      setStores(list);
    } catch (_) {}
    setLoading(false);
  };

  const loadFavourites = async () => {
    try {
      const favs = await storeService.getFavouriteShops();
      setFavouriteIds(favs);
    } catch (_) {}
  };

  const handleToggleFav = async (storeId) => {
    const res = await storeService.toggleFavouriteShop(storeId);
    if (res?.favourites) {
      setFavouriteIds(res.favourites);
    }
  };

  const handleCall = (phone) => {
    if (phone) {
      Linking.openURL(`tel:${phone.replace(/[^0-9+]/g, '')}`);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.iconCircle}>
                <Ionicons name="location" size={20} color="#007A3D" />
              </View>
              <View>
                <Text style={styles.headerTitle}>Nearby Shop Discovery</Text>
                <Text style={styles.headerSub}>GPS Location: Colombo 02 • 5km Radius</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {/* Search & Mode Switcher */}
          <View style={styles.searchRow}>
            <View style={styles.searchBar}>
              <Ionicons name="search" size={17} color="#9CA3AF" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search shops, butchers, grocers..."
                placeholderTextColor="#9CA3AF"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={16} color="#9CA3AF" />
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.viewModeToggle}>
              <TouchableOpacity
                style={[styles.modeBtn, viewMode === 'list' && styles.modeBtnActive]}
                onPress={() => setViewMode('list')}
                activeOpacity={0.8}
              >
                <Ionicons name="list" size={16} color={viewMode === 'list' ? '#FFFFFF' : '#6B7280'} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modeBtn, viewMode === 'map' && styles.modeBtnActive]}
                onPress={() => setViewMode('map')}
                activeOpacity={0.8}
              >
                <Ionicons name="map" size={16} color={viewMode === 'map' ? '#FFFFFF' : '#6B7280'} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Category Chips */}
          <View style={styles.categoryScrollWrap}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoryRow}
            >
              {CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.categoryChip, activeCategory === cat && styles.categoryChipActive]}
                  onPress={() => setActiveCategory(cat)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.categoryText, activeCategory === cat && styles.categoryTextActive]}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Body Content */}
          {loading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="small" color="#007A3D" />
              <Text style={styles.loadingText}>Locating nearby verified stores...</Text>
            </View>
          ) : viewMode === 'map' ? (
            /* ─── Simulated Map View ───────────────────────────────────────── */
            <View style={styles.mapContainer}>
              <View style={styles.simulatedMap}>
                {/* Street Grid Lines Mock */}
                <View style={styles.mapGridLineH1} />
                <View style={styles.mapGridLineH2} />
                <View style={styles.mapGridLineV1} />
                <View style={styles.mapGridLineV2} />

                {/* User Location Pulse Marker */}
                <View style={styles.userPin}>
                  <View style={styles.userPinDot} />
                  <Text style={styles.userPinText}>You (Colombo)</Text>
                </View>

                {/* Store Pins on Map */}
                {stores.slice(0, 6).map((store, index) => {
                  const offsets = [
                    { top: '20%', left: '25%' },
                    { top: '35%', left: '70%' },
                    { top: '55%', left: '30%' },
                    { top: '65%', left: '60%' },
                    { top: '15%', left: '65%' },
                    { top: '48%', left: '15%' },
                  ];
                  const pos = offsets[index % offsets.length];
                  return (
                    <TouchableOpacity
                      key={store.id}
                      style={[styles.storeMapPin, pos, { borderColor: store.color || '#007A3D' }]}
                      onPress={() => setSelectedStorePreview(store)}
                      activeOpacity={0.8}
                    >
                      <MaterialCommunityIcons
                        name={store.isLocalShop ? 'storefront' : 'shopping'}
                        size={14}
                        color={store.color || '#007A3D'}
                      />
                      <Text style={styles.pinName} numberOfLines={1}>
                        {store.name.split(' ')[0]} ({store.distanceKm}km)
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Selected Pin Bottom Card */}
              {selectedStorePreview ? (
                <View style={styles.mapPreviewCard}>
                  <View style={styles.cardHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.storeName}>{selectedStorePreview.name}</Text>
                      <Text style={styles.storeAddress}>{selectedStorePreview.address}</Text>
                    </View>
                    <View style={styles.distanceBadge}>
                      <Text style={styles.distanceText}>{selectedStorePreview.distanceKm} km away</Text>
                    </View>
                  </View>
                  <View style={styles.cardActions}>
                    <TouchableOpacity
                      style={styles.callBtn}
                      onPress={() => handleCall(selectedStorePreview.phone)}
                    >
                      <Ionicons name="call" size={14} color="#374151" />
                      <Text style={styles.callBtnText}>Call</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.selectBtn}
                      onPress={() => {
                        onSelectStore && onSelectStore(selectedStorePreview);
                        onClose();
                      }}
                    >
                      <Text style={styles.selectBtnText}>View Store Details →</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <View style={styles.tapPinPrompt}>
                  <Text style={styles.tapPinPromptText}>Tap any store pin on the map to inspect prices & directions</Text>
                </View>
              )}
            </View>
          ) : (
            /* ─── List View ───────────────────────────────────────────────── */
            <ScrollView style={styles.storeList} showsVerticalScrollIndicator={false}>
              {stores.length === 0 ? (
                <View style={styles.emptyBox}>
                  <Ionicons name="storefront-outline" size={32} color="#9CA3AF" />
                  <Text style={styles.emptyText}>No stores matched your search filter.</Text>
                </View>
              ) : (
                stores.map((store) => {
                  const isFav = favouriteIds.includes(store.id);
                  return (
                    <TouchableOpacity
                      key={store.id}
                      style={styles.storeCard}
                      onPress={() => {
                        onSelectStore && onSelectStore(store);
                        onClose();
                      }}
                      activeOpacity={0.88}
                    >
                      <View style={styles.cardHeader}>
                        {store.logo ? (
                          <Image source={{ uri: store.logo }} style={styles.storeThumbLogo} />
                        ) : (
                          <View style={[styles.storeIconWrap, { backgroundColor: (store.color || '#007A3D') + '15' }]}>
                            {store.isLocalShop ? (
                              <MaterialCommunityIcons name="storefront" size={22} color={store.color || '#007A3D'} />
                            ) : (
                              <FontAwesome5 name="shopping-cart" size={17} color={store.color || '#007A3D'} />
                            )}
                          </View>
                        )}
                        <View style={{ flex: 1 }}>
                          <View style={styles.titleRow}>
                            <Text style={styles.storeName}>{store.name}</Text>
                            {store.isVerified && (
                              <View style={styles.verifiedBadge}>
                                <Ionicons name="checkmark-circle" size={12} color="#166534" />
                                <Text style={styles.verifiedText}>Verified</Text>
                              </View>
                            )}
                          </View>
                          <Text style={styles.storeAddress}>{store.address}</Text>
                        </View>

                        {/* Fav Heart */}
                        <TouchableOpacity
                          style={styles.favBtn}
                          onPress={() => handleToggleFav(store.id)}
                          activeOpacity={0.7}
                        >
                          <Ionicons
                            name={isFav ? 'heart' : 'heart-outline'}
                            size={20}
                            color={isFav ? '#DC2626' : '#9CA3AF'}
                          />
                        </TouchableOpacity>
                      </View>

                      {/* Meta Tags */}
                      <View style={styles.metaRow}>
                        <View style={styles.metaItem}>
                          <Ionicons name="navigate-outline" size={13} color="#2563EB" />
                          <Text style={[styles.metaLabel, { color: '#2563EB', fontWeight: '700' }]}>
                            {store.distanceKm} km away
                          </Text>
                        </View>
                        <View style={styles.metaItem}>
                          <Ionicons name="time-outline" size={13} color="#6B7280" />
                          <Text style={styles.metaLabel}>{store.openingHours || '7:30 AM – 10 PM'}</Text>
                        </View>
                        <View style={styles.metaItem}>
                          <Ionicons name="star" size={13} color="#F59E0B" />
                          <Text style={styles.metaLabel}>{store.rating || '4.8'}</Text>
                        </View>
                        {store.deliveryAvailable && (
                          <View style={styles.deliveryTag}>
                            <Text style={styles.deliveryText}>🛵 Delivery</Text>
                          </View>
                        )}
                      </View>

                      {/* Card Actions */}
                      <View style={styles.cardActions}>
                        <TouchableOpacity
                          style={styles.callBtn}
                          onPress={() => handleCall(store.phone)}
                          activeOpacity={0.7}
                        >
                          <Ionicons name="call-outline" size={14} color="#374151" />
                          <Text style={styles.callBtnText}>Call</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.selectBtn}
                          onPress={() => {
                            onSelectStore && onSelectStore(store);
                            onClose();
                          }}
                          activeOpacity={0.8}
                        >
                          <Text style={styles.selectBtnText}>View Store Details →</Text>
                        </TouchableOpacity>
                      </View>
                    </TouchableOpacity>
                  );
                })
              )}
              <View style={{ height: 20 }} />
            </ScrollView>
          )}
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
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#111827',
  },
  headerSub: {
    fontSize: 11.5,
    color: '#6B7280',
    marginTop: 1,
  },
  closeBtn: {
    padding: 6,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    gap: 8,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 6,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#111827',
    padding: 0,
  },
  viewModeToggle: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 3,
  },
  modeBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 9,
  },
  modeBtnActive: {
    backgroundColor: '#007A3D',
  },
  categoryScrollWrap: {
    height: 38,
    marginBottom: 8,
  },
  categoryRow: {
    paddingHorizontal: 20,
    gap: 8,
    alignItems: 'center',
  },
  categoryChip: {
    height: 32,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryChipActive: {
    backgroundColor: '#007A3D',
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4B5563',
  },
  categoryTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  loadingBox: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  loadingText: {
    fontSize: 13,
    color: '#6B7280',
  },
  storeList: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 6,
  },
  emptyBox: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  emptyText: {
    fontSize: 13,
    color: '#6B7280',
  },
  storeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: 'rgba(0,0,0,0.03)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  storeThumbLogo: {
    width: 42,
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  storeIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  storeName: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#111827',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 2,
  },
  verifiedText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#166534',
  },
  storeAddress: {
    fontSize: 11.5,
    color: '#6B7280',
    marginTop: 2,
  },
  favBtn: {
    padding: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    gap: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaLabel: {
    fontSize: 11.5,
    color: '#4B5563',
  },
  deliveryTag: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  deliveryText: {
    fontSize: 10.5,
    color: '#92400E',
    fontWeight: '700',
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  callBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  callBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  selectBtn: {
    backgroundColor: '#007A3D',
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  selectBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Map Simulation
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  simulatedMap: {
    flex: 1,
    backgroundColor: '#E2E8F0',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 18,
    overflow: 'hidden',
    position: 'relative',
  },
  mapGridLineH1: {
    position: 'absolute',
    top: '33%',
    left: 0,
    right: 0,
    height: 6,
    backgroundColor: '#CBD5E1',
  },
  mapGridLineH2: {
    position: 'absolute',
    top: '66%',
    left: 0,
    right: 0,
    height: 6,
    backgroundColor: '#CBD5E1',
  },
  mapGridLineV1: {
    position: 'absolute',
    left: '35%',
    top: 0,
    bottom: 0,
    width: 6,
    backgroundColor: '#CBD5E1',
  },
  mapGridLineV2: {
    position: 'absolute',
    left: '68%',
    top: 0,
    bottom: 0,
    width: 6,
    backgroundColor: '#CBD5E1',
  },
  userPin: {
    position: 'absolute',
    top: '50%',
    left: '46%',
    alignItems: 'center',
    zIndex: 10,
  },
  userPinDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#2563EB',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  userPinText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#1E3A8A',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
    marginTop: 2,
  },
  storeMapPin: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 14,
    borderWidth: 1.5,
    gap: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  pinName: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#111827',
  },
  mapPreviewCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  distanceBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  distanceText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1E40AF',
  },
  tapPinPrompt: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  tapPinPromptText: {
    fontSize: 11.5,
    color: '#6B7280',
    fontWeight: '500',
  },
});

export default ShopDiscoveryModal;
