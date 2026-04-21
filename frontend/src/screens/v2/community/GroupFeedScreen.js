/**
 * GroupFeedScreen v2 — anonymous post feed for a single group.
 *
 * Behavior preserved end-to-end:
 *   - communityApi.getPosts/createPost/addReaction/removeReaction/
 *     reportPost/blockPostAuthor contracts unchanged
 *   - 1000-character post limit
 *   - Apple Guideline 1.2: Report + Block one tap from any post
 *   - useFocusEffect refresh-on-return
 *   - useToast for non-blocking confirmations
 *
 * Visual rewrite:
 *   - FlashList replaces FlatList
 *   - PostCard extracted + memoized
 *   - ChatComposer-style input bar (themed, send IconButton)
 *   - ScreenScaffold w/ keyboardAware + ambient aurora
 */

import React, { useCallback, useState } from 'react';
import { Alert, View, TextInput, Platform, Keyboard, Pressable } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useFocusEffect } from '@react-navigation/native';
import { KeyboardStickyView } from 'react-native-keyboard-controller';
import { PaperPlaneTilt } from 'phosphor-react-native';
import { communityApi } from '../../../services/communityApi';
import { useToast } from '../../../context/ToastContext';
import { useV2Theme } from '../../../theme/v2';
import {
  EmptyState,
  ErrorState,
  IconButton,
  LoadingState,
  ScreenHeader,
  ScreenScaffold,
  Text,
  useHaptic,
} from '../../../ui/v2';
import { PostCard } from './PostCard';

const MAX_POST_LEN = 1000;

export function GroupFeedScreen({ navigation, route }) {
  const v2 = useV2Theme();
  const fireHaptic = useHaptic();
  const { showToast } = useToast();
  const { slug, name } = route.params || {};

  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [newPost, setNewPost] = useState('');
  const [isPosting, setIsPosting] = useState(false);

  const loadPosts = useCallback(
    async (soft = false) => {
      if (soft) setIsRefreshing(true);
      else setIsLoading(true);
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
          err instanceof TypeError ||
          (err.message && err.message.toLowerCase().includes('network'));
        setLoadError(isNetwork ? 'No internet connection' : 'Failed to load posts.');
      } finally {
        if (soft) setIsRefreshing(false);
        else setIsLoading(false);
      }
    },
    [slug]
  );

  useFocusEffect(
    useCallback(() => {
      loadPosts(false);
    }, [loadPosts])
  );

  const handlePost = useCallback(async () => {
    const trimmed = newPost.trim();
    if (!trimmed || isPosting) return;
    if (trimmed.length > MAX_POST_LEN) {
      showToast({
        message: `Posts must be ${MAX_POST_LEN} characters or less.`,
        variant: 'warning',
      });
      return;
    }
    setIsPosting(true);
    try {
      const result = await communityApi.createPost(slug, { content: trimmed });
      if (result.error) {
        showToast({ message: result.error || 'Failed to post.', variant: 'error' });
        return;
      }
      setNewPost('');
      fireHaptic('success');
      loadPosts(true);
    } catch (err) {
      const isNetwork =
        err instanceof TypeError ||
        (err.message && err.message.toLowerCase().includes('network'));
      showToast({
        message: isNetwork ? 'No internet connection' : 'Failed to post.',
        variant: 'error',
      });
    } finally {
      setIsPosting(false);
    }
  }, [newPost, isPosting, slug, loadPosts, showToast, fireHaptic]);

  const handleReaction = useCallback(
    async (postId, type, alreadyReacted) => {
      try {
        if (alreadyReacted) await communityApi.removeReaction(postId, type);
        else await communityApi.addReaction(postId, type);
        loadPosts(true);
      } catch {
        // Reaction failed — silent, user can retry.
      }
    },
    [loadPosts]
  );

  const submitReport = useCallback(
    async (postId, reason) => {
      const trimmed = reason?.trim();
      if (!trimmed) return;
      await communityApi.reportPost(postId, trimmed);
      showToast({ message: 'Thank you. Our team will review this post.', variant: 'info' });
    },
    [showToast]
  );

  const confirmBlock = useCallback(
    (postId) => {
      Alert.alert(
        'Block this user?',
        'You won\u2019t see their posts or replies again. Unblock from Settings → Privacy any time.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Block',
            style: 'destructive',
            onPress: async () => {
              const result = await communityApi.blockPostAuthor(postId);
              if (result.error) {
                showToast({
                  message: result.error || 'Unable to block this user.',
                  variant: 'error',
                });
                return;
              }
              showToast({ message: 'User blocked.', variant: 'info' });
              loadPosts(true);
            },
          },
        ]
      );
    },
    [loadPosts, showToast]
  );

  const handlePostMenu = useCallback(
    (postId) => {
      Alert.alert('Post options', 'What would you like to do?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Report',
          onPress: () => {
            if (Alert.prompt) {
              Alert.prompt(
                'Report post',
                'Please describe why you\u2019re reporting this post:',
                [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Report', onPress: (reason) => submitReport(postId, reason) },
                ]
              );
            } else {
              submitReport(postId, 'Reported from Android (no prompt)');
            }
          },
        },
        { text: 'Block user', style: 'destructive', onPress: () => confirmBlock(postId) },
      ]);
    },
    [submitReport, confirmBlock]
  );

  const renderItem = useCallback(
    ({ item }) => (
      <PostCard item={item} onMenu={handlePostMenu} onReaction={handleReaction} />
    ),
    [handlePostMenu, handleReaction]
  );

  return (
    <ScreenScaffold
      ambient
      ambientIntensity="subtle"
      paddingHorizontal={4}
      paddingTop={0}
      paddingBottom={0}
      scrollable={false}
    >
      <ScreenHeader title={name || 'Group'} onBack={() => navigation.goBack()} />

      <View style={{ flex: 1 }}>
        {loadError ? (
          <ErrorState
            body={loadError}
            onRetry={() => loadPosts(true)}
            actionLabel="Retry"
          />
        ) : isLoading ? (
          <LoadingState caption="Loading conversations" />
        ) : posts.length === 0 ? (
          <EmptyState
            title="No posts yet"
            body="Be the first to share. The space is yours."
          />
        ) : (
          <FlashList
            data={posts}
            keyboardShouldPersistTaps="handled"
            keyExtractor={(item) => String(item.id)}
            renderItem={renderItem}
            onRefresh={() => loadPosts(true)}
            refreshing={isRefreshing}
            contentContainerStyle={{ paddingBottom: 12 }}
          />
        )}
      </View>

      {/* Composer — bleeds to screen edge for full-width top border, inset
          by spacing[4]. The parent bottom-tab navigator already reserves
          insets.bottom for the home indicator beneath the tab bar, so no
          marginBottom is needed. When the keyboard opens, MainTabs uses
          tabBarHideOnKeyboard so the tab bar collapses and the composer
          translates up by the full keyboardHeight, landing flush on the
          keyboard top. */}
      <KeyboardStickyView
        offset={{ closed: 0, opened: 0 }}
        style={{
          paddingTop: v2.spacing[3],
          paddingBottom: v2.spacing[3],
          paddingHorizontal: v2.spacing[4],
          marginHorizontal: -v2.spacing[4],
          flexDirection: 'row',
          alignItems: 'flex-end',
          gap: v2.spacing[2],
          borderTopWidth: 1,
          borderTopColor: v2.palette.border.subtle,
          backgroundColor: v2.palette.bg.base,
        }}
      >
        <TextInput
          value={newPost}
          onChangeText={setNewPost}
          placeholder="Share your thoughts…"
          placeholderTextColor={v2.palette.text.tertiary}
          multiline
          maxLength={MAX_POST_LEN}
          editable={!isPosting}
          keyboardAppearance={v2.isDark ? 'dark' : 'light'}
          style={{
            flex: 1,
            minHeight: 48,
            maxHeight: 120,
            borderWidth: 1,
            borderColor: v2.palette.border.subtle,
            backgroundColor: v2.palette.bg.surface,
            borderRadius: 22,
            paddingHorizontal: 18,
            paddingVertical: Platform.OS === 'ios' ? 12 : 8,
            fontFamily: 'DMSans_400Regular',
            fontSize: 15,
            color: v2.palette.text.primary,
          }}
        />
        <IconButton
          icon={PaperPlaneTilt}
          accessibilityLabel="Post"
          variant="accent"
          weight="fill"
          haptic="firm"
          disabled={!newPost.trim() || isPosting}
          onPress={handlePost}
        />
      </KeyboardStickyView>

      {/* Character count under input when nearing limit */}
      {newPost.length > MAX_POST_LEN - 100 ? (
        <Text
          variant="caption"
          color={newPost.length > MAX_POST_LEN ? 'error' : 'tertiary'}
          align="right"
          style={{ paddingBottom: v2.spacing[1] }}
        >
          {newPost.length} / {MAX_POST_LEN}
        </Text>
      ) : null}
    </ScreenScaffold>
  );
}

export default GroupFeedScreen;
