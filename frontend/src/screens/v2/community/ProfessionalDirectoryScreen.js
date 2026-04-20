/**
 * ProfessionalDirectoryScreen v2 — searchable list of mental health resources.
 *
 * Behavior preserved end-to-end:
 *   - PROFESSIONALS / PROFESSIONAL_DISCLAIMER from constants
 *   - Filter chips: all | hotline | platform | organization | directory
 *   - Linking.openURL for tel: + website
 */

import React, { useMemo, useState } from 'react';
import { Linking, View } from 'react-native';
import {
  Phone,
  Globe,
  Buildings,
  MagnifyingGlass,
  UsersThree,
  Info,
} from 'phosphor-react-native';
import {
  PROFESSIONALS,
  PROFESSIONAL_DISCLAIMER,
} from '../../../constants/professionals';
import { useV2Theme } from '../../../theme/v2';
import {
  Button,
  Card,
  Chip,
  ScreenHeader,
  ScreenScaffold,
  Surface,
  Text,
} from '../../../ui/v2';

const TYPE_FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'hotline', label: 'Hotlines' },
  { key: 'platform', label: 'Online' },
  { key: 'organization', label: 'Organizations' },
  { key: 'directory', label: 'Directories' },
];

const TYPE_ICONS = {
  hotline: Phone,
  platform: Globe,
  organization: Buildings,
  directory: MagnifyingGlass,
};

export function ProfessionalDirectoryScreen({ navigation }) {
  const v2 = useV2Theme();
  const [filter, setFilter] = useState('all');

  const filtered = useMemo(
    () => (filter === 'all' ? PROFESSIONALS : PROFESSIONALS.filter((p) => p.type === filter)),
    [filter]
  );

  const handleCall = (phone) => {
    if (!phone) return;
    Linking.openURL(`tel:${phone.replace(/[^0-9+]/g, '')}`);
  };
  const handleWebsite = (url) => {
    if (!url) return;
    Linking.openURL(url);
  };

  return (
    <ScreenScaffold ambient ambientIntensity="subtle" paddingBottom="tabBar">
      <ScreenHeader title="Professional help" onBack={() => navigation?.goBack?.()} />

      <Surface
        elevation="raised"
        padding={3}
        style={{
          marginTop: v2.spacing[2],
          marginBottom: v2.spacing[3],
          flexDirection: 'row',
          alignItems: 'flex-start',
          gap: v2.spacing[2],
        }}
      >
        <Info size={20} color={v2.palette.text.tertiary} weight="duotone" />
        <Text variant="body-sm" color="secondary" style={{ flex: 1 }}>
          {PROFESSIONAL_DISCLAIMER}
        </Text>
      </Surface>

      <View
        style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: v2.spacing[2],
          marginBottom: v2.spacing[3],
        }}
      >
        {TYPE_FILTERS.map((f) => (
          <Chip
            key={f.key}
            selected={filter === f.key}
            onPress={() => setFilter(f.key)}
            accessibilityLabel={`Filter: ${f.label}`}
          >
            {f.label}
          </Chip>
        ))}
      </View>

      <View style={{ gap: v2.spacing[3] }}>
        {filtered.map((prof) => {
          const Icon = TYPE_ICONS[prof.type] || UsersThree;
          return (
            <Card key={prof.id} padding={4}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: v2.spacing[3] }}>
                <View
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    backgroundColor: v2.palette.bg.surfaceHigh,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Icon size={22} color={v2.palette.primary} weight="duotone" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    variant="body"
                    style={{ fontFamily: 'DMSans_600SemiBold' }}
                    numberOfLines={1}
                  >
                    {prof.name}
                  </Text>
                  <Text
                    variant="caption"
                    style={{ color: v2.palette.primary, marginTop: 2 }}
                    numberOfLines={2}
                  >
                    {prof.specialty}
                  </Text>
                </View>
              </View>

              <Text
                variant="body-sm"
                color="secondary"
                style={{ marginTop: v2.spacing[2], lineHeight: 20 }}
                numberOfLines={3}
              >
                {prof.description}
              </Text>

              <View
                style={{
                  flexDirection: 'row',
                  gap: v2.spacing[2],
                  marginTop: v2.spacing[3],
                }}
              >
                {prof.phone ? (
                  <Button
                    variant="secondary"
                    size="sm"
                    leadingIcon={Phone}
                    onPress={() => handleCall(prof.phone)}
                    haptic="firm"
                  >
                    Call
                  </Button>
                ) : null}
                {prof.website ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    leadingIcon={Globe}
                    onPress={() => handleWebsite(prof.website)}
                    haptic="tap"
                  >
                    Visit
                  </Button>
                ) : null}
              </View>
            </Card>
          );
        })}
      </View>
    </ScreenScaffold>
  );
}

export default ProfessionalDirectoryScreen;
