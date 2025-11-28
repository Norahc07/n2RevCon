import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import SplashScreen from './components/SplashScreen';

// Pages
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import SignUp from './pages/SignUp';
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

function App() {
  const { user } = useAuth();

  return (
    <>
      <SplashScreen />
      <Routes>
        <Route path="/" element={!user ? <LandingPage /> : <Navigate to="/dashboard" />} />
        <Route path="/login" element={!user ? <Login /> : <Navigate to="/dashboard" />} />
        <Route path="/signup" element={!user ? <SignUp /> : <Navigate to="/dashboard" />} />
        <Route path="/forgot-password" element={!user ? <ForgotPassword /> : <Navigate to="/dashboard" />} />
        <Route path="/reset-password/:token" element={!user ? <ResetPassword /> : <Navigate to="/dashboard" />} />
        
        {/* Password change page - standalone, no auth needed (token is verification) */}
        <Route path="/change-password/:token" element={!user ? <ChangePassword /> : <Navigate to="/dashboard" />} />
          
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
