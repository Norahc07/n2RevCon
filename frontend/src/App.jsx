import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';

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
import Notifications from './pages/Notifications';
import ExportReports from './pages/ExportReports';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import AccountSettings from './pages/AccountSettings';
import SystemSettings from './pages/SystemSettings';
import ChangePassword from './pages/ChangePassword';

function App() {
  const { user } = useAuth();

  return (
    <>
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
                    <Route path="/projects/:id/edit" element={<AddProject />} />
                    <Route path="/projects/:id" element={<ProjectDetails />} />
                    <Route path="/notifications" element={<Notifications />} />
                    <Route path="/export" element={<ExportReports />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/settings" element={<Settings />}>
                      <Route index element={<Navigate to="/settings/account" replace />} />
                      <Route path="account" element={<AccountSettings />} />
                      <Route path="system" element={<SystemSettings />} />
                    </Route>
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
