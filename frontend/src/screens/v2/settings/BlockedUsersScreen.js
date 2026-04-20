/**
 * BlockedUsersScreen v2 — list of blocked users, unblock per row.
 *
 * Required by Apple App Store Guideline 1.2 + Google Play UGC policy.
 *
 * Behavior preserved: communityApi.getBlocks / unblock contracts, useFocusEffect
 * refresh, optimistic local removal on unblock.
 */

import React, { useCallback, useState } from 'react';
import { Alert, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { ShieldCheck, UserMinus } from 'phosphor-react-native';
import { useToast } from '../../../context/ToastContext';
import { communityApi } from '../../../services/communityApi';
import { useV2Theme } from '../../../theme/v2';
import {
  Button,
  Card,
  EmptyState,
  ErrorState,
  LoadingState,
  ScreenHeader,
  ScreenScaffold,
  Text,
} from '../../../ui/v2';

export function BlockedUsersScreen({ navigation }) {
  const v2 = useV2Theme();
  const { showToast } = useToast();
  const [blocks, setBlocks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await communityApi.getBlocks();
      if (result.error) {
        setError(result.error);
        return;
      }
      setBlocks(Array.isArray(result.data) ? result.data : []);
    } catch (err) {
      const isNetwork =
        err instanceof TypeError ||
        (err.message && err.message.toLowerCase().includes('network'));
      setError(isNetwork ? 'No internet connection' : 'Failed to load blocked users.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const confirmUnblock = useCallback(
    (block) => {
      Alert.alert(
        'Unblock user?',
        'You\u2019ll start seeing this user\u2019s community posts again.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Unblock',
            onPress: async () => {
              const result = await communityApi.unblock(block.blockedUserId);
              if (result.error) {
                showToast({ message: result.error, variant: 'error' });
                return;
              }
              showToast({ message: 'User unblocked.', variant: 'info' });
              setBlocks((cur) => cur.filter((b) => b.blockedUserId !== block.blockedUserId));
            },
          },
        ]
      );
    },
    [showToast]
  );

  return (
    <ScreenScaffold ambient ambientIntensity="subtle" paddingBottom="tabBar">
      <ScreenHeader title="Blocked users" onBack={() => navigation.goBack()} />

      <Text variant="body-sm" color="secondary" style={{ marginTop: v2.spacing[2], marginBottom: v2.spacing[3] }}>
        Users you block won\u2019t appear in community feeds. You can unblock any of them here.
      </Text>

      {error ? (
        <ErrorState body={error} onRetry={load} actionLabel="Retry" />
      ) : isLoading ? (
        <LoadingState caption="Loading blocked users" />
      ) : blocks.length === 0 ? (
        <Card padding={4} style={{ alignItems: 'center', paddingVertical: v2.spacing[8] }}>
          <ShieldCheck size={40} color={v2.palette.text.tertiary} weight="duotone" />
          <Text variant="body" color="secondary" align="center" style={{ marginTop: v2.spacing[3] }}>
            You haven\u2019t blocked anyone yet.
          </Text>
        </Card>
      ) : (
        <View style={{ gap: v2.spacing[2] }}>
          {blocks.map((item) => (
            <Card key={item.blockedUserId} padding={4}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    backgroundColor: v2.palette.bg.surfaceHigh,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <UserMinus size={18} color={v2.palette.primary} weight="duotone" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text variant="body" style={{ fontFamily: 'DMSans_600SemiBold' }}>
                    Anonymous user
                  </Text>
                  <Text variant="caption" color="secondary" style={{ marginTop: 2 }} numberOfLines={2}>
                    {item.reason
                      ? item.reason
                      : item.blockedAt
                      ? `Blocked ${new Date(item.blockedAt).toLocaleDateString()}`
                      : ''}
                  </Text>
                </View>
                <Button
                  variant="ghost"
                  size="sm"
                  onPress={() => confirmUnblock(item)}
                  haptic="firm"
                >
                  Unblock
                </Button>
              </View>
            </Card>
          ))}
        </View>
      )}
    </ScreenScaffold>
  );
}

export default BlockedUsersScreen;
