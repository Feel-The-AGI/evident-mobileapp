import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useLogsStore, useAuthStore } from '../store';
import { offlineStorage } from '../lib/offline';
import { api, ActivityType } from '../lib/api';

const ACTIVITY_TYPES: { value: ActivityType; label: string }[] = [
  { value: 'WORK', label: 'Work' },
  { value: 'MEETING', label: 'Meeting' },
  { value: 'FIELD', label: 'Field' },
  { value: 'TRAVEL', label: 'Travel' },
  { value: 'ADMIN', label: 'Admin' },
];

const MAX_DESCRIPTION_LENGTH = 120;

export default function AddLogScreen() {
  const navigation = useNavigation();
  const { token } = useAuthStore();
  const { addLog } = useLogsStore();
  
  const [time, setTime] = useState(new Date());
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [activity, setActivity] = useState<ActivityType>('WORK');
  const [description, setDescription] = useState('');
  const [reference, setReference] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!description.trim()) {
      Alert.alert('Error', 'Description is required');
      return;
    }

    const logData = {
      time: time.toISOString(),
      activityType: activity,
      description: description.trim(),
      reference: reference.trim() || undefined,
      source: 'MOBILE' as const,
    };

    setLoading(true);
    try {
      if (token) {
        api.setToken(token);
        const newLog = await api.createLog(logData);
        addLog(newLog);
      } else {
        const offlineLog = await offlineStorage.addLog(logData);
        addLog(offlineLog as any);
      }
      navigation.goBack();
    } catch (err) {
      const offlineLog = await offlineStorage.addLog(logData);
      addLog(offlineLog as any);
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <View style={styles.field}>
          <Text style={styles.label}>Time</Text>
          <TouchableOpacity
            style={styles.timeButton}
            onPress={() => setShowTimePicker(true)}
          >
            <Text style={styles.timeText}>
              {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </TouchableOpacity>
          {showTimePicker && (
            <DateTimePicker
              value={time}
              mode="time"
              display="spinner"
              onChange={(_, selectedTime) => {
                setShowTimePicker(false);
                if (selectedTime) setTime(selectedTime);
              }}
            />
          )}
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Activity Type</Text>
          <View style={styles.activityGrid}>
            {ACTIVITY_TYPES.map(({ value, label }) => (
              <TouchableOpacity
                key={value}
                style={[
                  styles.activityChip,
                  activity === value && styles.activityChipActive,
                ]}
                onPress={() => setActivity(value)}
              >
                <Text
                  style={[
                    styles.activityChipText,
                    activity === value && styles.activityChipTextActive,
                  ]}
                >
                  {label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.field}>
          <View style={styles.labelRow}>
            <Text style={styles.label}>Description</Text>
            <Text style={styles.counter}>
              {description.length}/{MAX_DESCRIPTION_LENGTH}
            </Text>
          </View>
          <TextInput
            style={styles.textArea}
            placeholder="What did you do?"
            placeholderTextColor="#999"
            value={description}
            onChangeText={(text) =>
              setDescription(text.slice(0, MAX_DESCRIPTION_LENGTH))
            }
            multiline
            maxLength={MAX_DESCRIPTION_LENGTH}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Reference (optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="Ticket #, project name, etc."
            placeholderTextColor="#999"
            value={reference}
            onChangeText={setReference}
          />
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitBtnText}>Add Log</Text>
          )}
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
  scroll: {
    flex: 1,
  },
  content: {
    padding: 20,
    gap: 24,
  },
  field: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111',
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  counter: {
    fontSize: 12,
    color: '#999',
  },
  timeButton: {
    height: 48,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    justifyContent: 'center',
    paddingHorizontal: 16,
    backgroundColor: '#fafafa',
  },
  timeText: {
    fontSize: 16,
    color: '#111',
  },
  activityGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  activityChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
  },
  activityChipActive: {
    backgroundColor: '#111',
  },
  activityChipText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  activityChipTextActive: {
    color: '#fff',
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#111',
    backgroundColor: '#fafafa',
  },
  textArea: {
    height: 100,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    color: '#111',
    backgroundColor: '#fafafa',
    textAlignVertical: 'top',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  submitBtn: {
    height: 52,
    backgroundColor: '#111',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
