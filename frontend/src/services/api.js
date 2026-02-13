import { API_BASE_URL, DEV_MODE, API_TIMEOUT } from "../config";

/**
 * Lightweight API client with auth header support.
 *
 * When the YARP gateway is deployed, requests go to the gateway URL
 * with `Authorization: Bearer <JWT>`. The gateway adds `X-User-Id` /
 * `X-User-Email` and forwards to the Notification Service.
 *
 * In dev mode (no gateway), userId is appended as a query parameter
 * so the backend can identify the caller without a gateway.
 */
class ApiClient {
  constructor() {
    this.baseUrl = API_BASE_URL;
    this.token = null;
    this.userId = null;
  }

  /** Store auth credentials (called after login). */
  setAuth(token, userId) {
    this.token = token;
    this.userId = userId;
  }

  /** Clear auth credentials (called on logout). */
  clearAuth() {
    this.token = null;
    this.userId = null;
  }

  /**
   * Build the full URL.
   * In dev mode, append userId as a query parameter.
   */
  _buildUrl(path) {
    let url = `${this.baseUrl}${path}`;
    if (DEV_MODE && this.userId) {
      const separator = url.includes("?") ? "&" : "?";
      url += `${separator}userId=${encodeURIComponent(this.userId)}`;
    }
    return url;
  }

  /** Build headers, including Authorization when a token is available. */
  _buildHeaders(extraHeaders = {}) {
    const headers = {
      "Content-Type": "application/json",
      ...extraHeaders,
    };
    if (this.token) {
      headers["Authorization"] = `Bearer ${this.token}`;
    }
    return headers;
  }

  /** Generic fetch wrapper with timeout and unified error handling. */
  async _request(method, path, body = null) {
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

      /* --- status-specific handling --- */
      if (response.status === 404) {
        return { status: 404, data: null, error: "Not found" };
      }
      if (response.status === 401) {
        return { status: 401, data: null, error: "Unauthorized" };
      }

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        return {
          status: response.status,
          data: null,
          error:
            data?.message ||
            data?.error ||
            `Request failed with status ${response.status}`,
          details: data?.details || null,
        };
      }

      return { status: response.status, data, error: null };
    } catch (error) {
      if (error.name === "AbortError") {
        return { status: 0, data: null, error: "Request timed out" };
      }
      return { status: 0, data: null, error: error.message || "Network error" };
    } finally {
      clearTimeout(timeout);
    }
  }

  get(path) {
    return this._request("GET", path);
  }
  post(path, body) {
    return this._request("POST", path, body);
  }
  put(path, body) {
    return this._request("PUT", path, body);
  }
  delete(path) {
    return this._request("DELETE", path);
  }
}

/** Singleton API client used throughout the app. */
export const apiClient = new ApiClient();
