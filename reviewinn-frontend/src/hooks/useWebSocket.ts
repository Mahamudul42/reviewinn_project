import { useEffect, useRef, useState, useCallback } from 'react';
import { useUnifiedAuth } from './useUnifiedAuth';

export interface WebSocketMessage {
  type: string;
  [key: string]: any;
}

export interface UseWebSocketOptions {
  onMessage?: (message: WebSocketMessage) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Event) => void;
  shouldReconnect?: boolean;
  reconnectAttempts?: number;
  reconnectInterval?: number;
  endpoint?: string; // Allow custom WebSocket endpoint
  enabled?: boolean; // Allow disabling WebSocket connection
}

export const useWebSocket = (options: UseWebSocketOptions = {}) => {
  const { getToken } = useUnifiedAuth();
  const {
    onMessage,
    onConnect,
    onDisconnect,
    onError,
    shouldReconnect = true,
    reconnectAttempts = 5,
    reconnectInterval = 3000,
    endpoint = 'messenger', // Default to messenger endpoint
    enabled = true, // Default to enabled
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [hasAttemptedConnection, setHasAttemptedConnection] = useState(false);
  const websocketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const messageQueueRef = useRef<WebSocketMessage[]>([]);
  const connectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const getWebSocketUrl = useCallback(() => {
    const token = getToken();
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    
    // Use the current window location for WebSocket connections
    // In Docker, this will be the exposed port; in development, it's the dev server
    let wsHost: string;
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      // Development or local access - use localhost:8000
      wsHost = `${window.location.hostname}:8000`;
    } else {
      // Production or other environments - use current host
      wsHost = window.location.host;
    }
    
    const url = `${protocol}//${wsHost}/ws/${endpoint}/${token}`;
    console.log('WebSocket URL:', url);
    console.log('Token preview:', token ? token.substring(0, 50) + '...' : 'NO TOKEN');
    return url;
  }, [endpoint, getToken]);

  const connect = useCallback(() => {
    if (isConnecting || isConnected) return;

    const token = getToken();
    if (!token) {
      console.log('No auth token available for WebSocket connection');
      setHasAttemptedConnection(true);
      return;
    }

    setIsConnecting(true);
    setHasAttemptedConnection(true);
    
    // Set a connection timeout
    connectionTimeoutRef.current = setTimeout(() => {
      if (websocketRef.current && websocketRef.current.readyState === WebSocket.CONNECTING) {
        console.log('WebSocket connection timeout, closing...');
        websocketRef.current.close();
        setIsConnecting(false);
      }
    }, 10000); // 10 second timeout
    
    try {
      const ws = new WebSocket(getWebSocketUrl());
      websocketRef.current = ws;

      ws.onopen = () => {
        console.log('✅ WebSocket connected successfully');
        console.log('🔗 WebSocket URL:', getWebSocketUrl());
        console.log('👤 Connected for user token:', token ? token.substring(0, 20) + '...' : 'NO TOKEN');
        if (connectionTimeoutRef.current) {
          clearTimeout(connectionTimeoutRef.current);
          connectionTimeoutRef.current = null;
        }
        setIsConnected(true);
        setIsConnecting(false);
        reconnectAttemptsRef.current = 0;
        onConnect?.();

        // Send queued messages
        while (messageQueueRef.current.length > 0) {
          const message = messageQueueRef.current.shift();
          if (message) {
            ws.send(JSON.stringify(message));
          }
        }
      };

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          onMessage?.(message);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      ws.onclose = (event) => {
        console.log(`❌ WebSocket disconnected (${event.code}): ${event.reason || 'No reason provided'}`);
        console.log('❌ WebSocket close event details:', {
          code: event.code,
          reason: event.reason,
          wasClean: event.wasClean,
          type: event.type,
          timestamp: new Date().toISOString()
        });
        
        // Log common error codes
        if (event.code === 1006) {
          console.log('💡 Error 1006: Abnormal closure - server may have crashed or network issue');
        } else if (event.code === 1000) {
          console.log('✅ Error 1000: Normal closure');
        } else if (event.code === 1001) {
          console.log('👋 Error 1001: Going away (page refresh/navigate)');
        } else if (event.code === 1011) {
          console.log('🛠️ Error 1011: Server error');
        }
        
        if (connectionTimeoutRef.current) {
          clearTimeout(connectionTimeoutRef.current);
          connectionTimeoutRef.current = null;
        }
        setIsConnected(false);
        setIsConnecting(false);
        websocketRef.current = null;
        onDisconnect?.();

        // Only attempt reconnection for certain close codes (not user-initiated)
        const shouldAttemptReconnect = event.code !== 1000 && // Normal closure
                                     event.code !== 1001 && // Going away
                                     event.code !== 1005;   // No status received
                                     
        if (shouldReconnect && shouldAttemptReconnect && reconnectAttemptsRef.current < reconnectAttempts) {
          reconnectAttemptsRef.current++;
          const delay = Math.min(reconnectInterval * Math.pow(1.5, reconnectAttemptsRef.current - 1), 30000);
          console.log(`⏰ Reconnecting in ${delay/1000}s (attempt ${reconnectAttemptsRef.current}/${reconnectAttempts})...`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, delay);
        } else if (reconnectAttemptsRef.current >= reconnectAttempts) {
          console.log('❌ Max reconnection attempts reached. WebSocket disabled.');
        }
      };

      ws.onerror = (error) => {
        console.log('WebSocket connection error:', error);
        console.log('URL attempted:', getWebSocketUrl());
        console.log('💡 Messenger will work in polling mode without real-time updates');
        if (connectionTimeoutRef.current) {
          clearTimeout(connectionTimeoutRef.current);
          connectionTimeoutRef.current = null;
        }
        setIsConnecting(false);
        onError?.(error);
      };

    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      setIsConnecting(false);
    }
  }, [isConnecting, isConnected, getToken, getWebSocketUrl, onConnect, onMessage, onDisconnect, onError, shouldReconnect, reconnectAttempts, reconnectInterval]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    if (connectionTimeoutRef.current) {
      clearTimeout(connectionTimeoutRef.current);
      connectionTimeoutRef.current = null;
    }

    if (websocketRef.current) {
      websocketRef.current.close(1000, 'User disconnected');
      websocketRef.current = null;
    }

    setIsConnected(false);
    setIsConnecting(false);
  }, []);

  const sendMessage = useCallback((message: WebSocketMessage) => {
    if (websocketRef.current && isConnected && websocketRef.current.readyState === WebSocket.OPEN) {
      websocketRef.current.send(JSON.stringify(message));
    } else {
      // Queue message for when connection is established
      messageQueueRef.current.push(message);
      
      // Try to connect if not connected
      if (!isConnected && !isConnecting) {
        connect();
      }
    }
  }, [isConnected, isConnecting, connect]);

  // Auto-connect when auth state changes (with delay to avoid rapid reconnections)
  useEffect(() => {
    const token = getToken();
    
    // Only connect if enabled and token exists
    if (enabled && token && !isConnected && !isConnecting) {
      console.log('🔌 WebSocket auto-connect check. Token exists:', !!token);
      
      // Small delay to avoid rapid connection attempts
      const connectTimer = setTimeout(() => {
        connect();
      }, 1000);
      
      return () => clearTimeout(connectTimer);
    } else if ((!enabled || !token) && (isConnected || isConnecting)) {
      console.log('🔌 Disconnecting WebSocket (disabled or no token)');
      disconnect();
    }
  }, [connect, disconnect, isConnected, isConnecting, enabled, getToken]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  // Ping to keep connection alive
  useEffect(() => {
    if (!isConnected) return;

    const pingInterval = setInterval(() => {
      sendMessage({ type: 'ping' });
    }, 30000); // Ping every 30 seconds

    return () => clearInterval(pingInterval);
  }, [isConnected, sendMessage]);

  return {
    isConnected,
    isConnecting,
    hasAttemptedConnection,
    connect,
    disconnect,
    sendMessage,
  };
};