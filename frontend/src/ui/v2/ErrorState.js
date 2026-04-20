/**
 * ErrorState — same shape as EmptyState; calm coral palette; default Retry action.
 */

import React from 'react';
import { View } from 'react-native';
import { useV2Theme } from '../../theme/v2';
import { Text } from './Text';
import { Button } from './Button';

/**
 * @param {{
 *   title?: string,
 *   body?: string,
 *   onRetry?: () => void,
 *   actionLabel?: string,
 *   style?: any,
 * }} props
 */
export function ErrorState({
  title = 'Something went wrong',
  body = 'Take a breath. We can try again.',
  onRetry,
  actionLabel = 'Try again',
  style,
}) {
  const v2 = useV2Theme();
  return (
    <View
      style={[
        {
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: v2.spacing[6],
          paddingVertical: v2.spacing[10],
        },
        style,
      ]}
    >
      <View
        style={{
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: v2.palette.bg.surfaceHigh,
          borderWidth: 1,
          borderColor: v2.palette.error,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: v2.spacing[5],
        }}
      >
        <Text variant="h2" color="error">
          !
        </Text>
      </View>
      <Text variant="h2" align="center" style={{ marginBottom: v2.spacing[2] }}>
        {title}
      </Text>
      <Text
        variant="body"
        color="secondary"
        align="center"
        style={{ maxWidth: 320, marginBottom: v2.spacing[6] }}
      >
        {body}
      </Text>
      {onRetry ? (
        <Button variant="secondary" onPress={onRetry}>
          {actionLabel}
        </Button>
      ) : null}
    </View>
  );
}

export default ErrorState;
