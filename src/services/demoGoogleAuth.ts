/**
 * Demo Google Authentication Service
 * Simulates Google authentication for testing purposes
 */

import { GoogleCredentials } from '@/types';

class DemoGoogleAuth {
  private credentials: GoogleCredentials | null = null;
  private userInfo: any = null;
  private connectedServices: Set<string> = new Set();
  private isDataLoaded = false;

  constructor() {
    // Don't load data during construction to avoid SSR issues
    // Data will be loaded lazily when needed
  }

  private ensureDataLoaded(): void {
    if (!this.isDataLoaded && typeof window !== 'undefined') {
      this.loadDemoData();
      this.isDataLoaded = true;
    }
  }

  /**
   * Simulate Google sign-in
   */
  async signIn(requestedScopes?: string[]): Promise<GoogleCredentials> {
    // Simulate authentication delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    const credentials: GoogleCredentials = {
      access_token: 'demo_access_token_' + Date.now(),
      refresh_token: 'demo_refresh_token',
      scope: requestedScopes?.join(' ') || 'https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile',
      token_type: 'Bearer',
      expiry_date: Date.now() + (3600 * 1000) // 1 hour from now
    };

    const userInfo = {
      id: 'demo_user_123',
      email: 'demo.user@example.com',
      name: 'Demo User',
      picture: 'https://via.placeholder.com/96x96/4285F4/ffffff?text=DU'
    };

    this.credentials = credentials;
    this.userInfo = userInfo;
    
    // Add basic scopes as connected
    this.connectedServices.add('profile');
    this.connectedServices.add('email');

    this.saveDemoData();
    return credentials;
  }

  /**
   * Request service access (demo)
   */
  async requestServiceAccess(service: 'gmail' | 'calendar' | 'drive' | 'sheets'): Promise<boolean> {
    if (!this.isSignedIn()) {
      return false;
    }

    // Simulate service connection delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Simulate 90% success rate
    const success = Math.random() > 0.1;
    
    if (success) {
      this.connectedServices.add(service);
      
      // Update credentials with new scope
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
      const newScopes = [...new Set([...currentScopes, ...serviceScopes[service]])];
      
      if (this.credentials) {
        this.credentials.scope = newScopes.join(' ');
      }

      this.saveDemoData();
    }

    return success;
  }

  /**
   * Check if user is signed in
   */
  isSignedIn(): boolean {
    this.ensureDataLoaded();

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
    this.ensureDataLoaded();
    return this.connectedServices.has(service);
  }

  /**
   * Get current credentials
   */
  getCredentials(): GoogleCredentials | null {
    this.ensureDataLoaded();
    return this.credentials;
  }

  /**
   * Get user info
   */
  getUserInfo(): any | null {
    this.ensureDataLoaded();
    return this.userInfo;
  }

  /**
   * Sign out
   */
  async signOut(): Promise<void> {
    this.credentials = null;
    this.userInfo = null;
    this.connectedServices.clear();
    this.clearDemoData();
  }

  /**
   * Get connected services
   */
  getConnectedServices(): string[] {
    this.ensureDataLoaded();
    return Array.from(this.connectedServices);
  }

  // Private methods for demo data persistence
  private saveDemoData(): void {
    if (typeof window === 'undefined') {
      return; // Skip during SSR
    }

    try {
      const demoData = {
        credentials: this.credentials,
        userInfo: this.userInfo,
        connectedServices: Array.from(this.connectedServices)
      };
      localStorage.setItem('demo_google_auth', JSON.stringify(demoData));
    } catch (error) {
      console.error('Failed to save demo data:', error);
    }
  }

  private loadDemoData(): void {
    if (typeof window === 'undefined') {
      return; // Skip during SSR
    }

    try {
      const stored = localStorage.getItem('demo_google_auth');
      if (stored) {
        const demoData = JSON.parse(stored);

        // Check if credentials are still valid
        if (demoData.credentials && demoData.credentials.expiry_date > Date.now()) {
          this.credentials = demoData.credentials;
          this.userInfo = demoData.userInfo;
          this.connectedServices = new Set(demoData.connectedServices || []);
        }
      }
    } catch (error) {
      console.error('Failed to load demo data:', error);
    }
  }

  private clearDemoData(): void {
    if (typeof window === 'undefined') {
      return; // Skip during SSR
    }

    try {
      localStorage.removeItem('demo_google_auth');
    } catch (error) {
      console.error('Failed to clear demo data:', error);
    }
  }
}

// Export singleton instance
export const demoGoogleAuth = new DemoGoogleAuth();
