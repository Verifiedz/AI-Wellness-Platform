import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { Card } from '../components/Card';
import { Banner } from '../components/Banner';
import { communityApi } from '../services/communityApi';

/**
 * Screen for managing community blocks. Required by Apple App Store Guideline
 * 1.2 and Google Play UGC policy: users must be able to review and remove
 * blocks from a discoverable place in the app.
 */
export function BlockedUsersScreen() {
  const { colors, fonts } = useTheme();
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
        err instanceof TypeError || (err.message && err.message.toLowerCase().includes('network'));
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
        "You'll start seeing this user's community posts again.",
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
              setBlocks((current) =>
                current.filter((b) => b.blockedUserId !== block.blockedUserId)
              );
            },
          },
        ]
      );
    },
    [showToast]
  );

  if (isLoading) {
    return (
      <View
        style={[
          styles.container,
          { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' },
        ]}
      >
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <FlatList
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      data={blocks}
      keyExtractor={(item) => item.blockedUserId}
      refreshing={isLoading}
      onRefresh={load}
      ListHeaderComponent={
        <>
          {error && (
            <Banner
              variant="error"
              message={error}
              action="Retry"
              onAction={load}
              onDismiss={() => setError(null)}
              style={{ marginBottom: 12 }}
            />
          )}
          <Text style={[fonts.bodySmall, { color: colors.textSecondary, marginBottom: 12 }]}>
            Users you block won't appear in community feeds. You can unblock any of them here.
          </Text>
        </>
      }
      ListEmptyComponent={
        !error && (
          <Card>
            <View style={{ alignItems: 'center', paddingVertical: 20 }}>
              <Ionicons name="shield-checkmark-outline" size={40} color={colors.textLight} />
              <Text
                style={[
                  fonts.body,
                  { color: colors.textSecondary, marginTop: 8, textAlign: 'center' },
                ]}
              >
                You haven't blocked anyone yet.
              </Text>
            </View>
          </Card>
        )
      }
      renderItem={({ item }) => (
        <Card style={styles.row}>
          <View style={[styles.avatar, { backgroundColor: `${colors.primary}15` }]}>
            <Ionicons name="person-outline" size={18} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[fonts.body, { color: colors.text, fontWeight: '600' }]}>
              Anonymous user
            </Text>
            <Text
              style={[fonts.caption, { color: colors.textSecondary, marginTop: 2 }]}
              numberOfLines={2}
            >
              {item.reason
                ? item.reason
                : item.blockedAt
                ? `Blocked ${new Date(item.blockedAt).toLocaleDateString()}`
                : ''}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => confirmUnblock(item)}
            style={[styles.unblockBtn, { borderColor: colors.border }]}
          >
            <Text style={[fonts.caption, { color: colors.primary, fontWeight: '600' }]}>
              Unblock
            </Text>
          </TouchableOpacity>
        </Card>
      )}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unblockBtn: {
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
});
