import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Log } from '../lib/api';

interface LogCardProps {
  log: Log;
  onDelete?: () => void;
}

const ACTIVITY_LABELS: Record<string, string> = {
  WORK: 'Work',
  MEETING: 'Meeting',
  FIELD: 'Field',
  TRAVEL: 'Travel',
  ADMIN: 'Admin',
};

export default function LogCard({ log, onDelete }: LogCardProps) {
  const time = new Date(log.time).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  const isSynced = !('localId' in log) || (log as any).synced;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.left}>
          <Text style={styles.time}>{time}</Text>
          <View style={styles.activityBadge}>
            <Text style={styles.activityText}>
              {ACTIVITY_LABELS[log.activityType] || log.activityType}
            </Text>
          </View>
          {!isSynced && (
            <View style={styles.pendingBadge}>
              <Text style={styles.pendingText}>Pending</Text>
            </View>
          )}
        </View>
        {onDelete && (
          <TouchableOpacity onPress={onDelete} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Text style={styles.deleteBtn}>×</Text>
          </TouchableOpacity>
        )}
      </View>
      <Text style={styles.description}>{log.description}</Text>
      {log.reference && <Text style={styles.reference}>{log.reference}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fafafa',
    borderRadius: 8,
    padding: 14,
    marginBottom: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  time: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
  },
  activityBadge: {
    backgroundColor: '#eee',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  activityText: {
    fontSize: 11,
    color: '#666',
    fontWeight: '500',
  },
  pendingBadge: {
    backgroundColor: '#fff3cd',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  pendingText: {
    fontSize: 10,
    color: '#856404',
    fontWeight: '500',
  },
  deleteBtn: {
    fontSize: 22,
    color: '#ccc',
    fontWeight: '300',
  },
  description: {
    fontSize: 15,
    color: '#111',
    lineHeight: 21,
  },
  reference: {
    fontSize: 12,
    color: '#999',
    marginTop: 6,
  },
});
