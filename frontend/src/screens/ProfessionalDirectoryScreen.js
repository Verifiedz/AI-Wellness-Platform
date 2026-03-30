import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { Card } from '../components/Card';
import { Banner } from '../components/Banner';
import { AnimatedCard } from '../components/AnimatedCard';
import { ChipGroup } from '../components/ChipGroup';
import { PROFESSIONALS, PROFESSIONAL_DISCLAIMER } from '../constants/professionals';

const TYPE_FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'hotline', label: 'Hotlines' },
  { key: 'platform', label: 'Online' },
  { key: 'organization', label: 'Organizations' },
  { key: 'directory', label: 'Directories' },
];

const TYPE_ICONS = {
  hotline: 'call-outline',
  platform: 'globe-outline',
  organization: 'business-outline',
  directory: 'search-outline',
};

/**
 * Professional directory screen with searchable list of
 * mental health professionals and resources.
 */
export function ProfessionalDirectoryScreen() {
  const { colors, fonts } = useTheme();
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
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
    >
      <Banner type="info" message={PROFESSIONAL_DISCLAIMER} icon="information-circle-outline" />

      <ChipGroup options={TYPE_FILTERS} selected={filter} onSelect={setFilter} />

      {filtered.map((prof, idx) => (
        <AnimatedCard key={prof.id} index={idx}>
          <Card style={styles.profCard}>
            <View style={styles.profHeader}>
              <View style={[styles.profIcon, { backgroundColor: `${colors.primary}12` }]}>
                <Ionicons
                  name={TYPE_ICONS[prof.type] || 'people-outline'}
                  size={22}
                  color={colors.primary}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[fonts.body, { color: colors.text, fontWeight: '600' }]}>
                  {prof.name}
                </Text>
                <Text style={[fonts.caption, { color: colors.primary }]}>{prof.specialty}</Text>
              </View>
            </View>

            <Text
              style={[
                fonts.bodySmall,
                { color: colors.textSecondary, lineHeight: 20, marginTop: 8 },
              ]}
            >
              {prof.description}
            </Text>

            <View style={styles.actions}>
              {prof.phone && (
                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: `${colors.success}12` }]}
                  onPress={() => handleCall(prof.phone)}
                >
                  <Ionicons name="call-outline" size={16} color={colors.success} />
                  <Text style={[fonts.caption, { color: colors.success, fontWeight: '600' }]}>
                    Call
                  </Text>
                </TouchableOpacity>
              )}
              {prof.website && (
                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: `${colors.accent}12` }]}
                  onPress={() => handleWebsite(prof.website)}
                >
                  <Ionicons name="globe-outline" size={16} color={colors.accent} />
                  <Text style={[fonts.caption, { color: colors.accent, fontWeight: '600' }]}>
                    Visit
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </Card>
        </AnimatedCard>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },
  profCard: { marginBottom: 12 },
  profHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  profIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actions: { flexDirection: 'row', gap: 10, marginTop: 12 },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
});
