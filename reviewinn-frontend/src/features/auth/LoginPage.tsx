import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import HomePage from '../common/HomePage';
import AuthModal from './components/AuthModal';
import { useUnifiedAuth } from '../../hooks/useUnifiedAuth';
import { useNotifications } from '../../shared/organisms/NotificationSystem';

const LoginPage: React.FC = () => {
  const [showAuthModal, setShowAuthModal] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const { showSuccess } = useNotifications();
  const { isAuthenticated } = useUnifiedAuth();

  useEffect(() => {
    // If user is already authenticated, redirect to home
    if (isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [navigate, isAuthenticated]);

  const handleAuthSuccess = () => {
    setShowAuthModal(false);
    showSuccess('Welcome!', 'You have been successfully signed in.');
    
    // Check if we have state from navigation (e.g., from review modal redirect)
    const state = location.state as any;
    
    // Redirect to intended destination if available
    const intendedDestination = sessionStorage.getItem('intendedDestination');
    if (intendedDestination && intendedDestination !== '/') {
      sessionStorage.removeItem('intendedDestination');
      navigate(intendedDestination, { replace: true });
    } else if (state?.from) {
      // Navigate back to the original page with the review modal state
      navigate(state.from, { 
        replace: true, 
        state: { 
          showReviewModal: state.showReviewModal,
          preselectedEntity: state.preselectedEntity 
        } 
      });
    } else {
      navigate('/', { replace: true });
    }
  };

  const handleAuthClose = () => {
    setShowAuthModal(false);
    navigate('/', { replace: true });
  };

  return (
    <div className="relative">
      {/* Homepage as background */}
      <HomePage />
      
      {/* Auth Modal overlay */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={handleAuthClose}
        onSuccess={handleAuthSuccess}
      />
    </div>
  );
};

export default LoginPage;