import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'https://evident-api.onrender.com/api';

interface RequestOptions {
  method?: string;
  body?: object;
  token?: string;
}

async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, token } = options;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || 'Request failed');
  }

  return res.json();
}

export const api = {
  setToken: (token: string) => {
    // Token is passed per-request, this is for compatibility
  },

  login: (email: string, password: string) =>
    request<{ accessToken: string; user: User }>('/auth/login', {
      method: 'POST',
      body: { email, password },
    }),

  register: (email: string, password: string) =>
    request<{ accessToken: string; user: User }>('/auth/register', {
      method: 'POST',
      body: { email, password },
    }),

  getLogs: (timeView: string, token?: string) => {
    const endpoint = timeView === 'today' ? '/logs/today' 
      : timeView === 'this-week' ? '/logs/this-week' 
      : '/logs/last-week';
    return request<Log[]>(endpoint, { token });
  },

  createLog: (log: CreateLog, token?: string) =>
    request<Log>('/logs', { method: 'POST', body: log, token }),

  deleteLog: (id: string, token?: string) =>
    request<{ deleted: boolean }>(`/logs/${id}`, { method: 'DELETE', token }),

  syncLogs: (logs: CreateLog[], token?: string) =>
    request<{ synced: number }>('/logs/sync', { method: 'POST', body: { logs }, token }),

  generateSummary: (timeRange: string, token?: string) => {
    const now = new Date();
    let startDate: Date, endDate: Date;
    
    if (timeRange === 'today') {
      startDate = new Date(now.setHours(0, 0, 0, 0));
      endDate = new Date();
    } else if (timeRange === 'this-week') {
      const day = now.getDay();
      startDate = new Date(now.setDate(now.getDate() - day));
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date();
    } else {
      const day = now.getDay();
      endDate = new Date(now.setDate(now.getDate() - day - 1));
      endDate.setHours(23, 59, 59, 999);
      startDate = new Date(endDate);
      startDate.setDate(startDate.getDate() - 6);
      startDate.setHours(0, 0, 0, 0);
    }
    
    return request<ExportResult>('/exports/generate', {
      method: 'POST',
      body: { startDate: startDate.toISOString(), endDate: endDate.toISOString() },
      token,
    });
  },

  exportPDF: (timeRange: string, token?: string) => {
    // PDF export would be handled similarly
    return api.generateSummary(timeRange, token);
  },

  canExport: (token?: string) =>
    request<{ allowed: boolean; reason?: string }>('/users/can-export', { token }),
};

export interface User {
  id: string;
  email: string;
  subscriptionStatus: string;
}

export interface Log {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  activityType: ActivityType;
  description: string;
  reference?: string;
  source: 'WEB' | 'MOBILE';
  createdAt: string;
}

export interface CreateLog {
  date: string;
  startTime: string;
  endTime: string;
  activityType: ActivityType;
  description: string;
  reference?: string;
  source?: 'WEB' | 'MOBILE';
}

export type ActivityType = 'WORK' | 'MEETING' | 'FIELD' | 'TRAVEL' | 'ADMIN';

export interface ExportResult {
  id: string;
  format: string;
  textContent: string;
  dateRange: { start: string; end: string };
  logCount: number;
}
