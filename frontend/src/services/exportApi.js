import { apiClient } from './api';

const BASE_PATH = '/api/journal/export';

/**
 * Export REST API service.
 *
 * Endpoint contract:
 *   POST /api/journal/export/preview   -> 200 (JSON preview)
 *   POST /api/journal/export           -> 200 (file download)
 */
export const exportApi = {
  /**
   * Preview export data as JSON.
   * @param {{ startDate: string, endDate: string, format: string, includeAssessments?: boolean, includeMoods?: boolean, includeJournalSummaries?: boolean }} data
   */
  preview(data) {
    return apiClient.post(`${BASE_PATH}/preview`, data);
  },

  /**
   * Generate and download an export file.
   * Returns raw response for file download handling.
   * @param {{ startDate: string, endDate: string, format: string, includeAssessments?: boolean, includeMoods?: boolean, includeJournalSummaries?: boolean }} data
   */
  generate(data) {
    return apiClient.post(BASE_PATH, data);
  },
};
