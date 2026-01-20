# UniDash - University Academic Dashboard

Modern academic management system for universities, built with React, TypeScript, and Firebase.

## ✨ Features

### For Students
- 📚 Browse courses by academic year and level
- 📖 Access course chapters with PDF viewer
- 📝 Download TD/TP/Exam series
- 🔒 Timed access to solutions (controlled by exam dates)
- 👤 Profile management

### For Administrators
- 📚 Full course/module management
- 📖 Chapter management
- 📝 TD/TP/Exam series management
- 🔐 Global exam settings & solution lock control
- 👥 User management & role assignment

### Security Features
- 🔒 Role-based access control (Student/Admin)
- 🔐 Secure PDF viewer (hides Drive URLs)
- 🛡️ Firebase Authentication
- 📋 Firestore security rules

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ 
- npm or yarn
- Firebase account

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/YOUR_USERNAME/UniDash.git
cd UniDash
```

2. **Install dependencies**
```bash
npm install
```

3. **Setup Environment Variables**

Create a `.env.local` file in the root directory:

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

4. **Firebase Setup**

- Create a Firebase project at [Firebase Console](https://console.firebase.google.com)
- Enable **Email/Password Authentication**
- Create a **Firestore Database**
- Copy your Firebase config to `.env.local`

5. **Deploy Firestore Rules**
```bash
firebase deploy --only firestore:rules
```

6. **Create First Admin User**

After deploying, create a user through Firebase Console and add this document to `users` collection:

```json
{
  "email": "admin@example.com",
  "name": "Admin User",
  "role": "admin",
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

7. **Run Development Server**
```bash
npm run dev
```

Visit `http://localhost:3000`

## 📁 Project Structure

```
UniDash/
├── components/          # Reusable React components
│   ├── Layout.tsx       # Main layout with navigation
│   ├── ProtectedRoute.tsx
│   └── SecurePDFViewer.tsx
├── contexts/            # React contexts
│   └── AuthContext.tsx  # Authentication state management
├── pages/               # Page components
│   ├── Home.tsx         # Year/Level selection
│   ├── YearDashboard.tsx # Course list
│   ├── CourseDetail.tsx  # Course details with series
│   └── AdminModules.tsx  # Admin course management
├── services/            # Business logic
│   ├── auth.service.ts
│   └── database.service.ts
├── firebase.config.ts   # Firebase initialization
├── types.ts             # TypeScript type definitions
└── firestore.rules      # Firestore security rules
```

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS, Material Symbols
- **Backend**: Firebase (Authentication, Firestore Database)

## 📚 Key Features

### Solution Lock System
Administrators set a global exam date. Before this date, solutions are locked with countdown timer. After exam date, all solutions become available.

### Secure PDF Viewer
- Opens Google Drive files in embedded viewer
- Uses `/preview` format to minimize URL exposure
- Requires files to be set as "Anyone with the link"

## 🔐 Security

All sensitive data (Firebase config, API keys) is stored in `.env.local` which is never committed to the repository. See [SECURITY_GUIDE.md](SECURITY_GUIDE.md) for detailed security information.

## 📖 Documentation

- [Database Setup Guide](DATABASE_SETUP.md)
- [Security Guide](SECURITY_GUIDE.md)

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

---

Made with ❤️ for educational purposes
