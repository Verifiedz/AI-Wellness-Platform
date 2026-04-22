/**
 * Top-level React error boundary.
 *
 * Catches any render-phase or lifecycle error from the subtree and renders a
 * calm, themed fallback UI instead of letting the app go white. The fallback
 * intentionally uses our v2 design tokens so it feels consistent with the rest
 * of Sakina even when the main tree has crashed.
 *
 * Must be mounted INSIDE ThemeProvider so the fallback can resolve palette
 * colors, but as HIGH as practical so it catches crashes from any screen.
 *
 * On catch we also try to report the error to Sentry via captureException —
 * the helper is a no-op when Sentry is not initialised, so this is safe in
 * local dev and preview builds without a DSN.
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from '../ui/v2/Text';
import { Button } from '../ui/v2/Button';
import { useV2Theme } from '../theme/v2';
import { captureException } from '../services/sentry';

function Fallback({ onRestart }) {
  const v2 = useV2Theme();
  return (
    <View style={[styles.root, { backgroundColor: v2.palette.bg.base }]}>
      <View style={styles.inner}>
        <Text variant="h1" align="center" style={{ marginBottom: v2.spacing[3] }}>
          Something went wrong
        </Text>
        <Text
          variant="body"
          color="secondary"
          align="center"
          style={{ maxWidth: 320, marginBottom: v2.spacing[6] }}
        >
          Restart the app to continue. If this keeps happening, try reinstalling.
        </Text>
        {onRestart ? (
          <Button variant="secondary" onPress={onRestart}>
            Try again
          </Button>
        ) : null}
      </View>
    </View>
  );
}

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
    this.handleRestart = this.handleRestart.bind(this);
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    try {
      captureException(error, { context: { componentStack: info?.componentStack } });
    } catch {
      // Never let the reporter itself crash the fallback path.
    }
  }

  handleRestart() {
    // Reset the boundary so the subtree re-mounts. If the underlying cause
    // persists the boundary will simply trip again — better than a stuck
    // white screen in a live demo.
    this.setState({ hasError: false });
  }

  render() {
    if (this.state.hasError) {
      return <Fallback onRestart={this.handleRestart} />;
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  inner: { alignItems: 'center', justifyContent: 'center' },
});

export default ErrorBoundary;
