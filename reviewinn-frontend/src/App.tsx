import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Suspense, lazy } from 'react';
// Homepage component (now using the enhanced design)
import Layout from './shared/layouts/Layout';
import ProtectedRoute from './shared/components/ProtectedRoute';
import { ConfirmationProvider } from './shared/components/ConfirmationSystem';
import { AuthProvider } from './contexts/AuthContext';
import { PanelDataProvider } from './contexts/PanelDataContext';
import { authService } from './api/auth';
import { initializeAuthManager } from './services/authInterface';
import { ReviewInnAuthService } from './services/ReviewInnAuthService';
import RegistrationBadgeTrigger from './features/badges/components/RegistrationBadgeTrigger';
import "./styles/App.css";

// Make auth service globally available for demo notifications
(window as { authService: typeof authService }).authService = authService;

// Initialize the unified auth system
const reviewInnAuthService = new ReviewInnAuthService();
const authManager = initializeAuthManager(reviewInnAuthService);

// Make auth manager globally available for debugging
(window as { authManager: typeof authManager }).authManager = authManager;

// Lazy load components for better performance
const HomePage = lazy(() => import('./features/common/HomePage'));
const LoginPage = lazy(() => import('./features/auth/LoginPage'));
const AddEntityPage = lazy(() => import('./features/entities/AddEntityPageModular'));
const EntityListPage = lazy(() => import('./features/entities/EntityListPage'));
const EntityDetailPage = lazy(() => import('./features/entities/EntityDetailPage'));
const DashboardPage = lazy(() => import('./features/common/DashboardPage'));
const SearchPage = lazy(() => import('./features/search/SearchPage'));
const ModularUserProfilePage = lazy(() => import('./features/profile/ModularUserProfilePage'));
const ReviewPage = lazy(() => import('./features/reviews/ReviewPage'));
const MessengerPage = lazy(() => import('./features/messaging/MessengerPage'));
const ReviewCirclePage = lazy(() => import('./features/circle/ReviewCirclePage'));
const ShareableReviewPage = lazy(() => import('./features/reviews/ShareableReviewPage'));
const NotificationsPage = lazy(() => import('./features/notifications/NotificationsPage'));

// Legal pages  
const AboutPage = lazy(() => import('./features/legal/AboutPage'));
const PrivacyPolicyPage = lazy(() => import('./features/legal/PrivacyPolicyPage'));
const TermsOfServicePage = lazy(() => import('./features/legal/TermsOfServicePage'));
const ConsumerHealthPrivacyPage = lazy(() => import('./features/legal/ConsumerHealthPrivacyPage'));
const CookiesPolicyPage = lazy(() => import('./features/legal/CookiesPolicyPage'));
const AccessibilityPage = lazy(() => import('./features/legal/AccessibilityPage'));
const DataProtectionPage = lazy(() => import('./features/legal/DataProtectionPage'));
const ContentGuidelinesPage = lazy(() => import('./features/legal/ContentGuidelinesPage'));
const ContactPage = lazy(() => import('./features/legal/ContactPage'));
const HelpCenterPage = lazy(() => import('./features/legal/HelpCenterPage'));
const ReportAbusePage = lazy(() => import('./features/legal/ReportAbusePage'));
const FeedbackPage = lazy(() => import('./features/legal/FeedbackPage'));

// Loading component
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
  </div>
);

function App() {
  return (
    <AuthProvider>
      <PanelDataProvider>
        <ConfirmationProvider>
          <Router>
            <Suspense fallback={<PageLoader />}>
              {/* Badge System Components */}
              <RegistrationBadgeTrigger />
              
              <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<HomePage />} />
              <Route path="home" element={<HomePage />} />
              <Route path="login" element={<LoginPage />} />
              <Route path="search" element={<SearchPage />} />
              <Route path="dashboard" element={
                <ProtectedRoute 
                  title="Dashboard Access Required" 
                  description="View your personalized dashboard with review analytics, achievements, and activity insights."
                  feature="dashboard"
                >
                  <DashboardPage />
                </ProtectedRoute>
              } />
              <Route path="messenger" element={
                <ProtectedRoute 
                  title="Messaging Access Required" 
                  description="Connect with other reviewers and join conversations about your favorite products and services."
                  feature="messages"
                >
                  <MessengerPage />
                </ProtectedRoute>
              } />
              <Route path="notifications" element={
                <ProtectedRoute 
                  title="Notifications Access Required" 
                  description="Stay updated with personalized notifications about reviews, comments, and community activities."
                  feature="notifications"
                >
                  <NotificationsPage />
                </ProtectedRoute>
              } />
              <Route path="profile/:userIdentifier?" element={
                <ProtectedRoute 
                  title="Profile Access Required" 
                  description="Manage your profile, review history, and connect with the ReviewInn community."
                  feature="profile"
                >
                  <ModularUserProfilePage />
                </ProtectedRoute>
              } />
              <Route path="circle" element={
                <ProtectedRoute 
                  title="Review Circle Access Required" 
                  description="Join trusted review circles and share authentic experiences with your network."
                  feature="circle"
                >
                  <ReviewCirclePage />
                </ProtectedRoute>
              } />
              <Route path="add-entity" element={
                <ProtectedRoute 
                  title="Add Entity Access Required" 
                  description="Contribute to our database by adding new businesses, products, or services for others to review."
                  feature="add-entity"
                >
                  <AddEntityPage />
                </ProtectedRoute>
              } />
              <Route path="entity" element={<EntityListPage />} />
              <Route path="entity/:id" element={<EntityDetailPage />} />
              <Route path="entity/:id/add-review" element={<Navigate to="../:id" replace />} />
              <Route path="/review/:entityId" element={<ReviewPage />} />
              
              {/* Shareable review routes */}
              <Route path="review/share/:reviewId" element={<ShareableReviewPage />} />
              
              {/* Legal pages */}
              <Route path="about" element={<AboutPage />} />
              <Route path="privacy-policy" element={<PrivacyPolicyPage />} />
              <Route path="terms-of-service" element={<TermsOfServicePage />} />
              <Route path="consumer-health-privacy" element={<ConsumerHealthPrivacyPage />} />
              <Route path="cookies-policy" element={<CookiesPolicyPage />} />
              <Route path="accessibility" element={<AccessibilityPage />} />
              <Route path="data-protection" element={<DataProtectionPage />} />
              <Route path="content-guidelines" element={<ContentGuidelinesPage />} />
              <Route path="contact" element={<ContactPage />} />
              <Route path="help" element={<HelpCenterPage />} />
              <Route path="report-abuse" element={<ReportAbusePage />} />
              <Route path="feedback" element={<FeedbackPage />} />
            </Route>
              </Routes>
            </Suspense>
          </Router>
        </ConfirmationProvider>
      </PanelDataProvider>
    </AuthProvider>
  );
}

export default App;
