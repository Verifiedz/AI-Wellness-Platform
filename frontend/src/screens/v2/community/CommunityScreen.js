/**
 * CommunityScreen v2 — support group hub.
 *
 * Behavior preserved end-to-end:
 *   - communityApi.getGroups() contract unchanged
 *   - hasLoadedRef "first vs soft refresh" pattern
 *   - useFocusEffect refresh-on-return
 *   - Tap a group → navigate('GroupFeed', { slug, name })
 *
 * Visual rewrite: ScreenScaffold w/ subtle aurora, Phosphor icons mapped via
 * groupIcons.js, v2 Cards with 2-column bento, calm anonymous-posts banner.
 */

import React, { useCallback, useRef, useState } from 'react';
import { View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { ShieldCheck, UsersThree } from 'phosphor-react-native';
import { communityApi } from '../../../services/communityApi';
import { useV2Theme } from '../../../theme/v2';
import {
  Card,
  EmptyState,
  ErrorState,
  LoadingState,
  ScreenHeader,
  ScreenScaffold,
  Surface,
  Text,
} from '../../../ui/v2';
import { getGroupIcon } from './groupIcons';

export function CommunityScreen({ navigation }) {
  const v2 = useV2Theme();
  const [groups, setGroups] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const hasLoadedRef = useRef(false);

  const loadGroups = useCallback(async (soft = false) => {
    if (soft) setIsRefreshing(true);
    else setIsLoading(true);
    try {
      const result = await communityApi.getGroups();
      if (!result.error && result.data) {
        setGroups(Array.isArray(result.data) ? result.data : []);
        setError(null);
      } else if (result.error) {
        setError(result.error);
      }
    } catch (err) {
      const isNetwork =
        err instanceof TypeError ||
        (err.message && err.message.toLowerCase().includes('network'));
      setError(isNetwork ? 'No internet connection' : 'Failed to load community groups');
    } finally {
      if (soft) setIsRefreshing(false);
      else setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      const soft = hasLoadedRef.current;
      hasLoadedRef.current = true;
      loadGroups(soft);
    }, [loadGroups])
  );

  return (
    <ScreenScaffold
      ambient
      ambientIntensity="subtle"
      paddingBottom="tabBar"
      refreshControl={{ refreshing: isRefreshing, onRefresh: () => loadGroups(true) }}
    >
      <ScreenHeader title="Community" subtitle="Anonymous, supportive, kind" />

      <Surface
        elevation="raised"
        padding={3}
        style={{
          marginTop: v2.spacing[2],
          marginBottom: v2.spacing[4],
          flexDirection: 'row',
          alignItems: 'flex-start',
          gap: v2.spacing[2],
        }}
      >
        <ShieldCheck size={20} color={v2.palette.success} weight="duotone" />
        <Text variant="body-sm" color="secondary" style={{ flex: 1 }}>
          All posts are anonymous. Be kind. If you need immediate help, use the crisis button.
        </Text>
      </Surface>

      {error ? (
        <ErrorState
          body={error}
          onRetry={() => loadGroups(true)}
          actionLabel="Retry"
        />
      ) : isLoading ? (
        <LoadingState caption="Loading support groups" />
      ) : groups.length === 0 ? (
        <EmptyState
          title="Groups are setting up"
          body="Community spaces are being prepared. Check back soon."
        />
      ) : (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: v2.spacing[3] }}>
          {groups.map((group) => {
            const Icon = getGroupIcon(group.icon) || UsersThree;
            return (
              <View key={group.id || group.slug} style={{ width: '48%' }}>
                <Card
                  padding={4}
                  onPress={() =>
                    navigation.navigate('GroupFeed', { slug: group.slug, name: group.name })
                  }
                  accessibilityLabel={`Open ${group.name}`}
                  style={{ alignItems: 'center' }}
                >
                  <View
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: 28,
                      backgroundColor: v2.palette.bg.surfaceHigh,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Icon size={26} color={v2.palette.primary} weight="duotone" />
                  </View>
                  <Text
                    variant="h3"
                    align="center"
                    style={{ marginTop: v2.spacing[3] }}
                    numberOfLines={1}
                  >
                    {group.name}
                  </Text>
                  <Text
                    variant="caption"
                    color="tertiary"
                    align="center"
                    style={{ marginTop: 4 }}
                    numberOfLines={2}
                  >
                    {group.description}
                  </Text>
                  {group.postCount > 0 ? (
                    <Text
                      variant="caption"
                      color="secondary"
                      style={{ marginTop: v2.spacing[2] }}
                    >
                      {group.postCount} posts
                    </Text>
                  ) : null}
                </Card>
              </View>
            );
          })}
        </View>
      )}
    </ScreenScaffold>
  );
}

export default CommunityScreen;
