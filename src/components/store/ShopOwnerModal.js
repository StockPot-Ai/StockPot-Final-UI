import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Switch,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Colors from '../../constants/colors';
import { shopOwnerService } from '../../services';

const ShopOwnerModal = ({ visible, onClose, onShopRegistered }) => {
  const [shopName, setShopName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [openingHours, setOpeningHours] = useState('7:00 AM – 10:00 PM');
  const [category, setCategory] = useState('Local Grocery & Spices');
  const [deliveryAvailable, setDeliveryAvailable] = useState(true);
  
  // Custom Product
  const [productName, setProductName] = useState('Fresh Coconut / Vegetables');
  const [productPrice, setProductPrice] = useState('180');
  const [discountPercent, setDiscountPercent] = useState('10');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!shopName.trim()) {
      Alert.alert('Required', 'Please enter your shop or business name');
      return;
    }
    if (!address.trim()) {
      Alert.alert('Required', 'Please provide a business address');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        name: shopName.trim(),
        address: address.trim(),
        phone: phone.trim() || '+94 77 123 4567',
        openingHours,
        category,
        deliveryAvailable,
        latitude: 6.9189,
        longitude: 79.8682,
      };

      const res = await shopOwnerService.registerShop(payload);
      setIsSubmitting(false);

      Alert.alert(
        '🎉 Store Registered & Verified!',
        `Your shop "${payload.name}" is now live on StockPot AI with the Verified Shop badge!\n\n🏆 You earned +100 XP for connecting local business inventory!`,
        [{ text: 'Awesome!', onPress: () => {
          onShopRegistered && onShopRegistered(res.data);
          onClose();
        }}]
      );
    } catch (_) {
      setIsSubmitting(false);
      onClose();
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
                <MaterialCommunityIcons name="storefront-outline" size={22} color={Colors.primary} />
              </View>
              <View>
                <Text style={styles.headerTitle}>Shop Owner Portal</Text>
                <Text style={styles.headerSub}>Register local business & live prices</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollBody} showsVerticalScrollIndicator={false}>
            {/* Banner */}
            <View style={styles.infoBanner}>
              <Ionicons name="shield-checkmark" size={18} color="#166534" />
              <Text style={styles.infoBannerText}>
                Verified shops appear in the StockPot Price Comparison Engine with instant nearby delivery visibility.
              </Text>
            </View>

            <Text style={styles.sectionLabel}>Business / Store Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. City Fresh Mart"
              placeholderTextColor="#9CA3AF"
              value={shopName}
              onChangeText={setShopName}
            />

            <Text style={styles.sectionLabel}>Physical Address *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 142 Galle Road, Colombo 03"
              placeholderTextColor="#9CA3AF"
              value={address}
              onChangeText={setAddress}
            />

            <View style={styles.rowInputs}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Text style={styles.sectionLabel}>Contact Phone</Text>
                <TextInput
                  style={styles.input}
                  placeholder="+94 77 123 4567"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="phone-pad"
                  value={phone}
                  onChangeText={setPhone}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.sectionLabel}>Opening Hours</Text>
                <TextInput
                  style={styles.input}
                  placeholder="7:00 AM – 10:00 PM"
                  placeholderTextColor="#9CA3AF"
                  value={openingHours}
                  onChangeText={setOpeningHours}
                />
              </View>
            </View>

            <View style={styles.switchRow}>
              <View>
                <Text style={styles.switchTitle}>Neighborhood Delivery</Text>
                <Text style={styles.switchSub}>Offer direct delivery to nearby customers</Text>
              </View>
              <Switch
                value={deliveryAvailable}
                onValueChange={setDeliveryAvailable}
                trackColor={{ true: Colors.primary }}
              />
            </View>

            <View style={styles.divider} />
            <Text style={styles.sectionHeading}>Sample Featured Product & Discount</Text>

            <Text style={styles.sectionLabel}>Featured Product</Text>
            <TextInput
              style={styles.input}
              value={productName}
              onChangeText={setProductName}
            />

            <View style={styles.rowInputs}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Text style={styles.sectionLabel}>Store Price (Rs.)</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={productPrice}
                  onChangeText={setProductPrice}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.sectionLabel}>Active Discount (%)</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={discountPercent}
                  onChangeText={setDiscountPercent}
                />
              </View>
            </View>

            <View style={{ height: 20 }} />
          </ScrollView>

          {/* Footer CTA */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.submitBtn, isSubmitting && { opacity: 0.7 }]}
              onPress={handleSubmit}
              disabled={isSubmitting}
              activeOpacity={0.85}
            >
              <Ionicons name="checkmark-done-circle" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.submitBtnText}>
                {isSubmitting ? 'Registering...' : 'Register Verified Shop (+100 XP)'}
              </Text>
            </TouchableOpacity>
          </View>
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
    height: '85%',
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
  scrollBody: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 14,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
    gap: 8,
  },
  infoBannerText: {
    flex: 1,
    fontSize: 12,
    color: '#166534',
    lineHeight: 16,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
    marginTop: 8,
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#1F2937',
    marginBottom: 8,
  },
  rowInputs: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    marginVertical: 6,
  },
  switchTitle: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#1F2937',
  },
  switchSub: {
    fontSize: 11.5,
    color: '#6B7280',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 14,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  submitBtn: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});

export default ShopOwnerModal;
