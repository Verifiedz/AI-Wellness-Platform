import { API_BASE_URL, API_TIMEOUT } from "../config";
import { apiClient } from "./api";

function normalizeError(status, data, fallback) {
  return {
    status,
    data: null,
    error: data?.message || data?.error || fallback,
    details: data?.details || null,
  };
}

async function requestWithToken(path, token) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), API_TIMEOUT);

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      signal: controller.signal,
    });

    const data = await response.json().catch(() => null);
    if (!response.ok) {
      return normalizeError(
        response.status,
        data,
        `Request failed with status ${response.status}`
      );
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

export const authApi = {
  login(email, password) {
    return apiClient.post("/api/auth/login", { email, password });
  },

  verifyTwoFactor(email, code) {
    return apiClient.post("/api/auth/verify-2fa", { email, code });
  },

  getCurrentUser(token) {
    return requestWithToken("/api/auth/user-info", token);
  },
};
