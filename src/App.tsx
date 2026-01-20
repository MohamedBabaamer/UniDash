import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import Layout from './components/Layout';
import Home from './pages/Home';
import YearDashboard from './pages/YearDashboard';
import CourseDetail from './pages/CourseDetail';
import AdminModules from './pages/AdminModules';
import AdminChapters from './pages/AdminChapters';
import AdminSeries from './pages/AdminSeries';
import AdminUsers from './pages/AdminUsers';
import ExamSettings from './pages/ExamSettings';
import Profile from './pages/Profile';
import Login from './pages/Login';
import Signup from './pages/Signup';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <HashRouter>
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
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </HashRouter>
    </AuthProvider>
  );
};

export default App;