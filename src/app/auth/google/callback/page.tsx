'use client';

import { useEffect } from 'react';

export default function GoogleAuthCallback() {
  useEffect(() => {
    // Parse the URL fragment for OAuth response
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);

    const accessToken = params.get('access_token');
    const error = params.get('error');

    if (error) {
      // Send error to parent window
      if (window.opener) {
        window.opener.postMessage({
          type: 'GOOGLE_AUTH_ERROR',
          error: error
        }, window.location.origin);
      }
    } else if (accessToken) {
      // Send success to parent window
      if (window.opener) {
        window.opener.postMessage({
          type: 'GOOGLE_AUTH_SUCCESS',
          access_token: accessToken,
          token_type: params.get('token_type'),
          expires_in: params.get('expires_in'),
          scope: params.get('scope'),
          state: params.get('state')
        }, window.location.origin);
      }
    } else {
      // No token or error - something went wrong
      if (window.opener) {
        window.opener.postMessage({
          type: 'GOOGLE_AUTH_ERROR',
          error: 'No access token received'
        }, window.location.origin);
      }
    }

    // Close the popup window
    window.close();
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Processing authentication...</p>
        <p className="text-sm text-gray-500 mt-2">This window will close automatically.</p>
      </div>
    </div>
  );
}
