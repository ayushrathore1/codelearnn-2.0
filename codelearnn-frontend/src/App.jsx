import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';

// Common Components
import Navbar from './components/common/Navbar';
import Footer from './components/common/Footer';
import Loader from './components/common/Loader';
import ScrollToTop from './components/common/ScrollToTop';
import SmoothScroll from './components/common/SmoothScroll';

// Public Pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import ContactPage from './pages/ContactPage';

// Protected Pages
import DashboardPage from './pages/DashboardPage';
import VaultPage from './pages/VaultPage';
import VaultDetailPage from './pages/VaultDetailPage';
import CoursePage from './pages/CoursePage';
import VisualizationsPage from './pages/VisualizationsPage';
import AnalyzerPage from './pages/AnalyzerPage';
import CareerExplorerPage from './pages/CareerExplorerPage';
import ProfilePage from './pages/ProfilePage';
import AuthCallbackPage from './pages/AuthCallbackPage';
import CharchaPage from './pages/CharchaPage';
import PostDetail from './components/charcha/PostDetail';

// Blog and Opportunity Pages (Public with auth for writing)
import BlogsPage from './pages/BlogsPage';
import BlogDetailPage from './pages/BlogDetailPage';
import OpportunitiesPage from './pages/OpportunitiesPage';
import OpportunityDetailPage from './pages/OpportunityDetailPage';

// Protected Route Wrapper - redirects to login if not authenticated
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return <Loader isLoading={true} />;
  }
  
  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

// Auth Route Wrapper - redirects to dashboard if already authenticated
const AuthRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return <Loader isLoading={true} />;
  }
  
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
};

function AppContent() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate initial load
    const timer = setTimeout(() => {
      setLoading(false);
    }, 800);

    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <ScrollToTop />
      <SmoothScroll />
      <Loader isLoading={loading} />
      
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="min-h-screen flex flex-col"
      >
        <Navbar />
        
        <AnimatePresence mode="wait">
          <Routes>
            {/* Auth Routes - only these are public */}
            <Route path="/login" element={
              <AuthRoute>
                <LoginPage />
              </AuthRoute>
            } />
            <Route path="/signup" element={
              <AuthRoute>
                <SignupPage />
              </AuthRoute>
            } />
            
            {/* OAuth Callback Route */}
            <Route path="/auth/callback" element={<AuthCallbackPage />} />
            
            {/* Admin Login Route - Hidden from public navbar */}
            <Route path="/admin" element={
              <AuthRoute>
                <LoginPage />
              </AuthRoute>
            } />
            
            {/* Public Pages */}
            <Route path="/" element={<HomePage />} />
            <Route path="/blogs" element={<BlogsPage />} />
            <Route path="/blogs/:slug" element={<BlogDetailPage />} />
            <Route path="/opportunities" element={<OpportunitiesPage />} />
            <Route path="/opportunities/:slug" element={<OpportunityDetailPage />} />
            
            {/* Protected Routes */}
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            } />
            <Route path="/vault" element={
              <ProtectedRoute>
                <VaultPage />
              </ProtectedRoute>
            } />
            <Route path="/vault/course/:slug" element={
              <ProtectedRoute>
                <CoursePage />
              </ProtectedRoute>
            } />
            <Route path="/vault/:id" element={
              <ProtectedRoute>
                <VaultDetailPage />
              </ProtectedRoute>
            } />
            <Route path="/visualizations" element={
              <ProtectedRoute>
                <VisualizationsPage />
              </ProtectedRoute>
            } />
            <Route path="/visualizations/:id" element={
              <ProtectedRoute>
                <VisualizationsPage />
              </ProtectedRoute>
            } />
            <Route path="/analyzer" element={
              <ProtectedRoute>
                <AnalyzerPage />
              </ProtectedRoute>
            } />
            <Route path="/career" element={
              <ProtectedRoute>
                <CareerExplorerPage />
              </ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            } />
            <Route path="/contact" element={
              <ProtectedRoute>
                <ContactPage />
              </ProtectedRoute>
            } />
            <Route path="/charcha" element={
              <ProtectedRoute>
                <CharchaPage />
              </ProtectedRoute>
            } />
            <Route path="/charcha/post/:idOrSlug" element={
              <ProtectedRoute>
                <PostDetail />
              </ProtectedRoute>
            } />
            
            {/* Legacy redirect */}
            <Route path="/resources" element={<Navigate to="/vault" replace />} />
            
            {/* Catch all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AnimatePresence>
        
        <Footer />
      </motion.div>
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <Router>
          <AppContent />
        </Router>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
