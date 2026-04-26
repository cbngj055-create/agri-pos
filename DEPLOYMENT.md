# دليل النشر - نظام المتجر الزراعي

## هيكل المشروع

```
سستم الزراعه/
├── server/          ← Backend (Node.js + Express + PostgreSQL)
├── src/             ← Frontend (React + Vite + SQLite)
├── electron/        ← Desktop wrapper (Electron → .exe)
├── mobile/          ← Mobile app (Flutter + native SQLite)
├── public/          ← PWA assets (manifest + service worker + icons)
└── package.json     ← Frontend + Electron dependencies
```

---

## 1. نشر السيرفر (Backend) على Railway

### الخطوات:
1. ارفع فولدر `server/` على GitHub repository منفصل
2. ادخل على [railway.app](https://railway.app) وسجل بحساب GitHub
3. اعمل "New Project" → "Deploy from GitHub repo"
4. اختر الـ repository
5. اضف PostgreSQL: "New" → "Database" → "PostgreSQL"
6. Railway هيديك `DATABASE_URL` تلقائياً في الـ env vars
7. اضف الـ env vars التانية:
   - `JWT_SECRET` = أي نص عشوائي طويل (مثلاً: `openssl rand -hex 32`)
   - `PORT` = 3001
   - `SYNC_INTERVAL_MS` = 30000
8. Railway هيبني ويشغل السيرفر تلقائي على عنوان زي:
   `https://agri-pos-server-production.up.railway.app`

### بدائل:
- **Render.com** - نفس الفكرة، مجاني للـ hobby tier
- **Fly.io** - أسرع، بس محتاج CLI

---

## 2. نشر الفرونتند (Frontend) على Vercel

### الخطوات:
1. ادخل على [vercel.com](https://vercel.com) وسجل بحساب GitHub
2. ارفع المشروع على GitHub (بدون فولدر `server/` و `mobile/`)
3. اعمل "New Project" → اختر الـ repository
4. في الـ Environment Variables اضف:
   - `VITE_API_URL` = عنوان السيرفر من Railway (مثلاً: `https://agri-pos-server-production.up.railway.app`)
5. Vercel هيبني ويشغل على عنوان زي:
   `https://agri-pos.vercel.app`

### النتيجة:
- أي تاجر يفتح `https://agri-pos.vercel.app`
- يسجل حساب → يبدأ يشتغل فوراً
- بدون نت يشتغل عادي (PWA + SQLite)
- أول ما النت يرجع → مزامنة تلقائية

---

## 3. تطبيق الديسكتب (Electron → .exe)

### للتطوير:
```powershell
npm install
npm run electron:dev
```

### لبناء الـ .exe:
```powershell
npm run electron:build
```
النتيجة: ملف `agri-pos-setup-X.X.X.exe` في فولدر `release/`

### للتوزيع:
- ارفع الـ .exe على Google Drive أو موقع التحميل
- التاجر ينزله ويثبته - يشتغل بدون أي إعدادات

---

## 4. تطبيق الموبايل (Flutter → APK/IPA)

### المتطلبات:
- Flutter SDK مثبت (`flutter.dev`)
- Android Studio (للـ APK)
- Xcode (للـ IPA - لازم Mac)

### للتطوير:
```powershell
cd mobile
flutter pub get
flutter run
```

### لبناء الـ APK:
```powershell
cd mobile
flutter build apk --release
```
النتيجة: `mobile/build/app/outputs/flutter-apk/app-release.apk`

### للتوزيع:
- ارفع الـ APK على موقع التحميل أو أرسله مباشرة
- أو انشر على Google Play Console

---

## 5. إعدادات الإنتاج (Production)

### ملف `.env` للسيرفر:
```env
PORT=3001
DATABASE_URL=postgresql://user:pass@host:5432/dbname
JWT_SECRET=<نص عشوائي طويل>
SYNC_INTERVAL_MS=30000
MAX_RETRY_ATTEMPTS=3
RETRY_DELAY_MS=5000
ENABLE_COMPRESSION=true
```

### ملف `.env` أو Vercel env vars للفرونتند:
```env
VITE_API_URL=https://your-server-url.railway.app
```

### في Flutter:
غيّر الـ API URL في `mobile/lib/services/sync_service.dart`:
```dart
static String _apiUrl = 'https://your-server-url.railway.app';
```

---

## 6. ملخص المنصات

| المنصة | التقنية | النشر | التاجر يعمل إيه |
|--------|---------|-------|-----------------|
| **ويب (PWA)** | React + Vite | Vercel | يفتح اللينك → يضيف على الشاشة |
| **ديسكتب** | Electron | .exe | ينزل الملف → يثبت |
| **موبايل** | Flutter | APK | ينزل الـ APK → يثبت |

**كلهم يشتغلوا بدون نت ✅**
**كلهم يتزامنوا مع نفس السيرفر ✅**
**كلهم يستخدموا نفس الـ API ✅**
