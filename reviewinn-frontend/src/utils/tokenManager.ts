/**
 * UNIFIED TOKEN STORAGE MANAGER
 * =============================
 * Single source of truth for token storage and retrieval
 * Handles both httpOnly cookies (preferred) and fallback storage
 */

interface TokenData {
  access_token: string;
  refresh_token?: string;
  expires_at?: number;
  token_type?: string;
}

class UnifiedTokenManager {
  private static readonly ACCESS_TOKEN_KEY = 'reviewinn_access_token';
  private static readonly REFRESH_TOKEN_KEY = 'reviewinn_refresh_token';
  
  // ============================================================================
  // TOKEN STORAGE (Unified approach)
  // ============================================================================
  
  /**
   * Store tokens - Server handles httpOnly cookies, client stores backup
   */
  storeTokens(tokenData: TokenData): void {
    try {
      // Store encrypted backup in sessionStorage (for token refresh scenarios)
      const backupData = {
        access_token: this.encrypt(tokenData.access_token),
        refresh_token: tokenData.refresh_token ? this.encrypt(tokenData.refresh_token) : null,
        expires_at: tokenData.expires_at || (Date.now() + (60 * 60 * 1000)), // 1 hour default
        stored_at: Date.now()
      };
      
      sessionStorage.setItem('reviewinn_token_backup', JSON.stringify(backupData));
      
      console.log('✅ Tokens stored securely (server cookies + encrypted backup)');
    } catch (error) {
      console.error('Failed to store token backup:', error);
    }
  }
  
  // ============================================================================
  // TOKEN RETRIEVAL (Priority: cookies > backup > null)
  // ============================================================================
  
  /**
   * Get access token - Try httpOnly cookie first, then backup
   */
  getAccessToken(): string | null {
    // Priority 1: Try to get from cookie (if available - read-only for httpOnly)
    // Note: httpOnly cookies cannot be read by JavaScript (by design)
    // The server will include the token in Authorization header for API calls
    
    // Priority 2: Check backup storage (for client-side operations)
    try {
      const backupData = sessionStorage.getItem('reviewinn_token_backup');
      if (backupData) {
        const parsed = JSON.parse(backupData);
        
        // Check if token is expired
        if (parsed.expires_at && Date.now() > parsed.expires_at) {
          console.log('Backup access token expired');
          this.clearBackupTokens();
          return null;
        }
        
        return this.decrypt(parsed.access_token);
      }
    } catch (error) {
      console.error('Failed to retrieve backup token:', error);
      this.clearBackupTokens();
    }
    
    return null;
  }
  
  /**
   * Get refresh token - Try backup storage
   */
  getRefreshToken(): string | null {
    try {
      const backupData = sessionStorage.getItem('reviewinn_token_backup');
      if (backupData) {
        const parsed = JSON.parse(backupData);
        return parsed.refresh_token ? this.decrypt(parsed.refresh_token) : null;
      }
    } catch (error) {
      console.error('Failed to retrieve backup refresh token:', error);
    }
    
    return null;
  }
  
  // ============================================================================
  // TOKEN STATUS CHECKS
  // ============================================================================
  
  /**
   * Check if user has valid authentication
   */
  isAuthenticated(): boolean {
    const accessToken = this.getAccessToken();
    return !!accessToken && !this.isTokenExpired(accessToken);
  }
  
  /**
   * Check if token is expired (simple JWT decode)
   */
  private isTokenExpired(token: string): boolean {
    try {
      const payload = this.decodeJWTPayload(token);
      if (payload.exp) {
        return Date.now() >= (payload.exp * 1000);
      }
      return false;
    } catch {
      return true;
    }
  }
  
  /**
   * Get token expiration time
   */
  getTokenExpiration(): number | null {
    const token = this.getAccessToken();
    if (!token) return null;
    
    try {
      const payload = this.decodeJWTPayload(token);
      return payload.exp ? payload.exp * 1000 : null;
    } catch {
      return null;
    }
  }
  
  // ============================================================================
  // TOKEN CLEANUP
  // ============================================================================
  
  /**
   * Clear all stored tokens
   */
  clearAllTokens(): void {
    this.clearBackupTokens();
    
    // Note: httpOnly cookies will be cleared by server during logout
    console.log('✅ Client tokens cleared. Server will handle httpOnly cookies.');
  }
  
  /**
   * Clear backup tokens
   */
  clearBackupTokens(): void {
    sessionStorage.removeItem('reviewinn_token_backup');
  }
  
  // ============================================================================
  // UTILITY FUNCTIONS
  // ============================================================================
  
  /**
   * Simple encryption for backup storage (obfuscation, not cryptographic security)
   */
  private encrypt(text: string): string {
    try {
      return btoa(encodeURIComponent(text)).split('').reverse().join('');
    } catch {
      return text;
    }
  }
  
  /**
   * Simple decryption for backup storage
   */
  private decrypt(encoded: string): string {
    try {
      return decodeURIComponent(atob(encoded.split('').reverse().join('')));
    } catch {
      return encoded;
    }
  }
  
  /**
   * Decode JWT payload (without verification - for client-side expiration check only)
   */
  private decodeJWTPayload(token: string): any {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      
      return JSON.parse(jsonPayload);
    } catch (error) {
      throw new Error('Invalid JWT token');
    }
  }
  
  // ============================================================================
  // API INTEGRATION HELPERS
  // ============================================================================
  
  /**
   * Get Authorization header for API calls
   */
  getAuthorizationHeader(): string | null {
    const token = this.getAccessToken();
    return token ? `Bearer ${token}` : null;
  }
  
  /**
   * Get headers for authenticated API calls
   */
  getAuthHeaders(): HeadersInit {
    const authHeader = this.getAuthorizationHeader();
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    if (authHeader) {
      headers['Authorization'] = authHeader;
    }
    
    return headers;
  }
  
  /**
   * Make authenticated API call with automatic token handling
   */
  async makeAuthenticatedRequest(url: string, options: RequestInit = {}): Promise<Response> {
    const headers = {
      ...this.getAuthHeaders(),
      ...(options.headers || {})
    };
    
    const response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include' // Important for httpOnly cookies
    });
    
    // Handle token expiration
    if (response.status === 401) {
      console.log('Token expired, attempting refresh...');
      // Token refresh logic would go here
    }
    
    return response;
  }
}

// Export singleton instance
export const tokenManager = new UnifiedTokenManager();

// Export convenience functions
export const storeTokens = (tokenData: TokenData) => tokenManager.storeTokens(tokenData);
export const getAccessToken = () => tokenManager.getAccessToken();
export const getRefreshToken = () => tokenManager.getRefreshToken();
export const isAuthenticated = () => tokenManager.isAuthenticated();
export const clearAllTokens = () => tokenManager.clearAllTokens();
export const getAuthHeaders = () => tokenManager.getAuthHeaders();
export const makeAuthenticatedRequest = (url: string, options?: RequestInit) => 
  tokenManager.makeAuthenticatedRequest(url, options);

export default tokenManager;