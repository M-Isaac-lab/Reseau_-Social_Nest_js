import type {
  ApiResponse,
  PaginatedResponse,
  SigninResponse,
  User,
  PublicProfile,
  Post,
  Comment,
  LikesData,
  FollowUser,
  AuthTokens,
} from './types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

// ── Token storage ──

function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('access_token');
}

function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('refresh_token');
}

export function setTokens(access: string, refresh: string) {
  localStorage.setItem('access_token', access);
  localStorage.setItem('refresh_token', refresh);
}

export function clearTokens() {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
}

// ── Fetch wrapper with auto-refresh ──

let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

async function refreshTokens(): Promise<boolean> {
  const refresh = getRefreshToken();
  if (!refresh) return false;

  try {
    const res = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: refresh }),
    });
    if (!res.ok) return false;
    const json = await res.json();
    const tokens: AuthTokens = json.data ?? json;
    setTokens(tokens.access_token, tokens.refresh_token);
    return true;
  } catch {
    return false;
  }
}

async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  const token = getAccessToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  let res = await fetch(`${API_URL}${path}`, { ...options, headers });

  // Auto-refresh on 401
  if (res.status === 401 && getRefreshToken()) {
    if (!isRefreshing) {
      isRefreshing = true;
      refreshPromise = refreshTokens();
    }
    const refreshed = await refreshPromise;
    isRefreshing = false;
    refreshPromise = null;

    if (refreshed) {
      headers['Authorization'] = `Bearer ${getAccessToken()}`;
      res = await fetch(`${API_URL}${path}`, { ...options, headers });
    }
  }

  if (!res.ok) {
    const error = await res.json().catch(() => ({
      statusCode: res.status,
      message: res.statusText,
      error: 'Error',
    }));
    throw error;
  }

  return res.json();
}

// ── Auth API ──

export const auth = {
  signup(data: { username: string; email: string; password: string }) {
    return apiFetch<ApiResponse<string>>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  signin(data: { email: string; password: string }) {
    return apiFetch<ApiResponse<SigninResponse>>('/auth/signin', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getProfile() {
    return apiFetch<ApiResponse<User>>('/auth/profile');
  },

  updateProfile(data: { username?: string; bio?: string; avatarUrl?: string }) {
    return apiFetch<ApiResponse<User>>('/auth/profile', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  resetPassword(data: { email: string; password: string }) {
    return apiFetch<ApiResponse<string>>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  confirmResetPassword(data: {
    email: string;
    password: string;
    code: string;
  }) {
    return apiFetch<ApiResponse<string>>('/auth/reset-password/confirm', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  deleteAccount(data: { email: string; password: string }) {
    return apiFetch<ApiResponse<string>>('/auth/account', {
      method: 'DELETE',
      body: JSON.stringify(data),
    });
  },

  confirmDeleteAccount(data: {
    email: string;
    password: string;
    code: string;
  }) {
    return apiFetch<ApiResponse<string>>('/auth/account/confirm', {
      method: 'DELETE',
      body: JSON.stringify(data),
    });
  },
};

// ── Users API ──

export const users = {
  getPublicProfile(id: number) {
    return apiFetch<ApiResponse<PublicProfile>>(`/users/${id}`);
  },

  follow(id: number) {
    return apiFetch<ApiResponse<string>>(`/users/${id}/follow`, {
      method: 'POST',
    });
  },

  unfollow(id: number) {
    return apiFetch<ApiResponse<string>>(`/users/${id}/follow`, {
      method: 'DELETE',
    });
  },

  getFollowers(id: number) {
    return apiFetch<ApiResponse<FollowUser[]>>(`/users/${id}/followers`);
  },

  getFollowing(id: number) {
    return apiFetch<ApiResponse<FollowUser[]>>(`/users/${id}/following`);
  },
};

// ── Posts API ──

export const posts = {
  getAll(page = 1, limit = 10) {
    return apiFetch<PaginatedResponse<Post>>(
      `/posts?page=${page}&limit=${limit}`,
    );
  },

  getFeed(page = 1, limit = 10) {
    return apiFetch<PaginatedResponse<Post>>(
      `/posts/feed?page=${page}&limit=${limit}`,
    );
  },

  create(data: { title: string; body?: string }) {
    return apiFetch<ApiResponse<string>>('/posts', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update(id: number, data: { title?: string; body?: string }) {
    return apiFetch<ApiResponse<string>>(`/posts/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  delete(id: number) {
    return apiFetch<ApiResponse<string>>(`/posts/${id}`, {
      method: 'DELETE',
    });
  },
};

// ── Comments API ──

export const comments = {
  getByPost(postId: number) {
    return apiFetch<ApiResponse<Comment[]>>(`/posts/${postId}/comments`);
  },

  create(postId: number, content: string) {
    return apiFetch<ApiResponse<string>>(`/posts/${postId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
  },

  update(id: number, content: string) {
    return apiFetch<ApiResponse<string>>(`/comments/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ content }),
    });
  },

  delete(id: number) {
    return apiFetch<ApiResponse<string>>(`/comments/${id}`, {
      method: 'DELETE',
    });
  },
};

// ── Likes API ──

export const likes = {
  like(postId: number) {
    return apiFetch<ApiResponse<string>>(`/posts/${postId}/like`, {
      method: 'POST',
    });
  },

  unlike(postId: number) {
    return apiFetch<ApiResponse<string>>(`/posts/${postId}/like`, {
      method: 'DELETE',
    });
  },

  getByPost(postId: number) {
    return apiFetch<ApiResponse<LikesData>>(`/posts/${postId}/likes`);
  },
};
