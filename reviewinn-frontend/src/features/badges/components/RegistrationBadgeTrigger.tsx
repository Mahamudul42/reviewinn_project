import { useEffect, useState } from 'react';
import { useUnifiedAuth } from '../../../hooks/useUnifiedAuth';
import { badgeService } from '../services/badgeService';
import type { UserBadge } from '../types/badgeTypes';
import BadgeNotification from './BadgeNotification';

/**
 * Component that automatically triggers the registration badge
 * when a user signs up or logs in for the first time
 */
const RegistrationBadgeTrigger: React.FC = () => {
  const { user, isAuthenticated } = useUnifiedAuth();
  const [welcomeBadge, setWelcomeBadge] = useState<UserBadge | null>(null);
  const [hasChecked, setHasChecked] = useState(false);

  useEffect(() => {
    if (isAuthenticated && user?.id && !hasChecked) {
      checkAndUnlockRegistrationBadge();
    }
  }, [isAuthenticated, user?.id, hasChecked]);

  // Listen for new user registration events for immediate badge awarding
  useEffect(() => {
    const handleUserRegistered = (event: CustomEvent) => {
      console.log('New user registered, checking for registration badge...', event.detail);
      if (isAuthenticated && user?.id && !hasChecked) {
        setTimeout(() => {
          checkAndUnlockRegistrationBadge();
        }, 500); // Small delay to ensure auth state is fully updated
      }
    };

    window.addEventListener('userRegistered', handleUserRegistered as EventListener);
    return () => {
      window.removeEventListener('userRegistered', handleUserRegistered as EventListener);
    };
  }, [isAuthenticated, user?.id, hasChecked]);

  const checkAndUnlockRegistrationBadge = async () => {
    if (!user?.id) return;

    try {
      setHasChecked(true);
      
      // Check if user already has the registration badge
      const userBadges = await badgeService.getUserBadges(user.id);
      console.log('[RegistrationBadgeTrigger] User badges:', userBadges);
      
      const hasWelcomeBadge = userBadges.some(
        ub => ub.badge?.requirements?.type === 'registration' || 
              ub.badge?.name?.toLowerCase().includes('welcome') ||
              ub.badge?.name?.toLowerCase().includes('registration')
      );

      console.log('[RegistrationBadgeTrigger] Has welcome badge:', hasWelcomeBadge);

      // If they don't have it, unlock it
      if (!hasWelcomeBadge) {
        const registrationBadge = await badgeService.unlockRegistrationBadge(user.id);
        
        if (registrationBadge) {
          console.log('🎉 Welcome badge unlocked for new user!');
          setWelcomeBadge(registrationBadge);
          
          // Also check for any other badges they might qualify for
          setTimeout(async () => {
            await badgeService.checkForNewBadges(user.id, 'registration');
          }, 2000);
        }
      }
    } catch (error: any) {
      // Don't treat 409 conflicts as errors - the badge is already unlocked
      if (error?.status === 409 || error?.response?.status === 409) {
        console.log('[RegistrationBadgeTrigger] Registration badge already unlocked');
        return;
      }
      console.error('Failed to check/unlock registration badge:', error);
    }
  };

  // Don't render anything if not authenticated or no badge to show
  if (!isAuthenticated || !welcomeBadge) {
    return null;
  }

  return (
    <BadgeNotification
      badge={welcomeBadge.badge}
      onClose={() => setWelcomeBadge(null)}
      duration={8000} // Show welcome badge longer
    />
  );
};

export default RegistrationBadgeTrigger;