import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { RootStackParamList } from '../../App';
import { useLogsStore, useAuthStore } from '../store';
import { offlineStorage } from '../lib/offline';
import { api } from '../lib/api';
import LogCard from '../components/LogCard';

type TimeView = 'today' | 'this-week' | 'last-week';

const TIME_VIEWS: { key: TimeView; label: string }[] = [
  { key: 'today', label: 'Today' },
  { key: 'this-week', label: 'This Week' },
  { key: 'last-week', label: 'Last Week' },
];

export default function DashboardScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { logs, setLogs, syncLogs } = useLogsStore();
  const { logout, token } = useAuthStore();
  const [timeView, setTimeView] = useState<TimeView>('today');
  const [refreshing, setRefreshing] = useState(false);

  const loadLogs = async () => {
    try {
      if (token) {
        api.setToken(token);
        const remoteLogs = await api.getLogs(timeView);
        setLogs(remoteLogs);
      }
    } catch (err) {
      const localLogs = await offlineStorage.getLogs();
      setLogs(localLogs as any);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadLogs();
    }, [timeView, token])
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    await syncLogs();
    await loadLogs();
    setRefreshing(false);
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: logout },
    ]);
  };

  const handleDelete = async (id: string) => {
    Alert.alert('Delete Log', 'Are you sure you want to delete this log?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            if (token) {
              api.setToken(token);
              await api.deleteLog(id);
            }
            await loadLogs();
          } catch (err: any) {
            Alert.alert('Error', err.message || 'Failed to delete');
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.header}>
        <View style={styles.timeNav}>
          {TIME_VIEWS.map(({ key, label }) => (
            <TouchableOpacity
              key={key}
              style={[styles.timeTab, timeView === key && styles.timeTabActive]}
              onPress={() => setTimeView(key)}
            >
              <Text
                style={[
                  styles.timeTabText,
                  timeView === key && styles.timeTabTextActive,
                ]}
              >
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={logs}
        keyExtractor={(item) => item.id || (item as any).localId}
        renderItem={({ item }) => (
          <LogCard log={item} onDelete={() => handleDelete(item.id)} />
        )}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No logs yet</Text>
            <Text style={styles.emptySubtext}>Tap + to add your first log</Text>
          </View>
        }
      />

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.generateBtn}
          onPress={() => navigation.navigate('Generate')}
        >
          <Text style={styles.generateBtnText}>Generate Summary</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => navigation.navigate('AddLog')}
        >
          <Text style={styles.addBtnText}>+</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  timeNav: {
    flexDirection: 'row',
    gap: 8,
  },
  timeTab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f5f5f5',
  },
  timeTabActive: {
    backgroundColor: '#111',
  },
  timeTabText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  timeTabTextActive: {
    color: '#fff',
  },
  logoutText: {
    color: '#999',
    fontSize: 13,
  },
  list: {
    padding: 16,
    paddingBottom: 100,
  },
  empty: {
    alignItems: 'center',
    marginTop: 80,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  actions: {
    position: 'absolute',
    bottom: 24,
    left: 16,
    right: 16,
    flexDirection: 'row',
    gap: 12,
  },
  generateBtn: {
    flex: 1,
    height: 52,
    backgroundColor: '#f5f5f5',
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
  },
  generateBtnText: {
    color: '#111',
    fontSize: 15,
    fontWeight: '600',
  },
  addBtn: {
    width: 52,
    height: 52,
    backgroundColor: '#111',
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addBtnText: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '400',
    marginTop: -2,
  },
});
