'use client';

import { GoogleCredentials } from '../types';

export interface GoogleUser {
  id: string;
  email: string;
  name: string;
  picture?: string;
}

declare global {
  interface Window {
    google: any;
    gapi: any;
  }
}

class GoogleAuthService {
  private credentials: GoogleCredentials | null = null;
  private isInitialized = false;
  private tokenClient: any = null;

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      await this.loadGoogleAPI();
      await this.loadGoogleIdentityServices();
      await this.initializeGoogleAuth();
      this.initializeTokenClient();
      this.isInitialized = true;
      console.log('Google Auth initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Google Auth:', error);
      throw error;
    }
  }

  private loadGoogleAPI(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (typeof window === 'undefined') {
        reject(new Error('Window is not available'));
        return;
      }

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

  private loadGoogleIdentityServices(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (typeof window === 'undefined') {
        reject(new Error('Window is not available'));
        return;
      }

      if (window.google) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Google Identity Services'));
      document.head.appendChild(script);
    });
  }

  private initializeGoogleAuth(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || !window.gapi) {
        reject(new Error('Google API not available'));
        return;
      }

      window.gapi.load('client', async () => {
        try {
          await window.gapi.client.init({
            apiKey: process.env.NEXT_PUBLIC_GOOGLE_API_KEY,
            discoveryDocs: [
              'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest',
              'https://www.googleapis.com/discovery/v1/apis/gmail/v1/rest',
              'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'
            ]
          });
          resolve();
        } catch (error) {
          reject(error);
        }
      });
    });
  }

  private initializeTokenClient(): void {
    if (typeof window === 'undefined' || !window.google) {
      throw new Error('Google Identity Services not available');
    }

    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) {
      throw new Error('Google Client ID not configured');
    }

    this.tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: [
        'https://www.googleapis.com/auth/calendar',
        'https://www.googleapis.com/auth/calendar.events',
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile'
      ].join(' '),
      callback: (response: any) => {
        if (response.error) {
          console.error('Token request failed:', response.error);
          return;
        }
        
        const credentials: GoogleCredentials = {
          access_token: response.access_token,
          refresh_token: response.refresh_token || '',
          scope: response.scope || '',
          token_type: response.token_type || 'Bearer',
          expiry_date: Date.now() + (response.expires_in * 1000)
        };

        this.credentials = credentials;
        this.saveCredentials(credentials);
        console.log('Google OAuth successful:', credentials);
      }
    });
  }

  async signIn(): Promise<GoogleCredentials> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    return new Promise((resolve, reject) => {
      if (!this.tokenClient) {
        reject(new Error('Google token client not initialized'));
        return;
      }

      // Store resolve function to call it from the token client callback
      this.tokenClient.callback = (response: any) => {
        if (response.error) {
          console.error('Google sign-in failed:', response.error);
          reject(new Error(`Google sign-in failed: ${response.error}`));
          return;
        }
        
        const credentials: GoogleCredentials = {
          access_token: response.access_token,
          refresh_token: response.refresh_token || '',
          scope: response.scope || '',
          token_type: response.token_type || 'Bearer',
          expiry_date: Date.now() + (response.expires_in * 1000)
        };

        this.credentials = credentials;
        this.saveCredentials(credentials);
        console.log('Google OAuth successful');
        resolve(credentials);
      };

      // Request access token
      this.tokenClient.requestAccessToken();
    });
  }

  async signOut(): Promise<void> {
    if (typeof window === 'undefined' || !window.google) {
      return;
    }

    try {
      if (this.credentials?.access_token) {
        window.google.accounts.oauth2.revoke(this.credentials.access_token);
      }
      this.credentials = null;
      this.clearCredentials();
      console.log('Google sign-out successful');
    } catch (error) {
      console.error('Error during sign-out:', error);
    }
  }

  getCredentials(): GoogleCredentials | null {
    if (!this.credentials) {
      this.credentials = this.loadCredentials();
    }
    return this.credentials;
  }

  isSignedIn(): boolean {
    const credentials = this.getCredentials();
    if (!credentials) return false;
    
    // Check if token is expired
    if (credentials.expiry_date && credentials.expiry_date < Date.now()) {
      return false;
    }
    
    return !!credentials.access_token;
  }

  private saveCredentials(credentials: GoogleCredentials): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('google_credentials', JSON.stringify(credentials));
    }
  }

  private loadCredentials(): GoogleCredentials | null {
    if (typeof window === 'undefined') return null;
    
    try {
      const stored = localStorage.getItem('google_credentials');
      if (stored) {
        const credentials = JSON.parse(stored);
        // Check if token is expired
        if (credentials.expiry_date && credentials.expiry_date < Date.now()) {
          this.clearCredentials();
          return null;
        }
        return credentials;
      }
    } catch (error) {
      console.error('Error loading stored credentials:', error);
      this.clearCredentials();
    }
    
    return null;
  }

  private clearCredentials(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('google_credentials');
    }
  }

  async getCurrentUser(): Promise<GoogleUser | null> {
    const credentials = this.getCredentials();
    if (!credentials?.access_token) {
      return null;
    }

    try {
      if (!window.gapi || !window.gapi.client) {
        throw new Error('Google API client not initialized');
      }

      // Set the access token
      window.gapi.client.setToken({
        access_token: credentials.access_token
      });

      // Load the OAuth2 API
      await new Promise((resolve, reject) => {
        window.gapi.client.load('oauth2', 'v2', () => resolve(true));
      });

      const response = await window.gapi.client.oauth2.userinfo.get();
      const userInfo = response.result;

      return {
        id: userInfo.id,
        email: userInfo.email,
        name: userInfo.name,
        picture: userInfo.picture
      };
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  async refreshToken(): Promise<GoogleCredentials | null> {
    // Note: For web applications, we typically don't have refresh tokens
    // Instead, we should re-authenticate when the token expires
    if (!this.isSignedIn()) {
      try {
        return await this.signIn();
      } catch (error) {
        console.error('Error refreshing token:', error);
        return null;
      }
    }
    return this.getCredentials();
  }
}

export const googleAuth = new GoogleAuthService();