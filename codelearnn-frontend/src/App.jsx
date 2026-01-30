import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { CareerJourneyProvider } from './context/CareerJourneyContext';

// Common Components
import Navbar from './components/common/Navbar';
import LandingHeader from './components/common/LandingHeader';
import Footer from './components/common/Footer';
import Loader from './components/common/Loader';
import ScrollToTop from './components/common/ScrollToTop';
import SmoothScroll from './components/common/SmoothScroll';

// Public Pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import ContactPage from './pages/ContactPage';
import AboutPage from './pages/AboutPage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import TermsPage from './pages/TermsPage';
import CookiePolicyPage from './pages/CookiePolicyPage';

// Protected Pages
import DashboardPage from './pages/DashboardPage';
import VaultPage from './pages/VaultPage';
import VaultDetailPage from './pages/VaultDetailPage';
import CoursePage from './pages/CoursePage';
import VisualizationsPage from './pages/VisualizationsPage';
import AnalyzerPage from './pages/AnalyzerPage';
import CareerExplorerPage from './pages/CareerExplorerPage';
import CareerJourneyPage from './pages/CareerJourneyPage';
import ProfilePage from './pages/ProfilePage';
import AuthCallbackPage from './pages/AuthCallbackPage';
import CharchaPage from './pages/CharchaPage';
import PostDetail from './components/charcha/PostDetail';

// Blog and Opportunity Pages (Public with auth for writing)
import BlogsPage from './pages/BlogsPage';
import BlogDetailPage from './pages/BlogDetailPage';
import OpportunitiesPage from './pages/OpportunitiesPage';
import OpportunityDetailPage from './pages/OpportunityDetailPage';

// Check if we're in development mode
// Production domains where waitlist-only access should be enforced
const productionDomains = ['codelearnn.com', 'www.codelearnn.com', 'app.codelearnn.com'];
const isProductionDomain = productionDomains.some(domain => 
  window.location.hostname === domain || window.location.hostname.endsWith('.' + domain)
);

// Development mode: localhost OR explicit dev mode OR not on production domain
const isDevelopment = window.location.hostname === 'localhost' || 
                       window.location.hostname === '127.0.0.1' ||
                       import.meta.env.DEV === true;

// Protected Route Wrapper - redirects to login if not authenticated
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return <Loader isLoading={true} />;
  }
  
  // In production, redirect to home with waitlist instead of login
  if (!isAuthenticated) {
    if (isDevelopment) {
      return <Navigate to="/login" replace />;
    }
    return <Navigate to="/#waitlist" replace />;
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

// Conditional Header Component
const ConditionalHeader = () => {
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  
  // Landing pages that use minimal header in production
  const landingPaths = ['/', '/about', '/contact', '/privacy-policy', '/terms', '/cookie-policy'];
  const isLandingPage = landingPaths.includes(location.pathname);
  
  // In development, always show full Navbar
  if (isDevelopment) {
    return <Navbar />;
  }
  
  // In production:
  // - Show LandingHeader for landing pages when not authenticated  
  // - Show Navbar for authenticated users or internal pages
  if (isLandingPage && !isAuthenticated) {
    return <LandingHeader />;
  }
  
  return <Navbar />;
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
        <ConditionalHeader />
        
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
            <Route path="/about" element={<AboutPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/cookie-policy" element={<CookiePolicyPage />} />
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
            <Route path="/career-explorer" element={
              <ProtectedRoute>
                <CareerExplorerPage />
              </ProtectedRoute>
            } />
            <Route path="/my-career-journey" element={
              <ProtectedRoute>
                <CareerJourneyPage />
              </ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute>
                <ProfilePage />
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
        <CareerJourneyProvider>
          <Router>
            <AppContent />
          </Router>
        </CareerJourneyProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
