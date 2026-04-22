import { apiClient } from './api';

const BASE_PATH = '/chat/chatService/api';

/**
 * Timeout (ms) for chat send requests. Longer than the default 15s
 * because the Llama 3.1 8B model on RunPod can take 10-30s to load
 * into VRAM on the very first request after a pod resume. Subsequent
 * requests usually return in under 5s once the model is warm.
 */
const CHAT_SEND_TIMEOUT_MS = 45_000;

function normalizeMessage(raw, fallbackRole = 'assistant') {
  if (!raw || typeof raw !== 'object') return null;

  const id = raw.chatReferenceId ?? raw.ChatReferenceId;
  const chatUserId = raw.chatUserId ?? raw.ChatUserId ?? '';
  const sessionId = raw.sessionId ?? raw.SessionId ?? '';
  const message = raw.message ?? raw.Message ?? '';
  const createdAt = raw.createdDate ?? raw.CreatedDate ?? null;

  if (!id || !message) return null;

  return {
    id: String(id),
    chatUserId: String(chatUserId),
    sessionId: String(sessionId),
    message: String(message),
    status: String(raw.status ?? raw.Status ?? ''),
    createdAt,
    role: fallbackRole,
  };
}

function normalizeMessageList(data) {
  if (!Array.isArray(data)) return [];

  const currentUserId = String(apiClient.userId || '').toLowerCase();
  return data
    .map((item, index) => {
      const rawUserId = String(item?.chatUserId ?? item?.ChatUserId ?? '').toLowerCase();
      let role = index % 2 === 0 ? 'user' : 'assistant';
      if (currentUserId && rawUserId && rawUserId !== currentUserId) {
        role = 'assistant';
      }

      return normalizeMessage(item, role);
    })
    .filter(Boolean);
}

function normalizeSession(raw) {
  if (!raw || typeof raw !== 'object') return null;

  const sessionId = raw.sessionID ?? raw.sessionId ?? raw.SessionID ?? raw.SessionId;
  const userId = raw.userId ?? raw.UserId ?? raw.externalUserId ?? raw.ExternalUserId;
  if (!sessionId) return null;

  return {
    sessionId: String(sessionId),
    userId: String(userId ?? ''),
    isBookmarked: Boolean(raw.isBookmarked ?? raw.IsBookmarked),
    createdDate: raw.createdDate ?? raw.CreatedDate ?? null,
    sessionName: raw.sessionName ?? raw.SessionName ?? null,
  };
}

export const chatApi = {
  getSessions() {
    return apiClient.get(`${BASE_PATH}/sessions`).then((result) => {
      if (result.error || !result.data) return result;
      const normalized = Array.isArray(result.data)
        ? result.data.map(normalizeSession).filter(Boolean)
        : [];
      return { ...result, data: normalized };
    });
  },

  getSessionMessages(sessionId) {
    return apiClient.get(`${BASE_PATH}/chat/${sessionId}`).then((result) => {
      if (result.error || !result.data) return result;
      return { ...result, data: normalizeMessageList(result.data) };
    });
  },

  sendMessage({ messageRequest, context = '', sessionId = null }) {
    const chatUserId = String(apiClient.userId || '');
    const body = {
      chatUserId,
      messageRequest,
      context,
      sessionId,
    };

    return apiClient.post(`${BASE_PATH}/chatRequest`, body, {
      timeoutMs: CHAT_SEND_TIMEOUT_MS,
    });
  },

  /**
   * Fire a tiny chat request to warm up the RunPod model into VRAM.
   *
   * Used at app boot so the user's first real send isn't the one that
   * pays the 10-30s cold-start cost. Callers should fire-and-forget:
   * errors are intentionally swallowed to avoid user-facing noise.
   */
  warmup() {
    const chatUserId = String(apiClient.userId || '');
    const body = {
      chatUserId,
      messageRequest: 'hi',
      context: '',
      sessionId: null,
    };

    return apiClient.post(`${BASE_PATH}/chatRequest`, body, {
      timeoutMs: CHAT_SEND_TIMEOUT_MS,
    });
  },
  setSessionBookmark(sessionId, isBookmarked) {
    return apiClient.patch(`${BASE_PATH}/sessions/${sessionId}/bookmark`, {
      isBookmarked,
    });
  },

  deleteSession(sessionId) {
    return apiClient.delete(`${BASE_PATH}/sessions/${sessionId}`);
  },
};
