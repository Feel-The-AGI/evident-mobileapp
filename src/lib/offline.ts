import AsyncStorage from '@react-native-async-storage/async-storage';
import { CreateLog, Log } from './api';

const OFFLINE_LOGS_KEY = 'evident_offline_logs';

export interface OfflineLog extends CreateLog {
  localId: string;
  synced: boolean;
  createdAt: string;
}

export const offlineStorage = {
  async saveLogs(logs: OfflineLog[]): Promise<void> {
    await AsyncStorage.setItem(OFFLINE_LOGS_KEY, JSON.stringify(logs));
  },

  async getLogs(): Promise<OfflineLog[]> {
    const data = await AsyncStorage.getItem(OFFLINE_LOGS_KEY);
    return data ? JSON.parse(data) : [];
  },

  async addLog(log: CreateLog): Promise<OfflineLog> {
    const logs = await this.getLogs();
    const offlineLog: OfflineLog = {
      ...log,
      localId: `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      synced: false,
      createdAt: new Date().toISOString(),
    };
    logs.push(offlineLog);
    await this.saveLogs(logs);
    return offlineLog;
  },

  async getUnsyncedLogs(): Promise<OfflineLog[]> {
    const logs = await this.getLogs();
    return logs.filter((log) => !log.synced);
  },

  async markSynced(localIds: string[]): Promise<void> {
    const logs = await this.getLogs();
    const updated = logs.map((log) => ({
      ...log,
      synced: localIds.includes(log.localId) ? true : log.synced,
    }));
    await this.saveLogs(updated);
  },

  async clearSyncedLogs(): Promise<void> {
    const logs = await this.getLogs();
    const unsynced = logs.filter((log) => !log.synced);
    await this.saveLogs(unsynced);
  },
};
