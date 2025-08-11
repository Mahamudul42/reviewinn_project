import React from 'react';
import { useUnifiedAuth } from '../../hooks/useUnifiedAuth';

const MessengerPageTest: React.FC = () => {
  const { user, isAuthenticated, isLoading } = useUnifiedAuth();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <div>Please login to access messenger</div>;
  }

  return (
    <div>
      <h1>Messenger Test Page</h1>
      <p>User: {user?.name}</p>
    </div>
  );
};

export default MessengerPageTest;