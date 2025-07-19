/**
 * Simplified Google Authentication using OAuth 2.0 Implicit Flow
 * This is a fallback method that works without complex setup
 */

import { GoogleCredentials } from '@/types';

class SimpleGoogleAuth {
  private credentials: GoogleCredentials | null = null;

  constructor() {
    // Load existing credentials on initialization
    this.loadStoredCredentials();
  }

  /**
   * Simple OAuth 2.0 Implicit Flow
   */
  async signIn(scopes: string[] = []): Promise<GoogleCredentials> {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) {
      throw new Error('Google Client ID not configured');
    }

    const defaultScopes = [
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile'
    ];

    const allScopes = [...new Set([...defaultScopes, ...scopes])];
    
    return new Promise((resolve, reject) => {
      // Create OAuth URL
      const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: window.location.origin + '/auth/google/callback',
        response_type: 'token',
        scope: allScopes.join(' '),
        include_granted_scopes: 'true',
        state: Math.random().toString(36).substring(2, 15)
      });

      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;

      // Open popup window
      const popup = window.open(
        authUrl,
        'google-auth',
        'width=500,height=600,scrollbars=yes,resizable=yes'
      );

      if (!popup) {
        reject(new Error('Failed to open authentication popup'));
        return;
      }

      // Listen for popup messages
      const messageListener = (event: MessageEvent) => {
        if (event.origin !== window.location.origin) {
          return;
        }

        if (event.data.type === 'GOOGLE_AUTH_SUCCESS') {
          window.removeEventListener('message', messageListener);
          popup.close();

          const credentials: GoogleCredentials = {
            access_token: event.data.access_token,
            refresh_token: '',
            scope: event.data.scope || allScopes.join(' '),
            token_type: event.data.token_type || 'Bearer',
            expiry_date: Date.now() + (parseInt(event.data.expires_in || '3600') * 1000)
          };

          this.credentials = credentials;
          this.saveCredentials(credentials);
          
          // Get user info
          this.getUserInfo(credentials.access_token).then((userInfo) => {
            this.saveUserInfo(userInfo);
            resolve(credentials);
          }).catch(() => {
            resolve(credentials); // Still resolve even if user info fails
          });
        } else if (event.data.type === 'GOOGLE_AUTH_ERROR') {
          window.removeEventListener('message', messageListener);
          popup.close();
          reject(new Error(event.data.error || 'Authentication failed'));
        }
      };

      window.addEventListener('message', messageListener);

      // Check if popup was closed manually
      const checkClosed = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkClosed);
          window.removeEventListener('message', messageListener);
          reject(new Error('Authentication cancelled'));
        }
      }, 1000);
    });
  }

  /**
   * Request additional scopes
   */
  async requestServiceAccess(service: 'gmail' | 'calendar' | 'drive' | 'sheets'): Promise<boolean> {
    const serviceScopes = {
      gmail: [
        'https://www.googleapis.com/auth/gmail.readonly',
        'https://www.googleapis.com/auth/gmail.compose'
      ],
      calendar: [
        'https://www.googleapis.com/auth/calendar'
      ],
      drive: [
        'https://www.googleapis.com/auth/drive.readonly'
      ],
      sheets: [
        'https://www.googleapis.com/auth/spreadsheets'
      ]
    };

    try {
      const requiredScopes = serviceScopes[service];
      const currentScopes = this.credentials?.scope?.split(' ') || [];
      
      // Check if we already have the required scopes
      const hasAllScopes = requiredScopes.every(scope => currentScopes.includes(scope));
      
      if (hasAllScopes) {
        return true;
      }

      // Request additional scopes
      await this.signIn(requiredScopes);
      return true;
    } catch (error) {
      console.error(`Failed to request ${service} access:`, error);
      return false;
    }
  }

  /**
   * Check if user is signed in
   */
  isSignedIn(): boolean {
    if (!this.credentials || !this.credentials.access_token) {
      return false;
    }

    // Check if token is expired
    if (this.credentials.expiry_date && Date.now() >= this.credentials.expiry_date) {
      return false;
    }

    return true;
  }

  /**
   * Check if user has access to specific service
   */
  hasServiceAccess(service: 'gmail' | 'calendar' | 'drive' | 'sheets'): boolean {
    const serviceScopes = {
      gmail: [
        'https://www.googleapis.com/auth/gmail.readonly',
        'https://www.googleapis.com/auth/gmail.compose'
      ],
      calendar: [
        'https://www.googleapis.com/auth/calendar'
      ],
      drive: [
        'https://www.googleapis.com/auth/drive.readonly'
      ],
      sheets: [
        'https://www.googleapis.com/auth/spreadsheets'
      ]
    };

    const currentScopes = this.credentials?.scope?.split(' ') || [];
    const requiredScopes = serviceScopes[service];
    
    return requiredScopes.every(scope => currentScopes.includes(scope));
  }

  /**
   * Get current credentials
   */
  getCredentials(): GoogleCredentials | null {
    return this.credentials;
  }

  /**
   * Get user info
   */
  getUserInfo(): any | null {
    try {
      const stored = localStorage.getItem('google_user_info');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }

  /**
   * Sign out
   */
  async signOut(): Promise<void> {
    try {
      if (this.credentials?.access_token) {
        await fetch(`https://oauth2.googleapis.com/revoke?token=${this.credentials.access_token}`, {
          method: 'POST'
        });
      }
    } catch (error) {
      console.warn('Failed to revoke token:', error);
    }

    this.credentials = null;
    this.clearCredentials();
  }

  /**
   * Get connected services
   */
  getConnectedServices(): string[] {
    const services = ['gmail', 'calendar', 'drive', 'sheets'] as const;
    return services.filter(service => this.hasServiceAccess(service));
  }

  // Private methods
  private async getUserInfo(accessToken: string): Promise<any> {
    const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch user info');
    }

    return await response.json();
  }

  private saveCredentials(credentials: GoogleCredentials): void {
    try {
      localStorage.setItem('google_credentials', JSON.stringify(credentials));
    } catch (error) {
      console.error('Failed to save credentials:', error);
    }
  }

  private saveUserInfo(userInfo: any): void {
    try {
      localStorage.setItem('google_user_info', JSON.stringify(userInfo));
    } catch (error) {
      console.error('Failed to save user info:', error);
    }
  }

  private loadStoredCredentials(): void {
    try {
      const stored = localStorage.getItem('google_credentials');
      if (stored) {
        const credentials = JSON.parse(stored);
        if (credentials.expiry_date > Date.now()) {
          this.credentials = credentials;
        }
      }
    } catch (error) {
      console.error('Failed to load stored credentials:', error);
    }
  }

  private clearCredentials(): void {
    try {
      localStorage.removeItem('google_credentials');
      localStorage.removeItem('google_user_info');
    } catch (error) {
      console.error('Failed to clear credentials:', error);
    }
  }
}

// Export singleton instance
export const simpleGoogleAuth = new SimpleGoogleAuth();
