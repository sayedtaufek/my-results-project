# نشر النظام على Cloudflare Workers & Pages

## 1. نشر Backend Worker

```bash
cd backend
wrangler deploy
```

ستحصل على رابط مثل:
`https://student-results-backend.youraccount.workers.dev`

## 2. نشر Frontend على Pages

### الطريقة الأولى: من خلال Dashboard
1. اذهب إلى Cloudflare Dashboard
2. انقر "Workers & Pages" 
3. انقر "Create application"
4. انقر "Pages" → "Connect to Git"
5. اختر GitHub repository الخاص بك
6. إعدادات البناء:
   - **Build command**: `cd frontend && npm install && npm run build`
   - **Build output directory**: `frontend/dist`
   - **Root directory**: `/` (اتركه فارغ)

### الطريقة الثانية: من Command Line
```bash
cd frontend
npm run build
wrangler pages publish dist --project-name=student-results-frontend
```

## 3. ربط Backend مع Frontend

### تحديث متغير البيئة في Pages
1. اذهب إلى Pages project في Dashboard
2. Settings → Environment variables
3. أضف:
   - `REACT_APP_BACKEND_URL`: `https://student-results-backend.youraccount.workers.dev`

### إعادة البناء
انقر "Deployments" → "Retry deployment" أو push commit جديد

## 4. إعداد Custom Domain (اختياري)

### للBackend Worker:
```bash
wrangler route add "api.yourdomain.com/*" student-results-backend
```

### للFrontend Pages:
1. Pages Dashboard → Custom domains
2. أضف `yourdomain.com`
3. اتبع تعليمات DNS

## 5. اختبار النشر

### اختبار Backend:
```bash
curl https://student-results-backend.youraccount.workers.dev/api/health
```

### اختبار Frontend:
افتح المتصفح واذهب إلى:
`https://student-results-frontend.pages.dev`

## 6. مراقبة الأداء

### في Cloudflare Dashboard:
1. Workers & Pages → student-results-backend → Metrics
2. Pages → student-results-frontend → Analytics

### إعداد Alerts:
1. Notifications → Add
2. اختر Worker أو Pages
3. ضع حدود للErrors والLatency
