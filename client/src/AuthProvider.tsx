import React, { useEffect, useState, useRef } from 'react';
import { AuthContext } from './utils/authContext';

const CLIENT_ID = import.meta.env.VITE_OIDC_CLIENT_ID;
const COGNITO_DOMAIN = import.meta.env.VITE_COGNITO_DOMAIN;
const REDIRECT_URI = import.meta.env.VITE_REDIRECT_URI;
const TOKEN_ENDPOINT = `${COGNITO_DOMAIN}/oauth2/token`;
const AUTHORIZATION_ENDPOINT = `${COGNITO_DOMAIN}/oauth2/authorize`;

const SCOPES = 'openid email profile';

const isValidRedirectUri = (uri: string) => {
  const allowedRedirectUri = import.meta.env.VITE_REDIRECT_URI;
  return uri === allowedRedirectUri;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
   const lastActivity = useRef<number>(Date.now());  // Track last user activity
  const inactivityTimeout = useRef<NodeJS.Timeout | null>(null);
  const lastThrottleTime = useRef<number>(Date.now());

  // Helper to generate a random code_verifier
  const generateCodeVerifier = (): string => {
    const array = new Uint8Array(32);
    window.crypto.getRandomValues(array);
    return btoa(String.fromCharCode(...array))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  };

  // Create a SHA256 code challenge from the verifier
  const generateCodeChallenge = async (verifier: string): Promise<string> => {
    const data = new TextEncoder().encode(verifier);
    const digest = await crypto.subtle.digest('SHA-256', data);
    return btoa(String.fromCharCode(...new Uint8Array(digest)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  };

  const login = async () => {
    const verifier = generateCodeVerifier();
    const challenge = await generateCodeChallenge(verifier);
    
    sessionStorage.setItem('pkce_verifier', verifier);

    const loginUrl = `${AUTHORIZATION_ENDPOINT}?response_type=code&client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(
      REDIRECT_URI,
    )}&scope=${encodeURIComponent(SCOPES)}&code_challenge=${challenge}&code_challenge_method=S256`;

    window.location.href = loginUrl;
  };

  const logout = React.useCallback(() => {
    if (inactivityTimeout.current) {
     clearTimeout(inactivityTimeout.current);
     inactivityTimeout.current = null;
   }
    localStorage.removeItem('api-environment');
    sessionStorage.clear();
    setAccessToken(null);
    setRefreshToken(null);
    if (isValidRedirectUri(REDIRECT_URI)) {
      window.location.href = `${COGNITO_DOMAIN}/logout?client_id=${CLIENT_ID}&logout_uri=${encodeURIComponent(
        REDIRECT_URI,
      )}`;
    } else {
      console.error("Invalid logout redirect URI");
    }
  }, []);

  const exchangeCodeForTokens = async (code: string) => {
    const verifier = sessionStorage.getItem('pkce_verifier');
    if (!verifier) {
      console.error('No PKCE verifier found.');
      return;
    }

    const params = new URLSearchParams();
    params.append('grant_type', 'authorization_code');
    params.append('client_id', CLIENT_ID);
    params.append('code', code);
    params.append('redirect_uri', REDIRECT_URI);
    params.append('code_verifier', verifier);

    const response = await fetch(TOKEN_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    const data = await response.json();
    if (data.access_token) {
      sessionStorage.setItem('access_token', data.access_token);
      sessionStorage.setItem('refresh_token', data.refresh_token);
      setAccessToken(data.access_token);
      setRefreshToken(data.refresh_token);
      sessionStorage.removeItem('pkce_verifier');
    } else {
      console.error('Token exchange failed:', data);
    }
  };

  const refreshAccessToken = React.useCallback(async () => {
    const storedRefreshToken = sessionStorage.getItem('refresh_token');
    if (!storedRefreshToken) return;

    const params = new URLSearchParams();
    params.append('grant_type', 'refresh_token');
    params.append('client_id', CLIENT_ID);
    params.append('refresh_token', storedRefreshToken);

    const response = await fetch(TOKEN_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    if (!response.ok) {
      console.error('Failed to refresh token:', response.statusText);
      logout(); // Force re-login
      return;
    }

    const data = await response.json();
    if (data.access_token) {
      sessionStorage.setItem('access_token', data.access_token);
      setAccessToken(data.access_token);
    
    } else {
      logout(); // Force re-login if refresh token is invalid
    }
  }, [logout]);

  // Check for auth code in URL (on callback)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');

    if (code) {
      exchangeCodeForTokens(code).then(() => {
        window.history.replaceState({}, '', REDIRECT_URI); // Clean up URL
      });
    } else {
      const storedToken = sessionStorage.getItem('access_token');
      if (storedToken) setAccessToken(storedToken);
    }
  }, []);

// Handle user activity

 const resetInactivityTimer = React.useCallback(() => {
   const now = Date.now();
   // THROTTLE: Only run logic if 10 seconds have passed since last update.
    if (now - lastThrottleTime.current < 10000) {
      return; 
    }
    lastThrottleTime.current = now;
    
   

    // 1. Update State
    lastActivity.current = now;

    // 2. Reset Timer (Only do this when we update state)
    if (inactivityTimeout.current) {
      clearTimeout(inactivityTimeout.current);
    }

    inactivityTimeout.current = setTimeout(() => {
      console.log("User inactive for 35 minutes. Logging out...");
      logout();
    }, 35 * 60 * 1000); 

  }, [logout]); // Dependencies ensure function updates when state changes


  // Attach event listeners for user activity
 useEffect(() => {
    const events = ['mousemove', 'keydown', 'click', 'scroll'];
    
    // We pass the specific function instance to addEventListener
    events.forEach((event) => window.addEventListener(event, resetInactivityTimer));
     // CRITICAL FIX: Set the initial timeout on mount!
    // Otherwise, if the user never moves their mouse after login, they never get logged out.
    if (!inactivityTimeout.current) {
        inactivityTimeout.current = setTimeout(() => {
            console.log("User inactive for 35 minutes. Logging out...");
            logout();
        }, 35 * 60 * 1000);
    }
    return () => {
      events.forEach((event) => window.removeEventListener(event, resetInactivityTimer));
      // We do NOT clear the timeout here on unmount/re-render, 
      // because we want the logout timer to persist even if the effect re-runs.
      // Only clear it if the component is truly unmounting (optional, but safer to leave it managed by the ref).
    };
  }, [resetInactivityTimer, logout]); // Re-bind listeners when the function updates (every 10s)


  // Refresh token if user is active
  useEffect(() => {
    if (!accessToken) return;
    const interval = setInterval(() => {
      const now = Date.now();
      if (now - lastActivity.current < 35 * 60 * 1000) {
        console.log('User is active. Refreshing token...');
        refreshAccessToken();
      }
    }, 45 * 60 * 1000); // Check every 45 minutes

    return () => clearInterval(interval);
  }, [accessToken, refreshAccessToken]);

  return (
    <AuthContext.Provider value={{ accessToken, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
