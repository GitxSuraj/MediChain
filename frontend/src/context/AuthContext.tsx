import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { AuthContextType, AuthState, LoginCredentials, Patient, RegisterCredentials } from '../types/auth';
import { fetchCurrentUser, loginRequest, registerRequest, logoutRequest } from '../services/auth';

const TOKEN_STORAGE_KEY = 'medichain_token';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: true,
  });
  const [error, setError] = useState<string | null>(null);

  // Rehydrate session on load
  useEffect(() => {
    const storedToken = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (!storedToken) {
      setState((prev) => ({ ...prev, isLoading: false }));
      return;
    }

    fetchCurrentUser(storedToken)
      .then((user: Patient) => {
        setState({ user, token: storedToken, isAuthenticated: true, isLoading: false });
      })
      .catch(() => {
        localStorage.removeItem(TOKEN_STORAGE_KEY);
        setState({ user: null, token: null, isAuthenticated: false, isLoading: false });
      });
  }, []);

  const login = useCallback(async (credentials: LoginCredentials) => {
    setError(null);
    setState((prev) => ({ ...prev, isLoading: true }));
    try {
      const { user, token } = await loginRequest(credentials);
      localStorage.setItem(TOKEN_STORAGE_KEY, token);
      setState({ user, token, isAuthenticated: true, isLoading: false });
    } catch (err) {
      setState((prev) => ({ ...prev, isLoading: false }));
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
      throw err;
    }
  }, []);

  const register = useCallback(async (credentials: RegisterCredentials) => {
    setError(null); setState((prev) => ({ ...prev, isLoading: true }));
    try {
      const { user, token } = await registerRequest(credentials);
      localStorage.setItem(TOKEN_STORAGE_KEY, token);
      setState({ user, token, isAuthenticated: true, isLoading: false });
    } catch (err) {
      setState((prev) => ({ ...prev, isLoading: false }));
      setError(err instanceof Error ? err.message : 'Could not create account.'); throw err;
    }
  }, []);

  const logout = useCallback(() => {
    logoutRequest().finally(() => {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      setState({ user: null, token: null, isAuthenticated: false, isLoading: false });
    });
  }, []);

  const updateUser = useCallback((user: Patient) => {
    setState((prev) => ({ ...prev, user }));
  }, []);

  const clearError = useCallback(() => setError(null), []);

  const value = useMemo<AuthContextType>(
    () => ({ ...state, error, login, register, updateUser, logout, clearError }),
    [state, error, login, register, updateUser, logout, clearError]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
