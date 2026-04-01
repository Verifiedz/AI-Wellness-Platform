import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { format } from 'date-fns';
import { useTheme } from '../context/ThemeContext';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Banner } from '../components/Banner';
import { AnimatedCard } from '../components/AnimatedCard';
import { ChipGroup } from '../components/ChipGroup';
import { EmptyState } from '../components/EmptyState';
import { ASSESSMENTS, getSeverityBand, CLINICAL_DISCLAIMER } from '../constants/assessments';
import { assessmentApi } from '../services/assessmentApi';

/**
 * Timeline view of past assessments with before/after comparison.
 *
 * Route params:
 *   - assessmentType: "PHQ9" | "GAD7" (default: "PHQ9")
 */
const PAGE_LIMIT = 50;

export function AssessmentHistoryScreen({ navigation, route }) {
  const initialType = route.params?.assessmentType || 'PHQ9';
  const { colors, fonts } = useTheme();

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
        if (firstError) {
          setError(firstError);
        } else {
          setError(null);
        }

        if (!historyResult.error) {
          const items = historyResult.data || [];
          setHistory(items);
          setOffset(items.length);
          setHasMore(items.length === PAGE_LIMIT);
        }
        if (!compResult.error) setComparison(compResult.data || null);
      } catch (err) {
        const isNetwork =
          err instanceof TypeError || (err.message && err.message.toLowerCase().includes('network'));
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
      const result = await assessmentApi.getHistory({ type: activeType, limit: PAGE_LIMIT, offset });
      if (!result.error) {
        const items = result.data || [];
        setHistory((prev) => [...prev, ...items]);
        setOffset((prev) => prev + items.length);
        setHasMore(items.length === PAGE_LIMIT);
      }
    } catch {
      // silently ignore load-more errors; user can refresh to retry
    } finally {
      setIsLoadingMore(false);
    }
  }, [activeType, hasMore, isLoading, isLoadingMore, isRefreshing, offset]);

  useFocusEffect(
    useCallback(() => {
      loadData(false);
    }, [loadData])
  );

  const typeChips = [
    { key: 'PHQ9', label: 'Depression (PHQ-9)' },
    { key: 'GAD7', label: 'Anxiety (GAD-7)' },
  ];

  const trendIcon =
    comparison?.trendDirection === 'improving'
      ? 'trending-down-outline'
      : comparison?.trendDirection === 'worsening'
        ? 'trending-up-outline'
        : 'remove-outline';

  const trendColor =
    comparison?.trendDirection === 'improving'
      ? colors.success
      : comparison?.trendDirection === 'worsening'
        ? colors.error
        : colors.textSecondary;

  const renderHistoryItem = useCallback(
    ({ item, index }) => {
      const band = getSeverityBand(assessment, item.totalScore);
      return (
        <AnimatedCard key={item.id} index={index + 1}>
          <Card style={styles.historyItem}>
            <View style={styles.historyRow}>
              <View style={[styles.severityDot, { backgroundColor: band.color }]} />
              <View style={{ flex: 1 }}>
                <Text style={[fonts.body, { color: colors.text, fontWeight: '600' }]}>
                  Score: {item.totalScore}/{assessment.maxScore}
                </Text>
                <Text style={[fonts.bodySmall, { color: band.color }]}>
                  {item.severityLabel}
                </Text>
              </View>
              <Text style={[fonts.caption, { color: colors.textLight }]}>
                {format(new Date(item.completedAt), 'MMM d, yyyy')}
              </Text>
            </View>
          </Card>
        </AnimatedCard>
      );
    },
    [assessment, colors, fonts]
  );

  const listHeader = (
    <View>
      <ChipGroup items={typeChips} selected={activeType} onSelect={setActiveType} />

      {error && (
        <Banner
          variant="error"
          message={error}
          action="Retry"
          onAction={() => loadData(true)}
          onDismiss={() => setError(null)}
        />
      )}

      {/* Comparison card */}
      {comparison?.first && comparison?.latest && comparison.first.id !== comparison.latest.id && (
        <AnimatedCard index={0}>
          <Card style={styles.comparisonCard}>
            <Text style={[fonts.heading3, { color: colors.text, marginBottom: 12 }]}>
              Your Progress
            </Text>
            <View style={styles.comparisonRow}>
              <View style={styles.comparisonItem}>
                <Text style={[fonts.caption, { color: colors.textSecondary }]}>First</Text>
                <Text style={[fonts.heading2, { color: colors.text }]}>
                  {comparison.first.totalScore}
                </Text>
                <Text style={[fonts.caption, { color: colors.textLight }]}>
                  {comparison.first.severityLabel}
                </Text>
              </View>
              <Ionicons name={trendIcon} size={28} color={trendColor} />
              <View style={styles.comparisonItem}>
                <Text style={[fonts.caption, { color: colors.textSecondary }]}>Latest</Text>
                <Text style={[fonts.heading2, { color: colors.text }]}>
                  {comparison.latest.totalScore}
                </Text>
                <Text style={[fonts.caption, { color: colors.textLight }]}>
                  {comparison.latest.severityLabel}
                </Text>
              </View>
            </View>
            <Text
              style={[fonts.bodySmall, { color: trendColor, textAlign: 'center', marginTop: 8 }]}
            >
              {comparison.scoreChange > 0 ? '+' : ''}
              {comparison.scoreChange} points ({comparison.trendDirection})
            </Text>
          </Card>
        </AnimatedCard>
      )}
    </View>
  );

  const listFooter = (
    <View>
      {isLoadingMore && (
        <ActivityIndicator
          size="small"
          color={colors.primary}
          style={styles.loadingMoreIndicator}
        />
      )}
      <Banner type="info" message={CLINICAL_DISCLAIMER} icon="medical-outline" />
      <Button
        title={`Take ${assessment.name} Assessment`}
        onPress={() => navigation.navigate('Assessment', { assessmentType: activeType })}
        icon={<Ionicons name="clipboard-outline" size={16} color="#FFFFFF" />}
        style={{ marginTop: 16 }}
      />
    </View>
  );

  return (
    <FlatList
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      data={history}
      keyExtractor={(item) => String(item.id)}
      renderItem={renderHistoryItem}
      ListHeaderComponent={listHeader}
      ListFooterComponent={listFooter}
      ListEmptyComponent={
        !isLoading ? (
          <EmptyState
            icon="clipboard-outline"
            title={`No ${assessment.name} assessments yet`}
            description="Take your first assessment to start tracking your wellbeing over time."
          />
        ) : null
      }
      onEndReached={loadMore}
      onEndReachedThreshold={0.3}
      refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={() => loadData(true)} />}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },
  comparisonCard: { marginVertical: 12 },
  comparisonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  comparisonItem: { alignItems: 'center', gap: 2 },
  historyItem: { marginBottom: 8 },
  historyRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  severityDot: { width: 12, height: 12, borderRadius: 6 },
  loadingMoreIndicator: { paddingVertical: 16 },
});
