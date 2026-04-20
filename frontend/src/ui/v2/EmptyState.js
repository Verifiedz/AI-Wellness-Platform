/**
 * EmptyState — illustration slot + title + body + optional action.
 * Same shape as ErrorState/LoadingState for consistent screen scaffolding.
 */

import React from 'react';
import { View } from 'react-native';
import { useV2Theme } from '../../theme/v2';
import { Text } from './Text';
import { Button } from './Button';

/**
 * @param {{
 *   illustration?: React.ReactNode,
 *   title: string,
 *   body?: string,
 *   action?: { label: string, onPress: () => void },
 *   style?: any,
 * }} props
 */
export function EmptyState({ illustration, title, body, action, style }) {
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
      {illustration ? <View style={{ marginBottom: v2.spacing[5] }}>{illustration}</View> : null}
      <Text variant="h2" align="center" style={{ marginBottom: v2.spacing[2] }}>
        {title}
      </Text>
      {body ? (
        <Text
          variant="body"
          color="secondary"
          align="center"
          style={{ maxWidth: 320, marginBottom: v2.spacing[6] }}
        >
          {body}
        </Text>
      ) : null}
      {action ? (
        <Button variant="primary" onPress={action.onPress}>
          {action.label}
        </Button>
      ) : null}
    </View>
  );
}

export default EmptyState;
