import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { Ionicons, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import Colors from '../../constants/colors';
import { storeService, calculateDistance } from '../../services';
import locationService from '../../services/locationService';
import { useAccount } from '../../context/AccountContext';
import AsyncStorage from '../../utils/safeStorage';
import ShopOwnerModal from './ShopOwnerModal';

const NearbyShopsModal = ({ visible, onClose, onSelectStore }) => {
  const { t } = useAccount();
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('All'); // 'All', 'Supermarkets', 'Local Shops'
  const [userLocation, setUserLocation] = useState(null);
  const [registerModalVisible, setRegisterModalVisible] = useState(false);

  useEffect(() => {
    if (visible) {
      // 1. Immediately show cached stores with distance recalculated against current GPS
      if (stores.length === 0) {
        AsyncStorage.getItem('@stockpot_cached_nearby_stores').then((raw) => {
          if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed) && parsed.length > 0) {
              const currentCoords = locationService.getCachedLocation();
              if (currentCoords?.latitude && currentCoords?.longitude) {
                parsed.forEach((s) => {
                  if (s.latitude && s.longitude) {
                    s.distanceKm = calculateDistance(
                      currentCoords.latitude,
                      currentCoords.longitude,
                      s.latitude,
                      s.longitude
                    );
                  }
                });
                parsed.sort((a, b) => (a.distanceKm ?? 999) - (b.distanceKm ?? 999));
              }
              const nearbyList = parsed.filter((s) => (s.distanceKm ?? 0) <= 12);
              if (nearbyList.length > 0) {
                setStores(nearbyList);
                setLoading(false);
              }
            }
          }
        }).catch(() => {});
      }
      loadStores();
    }
  }, [visible]);

  const loadStores = async () => {
    // Only show full-screen loader if we don't already have stores displayed
    setLoading(stores.length === 0);
    try {
      const coords = await locationService.getCoordinates();
      setUserLocation(coords);
      const list = await storeService.getNearbyStores(coords?.latitude, coords?.longitude, {
        city: coords?.city || '',
      });
      if (Array.isArray(list) && list.length > 0) {
        setStores(list);
      }
    } catch (_) {
      const coords = locationService.getCachedLocation();
      setUserLocation(coords);
      const list = await storeService.getNearbyStores(coords?.latitude, coords?.longitude, {
        city: coords?.city || '',
      });
      if (Array.isArray(list) && list.length > 0) {
        setStores(list);
      }
    } finally {
      setLoading(false);
    }
  };

  const filteredStores = stores.filter((s) => {
    if (filterType === 'Supermarkets') return !s.isLocalShop;
    if (filterType === 'Local Shops') return s.isLocalShop;
    return true;
  });

  const handleCall = (phone) => {
    if (phone) {
      Linking.openURL(`tel:${phone.replace(/[^0-9+]/g, '')}`);
    }
  };

  const locationLabel = userLocation?.city
    ? userLocation.city
    : (!userLocation?.isUnavailable && userLocation?.formatted ? userLocation.formatted : 'Current Location');

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.iconCircle}>
                <Ionicons name="location" size={20} color={Colors.primary} />
              </View>
              <View>
                <Text style={styles.headerTitle}>{t ? t('nearby_shops', 'Nearby Grocery Shops') : 'Nearby Grocery Shops'}</Text>
                <Text style={styles.headerSub}>Location: {locationLabel} • 5km Radius</Text>
              </View>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <TouchableOpacity
                onPress={() => setRegisterModalVisible(true)}
                style={styles.headerAddShopBtn}
                activeOpacity={0.8}
              >
                <Ionicons name="add" size={15} color="#007A3D" />
                <Text style={styles.headerAddShopBtnText}>Add Shop</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <Ionicons name="close" size={22} color="#6B7280" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Filter Chips */}
          <View style={styles.filterRow}>
            {['All', 'Supermarkets', 'Local Shops'].map((t) => (
              <TouchableOpacity
                key={t}
                style={[styles.filterChip, filterType === t && styles.filterChipActive]}
                onPress={() => setFilterType(t)}
                activeOpacity={0.7}
              >
                <Text
                  style={[styles.filterChipText, filterType === t && styles.filterChipTextActive]}
                >
                  {t}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Store List */}
          {loading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="small" color={Colors.primary} />
              <Text style={styles.loadingText}>Locating nearest stores...</Text>
            </View>
          ) : filteredStores.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="storefront-outline" size={48} color="#9CA3AF" />
              <Text style={styles.emptyTitle}>No Nearby Stores Found</Text>
              <Text style={styles.emptySubtitle}>
                We couldn't detect stores within this immediate area. Check your location or tap Retry below to search again.
              </Text>
              <TouchableOpacity
                style={styles.retryBtn}
                onPress={() => loadStores()}
                activeOpacity={0.8}
              >
                <Ionicons name="refresh" size={16} color="#007A3D" style={{ marginRight: 6 }} />
                <Text style={styles.retryBtnText}>Retry / Search Nearby</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.emptyAddShopBtn}
                onPress={() => setRegisterModalVisible(true)}
                activeOpacity={0.85}
              >
                <Ionicons name="add-circle" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.emptyAddShopBtnText}>+ Register Your Grocery Shop</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <ScrollView style={styles.storeList} showsVerticalScrollIndicator={false}>
              <View style={styles.infoBanner}>
                <Ionicons name="information-circle" size={16} color="#007A3D" />
                <Text style={styles.infoBannerText}>
                  Stores with <Text style={{ fontWeight: '700' }}>Verified Merchant</Text> badges feature in-app digital catalogues & prices.
                </Text>
              </View>

              {filteredStores.map((store) => {
                const isManualStore = store.isCustom === true || store.isManuallyAdded === true || store.isManualStore === true || String(store.id).startsWith('store_custom_');

                return (
                  <View key={store.id} style={styles.storeCard}>
                    <View style={styles.cardHeader}>
                      <View style={[styles.storeIconWrap, { backgroundColor: isManualStore ? '#DCFCE7' : (store.color || '#007A3D') + '15' }]}>
                        {store.isLocalShop ? (
                          <MaterialCommunityIcons name="storefront" size={22} color={isManualStore ? '#166534' : store.color} />
                        ) : (
                          <FontAwesome5 name="shopping-cart" size={18} color={isManualStore ? '#166534' : store.color} />
                        )}
                      </View>
                      <View style={{ flex: 1 }}>
                        <View style={styles.titleRow}>
                          <Text style={styles.storeName} numberOfLines={1}>{store.name}</Text>
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
                          {isManualStore ? (
                            <View style={styles.verifiedBadge}>
                              <Ionicons name="checkmark-circle" size={12} color="#166534" />
                              <Text style={styles.verifiedText}>Verified Merchant</Text>
                            </View>
                          ) : (
                            <View style={styles.googleBadge}>
                              <Ionicons name="logo-google" size={10} color="#4B5563" />
                              <Text style={styles.googleBadgeText}>Map Listed</Text>
                            </View>
                          )}
                          <Text style={styles.categoryPillText}>• {store.category || (store.isLocalShop ? 'Local Grocery' : 'Supermarket')}</Text>
                        </View>
                        <Text style={styles.storeAddress} numberOfLines={1}>{store.address}</Text>
                      </View>
                      <View style={styles.distanceBadge}>
                        <Text style={styles.distanceText}>{store.distanceKm ? `${store.distanceKm} km` : 'Nearby'}</Text>
                      </View>
                    </View>

                    <View style={styles.metaRow}>
                      <View style={styles.metaItem}>
                        <Ionicons name="time-outline" size={13} color="#6B7280" />
                        <Text style={styles.metaLabel}>{store.openingHours || 'Open daily'}</Text>
                      </View>
                      <View style={styles.metaItem}>
                        <Ionicons name="star" size={13} color="#F59E0B" />
                        <Text style={styles.metaLabel}>
                          {store.googleRating || store.rating || '4.5'}
                        </Text>
                      </View>
                      {store.deliveryAvailable && (
                        <View style={styles.deliveryTag}>
                          <Text style={styles.deliveryText}>🛵 Delivery</Text>
                        </View>
                      )}
                    </View>

                    <View style={styles.cardActions}>
                      {store.phone ? (
                        <TouchableOpacity
                          style={styles.callBtn}
                          onPress={() => handleCall(store.phone)}
                          activeOpacity={0.7}
                        >
                          <Ionicons name="call-outline" size={15} color="#374151" />
                          <Text style={styles.callBtnText}>Call</Text>
                        </TouchableOpacity>
                      ) : (
                        <View />
                      )}

                      {/* Only show Catalogue button if store was added manually. Otherwise show Directions button */}
                      {isManualStore ? (
                        <TouchableOpacity
                          style={styles.selectBtn}
                          onPress={() => {
                            onSelectStore && onSelectStore(store);
                            onClose();
                          }}
                          activeOpacity={0.8}
                        >
                          <Ionicons name="cart-outline" size={15} color="#FFFFFF" style={{ marginRight: 4 }} />
                          <Text style={styles.selectBtnText}>View Catalogue →</Text>
                        </TouchableOpacity>
                      ) : (
                        <TouchableOpacity
                          style={styles.directionsBtn}
                          onPress={() => {
                            const url = store.googleDirectionsUrl || store.googleMapsUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(store.name + ' ' + (store.address || ''))}`;
                            Linking.openURL(url).catch(() => {});
                          }}
                          activeOpacity={0.8}
                        >
                          <Ionicons name="navigate-outline" size={15} color="#007A3D" style={{ marginRight: 4 }} />
                          <Text style={styles.directionsBtnText}>Directions 📍</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                );
              })}
              <View style={{ height: 20 }} />
            </ScrollView>
          )}
        </View>
      </View>

      <ShopOwnerModal
        visible={registerModalVisible}
        onClose={() => setRegisterModalVisible(false)}
        onShopRegistered={() => loadStores()}
      />
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '80%',
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
    fontWeight: '700',
    color: '#111827',
  },
  headerSub: {
    fontSize: 12,
    color: '#6B7280',
  },
  closeBtn: {
    padding: 6,
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 10,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
  },
  filterChipActive: {
    backgroundColor: Colors.primary,
  },
  filterChipText: {
    fontSize: 12.5,
    color: '#4B5563',
    fontWeight: '500',
  },
  filterChipTextActive: {
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
  },
  storeCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  storeIconWrap: {
    width: 44,
    height: 44,
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
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 2,
  },
  verifiedText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#166534',
  },
  pendingBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  pendingText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#92400E',
  },
  storeAddress: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  distanceBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  distanceText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1D4ED8',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    gap: 14,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaLabel: {
    fontSize: 12,
    color: '#4B5563',
  },
  deliveryTag: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  deliveryText: {
    fontSize: 11,
    color: '#92400E',
    fontWeight: '600',
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  callBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  callBtnText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#374151',
  },
  selectBtn: {
    backgroundColor: '#007A3D',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  selectBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  directionsBtn: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  directionsBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#166534',
  },
  googleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 3,
  },
  googleBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#4B5563',
  },
  categoryPillText: {
    fontSize: 11,
    color: '#6B7280',
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#DCFCE7',
    padding: 10,
    borderRadius: 12,
    marginBottom: 12,
    gap: 8,
  },
  infoBannerText: {
    fontSize: 11.5,
    color: '#166534',
    flex: 1,
    lineHeight: 16,
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#374151',
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
    marginBottom: 16,
  },
  headerAddShopBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 2,
  },
  headerAddShopBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#007A3D',
  },
  emptyAddShopBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007A3D',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginTop: 6,
    width: '100%',
  },
  emptyAddShopBtnText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DCFCE7',
    paddingVertical: 11,
    paddingHorizontal: 18,
    borderRadius: 12,
    marginBottom: 8,
    width: '100%',
  },
  retryBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#007A3D',
  },
});

export default NearbyShopsModal;
