import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';

// Pages
import Login from './pages/LoginNew';
import Register from './pages/Register';
import VerifyEmail from './pages/VerifyEmail';
import VerifyMFA from './pages/VerifyMFA';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import LandingPage from './pages/LandingPage';
import Scholarships from './pages/Scholarships';
import MyApplications from './pages/MyApplications';
import ApplicationForm from './pages/ApplicationForm';
import ApplicationDetails from './pages/ApplicationDetails';
import VerifyApplication from './pages/VerifyApplication';
import AdminUsers from './pages/AdminUsers';
import AdminScholarships from './pages/AdminScholarships';
import AuditLogs from './pages/AuditLogs';
import ReviewApplications from './pages/ReviewApplications';
import ScanVerification from './pages/ScanVerification';

// Layout
import Layout from './components/Layout';

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/app/dashboard" replace />;
  }

  return children;
};

const RoleRedirect = () => {
  const { user } = useAuth();

  if (user?.role === 'admin') return <Navigate to="/app/admin/users" replace />;
  if (user?.role === 'officer') return <Navigate to="/app/review-applications" replace />;
  return <Navigate to="/app/scholarships" replace />;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Toaster position="top-right" />
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/verify-mfa" element={<VerifyMFA />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/verify/:code" element={<VerifyApplication />} />

          {/* Protected Routes */}
          <Route path="/app" element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }>
            <Route index element={<Navigate to="/app/dashboard" replace />} />
            <Route path="dashboard" element={
              <ProtectedRoute>
                <RoleRedirect />
              </ProtectedRoute>
            } />
            <Route path="scholarships" element={<Scholarships />} />
            
            {/* Student Routes */}
            <Route path="my-applications" element={
              <ProtectedRoute allowedRoles={['student']}>
                <MyApplications />
              </ProtectedRoute>
            } />
            <Route path="scan-qr" element={
              <ProtectedRoute allowedRoles={['student']}>
                <ScanVerification />
              </ProtectedRoute>
            } />
            <Route path="apply/:scholarshipId" element={
              <ProtectedRoute allowedRoles={['student']}>
                <ApplicationForm />
              </ProtectedRoute>
            } />
            <Route path="application/:id/edit" element={
              <ProtectedRoute allowedRoles={['student']}>
                <ApplicationForm />
              </ProtectedRoute>
            } />
            <Route path="application/:id" element={<ApplicationDetails />} />


            {/* Officer Routes */}
            <Route path="review-applications" element={
              <ProtectedRoute allowedRoles={['officer', 'admin']}>
                <ReviewApplications />
              </ProtectedRoute>
            } />

            {/* Admin Routes */}
            <Route path="admin/users" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminUsers />
              </ProtectedRoute>
            } />
            <Route path="admin/scholarships" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminScholarships />
              </ProtectedRoute>
            } />
            <Route path="admin/audit-logs" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AuditLogs />
              </ProtectedRoute>
            } />
          </Route>

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
