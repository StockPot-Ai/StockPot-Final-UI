import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  Image,
  TouchableOpacity,
  ScrollView,
  TextInput,
  StyleSheet,
  Linking,
  Alert,
} from 'react-native';
import { Ionicons, FontAwesome5, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import Colors from '../../constants/colors';
import { shopOwnerService } from '../../services';

const getStoreCover = (store) => {
  if (store?.coverImage) return { uri: store.coverImage };
  if (store?.logo) return { uri: store.logo };
  return require('../../../assets/creamy_pumpkin_pasta.jpg');
};

const getStoreLogo = (store) => {
  if (store?.logo) return { uri: store.logo };
  return null;
};

export default function ShopProfileModal({
  visible,
  store,
  onClose,
  onAddProductToBasket,
}) {
  const [activeTab, setActiveTab] = useState('catalogue'); // 'catalogue' | 'deals' | 'about'
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [storeProducts, setStoreProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (visible && store) {
      if (Array.isArray(store.products) && store.products.length > 0) {
        setStoreProducts(
          store.products.map((p) => ({
            ...p,
            storePrice: p.price || p.storePrice || 0,
          }))
        );
      } else if (store.id) {
        setLoading(true);
        shopOwnerService
          .getShopProducts(store.id, store.name)
          .then((prods) => {
            if (Array.isArray(prods)) {
              setStoreProducts(
                prods.map((p) => ({
                  ...p,
                  storePrice: p.price || p.storePrice || 0,
                }))
              );
            } else {
              setStoreProducts([]);
            }
          })
          .catch(() => setStoreProducts([]))
          .finally(() => setLoading(false));
      } else {
        setStoreProducts([]);
      }
    }
  }, [visible, store]);

  const categories = ['All', 'Rice', 'Produce', 'Meat', 'Dairy', 'Spices', 'Beverages', 'Pantry'];

  const filteredProducts = storeProducts.filter((p) => {
    const matchSearch = (p.name || '').toLowerCase().includes(search.toLowerCase());
    if (!matchSearch) return false;
    if (selectedCategory === 'All') return true;
    return (p.category || '').toLowerCase().includes(selectedCategory.toLowerCase());
  });

  const handleCall = () => {
    if (store.phone) {
      Linking.openURL(`tel:${store.phone}`).catch(() => {
        Alert.alert('Store Contact', `Phone: ${store.phone}`);
      });
    }
  };

  const handleDirections = () => {
    if (!store) return;
    const query = encodeURIComponent(`${store.name}, ${store.address || 'Colombo'}`);
    Linking.openURL(`https://maps.google.com/?q=${query}`).catch(() => {
      Alert.alert('Directions', `Address: ${store.address}`);
    });
  };

  if (!visible || !store) return null;

  return (
    <Modal visible={Boolean(visible && store)} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          {/* Cover Header */}
          <View style={styles.coverWrap}>
            <Image source={getStoreCover(store)} style={styles.coverImage} />
            <View style={styles.coverGradient} />

            {/* Top action buttons */}
            <View style={styles.topActionsRow}>
              <TouchableOpacity style={styles.iconCircleBtn} onPress={onClose} activeOpacity={0.8}>
                <Ionicons name="close" size={20} color="#111827" />
              </TouchableOpacity>
              <View style={styles.topRightActions}>
                <TouchableOpacity style={styles.iconCircleBtn} onPress={handleDirections} activeOpacity={0.8}>
                  <Ionicons name="navigate-outline" size={18} color="#007A3D" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.iconCircleBtn} onPress={handleCall} activeOpacity={0.8}>
                  <Ionicons name="call-outline" size={18} color="#007A3D" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Store Badge & Basic Info over header */}
            <View style={styles.storeHeaderInfo}>
              <View style={styles.logoAndName}>
                {getStoreLogo(store) ? (
                  <Image source={getStoreLogo(store)} style={styles.storeLogo} />
                ) : (
                  <View style={[styles.storeLogoFallback, { backgroundColor: store.color || Colors.primary }]}>
                    <Ionicons name="storefront" size={24} color="#FFFFFF" />
                  </View>
                )}

                <View style={{ flex: 1 }}>
                  <View style={styles.titleRow}>
                    <Text style={styles.storeName} numberOfLines={1}>{store.name}</Text>
                    {store.isVerified && (
                      <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                    )}
                  </View>
                  <Text style={styles.storeCategory}>
                    {store.category} • {store.distanceKm || '1.2'} km away
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Tab Switcher */}
          <View style={styles.tabsRow}>
            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'catalogue' && styles.tabBtnActive]}
              onPress={() => setActiveTab('catalogue')}
              activeOpacity={0.8}
            >
              <Ionicons
                name="grid-outline"
                size={15}
                color={activeTab === 'catalogue' ? Colors.primary : '#6B7280'}
              />
              <Text style={[styles.tabBtnText, activeTab === 'catalogue' && styles.tabBtnTextActive]}>
                Store Catalogue ({storeProducts.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'about' && styles.tabBtnActive]}
              onPress={() => setActiveTab('about')}
              activeOpacity={0.8}
            >
              <Ionicons
                name="information-circle-outline"
                size={16}
                color={activeTab === 'about' ? Colors.primary : '#6B7280'}
              />
              <Text style={[styles.tabBtnText, activeTab === 'about' && styles.tabBtnTextActive]}>
                Store Details
              </Text>
            </TouchableOpacity>
          </View>

          {/* Tab 1: Catalogue & In-Store Prices */}
          {activeTab === 'catalogue' && (
            <View style={{ flex: 1 }}>
              {/* Search bar */}
              <View style={styles.searchRow}>
                <Ionicons name="search" size={16} color="#9CA3AF" />
                <TextInput
                  style={styles.searchInput}
                  placeholder={`Search ${store.name} products...`}
                  placeholderTextColor="#9CA3AF"
                  value={search}
                  onChangeText={setSearch}
                />
                {search.length > 0 && (
                  <TouchableOpacity onPress={() => setSearch('')}>
                    <Ionicons name="close-circle" size={16} color="#9CA3AF" />
                  </TouchableOpacity>
                )}
              </View>

              {/* Categories */}
              <View style={styles.categoryScrollWrap}>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.categoryScroll}
                >
                  {categories.map((c) => (
                    <TouchableOpacity
                      key={c}
                      style={[styles.catChip, selectedCategory === c && styles.catChipActive]}
                      onPress={() => setSelectedCategory(c)}
                    >
                      <Text style={[styles.catText, selectedCategory === c && styles.catTextActive]}>
                        {c}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Product List */}
              <ScrollView
                style={styles.productList}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.productListContent}
              >
                {loading ? (
                  <View style={{ padding: 32, alignItems: 'center' }}>
                    <Text style={{ fontSize: 13, color: '#6B7280' }}>Loading products...</Text>
                  </View>
                ) : filteredProducts.length === 0 ? (
                  <View style={{ padding: 36, alignItems: 'center', justifyContent: 'center' }}>
                    <Ionicons name="basket-outline" size={44} color="#9CA3AF" />
                    <Text style={{ fontSize: 15, fontWeight: '700', color: '#374151', marginTop: 10 }}>No Products Listed</Text>
                    <Text style={{ fontSize: 12.5, color: '#6B7280', textAlign: 'center', marginTop: 4 }}>
                      This store has not published product prices yet.
                    </Text>
                  </View>
                ) : (
                  filteredProducts.map((prod) => (
                    <View key={prod.id} style={styles.productRow}>
                      {prod.image ? (
                        <Image source={{ uri: prod.image }} style={styles.productImg} resizeMode="contain" />
                      ) : (
                        <View style={styles.productImgFallback}>
                          <Ionicons name="basket" size={18} color="#007A3D" />
                        </View>
                      )}
                      <View style={styles.productInfo}>
                        <Text style={styles.productName} numberOfLines={1}>{prod.name}</Text>
                        <Text style={styles.productUnit}>{prod.unit || '1 unit'} • {prod.category || 'Grocery'}</Text>
                        <View style={styles.priceTagRow}>
                          <Text style={styles.productPrice}>Rs. {prod.storePrice.toLocaleString()}</Text>
                          {prod.mrp && prod.mrp > prod.storePrice ? (
                            <Text style={styles.mrpPrice}>Rs. {prod.mrp.toLocaleString()}</Text>
                          ) : null}
                          {(prod.hasOffer || prod.isDiscounted) && (
                            <View style={styles.discountBadge}>
                              <Text style={styles.discountBadgeText}>OFFER</Text>
                            </View>
                          )}
                        </View>
                      </View>

                      <TouchableOpacity
                        style={styles.addBtn}
                        onPress={() => {
                          if (onAddProductToBasket) {
                            onAddProductToBasket(prod, store);
                          }
                          Alert.alert('Added to Basket', `${prod.name} added at Rs. ${prod.storePrice}`);
                        }}
                        activeOpacity={0.8}
                      >
                        <Ionicons name="add" size={16} color="#FFFFFF" />
                        <Text style={styles.addBtnText}>Add</Text>
                      </TouchableOpacity>
                    </View>
                  ))
                )}
              </ScrollView>
            </View>
          )}

          {/* Tab 2: Store Details & Hours */}
          {activeTab === 'about' && (
            <ScrollView
              style={styles.aboutScroll}
              contentContainerStyle={styles.aboutContent}
              showsVerticalScrollIndicator={false}
            >
              {/* Address card */}
              <View style={styles.detailCard}>
                <Ionicons name="location-outline" size={20} color={Colors.primary} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.detailLabel}>Store Address</Text>
                  <Text style={styles.detailValue}>{store.address || 'Colombo, Sri Lanka'}</Text>
                </View>
                <TouchableOpacity style={styles.actionPill} onPress={handleDirections}>
                  <Text style={styles.actionPillText}>Map</Text>
                </TouchableOpacity>
              </View>

              {/* Opening Hours */}
              <View style={styles.detailCard}>
                <Ionicons name="time-outline" size={20} color="#D97706" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.detailLabel}>Opening Hours</Text>
                  <Text style={styles.detailValue}>{store.openingHours || '7:30 AM – 10:00 PM (Daily)'}</Text>
                </View>
              </View>

              {/* Contact */}
              <View style={styles.detailCard}>
                <Ionicons name="call-outline" size={20} color="#007A3D" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.detailLabel}>Contact Number</Text>
                  <Text style={styles.detailValue}>{store.phone || '+94 11 234 5678'}</Text>
                </View>
                <TouchableOpacity style={styles.actionPill} onPress={handleCall}>
                  <Text style={styles.actionPillText}>Call</Text>
                </TouchableOpacity>
              </View>

              {/* Delivery & Payment */}
              <View style={styles.detailCard}>
                <Ionicons name="bicycle-outline" size={20} color="#0284C7" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.detailLabel}>Delivery & Payments</Text>
                  <Text style={styles.detailValue}>
                    {store.deliveryAvailable ? '🚚 Delivery Available' : 'Pickup Only'} • Cash, Card & QR
                  </Text>
                </View>
              </View>
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '90%',
    overflow: 'hidden',
  },
  coverWrap: {
    height: 160,
    backgroundColor: '#E5E7EB',
    position: 'relative',
    justifyContent: 'space-between',
    padding: 16,
  },
  coverImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  coverGradient: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  topActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 10,
  },
  topRightActions: {
    flexDirection: 'row',
    gap: 8,
  },
  iconCircleBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  storeHeaderInfo: {
    zIndex: 10,
  },
  logoAndName: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  storeLogo: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    backgroundColor: '#FFFFFF',
  },
  storeLogoFallback: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  storeName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  storeCategory: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 2,
  },
  tabsRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    backgroundColor: '#FFFFFF',
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 6,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabBtnActive: {
    borderBottomColor: Colors.primary,
  },
  tabBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  tabBtnTextActive: {
    color: Colors.primary,
    fontWeight: '700',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    paddingHorizontal: 12,
    height: 40,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#111827',
  },
  categoryScrollWrap: {
    height: 38,
    marginBottom: 8,
  },
  categoryScroll: {
    paddingHorizontal: 16,
    gap: 8,
    alignItems: 'center',
  },
  catChip: {
    height: 30,
    paddingHorizontal: 12,
    borderRadius: 15,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  catChipActive: {
    backgroundColor: '#007A3D',
  },
  catText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#4B5563',
  },
  catTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  productList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  productListContent: {
    paddingBottom: 24,
  },
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  productImg: {
    width: 46,
    height: 46,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  productImgFallback: {
    width: 46,
    height: 46,
    borderRadius: 8,
    backgroundColor: '#EAF3EC',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  productInfo: {
    flex: 1,
    paddingRight: 10,
  },
  mrpPrice: {
    fontSize: 11.5,
    color: '#9CA3AF',
    textDecorationLine: 'line-through',
  },
  productName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 2,
  },
  productUnit: {
    fontSize: 11,
    color: '#6B7280',
    marginBottom: 4,
  },
  priceTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  productPrice: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.primary,
  },
  discountBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  discountBadgeText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#B45309',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    gap: 4,
  },
  addBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  aboutScroll: {
    flex: 1,
    padding: 16,
  },
  aboutContent: {
    gap: 12,
    paddingBottom: 24,
  },
  detailCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 12,
  },
  detailLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6B7280',
    textTransform: 'uppercase',
  },
  detailValue: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#111827',
    marginTop: 2,
  },
  actionPill: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  actionPillText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#374151',
  },
});
