/**
 * Sakina v2 design system — public surface.
 * Import primitives by name; never reach into individual files.
 */

export { Text } from './Text';
export { Surface } from './Surface';
export { Divider } from './Divider';
export { AuroraBackground } from './AuroraBackground';
export { GlassPanel } from './GlassPanel';

export { BreathingPulse } from './BreathingPulse';
export { Blob } from './Blob';
export { ProgressRing } from './ProgressRing';
export { ParticleBloom } from './ParticleBloom';
export { Stagger, StaggerItem } from './Stagger';

export { Button } from './Button';
export { IconButton } from './IconButton';
export { Chip } from './Chip';
export { Switch } from './Switch';
export { Slider } from './Slider';

export { Input } from './Input';
export { Card } from './Card';
export { Avatar } from './Avatar';
export { Toast } from './Toast';

export { Sheet } from './Sheet';
export { EmptyState } from './EmptyState';
export { ErrorState } from './ErrorState';
export { LoadingState } from './LoadingState';

export { useHaptic, useReducedMotion, useDeviceTier } from './hooks';

// Navigation shell
export { TabBar } from './nav/TabBar';
export { ScreenScaffold } from './nav/ScreenScaffold';
export { ScreenHeader } from './nav/ScreenHeader';
export { setupNavigationFeatureFlags } from './nav/setupNavigation';
export { useScreenSystemBars } from './nav/useScreenSystemBars';
export { ScrollProgressProvider, useScrollProgress } from './nav/ScrollProgressContext';
