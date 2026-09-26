const getApiBase = () => {
  if (process.env.NEXT_PUBLIC_API_BASE_URL) {
    return process.env.NEXT_PUBLIC_API_BASE_URL;
  }
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
    return `${window.location.origin}/api`;
  }
  return 'http://localhost:8000/api';
};

const API_BASE = getApiBase();

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

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `Request failed with status ${response.status}`);
  }

  return response.json();
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
    // Check local custom users fallback
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('pdp_custom_users');
        if (stored) {
          const customUsers = JSON.parse(stored);
          const found = customUsers.find(
            (u) =>
              (u.username === username || u.phone === username || u.phone_number === username) &&
              (!u.password || u.password === password)
          );
          if (found) {
            let parsedPages = found.allowedPages || [];
            if (!parsedPages || parsedPages.length === 0) {
              if (found.allowed_pages) {
                try {
                  parsedPages =
                    typeof found.allowed_pages === 'string'
                      ? JSON.parse(found.allowed_pages)
                      : found.allowed_pages;
                } catch (e) {
                  parsedPages = found.allowed_pages.split(',').map((s) => s.trim());
                }
              }
            }
            const fallbackToken = 'custom_session_' + Date.now();
            localStorage.setItem('token', fallbackToken);
            const userObj = {
              username: found.username,
              role: found.role,
              full_name: found.full_name || found.name || found.username,
              allowed_pages: parsedPages,
            };
            localStorage.setItem('user', JSON.stringify(userObj));
            return {
              access_token: fallbackToken,
              token_type: 'bearer',
              role: found.role,
              username: found.username,
              full_name: found.full_name || found.name || found.username,
              allowed_pages: parsedPages,
            };
          }
        }
      } catch (err) {
        console.warn('Custom user fallback check failed:', err);
      }
    }

    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Login failed. Please check your credentials.');
  }

  const data = await response.json();

  // Save JWT token and user info to localStorage
  if (typeof window !== 'undefined' && data.access_token) {
    let parsedPages = null;
    if (data.allowed_pages) {
      try {
        parsedPages = typeof data.allowed_pages === 'string' ? JSON.parse(data.allowed_pages) : data.allowed_pages;
      } catch (e) {
        parsedPages = data.allowed_pages.split(',').map(s => s.trim());
      }
    }

    localStorage.setItem('token', data.access_token);
    localStorage.setItem(
      'user',
      JSON.stringify({
        username: data.username,
        role: data.role,
        full_name: data.full_name || data.username,
        allowed_pages: parsedPages,
      })
    );
  }

  return data;
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