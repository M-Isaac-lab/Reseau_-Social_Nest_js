// ── API Response wrappers ──

export interface ApiResponse<T> {
  statusCode: number;
  data: T;
  message: string;
}

export interface PaginatedResponse<T> {
  statusCode: number;
  data: T[];
  message: string;
  meta: PaginationMeta;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiError {
  statusCode: number;
  message: string;
  error: string;
  timestamp: string;
}

// ── Auth ──

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
}

export interface SigninResponse extends AuthTokens {
  user: {
    username: string;
    email: string;
  };
}

// ── User ──

export interface User {
  userId: number;
  username: string;
  email: string;
  bio: string | null;
  avatarUrl: string | null;
  createAt: string;
  updateAt: string;
}

export interface PublicProfile {
  userId: number;
  username: string;
  bio: string | null;
  avatarUrl: string | null;
  createAt: string;
  _count: {
    posts: number;
    followers: number;
    following: number;
  };
}

export interface FollowUser {
  userId: number;
  username: string;
  avatarUrl: string | null;
}

// ── Post ──

export interface Post {
  postId: number;
  title: string;
  body: string;
  userId: number;
  createdAt: string;
  updatedAt: string;
  user: {
    username: string;
    email: string;
    avatarUrl: string | null;
  };
  comments: Comment[];
  _count: {
    likes: number;
  };
}

// ── Comment ──

export interface Comment {
  commentId: number;
  content: string;
  postId: number;
  userId: number;
  createdAt: string;
  updatedAt: string;
  user: {
    username: string;
    email: string;
    avatarUrl?: string | null;
  };
}

// ── Like ──

export interface LikesData {
  likes: { userId: number; username: string }[];
  count: number;
}
