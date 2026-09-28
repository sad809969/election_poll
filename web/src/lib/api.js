import { parseAllowedPages } from './access';

export const getApiBase = () => {
  if (process.env.NEXT_PUBLIC_API_BASE_URL) {
    return process.env.NEXT_PUBLIC_API_BASE_URL;
  }
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
    if (window.location.hostname.includes('vercel.app')) {
      return 'https://pdp-pollwatch-backend.onrender.com/api';
    }
    return `${window.location.origin}/api`;
  }
  return 'http://localhost:8000/api';
};

export const API_BASE = getApiBase();

/**
 * Generic API request wrapper
 */
export async function apiFetch(endpoint, options = {}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  return handleResponse(response);
}

async function handleResponse(response) {
  if (response.status === 401 && typeof window !== 'undefined') {
    // Session missing or expired: send the user back to sign in.
    logoutUser();
    if (window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `Request failed with status ${response.status}`);
  }

  return response.json();
}

/**
 * Upload the photographed Form EC8A sheet for a submitted result.
 */
export async function uploadEc8aPhoto(resultId, file) {
  const token = getToken();
  const body = new FormData();
  body.append('file', file);

  const response = await fetch(`${API_BASE}/results/${resultId}/ec8a-photo`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body,
  });

  return handleResponse(response);
}

/**
 * Auth Login Helper (Handles OAuth2 x-www-form-urlencoded format)
 */
export async function loginUser(username, password) {
  const params = new URLSearchParams();
  params.append('username', username);
  params.append('password', password);

  const response = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Login failed. Please check your credentials.');
  }

  const data = await response.json();

  // Save JWT token and user info to localStorage
  if (typeof window !== 'undefined' && data.access_token) {
    localStorage.setItem('token', data.access_token);
    storeUser(data);
  }

  return getCurrentUser() || data;
}

function storeUser(data) {
  localStorage.setItem(
    'user',
    JSON.stringify({
      id: data.id,
      username: data.username,
      role: data.role,
      full_name: data.full_name || data.username,
      allowed_pages: parseAllowedPages(data.allowed_pages),
      lga_id: data.lga_id ?? null,
      ward_id: data.ward_id ?? null,
      polling_unit_id: data.polling_unit_id ?? null,
    })
  );
}

/**
 * Reload the signed-in user's role and page permissions from the server, so
 * permission changes made by an administrator apply without signing out.
 * Returns the refreshed user, or null when the session is no longer valid.
 */
export async function refreshCurrentUser() {
  if (typeof window === 'undefined' || !getToken()) return null;
  try {
    const me = await apiFetch('/auth/me');
    storeUser(me);
    return getCurrentUser();
  } catch {
    return getToken() ? getCurrentUser() : null;
  }
}

/**
 * Auth Logout Helper
 */
export function logoutUser() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }
}

export function getCurrentUser() {
  if (typeof window === "undefined") return null;

  const user = localStorage.getItem("user");
  return user ? JSON.parse(user) : null;
}

export function getToken() {
  if (typeof window === "undefined") return null;

  return localStorage.getItem("token");
}