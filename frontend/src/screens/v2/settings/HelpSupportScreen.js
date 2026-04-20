/**
 * HelpSupportScreen v2 — accordion FAQ + email support + about.
 *
 * Behavior preserved: Linking.openURL('mailto:...'), Constants.expoConfig.version.
 */

import React, { useState } from 'react';
import { Linking, Pressable, View } from 'react-native';
import Constants from 'expo-constants';
import { Lifebuoy, Envelope, Info, CaretDown, CaretUp, PaperPlaneTilt } from 'phosphor-react-native';
import { useV2Theme } from '../../../theme/v2';
import {
  Button,
  Card,
  ScreenHeader,
  ScreenScaffold,
  Text,
  useHaptic,
} from '../../../ui/v2';

const FAQ_ITEMS = [
  {
    question: 'How do I create a journal entry?',
    answer:
      'Navigate to the Journal tab and select your mood, energy level, and emotions. Write your thoughts in the text area and tap Save. You can edit or delete today\u2019s entry at any time.',
  },
  {
    question: 'What does the AI chat do?',
    answer:
      'The AI wellness assistant provides supportive conversations about your mental health and well-being. It can offer coping strategies, mindfulness exercises, and a safe space to reflect.',
  },
  {
    question: 'How do I view past journal entries?',
    answer:
      'Tap the calendar icon on the Journal screen to open the Mood Calendar. View entries by month, week, or year. Tap any day with a mood dot to view that entry.',
  },
  {
    question: 'Can I change my notification time?',
    answer:
      'Yes. Go to You → Notifications. Toggle daily tips on and use the time stepper to choose your preferred delivery time.',
  },
  {
    question: 'Is my data private?',
    answer:
      'Yes. All traffic is encrypted in transit using HTTPS, your password is stored as a salted BCrypt hash, and data at rest lives on managed databases with disk-level encryption. We do not sell or share your personal data, and AI chat content is not used to train external models.',
  },
  {
    question: 'How do I change my password?',
    answer:
      'Go to You → Profile and use the Change Password form. You\u2019ll need your current password and a new one that\u2019s at least 8 characters.',
  },
];

export function HelpSupportScreen({ navigation }) {
  const v2 = useV2Theme();
  const fireHaptic = useHaptic();
  const [expandedIdx, setExpandedIdx] = useState(null);
  const appVersion =
    Constants.expoConfig?.version || Constants.manifest?.version || '1.0.0';

  return (
    <ScreenScaffold ambient ambientIntensity="subtle" paddingBottom="tabBar">
      <ScreenHeader title="Help & support" onBack={() => navigation.goBack()} />

      <Card padding={4} style={{ marginTop: v2.spacing[2], marginBottom: v2.spacing[3] }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: v2.spacing[2] }}>
          <Lifebuoy size={22} color={v2.palette.primary} weight="duotone" />
          <Text variant="h3">Frequently asked questions</Text>
        </View>
        <View style={{ marginTop: v2.spacing[3] }}>
          {FAQ_ITEMS.map((item, idx) => {
            const isOpen = expandedIdx === idx;
            const Caret = isOpen ? CaretUp : CaretDown;
            return (
              <Pressable
                key={item.question}
                accessibilityRole="button"
                accessibilityLabel={item.question}
                accessibilityState={{ expanded: isOpen }}
                onPress={() => {
                  fireHaptic('tap');
                  setExpandedIdx(isOpen ? null : idx);
                }}
                style={{
                  paddingVertical: 14,
                  borderBottomWidth: idx === FAQ_ITEMS.length - 1 ? 0 : 1,
                  borderBottomColor: v2.palette.border.subtle,
                }}
              >
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <Text
                    variant="body"
                    style={{ fontFamily: 'DMSans_600SemiBold', flex: 1, marginRight: 8 }}
                  >
                    {item.question}
                  </Text>
                  <Caret size={18} color={v2.palette.text.tertiary} weight="duotone" />
                </View>
                {isOpen ? (
                  <Text
                    variant="body-sm"
                    color="secondary"
                    style={{ marginTop: 10, lineHeight: 21 }}
                  >
                    {item.answer}
                  </Text>
                ) : null}
              </Pressable>
            );
          })}
        </View>
      </Card>

      <Card padding={4} style={{ marginBottom: v2.spacing[3] }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: v2.spacing[2] }}>
          <Envelope size={22} color={v2.palette.primary} weight="duotone" />
          <Text variant="h3">Contact support</Text>
        </View>
        <Text variant="body-sm" color="secondary" style={{ marginTop: 4, marginBottom: v2.spacing[3] }}>
          Having trouble or have a question not covered above?
        </Text>
        <Button
          variant="primary"
          size="lg"
          fullWidth
          leadingIcon={PaperPlaneTilt}
          onPress={() =>
            Linking.openURL('mailto:support@sakina.app?subject=Support%20Request')
          }
        >
          Email support
        </Button>
      </Card>

      <Card padding={4}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: v2.spacing[2] }}>
          <Info size={22} color={v2.palette.primary} weight="duotone" />
          <Text variant="h3">About</Text>
        </View>
        <View style={{ marginTop: v2.spacing[3] }}>
          {[
            { label: 'App version', value: appVersion },
            { label: 'Platform', value: 'Sakina Wellness' },
          ].map((row, idx, arr) => (
            <View
              key={row.label}
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingVertical: 12,
                borderBottomWidth: idx === arr.length - 1 ? 0 : 1,
                borderBottomColor: v2.palette.border.subtle,
              }}
            >
              <Text variant="body-sm" color="secondary">
                {row.label}
              </Text>
              <Text variant="body" style={{ fontFamily: 'DMSans_600SemiBold' }}>
                {row.value}
              </Text>
            </View>
          ))}
        </View>
      </Card>
    </ScreenScaffold>
  );
}

export default HelpSupportScreen;
