'use client';

import { GoogleCredentials } from '@/types';

export class GoogleAuthService {
  private static instance: GoogleAuthService;
  private credentials: GoogleCredentials | null = null;
  private isInitialized = false;

  private constructor() {}

  static getInstance(): GoogleAuthService {
    if (!GoogleAuthService.instance) {
      GoogleAuthService.instance = new GoogleAuthService();
    }
    return GoogleAuthService.instance;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    // Load Google API script
    await this.loadGoogleAPI();
    
    // Initialize Google Auth
    await this.initializeGoogleAuth();
    
    this.isInitialized = true;
  }

  private loadGoogleAPI(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (typeof window === 'undefined') {
        reject(new Error('Google API can only be loaded in browser'));
        return;
      }

      // Check if already loaded
      if (window.gapi) {
        resolve();
        return;
      }

      // Load Google API
      const script = document.createElement('script');
      script.src = 'https://apis.google.com/js/api.js';
      script.async = true;
      script.defer = true;

      script.onload = () => {
        window.gapi.load('auth2', {
          callback: () => {
            console.log('Google Auth2 loaded successfully');
            resolve();
          },
          onerror: (error: any) => {
            console.error('Failed to load Google Auth2:', error);
            reject(new Error('Failed to load Google Auth2'));
          }
        });
      };

      script.onerror = () => reject(new Error('Failed to load Google API'));
      document.head.appendChild(script);
    });
  }

  private initializeGoogleAuth(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || !window.gapi) {
        reject(new Error('Google API not available'));
        return;
      }

      const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_API_KEY;

      if (!clientId) {
        reject(new Error('Google Client ID not configured'));
        return;
      }

      try {
        // Initialize Google API client first
        window.gapi.client.init({
          apiKey: apiKey,
          clientId: clientId,
          discoveryDocs: [
            'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest',
            'https://www.googleapis.com/discovery/v1/apis/gmail/v1/rest'
          ],
          scope: [
            'https://www.googleapis.com/auth/userinfo.email',
            'https://www.googleapis.com/auth/userinfo.profile',
            'https://www.googleapis.com/auth/calendar',
            'https://www.googleapis.com/auth/gmail.readonly',
            'https://www.googleapis.com/auth/gmail.compose'
          ].join(' ')
        }).then(() => {
          console.log('✅ Google API client initialized successfully');
          console.log('🔑 Using API Key:', apiKey ? 'Configured' : 'Missing');
          console.log('🔑 Using Client ID:', clientId ? 'Configured' : 'Missing');
          resolve();
        }).catch((error: any) => {
          console.error('❌ Failed to initialize Google API client:', error);
          reject(error);
        });
      } catch (error) {
        console.error('❌ Error during Google API initialization:', error);
        reject(error);
      }
    });
  }

  async signIn(requestedScopes?: string[]): Promise<GoogleCredentials> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    return new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || !window.gapi) {
        reject(new Error('Google API not available'));
        return;
      }

      try {
        // Use Google API client auth
        const authInstance = window.gapi.auth2.getAuthInstance();

        if (!authInstance) {
          reject(new Error('Google Auth not initialized'));
          return;
        }

        // Sign in with requested scopes
        const signInOptions = requestedScopes ? {
          scope: requestedScopes.join(' ')
        } : {};

        authInstance.signIn(signInOptions).then((googleUser: any) => {
          const authResponse = googleUser.getAuthResponse();
          const profile = googleUser.getBasicProfile();

          const credentials: GoogleCredentials = {
            access_token: authResponse.access_token,
            refresh_token: authResponse.refresh_token || '',
            scope: authResponse.scope,
            token_type: authResponse.token_type,
            expiry_date: authResponse.expires_at
          };

          // Store user profile information
          const userInfo = {
            id: profile.getId(),
            email: profile.getEmail(),
            name: profile.getName(),
            picture: profile.getImageUrl()
          };

          this.credentials = credentials;
          this.saveCredentials(credentials);
          this.saveUserInfo(userInfo);

          console.log('✅ Google sign-in successful');
          console.log('👤 User:', userInfo.name, '(' + userInfo.email + ')');
          console.log('🔑 Scopes granted:', authResponse.scope);

          resolve(credentials);
        }).catch((error: any) => {
          console.error('❌ Google sign-in failed:', error);
          reject(error);
        });
      } catch (error) {
        console.error('❌ Error during sign-in:', error);
        reject(error);
      }
    });
  }

  // Get user profile information
  private async getUserProfile(accessToken: string): Promise<any> {
    try {
      // Try the userinfo endpoint first
      let response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (!response.ok) {
        // Fallback to tokeninfo endpoint
        response = await fetch(`https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=${accessToken}`);
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const userInfo = await response.json();

      // Normalize the response format
      return {
        id: userInfo.id || userInfo.user_id || 'unknown',
        email: userInfo.email || 'user@example.com',
        name: userInfo.name || userInfo.given_name || 'Google User',
        picture: userInfo.picture || ''
      };
    } catch (error) {
      console.error('Failed to get user profile:', error);
      // Return a default user info instead of throwing
      return {
        id: 'unknown',
        email: 'user@example.com',
        name: 'Google User',
        picture: ''
      };
    }
  }

  // Request additional scopes for specific services
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

      // Request additional scopes using incremental authorization
      const allScopes = [...new Set([...currentScopes, ...requiredScopes])];
      await this.signIn(allScopes);
      return true;
    } catch (error) {
      console.error(`Failed to request ${service} access:`, error);
      return false;
    }
  }

  async signOut(): Promise<void> {
    if (typeof window !== 'undefined' && window.gapi) {
      try {
        const authInstance = window.gapi.auth2.getAuthInstance();
        if (authInstance) {
          await authInstance.signOut();
        }
      } catch (error) {
        console.error('Failed to sign out from Google:', error);
      }
    }

    this.credentials = null;
    this.clearCredentials();
  }

  isSignedIn(): boolean {
    if (typeof window === 'undefined' || !window.gapi) {
      return false;
    }

    try {
      const authInstance = window.gapi.auth2.getAuthInstance();
      if (authInstance && authInstance.isSignedIn.get()) {
        return true;
      }
    } catch (error) {
      console.error('Error checking sign-in status:', error);
    }

    // Fallback: check stored credentials
    if (!this.credentials || !this.credentials.access_token) {
      const stored = this.loadCredentials();
      if (stored && stored.expiry_date > Date.now()) {
        this.credentials = stored;
        return true;
      }
      return false;
    }

    // Check if token is expired
    if (this.credentials.expiry_date && Date.now() >= this.credentials.expiry_date) {
      return false;
    }

    return true;
  }

  getCredentials(): GoogleCredentials | null {
    if (this.credentials) {
      return this.credentials;
    }

    // Try to load from localStorage
    const stored = this.loadCredentials();
    if (stored && stored.expiry_date > Date.now()) {
      this.credentials = stored;
      return stored;
    }

    return null;
  }

  private saveCredentials(credentials: GoogleCredentials): void {
    if (typeof window === 'undefined') {
      return; // Skip during SSR
    }

    try {
      localStorage.setItem('google_credentials', JSON.stringify(credentials));
    } catch (error) {
      console.error('Failed to save Google credentials:', error);
    }
  }

  private loadCredentials(): GoogleCredentials | null {
    if (typeof window === 'undefined') {
      return null; // Skip during SSR
    }

    try {
      const stored = localStorage.getItem('google_credentials');
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('Failed to load Google credentials:', error);
      return null;
    }
  }

  private clearCredentials(): void {
    if (typeof window === 'undefined') {
      return; // Skip during SSR
    }

    try {
      localStorage.removeItem('google_credentials');
      localStorage.removeItem('google_user_info');
    } catch (error) {
      console.error('Failed to clear Google credentials:', error);
    }
  }

  private saveUserInfo(userInfo: any): void {
    if (typeof window === 'undefined') {
      return; // Skip during SSR
    }

    try {
      localStorage.setItem('google_user_info', JSON.stringify(userInfo));
    } catch (error) {
      console.error('Failed to save Google user info:', error);
    }
  }

  getUserInfo(): any | null {
    if (typeof window === 'undefined') {
      return null; // Skip during SSR
    }

    try {
      const stored = localStorage.getItem('google_user_info');
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('Failed to load Google user info:', error);
      return null;
    }
  }

  // Check if user has granted access to specific service
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

  // Get list of connected services
  getConnectedServices(): string[] {
    const services = ['gmail', 'calendar', 'drive', 'sheets'] as const;
    return services.filter(service => this.hasServiceAccess(service));
  }

  async refreshToken(): Promise<GoogleCredentials> {
    if (!this.credentials || !this.credentials.refresh_token) {
      throw new Error('No refresh token available');
    }

    // In a real implementation, you would call your backend to refresh the token
    // For demo purposes, we'll simulate a refresh
    const refreshedCredentials: GoogleCredentials = {
      ...this.credentials,
      access_token: 'new_access_token_' + Date.now(),
      expiry_date: Date.now() + 3600000 // 1 hour from now
    };

    this.credentials = refreshedCredentials;
    this.saveCredentials(refreshedCredentials);
    return refreshedCredentials;
  }

  async makeAuthenticatedRequest(url: string, options: RequestInit = {}): Promise<Response> {
    const credentials = this.getCredentials();
    if (!credentials) {
      throw new Error('Not authenticated');
    }

    // Check if token is expired
    if (credentials.expiry_date <= Date.now()) {
      await this.refreshToken();
    }

    const headers = {
      ...options.headers,
      'Authorization': `Bearer ${credentials.access_token}`,
      'Content-Type': 'application/json'
    };

    return fetch(url, {
      ...options,
      headers
    });
  }
}

// Global type declarations for Google API
declare global {
  interface Window {
    gapi: any;
  }
}

export const googleAuth = GoogleAuthService.getInstance();
