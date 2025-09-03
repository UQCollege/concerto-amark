import React, { useEffect, useState } from 'react';
import { AuthContext } from './utils/authContext';

const CLIENT_ID = import.meta.env.VITE_OIDC_CLIENT_ID;
const COGNITO_DOMAIN = import.meta.env.VITE_COGNITO_DOMAIN; 
const REDIRECT_URI = import.meta.env.VITE_REDIRECT_URI; 
const TOKEN_ENDPOINT = `${COGNITO_DOMAIN}/oauth2/token`;
const AUTHORIZATION_ENDPOINT = `${COGNITO_DOMAIN}/oauth2/authorize`;

const SCOPES = 'openid email profile';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [codeVerifier, setCodeVerifier] = useState<string | null>(null);

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
    setCodeVerifier(verifier);
    sessionStorage.setItem('pkce_verifier', verifier);

    const loginUrl = `${AUTHORIZATION_ENDPOINT}?response_type=code&client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(
      REDIRECT_URI,
    )}&scope=${encodeURIComponent(SCOPES)}&code_challenge=${challenge}&code_challenge_method=S256`;

    window.location.href = loginUrl;
  };

  const logout = () => {
    sessionStorage.clear();
    setAccessToken(null);
    setRefreshToken(null);
    window.location.href = `${COGNITO_DOMAIN}/logout?client_id=${CLIENT_ID}&logout_uri=${encodeURIComponent(
      REDIRECT_URI,
    )}`;
  };

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
    } else {
      console.error('Token exchange failed:', data);
    }
  };

  const refreshAccessToken = async () => {
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

    const data = await response.json();
    if (data.access_token) {
      sessionStorage.setItem('access_token', data.access_token);
      setAccessToken(data.access_token);
    }
  };

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

  // Auto refresh token every 10 minutes
  useEffect(() => {
    const interval = setInterval(() => {
        console.log("Refreshing access token...");
      refreshAccessToken();
    }, 10 * 60 * 1000); // Every 10 min, TODO: Switch to 1hr

    return () => clearInterval(interval);
  }, []);

  return (
    <AuthContext.Provider value={{ accessToken, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
