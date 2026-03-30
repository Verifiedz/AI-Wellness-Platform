import { apiClient } from './api';

const BASE_PATH = '/api/journal';

function normalizeInsight(raw) {
  if (!raw || typeof raw !== 'object') return null;
  return {
    insightType: String(raw.insightType ?? raw.InsightType ?? ''),
    title: String(raw.title ?? raw.Title ?? ''),
    description: String(raw.description ?? raw.Description ?? ''),
    confidence: Number(raw.confidence ?? raw.Confidence ?? 0),
    dataPoints: Number(raw.dataPoints ?? raw.DataPoints ?? 0),
  };
}

function normalizeInsightsResponse(raw) {
  if (!raw || typeof raw !== 'object') return null;
  return {
    insights: Array.isArray(raw.insights ?? raw.Insights)
      ? (raw.insights ?? raw.Insights).map(normalizeInsight).filter(Boolean)
      : [],
    totalEntriesAnalyzed: Number(raw.totalEntriesAnalyzed ?? raw.TotalEntriesAnalyzed ?? 0),
    startDate: String(raw.startDate ?? raw.StartDate ?? ''),
    endDate: String(raw.endDate ?? raw.EndDate ?? ''),
  };
}

/**
 * Pattern insights API service.
 *
 * Endpoint:
 *   GET /api/journal/insights?days=30 → 200
 */
export const insightApi = {
  /**
   * Get pattern insights for the current user.
   * @param {number} [days=30] - Number of days to analyze (7-90)
   */
  getInsights(days = 30) {
    return apiClient.get(`${BASE_PATH}/insights?days=${days}`).then((result) => {
      if (result.error || !result.data) return result;
      return { ...result, data: normalizeInsightsResponse(result.data) };
    });
  },
};
