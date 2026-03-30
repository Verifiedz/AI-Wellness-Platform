import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, Alert, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format, subDays } from 'date-fns';
import { useTheme } from '../context/ThemeContext';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Banner } from '../components/Banner';
import { ChipGroup } from '../components/ChipGroup';
import { exportApi } from '../services/exportApi';

const DATE_RANGE_OPTIONS = [
  { key: '30', label: 'Last 30 days' },
  { key: '90', label: 'Last 90 days' },
  { key: '180', label: 'Last 6 months' },
  { key: '365', label: 'Last year' },
];

/**
 * Export configuration screen.
 * Allows the user to select date range, sections, and format,
 * then generates a CSV file.
 */
export function ExportScreen({ navigation }) {
  const { colors, fonts } = useTheme();

  const [dateRange, setDateRange] = useState('90');
  const [includeAssessments, setIncludeAssessments] = useState(true);
  const [includeMoods, setIncludeMoods] = useState(true);
  const [includeJournals, setIncludeJournals] = useState(true);
  const [preview, setPreview] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const getDateRange = useCallback(() => {
    const endDate = format(new Date(), 'yyyy-MM-dd');
    const startDate = format(subDays(new Date(), parseInt(dateRange, 10)), 'yyyy-MM-dd');
    return { startDate, endDate };
  }, [dateRange]);

  const handlePreview = useCallback(async () => {
    setIsLoading(true);
    try {
      const { startDate, endDate } = getDateRange();
      const result = await exportApi.preview({
        startDate,
        endDate,
        format: 'csv',
        includeAssessments,
        includeMoods,
        includeJournalSummaries: includeJournals,
      });

      if (result.error) {
        Alert.alert('Error', result.error);
        return;
      }

      setPreview(result.data);
    } catch {
      Alert.alert('Error', 'Failed to load preview.');
    } finally {
      setIsLoading(false);
    }
  }, [getDateRange, includeAssessments, includeMoods, includeJournals]);

  const handleExport = useCallback(async () => {
    setIsExporting(true);
    try {
      const { startDate, endDate } = getDateRange();
      const result = await exportApi.generate({
        startDate,
        endDate,
        format: 'csv',
        includeAssessments,
        includeMoods,
        includeJournalSummaries: includeJournals,
      });

      if (result.error) {
        Alert.alert('Error', result.error);
        return;
      }

      Alert.alert(
        'Export Ready',
        "Your wellness report has been generated. In a future update, you'll be able to download and share the file directly.",
        [{ text: 'OK' }]
      );
    } catch {
      Alert.alert('Error', 'Failed to generate export.');
    } finally {
      setIsExporting(false);
    }
  }, [getDateRange, includeAssessments, includeMoods, includeJournals]);

  const toggleStyle = useCallback(
    (value, setter) => (
      <Switch
        value={value}
        onValueChange={setter}
        trackColor={{ false: colors.border, true: colors.primaryLight }}
        thumbColor={value ? colors.primary : '#f4f3f4'}
        ios_backgroundColor={colors.border}
      />
    ),
    [colors]
  );

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
    >
      <Banner
        type="info"
        message="Generate a report to share with your therapist or healthcare provider. No raw journal text is included — only summaries and scores."
        icon="shield-checkmark-outline"
      />

      {/* Date Range */}
      <Text style={[fonts.caption, styles.sectionLabel, { color: colors.textSecondary }]}>
        DATE RANGE
      </Text>
      <ChipGroup options={DATE_RANGE_OPTIONS} selected={dateRange} onSelect={setDateRange} />

      {/* Sections to include */}
      <Text style={[fonts.caption, styles.sectionLabel, { color: colors.textSecondary }]}>
        INCLUDE IN REPORT
      </Text>
      <Card style={{ padding: 0, overflow: 'hidden' }}>
        {[
          {
            label: 'Assessment Scores',
            sublabel: 'PHQ-9 and GAD-7 results',
            value: includeAssessments,
            setter: setIncludeAssessments,
            icon: 'clipboard-outline',
          },
          {
            label: 'Mood Summary',
            sublabel: 'Mood counts and energy averages',
            value: includeMoods,
            setter: setIncludeMoods,
            icon: 'heart-outline',
          },
          {
            label: 'Journal Summaries',
            sublabel: 'Date, mood, energy, word count',
            value: includeJournals,
            setter: setIncludeJournals,
            icon: 'journal-outline',
          },
        ].map((item, idx) => (
          <View
            key={item.label}
            style={[
              styles.toggleRow,
              { borderBottomColor: colors.border },
              idx === 2 && { borderBottomWidth: 0 },
            ]}
          >
            <View style={[styles.menuIcon, { backgroundColor: `${colors.primary}15` }]}>
              <Ionicons name={item.icon} size={18} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[fonts.body, { color: colors.text }]}>{item.label}</Text>
              <Text style={[fonts.caption, { color: colors.textSecondary }]}>{item.sublabel}</Text>
            </View>
            {toggleStyle(item.value, item.setter)}
          </View>
        ))}
      </Card>

      {/* Preview */}
      {preview && (
        <Card style={{ marginTop: 16 }}>
          <Text style={[fonts.heading3, { color: colors.text, marginBottom: 8 }]}>Preview</Text>
          <Text style={[fonts.bodySmall, { color: colors.textSecondary }]}>
            Period: {preview.startDate} to {preview.endDate}
          </Text>
          {preview.moodSummary && (
            <Text style={[fonts.bodySmall, { color: colors.textSecondary }]}>
              {preview.moodSummary.totalEntries} journal entries, most common mood:{' '}
              {preview.moodSummary.mostCommonMood}
            </Text>
          )}
          {preview.assessments?.length > 0 && (
            <Text style={[fonts.bodySmall, { color: colors.textSecondary }]}>
              {preview.assessments.length} assessment{preview.assessments.length !== 1 ? 's' : ''}{' '}
              recorded
            </Text>
          )}
        </Card>
      )}

      {/* Actions */}
      <View style={styles.actions}>
        <Button
          title={isLoading ? 'Loading...' : 'Preview Data'}
          variant="outline"
          onPress={handlePreview}
          disabled={isLoading}
          icon={<Ionicons name="eye-outline" size={16} color={colors.primary} />}
        />
        <Button
          title={isExporting ? 'Generating...' : 'Export CSV Report'}
          onPress={handleExport}
          disabled={isExporting}
          icon={<Ionicons name="download-outline" size={16} color="#FFFFFF" />}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },
  sectionLabel: {
    marginTop: 20,
    marginBottom: 8,
    marginLeft: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    gap: 12,
  },
  menuIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actions: { marginTop: 24, gap: 12 },
});
