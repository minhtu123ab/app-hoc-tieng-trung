'use client';

import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  (typeof window !== 'undefined' ? '/api/proxy' : process.env.BACKEND_URL ?? 'http://localhost:4000');

export const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

let accessToken: string | null = null;
let refreshToken: string | null = null;

export function setTokens(access: string, refresh: string) {
  accessToken = access;
  refreshToken = refresh;
  if (typeof window !== 'undefined') {
    localStorage.setItem('lf_access', access);
    localStorage.setItem('lf_refresh', refresh);
  }
}

export function loadTokens() {
  if (typeof window !== 'undefined') {
    accessToken = localStorage.getItem('lf_access');
    refreshToken = localStorage.getItem('lf_refresh');
  }
  return { accessToken, refreshToken };
}

export function clearTokens() {
  accessToken = null;
  refreshToken = null;
  if (typeof window !== 'undefined') {
    localStorage.removeItem('lf_access');
    localStorage.removeItem('lf_refresh');
  }
}

loadTokens();

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

let refreshing: Promise<string | null> | null = null;

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    if (error.response?.status === 401 && !original._retry && refreshToken) {
      original._retry = true;
      if (!refreshing) {
        refreshing = api
          .post('/auth/refresh', { refreshToken })
          .then((res) => {
            const { accessToken: access, refreshToken: refresh } = res.data;
            setTokens(access, refresh);
            return access as string;
          })
          .catch(() => {
            clearTokens();
            return null;
          })
          .finally(() => {
            refreshing = null;
          });
      }
      const newToken = await refreshing;
      if (newToken) {
        original.headers.Authorization = `Bearer ${newToken}`;
        return api(original);
      }
    }

    // Tránh retry vòng lặp khi token hết hạn
    if (error.response?.status === 401 && original.url?.includes('/auth/me')) {
      clearTokens();
    }
    return Promise.reject(error);
  },
);

export async function login(email: string, password: string) {
  const { data } = await api.post('/auth/login', { email, password });
  setTokens(data.accessToken, data.refreshToken);
  return data;
}

export async function register(payload: {
  email: string;
  password: string;
  name: string;
  hskLevel?: string;
}) {
  const { data } = await api.post('/auth/register', payload);
  setTokens(data.accessToken, data.refreshToken);
  return data;
}

export async function getMe() {
  const { data } = await api.get('/auth/me');
  return data;
}

export async function logout() {
  clearTokens();
}
