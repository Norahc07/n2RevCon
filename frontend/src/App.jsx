import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';

// Pages
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import SignUpSuccess from './pages/SignUpSuccess';
import VerifyEmail from './pages/VerifyEmail';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import ProjectList from './pages/ProjectList';
import ProjectsDescription from './pages/ProjectsDescription';
import ProjectsRevenueCosts from './pages/ProjectsRevenueCosts';
import ProjectsBillingCollections from './pages/ProjectsBillingCollections';
import ProjectDetails from './pages/ProjectDetails';
import AddProject from './pages/AddProject';
import RecentlyDeleted from './pages/RecentlyDeleted';
import Notifications from './pages/Notifications';
import ExportReports from './pages/ExportReports';
import Profile from './pages/Profile';
import AccountSettings from './pages/AccountSettings';
import SystemSettings from './pages/SystemSettings';
import ChangePassword from './pages/ChangePassword';
import Security from './pages/Security';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';
import GuestView from './pages/GuestView';

function App() {
  const { user } = useAuth();

  // Immediately set white background on mount
  React.useEffect(() => {
    // Set white background immediately
    const setWhiteBg = () => {
      if (document.documentElement) {
        document.documentElement.style.setProperty('background-color', '#FFFFFF', 'important');
        document.documentElement.style.setProperty('background', '#FFFFFF', 'important');
      }
      if (document.body) {
        document.body.style.setProperty('background-color', '#FFFFFF', 'important');
        document.body.style.setProperty('background', '#FFFFFF', 'important');
      }
      const root = document.getElementById('root');
      if (root) {
        root.style.setProperty('background-color', '#FFFFFF', 'important');
        root.style.setProperty('background', '#FFFFFF', 'important');
      }
    };
    
    setWhiteBg();
    // Set multiple times to ensure it sticks
    requestAnimationFrame(setWhiteBg);
    setTimeout(setWhiteBg, 0);
    setTimeout(setWhiteBg, 10);
  }, []);

  return (
    <>
      <Routes>
        <Route path="/" element={!user ? <LandingPage /> : <Navigate to="/dashboard" />} />
        <Route path="/login" element={!user ? <Login /> : <Navigate to="/dashboard" />} />
        <Route path="/signup" element={!user ? <SignUp /> : <Navigate to="/dashboard" />} />
        <Route path="/signup-success" element={!user ? <SignUpSuccess /> : <Navigate to="/dashboard" />} />
        <Route path="/verify-email/:token" element={!user ? <VerifyEmail /> : <Navigate to="/dashboard" />} />
        <Route path="/forgot-password" element={!user ? <ForgotPassword /> : <Navigate to="/dashboard" />} />
        <Route path="/reset-password/:token" element={!user ? <ResetPassword /> : <Navigate to="/dashboard" />} />
        
        {/* Password change page - standalone, no auth needed (token is verification) */}
        <Route path="/change-password/:token" element={!user ? <ChangePassword /> : <Navigate to="/dashboard" />} />
        
        {/* Public pages - accessible without authentication */}
        <Route path="/security" element={<Security />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />
        
        {/* Guest access routes - no authentication required */}
        <Route path="/guest/:type/:token" element={<GuestView />} />
          
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <Layout>
                  <Routes>
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/projects" element={<ProjectsDescription />} />
                    <Route path="/projects/revenue-costs" element={<ProjectsRevenueCosts />} />
                    <Route path="/projects/billing-collections" element={<ProjectsBillingCollections />} />
                    <Route path="/projects/new" element={<AddProject />} />
                    <Route path="/projects/deleted" element={<RecentlyDeleted />} />
                    <Route path="/projects/:id/edit" element={<AddProject />} />
                    <Route path="/projects/:id" element={<ProjectDetails />} />
                    <Route path="/notifications" element={<Notifications />} />
                    <Route path="/export" element={<ExportReports />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/settings/account" element={<Navigate to="/settings/account/profile" replace />} />
                    <Route path="/settings/account/profile" element={<AccountSettings />} />
                    <Route path="/settings/account/password" element={<AccountSettings />} />
                    <Route path="/settings/account/sessions" element={<AccountSettings />} />
                    <Route path="/settings/account/status" element={<AccountSettings />} />
                    <Route path="/settings/system" element={<Navigate to="/settings/system/company" replace />} />
                    <Route path="/settings/system/company" element={<SystemSettings />} />
                    <Route path="/settings/system/users" element={<SystemSettings />} />
                    <Route path="/settings/system/project" element={<SystemSettings />} />
                    <Route path="/settings/system/notifications" element={<SystemSettings />} />
                    <Route path="/settings/system/backup" element={<SystemSettings />} />
                    <Route path="/settings/system/audit" element={<SystemSettings />} />
                    <Route path="/settings/system/pwa" element={<SystemSettings />} />
                    <Route path="/settings/system/guest" element={<SystemSettings />} />
                    <Route path="/settings" element={<Navigate to="/settings/account/profile" replace />} />
                    <Route path="*" element={<Navigate to="/dashboard" />} />
                  </Routes>
                </Layout>
              </ProtectedRoute>
            }
          />
        </Routes>
      </>
  );
}

export default App;
