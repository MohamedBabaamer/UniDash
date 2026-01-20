# Firebase Database Setup for UniDash

## ✅ Installation Complete
Firebase package has been installed successfully!

## Setup Steps:

### 1. Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Add project"** or **"Create a project"**
3. Enter your project name (e.g., "UniDash")
4. Follow the setup wizard

### 2. Enable Services

**Firestore Database:**
- In Firebase Console → Build → Firestore Database
- Click "Create database"
- Choose "Start in test mode" (for development)
- Select a location closest to you

**Authentication:**
- In Firebase Console → Build → Authentication
- Click "Get started"
- Enable **Email/Password** sign-in method

### 3. Get Firebase Configuration

1. In Firebase Console → Project Settings ⚙️ → General
2. Scroll down to "Your apps"
3. Click the **</>** (Web) icon
4. Register your app (name: "UniDash")
5. Copy the configuration values

### 4. Update Environment Variables

Edit `.env.local` file and replace the placeholders with your actual Firebase credentials:

```env
VITE_FIREBASE_API_KEY=your_actual_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef
```

📌 **ملاحظة مهمة:**
- هذي المتغيرات **مش سرية** (Firebase يقول هكا صراحة)
- الحماية الحقيقية في **Firestore Rules** (الخطوة التالية)
- `.env.local` للتنظيم، مش للأمان
- تأكد `.env.local` موجود في `.gitignore`

### 5. Firestore Security Rules (Production)

**مهم جدًا!** 🔐 Rules هي الحماية الحقيقية لقاعدة البيانات.

في Firebase Console → Firestore Database → Rules، انسخ المحتوى من ملف `firestore.rules`:

```bash
# نسخ Rules من الملف للـ Firebase Console
cat firestore.rules
```

أو استعمل Firebase CLI:
```bash
firebase deploy --only firestore:rules
```

📌 **القواعد تشمل:**
- ✅ Courses: يقرا أي مستخدم مسجل، يكتب أي مسجل
- ✅ Payments: يقرا فقط صاحب الدفع، يكتب فقط admin
- ✅ Users: كل واحد يقرا ويحدّث بياناتو فقط
- ✅ Role-based access للـ admin

## Usage Examples

### Authentication

```typescript
import { signUp, signIn, logOut } from './services/auth.service';

// Sign up new user
const user = await signUp('user@example.com', 'password123', 'John Doe');

// Sign in
const user = await signIn('user@example.com', 'password123');

// Sign out
await logOut();
```

### Database Operations

```typescript
import { 
  getAllCourses, 
  createCourse, 
  updateCourse 
} from './services/database.service';

// Fetch all courses
const courses = await getAllCourses();

// Create a new course
const courseId = await createCourse({
  code: 'CS101',
  name: 'Introduction to Programming',
  professor: 'Dr. Smith',
  progress: 0,
  credits: 3,
  status: 'Active',
  type: 'Core',
  level: 'L1',
  color: '#3B82F6',
  icon: '💻'
});

// Update course
await updateCourse(courseId, { progress: 50 });
```

## Project Structure

```
UniDash/
├── firebase.config.ts          # Firebase initialization
├── services/🔧 Firebase initialization
├── firestore.rules             # 🔐 قواعد الأمان (انسخها للـ Console)
├── .env.local                  # 🔑 Firebase credentials (git ignored)
├── .env.example                # 📋 مثال للـ environment variables
├── contexts/
│   └── AuthContext.tsx         # 🔐 Context للمصادقة في كل التطبيق
├── components/
│   └── ProtectedRoute.tsx      # 🛡️ حماية الصفحات (يلزم تسجيل دخول)
└── services/
    ├── auth.service.ts         # 🔓 Authentication functions
    └── database.service.ts     # 💾 Database CRUD operation

## Available Services

### Auth Service (`services/auth.service.ts`)
- `signUp(email, password, displayName)` - Create new user
- `signIn(email, password)` - Sign in user
- `logOut()` - Sign out current user
- `getCurrentUser()` - Get current user
- `onAuthChange(callback)` - Listen to auth state changes

### Database Service (`services/database.service.ts`)
- `getAllCourses()` - Fetch all courses
- `getCourseById(id)` - Get specific course
- `createCourse(course)` - Add new course
- `updateCourse(id, updates)` - Update course
- `deleteCourse(id)` - Delete course
- `getAllPayments()` - Fetch all payments
- `getPaymentsByStatus(status)` - Filter payments by status
- `createPayment(payment)` - Add new payment
- `updatePayment(id, updates)` - Update payment

## 🛡️ حماية المشروع Production-Ready

### AuthContext + ProtectedRoute

المشروع دلوقتي عندو:
- ✅ **AuthContext**: يدير حالة المصادقة في كل التطبيق
- ✅ **ProtectedRoute**: يحمي الصفحات (redirect للـ login)
- ✅ **Firestore Rules**: حماية قاعدة البيانات
- ✅ **Environment Variables**: منظمة في `.env.local`

### استعمال useAuth في أي component:

```typescript
import { useAuth } from '../contexts/AuthContext';

function MyComponent() {
  const { user, isAuthenticated, loading } = useAuth();
  
  if (loading) return <div>Loading...</div>;
  
  return (
    <div>
      {isAuthenticated ? (
        <p>Welcome {user?.displayName}!</p>
      ) : (
        <p>Please login</p>
      )}
    </div>
  );
}
```

## 📝 Checklist النهائي

1. ✅ Firebase installed
2. ⬜ Create Firebase project
3. ⬜ Enable Firestore + Authentication
4. ⬜ Get credentials من Firebase Console
5. ⬜ Update `.env.local` بالـ credentials
6. ⬜ Copy `firestore.rules` للـ Firebase Console
7. ⬜ Test login/signup
8. ⬜ Test database operations
9. 🚀 Deploy!

---

## 🌍 ملاحظة عن Database Location

**Database location** (مثل `europe-west1` أو `us-central1`):
- تتحدد في Firebase Console **مرة وحدة**
- **ما تتبدلش** بعد كدا
- اختار الأقرب ليك للـ performance
- **ما تحتاجهاش في `.env`** إلا إذا استعملت Cloud Functions

---

## ❓ أسئلة شائعة

**Q: هل Firebase Config سري؟**
A: لا، Firebase يقول صراحة إنها مش secrets. الحماية في Rules.

**Q: وين نحط database ID؟**
A: في `.env.local` كجزء من `VITE_FIREBASE_PROJECT_ID`

**Q: كيفاش نحمي البيانات؟**
A: Firestore Rules (ملف `firestore.rules`) هي الحماية الحقيقية

**Q: Production deployment?**
A: تأكد `.env.local` في `.gitignore`، واستعمل environment variables في hosting platform (Vercel/Netlify)
