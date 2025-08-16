// Utility functions for Review Circle functionality

export const getUserId = (user: any): string => {
  return String(user?.id || user?.user_id || user?.recipient?.id || user?.target_user?.id || '');
};

export const createOptimisticRequest = (
  currentUser: any,
  suggestion: any,
  userIdString: string,
  userName?: string
) => {
  const tempRequestId = Date.now() + Math.random() * 1000;
  
  return {
    id: tempRequestId,
    requester: {
      id: currentUser.id,
      name: currentUser.name,
      username: currentUser.username,
      avatar: currentUser.avatar
    },
    recipient: suggestion ? {
      id: suggestion.user.id,
      name: suggestion.user.name,
      username: suggestion.user.username,
      avatar: suggestion.user.avatar
    } : {
      id: parseInt(userIdString),
      name: userName || 'Unknown User',
      username: userName || 'unknown',
      avatar: null
    },
    message: `Hi ${userName || 'there'}! I'd like to connect with you in my review circle.`,
    status: 'pending' as const,
    created_at: new Date().toISOString()
  };
};

export const mergeServerAndOptimisticRequests = (
  serverRequests: any[],
  optimisticRequests: any[],
  localSentRequests: Set<string>
) => {
  if (localSentRequests.size === 0) {
    return serverRequests;
  }
  
  // Keep optimistic requests that aren't yet on server
  const validOptimisticRequests = optimisticRequests.filter(req => {
    const isTemporary = typeof req.id === 'number' && req.id > 1000000000000;
    if (isTemporary) {
      const recipientId = getUserId(req.recipient);
      return !serverRequests.some(serverReq => 
        getUserId(serverReq.recipient) === recipientId
      );
    }
    return false;
  });
  
  return [...serverRequests, ...validOptimisticRequests];
};

export const persistRequestToLocalStorage = (request: any, requestId?: number) => {
  try {
    const persistedSentRequests = JSON.parse(localStorage.getItem('reviewinn_sent_requests') || '[]');
    const updatedRequest = requestId ? { ...request, id: requestId } : request;
    
    const existingIndex = persistedSentRequests.findIndex((req: any) => 
      req.id === request.id || getUserId(req.recipient) === getUserId(request.recipient)
    );
    
    if (existingIndex >= 0) {
      persistedSentRequests[existingIndex] = updatedRequest;
    } else {
      persistedSentRequests.unshift(updatedRequest);
    }
    
    localStorage.setItem('reviewinn_sent_requests', JSON.stringify(persistedSentRequests));
  } catch (error) {
    console.error('Failed to persist to localStorage:', error);
  }
};