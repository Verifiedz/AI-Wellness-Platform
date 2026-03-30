import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Skeleton } from '../Skeleton';
import { useTheme } from '../../context/ThemeContext';

/**
 * Skeleton placeholder matching the AIChatScreen layout:
 * alternating left/right message bubbles and an input bar.
 */
export function ChatSkeleton() {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      <View style={styles.messages}>
        {/* Assistant bubble */}
        <View style={styles.rowLeft}>
          <Skeleton width="70%" height={60} borderRadius={20} />
        </View>
        {/* User bubble */}
        <View style={styles.rowRight}>
          <Skeleton width="55%" height={44} borderRadius={20} />
        </View>
        {/* Assistant bubble */}
        <View style={styles.rowLeft}>
          <Skeleton width="80%" height={80} borderRadius={20} />
        </View>
        {/* User bubble */}
        <View style={styles.rowRight}>
          <Skeleton width="45%" height={44} borderRadius={20} />
        </View>
      </View>

      {/* Input bar */}
      <View style={styles.inputRow}>
        <Skeleton width={0} height={48} borderRadius={24} style={{ flex: 1 }} />
        <Skeleton width={48} height={48} borderRadius={24} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'space-between' },
  messages: { flex: 1, gap: 12, paddingTop: 16, paddingHorizontal: 2 },
  rowLeft: { flexDirection: 'row', justifyContent: 'flex-start' },
  rowRight: { flexDirection: 'row', justifyContent: 'flex-end' },
  inputRow: {
    flexDirection: 'row',
    gap: 10,
    paddingTop: 10,
    paddingBottom: 12,
  },
});
