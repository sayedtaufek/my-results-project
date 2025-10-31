# إعداد المشروع للنشر على Cloudflare

## 1. تحضير Backend Worker

### إنشاء مجلد backend جديد
```bash
mkdir backend
cd backend
```

### نسخ الملفات المطلوبة:
1. انسخ محتوى `worker-backend.js` إلى `backend/src/index.js`
2. انسخ محتوى `backend-worker-package.json` إلى `backend/package.json`
3. انسخ `wrangler.toml` إلى `backend/wrangler.toml`

### تحديث wrangler.toml بالمعلومات الصحيحة:
```toml
name = "student-results-backend"
main = "src/index.js"
compatibility_date = "2024-01-15"

# ضع الـ database_id الذي حصلت عليه
[[d1_databases]]
binding = "DB"
database_name = "student-results-db"
database_id = "YOUR_DATABASE_ID_HERE"

# ضع الـ KV namespace id
[[kv_namespaces]]
binding = "CACHE"
id = "YOUR_KV_NAMESPACE_ID"

# ضع اسم الـ R2 bucket
[[r2_buckets]]
binding = "FILES"
bucket_name = "student-files"
```

### تثبيت dependencies
```bash
cd backend
npm install
```

## 2. تحضير Frontend

### تحديث متغيرات البيئة
```bash
# في frontend/.env
REACT_APP_BACKEND_URL=https://student-results-backend.youraccount.workers.dev
```

### تحسين البناء
```bash
cd frontend
npm install
npm run build
```

## 3. إعداد Database

### تشغيل المسح الأولي للجداول
```bash
# من مجلد المشروع الرئيسي
wrangler d1 execute student-results-db --file=database-schema.sql
```

### التحقق من إنشاء الجداول
```bash
wrangler d1 execute student-results-db --command="SELECT name FROM sqlite_master WHERE type='table';"
```

## 4. إعداد GitHub Secrets (للنشر التلقائي)

اذهب إلى GitHub repository → Settings → Secrets and variables → Actions

أضف المتغيرات التالية:
- `CLOUDFLARE_API_TOKEN`: الـ token الذي حصلت عليه
- `CLOUDFLARE_ACCOUNT_ID`: الـ account ID

## 5. تحديث الكود للإنتاج

### تعديل frontend/src/App.js
تأكد من أن BACKEND_URL يأتي من متغير البيئة:
```javascript
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';
```

### إضافة متغيرات البيئة المطلوبة للWorker
```bash
# في terminal
wrangler secret put JWT_SECRET
# أدخل مفتاح سري قوي مثل: your-super-secret-jwt-key-12345
```
