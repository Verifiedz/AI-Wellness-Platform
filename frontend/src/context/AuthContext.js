import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";
import * as SecureStore from "expo-secure-store";

const AuthContext = createContext(null);

const AUTH_TOKEN_KEY = "auth_token";
const USER_ID_KEY = "user_id";
const USER_EMAIL_KEY = "user_email";

/**
 * Placeholder Auth Provider
 *
 * Implements a dev-only "login" that stores a mock JWT and user info.
 *
 * **When the real Authentication Service is ready**, replace the `login`
 * method body with a real API call (e.g. POST /api/auth/login) and store
 * the real JWT. The rest of the app—token storage, "logged-in" state,
 * and API Authorization header—stays the same.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore persisted session on app start
  useEffect(() => {
    (async () => {
      try {
        const storedToken = await SecureStore.getItemAsync(AUTH_TOKEN_KEY);
        const storedUserId = await SecureStore.getItemAsync(USER_ID_KEY);
        const storedEmail = await SecureStore.getItemAsync(USER_EMAIL_KEY);

        if (storedToken && storedUserId) {
          setToken(storedToken);
          setUser({ id: storedUserId, email: storedEmail || "" });
        }
      } catch (error) {
        console.warn("Failed to restore auth session:", error);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  /**
   * Placeholder login – creates a mock JWT.
   *
   * TODO: Replace with real Auth Service call:
   *   const res = await authApi.login(email, password);
   *   const { token, user } = res.data;
   */
  const login = useCallback(async (userId, email = "") => {
    const mockToken = `dev-jwt-${userId}-${Date.now()}`;

    await SecureStore.setItemAsync(AUTH_TOKEN_KEY, mockToken);
    await SecureStore.setItemAsync(USER_ID_KEY, userId);
    await SecureStore.setItemAsync(USER_EMAIL_KEY, email);

    setToken(mockToken);
    setUser({ id: userId, email });
  }, []);

  const logout = useCallback(async () => {
    await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);
    await SecureStore.deleteItemAsync(USER_ID_KEY);
    await SecureStore.deleteItemAsync(USER_EMAIL_KEY);

    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, token, isLoggedIn: !!user, isLoading, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
