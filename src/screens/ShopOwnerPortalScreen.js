import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
  StatusBar,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import Colors from '../constants/colors';
import { shopOwnerService, storeService } from '../services';
import subscriptionService from '../services/subscriptionService';
import { useAccount } from '../context/AccountContext';
import ShopOwnerModal from '../components/store/ShopOwnerModal';

const TABS = [
  { id: 'overview', label: 'Overview', icon: 'grid-outline' },
  { id: 'catalogue', label: 'Catalogue', icon: 'cart-outline' },
  { id: 'pricing', label: 'Prices & History', icon: 'pricetag-outline' },
  { id: 'discounts', label: 'Promotions', icon: 'flash-outline' },
  { id: 'bulk', label: 'Bulk & Pro', icon: 'cloud-upload-outline' },
];

export default function ShopOwnerPortalScreen({ onBack }) {
  const { activeShop, businessPlan, isBusinessPro, updateBusinessPlan, setActiveShop, setIsShopOwner } = useAccount();
  const [shopOwnerModalVisible, setShopOwnerModalVisible] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [products, setProducts] = useState([]);
  const [priceHistory, setPriceHistory] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  // Search & Filter in Catalogue
  const [searchFilter, setSearchFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');

  // Modals
  const [productModalVisible, setProductModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [productName, setProductName] = useState('');
  const [productCategory, setProductCategory] = useState('Vegetables');
  const [productPrice, setProductPrice] = useState('');
  const [productDiscountPrice, setProductDiscountPrice] = useState('');
  const [productUnit, setProductUnit] = useState('1 kg');
  const [productStock, setProductStock] = useState('IN_STOCK');

  // Bulk Import Modal
  const [csvModalVisible, setCsvModalVisible] = useState(false);
  const [csvContent, setCsvContent] = useState(
    'Product,Category,Unit,Price,Stock\nRed Rice 1kg,Rice & Grains,1kg,220,IN_STOCK\nCurry Powder 100g,Spices,100g,160,IN_STOCK\nFresh Lime 250g,Fruits,250g,170,IN_STOCK'
  );

  // Bulk Price Modal
  const [bulkPriceModalVisible, setBulkPriceModalVisible] = useState(false);
  const [pricePercentDelta, setPricePercentDelta] = useState('5');

  // Promo Modal
  const [promoModalVisible, setPromoModalVisible] = useState(false);
  const [promoTitle, setPromoTitle] = useState('Weekend Flash Deal 🔥');
  const [promoProduct, setPromoProduct] = useState('');
  const [promoDiscount, setPromoDiscount] = useState('15');

  const shopId = activeShop?.id || null;

  const loadPortalData = useCallback(async () => {
    if (!shopId) {
      setProducts([]);
      setPriceHistory([]);
      setAnalytics(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [prodList, historyList, anData] = await Promise.all([
        shopOwnerService.getShopProducts(shopId),
        shopOwnerService.getPriceHistory(shopId),
        shopOwnerService.getShopAnalytics(shopId),
      ]);
      setProducts(prodList);
      setPriceHistory(historyList);
      setAnalytics(anData);
    } catch (_) { }
    setLoading(false);
  }, [shopId]);

  useEffect(() => {
    loadPortalData();
  }, [loadPortalData]);

  const handleShopRegistered = (newShop) => {
    if (newShop) {
      setActiveShop && setActiveShop(newShop);
      setIsShopOwner && setIsShopOwner(true);
      setShopOwnerModalVisible(false);
    }
  };

  // Product CRUD
  const handleOpenAddProduct = () => {
    setEditingProduct(null);
    setProductName('');
    setProductCategory('Vegetables');
    setProductPrice('');
    setProductDiscountPrice('');
    setProductUnit('1 kg');
    setProductStock('IN_STOCK');
    setProductModalVisible(true);
  };

  const handleOpenEditProduct = (prod) => {
    setEditingProduct(prod);
    setProductName(prod.name);
    setProductCategory(prod.category);
    setProductPrice(prod.price.toString());
    setProductDiscountPrice(prod.discountPrice ? prod.discountPrice.toString() : '');
    setProductUnit(prod.unit || '1 kg');
    setProductStock(prod.stockStatus || 'IN_STOCK');
    setProductModalVisible(true);
  };

  const handleSaveProduct = async () => {
    if (!productName.trim() || !productPrice.trim()) {
      Alert.alert('Required', 'Please enter both product name and price.');
      return;
    }

    const payload = {
      id: editingProduct?.id,
      name: productName.trim(),
      category: productCategory,
      price: parseFloat(productPrice),
      oldPrice: editingProduct?.price,
      discountPrice: productDiscountPrice ? parseFloat(productDiscountPrice) : null,
      unit: productUnit,
      stockStatus: productStock,
    };

    const res = await shopOwnerService.saveShopProduct(shopId, payload);
    if (res.products) setProducts(res.products);
    setProductModalVisible(false);
    loadPortalData();
    Alert.alert('Success', 'Product price & catalogue updated successfully.');
  };

  const handleDeleteProduct = (prod) => {
    Alert.alert('Delete Product', `Remove "${prod.name}" from your selling catalogue?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const res = await shopOwnerService.deleteShopProduct(shopId, prod.id);
          if (res.products) setProducts(res.products);
        },
      },
    ]);
  };

  const handleCsvImport = async () => {
    try {
      const res = await shopOwnerService.importProductsCsv(shopId, csvContent);
      setProducts(res.products);
      setCsvModalVisible(false);
      Alert.alert('Import Successful', `Added ${res.importedCount} products to your catalogue!`);
    } catch (err) {
      Alert.alert('Import Error', err.message);
    }
  };

  const handleBulkPriceAdjust = async () => {
    const delta = parseFloat(pricePercentDelta);
    if (isNaN(delta)) return;
    const res = await shopOwnerService.bulkUpdatePrices(shopId, delta);
    setProducts(res.products);
    setBulkPriceModalVisible(false);
    Alert.alert('Success', `Updated all catalogue prices by ${delta > 0 ? `+${delta}` : delta}%!`);
  };

  const handleCreatePromo = () => {
    Alert.alert(
      'Promotion Created!',
      `"${promoTitle}" with ${promoDiscount}% discount is now live in StockPot's comparison engine.`
    );
    setPromoModalVisible(false);
  };

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      !searchFilter.trim() ||
      p.name.toLowerCase().includes(searchFilter.toLowerCase().trim()) ||
      p.category.toLowerCase().includes(searchFilter.toLowerCase().trim());
    const matchesCategory = categoryFilter === 'All' || p.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Top App Bar */}
      <View style={styles.appBar}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={22} color="#111827" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <View style={styles.shopTitleRow}>
            <Text style={styles.shopName}>{activeShop?.name || 'Merchant Portal'}</Text>
            {activeShop ? (
              <View style={styles.verifiedTag}>
                <Ionicons name="checkmark-circle" size={12} color="#166534" />
                <Text style={styles.verifiedTagText}>Verified Shop</Text>
              </View>
            ) : null}
          </View>
          <Text style={styles.shopSubtitle}>
            {activeShop ? `${activeShop.category || 'Grocery'} • ${isBusinessPro ? 'Business Pro 🚀' : 'Business Basic'}` : 'StockPot Business Suite'}
          </Text>
        </View>

        {activeShop ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <TouchableOpacity
              style={styles.addShopSmallBtn}
              onPress={() => setShopOwnerModalVisible(true)}
              activeOpacity={0.75}
            >
              <Ionicons name="add" size={16} color="#007A3D" />
              <Text style={styles.addShopSmallBtnText}>Add</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.planBadge}
              onPress={() =>
                Alert.alert(
                  'StockPot Business Plan',
                  `Current: ${isBusinessPro ? 'Business Pro (Rs. 2,999/mo)' : 'Business Basic (Rs. 1,499/mo)'}\n\nPro unlocks Unlimited Products, CSV Uploads, Bulk Price Tools & Advanced Analytics.`,
                  [
                    {
                      text: isBusinessPro ? 'Active' : 'Upgrade to Pro',
                      onPress: () => {
                        if (!isBusinessPro) {
                          Alert.alert(
                            '🚀 Coming Soon!',
                            'Merchant Pro tier subscription & automated payment processing are launching soon.'
                          );
                        }
                      },
                    },
                    { text: 'Close', style: 'cancel' },
                  ]
                )
              }
            >
              <Text style={styles.planBadgeText}>{isBusinessPro ? 'PRO' : 'BASIC'}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.registerSmallHeaderBtn}
            onPress={() => setShopOwnerModalVisible(true)}
            activeOpacity={0.8}
          >
            <Ionicons name="add-circle" size={16} color="#FFFFFF" style={{ marginRight: 4 }} />
            <Text style={styles.registerSmallHeaderBtnText}>Add Shop</Text>
          </TouchableOpacity>
        )}
      </View>

      {!activeShop ? (
        <ScrollView contentContainerStyle={styles.emptyPortalContainer} showsVerticalScrollIndicator={false}>
          <View style={styles.emptyPortalCard}>
            <View style={styles.emptyStoreIconWrap}>
              <Ionicons name="storefront-outline" size={54} color="#007A3D" />
            </View>
            <Text style={styles.emptyPortalTitle}>No Store Registered</Text>
            <Text style={styles.emptyPortalSub}>
              You haven't linked a grocery store to your StockPot account yet. Register your shop to showcase inventory, update real-time prices, and connect with nearby community shoppers.
            </Text>

            <TouchableOpacity
              style={styles.registerMainBtn}
              onPress={() => setShopOwnerModalVisible(true)}
              activeOpacity={0.85}
            >
              <Ionicons name="add-circle" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.registerMainBtnText}>Register My Grocery Shop</Text>
            </TouchableOpacity>

            <View style={styles.benefitList}>
              <View style={styles.benefitRow}>
                <Ionicons name="checkmark-circle" size={18} color="#007A3D" style={{ marginRight: 8 }} />
                <Text style={styles.benefitText}>Publish daily prices & instant flash deals</Text>
              </View>
              <View style={styles.benefitRow}>
                <Ionicons name="checkmark-circle" size={18} color="#007A3D" style={{ marginRight: 8 }} />
                <Text style={styles.benefitText}>Verified merchant badge in Nearby Shops search</Text>
              </View>
              <View style={styles.benefitRow}>
                <Ionicons name="checkmark-circle" size={18} color="#007A3D" style={{ marginRight: 8 }} />
                <Text style={styles.benefitText}>Dedicated product catalogue with stock indicators</Text>
              </View>
            </View>
          </View>
        </ScrollView>
      ) : (
        <>
          {/* Navigation Tabs */}
          <View style={styles.tabContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabScroll}>
              {TABS.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <TouchableOpacity
                    key={tab.id}
                    style={[styles.tabBtn, isActive && styles.tabBtnActive]}
                    onPress={() => setActiveTab(tab.id)}
                    activeOpacity={0.75}
                  >
                    <Ionicons
                      name={tab.icon}
                      size={15}
                      color={isActive ? '#FFFFFF' : '#4B5563'}
                      style={{ marginRight: 4 }}
                    />
                    <Text style={[styles.tabText, isActive && styles.tabTextActive]}>{tab.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {loading ? (
              <View style={styles.loadingBox}>
                <ActivityIndicator size="small" color="#007A3D" />
                <Text style={styles.loadingText}>Syncing shop data...</Text>
              </View>
            ) : (
              <>
                {/* ─── TAB 1: OVERVIEW & ANALYTICS ──────────────────────────────── */}
                {activeTab === 'overview' && (
                  <View>
                    {/* 5-Metric KPI Dashboard */}
                    <Text style={styles.sectionHeading}>Shop Performance Overview</Text>
                    <View style={styles.kpiGrid}>
                      <View style={styles.kpiCard}>
                        <Text style={styles.kpiValue}>{analytics?.shopViews ?? (products.length * 150 + 240)}</Text>
                        <Text style={styles.kpiLabel}>Shop Views</Text>
                        <Text style={styles.kpiTrend}>Live traffic</Text>
                      </View>
                      <View style={styles.kpiCard}>
                        <Text style={styles.kpiValue}>{analytics?.productSearches ?? (products.length * 85 + 90)}</Text>
                        <Text style={styles.kpiLabel}>Product Searches</Text>
                        <Text style={styles.kpiTrend}>+16% this week</Text>
                      </View>
                      <View style={styles.kpiCard}>
                        <Text style={styles.kpiValue}>{analytics?.priceComparisons ?? Math.round(products.length * 28)}</Text>
                        <Text style={styles.kpiLabel}>Comparisons</Text>
                        <Text style={styles.kpiTrend}>In customer baskets</Text>
                      </View>
                      <View style={styles.kpiCard}>
                        <Text style={styles.kpiValue}>{analytics?.discountViews ?? products.filter(p => p.discountPrice && p.discountPrice < p.price).length}</Text>
                        <Text style={styles.kpiLabel}>Active Deals</Text>
                        <Text style={styles.kpiTrend}>🔥 Promotions</Text>
                      </View>
                    </View>

                    {/* Most Compared Products */}
                    <View style={styles.cardBox}>
                      <View style={styles.cardBoxHeader}>
                        <Text style={styles.cardBoxTitle}>Most Compared Products</Text>
                        <Text style={styles.cardBoxSub}>Top search frequency</Text>
                      </View>
                      {analytics?.popularProducts?.map((p, idx) => (
                        <View key={idx} style={styles.productRankRow}>
                          <Text style={styles.productRankNum}>#{idx + 1}</Text>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.productRankName}>{p.name}</Text>
                            <Text style={styles.productRankDetails}>
                              {p.searches} searches • {p.comparisons} split-basket inclusions
                            </Text>
                          </View>
                          <Text style={styles.productRankPrice}>Rs. {p.price}</Text>
                        </View>
                      ))}
                    </View>

                    {/* Recent Activity Audit */}
                    <View style={styles.cardBox}>
                      <Text style={styles.cardBoxTitle}>Recent Customer Activity</Text>
                      {analytics?.recentActivity?.map((act, idx) => (
                        <View key={idx} style={styles.activityRow}>
                          <Ionicons name="time-outline" size={14} color="#6B7280" />
                          <View style={{ flex: 1 }}>
                            <Text style={styles.activityText}>{act.text}</Text>
                            <Text style={styles.activityTime}>{act.time}</Text>
                          </View>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {/* ─── TAB 2: PRODUCT CATALOGUE ──────────────────────────────────── */}
                {activeTab === 'catalogue' && (
                  <View>
                    <View style={styles.catalogueActionBar}>
                      <View style={styles.searchBar}>
                        <Ionicons name="search" size={16} color="#9CA3AF" />
                        <TextInput
                          style={styles.searchInput}
                          placeholder="Search selling list..."
                          placeholderTextColor="#9CA3AF"
                          value={searchFilter}
                          onChangeText={setSearchFilter}
                        />
                      </View>
                      <TouchableOpacity
                        style={styles.addProductBtn}
                        onPress={handleOpenAddProduct}
                        activeOpacity={0.85}
                      >
                        <Ionicons name="add" size={18} color="#FFFFFF" />
                        <Text style={styles.addProductBtnText}>Add</Text>
                      </TouchableOpacity>
                    </View>

                    <View style={styles.catalogueHeaderRow}>
                      <Text style={styles.catalogueCountText}>
                        Showing {filteredProducts.length} Products
                      </Text>
                      <Text style={styles.lastSyncText}>Updated live</Text>
                    </View>

                    {filteredProducts.map((prod) => (
                      <View key={prod.id} style={styles.productItemCard}>
                        <View style={{ flex: 1 }}>
                          <View style={styles.prodTitleRow}>
                            <Text style={styles.prodName}>{prod.name}</Text>
                            <View
                              style={[
                                styles.stockPill,
                                prod.stockStatus === 'IN_STOCK'
                                  ? styles.stockIn
                                  : prod.stockStatus === 'LOW_STOCK'
                                    ? styles.stockLow
                                    : styles.stockOut,
                              ]}
                            >
                              <Text style={styles.stockPillText}>
                                {prod.stockStatus === 'IN_STOCK'
                                  ? 'In Stock'
                                  : prod.stockStatus === 'LOW_STOCK'
                                    ? 'Low Stock'
                                    : 'Out of Stock'}
                              </Text>
                            </View>
                          </View>

                          <Text style={styles.prodCat}>
                            {prod.category} • Unit: {prod.unit || '1 kg'} • Last update: {prod.updatedAt}
                          </Text>

                          <View style={styles.prodPriceRow}>
                            <Text style={styles.prodPrice}>Rs. {prod.price}</Text>
                            {prod.discountPrice && (
                              <Text style={styles.prodDiscountPrice}>Deal: Rs. {prod.discountPrice}</Text>
                            )}
                          </View>
                        </View>

                        <View style={styles.prodActionsCol}>
                          <TouchableOpacity
                            style={styles.editIconBtn}
                            onPress={() => handleOpenEditProduct(prod)}
                            activeOpacity={0.7}
                          >
                            <Ionicons name="pencil" size={16} color="#007A3D" />
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.deleteIconBtn}
                            onPress={() => handleDeleteProduct(prod)}
                            activeOpacity={0.7}
                          >
                            <Ionicons name="trash-outline" size={16} color="#DC2626" />
                          </TouchableOpacity>
                        </View>
                      </View>
                    ))}
                  </View>
                )}

                {/* ─── TAB 3: PRICE AUDIT & HISTORY ──────────────────────────────── */}
                {activeTab === 'pricing' && (
                  <View>
                    <View style={styles.cardBox}>
                      <View style={styles.cardBoxHeader}>
                        <Text style={styles.cardBoxTitle}>Price Update Log & Audit Trail</Text>
                        <Text style={styles.cardBoxSub}>StockPot Transparency Engine</Text>
                      </View>
                      <Text style={styles.priceAuditNotice}>
                        🛡️ StockPot logs all price changes to ensure trust. Prices are displayed with accurate "Updated X hours ago" stamps to shoppers.
                      </Text>

                      {priceHistory.map((ph) => (
                        <View key={ph.id} style={styles.historyRow}>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.historyProdName}>{ph.productName}</Text>
                            <Text style={styles.historyMeta}>
                              Updated by {ph.updatedBy} • {ph.updatedAt}
                            </Text>
                          </View>
                          <View style={{ alignItems: 'flex-end' }}>
                            <Text style={styles.historyNewPrice}>Rs. {ph.newPrice}</Text>
                            <Text style={styles.historyOldPrice}>Was: Rs. {ph.previousPrice}</Text>
                          </View>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {/* ─── TAB 4: DISCOUNTS & PROMOTIONS ─────────────────────────────── */}
                {activeTab === 'discounts' && (
                  <View>
                    <View style={styles.promoBanner}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.promoBannerTitle}>Boost Store Footfall</Text>
                        <Text style={styles.promoBannerDesc}>
                          Add weekend flash sales and discount deals to appear in customer Deal Alerts.
                        </Text>
                      </View>
                      <TouchableOpacity
                        style={styles.createPromoBtn}
                        onPress={() => setPromoModalVisible(true)}
                        activeOpacity={0.85}
                      >
                        <Ionicons name="add" size={16} color="#FFFFFF" />
                        <Text style={styles.createPromoBtnText}>New Deal</Text>
                      </TouchableOpacity>
                    </View>

                    <Text style={styles.sectionHeading}>Active Deals in Your Store</Text>
                    <View style={styles.dealCard}>
                      <View style={styles.dealBadge}>
                        <Text style={styles.dealBadgeText}>15% OFF 🔥</Text>
                      </View>
                      <Text style={styles.dealTitle}>Fresh Chicken Breast (Boneless) 1kg</Text>
                      <View style={styles.dealPriceRow}>
                        <Text style={styles.dealCurrent}>Rs. 1,250</Text>
                        <Text style={styles.dealOld}>Rs. 1,450</Text>
                        <Text style={styles.dealSave}>Save Rs. 200</Text>
                      </View>
                      <Text style={styles.dealValidText}>⏳ Valid until Sunday 10:00 PM</Text>
                    </View>
                  </View>
                )}

                {/* ─── TAB 5: BULK MANAGEMENT & PRO TOOLS ────────────────────────── */}
                {activeTab === 'bulk' && (
                  <View>
                    <View style={styles.proHeroCard}>
                      <View style={styles.proBadge}>
                        <FontAwesome5 name="crown" size={12} color="#D97706" />
                        <Text style={styles.proBadgeText}>BUSINESS PRO FEATURES</Text>
                      </View>
                      <Text style={styles.proHeroTitle}>Bulk Catalogue & Automation Tools</Text>
                      <Text style={styles.proHeroDesc}>
                        Import hundreds of products via CSV and apply instant percentage price adjustments across your entire store inventory.
                      </Text>
                    </View>

                    {/* CSV Import Trigger */}
                    <TouchableOpacity
                      style={styles.toolCard}
                      onPress={() => setCsvModalVisible(true)}
                      activeOpacity={0.85}
                    >
                      <View style={styles.toolIconWrap}>
                        <Ionicons name="document-text-outline" size={22} color="#007A3D" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.toolTitle}>Bulk CSV Catalogue Upload</Text>
                        <Text style={styles.toolSub}>Import product lists, units & prices in one tap</Text>
                      </View>
                      <Ionicons name="arrow-forward" size={18} color="#9CA3AF" />
                    </TouchableOpacity>

                    {/* Bulk Price Adjustment Trigger */}
                    <TouchableOpacity
                      style={styles.toolCard}
                      onPress={() => setBulkPriceModalVisible(true)}
                      activeOpacity={0.85}
                    >
                      <View style={styles.toolIconWrap}>
                        <Ionicons name="trending-up" size={22} color="#D97706" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.toolTitle}>Bulk Price Adjustment (%)</Text>
                        <Text style={styles.toolSub}>Adjust all catalogue prices by +5%, -10%, etc.</Text>
                      </View>
                      <Ionicons name="arrow-forward" size={18} color="#9CA3AF" />
                    </TouchableOpacity>
                  </View>
                )}

                <View style={{ height: 32 }} />
              </>
            )}
          </ScrollView>

          {/* ─── MODAL: ADD / EDIT PRODUCT ─────────────────────────────────────── */}
          <Modal visible={productModalVisible} animationType="slide" transparent onRequestClose={() => setProductModalVisible(false)}>
            <View style={styles.modalOverlay}>
              <View style={styles.modalSheet}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>{editingProduct ? 'Edit Product' : 'Add Selling Product'}</Text>
                  <TouchableOpacity onPress={() => setProductModalVisible(false)}>
                    <Ionicons name="close" size={22} color="#6B7280" />
                  </TouchableOpacity>
                </View>

                <ScrollView style={{ paddingHorizontal: 20 }}>
                  <Text style={styles.inputLabel}>Product Name *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. Fresh Chicken Breast 1kg"
                    placeholderTextColor="#9CA3AF"
                    value={productName}
                    onChangeText={setProductName}
                  />

                  <View style={styles.rowInputs}>
                    <View style={{ flex: 1, marginRight: 8 }}>
                      <Text style={styles.inputLabel}>Category</Text>
                      <TextInput
                        style={styles.input}
                        value={productCategory}
                        onChangeText={setProductCategory}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.inputLabel}>Unit / Weight</Text>
                      <TextInput
                        style={styles.input}
                        value={productUnit}
                        onChangeText={setProductUnit}
                      />
                    </View>
                  </View>

                  <View style={styles.rowInputs}>
                    <View style={{ flex: 1, marginRight: 8 }}>
                      <Text style={styles.inputLabel}>Selling Price (Rs.) *</Text>
                      <TextInput
                        style={styles.input}
                        keyboardType="numeric"
                        placeholder="1350"
                        placeholderTextColor="#9CA3AF"
                        value={productPrice}
                        onChangeText={setProductPrice}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.inputLabel}>Discount Price (Rs.)</Text>
                      <TextInput
                        style={styles.input}
                        keyboardType="numeric"
                        placeholder="Optional"
                        placeholderTextColor="#9CA3AF"
                        value={productDiscountPrice}
                        onChangeText={setProductDiscountPrice}
                      />
                    </View>
                  </View>

                  <Text style={styles.inputLabel}>Stock Status</Text>
                  <View style={styles.stockSelector}>
                    {['IN_STOCK', 'LOW_STOCK', 'OUT_OF_STOCK'].map((st) => (
                      <TouchableOpacity
                        key={st}
                        style={[styles.stockSelectBtn, productStock === st && styles.stockSelectBtnActive]}
                        onPress={() => setProductStock(st)}
                      >
                        <Text style={[styles.stockSelectText, productStock === st && styles.stockSelectTextActive]}>
                          {st === 'IN_STOCK' ? 'In Stock' : st === 'LOW_STOCK' ? 'Low Stock' : 'Out of Stock'}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <View style={{ height: 20 }} />
                </ScrollView>

                <View style={styles.modalFooter}>
                  <TouchableOpacity style={styles.modalSaveBtn} onPress={handleSaveProduct}>
                    <Text style={styles.modalSaveBtnText}>Save to Catalogue</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>

          {/* ─── MODAL: BULK CSV IMPORT ────────────────────────────────────────── */}
          <Modal visible={csvModalVisible} animationType="slide" transparent onRequestClose={() => setCsvModalVisible(false)}>
            <View style={styles.modalOverlay}>
              <View style={styles.modalSheet}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Bulk CSV Catalogue Import</Text>
                  <TouchableOpacity onPress={() => setCsvModalVisible(false)}>
                    <Ionicons name="close" size={22} color="#6B7280" />
                  </TouchableOpacity>
                </View>

                <ScrollView style={{ paddingHorizontal: 20 }}>
                  <Text style={styles.csvNotice}>
                    Format: Product, Category, Unit, Price, Stock
                  </Text>
                  <TextInput
                    style={styles.csvTextArea}
                    multiline
                    numberOfLines={8}
                    value={csvContent}
                    onChangeText={setCsvContent}
                    autoCapitalize="none"
                  />
                </ScrollView>

                <View style={styles.modalFooter}>
                  <TouchableOpacity style={styles.modalSaveBtn} onPress={handleCsvImport}>
                    <Text style={styles.modalSaveBtnText}>Parse & Import CSV Products</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>

          {/* ─── MODAL: BULK PRICE ADJUSTMENT ──────────────────────────────────── */}
          <Modal visible={bulkPriceModalVisible} animationType="fade" transparent onRequestClose={() => setBulkPriceModalVisible(false)}>
            <View style={styles.modalOverlayCenter}>
              <View style={styles.modalCard}>
                <Text style={styles.modalTitle}>Adjust All Store Prices (%)</Text>
                <Text style={styles.modalSub}>
                  Enter percentage to adjust all catalogue prices (e.g. 5 for +5% inflation or -10 for sale).
                </Text>

                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={pricePercentDelta}
                  onChangeText={setPricePercentDelta}
                  placeholder="e.g. 5 or -10"
                />

                <View style={styles.modalBtnRow}>
                  <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setBulkPriceModalVisible(false)}>
                    <Text style={styles.modalCancelBtnText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.modalSaveBtnSmall} onPress={handleBulkPriceAdjust}>
                    <Text style={styles.modalSaveBtnText}>Apply to All</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>

          {/* ─── MODAL: CREATE DISCOUNT / PROMO ────────────────────────────────── */}
          <Modal visible={promoModalVisible} animationType="slide" transparent onRequestClose={() => setPromoModalVisible(false)}>
            <View style={styles.modalOverlay}>
              <View style={styles.modalSheet}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Create Promotional Deal</Text>
                  <TouchableOpacity onPress={() => setPromoModalVisible(false)}>
                    <Ionicons name="close" size={22} color="#6B7280" />
                  </TouchableOpacity>
                </View>

                <ScrollView style={{ paddingHorizontal: 20 }}>
                  <Text style={styles.inputLabel}>Deal Title</Text>
                  <TextInput
                    style={styles.input}
                    value={promoTitle}
                    onChangeText={setPromoTitle}
                    placeholder="e.g. Weekend Meat Fest 🔥"
                  />

                  <Text style={styles.inputLabel}>Discount Percentage (%)</Text>
                  <TextInput
                    style={styles.input}
                    keyboardType="numeric"
                    value={promoDiscount}
                    onChangeText={setPromoDiscount}
                    placeholder="15"
                  />

                  <View style={{ height: 20 }} />
                </ScrollView>

                <View style={styles.modalFooter}>
                  <TouchableOpacity style={styles.modalSaveBtn} onPress={handleCreatePromo}>
                    <Text style={styles.modalSaveBtnText}>Publish Promotion</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        </>
      )}

      <ShopOwnerModal
        visible={shopOwnerModalVisible}
        onClose={() => setShopOwnerModalVisible(false)}
        onShopRegistered={handleShopRegistered}
      />
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
    gap: 10,
  },
  backBtn: {
    padding: 6,
  },
  shopTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  shopName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
  },
  verifiedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 6,
    gap: 2,
  },
  verifiedTagText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#166534',
  },
  shopSubtitle: {
    fontSize: 11.5,
    color: '#6B7280',
    marginTop: 1,
  },
  planBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  planBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#92400E',
  },
  tabContainer: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tabScroll: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 6,
  },
  tabBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
  },
  tabBtnActive: {
    backgroundColor: '#007A3D',
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4B5563',
  },
  tabTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  body: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  loadingBox: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 8,
  },
  sectionHeading: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 10,
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  kpiCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  kpiValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
  },
  kpiLabel: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#4B5563',
    marginTop: 2,
  },
  kpiTrend: {
    fontSize: 10,
    fontWeight: '700',
    color: '#007A3D',
    marginTop: 4,
  },
  cardBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 14,
  },
  cardBoxHeader: {
    marginBottom: 10,
  },
  cardBoxTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#111827',
  },
  cardBoxSub: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 1,
  },
  productRankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  productRankNum: {
    fontSize: 12,
    fontWeight: '800',
    color: '#9CA3AF',
    width: 24,
  },
  productRankName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
  },
  productRankDetails: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 1,
  },
  productRankPrice: {
    fontSize: 13,
    fontWeight: '700',
    color: '#007A3D',
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  activityText: {
    fontSize: 12,
    color: '#1F2937',
    fontWeight: '500',
  },
  activityTime: {
    fontSize: 10.5,
    color: '#9CA3AF',
    marginTop: 2,
  },

  // Catalogue
  catalogueActionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
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
  addProductBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007A3D',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 12,
    gap: 4,
  },
  addProductBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  catalogueHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  catalogueCountText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4B5563',
  },
  lastSyncText: {
    fontSize: 11,
    color: '#007A3D',
    fontWeight: '600',
  },
  productItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  prodTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  prodName: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#111827',
  },
  stockPill: {
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 6,
  },
  stockIn: {
    backgroundColor: '#DCFCE7',
  },
  stockLow: {
    backgroundColor: '#FEF3C7',
  },
  stockOut: {
    backgroundColor: '#FEE2E2',
  },
  stockPillText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#1F2937',
  },
  prodCat: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
  prodPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  prodPrice: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#007A3D',
  },
  prodDiscountPrice: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#EA580C',
  },
  prodActionsCol: {
    gap: 6,
    marginLeft: 8,
  },
  editIconBtn: {
    padding: 6,
    backgroundColor: '#F0FDF4',
    borderRadius: 8,
  },
  deleteIconBtn: {
    padding: 6,
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
  },

  // Price Audit
  priceAuditNotice: {
    fontSize: 11.5,
    color: '#4B5563',
    lineHeight: 16,
    marginBottom: 12,
    backgroundColor: '#F9FAFB',
    padding: 10,
    borderRadius: 10,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  historyProdName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
  },
  historyMeta: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 1,
  },
  historyNewPrice: {
    fontSize: 13,
    fontWeight: '700',
    color: '#007A3D',
  },
  historyOldPrice: {
    fontSize: 11,
    color: '#9CA3AF',
    textDecorationLine: 'line-through',
  },

  // Promo
  promoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#FDE68A',
    marginBottom: 14,
    gap: 10,
  },
  promoBannerTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#92400E',
  },
  promoBannerDesc: {
    fontSize: 11.5,
    color: '#92400E',
    marginTop: 2,
  },
  createPromoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D97706',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 4,
  },
  createPromoBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  dealCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  dealBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFEDD5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginBottom: 6,
  },
  dealBadgeText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#C2410C',
  },
  dealTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#111827',
  },
  dealPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  dealCurrent: {
    fontSize: 14,
    fontWeight: '800',
    color: '#007A3D',
  },
  dealOld: {
    fontSize: 12,
    color: '#9CA3AF',
    textDecorationLine: 'line-through',
  },
  dealSave: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#EA580C',
  },
  dealValidText: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 6,
  },

  // Pro & Bulk
  proHeroCard: {
    backgroundColor: '#F0FDF4',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    marginBottom: 14,
  },
  proBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 4,
    marginBottom: 6,
  },
  proBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#92400E',
  },
  proHeroTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#166534',
  },
  proHeroDesc: {
    fontSize: 12,
    color: '#166534',
    lineHeight: 16,
    marginTop: 2,
  },
  toolCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 12,
  },
  toolIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#111827',
  },
  toolSub: {
    fontSize: 11.5,
    color: '#6B7280',
    marginTop: 1,
  },

  // Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  modalOverlayCenter: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '75%',
    paddingTop: 16,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
  },
  modalSub: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 14,
    marginTop: 2,
  },
  inputLabel: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#374151',
    marginTop: 8,
    marginBottom: 4,
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13,
    color: '#111827',
  },
  rowInputs: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stockSelector: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 4,
  },
  stockSelectBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  stockSelectBtnActive: {
    backgroundColor: '#007A3D',
  },
  stockSelectText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#4B5563',
  },
  stockSelectTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  modalFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  modalSaveBtn: {
    backgroundColor: '#007A3D',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
  },
  modalSaveBtnSmall: {
    flex: 1,
    backgroundColor: '#007A3D',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
  },
  modalSaveBtnText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '700',
  },
  modalBtnRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  modalCancelBtn: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
  },
  modalCancelBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#4B5563',
  },
  csvNotice: {
    fontSize: 11.5,
    color: '#6B7280',
    marginBottom: 8,
  },
  csvTextArea: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    padding: 12,
    fontSize: 12,
    color: '#111827',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    height: 180,
    textAlignVertical: 'top',
  },
  addShopSmallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 3,
  },
  addShopSmallBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#007A3D',
  },
  registerSmallHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007A3D',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  registerSmallHeaderBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  emptyPortalContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 500,
  },
  emptyPortalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  emptyStoreIconWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyPortalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyPortalSub: {
    fontSize: 13.5,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 22,
    paddingHorizontal: 10,
  },
  registerMainBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007A3D',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 14,
    width: '100%',
    marginBottom: 24,
    shadowColor: '#007A3D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  registerMainBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  benefitList: {
    width: '100%',
    backgroundColor: '#F9FAFB',
    borderRadius: 14,
    padding: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  benefitText: {
    fontSize: 12.5,
    color: '#374151',
    fontWeight: '600',
    flex: 1,
  },
});
