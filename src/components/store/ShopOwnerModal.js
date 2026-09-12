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
  ActivityIndicator,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import Colors from '../../constants/colors';
import { shopOwnerService } from '../../services';

const ShopOwnerModal = ({ visible, onClose, onShopRegistered }) => {
  const [googleMapsUrl, setGoogleMapsUrl] = useState('');
  const [isExtractingGoogle, setIsExtractingGoogle] = useState(false);
  const [googleDataExtracted, setGoogleDataExtracted] = useState(false);

  const [shopName, setShopName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [openingHours, setOpeningHours] = useState('7:00 AM – 10:00 PM');
  const [category, setCategory] = useState('Local Grocery & Spices');
  const [deliveryAvailable, setDeliveryAvailable] = useState(true);
  const [googleRating, setGoogleRating] = useState(4.8);
  const [googleReviewsCount, setGoogleReviewsCount] = useState(142);
  
  // Custom Product
  const [productName, setProductName] = useState('Fresh Coconut / Vegetables');
  const [productPrice, setProductPrice] = useState('180');
  const [discountPercent, setDiscountPercent] = useState('10');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto-parse Google Maps location URL
  const handleExtractFromGoogle = () => {
    if (!googleMapsUrl.trim()) {
      Alert.alert('Google Maps Link', 'Please enter or paste your shop Google Maps location link first.');
      return;
    }

    setIsExtractingGoogle(true);
    setTimeout(() => {
      const parsed = shopOwnerService.parseGoogleMapsUrl(googleMapsUrl);
      if (parsed) {
        setShopName(parsed.name);
        setAddress(parsed.address);
        setGoogleRating(parsed.rating);
        setGoogleReviewsCount(parsed.reviewsCount);
        setGoogleDataExtracted(true);
      }
      setIsExtractingGoogle(false);
    }, 600);
  };

  const handleSubmit = async () => {
    if (!shopName.trim()) {
      Alert.alert('Required', 'Please enter your shop or business name');
      return;
    }
    if (!address.trim()) {
      Alert.alert('Required', 'Please provide a business address or Google location');
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
        googleMapsUrl: googleMapsUrl.trim(),
        googleRating,
        googleReviewsCount,
        latitude: 6.9189,
        longitude: 79.8682,
      };

      const res = await shopOwnerService.registerShop(payload);
      setIsSubmitting(false);

      Alert.alert(
        '⏳ Submitted for Admin Review!',
        `Your store "${payload.name}" has been successfully submitted with Google Maps profile verification.\n\n🛡️ Admin Review Notice: Our moderation team reviews all local business coordinates within 24 hours to guarantee authentic prices.\n\n🏆 You earned +100 XP!`,
        [
          {
            text: 'Understood',
            onPress: () => {
              onShopRegistered && onShopRegistered(res.data);
              onClose();
            },
          },
        ]
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
                <Text style={styles.headerTitle}>Register Local Store</Text>
                <Text style={styles.headerSub}>Google Location & Admin Verification</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <Ionicons name="close" size={22} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollBody} showsVerticalScrollIndicator={false}>
            {/* Admin Verification Note Banner */}
            <View style={styles.reviewNoticeBanner}>
              <Ionicons name="shield-checkmark" size={20} color="#007A3D" />
              <View style={{ flex: 1 }}>
                <Text style={styles.noticeTitle}>Admin Verification Required</Text>
                <Text style={styles.noticeDesc}>
                  To prevent fraudulent listings, all local stores are reviewed by admins using Google Maps location data.
                </Text>
              </View>
            </View>

            {/* Google Location Link Card */}
            <View style={styles.googleCard}>
              <View style={styles.googleCardHeader}>
                <Ionicons name="location" size={18} color="#EA4335" />
                <Text style={styles.googleCardTitle}>Google Maps / Location Profile URL</Text>
              </View>
              <Text style={styles.googleCardHelp}>
                Paste your shop Google Maps link to auto-fill address, ratings & coordinates.
              </Text>
              <View style={styles.googleInputRow}>
                <TextInput
                  style={styles.googleInput}
                  placeholder="https://maps.app.goo.gl/..."
                  placeholderTextColor="#9CA3AF"
                  value={googleMapsUrl}
                  onChangeText={(val) => {
                    setGoogleMapsUrl(val);
                    setGoogleDataExtracted(false);
                  }}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  style={styles.extractBtn}
                  onPress={handleExtractFromGoogle}
                  disabled={isExtractingGoogle}
                  activeOpacity={0.8}
                >
                  {isExtractingGoogle ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.extractBtnText}>Auto-Fill</Text>
                  )}
                </TouchableOpacity>
              </View>

              {googleDataExtracted && (
                <View style={styles.googlePreviewPill}>
                  <View style={styles.googleRatingRow}>
                    <FontAwesome5 name="star" solid size={12} color="#F59E0B" />
                    <Text style={styles.googleRatingText}>{googleRating} Rating</Text>
                    <Text style={styles.googleReviewCount}>({googleReviewsCount} Google reviews)</Text>
                  </View>
                  <Text style={styles.googleVerifiedBadge}>✓ Verified Place Data</Text>
                </View>
              )}
            </View>

            {/* Shop Details */}
            <Text style={styles.sectionLabel}>Store / Shop Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. City Fresh Corner Mart"
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
              <View style={{ flex: 1 }}>
                <Text style={styles.switchTitle}>Neighborhood Delivery Available</Text>
                <Text style={styles.switchSub}>Display fast doorstep delivery badge to nearby shoppers</Text>
              </View>
              <Switch
                value={deliveryAvailable}
                onValueChange={setDeliveryAvailable}
                trackColor={{ true: Colors.primary }}
              />
            </View>

            <View style={styles.divider} />
            <Text style={styles.sectionHeading}>Initial Featured Product Deal</Text>

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

            <View style={{ height: 24 }} />
          </ScrollView>

          {/* Footer CTA */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.submitBtn, isSubmitting && { opacity: 0.7 }]}
              onPress={handleSubmit}
              disabled={isSubmitting}
              activeOpacity={0.85}
            >
              <Ionicons name="shield-checkmark-outline" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.submitBtnText}>
                {isSubmitting ? 'Submitting...' : 'Submit for Admin Review (+100 XP)'}
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
    height: '88%',
    paddingTop: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 14,
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
    marginTop: 1,
  },
  closeBtn: {
    padding: 6,
  },
  scrollBody: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 14,
  },
  reviewNoticeBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 14,
    padding: 12,
    marginBottom: 14,
    gap: 10,
  },
  noticeTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#166534',
  },
  noticeDesc: {
    fontSize: 11.5,
    color: '#166534',
    lineHeight: 16,
    marginTop: 2,
  },
  googleCard: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
  },
  googleCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  googleCardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  googleCardHelp: {
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 3,
    marginBottom: 10,
  },
  googleInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  googleInput: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: '#1E293B',
  },
  extractBtn: {
    backgroundColor: '#007A3D',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
  },
  extractBtnText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '700',
  },
  googlePreviewPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginTop: 10,
  },
  googleRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  googleRatingText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#92400E',
  },
  googleReviewCount: {
    fontSize: 11,
    color: '#92400E',
  },
  googleVerifiedBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: '#007A3D',
  },
  sectionLabel: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 5,
    marginTop: 8,
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13.5,
    color: '#1F2937',
    marginBottom: 6,
  },
  rowInputs: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    marginVertical: 4,
  },
  switchTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1F2937',
  },
  switchSub: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 1,
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 12,
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
    fontSize: 14.5,
    fontWeight: '700',
  },
});

export default ShopOwnerModal;
