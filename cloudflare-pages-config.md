# إعدادات Cloudflare Pages الصحيحة

## في واجهة إعداد Repository:

### Framework preset: 
اختر "Create React App" أو "None"

### Build command:
cd frontend && npm install && npm run build

### Build output directory:
frontend/dist

### Root directory (advanced):
/ (اتركه فارغ أو ضع /)

### Deploy command:
(اتركه فارغ تماماً - احذف npx wrangler deploy)

## Environment Variables (مهم جداً):
بعد إنشاء المشروع، اذهب إلى:
Settings → Environment Variables

أضف:
- REACT_APP_BACKEND_URL = https://your-worker-name.your-account.workers.dev
- NODE_VERSION = 18
- NPM_VERSION = 8