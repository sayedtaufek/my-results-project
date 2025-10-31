# خطوات تحضير Git Repository

## 1. إنشاء Repository جديد على GitHub
1. اذهب إلى GitHub.com
2. انقر على "New repository"
3. اسم المشروع: `student-results-system`
4. اختر "Public" أو "Private"
5. انقر "Create repository"

## 2. رفع الكود الحالي
```bash
# في مجلد المشروع الحالي
cd /app

# تهيئة Git
git init
git add .
git commit -m "Initial commit - Student Results System"

# ربط بـ GitHub
git branch -M main
git remote add origin https://github.com/yourusername/student-results-system.git
git push -u origin main
```

## 3. تنظيم بنية المشروع
```
student-results-system/
├── frontend/                 # React app (موجود)
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── .env
├── backend/                  # Worker backend (جديد)
│   ├── src/
│   │   └── index.js
│   ├── package.json
│   └── wrangler.toml
├── database/
│   └── schema.sql
├── .github/
│   └── workflows/
│       └── deploy.yml
├── README.md
└── .gitignore
```

## 4. إنشاء الملفات المطلوبة (تم إنشاؤها مسبقاً)
- ✅ wrangler.toml
- ✅ worker-backend.js  
- ✅ database-schema.sql
- ✅ GitHub Actions workflow
- ✅ Package.json للworker