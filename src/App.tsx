import React, { Suspense, lazy } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import Layout from './components/Layout';
import RouteErrorBoundary from './components/RouteErrorBoundary';

// Lazy-load page components to reduce initial bundle size
const Home = lazy(() => import('./pages/Home'));
const YearDashboard = lazy(() => import('./pages/YearDashboard'));
const CourseDetail = lazy(() => import('./pages/CourseDetail'));
const AdminModules = lazy(() => import('./pages/AdminModules'));
const AdminChapters = lazy(() => import('./pages/AdminChapters'));
const AdminSeries = lazy(() => import('./pages/AdminSeries'));
const AdminUsers = lazy(() => import('./pages/AdminUsers'));
const ExamSettings = lazy(() => import('./pages/ExamSettings'));
const FirestoreSummary = lazy(() => import('./pages/FirestoreSummary'));
const Profile = lazy(() => import('./pages/Profile'));
const Login = lazy(() => import('./pages/Login'));
const Signup = lazy(() => import('./pages/Signup'));

const App: React.FC = () => {
  return (
    <AuthProvider>
      <HashRouter>
        <RouteErrorBoundary>
          <Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
            <Routes>
              {/* Auth Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />

              {/* Protected App Routes */}
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <Layout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Home />} />
                <Route path="dashboard" element={<YearDashboard />} />
                <Route path="course/:id" element={<CourseDetail />} />
                <Route path="profile" element={<Profile />} />
                <Route path="admin/modules" element={<AdminRoute><AdminModules /></AdminRoute>} />
                <Route path="admin/chapters" element={<AdminRoute><AdminChapters /></AdminRoute>} />
                <Route path="admin/series" element={<AdminRoute><AdminSeries /></AdminRoute>} />
                <Route path="admin/users" element={<AdminRoute><AdminUsers /></AdminRoute>} />
                <Route path="admin/exam-settings" element={<AdminRoute><ExamSettings /></AdminRoute>} />
                <Route path="admin/firestore-summary" element={<AdminRoute><FirestoreSummary /></AdminRoute>} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Route>
            </Routes>
          </Suspense>
        </RouteErrorBoundary>
      </HashRouter>
    </AuthProvider>
  );
};

export default App;