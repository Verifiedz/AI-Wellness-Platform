import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react-native';
import * as SecureStore from 'expo-secure-store';
import { AuthProvider, useAuth } from '../src/context/AuthContext';

jest.mock('expo-secure-store');

jest.mock('../src/context/OnboardingContext', () => ({
  useOnboarding: () => ({ resetOnboarding: jest.fn() }),
  OnboardingProvider: ({ children }) => children,
}));

jest.mock('../src/services/authApi', () => ({
  authApi: {
    login: jest.fn(),
    getCurrentUser: jest.fn(),
    verifyTwoFactor: jest.fn(),
  },
}));

const { authApi } = require('../src/services/authApi');

const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>;

beforeEach(() => {
  jest.clearAllMocks();
  // By default, no stored token — skip restoreToken's early-return path
  SecureStore.getItemAsync.mockResolvedValue(null);
});

describe('AuthContext', () => {
  describe('login', () => {
    it('login_stores_token_and_user: sets token and user after successful login', async () => {
      authApi.login.mockResolvedValue({
        status: 200,
        data: { token: 'jwt-token', Token: null },
        error: null,
      });
      authApi.getCurrentUser.mockResolvedValue({
        status: 200,
        data: { userId: '1', email: 'test@test.com', username: 'testuser' },
        error: null,
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      // Wait for restoreToken to complete (isLoading transitions to false)
      await act(async () => {});

      await act(async () => {
        await result.current.login('test@test.com', 'Password1!');
      });

      expect(result.current.token).toBe('jwt-token');
      expect(result.current.user).not.toBeNull();
      expect(result.current.user.email).toBe('test@test.com');
      expect(result.current.isLoggedIn).toBe(true);
    });

    it('login_throws_on_error: throws when login API returns an error', async () => {
      authApi.login.mockResolvedValue({
        status: 401,
        data: null,
        error: 'Invalid credentials',
      });

      const { result } = renderHook(() => useAuth(), { wrapper });
      await act(async () => {});

      await expect(
        act(async () => {
          await result.current.login('wrong@test.com', 'bad-pass');
        })
      ).rejects.toThrow('Invalid credentials');
    });

    it('login_returns_requiresTwoFactor: returns flag when 2FA is required', async () => {
      authApi.login.mockResolvedValue({
        status: 200,
        data: { requiresTwoFactor: true, message: 'Check your email' },
        error: null,
      });

      const { result } = renderHook(() => useAuth(), { wrapper });
      await act(async () => {});

      let loginResult;
      await act(async () => {
        loginResult = await result.current.login('user@test.com', 'Password1!');
      });

      expect(loginResult.requiresTwoFactor).toBe(true);
      expect(result.current.token).toBeNull();
    });
  });

  describe('logout', () => {
    it('logout_clears_token: clears token and user, calls SecureStore.deleteItemAsync', async () => {
      authApi.login.mockResolvedValue({
        status: 200,
        data: { token: 'jwt-token' },
        error: null,
      });
      authApi.getCurrentUser.mockResolvedValue({
        status: 200,
        data: { userId: '1', email: 'test@test.com', username: 'testuser' },
        error: null,
      });

      const { result } = renderHook(() => useAuth(), { wrapper });
      await act(async () => {});

      // Log in first
      await act(async () => {
        await result.current.login('test@test.com', 'Password1!');
      });
      expect(result.current.token).toBe('jwt-token');

      // Now log out
      await act(async () => {
        await result.current.logout();
      });

      expect(result.current.token).toBeNull();
      expect(result.current.user).toBeNull();
      expect(result.current.isLoggedIn).toBe(false);
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('auth_token');
    });
  });

  describe('restoreToken', () => {
    it('restoreToken_loads_from_secure_store: restores session when token exists in SecureStore', async () => {
      // Return token on restore
      SecureStore.getItemAsync.mockImplementation((key) => {
        if (key === 'auth_token') return Promise.resolve('stored-jwt');
        return Promise.resolve(null);
      });

      authApi.getCurrentUser.mockResolvedValue({
        status: 200,
        data: { userId: '42', email: 'restored@test.com', username: 'restoreduser' },
        error: null,
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      // Wait for isLoading to become false (restore effect completed)
      await waitFor(() => expect(result.current.isLoading).toBe(false), { timeout: 8000 });

      expect(result.current.token).toBe('stored-jwt');
      expect(result.current.user).not.toBeNull();
      expect(result.current.user.email).toBe('restored@test.com');
    }, 10000);

    it('restoreToken_clears_on_invalid_profile: clears session when profile fetch fails after restore', async () => {
      SecureStore.getItemAsync.mockImplementation((key) => {
        if (key === 'auth_token') return Promise.resolve('expired-jwt');
        return Promise.resolve(null);
      });

      authApi.getCurrentUser.mockResolvedValue({
        status: 401,
        data: null,
        error: 'Unauthorized',
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      // Wait for isLoading to become false
      await waitFor(() => expect(result.current.isLoading).toBe(false), { timeout: 8000 });

      expect(result.current.token).toBeNull();
      expect(result.current.user).toBeNull();
    }, 10000);
  });
});
