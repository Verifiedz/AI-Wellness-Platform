import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from 'react';
import * as SecureStore from 'expo-secure-store';
import { authApi } from '../services/authApi';

const AuthContext = createContext(null);

const AUTH_TOKEN_KEY = 'auth_token';
const USER_ID_KEY = 'user_id';
const USER_EMAIL_KEY = 'user_email';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const clearSession = useCallback(async () => {
    await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);
    await SecureStore.deleteItemAsync(USER_ID_KEY);
    await SecureStore.deleteItemAsync(USER_EMAIL_KEY);
    setToken(null);
    setUser(null);
  }, []);

  const persistSession = useCallback(async (sessionToken, sessionUser) => {
    await SecureStore.setItemAsync(AUTH_TOKEN_KEY, sessionToken);
    await SecureStore.setItemAsync(USER_ID_KEY, String(sessionUser.id));
    await SecureStore.setItemAsync(USER_EMAIL_KEY, sessionUser.email || '');
    setToken(sessionToken);
    setUser(sessionUser);
  }, []);

  // Restore persisted session on app start and validate token against backend.
  useEffect(() => {
    (async () => {
      try {
        const storedToken = await SecureStore.getItemAsync(AUTH_TOKEN_KEY);
        if (storedToken) {
          const profileResult = await authApi.getCurrentUser(storedToken);
          if (profileResult.error || !profileResult.data) {
            await clearSession();
          } else {
            const profile = profileResult.data;
            const normalizedUser = {
              id: String(profile.userId ?? profile.UserId ?? ''),
              email: profile.email ?? profile.Email ?? '',
              username: profile.username ?? profile.Username ?? '',
            };

            if (!normalizedUser.id) {
              await clearSession();
            } else {
              await persistSession(storedToken, normalizedUser);
            }
          }
        }
      } catch (error) {
        console.warn('Failed to restore auth session:', error);
        await clearSession();
      } finally {
        setIsLoading(false);
      }
    })();
  }, [clearSession, persistSession]);

  const login = useCallback(
    async (email, password) => {
      const loginResult = await authApi.login(email, password);
      if (loginResult.error || !loginResult.data) {
        throw new Error(loginResult.error || 'Login failed');
      }

      const loginData = loginResult.data;
      const requiresTwoFactor = Boolean(
        loginData.requiresTwoFactor ?? loginData.RequiresTwoFactor,
      );
      const issuedToken = loginData.token ?? loginData.Token;

      if (requiresTwoFactor && !issuedToken) {
        return {
          requiresTwoFactor: true,
          email,
          message:
            loginData.message ??
            loginData.Message ??
            'Enter your verification code to continue.',
          twoFactorExpiresAt:
            loginData.twoFactorExpiresAt ??
            loginData.TwoFactorExpiresAt ??
            null,
        };
      }

      if (!issuedToken) {
        throw new Error('Login response did not include an access token');
      }

      const profileResult = await authApi.getCurrentUser(issuedToken);
      if (profileResult.error || !profileResult.data) {
        throw new Error(profileResult.error || 'Failed to load user profile');
      }

      const profile = profileResult.data;
      const normalizedUser = {
        id: String(profile.userId ?? profile.UserId ?? ''),
        email: profile.email ?? profile.Email ?? email,
        username: profile.username ?? profile.Username ?? '',
      };

      if (!normalizedUser.id) {
        throw new Error('User profile did not include a valid user id');
      }

      await persistSession(issuedToken, normalizedUser);
      return { requiresTwoFactor: false };
    },
    [persistSession],
  );

  const verifyTwoFactor = useCallback(
    async (email, code) => {
      const verifyResult = await authApi.verifyTwoFactor(email, code);
      if (verifyResult.error || !verifyResult.data) {
        throw new Error(verifyResult.error || '2FA verification failed');
      }

      const verifyData = verifyResult.data;
      const issuedToken = verifyData.token ?? verifyData.Token;
      if (!issuedToken) {
        throw new Error('2FA response did not include an access token');
      }

      const profileResult = await authApi.getCurrentUser(issuedToken);
      if (profileResult.error || !profileResult.data) {
        throw new Error(profileResult.error || 'Failed to load user profile');
      }

      const profile = profileResult.data;
      const normalizedUser = {
        id: String(profile.userId ?? profile.UserId ?? ''),
        email: profile.email ?? profile.Email ?? email,
        username: profile.username ?? profile.Username ?? '',
      };

      if (!normalizedUser.id) {
        throw new Error('User profile did not include a valid user id');
      }

      await persistSession(issuedToken, normalizedUser);
    },
    [persistSession],
  );

  const logout = useCallback(async () => {
    await clearSession();
  }, [clearSession]);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoggedIn: !!user && !!token,
        isLoading,
        login,
        verifyTwoFactor,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
