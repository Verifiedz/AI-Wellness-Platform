import { apiClient } from "./api";

const BASE_PATH = "/chat/chatService/api";

function normalizeMessage(raw, fallbackRole = "assistant") {
  if (!raw || typeof raw !== "object") return null;

  const id = raw.chatReferenceId ?? raw.ChatReferenceId;
  const chatUserId = raw.chatUserId ?? raw.ChatUserId ?? "";
  const sessionId = raw.sessionId ?? raw.SessionId ?? "";
  const message = raw.message ?? raw.Message ?? "";
  const createdAt = raw.createdDate ?? raw.CreatedDate ?? null;

  if (!id || !message) return null;

  return {
    id: String(id),
    chatUserId: String(chatUserId),
    sessionId: String(sessionId),
    message: String(message),
    status: String(raw.status ?? raw.Status ?? ""),
    createdAt,
    role: fallbackRole,
  };
}

function normalizeMessageList(data) {
  if (!Array.isArray(data)) return [];

  const currentUserId = String(apiClient.userId || "").toLowerCase();
  return data
    .map((item, index) => {
      const rawUserId = String(item?.chatUserId ?? item?.ChatUserId ?? "").toLowerCase();
      let role = index % 2 === 0 ? "user" : "assistant";
      if (currentUserId && rawUserId && rawUserId !== currentUserId) {
        role = "assistant";
      }

      return normalizeMessage(item, role);
    })
    .filter(Boolean);
}

function normalizeSession(raw) {
  if (!raw || typeof raw !== "object") return null;

  const sessionId = raw.sessionID ?? raw.sessionId ?? raw.SessionID ?? raw.SessionId;
  const userId = raw.userId ?? raw.UserId ?? raw.externalUserId ?? raw.ExternalUserId;
  if (!sessionId) return null;

  return {
    sessionId: String(sessionId),
    userId: String(userId ?? ""),
    isBookmarked: Boolean(raw.isBookmarked ?? raw.IsBookmarked),
    createdDate: raw.createdDate ?? raw.CreatedDate ?? null,
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

  sendMessage({ messageRequest, context = "", sessionId = null }) {
    const chatUserId = String(apiClient.userId || "");
    const body = {
      chatUserId,
      messageRequest,
      context,
      sessionId,
    };

    return apiClient.post(`${BASE_PATH}/chatRequest`, body);
  },
  setSessionBookmark(sessionId, isBookmarked) {
    return apiClient.patch(`${BASE_PATH}/sessions/${sessionId}/bookmark`, {
      isBookmarked,
    });
  },
};
