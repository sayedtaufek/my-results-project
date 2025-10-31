# إعداد Cloudflare Account والمشروع

## 1. إنشاء/تسجيل الدخول لحساب Cloudflare
1. اذهب إلى https://dash.cloudflare.com
2. سجّل حساب جديد أو سجّل الدخول
3. تأكد من تفعيل الحساب

## 2. الحصول على API Token
1. اذهب إلى "My Profile" → "API Tokens"
2. انقر "Create Token"
3. اختر "Edit Cloudflare Workers" template
4. أو اختر "Custom token" مع الصلاحيات:
   - Zone: Zone Settings:Read, Zone:Read
   - Account: Cloudflare Workers:Edit, D1:Edit, Pages:Edit
5. احفظ الـ Token بأمان

## 3. الحصول على Account ID
1. في Dashboard الرئيسي
2. اختر أي domain أو انقر على الجانب الأيمن
3. ستجد "Account ID" في الجانب الأيمن
4. انسخ الـ Account ID

## 4. إعداد الدومين (اختياري)
1. إذا كان لديك دومين:
   - أضفه في Cloudflare
   - غيّر DNS servers
2. إذا لم يكن لديك:
   - ستحصل على subdomain مجاني
   - مثل: your-app.pages.dev

## 5. تثبيت Wrangler CLI محلياً
```bash
npm install -g wrangler
wrangler login
wrangler whoami  # للتأكد من تسجيل الدخول
```

## 6. إنشاء D1 Database
```bash
wrangler d1 create student-results-db
```
سيعطيك database_id - احفظه لاستخدامه في wrangler.toml

## 7. إنشاء KV Namespace (للتخزين المؤقت)
```bash
wrangler kv:namespace create "CACHE"
```

## 8. إنشاء R2 Bucket (لتخزين الملفات)
```bash
wrangler r2 bucket create student-files
```
