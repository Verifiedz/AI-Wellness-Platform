import { apiClient } from '../src/services/api';

// Mock global.fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock AbortController (jsdom provides this but ensure abort behavior is testable)
global.AbortController = class {
  constructor() {
    this.signal = {};
    this.abort = jest.fn();
  }
};

beforeEach(() => {
  jest.clearAllMocks();
  // Reset auth state between tests
  apiClient.clearAuth();
});

describe('ApiClient', () => {
  describe('GET requests', () => {
    it('get_sends_auth_header: includes Authorization header when token is set', async () => {
      apiClient.setAuth('test-jwt-token', 'user-123');

      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: { get: jest.fn().mockReturnValue(null) },
        json: jest.fn().mockResolvedValue({ data: 'result' }),
      });

      await apiClient.get('/test');

      const [, options] = mockFetch.mock.calls[0];
      expect(options.headers['Authorization']).toBe('Bearer test-jwt-token');
    });

    it('get_no_auth_header_when_not_set: omits Authorization when no token', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: { get: jest.fn().mockReturnValue(null) },
        json: jest.fn().mockResolvedValue({ data: 'result' }),
      });

      await apiClient.get('/test');

      const [, options] = mockFetch.mock.calls[0];
      expect(options.headers['Authorization']).toBeUndefined();
    });

    it('get_returns_data_on_success: returns status and data for 200 response', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: { get: jest.fn().mockReturnValue(null) },
        json: jest.fn().mockResolvedValue({ items: [1, 2, 3] }),
      });

      const result = await apiClient.get('/api/items');

      expect(result.status).toBe(200);
      expect(result.data).toEqual({ items: [1, 2, 3] });
      expect(result.error).toBeNull();
    });
  });

  describe('POST requests', () => {
    it('post_sends_json_body: sends Content-Type application/json and stringified body', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 201,
        statusText: 'Created',
        headers: { get: jest.fn().mockReturnValue(null) },
        json: jest.fn().mockResolvedValue({ id: '1' }),
      });

      await apiClient.post('/api/items', { key: 'value', count: 42 });

      const [, options] = mockFetch.mock.calls[0];
      expect(options.headers['Content-Type']).toBe('application/json');
      expect(options.body).toBe(JSON.stringify({ key: 'value', count: 42 }));
      expect(options.method).toBe('POST');
    });

    it('post_returns_error_on_401: returns 401 status with error message', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        headers: { get: jest.fn().mockReturnValue(null) },
        json: jest.fn().mockResolvedValue({ message: 'Invalid token' }),
      });

      const result = await apiClient.post('/api/protected', {});

      expect(result.status).toBe(401);
      expect(result.data).toBeNull();
      expect(result.error).toBeTruthy();
    });
  });

  describe('error handling', () => {
    it('handles_network_error: returns error object when fetch rejects', async () => {
      mockFetch.mockRejectedValue(new Error('Network unreachable'));

      const result = await apiClient.get('/api/test');

      expect(result.status).toBe(0);
      expect(result.data).toBeNull();
      expect(result.error).toBe('Network unreachable');
    });

    it('handles_404_response: returns 404 status with error', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        headers: { get: jest.fn().mockReturnValue(null) },
        json: jest.fn().mockResolvedValue({ message: 'Resource not found' }),
      });

      const result = await apiClient.get('/api/missing');

      expect(result.status).toBe(404);
      expect(result.data).toBeNull();
      expect(result.error).toBeTruthy();
    });
  });
});
