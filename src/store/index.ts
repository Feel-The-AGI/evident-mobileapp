import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api, User, Log, CreateLog } from '../lib/api';
import { offlineStorage, OfflineLog } from '../lib/offline';

interface AuthState {
  token: string | null;
  user: User | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      isLoading: false,
      error: null,

      login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          const res = await api.auth.login(email, password);
          set({ token: res.accessToken, user: res.user, isLoading: false });
        } catch (err) {
          set({ error: (err as Error).message, isLoading: false });
          throw err;
        }
      },

      register: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          const res = await api.auth.register(email, password);
          set({ token: res.accessToken, user: res.user, isLoading: false });
        } catch (err) {
          set({ error: (err as Error).message, isLoading: false });
          throw err;
        }
      },

      logout: () => set({ token: null, user: null }),
      clearError: () => set({ error: null }),
    }),
    {
      name: 'evident-auth',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

interface LogsState {
  logs: Log[];
  offlineLogs: OfflineLog[];
  view: 'today' | 'this-week' | 'last-week';
  isLoading: boolean;
  error: string | null;
  setView: (view: 'today' | 'this-week' | 'last-week') => void;
  fetchLogs: () => Promise<void>;
  createLog: (log: CreateLog) => Promise<void>;
  syncOfflineLogs: () => Promise<void>;
  loadOfflineLogs: () => Promise<void>;
}

export const useLogsStore = create<LogsState>((set, get) => ({
  logs: [],
  offlineLogs: [],
  view: 'today',
  isLoading: false,
  error: null,

  setView: (view) => {
    set({ view });
    get().fetchLogs();
  },

  fetchLogs: async () => {
    const token = useAuthStore.getState().token;
    if (!token) return;

    set({ isLoading: true, error: null });
    try {
      const { view } = get();
      let logs: Log[];

      switch (view) {
        case 'today':
          logs = await api.logs.today(token);
          break;
        case 'this-week':
          logs = await api.logs.thisWeek(token);
          break;
        case 'last-week':
          logs = await api.logs.lastWeek(token);
          break;
      }

      set({ logs, isLoading: false });
    } catch (err) {
      set({ error: (err as Error).message, isLoading: false });
    }
  },

  createLog: async (log) => {
    const offlineLog = await offlineStorage.addLog({ ...log, source: 'MOBILE' });
    set((state) => ({ offlineLogs: [...state.offlineLogs, offlineLog] }));
    get().syncOfflineLogs();
  },

  syncOfflineLogs: async () => {
    const token = useAuthStore.getState().token;
    if (!token) return;

    try {
      const unsynced = await offlineStorage.getUnsyncedLogs();
      if (unsynced.length === 0) return;

      const logsToSync = unsynced.map(({ localId, synced, createdAt, ...log }) => log);
      await api.logs.sync(token, logsToSync);

      await offlineStorage.markSynced(unsynced.map((l) => l.localId));
      await offlineStorage.clearSyncedLogs();

      set({ offlineLogs: [] });
      get().fetchLogs();
    } catch {
      // Silent fail - will retry later
    }
  },

  loadOfflineLogs: async () => {
    const logs = await offlineStorage.getLogs();
    set({ offlineLogs: logs });
  },
}));
