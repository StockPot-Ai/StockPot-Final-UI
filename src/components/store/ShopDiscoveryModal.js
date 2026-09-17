import React, { useState, useEffect, useMemo } from 'react';
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
  Platform,
  Alert,
} from 'react-native';
import { Ionicons, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import Colors from '../../constants/colors';
import { storeService } from '../../services';
import locationService from '../../services/locationService';
import { useAccount } from '../../context/AccountContext';
import AsyncStorage from '../../utils/safeStorage';

const CATEGORIES = [
  'All',
  'Supermarkets',
  'Grocery',
  'Bakery',
  'Butcher',
  'Fruits & Vegetables',
];

// Error-resilient brand & category badge component
const StoreBadge = ({ store, size = 44 }) => {
  const [imgFailed, setImgFailed] = useState(false);
  const color = store?.color || '#007A3D';

  if (store?.logo && !imgFailed) {
    return (
      <View
        style={[
          styles.storeLogoBox,
          {
            width: size,
            height: size,
            borderRadius: Math.round(size * 0.28),
            borderColor: (color || '#007A3D') + '35',
          },
        ]}
      >
        <Image
          source={{ uri: store.logo }}
          style={{ width: size - 10, height: size - 10 }}
          resizeMode="contain"
          onError={() => setImgFailed(true)}
        />
      </View>
    );
  }

  const cat = store?.category || 'Grocery';
  return (
    <View
      style={[
        styles.storeIconWrap,
        {
          width: size,
          height: size,
          backgroundColor: color + '15',
          borderWidth: 1.5,
          borderColor: color + '30',
        },
      ]}
    >
      <MaterialCommunityIcons
        name={
          cat === 'Bakery'
            ? 'baguette'
            : cat === 'Meat & Fish'
            ? 'fish'
            : cat === 'Fruits & Vegetables'
            ? 'fruit-watermelon'
            : !store?.isLocalShop
            ? 'cart'
            : 'storefront'
        }
        size={Math.round(size * 0.52)}
        color={color}
      />
    </View>
  );
};

// Map store pin with logo and fallback indicator
const MapStorePin = ({ store, isSelected, onPress, x, y }) => {
  const [logoFailed, setLogoFailed] = useState(false);
  const color = store?.color || '#007A3D';

  return (
    <TouchableOpacity
      style={[
        styles.storeMapPin,
        {
          transform: [{ translateX: x }, { translateY: y }],
          borderColor: isSelected ? color : '#E5E7EB',
          backgroundColor: isSelected ? '#F0FDF4' : '#FFFFFF',
        },
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {store.logo && !logoFailed ? (
        <View style={styles.pinLogoWrap}>
          <Image
            source={{ uri: store.logo }}
            style={styles.pinMiniLogo}
            resizeMode="contain"
            onError={() => setLogoFailed(true)}
          />
        </View>
      ) : (
        <View style={[styles.pinDotIndicator, { backgroundColor: color }]} />
      )}
      <Text style={[styles.pinStoreName, isSelected && { fontWeight: '800', color: color }]} numberOfLines={1}>
        {store.name.split('-')[0].trim()}
      </Text>
      <View style={styles.pinDistBadge}>
        <Text style={styles.pinDistText}>{store.distanceKm} km</Text>
      </View>
    </TouchableOpacity>
  );
};

const ShopDiscoveryModal = ({ visible, onClose, onSelectStore }) => {
  const { t } = useAccount();
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'map'
  const [favouriteIds, setFavouriteIds] = useState([]);
  const [selectedStorePreview, setSelectedStorePreview] = useState(null);
  const [userLocation, setUserLocation] = useState(null);

  useEffect(() => {
    if (visible) {
      // Show cached stores instantly at 0ms latency
      AsyncStorage.getItem('@stockpot_cached_nearby_stores')
        .then((raw) => {
          if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed) && parsed.length > 0) {
              setStores(parsed);
              setSelectedStorePreview(parsed[0]);
              setLoading(false);
            }
          }
        })
        .catch(() => {});
      loadStores();
      loadFavourites();
    }
  }, [visible]);

  const loadStores = async () => {
    setLoading(true);
    try {
      const coords = await locationService.getCoordinates();
      setUserLocation(coords);

      const list = await storeService.getNearbyStores(coords?.latitude, coords?.longitude, {
        category: 'All',
        city: coords?.city || '',
      });

      setStores(list);
      if (list.length > 0) {
        setSelectedStorePreview(list[0]);
      }
    } catch (_) {
      const coords = locationService.getCachedLocation();
      setUserLocation(coords);
      const list = await storeService.getNearbyStores(coords?.latitude, coords?.longitude, {
        category: 'All',
        city: coords?.city || '',
      });
      setStores(list);
      if (list.length > 0) {
        setSelectedStorePreview(list[0]);
      }
    }
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
      Linking.openURL(`tel:${phone.replace(/[^0-9+]/g, '')}`).catch(() => {
        Alert.alert('Unable to Call', `Dial number directly: ${phone}`);
      });
    }
  };

  // Turn-by-turn navigation in Google Maps
  const handleOpenGoogleMapsDirections = (store) => {
    if (!store) return;
    const dest = `${store.latitude},${store.longitude}`;
    const url = Platform.select({
      ios: `comgooglemaps://?daddr=${dest}&directionsmode=driving`,
      android: `google.navigation:q=${dest}`,
      default: `https://www.google.com/maps/dir/?api=1&destination=${dest}`,
    });

    Linking.canOpenURL(url)
      .then((supported) => {
        if (supported) {
          Linking.openURL(url);
        } else {
          Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${dest}`);
        }
      })
      .catch(() => {
        Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${dest}`);
      });
  };

  // Open native Google Maps app search centered at current town
  const handleOpenGoogleMapsSearch = () => {
    const lat = userLocation?.latitude;
    const lng = userLocation?.longitude;
    const city = userLocation?.city;
    const query = encodeURIComponent(city ? `supermarkets and grocery stores in ${city}` : 'supermarkets and grocery stores nearby');
    const url = lat && lng
      ? `https://www.google.com/maps/search/?api=1&query=${query}&center=${lat},${lng}`
      : `https://www.google.com/maps/search/?api=1&query=${query}`;
    Linking.openURL(url).catch(() => {});
  };

  const filteredStores = useMemo(() => {
    let result = [...stores];

    if (activeCategory !== 'All') {
      result = result.filter((s) =>
        s.category?.toLowerCase().includes(activeCategory.toLowerCase())
      );
    }

    if (searchQuery.trim().length > 0) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (s) =>
          s.name?.toLowerCase().includes(q) ||
          s.address?.toLowerCase().includes(q) ||
          s.category?.toLowerCase().includes(q)
      );
    }

    return result;
  }, [stores, activeCategory, searchQuery]);

  const cityName = userLocation?.city || (!userLocation?.isUnavailable && userLocation?.formatted ? userLocation.formatted : 'Current Area');

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
                <Text style={styles.headerTitle}>
                  {t ? t('nearby_shops', 'Nearby Grocery Stores') : 'Nearby Grocery Stores'}
                </Text>
                <View style={styles.gpsSubtitleRow}>
                  <View style={styles.pulsingDot} />
                  <Text style={styles.headerSub}>
                    {cityName}, LK • 5km Radius
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.headerRightActions}>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
                <Ionicons name="close" size={22} color="#4B5563" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Quick Action: Open in Google Maps */}
          <TouchableOpacity
            style={styles.googleMapsMasterBanner}
            onPress={handleOpenGoogleMapsSearch}
            activeOpacity={0.85}
          >
            <View style={styles.gmBannerIconWrap}>
              <Ionicons name="map" size={18} color="#007A3D" />
            </View>
            <View style={styles.gmBannerContent}>
              <Text style={styles.gmBannerTitle} numberOfLines={1}>
                Search {cityName} on Maps
              </Text>
              <Text style={styles.gmBannerSub} numberOfLines={1}>
                Open Google Maps navigation app
              </Text>
            </View>
            <View style={styles.gmBannerPill}>
              <Text style={styles.gmBannerPillText}>Open Maps 🗺️</Text>
            </View>
          </TouchableOpacity>

          {/* Search & View Switcher Row */}
          <View style={styles.searchRow}>
            <View style={styles.searchBar}>
              <Ionicons name="search" size={17} color="#9CA3AF" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search Cargills, Sathosa, butcher, grocers..."
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

          {/* Category Filter Chips */}
          <View style={styles.categoryScrollWrap}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoryRow}
            >
              {CATEGORIES.map((cat) => {
                const isActive = activeCategory === cat;
                return (
                  <TouchableOpacity
                    key={cat}
                    style={[styles.categoryChip, isActive && styles.categoryChipActive]}
                    onPress={() => setActiveCategory(cat)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.categoryText, isActive && styles.categoryTextActive]}>
                      {cat}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Content Body */}
          {loading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="small" color="#007A3D" />
              <Text style={styles.loadingText}>Locating stores in {cityName}...</Text>
            </View>
          ) : viewMode === 'map' ? (
            /* ── Interactive Map / Visual Grid ────────────────────────── */
            <View style={styles.mapContainer}>
              <View style={styles.mapCanvas}>
                {/* Visual Distance Rings */}
                <View style={[styles.ring, styles.ring5k]} />
                <View style={[styles.ring, styles.ring3k]} />
                <View style={[styles.ring, styles.ring1k]} />

                {/* Center User Pin */}
                <View style={styles.centerUserPin}>
                  <View style={styles.centerPulse} />
                  <View style={styles.centerDot} />
                  <View style={styles.centerLabelWrap}>
                    <Text style={styles.centerLabelText}>You ({cityName})</Text>
                  </View>
                </View>

                {/* Relative Store Pins */}
                {filteredStores.slice(0, 7).map((store, idx) => {
                  const angles = [35, 120, 215, 300, 75, 165, 250];
                  const angle = angles[idx % angles.length] * (Math.PI / 180);
                  const distFraction = Math.min(1, Math.max(0.28, (store.distanceKm || 1) / 2.5));
                  const radius = 100 * distFraction;
                  const x = Math.cos(angle) * radius;
                  const y = Math.sin(angle) * radius;
                  const isSelected = selectedStorePreview?.id === store.id;

                  return (
                    <MapStorePin
                      key={`${store.id}_${idx}`}
                      store={store}
                      isSelected={isSelected}
                      onPress={() => setSelectedStorePreview(store)}
                      x={x}
                      y={y}
                    />
                  );
                })}
              </View>

              {/* Sticky Selected Store Preview at Bottom of Map */}
              {selectedStorePreview && (
                <View style={styles.mapPreviewCard}>
                  <View style={styles.mapPreviewTop}>
                    <StoreBadge store={selectedStorePreview} size={38} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.mapPreviewTitle} numberOfLines={1}>
                        {selectedStorePreview.name}
                      </Text>
                      <Text style={styles.mapPreviewSub}>
                        {selectedStorePreview.address} • ⭐ {selectedStorePreview.rating}
                      </Text>
                    </View>
                    <View style={styles.distPill}>
                      <Text style={styles.distPillText}>{selectedStorePreview.distanceKm} km</Text>
                    </View>
                  </View>

                  <View style={styles.mapPreviewActions}>
                    <TouchableOpacity
                      style={styles.previewDirBtn}
                      onPress={() => handleOpenGoogleMapsDirections(selectedStorePreview)}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="navigate" size={13} color="#FFFFFF" />
                      <Text style={styles.previewDirBtnText}>Directions in Google Maps 🧭</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.previewCallBtn}
                      onPress={() => handleCall(selectedStorePreview.phone)}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="call-outline" size={14} color="#374151" />
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          ) : (
            /* ── High-Density Production List View ─────────────────────── */
            <ScrollView
              style={styles.storeList}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 24 }}
            >
              {filteredStores.length === 0 ? (
                <View style={styles.emptyBox}>
                  <Ionicons name="search-outline" size={36} color="#9CA3AF" />
                  <Text style={styles.emptyTitle}>No stores found in this category</Text>
                  <Text style={styles.emptySub}>Try searching for "Cargills", "grocery", or "Sathosa"</Text>
                </View>
              ) : (
                filteredStores.map((store, idx) => {
                  const isFav = favouriteIds.includes(store.id);
                  const hasCatalogue = Boolean(
                    store.hasCatalogue === true ||
                    store.isManualStore === true ||
                    store.isCustom === true ||
                    String(store.id).startsWith('store_custom_') ||
                    /cargills|keells|food\s*city/i.test(store.name || '') ||
                    (store.id && (String(store.id).includes('cargills') || String(store.id).includes('keells')))
                  );
                  const isVerified = Boolean(
                    store.isVerified === true ||
                    store.isManualStore === true ||
                    store.isCustom === true ||
                    /cargills|keells|food\s*city/i.test(store.name || '')
                  );
                  return (
                    <View key={`${store.id}_${idx}`} style={styles.storeCard}>
                      <View style={styles.cardHeader}>
                        <StoreBadge store={store} size={44} />

                        <View style={{ flex: 1 }}>
                          <View style={styles.storeTitleRow}>
                            <Text style={styles.storeName} numberOfLines={1}>
                              {store.name}
                            </Text>
                            {isVerified ? (
                              <View style={styles.verifiedTag}>
                                <Ionicons name="checkmark-circle" size={12} color="#166534" />
                                <Text style={styles.verifiedTagText}>Verified Partner</Text>
                              </View>
                            ) : (
                              <View style={styles.mapListedTag}>
                                <Ionicons name="map-outline" size={10} color="#4B5563" />
                                <Text style={styles.mapListedTagText}>Map Listed</Text>
                              </View>
                            )}
                          </View>
                          <Text style={styles.storeAddress} numberOfLines={1}>
                            {store.address}
                          </Text>
                        </View>

                        <TouchableOpacity
                          style={styles.favBtn}
                          onPress={() => handleToggleFav(store.id)}
                          activeOpacity={0.7}
                        >
                          <Ionicons
                            name={isFav ? 'heart' : 'heart-outline'}
                            size={19}
                            color={isFav ? '#DC2626' : '#9CA3AF'}
                          />
                        </TouchableOpacity>
                      </View>

                      {/* Store Meta Row */}
                      <View style={styles.metaRow}>
                        <View style={styles.distanceBadge}>
                          <Ionicons name="navigate" size={11} color="#007A3D" />
                          <Text style={styles.distanceBadgeText}>{store.distanceKm} km away</Text>
                        </View>
                        <View style={styles.metaItem}>
                          <Ionicons name="time-outline" size={12} color="#6B7280" />
                          <Text style={styles.metaLabel}>{store.openingHours || 'Open daily'}</Text>
                        </View>
                        <View style={styles.metaItem}>
                          <Ionicons name="star" size={12} color="#F59E0B" />
                          <Text style={styles.metaLabel}>{store.rating || '4.6'}</Text>
                        </View>
                        {store.deliveryAvailable && (
                          <View style={styles.deliveryBadge}>
                            <Text style={styles.deliveryBadgeText}>🛵 Delivery</Text>
                          </View>
                        )}
                      </View>

                      {/* Store Card Actions */}
                      <View style={styles.cardActions}>
                        <TouchableOpacity
                          style={[styles.actionBtnMapsFull, store.phone ? { flex: 1 } : { width: '100%' }]}
                          onPress={() => handleOpenGoogleMapsDirections(store)}
                          activeOpacity={0.8}
                        >
                          <Ionicons name="navigate" size={14} color="#FFFFFF" />
                          <Text style={styles.actionBtnMapsFullText}>Directions in Google Maps 🧭</Text>
                        </TouchableOpacity>

                        {store.phone ? (
                          <TouchableOpacity
                            style={styles.actionBtnCall}
                            onPress={() => handleCall(store.phone)}
                            activeOpacity={0.7}
                          >
                            <Ionicons name="call-outline" size={14} color="#374151" />
                            <Text style={styles.actionBtnCallText}>Call</Text>
                          </TouchableOpacity>
                        ) : null}
                      </View>
                    </View>
                  );
                })
              )}
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
    backgroundColor: '#FAFAF8',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    height: '92%',
    paddingTop: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E8F8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: -0.2,
  },
  gpsSubtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 2,
  },
  pulsingDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#166534',
  },
  headerSub: {
    fontSize: 12,
    fontWeight: '600',
    color: '#166534',
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleMapsMasterBanner: {
    marginHorizontal: 16,
    marginTop: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    flexDirection: 'row',
    alignItems: 'center',
  },
  gmBannerIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gmBannerContent: {
    flex: 1,
    marginHorizontal: 10,
  },
  gmBannerTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#166534',
  },
  gmBannerSub: {
    fontSize: 11,
    color: '#4B5563',
    marginTop: 1,
  },
  gmBannerPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: '#007A3D',
  },
  gmBannerPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    marginTop: 10,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 13,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 12,
    height: 40,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#111827',
    paddingVertical: 0,
  },
  viewModeToggle: {
    flexDirection: 'row',
    backgroundColor: '#E5E7EB',
    borderRadius: 12,
    padding: 3,
  },
  modeBtn: {
    width: 32,
    height: 32,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeBtnActive: {
    backgroundColor: '#007A3D',
  },
  categoryScrollWrap: {
    marginTop: 10,
    marginBottom: 6,
  },
  categoryRow: {
    paddingHorizontal: 16,
    gap: 7,
  },
  categoryChip: {
    paddingHorizontal: 13,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  categoryChipActive: {
    backgroundColor: '#007A3D',
    borderColor: '#007A3D',
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
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  loadingText: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  storeList: {
    flex: 1,
    paddingHorizontal: 16,
    marginTop: 4,
  },
  storeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 13,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  storeThumbLogo: {
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
  },
  storeLogoBox: {
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.08,
    shadowRadius: 2.5,
    elevation: 2,
  },
  storeIconWrap: {
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  storeTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  storeName: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#111827',
    flexShrink: 1,
  },
  verifiedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 6,
  },
  verifiedTagText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#166534',
  },
  storeAddress: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  favBtn: {
    padding: 6,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 9,
    flexWrap: 'wrap',
  },
  distanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#E8F8F0',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
  },
  distanceBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#007A3D',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  metaLabel: {
    fontSize: 11.5,
    color: '#4B5563',
    fontWeight: '600',
  },
  deliveryBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  deliveryBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#92400E',
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 11,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  actionBtnMapsFull: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007A3D',
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 10,
    gap: 6,
  },
  actionBtnMapsFullText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  actionBtnMapsSecondary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E8F8F0',
    paddingVertical: 9,
    paddingHorizontal: 10,
    borderRadius: 10,
    gap: 5,
  },
  actionBtnMapsSecondaryText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#007A3D',
  },
  actionBtnCall: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 10,
    gap: 4,
  },
  actionBtnCallText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  actionBtnCatalogue: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007A3D',
    paddingVertical: 9,
    paddingHorizontal: 10,
    borderRadius: 10,
    gap: 4,
  },
  actionBtnCatalogueText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  mapListedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 6,
  },
  mapListedTagText: {
    fontSize: 9.5,
    fontWeight: '600',
    color: '#4B5563',
  },
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#374151',
  },
  emptySub: {
    fontSize: 12,
    color: '#9CA3AF',
  },

  // Map Canvas & Pins
  mapContainer: {
    flex: 1,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#C6EED8',
    position: 'relative',
  },
  mapCanvas: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#86EFAC',
    borderStyle: 'dashed',
  },
  ring1k: {
    width: 100,
    height: 100,
  },
  ring3k: {
    width: 200,
    height: 200,
  },
  ring5k: {
    width: 300,
    height: 300,
  },
  centerUserPin: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerPulse: {
    position: 'absolute',
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,122,61,0.2)',
  },
  centerDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#007A3D',
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
  },
  centerLabelWrap: {
    marginTop: 4,
    backgroundColor: '#007A3D',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  centerLabelText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  storeMapPin: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  pinDotIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  pinLogoWrap: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  pinMiniLogo: {
    width: 16,
    height: 16,
  },
  pinStoreName: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#111827',
    maxWidth: 80,
  },
  pinDistBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },
  pinDistText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#4B5563',
  },
  mapPreviewCard: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
  mapPreviewTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  mapPreviewTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#111827',
  },
  mapPreviewSub: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 1,
  },
  distPill: {
    backgroundColor: '#E8F8F0',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  distPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#007A3D',
  },
  mapPreviewActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  previewDirBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007A3D',
    paddingVertical: 7,
    borderRadius: 9,
    gap: 5,
  },
  previewDirBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  previewCallBtn: {
    backgroundColor: '#F3F4F6',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default ShopDiscoveryModal;
