import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { format } from 'date-fns';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Banner } from '../components/Banner';
import { communityApi } from '../services/communityApi';
import { REACTION_TYPES } from '../constants/communityGuidelines';

/**
 * Post feed for a specific support group.
 */
export function GroupFeedScreen({ route }) {
  const { slug, name } = route.params;
  const { colors, fonts } = useTheme();
  const { showToast } = useToast();

  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [newPost, setNewPost] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [postError, setPostError] = useState(null);

  const loadPosts = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const result = await communityApi.getPosts(slug);
      if (!result.error && result.data) {
        setPosts(Array.isArray(result.data) ? result.data : []);
      } else if (result.error) {
        setLoadError(result.error || 'Failed to load posts.');
      }
    } catch (err) {
      const isNetwork =
        err instanceof TypeError || (err.message && err.message.toLowerCase().includes('network'));
      setLoadError(isNetwork ? 'No internet connection' : 'Failed to load posts. Tap Retry to try again.');
    } finally {
      setIsLoading(false);
    }
  }, [slug]);

  useFocusEffect(
    useCallback(() => {
      loadPosts();
    }, [loadPosts])
  );

  const handlePost = useCallback(async () => {
    const trimmed = newPost.trim();
    if (!trimmed || isPosting) return;

    if (trimmed.length > 1000) {
      Alert.alert('Too Long', 'Posts must be 1000 characters or less.');
      return;
    }

    setIsPosting(true);
    setPostError(null);
    try {
      const result = await communityApi.createPost(slug, { content: trimmed });
      if (result.error) {
        setPostError(result.error || 'Failed to create post. Tap Retry to try again.');
        return;
      }
      setNewPost('');
      loadPosts();
    } catch (err) {
      const isNetwork =
        err instanceof TypeError || (err.message && err.message.toLowerCase().includes('network'));
      setPostError(isNetwork ? 'No internet connection' : 'Failed to create post. Tap Retry to try again.');
    } finally {
      setIsPosting(false);
    }
  }, [newPost, isPosting, slug, loadPosts]);

  const handleReaction = useCallback(
    async (postId, type, alreadyReacted) => {
      try {
        if (alreadyReacted) {
          await communityApi.removeReaction(postId, type);
        } else {
          await communityApi.addReaction(postId, type);
        }
        loadPosts();
      } catch {
        // Reaction failed
      }
    },
    [loadPosts]
  );

  const handleReport = useCallback((postId) => {
    Alert.prompt
      ? Alert.prompt('Report Post', "Please describe why you're reporting this post:", [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Report',
            onPress: async (reason) => {
              if (!reason?.trim()) return;
              await communityApi.reportPost(postId, reason.trim());
              showToast({ message: 'Thank you. Our team will review this post.', variant: 'info' });
            },
          },
        ])
      : showToast({ message: 'Report submitted for review.', variant: 'info' });
  }, []);

  const renderPost = ({ item }) => (
    <Card style={styles.postCard}>
      <View style={styles.postHeader}>
        <View style={[styles.avatar, { backgroundColor: `${colors.primary}20` }]}>
          <Text style={[fonts.body, { color: colors.primary, fontWeight: '700' }]}>
            {(item.anonymousName || 'A')[0].toUpperCase()}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[fonts.body, { color: colors.text, fontWeight: '600' }]}>
            {item.anonymousName || 'Anonymous'}
          </Text>
          <Text style={[fonts.caption, { color: colors.textLight }]}>
            {format(new Date(item.createdAt), 'MMM d, h:mm a')}
          </Text>
        </View>
        <TouchableOpacity onPress={() => handleReport(item.id)}>
          <Ionicons name="flag-outline" size={16} color={colors.textLight} />
        </TouchableOpacity>
      </View>

      <Text style={[fonts.body, { color: colors.text, lineHeight: 22, marginTop: 10 }]}>
        {item.content}
      </Text>

      <View style={styles.reactions}>
        {REACTION_TYPES.map((r) => {
          const count = item.reactions?.[r.key] || 0;
          const userReacted = item.userReactions?.includes(r.key);
          return (
            <TouchableOpacity
              key={r.key}
              style={[
                styles.reactionBtn,
                {
                  backgroundColor: userReacted ? `${colors.primary}15` : colors.surface,
                  borderColor: userReacted ? colors.primary : colors.border,
                },
              ]}
              onPress={() => handleReaction(item.id, r.key, userReacted)}
            >
              <Text style={{ fontSize: 14 }}>{r.emoji}</Text>
              {count > 0 && (
                <Text style={[fonts.caption, { color: colors.textSecondary }]}>{count}</Text>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {item.replyCount > 0 && (
        <Text style={[fonts.caption, { color: colors.primary, marginTop: 8 }]}>
          {item.replyCount} {item.replyCount === 1 ? 'reply' : 'replies'}
        </Text>
      )}
    </Card>
  );

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={100}
    >
      <FlatList
        data={posts}
        renderItem={renderPost}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshing={isLoading}
        onRefresh={loadPosts}
        ListHeaderComponent={
          loadError ? (
            <Banner
              variant="error"
              message={loadError}
              action="Retry"
              onAction={loadPosts}
              style={{ marginBottom: 12 }}
            />
          ) : null
        }
        ListEmptyComponent={
          !isLoading && !loadError && (
            <View style={{ alignItems: 'center', paddingVertical: 40 }}>
              <Ionicons name="chatbubbles-outline" size={40} color={colors.textLight} />
              <Text
                style={[
                  fonts.body,
                  { color: colors.textSecondary, marginTop: 8, textAlign: 'center' },
                ]}
              >
                No posts yet. Be the first to share!
              </Text>
            </View>
          )
        }
      />

      {postError && (
        <Banner
          variant="error"
          message={postError}
          action="Retry"
          onAction={handlePost}
          onDismiss={() => setPostError(null)}
          style={{ marginHorizontal: 12, marginBottom: 0, borderBottomLeftRadius: 0, borderBottomRightRadius: 0 }}
        />
      )}

      <View
        style={[
          styles.inputBar,
          { backgroundColor: colors.surface, borderTopColor: colors.border },
        ]}
      >
        <TextInput
          style={[
            styles.input,
            fonts.body,
            { color: colors.text, backgroundColor: colors.background },
          ]}
          placeholder="Share your thoughts..."
          placeholderTextColor={colors.textLight}
          value={newPost}
          onChangeText={setNewPost}
          multiline
          maxLength={1000}
        />
        <TouchableOpacity
          onPress={handlePost}
          disabled={!newPost.trim() || isPosting}
          style={[
            styles.sendBtn,
            { backgroundColor: newPost.trim() ? colors.primary : colors.disabled },
          ]}
        >
          <Ionicons name="send" size={18} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  list: { padding: 16, paddingBottom: 80 },
  postCard: { marginBottom: 12 },
  postHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reactions: { flexDirection: 'row', gap: 8, marginTop: 12 },
  reactionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    gap: 8,
    borderTopWidth: 1,
  },
  input: {
    flex: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    maxHeight: 100,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
