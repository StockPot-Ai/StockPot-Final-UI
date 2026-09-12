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
import { storeService } from '../../services';

const NearbyShopsModal = ({ visible, onClose, onSelectStore }) => {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('All'); // 'All', 'Supermarkets', 'Local Shops'

  useEffect(() => {
    if (visible) {
      loadStores();
    }
  }, [visible]);

  const loadStores = async () => {
    setLoading(true);
    try {
      const list = await storeService.getNearbyStores(6.9147, 79.8778);
      setStores(list);
    } catch (_) {}
    setLoading(false);
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
                <Text style={styles.headerTitle}>Nearby Grocery Shops</Text>
                <Text style={styles.headerSub}>Colombo 02 – 07 GPS Radius</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color="#6B7280" />
            </TouchableOpacity>
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
          ) : (
            <ScrollView style={styles.storeList} showsVerticalScrollIndicator={false}>
              {filteredStores.map((store) => (
                <View key={store.id} style={styles.storeCard}>
                  <View style={styles.cardHeader}>
                    <View style={[styles.storeIconWrap, { backgroundColor: store.color + '15' }]}>
                      {store.isLocalShop ? (
                        <MaterialCommunityIcons name="storefront" size={22} color={store.color} />
                      ) : (
                        <FontAwesome5 name="shopping-cart" size={18} color={store.color} />
                      )}
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={styles.titleRow}>
                        <Text style={styles.storeName}>{store.name}</Text>
                        {store.isVerified && (
                          <View style={styles.verifiedBadge}>
                            <Ionicons name="checkmark-circle" size={13} color="#166534" />
                            <Text style={styles.verifiedText}>Verified</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.storeAddress}>{store.address}</Text>
                    </View>
                    <View style={styles.distanceBadge}>
                      <Text style={styles.distanceText}>{store.distanceKm} km</Text>
                    </View>
                  </View>

                  <View style={styles.metaRow}>
                    <View style={styles.metaItem}>
                      <Ionicons name="time-outline" size={13} color="#6B7280" />
                      <Text style={styles.metaLabel}>{store.openingHours}</Text>
                    </View>
                    <View style={styles.metaItem}>
                      <Ionicons name="star" size={13} color="#F59E0B" />
                      <Text style={styles.metaLabel}>{store.rating} Rating</Text>
                    </View>
                    {store.deliveryAvailable && (
                      <View style={styles.deliveryTag}>
                        <Text style={styles.deliveryText}>🛵 Delivery</Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.cardActions}>
                    <TouchableOpacity
                      style={styles.callBtn}
                      onPress={() => handleCall(store.phone)}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="call-outline" size={15} color="#374151" />
                      <Text style={styles.callBtnText}>Call Store</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.selectBtn}
                      onPress={() => {
                        onSelectStore && onSelectStore(store);
                        onClose();
                      }}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.selectBtnText}>View Products →</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
              <View style={{ height: 20 }} />
            </ScrollView>
          )}
        </View>
      </View>
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
    backgroundColor: Colors.primary,
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  selectBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

export default NearbyShopsModal;
