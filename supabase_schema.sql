-- ============================================================================
-- STOCKPOT AI — SUPABASE & POSTGRESQL DATABASE SCHEMA
-- Extensions: Premium Subscriptions + Shop Owner Business Ecosystem
-- ============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ----------------------------------------------------------------------------
-- 1. SUBSCRIPTION PLANS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS subscription_plans (
    id VARCHAR(50) PRIMARY KEY, -- 'customer_free', 'customer_premium_monthly', 'customer_premium_yearly', 'business_basic', 'business_pro'
    name VARCHAR(100) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('customer', 'business')),
    billing_period VARCHAR(20) NOT NULL CHECK (billing_period IN ('free', 'monthly', 'yearly')),
    price_lkr NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    features JSONB NOT NULL DEFAULT '{}',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed Default Subscription Plans
INSERT INTO subscription_plans (id, name, type, billing_period, price_lkr, features)
VALUES 
    ('customer_free', 'Customer Free', 'customer', 'free', 0.00, '{"unlimited_ai": false, "split_basket_optimizer": true, "advanced_meal_planning": false, "budget_challenges": false, "macro_nutrition": false, "household_sharing": false}'),
    ('customer_premium_monthly', 'Customer Premium Monthly', 'customer', 'monthly', 499.00, '{"unlimited_ai": true, "split_basket_optimizer": true, "advanced_meal_planning": true, "budget_challenges": true, "macro_nutrition": true, "household_sharing": true, "deal_alerts": true}'),
    ('customer_premium_yearly', 'Customer Premium Yearly', 'customer', 'yearly', 4499.00, '{"unlimited_ai": true, "split_basket_optimizer": true, "advanced_meal_planning": true, "budget_challenges": true, "macro_nutrition": true, "household_sharing": true, "deal_alerts": true, "discount_pct": 25}'),
    ('business_basic', 'StockPot Business Basic', 'business', 'monthly', 1499.00, '{"product_limit": 100, "bulk_csv_import": false, "bulk_price_updates": false, "advanced_analytics": false, "branches_limit": 1, "featured_listing": false}'),
    ('business_pro', 'StockPot Business Pro', 'business', 'monthly', 2999.00, '{"product_limit": -1, "bulk_csv_import": true, "bulk_price_updates": true, "advanced_analytics": true, "branches_limit": 5, "featured_listing": true, "priority_support": true}')
ON CONFLICT (id) DO UPDATE 
SET name = EXCLUDED.name, price_lkr = EXCLUDED.price_lkr, features = EXCLUDED.features;

-- ----------------------------------------------------------------------------
-- 2. USER SUBSCRIPTIONS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL, -- references auth.users(id) or profiles(id)
    plan_id VARCHAR(50) NOT NULL REFERENCES subscription_plans(id),
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'past_due', 'cancelled', 'trialing', 'expired')),
    start_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    renewal_date TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 days'),
    cancelled_at TIMESTAMPTZ,
    is_trial BOOLEAN NOT NULL DEFAULT FALSE,
    trial_ends_at TIMESTAMPTZ,
    payment_method JSONB DEFAULT '{"type": "mock_card", "last4": "4242"}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);

-- ----------------------------------------------------------------------------
-- 3. SHOP OWNERS & BUSINESS ACCOUNTS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS shop_owners (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE, -- references auth.users(id)
    business_name VARCHAR(150) NOT NULL,
    owner_name VARCHAR(100) NOT NULL,
    owner_email VARCHAR(150) NOT NULL,
    owner_phone VARCHAR(50) NOT NULL,
    business_plan VARCHAR(50) NOT NULL DEFAULT 'business_basic' REFERENCES subscription_plans(id),
    tax_id_or_brn VARCHAR(100),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 4. SHOPS & STORES
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS shops (
    id VARCHAR(100) PRIMARY KEY, -- e.g. 'store_keells', 'store_custom_123'
    owner_id UUID REFERENCES shop_owners(id) ON DELETE SET NULL,
    name VARCHAR(150) NOT NULL,
    category VARCHAR(50) NOT NULL DEFAULT 'Grocery' CHECK (category IN (
        'Supermarket', 'Supercentre', 'Grocery', 'Bakery', 'Butcher', 
        'Fruits & Vegetables', 'Convenience Store', 'Specialty Food', 'Other'
    )),
    description TEXT,
    logo_url TEXT,
    cover_image_url TEXT,
    color_hex VARCHAR(10) DEFAULT '#007A3D',
    address TEXT NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    phone VARCHAR(50),
    email VARCHAR(150),
    website_url TEXT,
    google_maps_url TEXT,
    opening_hours VARCHAR(100) DEFAULT '7:30 AM – 10:00 PM',
    delivery_available BOOLEAN NOT NULL DEFAULT TRUE,
    pickup_available BOOLEAN NOT NULL DEFAULT TRUE,
    payment_methods TEXT[] DEFAULT ARRAY['Cash', 'Card', 'QR'],
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    verification_status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (verification_status IN ('PENDING', 'VERIFIED', 'REJECTED', 'SUSPENDED')),
    verification_notes TEXT,
    is_local_shop BOOLEAN NOT NULL DEFAULT TRUE,
    is_featured BOOLEAN NOT NULL DEFAULT FALSE,
    rating NUMERIC(3, 2) DEFAULT 4.8,
    reviews_count INT DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shops_lat_lng ON shops(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_shops_verification ON shops(verification_status);
CREATE INDEX IF NOT EXISTS idx_shops_category ON shops(category);

-- ----------------------------------------------------------------------------
-- 5. SHOP BRANCHES (Business Pro Multi-Branch)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS shop_branches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id VARCHAR(100) NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    branch_name VARCHAR(100) NOT NULL,
    address TEXT NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    phone VARCHAR(50),
    opening_hours VARCHAR(100),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 6. PRODUCT CATEGORIES
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS product_categories (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    icon_name VARCHAR(50),
    display_order INT DEFAULT 0
);

INSERT INTO product_categories (id, name, icon_name, display_order)
VALUES
    ('rice_grains', 'Rice & Grains', 'grain', 1),
    ('meat', 'Meat', 'food-drumstick', 2),
    ('seafood', 'Seafood', 'fish', 3),
    ('vegetables', 'Vegetables', 'carrot', 4),
    ('fruits', 'Fruits', 'food-apple', 5),
    ('dairy', 'Dairy', 'cup-water', 6),
    ('eggs', 'Eggs', 'egg', 7),
    ('bakery', 'Bakery', 'bread-slice', 8),
    ('beverages', 'Beverages', 'coffee', 9),
    ('frozen', 'Frozen', 'snowflake', 10),
    ('snacks', 'Snacks', 'cookie', 11),
    ('spices', 'Spices & Seasoning', 'shaker', 12),
    ('cooking_essentials', 'Cooking Essentials', 'oil', 13),
    ('household_food', 'Household Food Items', 'home', 14),
    ('other', 'Other', 'shopping', 15)
ON CONFLICT (id) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 7. MASTER PRODUCTS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS products (
    id VARCHAR(100) PRIMARY KEY, -- e.g. 'p_chicken_breast'
    name VARCHAR(200) NOT NULL,
    category_id VARCHAR(50) REFERENCES product_categories(id),
    category_name VARCHAR(100) NOT NULL,
    brand VARCHAR(100),
    description TEXT,
    unit VARCHAR(50) NOT NULL DEFAULT '1 kg',
    weight_or_qty VARCHAR(50) DEFAULT '1kg',
    image_url TEXT,
    sku_or_barcode VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);

-- ----------------------------------------------------------------------------
-- 8. SHOP SELLING CATALOGUE & INVENTORY
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS shop_products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id VARCHAR(100) NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    product_id VARCHAR(100) REFERENCES products(id) ON DELETE SET NULL,
    custom_name VARCHAR(200) NOT NULL,
    category VARCHAR(100) NOT NULL,
    brand VARCHAR(100),
    description TEXT,
    image_url TEXT,
    unit VARCHAR(50) NOT NULL DEFAULT '1 kg',
    weight_or_qty VARCHAR(50) DEFAULT '1kg',
    price NUMERIC(10, 2) NOT NULL,
    discount_price NUMERIC(10, 2),
    stock_status VARCHAR(20) NOT NULL DEFAULT 'IN_STOCK' CHECK (stock_status IN ('IN_STOCK', 'LOW_STOCK', 'OUT_OF_STOCK')),
    sku_barcode VARCHAR(100),
    last_updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_shop_product UNIQUE (shop_id, custom_name)
);

CREATE INDEX IF NOT EXISTS idx_shop_products_shop ON shop_products(shop_id);
CREATE INDEX IF NOT EXISTS idx_shop_products_price ON shop_products(price);

-- ----------------------------------------------------------------------------
-- 9. PRICE AUDIT & HISTORY
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS price_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id VARCHAR(100) NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    shop_product_id UUID REFERENCES shop_products(id) ON DELETE SET NULL,
    product_name VARCHAR(200) NOT NULL,
    previous_price NUMERIC(10, 2) NOT NULL,
    new_price NUMERIC(10, 2) NOT NULL,
    updated_by VARCHAR(100) NOT NULL DEFAULT 'Shop Owner',
    updated_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_price_history_shop ON price_history(shop_id);
CREATE INDEX IF NOT EXISTS idx_price_history_time ON price_history(updated_timestamp DESC);

-- ----------------------------------------------------------------------------
-- 10. DISCOUNTS & PROMOTIONS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS discounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id VARCHAR(100) NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    shop_product_id UUID REFERENCES shop_products(id) ON DELETE CASCADE,
    product_name VARCHAR(200) NOT NULL,
    promotion_title VARCHAR(150) NOT NULL,
    promotion_description TEXT,
    discount_type VARCHAR(30) NOT NULL DEFAULT 'PERCENTAGE' CHECK (discount_type IN (
        'PERCENTAGE', 'FIXED_DISCOUNT', 'PROMOTIONAL_PRICE', 'WEEKEND_DEAL', 'FLASH_SALE', 'SEASONAL'
    )),
    original_price NUMERIC(10, 2) NOT NULL,
    discount_price NUMERIC(10, 2) NOT NULL,
    discount_percentage INT GENERATED ALWAYS AS (
        CASE WHEN original_price > 0 THEN ROUND(((original_price - discount_price) / original_price) * 100) ELSE 0 END
    ) STORED,
    start_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    end_date TIMESTAMPTZ NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_discounts_shop ON discounts(shop_id);
CREATE INDEX IF NOT EXISTS idx_discounts_active ON discounts(is_active, end_date);

-- ----------------------------------------------------------------------------
-- 11. SHOP ANALYTICS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS shop_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id VARCHAR(100) NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    shop_views INT NOT NULL DEFAULT 0,
    product_searches INT NOT NULL DEFAULT 0,
    price_comparisons INT NOT NULL DEFAULT 0,
    discount_views INT NOT NULL DEFAULT 0,
    customer_saves INT NOT NULL DEFAULT 0,
    most_compared_products JSONB DEFAULT '[]',
    daily_stats JSONB DEFAULT '{}',
    last_computed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 12. GAMIFICATION & XP TRANSACTIONS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS xp_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    amount INT NOT NULL,
    action_type VARCHAR(50) NOT NULL, -- 'CREATE_RECIPE', 'RECIPE_10_LIKES', 'RECIPE_100_LIKES', 'COOK_RECIPE', 'RATE_RECIPE', 'COMPLETE_MEAL_PLAN', 'STAY_UNDER_BUDGET', 'SAVE_MONEY_SPLIT', 'BUDGET_CHALLENGE'
    title VARCHAR(150) NOT NULL,
    details TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_xp_transactions_user ON xp_transactions(user_id);

CREATE TABLE IF NOT EXISTS badges (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    icon_name VARCHAR(50) NOT NULL,
    xp_bonus INT NOT NULL DEFAULT 50,
    category VARCHAR(50) DEFAULT 'Savings'
);

INSERT INTO badges (id, name, description, icon_name, xp_bonus, category)
VALUES
    ('b_first_recipe', 'First Recipe', 'Created your first community recipe', 'book-open', 50, 'Community'),
    ('b_first_meal', 'First Cook', 'Prepared your first meal from StockPot', 'utensils', 25, 'Cooking'),
    ('b_streak_7', '7-Day Streak', 'Maintained a 7-day home cooking streak', 'fire', 100, 'Consistency'),
    ('b_budget_hero', 'Budget Hero', 'Kept weekly grocery spend within budget', 'shield-alt', 75, 'Budget'),
    ('b_smart_shopper', 'Smart Shopper', 'Saved over Rs. 1,500 using split-basket comparison', 'shopping-cart', 80, 'Savings'),
    ('b_recipe_creator', 'Master Creator', 'Published 5 approved community recipes', 'pencil-alt', 150, 'Community'),
    ('b_community_fav', 'Community Star', 'Received over 50 likes on your recipes', 'star', 120, 'Community'),
    ('b_savings_master', 'Savings Master', 'Total cumulative savings crossed Rs. 5,000', 'gem', 200, 'Savings')
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS user_badges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    badge_id VARCHAR(50) NOT NULL REFERENCES badges(id),
    unlocked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_user_badge UNIQUE (user_id, badge_id)
);

-- ----------------------------------------------------------------------------
-- 13. COMMUNITY RECIPE INTERACTIONS (Duplicates Prevention)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS recipe_likes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    recipe_id VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_recipe_like UNIQUE (user_id, recipe_id)
);

CREATE TABLE IF NOT EXISTS recipe_ratings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    recipe_id VARCHAR(100) NOT NULL,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review_text TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_recipe_rating UNIQUE (user_id, recipe_id)
);

CREATE TABLE IF NOT EXISTS recipe_saves (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    recipe_id VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_recipe_save UNIQUE (user_id, recipe_id)
);

CREATE TABLE IF NOT EXISTS recipe_cooks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    recipe_id VARCHAR(100) NOT NULL,
    servings_prepared INT DEFAULT 2,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS recipe_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reporter_id UUID NOT NULL,
    recipe_id VARCHAR(100) NOT NULL,
    reason VARCHAR(100) NOT NULL,
    details TEXT,
    status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'REVIEWED', 'DISMISSED', 'ACTIONED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 14. ROW LEVEL SECURITY (RLS) POLICIES
-- ----------------------------------------------------------------------------
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_owners ENABLE ROW LEVEL SECURITY;
ALTER TABLE shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE discounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE xp_transactions ENABLE ROW LEVEL SECURITY;

-- Public can view active verified shops and verified shop products
CREATE POLICY "Public can view approved shops" ON shops
    FOR SELECT USING (verification_status = 'VERIFIED' OR is_verified = TRUE);

CREATE POLICY "Public can view active shop products" ON shop_products
    FOR SELECT USING (TRUE);

CREATE POLICY "Public can view active discounts" ON discounts
    FOR SELECT USING (is_active = TRUE AND end_date >= NOW());

-- ----------------------------------------------------------------------------
-- 15. USER NOTIFICATIONS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_notifications (
    id VARCHAR(100) PRIMARY KEY,
    user_id UUID, -- references auth.users(id) or profiles(id)
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL DEFAULT 'SYSTEM',
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    action VARCHAR(100),
    data JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_notifications_user_id ON user_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_user_notifications_is_read ON user_notifications(is_read);

ALTER TABLE user_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own notifications" ON user_notifications
    FOR ALL USING (user_id IS NULL OR user_id = auth.uid());

