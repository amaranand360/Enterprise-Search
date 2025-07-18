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

      const script = document.createElement('script');
      script.src = 'https://apis.google.com/js/api.js';
      script.onload = () => resolve();
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

      window.gapi.load('auth2', () => {
        const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
        if (!clientId) {
          reject(new Error('Google Client ID not configured'));
          return;
        }

        window.gapi.auth2.init({
          client_id: clientId,
          scope: [
            'https://www.googleapis.com/auth/gmail.readonly',
            'https://www.googleapis.com/auth/gmail.compose',
            'https://www.googleapis.com/auth/calendar',
            'https://www.googleapis.com/auth/drive.readonly',
            'https://www.googleapis.com/auth/spreadsheets',
            'https://www.googleapis.com/auth/userinfo.email',
            'https://www.googleapis.com/auth/userinfo.profile'
          ].join(' ')
        }).then(() => {
          resolve();
        }).catch(reject);
      });
    });
  }

  async signIn(): Promise<GoogleCredentials> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    return new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || !window.gapi) {
        reject(new Error('Google API not available'));
        return;
      }

      const authInstance = window.gapi.auth2.getAuthInstance();
      if (!authInstance) {
        reject(new Error('Google Auth not initialized'));
        return;
      }

      authInstance.signIn().then((googleUser: any) => {
        const authResponse = googleUser.getAuthResponse();
        const credentials: GoogleCredentials = {
          access_token: authResponse.access_token,
          refresh_token: authResponse.refresh_token || '',
          scope: authResponse.scope,
          token_type: authResponse.token_type,
          expiry_date: authResponse.expires_at
        };

        this.credentials = credentials;
        this.saveCredentials(credentials);
        resolve(credentials);
      }).catch(reject);
    });
  }

  async signOut(): Promise<void> {
    if (typeof window === 'undefined' || !window.gapi) {
      return;
    }

    const authInstance = window.gapi.auth2.getAuthInstance();
    if (authInstance) {
      await authInstance.signOut();
    }

    this.credentials = null;
    this.clearCredentials();
  }

  isSignedIn(): boolean {
    if (typeof window === 'undefined' || !window.gapi) {
      return false;
    }

    const authInstance = window.gapi.auth2.getAuthInstance();
    return authInstance ? authInstance.isSignedIn.get() : false;
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
    try {
      localStorage.setItem('google_credentials', JSON.stringify(credentials));
    } catch (error) {
      console.error('Failed to save Google credentials:', error);
    }
  }

  private loadCredentials(): GoogleCredentials | null {
    try {
      const stored = localStorage.getItem('google_credentials');
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('Failed to load Google credentials:', error);
      return null;
    }
  }

  private clearCredentials(): void {
    try {
      localStorage.removeItem('google_credentials');
    } catch (error) {
      console.error('Failed to clear Google credentials:', error);
    }
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
