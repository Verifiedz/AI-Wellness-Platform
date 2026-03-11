import { apiClient } from "./api";

const BASE_PATH = "/api/journal";

function normalizeEntry(raw) {
  if (!raw || typeof raw !== "object") return null;

  const id = raw.id ?? raw.Id;
  if (!id) return null;

  return {
    id: String(id),
    userId: String(raw.userId ?? raw.UserId ?? ""),
    mood: String(raw.mood ?? raw.Mood ?? ""),
    emotions: Array.isArray(raw.emotions ?? raw.Emotions)
      ? (raw.emotions ?? raw.Emotions)
      : [],
    energyLevel: Number(raw.energyLevel ?? raw.EnergyLevel ?? 5),
    content: String(raw.content ?? raw.Content ?? ""),
    entryDate: String(raw.entryDate ?? raw.EntryDate ?? ""),
    createdAt: raw.createdAt ?? raw.CreatedAt ?? null,
    updatedAt: raw.updatedAt ?? raw.UpdatedAt ?? null,
  };
}

function normalizeEntryList(data) {
  if (!Array.isArray(data)) return [];
  return data.map(normalizeEntry).filter(Boolean);
}

/**
 * Journal REST API service.
 *
 * Endpoint contract (all routed through YARP gateway):
 *   POST   /api/journal/entries              → 201
 *   GET    /api/journal/entries              → 200
 *   GET    /api/journal/entries/:id          → 200 | 404
 *   GET    /api/journal/entries/date/:date   → 200 | 404
 *   PUT    /api/journal/entries/:id          → 200 | 404
 *   DELETE /api/journal/entries/:id          → 204 | 404
 *   GET    /api/journal/summary              → 200
 *   GET    /api/journal/prompt               → 200 | 404
 */
export const journalApi = {
  /**
   * Create a new journal entry.
   * @param {{ mood: string, emotions: string[], energyLevel: number, content: string, entryDate: string }} entry
   */
  createEntry(entry) {
    return apiClient.post(`${BASE_PATH}/entries`, entry).then((result) => {
      if (result.error || !result.data) return result;
      return { ...result, data: normalizeEntry(result.data) };
    });
  },

  /**
   * Get journal entries for the current user.
   * @param {{ startDate?: string, endDate?: string, limit?: number, offset?: number }} params
   */
  getEntries(params = {}) {
    const query = new URLSearchParams();
    if (params.startDate) query.set("startDate", params.startDate);
    if (params.endDate) query.set("endDate", params.endDate);
    if (params.limit) query.set("limit", String(params.limit));
    if (params.offset) query.set("offset", String(params.offset));

    const qs = query.toString();
    const path = qs ? `${BASE_PATH}/entries?${qs}` : `${BASE_PATH}/entries`;

    return apiClient.get(path).then((result) => {
      if (result.error || !result.data) return result;
      return { ...result, data: normalizeEntryList(result.data) };
    });
  },

  /**
   * Get a single journal entry by ID.
   * @param {string} id
   */
  getEntryById(id) {
    return apiClient.get(`${BASE_PATH}/entries/${id}`).then((result) => {
      if (result.error || !result.data) return result;
      return { ...result, data: normalizeEntry(result.data) };
    });
  },

  /**
   * Get journal entry for a specific date.
   * @param {string} date - yyyy-MM-dd
   */
  getEntryByDate(date) {
    return apiClient
      .get(`${BASE_PATH}/entries/date/${date}`)
      .then((result) => {
        if (result.error || !result.data) return result;
        return { ...result, data: normalizeEntry(result.data) };
      });
  },

  /**
   * Update an existing journal entry.
   * @param {string} id
   * @param {{ mood: string, emotions: string[], energyLevel: number, content: string }} entry
   */
  updateEntry(id, entry) {
    return apiClient
      .put(`${BASE_PATH}/entries/${id}`, entry)
      .then((result) => {
        if (result.error || !result.data) return result;
        return { ...result, data: normalizeEntry(result.data) };
      });
  },

  /**
   * Delete a journal entry.
   * @param {string} id
   */
  deleteEntry(id) {
    return apiClient.delete(`${BASE_PATH}/entries/${id}`);
  },

  /**
   * Get mood summary statistics.
   * @param {{ startDate?: string, endDate?: string }} params
   */
  getMoodSummary(params = {}) {
    const query = new URLSearchParams();
    if (params.startDate) query.set("startDate", params.startDate);
    if (params.endDate) query.set("endDate", params.endDate);

    const qs = query.toString();
    const path = qs ? `${BASE_PATH}/summary?${qs}` : `${BASE_PATH}/summary`;

    return apiClient.get(path);
  },

  /**
   * Get a random journal prompt.
   * @param {string} [category]
   */
  getRandomPrompt(category) {
    const path = category
      ? `${BASE_PATH}/prompt?category=${encodeURIComponent(category)}`
      : `${BASE_PATH}/prompt`;

    return apiClient.get(path);
  },
};
