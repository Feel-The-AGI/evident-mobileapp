import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';
import { useAuthStore } from '../store';
import { api } from '../lib/api';

type TimeRange = 'today' | 'this-week' | 'last-week';

const TIME_RANGES: { value: TimeRange; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: 'this-week', label: 'This Week' },
  { value: 'last-week', label: 'Last Week' },
];

export default function GenerateScreen() {
  const { token } = useAuthStore();
  const [timeRange, setTimeRange] = useState<TimeRange>('today');
  const [summary, setSummary] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    if (!token) {
      Alert.alert('Error', 'Please sign in to generate summaries');
      return;
    }

    setLoading(true);
    try {
      api.setToken(token);
      const result = await api.generateSummary(timeRange);
      setSummary(result.text);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to generate summary');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (summary) {
      await Clipboard.setStringAsync(summary);
      Alert.alert('Copied', 'Summary copied to clipboard');
    }
  };

  const handleShare = async () => {
    if (summary) {
      await Share.share({ message: summary });
    }
  };

  const handleExportPDF = async () => {
    if (!token) {
      Alert.alert('Error', 'Please sign in to export PDF');
      return;
    }

    setLoading(true);
    try {
      api.setToken(token);
      await api.exportPDF(timeRange);
      Alert.alert('Success', 'PDF export initiated. Check your email.');
    } catch (err: any) {
      if (err.message?.includes('export')) {
        Alert.alert('Upgrade Required', 'Subscribe to export more PDFs');
      } else {
        Alert.alert('Error', err.message || 'Failed to export PDF');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Time Range</Text>
          <View style={styles.rangeGrid}>
            {TIME_RANGES.map(({ value, label }) => (
              <TouchableOpacity
                key={value}
                style={[
                  styles.rangeChip,
                  timeRange === value && styles.rangeChipActive,
                ]}
                onPress={() => setTimeRange(value)}
              >
                <Text
                  style={[
                    styles.rangeChipText,
                    timeRange === value && styles.rangeChipTextActive,
                  ]}
                >
                  {label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <TouchableOpacity
          style={[styles.generateBtn, loading && styles.generateBtnDisabled]}
          onPress={handleGenerate}
          disabled={loading}
        >
          {loading && !summary ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.generateBtnText}>Generate Summary</Text>
          )}
        </TouchableOpacity>

        {summary && (
          <View style={styles.summarySection}>
            <Text style={styles.sectionTitle}>Summary</Text>
            <View style={styles.summaryBox}>
              <Text style={styles.summaryText}>{summary}</Text>
            </View>

            <View style={styles.actionRow}>
              <TouchableOpacity style={styles.actionBtn} onPress={handleCopy}>
                <Text style={styles.actionBtnText}>Copy Text</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionBtn} onPress={handleShare}>
                <Text style={styles.actionBtnText}>Share</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.pdfBtn, loading && styles.pdfBtnDisabled]}
              onPress={handleExportPDF}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#111" />
              ) : (
                <Text style={styles.pdfBtnText}>Export PDF</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
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
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111',
  },
  rangeGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  rangeChip: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
  },
  rangeChipActive: {
    backgroundColor: '#111',
  },
  rangeChipText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  rangeChipTextActive: {
    color: '#fff',
  },
  generateBtn: {
    height: 52,
    backgroundColor: '#111',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  generateBtnDisabled: {
    opacity: 0.6,
  },
  generateBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  summarySection: {
    gap: 16,
  },
  summaryBox: {
    backgroundColor: '#fafafa',
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 8,
    padding: 16,
  },
  summaryText: {
    fontSize: 14,
    color: '#111',
    lineHeight: 22,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  actionBtn: {
    flex: 1,
    height: 44,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionBtnText: {
    fontSize: 14,
    color: '#111',
    fontWeight: '500',
  },
  pdfBtn: {
    height: 52,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pdfBtnDisabled: {
    opacity: 0.6,
  },
  pdfBtnText: {
    color: '#111',
    fontSize: 16,
    fontWeight: '600',
  },
});
