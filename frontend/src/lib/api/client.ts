import { ApiError } from './error';
import { ApiResponse, ApiErrorResponse } from '../types/api';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

class ApiClient {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private refreshPromise: Promise<string | null> | null = null;
  private onSessionExpiredCallbacks: Array<() => void> = [];

  constructor() {
    if (typeof window !== 'undefined') {
      this.accessToken = localStorage.getItem('medusa_access_token');
      this.refreshToken = localStorage.getItem('medusa_refresh_token');
    }
  }

  public setTokens(access: string | null, refresh: string | null) {
    this.accessToken = access;
    this.refreshToken = refresh;
    if (typeof window !== 'undefined') {
      if (access) localStorage.setItem('medusa_access_token', access);
      else localStorage.removeItem('medusa_access_token');

      if (refresh) localStorage.setItem('medusa_refresh_token', refresh);
      else localStorage.removeItem('medusa_refresh_token');
    }
  }

  public clearTokens() {
    this.setTokens(null, null);
  }

  public getAccessToken(): string | null {
    return this.accessToken;
  }

  public getRefreshToken(): string | null {
    return this.refreshToken;
  }

  public onSessionExpired(callback: () => void) {
    this.onSessionExpiredCallbacks.push(callback);
    return () => {
      this.onSessionExpiredCallbacks = this.onSessionExpiredCallbacks.filter(
        (cb) => cb !== callback,
      );
    };
  }

  private notifySessionExpired() {
    this.clearTokens();
    this.onSessionExpiredCallbacks.forEach((cb) => cb());
  }

  private async refreshAccessToken(): Promise<string | null> {
    if (!this.refreshToken) {
      this.notifySessionExpired();
      return null;
    }

    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = (async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh_token: this.refreshToken }),
        });

        if (!response.ok) {
          this.notifySessionExpired();
          return null;
        }

        const json: ApiResponse<{
          user: any;
          tokens: { access_token: string; refresh_token: string };
        }> = await response.json();

        const newAccessToken = json.data.tokens.access_token;
        const newRefreshToken = json.data.tokens.refresh_token;
        this.setTokens(newAccessToken, newRefreshToken);
        return newAccessToken;
      } catch {
        this.notifySessionExpired();
        return null;
      } finally {
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    retry = true,
  ): Promise<T> {
    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    let response: Response;
    try {
      response = await fetch(url, { ...options, headers });
    } catch (err: any) {
      throw new ApiError(
        err.message || 'Network connection failed. Is the server running?',
        'NETWORK_ERROR',
        0,
      );
    }

    // Handle 401 Unauthorized token refresh
    if (response.status === 401 && retry && this.refreshToken && !endpoint.includes('/auth/login') && !endpoint.includes('/auth/refresh')) {
      const newToken = await this.refreshAccessToken();
      if (newToken) {
        return this.request<T>(endpoint, options, false);
      }
    }

    let responseData: any = null;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      try {
        responseData = await response.json();
      } catch {
        responseData = null;
      }
    }

    if (!response.ok) {
      const errorData = responseData as ApiErrorResponse | null;
      const code = errorData?.error?.code || `HTTP_${response.status}`;
      const message = errorData?.error?.message || response.statusText || 'Request failed';
      const details = errorData?.error?.details;
      throw new ApiError(message, code, response.status, details);
    }

    // Unpack NestJS TransformInterceptor standard wrapper { data, meta }
    if (responseData && typeof responseData === 'object' && 'data' in responseData) {
      return responseData.data as T;
    }

    return responseData as T;
  }

  public get<T>(endpoint: string, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  public post<T>(endpoint: string, body?: any, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  }

  public patch<T>(endpoint: string, body?: any, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  }

  public delete<T>(endpoint: string, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }
}

export const apiClient = new ApiClient();
