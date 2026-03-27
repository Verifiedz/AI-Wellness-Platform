import { apiClient } from "./api";

const BASE_PATH = "/api/community";

/**
 * Community REST API service.
 *
 * Endpoint contract (routed through YARP gateway):
 *   GET    /api/community/groups                    -> 200
 *   GET    /api/community/groups/:slug/posts        -> 200
 *   POST   /api/community/groups/:slug/posts        -> 201
 *   POST   /api/community/posts/:id/reactions       -> 200
 *   DELETE /api/community/posts/:id/reactions/:type  -> 204
 *   POST   /api/community/posts/:id/report          -> 201
 */
export const communityApi = {
  /** Get all support groups. */
  getGroups() {
    return apiClient.get(`${BASE_PATH}/groups`);
  },

  /** Get posts in a group. */
  getPosts(slug, { limit = 20, offset = 0 } = {}) {
    return apiClient.get(
      `${BASE_PATH}/groups/${slug}/posts?limit=${limit}&offset=${offset}`
    );
  },

  /** Create a new post in a group. */
  createPost(slug, data) {
    return apiClient.post(`${BASE_PATH}/groups/${slug}/posts`, data);
  },

  /** Add a reaction to a post. */
  addReaction(postId, reactionType) {
    return apiClient.post(`${BASE_PATH}/posts/${postId}/reactions`, {
      reactionType,
    });
  },

  /** Remove a reaction from a post. */
  removeReaction(postId, reactionType) {
    return apiClient.delete(
      `${BASE_PATH}/posts/${postId}/reactions/${reactionType}`
    );
  },

  /** Report a post. */
  reportPost(postId, reason) {
    return apiClient.post(`${BASE_PATH}/posts/${postId}/report`, { reason });
  },
};
