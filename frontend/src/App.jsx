import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import { ProtectedRoute, PublicOnlyRoute } from './components/ProtectedRoute';

// Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import StudentDashboard from './pages/StudentDashboard';
import IssueListPage from './pages/IssueListPage';
import ReportIssuePage from './pages/ReportIssuePage';
import IssueDetailPage from './pages/IssueDetailPage';
import EditIssuePage from './pages/EditIssuePage';
import StaffQueuePage from './pages/StaffQueuePage';
import AdminDashboard from './pages/AdminDashboard';
import AdminUsersPage from './pages/AdminUsersPage';
import { NotFoundPage, UnauthorizedPage } from './pages/ErrorPages';

function App() {
  return (
    <Router>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<PublicOnlyRoute><LoginPage /></PublicOnlyRoute>} />
            <Route path="/register" element={<PublicOnlyRoute><RegisterPage /></PublicOnlyRoute>} />
            <Route path="/unauthorized" element={<UnauthorizedPage />} />

            {/* Student routes */}
            <Route path="/dashboard" element={
              <ProtectedRoute roles={['student']}>
                <StudentDashboard />
              </ProtectedRoute>
            } />

            {/* Shared authenticated routes */}
            <Route path="/issues" element={
              <ProtectedRoute>
                <IssueListPage />
              </ProtectedRoute>
            } />
            <Route path="/issues/new" element={
              <ProtectedRoute roles={['student']}>
                <ReportIssuePage />
              </ProtectedRoute>
            } />
            <Route path="/issues/:id" element={
              <ProtectedRoute>
                <IssueDetailPage />
              </ProtectedRoute>
            } />
            <Route path="/issues/:id/edit" element={
              <ProtectedRoute roles={['student']}>
                <EditIssuePage />
              </ProtectedRoute>
            } />

            {/* Staff routes */}
            <Route path="/staff" element={
              <ProtectedRoute roles={['staff', 'admin']}>
                <StaffQueuePage />
              </ProtectedRoute>
            } />

            {/* Admin routes */}
            <Route path="/admin" element={
              <ProtectedRoute roles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            } />
            <Route path="/admin/users" element={
              <ProtectedRoute roles={['admin']}>
                <AdminUsersPage />
              </ProtectedRoute>
            } />

            {/* 404 */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
