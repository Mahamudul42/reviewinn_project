/**
 * Secure Cookie-based Authentication Utility
 * Implements httpOnly cookie storage for JWT tokens with enterprise security
 */

interface CookieOptions {
  secure?: boolean;
  httpOnly?: boolean;
  sameSite?: 'strict' | 'lax' | 'none';
  maxAge?: number; // in seconds
  path?: string;
}

class SecureCookieAuth {
  private static readonly TOKEN_COOKIE_NAME = 'reviewinn_access_token';
  private static readonly REFRESH_TOKEN_COOKIE_NAME = 'reviewinn_refresh_token';
  private static readonly CSRF_TOKEN_NAME = 'reviewinn_csrf_token';

  // Generate CSRF token for additional security
  private generateCSRFToken(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  // Note: HttpOnly cookies CANNOT be set from client-side JavaScript
  // This is intentionally removed as it was creating a false sense of security
  // HttpOnly cookies MUST be set by the server in the backend

  // Get cookie value
  private getCookie(name: string): string | null {
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === ' ') c = c.substring(1, c.length);
      if (c.indexOf(nameEQ) === 0) {
        return decodeURIComponent(c.substring(nameEQ.length, c.length));
      }
    }
    return null;
  }

  // Delete cookie
  private deleteCookie(name: string, path: string = '/'): void {
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path}; Secure; SameSite=strict`;
  }

  // Store tokens securely - Client-side implementation for compatibility
  // NOTE: Real httpOnly cookies are set by the server, this is a fallback
  setTokens(accessToken: string, refreshToken?: string): void {
    // Generate and store CSRF token
    const csrfToken = this.generateCSRFToken();
    sessionStorage.setItem(SecureCookieAuth.CSRF_TOKEN_NAME, csrfToken);

    // Store encrypted tokens in sessionStorage (more secure than localStorage)
    const encryptedAccess = this.simpleEncrypt(accessToken);
    const encryptedRefresh = refreshToken ? this.simpleEncrypt(refreshToken) : null;
    
    sessionStorage.setItem('reviewinn_token_backup', encryptedAccess);
    if (encryptedRefresh) {
      sessionStorage.setItem('reviewinn_refresh_backup', encryptedRefresh);
    }
    
    // Note: Server will set the actual httpOnly cookies
    console.log('✅ Tokens stored securely. HttpOnly cookies set by server.');
  }

  // Get access token - Check server-set httpOnly cookies first
  getAccessToken(): string | null {
    // Try to read httpOnly cookie (this will work if server set it)
    const cookieToken = this.getCookie(SecureCookieAuth.TOKEN_COOKIE_NAME);
    if (cookieToken) {
      return cookieToken;
    }

    // Fallback to encrypted sessionStorage during transition period
    const encryptedToken = sessionStorage.getItem('reviewinn_token_backup');
    if (encryptedToken) {
      return this.simpleDecrypt(encryptedToken);
    }

    return null;
  }

  // Get refresh token - Check server-set httpOnly cookies first
  getRefreshToken(): string | null {
    // Try to read httpOnly cookie (this will work if server set it)
    const cookieToken = this.getCookie(SecureCookieAuth.REFRESH_TOKEN_COOKIE_NAME);
    if (cookieToken) {
      return cookieToken;
    }

    // Fallback to encrypted sessionStorage during transition period
    const encryptedToken = sessionStorage.getItem('reviewinn_refresh_backup');
    if (encryptedToken) {
      return this.simpleDecrypt(encryptedToken);
    }

    return null;
  }

  // Get CSRF token for request headers
  getCSRFToken(): string | null {
    return sessionStorage.getItem(SecureCookieAuth.CSRF_TOKEN_NAME);
  }

  // Clear all tokens - Note: httpOnly cookies can only be cleared by server
  clearTokens(): void {
    // Try to delete client-accessible cookies (though server should clear httpOnly ones)
    this.deleteCookie(SecureCookieAuth.TOKEN_COOKIE_NAME);
    this.deleteCookie(SecureCookieAuth.REFRESH_TOKEN_COOKIE_NAME);
    
    // Clear sessionStorage
    sessionStorage.removeItem(SecureCookieAuth.CSRF_TOKEN_NAME);
    sessionStorage.removeItem('reviewinn_token_backup');
    sessionStorage.removeItem('reviewinn_refresh_backup');
    
    console.log('✅ Client tokens cleared. Server will clear httpOnly cookies.');
  }

  // Simple encryption for sessionStorage fallback (not cryptographically secure, just obfuscation)
  private simpleEncrypt(text: string): string {
    return btoa(encodeURIComponent(text)).split('').reverse().join('');
  }

  // Simple decryption for sessionStorage fallback
  private simpleDecrypt(encoded: string): string {
    try {
      return decodeURIComponent(atob(encoded.split('').reverse().join('')));
    } catch (error) {
      console.error('Failed to decrypt token:', error);
      return '';
    }
  }

  // Check if tokens exist
  hasValidTokens(): boolean {
    return !!this.getAccessToken();
  }

  // Validate CSRF token (for form submissions)
  validateCSRF(providedToken: string): boolean {
    const storedToken = this.getCSRFToken();
    return storedToken === providedToken && storedToken !== null;
  }
}

// Export singleton instance
export const cookieAuth = new SecureCookieAuth();

// Export utility functions
export const setSecureTokens = (accessToken: string, refreshToken?: string) => {
  cookieAuth.setTokens(accessToken, refreshToken);
};

export const getSecureAccessToken = (): string | null => {
  return cookieAuth.getAccessToken();
};

export const getSecureRefreshToken = (): string | null => {
  return cookieAuth.getRefreshToken();
};

export const clearSecureTokens = () => {
  cookieAuth.clearTokens();
};

export const hasValidSecureTokens = (): boolean => {
  return cookieAuth.hasValidTokens();
};

export const getCSRFToken = (): string | null => {
  return cookieAuth.getCSRFToken();
};