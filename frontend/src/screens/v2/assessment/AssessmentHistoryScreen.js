/**
 * AssessmentHistoryScreen v2 — paginated FlashList of past assessments
 * with comparison header.
 *
 * Behavior preserved:
 *   - assessmentApi.getHistory + assessmentApi.getComparison
 *   - PAGE_LIMIT = 50, infinite scroll via onEndReached, hasMore flag
 *   - Type chips switch between PHQ9 / GAD7
 *   - useFocusEffect refresh-on-return
 *   - "Take {name} Assessment" → navigation.navigate('Assessment', { assessmentType })
 *
 * Visual rewrite:
 *   - FlashList replaces FlatList (audit-flagged perf improvement)
 *   - Severity colors from v2 palette tokens
 *   - Trend icon via Phosphor (TrendDown / TrendUp / Minus)
 */

import React, { useCallback, useState } from 'react';
import { View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useFocusEffect } from '@react-navigation/native';
import { format } from 'date-fns';
import { TrendDown, TrendUp, Minus, ClipboardText, Info } from 'phosphor-react-native';
import {
  ASSESSMENTS,
  getSeverityBand,
  CLINICAL_DISCLAIMER,
} from '../../../constants/assessments';
import { assessmentApi } from '../../../services/assessmentApi';
import { useV2Theme } from '../../../theme/v2';
import {
  Button,
  Card,
  Chip,
  EmptyState,
  ErrorState,
  LoadingState,
  ScreenScaffold,
  ScreenHeader,
  Surface,
  Text,
  Blob,
} from '../../../ui/v2';
import { severityColor } from './severity';

const PAGE_LIMIT = 50;

export function AssessmentHistoryScreen({ navigation, route }) {
  const v2 = useV2Theme();
  const initialType = route?.params?.assessmentType || 'PHQ9';
  const [activeType, setActiveType] = useState(initialType);
  const [history, setHistory] = useState([]);
  const [comparison, setComparison] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState(null);

  const assessment = ASSESSMENTS[activeType];

  const loadData = useCallback(
    async (soft = false) => {
      if (soft) setIsRefreshing(true);
      else setIsLoading(true);

      try {
        const [historyResult, compResult] = await Promise.all([
          assessmentApi.getHistory({ type: activeType, limit: PAGE_LIMIT, offset: 0 }),
          assessmentApi.getComparison(activeType),
        ]);

        const firstError = historyResult.error || compResult.error;
        setError(firstError || null);

        if (!historyResult.error) {
          const items = historyResult.data || [];
          setHistory(items);
          setOffset(items.length);
          setHasMore(items.length === PAGE_LIMIT);
        }
        if (!compResult.error) setComparison(compResult.data || null);
      } catch (err) {
        const isNetwork =
          err instanceof TypeError ||
          (err.message && err.message.toLowerCase().includes('network'));
        setError(isNetwork ? 'No internet connection' : 'Failed to load assessment history');
      } finally {
        if (soft) setIsRefreshing(false);
        else setIsLoading(false);
      }
    },
    [activeType]
  );

  const loadMore = useCallback(async () => {
    if (isLoadingMore || isLoading || isRefreshing || !hasMore) return;
    setIsLoadingMore(true);
    try {
      const result = await assessmentApi.getHistory({
        type: activeType,
        limit: PAGE_LIMIT,
        offset,
      });
      if (!result.error) {
        const items = result.data || [];
        setHistory((prev) => [...prev, ...items]);
        setOffset((prev) => prev + items.length);
        setHasMore(items.length === PAGE_LIMIT);
      }
    } catch {
      // silently ignore — user can refresh.
    } finally {
      setIsLoadingMore(false);
    }
  }, [activeType, hasMore, isLoading, isLoadingMore, isRefreshing, offset]);

  useFocusEffect(
    useCallback(() => {
      loadData(false);
    }, [loadData])
  );

  const trendDirection = comparison?.trendDirection;
  const TrendIcon = trendDirection === 'improving'
    ? TrendDown
    : trendDirection === 'worsening'
    ? TrendUp
    : Minus;
  const trendColor =
    trendDirection === 'improving'
      ? v2.palette.success
      : trendDirection === 'worsening'
      ? v2.palette.error
      : v2.palette.text.tertiary;

  const renderHeader = () => (
    <View>
      <View
        style={{
          flexDirection: 'row',
          gap: v2.spacing[2],
          marginTop: v2.spacing[2],
        }}
      >
        <Chip selected={activeType === 'PHQ9'} onPress={() => setActiveType('PHQ9')}>
          Depression (PHQ-9)
        </Chip>
        <Chip selected={activeType === 'GAD7'} onPress={() => setActiveType('GAD7')}>
          Anxiety (GAD-7)
        </Chip>
      </View>

      {comparison?.first &&
      comparison?.latest &&
      comparison.first.id !== comparison.latest.id ? (
        <Card padding={4} style={{ marginTop: v2.spacing[4] }}>
          <Text variant="h3">Your progress</Text>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-around',
              marginTop: v2.spacing[3],
            }}
          >
            <View style={{ alignItems: 'center' }}>
              <Text variant="caption" color="tertiary">
                First
              </Text>
              <Text variant="display-lg" style={{ marginTop: 2 }}>
                {comparison.first.totalScore}
              </Text>
              <Text variant="caption" color="tertiary">
                {comparison.first.severityLabel}
              </Text>
            </View>
            <TrendIcon size={28} color={trendColor} weight="duotone" />
            <View style={{ alignItems: 'center' }}>
              <Text variant="caption" color="tertiary">
                Latest
              </Text>
              <Text variant="display-lg" style={{ marginTop: 2 }}>
                {comparison.latest.totalScore}
              </Text>
              <Text variant="caption" color="tertiary">
                {comparison.latest.severityLabel}
              </Text>
            </View>
          </View>
          <Text
            variant="body-sm"
            align="center"
            style={{ color: trendColor, marginTop: v2.spacing[2] }}
          >
            {comparison.scoreChange > 0 ? '+' : ''}
            {comparison.scoreChange} points · {trendDirection}
          </Text>
        </Card>
      ) : null}

      {error ? (
        <View style={{ marginTop: v2.spacing[4] }}>
          <ErrorState body={error} onRetry={() => loadData(true)} />
        </View>
      ) : null}
    </View>
  );

  const renderItem = useCallback(
    ({ item }) => {
      const band = getSeverityBand(assessment, item.totalScore);
      const dotColor = severityColor(v2.palette, item.severity || band?.severity);
      return (
        <Card padding={4} style={{ marginBottom: v2.spacing[2] }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: v2.spacing[3] }}>
            <View
              style={{
                width: 14,
                height: 14,
                borderRadius: 7,
                backgroundColor: dotColor,
              }}
            />
            <View style={{ flex: 1 }}>
              <Text variant="body" style={{ fontFamily: 'DMSans_600SemiBold' }}>
                Score: {item.totalScore} / {assessment.maxScore}
              </Text>
              <Text variant="body-sm" style={{ color: dotColor, marginTop: 2 }}>
                {item.severityLabel}
              </Text>
            </View>
            <Text variant="caption" color="tertiary">
              {format(new Date(item.completedAt), 'MMM d, yyyy')}
            </Text>
          </View>
        </Card>
      );
    },
    [assessment, v2.palette]
  );

  const renderFooter = () => (
    <View style={{ marginTop: v2.spacing[4] }}>
      {isLoadingMore ? (
        <View style={{ alignItems: 'center', paddingVertical: v2.spacing[4] }}>
          <Blob size={20} />
        </View>
      ) : null}
      <Surface
        elevation="raised"
        padding={3}
        style={{
          flexDirection: 'row',
          gap: v2.spacing[2],
          alignItems: 'flex-start',
          marginTop: v2.spacing[2],
        }}
      >
        <Info size={18} color={v2.palette.text.tertiary} weight="duotone" />
        <Text variant="body-sm" color="tertiary" style={{ flex: 1 }}>
          {CLINICAL_DISCLAIMER}
        </Text>
      </Surface>
      <View style={{ marginTop: v2.spacing[3] }}>
        <Button
          variant="primary"
          size="lg"
          fullWidth
          leadingIcon={ClipboardText}
          onPress={() => navigation.navigate('Assessment', { assessmentType: activeType })}
        >
          Take {assessment.name} assessment
        </Button>
      </View>
    </View>
  );

  return (
    <ScreenScaffold
      ambient
      ambientIntensity="subtle"
      paddingHorizontal={4}
      paddingBottom="tabBar"
      scrollable={false}
    >
      <ScreenHeader title="Assessments" onBack={() => navigation.goBack()} />
      {isLoading ? (
        <LoadingState caption="Loading your history" />
      ) : (
        <FlashList
          data={history}
          keyExtractor={(it) => String(it.id)}
          renderItem={renderItem}
          ListHeaderComponent={renderHeader}
          ListFooterComponent={renderFooter}
          ListEmptyComponent={
            !isLoading ? (
              <EmptyState
                title={`No ${assessment.name} assessments yet`}
                body="Take your first assessment to start tracking your wellbeing over time."
                action={{
                  label: `Take ${assessment.name}`,
                  onPress: () => navigation.navigate('Assessment', { assessmentType: activeType }),
                }}
              />
            ) : null
          }
          onEndReached={loadMore}
          onEndReachedThreshold={0.3}
          onRefresh={() => loadData(true)}
          refreshing={isRefreshing}
          contentContainerStyle={{ paddingTop: v2.spacing[2], paddingBottom: v2.spacing[10] }}
        />
      )}
    </ScreenScaffold>
  );
}

export default AssessmentHistoryScreen;
