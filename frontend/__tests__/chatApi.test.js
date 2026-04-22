import { chatApi } from '../src/services/chatApi';

// Mock the apiClient from api.js
jest.mock('../src/services/api', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
    userId: 'user-123',
  },
}));

const { apiClient } = require('../src/services/api');

const BASE_PATH = '/chat/chatService/api';

beforeEach(() => {
  jest.clearAllMocks();
});

describe('chatApi', () => {
  describe('getSessions', () => {
    it('getSessions_calls_get: calls apiClient.get with sessions path', async () => {
      apiClient.get.mockResolvedValue({
        status: 200,
        data: [],
        error: null,
      });

      await chatApi.getSessions();

      expect(apiClient.get).toHaveBeenCalledWith(`${BASE_PATH}/sessions`);
    });

    it('getSessions_normalizes_session_data: returns normalized sessions array', async () => {
      const rawSessions = [
        { sessionID: 'sess-1', userId: 'user-1', isBookmarked: false, createdDate: '2024-01-01' },
        { sessionID: 'sess-2', userId: 'user-2', isBookmarked: true, createdDate: '2024-01-02' },
      ];
      apiClient.get.mockResolvedValue({
        status: 200,
        data: rawSessions,
        error: null,
      });

      const result = await chatApi.getSessions();

      expect(result.data).toHaveLength(2);
      expect(result.data[0].sessionId).toBe('sess-1');
      expect(result.data[1].isBookmarked).toBe(true);
    });
  });

  describe('getSessionMessages', () => {
    it('getMessages_calls_get_with_session_id: calls apiClient.get with session-specific path', async () => {
      const sessionId = 'test-session-id';
      apiClient.get.mockResolvedValue({
        status: 200,
        data: [],
        error: null,
      });

      await chatApi.getSessionMessages(sessionId);

      expect(apiClient.get).toHaveBeenCalledWith(`${BASE_PATH}/chat/${sessionId}`);
    });
  });

  describe('sendMessage', () => {
    it('sendMessage_calls_post_with_correct_path: calls apiClient.post with chatRequest endpoint', async () => {
      apiClient.post.mockResolvedValue({
        status: 200,
        data: { message: 'Response from AI' },
        error: null,
      });

      await chatApi.sendMessage({
        messageRequest: 'Hello, how are you?',
        context: '',
        sessionId: null,
      });

      expect(apiClient.post).toHaveBeenCalledWith(
        `${BASE_PATH}/chatRequest`,
        expect.objectContaining({
          messageRequest: 'Hello, how are you?',
          context: '',
          sessionId: null,
        }),
        expect.objectContaining({ timeoutMs: expect.any(Number) })
      );
    });

    it('sendMessage_includes_chatUserId: sends chatUserId from apiClient.userId', async () => {
      apiClient.post.mockResolvedValue({
        status: 200,
        data: { message: 'Response' },
        error: null,
      });

      await chatApi.sendMessage({
        messageRequest: 'Test message',
        context: '',
        sessionId: 'sess-1',
      });

      expect(apiClient.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ chatUserId: 'user-123' }),
        expect.objectContaining({ timeoutMs: expect.any(Number) })
      );
    });
  });

  describe('deleteSession', () => {
    it('deleteSession_calls_delete_with_session_id: calls apiClient.delete with correct path', async () => {
      const sessionId = 'session-to-delete';
      apiClient.delete.mockResolvedValue({ status: 200, data: null, error: null });

      await chatApi.deleteSession(sessionId);

      expect(apiClient.delete).toHaveBeenCalledWith(`${BASE_PATH}/sessions/${sessionId}`);
    });
  });
});
