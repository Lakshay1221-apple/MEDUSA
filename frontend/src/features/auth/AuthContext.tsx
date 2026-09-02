'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User } from '@/lib/types/domain';
import { LoginDto, SignupDto } from '@/lib/types/api';
import { authApi, usersApi } from '@/lib/api/endpoints';
import { apiClient } from '@/lib/api/client';
import { parseApiError, ApiError } from '@/lib/api/error';

export type AuthStatus = 'UNAUTHENTICATED' | 'AUTHENTICATING' | 'AUTHENTICATED' | 'SESSION_EXPIRED';

interface AuthContextType {
  user: User | null;
  status: AuthStatus;
  isLoading: boolean;
  login: (dto: LoginDto) => Promise<void>;
  signup: (dto: SignupDto) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<AuthStatus>('AUTHENTICATING');

  const refreshProfile = useCallback(async () => {
    try {
      const profile = await usersApi.getProfile();
      setUser(profile);
      setStatus('AUTHENTICATED');
    } catch {
      setUser(null);
      setStatus('UNAUTHENTICATED');
      apiClient.clearTokens();
    }
  }, []);

  useEffect(() => {
    const unsub = apiClient.onSessionExpired(() => {
      setUser(null);
      setStatus('SESSION_EXPIRED');
    });

    const token = apiClient.getAccessToken();
    if (token) {
      refreshProfile();
    } else {
      setStatus('UNAUTHENTICATED');
    }

    return () => unsub();
  }, [refreshProfile]);

  const login = async (dto: LoginDto) => {
    try {
      setStatus('AUTHENTICATING');
      const response = await authApi.login(dto);
      apiClient.setTokens(response.tokens.access_token, response.tokens.refresh_token);
      setUser(response.user);
      setStatus('AUTHENTICATED');
    } catch (err) {
      setStatus('UNAUTHENTICATED');
      throw parseApiError(err);
    }
  };

  const signup = async (dto: SignupDto) => {
    try {
      setStatus('AUTHENTICATING');
      const response = await authApi.signup(dto);
      apiClient.setTokens(response.tokens.access_token, response.tokens.refresh_token);
      setUser(response.user);
      setStatus('AUTHENTICATED');
    } catch (err) {
      setStatus('UNAUTHENTICATED');
      throw parseApiError(err);
    }
  };

  const logout = async () => {
    const refreshToken = apiClient.getRefreshToken();
    if (refreshToken) {
      try {
        await authApi.logout({ refresh_token: refreshToken });
      } catch {
        // Ignore logout errors
      }
    }
    apiClient.clearTokens();
    setUser(null);
    setStatus('UNAUTHENTICATED');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        status,
        isLoading: status === 'AUTHENTICATING',
        login,
        signup,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
