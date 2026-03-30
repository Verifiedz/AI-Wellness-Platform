import { apiClient } from './api';

const BASE_PATH = '/api/journal/assessments';

/**
 * Assessment REST API service.
 *
 * Endpoint contract (routed through YARP gateway):
 *   POST   /api/journal/assessments              -> 201
 *   GET    /api/journal/assessments               -> 200
 *   GET    /api/journal/assessments/latest?type=   -> 200 | 404
 *   GET    /api/journal/assessments/comparison?type= -> 200
 */
export const assessmentApi = {
  /**
   * Submit a completed assessment.
   * @param {{ assessmentType: string, responses: Array<{questionIndex: number, score: number}> }} data
   */
  submit(data) {
    return apiClient.post(BASE_PATH, data);
  },

  /**
   * Get assessment history.
   * @param {{ type?: string, limit?: number, offset?: number }} params
   */
  getHistory(params = {}) {
    const query = new URLSearchParams();
    if (params.type) query.set('type', params.type);
    if (params.limit) query.set('limit', String(params.limit));
    if (params.offset) query.set('offset', String(params.offset));

    const qs = query.toString();
    const path = qs ? `${BASE_PATH}?${qs}` : BASE_PATH;
    return apiClient.get(path);
  },

  /**
   * Get the most recent assessment of a given type.
   * @param {string} type - "PHQ9" or "GAD7"
   */
  getLatest(type = 'PHQ9') {
    return apiClient.get(`${BASE_PATH}/latest?type=${type}`);
  },

  /**
   * Get first vs. latest comparison for a given type.
   * @param {string} type - "PHQ9" or "GAD7"
   */
  getComparison(type = 'PHQ9') {
    return apiClient.get(`${BASE_PATH}/comparison?type=${type}`);
  },
};
