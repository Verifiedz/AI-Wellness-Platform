/**
 * ScreenScaffold — every redesigned screen wraps with this.
 *
 * Wires:
 *   - SafeAreaInsets (top + bottom + horizontal)
 *   - Optional aurora ambient background
 *   - Optional KeyboardAwareScrollView from react-native-keyboard-controller
 *   - Tap-outside-to-dismiss-keyboard (when keyboardAware = true)
 *   - keyboardShouldPersistTaps='handled' baked in
 *   - Scroll/refresh control
 *   - Tab-bar safe bottom padding (so floating tab bar never overlaps content)
 *
 * Usage:
 *   <ScreenScaffold ambient keyboardAware paddingBottom="tabBar">
 *     <ScreenHeader title="Home" />
 *     <Surface>...</Surface>
 *   </ScreenScaffold>
 */

import React, { useCallback } from 'react';
import { Keyboard, Platform, Pressable, RefreshControl, ScrollView, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useV2Theme } from '../../../theme/v2';
import { AuroraBackground } from '../AuroraBackground';

const TAB_BAR_RESERVED = 88; // tab bar height + breathing room

/**
 * @param {{
 *   ambient?: boolean,
 *   ambientIntensity?: 'subtle'|'normal'|'vivid',
 *   scrollable?: boolean,
 *   keyboardAware?: boolean,
 *   paddingHorizontal?: 0|1|2|3|4|5|6|8|10|12|16|20,
 *   paddingTop?: 'safe'|number,
 *   paddingBottom?: 'safe'|'tabBar'|number,
 *   refreshControl?: { refreshing: boolean, onRefresh: () => void|Promise<void> },
 *   bottomAccessory?: React.ReactNode,
 *   topAccessory?: React.ReactNode,
 *   children?: any,
 *   testID?: string,
 *   contentContainerStyle?: any,
 * }} props
 */
export function ScreenScaffold({
  ambient = false,
  ambientIntensity = 'subtle',
  scrollable = true,
  keyboardAware = false,
  paddingHorizontal = 4,
  paddingTop = 'safe',
  paddingBottom = 'safe',
  refreshControl,
  bottomAccessory,
  topAccessory,
  children,
  testID,
  contentContainerStyle,
}) {
  const v2 = useV2Theme();
  const insets = useSafeAreaInsets();

  const topPad = paddingTop === 'safe' ? insets.top : paddingTop;
  let bottomPad;
  if (paddingBottom === 'safe') bottomPad = insets.bottom;
  else if (paddingBottom === 'tabBar') bottomPad = insets.bottom + TAB_BAR_RESERVED;
  else bottomPad = paddingBottom;

  const dismiss = useCallback(() => {
    if (Platform.OS !== 'web') Keyboard.dismiss();
  }, []);

  const innerPad = {
    paddingHorizontal: v2.spacing[paddingHorizontal],
    paddingTop: topPad,
    paddingBottom: bottomPad,
  };

  const refresh = refreshControl
    ? (
      <RefreshControl
        refreshing={refreshControl.refreshing}
        onRefresh={refreshControl.onRefresh}
        tintColor={v2.palette.primary}
        colors={[v2.palette.primary]}
        progressBackgroundColor={v2.palette.bg.surfaceHigh}
      />
    )
    : undefined;

  let body;
  if (scrollable && keyboardAware) {
    body = (
      <KeyboardAwareScrollView
        bottomOffset={62}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[innerPad, contentContainerStyle]}
        refreshControl={refresh}
      >
        {children}
      </KeyboardAwareScrollView>
    );
  } else if (scrollable) {
    body = (
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[innerPad, contentContainerStyle]}
        refreshControl={refresh}
      >
        {children}
      </ScrollView>
    );
  } else {
    body = <View style={[{ flex: 1 }, innerPad, contentContainerStyle]}>{children}</View>;
  }

  // The Pressable is the tap-outside-dismiss-keyboard surface.
  // It's only active on native — on web, it would intercept clicks unnecessarily.
  const Wrapper = Platform.OS === 'web' || !keyboardAware ? View : Pressable;

  return (
    <View
      testID={testID}
      style={{ flex: 1, backgroundColor: v2.palette.bg.base }}
    >
      {ambient ? <AuroraBackground intensity={ambientIntensity} /> : null}
      {topAccessory}
      <Wrapper
        onPress={keyboardAware ? dismiss : undefined}
        // Pressable accessibility: announce the wrapper as nothing — it's an overlay.
        accessible={false}
        style={{ flex: 1 }}
      >
        {body}
      </Wrapper>
      {bottomAccessory}
    </View>
  );
}

export default ScreenScaffold;
