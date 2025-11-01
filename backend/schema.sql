-- ==========================================
-- SQL Schema للـ Cloudflare D1 Database
-- ==========================================

-- جدول الطلاب
CREATE TABLE IF NOT EXISTS students (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    studentid TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    grade TEXT,
    average INTEGER,
    schoolname TEXT,
    region TEXT,
    educationalstageid TEXT,
    classname TEXT,
    administration TEXT,
    schoolcode TEXT,
    section TEXT,
    subjects TEXT,
    createdat TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_studentid ON students(studentid);
CREATE INDEX IF NOT EXISTS idx_name ON students(name);
CREATE INDEX IF NOT EXISTS idx_stage ON students(educationalstageid);
CREATE INDEX IF NOT EXISTS idx_region ON students(region);

-- جدول المستخدمين
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'admin',
    createdat TEXT DEFAULT (datetime('now'))
);

-- جدول المراحل التعليمية
CREATE TABLE IF NOT EXISTS stages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    nameen TEXT NOT NULL,
    description TEXT,
    icon TEXT DEFAULT '📚',
    color TEXT DEFAULT '#3b82f6',
    regions TEXT,
    displayorder INTEGER DEFAULT 0,
    isactive INTEGER DEFAULT 1
);

-- جدول المحتوى
CREATE TABLE IF NOT EXISTS content (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pagetitle TEXT,
    metadescription TEXT,
    seokeywords TEXT,
    herotitle TEXT,
    herosubtitle TEXT,
    aboutsection TEXT,
    features TEXT,
    footertext TEXT,
    contactinfo TEXT,
    sociallinks TEXT
);

-- بيانات افتراضية
INSERT OR IGNORE INTO users (username, password, role) 
VALUES ('admin', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'admin');

INSERT OR IGNORE INTO stages (id, name, nameen, description, icon, color, regions, displayorder, isactive) 
VALUES 
(1, 'الثانوية العامة', 'General Secondary Certificate', 'نتائج الثانوية العامة', '🎓', '#3b82f6', '["القاهرة","الجيزة","الإسكندرية","الدقهلية","الشرقية"]', 1, 1),
(2, 'الإعدادية', 'Preparatory Certificate', 'نتائج الشهادة الإعدادية', '📚', '#10b981', '["القاهرة","الجيزة","الإسكندرية"]', 2, 1),
(3, 'الابتدائية', 'Primary Certificate', 'نتائج الشهادة الابتدائية', '✏️', '#f59e0b', '["القاهرة","الجيزة"]', 3, 1);

INSERT OR IGNORE INTO content (id, pagetitle, metadescription, seokeywords, herotitle, herosubtitle, aboutsection, features, footertext) 
VALUES (
    1,
    'نظام نتائج الطلاب',
    'استعلم عن نتائج الطلاب في جميع المراحل التعليمية بسهولة وسرعة',
    'نتائج الطلاب، نتائج الامتحانات، الثانوية العامة، الإعدادية، نتائج 2025',
    'استعلم عن نتيجتك الآن',
    'نتائج جميع المراحل التعليمية متاحة بسهولة وسرعة فائقة',
    'نظام متطور ومتكامل للاستعلام عن نتائج الطلاب في جميع المراحل التعليمية',
    '[{"title":"بحث سريع","description":"استعلام فوري عن النتائج","icon":"⚡"},{"title":"نتائج دقيقة","description":"بيانات محدثة ودقيقة","icon":"✅"},{"title":"سهولة الاستخدام","description":"واجهة بسيطة وسهلة","icon":"👌"},{"title":"أمان البيانات","description":"حماية كاملة للبيانات","icon":"🔒"}]',
    '© 2025 جميع الحقوق محفوظة - نظام نتائج الطلاب'
);

INSERT OR IGNORE INTO students (studentid, name, grade, average, schoolname, region, educationalstageid, classname, administration, subjects) 
VALUES 
('202501001', 'محمد أحمد علي', 'ممتاز', 95, 'مدرسة النور الثانوية', 'القاهرة', '1', 'الثالث الثانوي - علمي', 'القاهرة التعليمية', '[{"name":"الرياضيات","score":98},{"name":"الفيزياء","score":95},{"name":"الكيمياء","score":93}]'),
('202501002', 'فاطمة محمود', 'جيد جدا', 85, 'مدرسة الأمل الثانوية', 'الجيزة', '1', 'الثالث الثانوي - أدبي', 'الجيزة التعليمية', '[{"name":"اللغة العربية","score":88},{"name":"التاريخ","score":85},{"name":"الجغرافيا","score":82}]'),
('202502001', 'عمر خالد', 'ممتاز', 92, 'مدرسة التحرير الإعدادية', 'الإسكندرية', '2', 'الثالث الإعدادي', 'الإسكندرية التعليمية', '[{"name":"الرياضيات","score":95},{"name":"العلوم","score":90},{"name":"اللغة الإنجليزية","score":91}]');
