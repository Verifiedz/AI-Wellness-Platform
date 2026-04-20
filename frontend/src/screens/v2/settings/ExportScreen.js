/**
 * ExportScreen v2 — date-range chips + section toggles + preview + export CSV.
 *
 * Behavior preserved: exportApi.preview / exportApi.generate contracts, date
 * range subDays calculation, useToast on success.
 */

import React, { useCallback, useState } from 'react';
import { View } from 'react-native';
import { format, subDays } from 'date-fns';
import {
  ShieldCheck,
  Eye,
  Download,
  ClipboardText,
  Heart,
  Notebook,
} from 'phosphor-react-native';
import { useToast } from '../../../context/ToastContext';
import { exportApi } from '../../../services/exportApi';
import { useV2Theme } from '../../../theme/v2';
import {
  Button,
  Card,
  Chip,
  ErrorState,
  ScreenHeader,
  ScreenScaffold,
  Surface,
  Text,
} from '../../../ui/v2';
import { SettingsRow, SettingsSection, SettingsSwitch } from './SettingsRow';

const DATE_RANGE_OPTIONS = [
  { key: '30', label: 'Last 30 days' },
  { key: '90', label: 'Last 90 days' },
  { key: '180', label: 'Last 6 months' },
  { key: '365', label: 'Last year' },
];

export function ExportScreen({ navigation }) {
  const v2 = useV2Theme();
  const { showToast } = useToast();
  const [dateRange, setDateRange] = useState('90');
  const [includeAssessments, setIncludeAssessments] = useState(true);
  const [includeMoods, setIncludeMoods] = useState(true);
  const [includeJournals, setIncludeJournals] = useState(true);
  const [preview, setPreview] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [previewError, setPreviewError] = useState(null);
  const [exportError, setExportError] = useState(null);

  const getDateRange = useCallback(() => {
    const endDate = format(new Date(), 'yyyy-MM-dd');
    const startDate = format(subDays(new Date(), parseInt(dateRange, 10)), 'yyyy-MM-dd');
    return { startDate, endDate };
  }, [dateRange]);

  const handlePreview = useCallback(async () => {
    setIsLoading(true);
    setPreviewError(null);
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
        setPreviewError(result.error || 'Failed to load preview.');
        return;
      }
      setPreview(result.data);
    } catch {
      setPreviewError('Failed to load preview.');
    } finally {
      setIsLoading(false);
    }
  }, [getDateRange, includeAssessments, includeMoods, includeJournals]);

  const handleExport = useCallback(async () => {
    setIsExporting(true);
    setExportError(null);
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
        setExportError(result.error || 'Failed to generate export.');
        return;
      }
      showToast({
        message:
          'Your wellness report has been generated. In a future update, you\u2019ll be able to download and share the file directly.',
        variant: 'success',
        duration: 5000,
      });
    } catch {
      setExportError('Failed to generate export.');
    } finally {
      setIsExporting(false);
    }
  }, [getDateRange, includeAssessments, includeMoods, includeJournals, showToast]);

  return (
    <ScreenScaffold ambient ambientIntensity="subtle" paddingBottom="tabBar">
      <ScreenHeader title="Export for therapist" onBack={() => navigation.goBack()} />

      <Surface
        elevation="raised"
        padding={3}
        style={{
          marginTop: v2.spacing[2],
          marginBottom: v2.spacing[3],
          flexDirection: 'row',
          alignItems: 'flex-start',
          gap: v2.spacing[2],
        }}
      >
        <ShieldCheck size={20} color={v2.palette.success} weight="duotone" />
        <Text variant="body-sm" color="secondary" style={{ flex: 1 }}>
          Generate a report to share with your therapist or healthcare provider. No raw journal text
          is included — only summaries and scores.
        </Text>
      </Surface>

      <Text variant="label" color="secondary" style={{ marginBottom: v2.spacing[2] }}>
        DATE RANGE
      </Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: v2.spacing[2], marginBottom: v2.spacing[4] }}>
        {DATE_RANGE_OPTIONS.map((opt) => (
          <Chip
            key={opt.key}
            selected={dateRange === opt.key}
            onPress={() => setDateRange(opt.key)}
            accessibilityLabel={opt.label}
          >
            {opt.label}
          </Chip>
        ))}
      </View>

      <SettingsSection title="INCLUDE IN REPORT">
        <SettingsRow
          leadingIcon={ClipboardText}
          title="Assessment scores"
          sublabel="PHQ-9 and GAD-7 results"
          right={
            <SettingsSwitch
              value={includeAssessments}
              onChange={setIncludeAssessments}
              accessibilityLabel="Assessment scores"
            />
          }
        />
        <SettingsRow
          leadingIcon={Heart}
          title="Mood summary"
          sublabel="Mood counts and energy averages"
          right={
            <SettingsSwitch
              value={includeMoods}
              onChange={setIncludeMoods}
              accessibilityLabel="Mood summary"
            />
          }
        />
        <SettingsRow
          leadingIcon={Notebook}
          title="Journal summaries"
          sublabel="Date, mood, energy, word count"
          right={
            <SettingsSwitch
              value={includeJournals}
              onChange={setIncludeJournals}
              accessibilityLabel="Journal summaries"
            />
          }
        />
      </SettingsSection>

      {preview ? (
        <Card padding={4} style={{ marginBottom: v2.spacing[3] }}>
          <Text variant="h3">Preview</Text>
          <Text variant="body-sm" color="secondary" style={{ marginTop: v2.spacing[1] }}>
            Period: {preview.startDate} to {preview.endDate}
          </Text>
          {preview.moodSummary ? (
            <Text variant="body-sm" color="secondary" style={{ marginTop: v2.spacing[1] }}>
              {preview.moodSummary.totalEntries} journal entries · most common mood:{' '}
              {preview.moodSummary.mostCommonMood}
            </Text>
          ) : null}
          {preview.assessments?.length > 0 ? (
            <Text variant="body-sm" color="secondary" style={{ marginTop: v2.spacing[1] }}>
              {preview.assessments.length} assessment{preview.assessments.length !== 1 ? 's' : ''}{' '}
              recorded
            </Text>
          ) : null}
        </Card>
      ) : null}

      {previewError ? (
        <View style={{ marginBottom: v2.spacing[3] }}>
          <ErrorState body={previewError} onRetry={handlePreview} actionLabel="Retry preview" />
        </View>
      ) : null}

      {exportError ? (
        <View style={{ marginBottom: v2.spacing[3] }}>
          <ErrorState body={exportError} onRetry={handleExport} actionLabel="Retry export" />
        </View>
      ) : null}

      <View style={{ gap: v2.spacing[2], marginTop: v2.spacing[2] }}>
        <Button
          variant="secondary"
          size="lg"
          fullWidth
          loading={isLoading}
          leadingIcon={Eye}
          onPress={handlePreview}
        >
          Preview data
        </Button>
        <Button
          variant="primary"
          size="lg"
          fullWidth
          loading={isExporting}
          leadingIcon={Download}
          onPress={handleExport}
          haptic="firm"
        >
          Export CSV report
        </Button>
      </View>
    </ScreenScaffold>
  );
}

export default ExportScreen;
