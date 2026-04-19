import { API_BASE_URL, DEV_MODE, API_TIMEOUT } from '../config';
import { generateCorrelationId } from '../utils/correlationId';

/**
 * Lightweight API client with auth header support and automatic token refresh.
 *
 * When the YARP gateway is deployed, requests go to the gateway URL
 * with `Authorization: Bearer <JWT>`. The gateway adds `X-User-Id` /
 * `X-User-Email` and forwards to the Notification Service.
 *
 * In dev mode (no gateway), userId is appended as a query parameter
 * so the backend can identify the caller without a gateway.
 *
 * On 401 responses, the client attempts one token refresh via
 * POST /api/auth/refresh and retries the original request automatically.
 */
class ApiClient {
  constructor() {
    this.baseUrl = API_BASE_URL;
    this.token = null;
    this.userId = null;
    this.refreshToken = null;
    this._refreshPromise = null;
    this._onTokenRefresh = null;
  }

  /** Store auth credentials (called after login). */
  setAuth(token, userId, refreshToken = null) {
    this.token = token;
    this.userId = userId;
    this.refreshToken = refreshToken;
  }

  /** Clear auth credentials (called on logout). */
  clearAuth() {
    this.token = null;
    this.userId = null;
    this.refreshToken = null;
    this._refreshPromise = null;
  }

  /**
   * Register a callback that will be invoked whenever tokens are silently
   * refreshed, so the caller can persist the new credentials.
   */
  onTokenRefresh(callback) {
    this._onTokenRefresh = callback;
  }

  /**
   * Build the full URL.
   * In dev mode, append userId as a query parameter.
   */
  _buildUrl(path) {
    let url = `${this.baseUrl}${path}`;
    if (DEV_MODE && this.userId) {
      const separator = url.includes('?') ? '&' : '?';
      url += `${separator}userId=${encodeURIComponent(this.userId)}`;
    }
    return url;
  }

  /** Build headers, including Authorization when a token is available. */
  _buildHeaders(extraHeaders = {}) {
    const headers = {
      'Content-Type': 'application/json',
      // Always attach a correlation id so every request can be traced
      // end-to-end in our observability stack. The backend accepts this
      // header unchanged and propagates it across all downstream services.
      'X-Correlation-Id': generateCorrelationId(),
      ...extraHeaders,
    };
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    return headers;
  }

  /**
   * Attempt a silent token refresh.
   * Deduplicates concurrent refresh calls — only one request is issued at a time.
   * Returns the parsed response body on success, or null on failure.
   */
  async _attemptRefresh() {
    if (!this.refreshToken) return null;
    if (this._refreshPromise) return this._refreshPromise;

    this._refreshPromise = (async () => {
      try {
        const response = await fetch(`${this.baseUrl}/api/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken: this.refreshToken }),
        });
        if (!response.ok) return null;
        const data = await response.json();
        return data;
      } catch {
        return null;
      } finally {
        this._refreshPromise = null;
      }
    })();

    return this._refreshPromise;
  }

  /**
   * Generic fetch wrapper with timeout, unified error handling, and
   * automatic 401 -> refresh -> retry logic.
   *
   * @param {string} method HTTP method
   * @param {string} path   URL path relative to baseUrl
   * @param {object|null} body Request body (JSON-serializable)
   * @param {boolean} _isRetry Internal flag to prevent infinite retry loops
   */
  async _request(method, path, body = null, _isRetry = false) {
    const url = this._buildUrl(path);
    const headers = this._buildHeaders();

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), API_TIMEOUT);

    try {
      const options = { method, headers, signal: controller.signal };

      if (body) {
        options.body = JSON.stringify(body);
      }

      const response = await fetch(url, options);
      const data = await response.json().catch(() => null);
      const message =
        data?.message ||
        data?.error ||
        response.statusText ||
        `Request failed with status ${response.status}`;

      /* --- status-specific handling --- */
      if (response.status === 401) {
        // Attempt one silent refresh if we have a refresh token and haven't retried yet.
        if (!_isRetry && this.refreshToken) {
          const refreshResult = await this._attemptRefresh();
          if (refreshResult) {
            const newToken = refreshResult.token ?? refreshResult.Token;
            const newRefreshToken = refreshResult.refreshToken ?? refreshResult.RefreshToken;
            if (newToken) {
              this.token = newToken;
              this.refreshToken = newRefreshToken ?? this.refreshToken;
              if (this._onTokenRefresh) {
                this._onTokenRefresh(this.token, this.refreshToken);
              }
              // Retry the original request once with the new token.
              return this._request(method, path, body, true);
            }
          }
        }
        return { status: 401, data: null, error: message || 'Unauthorized' };
      }
      if (response.status === 403) {
        return { status: 403, data: null, error: message || 'Forbidden' };
      }
      if (response.status === 404) {
        return { status: 404, data: null, error: message || 'Not found' };
      }
      if (response.status === 429) {
        return {
          status: 429,
          data: null,
          error: message || 'Too many requests',
          retryAfter: response.headers.get('Retry-After'),
        };
      }

      if (!response.ok) {
        return {
          status: response.status,
          data: null,
          error: message,
          details: data?.details || null,
        };
      }

      return { status: response.status, data, error: null };
    } catch (error) {
      if (error.name === 'AbortError') {
        return { status: 0, data: null, error: 'Request timed out' };
      }
      return { status: 0, data: null, error: error.message || 'Network error' };
    } finally {
      clearTimeout(timeout);
    }
  }

  get(path) {
    return this._request('GET', path);
  }
  post(path, body) {
    return this._request('POST', path, body);
  }
  put(path, body) {
    return this._request('PUT', path, body);
  }
  patch(path, body) {
    return this._request('PATCH', path, body);
  }
  delete(path, body = null) {
    return this._request('DELETE', path, body);
  }
}

/** Singleton API client used throughout the app. */
export const apiClient = new ApiClient();
