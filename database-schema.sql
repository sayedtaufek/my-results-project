-- Students table
CREATE TABLE IF NOT EXISTS students (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    student_id TEXT NOT NULL UNIQUE,
    school TEXT NOT NULL,
    educational_stage TEXT NOT NULL,
    region TEXT,
    subjects TEXT, -- JSON string
    average REAL NOT NULL,
    grade TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

-- Indexes for students
CREATE INDEX IF NOT EXISTS idx_students_name ON students(name);
CREATE INDEX IF NOT EXISTS idx_students_student_id ON students(student_id);
CREATE INDEX IF NOT EXISTS idx_students_school ON students(school);
CREATE INDEX IF NOT EXISTS idx_students_stage ON students(educational_stage);
CREATE INDEX IF NOT EXISTS idx_students_region ON students(region);
CREATE INDEX IF NOT EXISTS idx_students_created_at ON students(created_at);

-- Site settings table
CREATE TABLE IF NOT EXISTS site_settings (
    id TEXT PRIMARY KEY,
    site_name TEXT NOT NULL DEFAULT 'نظام الاستعلام الذكي',
    site_description TEXT DEFAULT '',
    site_keywords TEXT DEFAULT '',
    logo_base64 TEXT,
    primary_color TEXT DEFAULT '#3B82F6',
    secondary_color TEXT DEFAULT '#1E40AF',
    accent_color TEXT DEFAULT '#F59E0B',
    contact_email TEXT,
    contact_phone TEXT,
    contact_address TEXT,
    facebook_url TEXT,
    twitter_url TEXT,
    instagram_url TEXT,
    youtube_url TEXT,
    telegram_url TEXT,
    whatsapp_number TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

-- Subscribers table
CREATE TABLE IF NOT EXISTS subscribers (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    phone TEXT,
    educational_stage TEXT,
    region TEXT,
    subscription_date TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    is_verified BOOLEAN DEFAULT FALSE,
    notification_preferences TEXT, -- JSON string
    last_notification_sent TEXT,
    notification_count INTEGER DEFAULT 0,
    unsubscribe_token TEXT,
    created_at TEXT NOT NULL
);

-- Indexes for subscribers
CREATE INDEX IF NOT EXISTS idx_subscribers_email ON subscribers(email);
CREATE INDEX IF NOT EXISTS idx_subscribers_active ON subscribers(is_active);
CREATE INDEX IF NOT EXISTS idx_subscribers_stage ON subscribers(educational_stage);
CREATE INDEX IF NOT EXISTS idx_subscribers_region ON subscribers(region);

-- Educational stages table
CREATE TABLE IF NOT EXISTS educational_stages (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    name_en TEXT,
    description TEXT,
    regions TEXT, -- JSON array
    is_active BOOLEAN DEFAULT TRUE,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

-- Page blocks table for homepage builder
CREATE TABLE IF NOT EXISTS page_blocks (
    id TEXT PRIMARY KEY,
    block_type TEXT NOT NULL,
    title TEXT DEFAULT '',
    subtitle TEXT DEFAULT '',
    content TEXT, -- JSON string
    html_content TEXT DEFAULT '',
    css_styles TEXT DEFAULT '',
    settings TEXT, -- JSON string
    is_visible BOOLEAN DEFAULT TRUE,
    is_container BOOLEAN DEFAULT TRUE,
    order_index INTEGER DEFAULT 0,
    section TEXT DEFAULT 'main',
    show_on_desktop BOOLEAN DEFAULT TRUE,
    show_on_tablet BOOLEAN DEFAULT TRUE,
    show_on_mobile BOOLEAN DEFAULT TRUE,
    start_date TEXT,
    end_date TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

-- Indexes for page blocks
CREATE INDEX IF NOT EXISTS idx_blocks_type ON page_blocks(block_type);
CREATE INDEX IF NOT EXISTS idx_blocks_visible ON page_blocks(is_visible);
CREATE INDEX IF NOT EXISTS idx_blocks_order ON page_blocks(order_index);
CREATE INDEX IF NOT EXISTS idx_blocks_section ON page_blocks(section);

-- Homepage configuration
CREATE TABLE IF NOT EXISTS homepage (
    id TEXT PRIMARY KEY,
    title TEXT DEFAULT 'الصفحة الرئيسية',
    slug TEXT DEFAULT 'home',
    meta_title TEXT,
    meta_description TEXT,
    meta_keywords TEXT,
    blocks TEXT, -- JSON array of block IDs
    is_active BOOLEAN DEFAULT TRUE,
    template TEXT DEFAULT 'default',
    canonical_url TEXT,
    robots TEXT DEFAULT 'index,follow',
    og_image TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    summary TEXT DEFAULT '',
    notification_type TEXT NOT NULL,
    priority TEXT DEFAULT 'normal',
    target_audience TEXT DEFAULT 'all',
    target_stage TEXT,
    target_region TEXT,
    target_subscribers TEXT, -- JSON array
    send_immediately BOOLEAN DEFAULT TRUE,
    scheduled_send_time TEXT,
    status TEXT DEFAULT 'draft',
    sent_at TEXT,
    sent_count INTEGER DEFAULT 0,
    failed_count INTEGER DEFAULT 0,
    include_unsubscribe_link BOOLEAN DEFAULT TRUE,
    email_template TEXT DEFAULT 'default',
    created_by TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

-- Indexes for notifications
CREATE INDEX IF NOT EXISTS idx_notifications_status ON notifications(status);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(notification_type);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);

-- FAQ table
CREATE TABLE IF NOT EXISTS faq_items (
    id TEXT PRIMARY KEY,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    category TEXT DEFAULT 'عام',
    keywords TEXT, -- JSON array
    is_featured BOOLEAN DEFAULT FALSE,
    view_count INTEGER DEFAULT 0,
    helpful_count INTEGER DEFAULT 0,
    order_index INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    seo_title TEXT,
    seo_description TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

-- Educational content table
CREATE TABLE IF NOT EXISTS educational_content (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    content_type TEXT NOT NULL,
    category TEXT DEFAULT 'عام',
    tags TEXT, -- JSON array
    educational_stage TEXT,
    difficulty_level TEXT DEFAULT 'متوسط',
    reading_time INTEGER DEFAULT 0,
    is_featured BOOLEAN DEFAULT FALSE,
    is_published BOOLEAN DEFAULT TRUE,
    view_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    author TEXT,
    seo_title TEXT,
    seo_description TEXT,
    seo_keywords TEXT,
    featured_image TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

-- Insert default data
INSERT OR IGNORE INTO site_settings (
    id, site_name, site_description, primary_color, secondary_color, accent_color, created_at, updated_at
) VALUES (
    'default', 
    'نظام الاستعلام الذكي عن النتائج',
    'نظام متطور للبحث والاستعلام عن النتائج التعليمية',
    '#3B82F6',
    '#1E40AF', 
    '#F59E0B',
    datetime('now'),
    datetime('now')
);

INSERT OR IGNORE INTO homepage (
    id, title, blocks, created_at, updated_at
) VALUES (
    'main',
    'الصفحة الرئيسية',
    '[]',
    datetime('now'),
    datetime('now')
);

-- Sample educational stages
INSERT OR IGNORE INTO educational_stages (
    id, name, name_en, description, regions, created_at, updated_at
) VALUES 
    ('primary', 'المرحلة الابتدائية', 'Primary', 'الصفوف من الأول إلى السادس الابتدائي', '["القاهرة", "الجيزة", "الإسكندرية"]', datetime('now'), datetime('now')),
    ('middle', 'المرحلة الإعدادية', 'Middle', 'الصفوف من الأول إلى الثالث الإعدادي', '["القاهرة", "الجيزة", "الإسكندرية"]', datetime('now'), datetime('now')),
    ('secondary', 'المرحلة الثانوية', 'Secondary', 'الصفوف من الأول إلى الثالث الثانوي', '["القاهرة", "الجيزة", "الإسكندرية"]', datetime('now'), datetime('now'));

-- Sample FAQ items
INSERT OR IGNORE INTO faq_items (
    id, question, answer, category, order_index, created_at, updated_at
) VALUES 
    ('faq1', 'كيف يمكنني البحث عن نتيجتي؟', 'يمكنك البحث عن نتيجتك باستخدام رقم الجلوس أو الاسم في خانة البحث الرئيسية', 'البحث', 1, datetime('now'), datetime('now')),
    ('faq2', 'ماذا أفعل إذا لم أجد نتيجتي؟', 'تأكد من كتابة رقم الجلوس أو الاسم بشكل صحيح، أو تواصل مع إدارة المدرسة', 'البحث', 2, datetime('now'), datetime('now')),
    ('faq3', 'كيف يمكنني طباعة شهادة التقدير؟', 'بعد العثور على نتيجتك، انقر على "إنشاء شهادة" ثم اختر "تحميل كصورة" أو "طباعة"', 'الشهادات', 3, datetime('now'), datetime('now'));