import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import Constants from 'expo-constants';
import { Card } from '../components/Card';
import { Button } from '../components/Button';

const FAQ_ITEMS = [
  {
    question: 'How do I create a journal entry?',
    answer:
      "Navigate to the Journal tab and select your mood, energy level, and emotions. Write your thoughts in the text area and tap 'Save Journal Entry'. You can edit or delete today's entry at any time.",
  },
  {
    question: 'What does the AI chat do?',
    answer:
      'The AI wellness assistant provides supportive conversations about your mental health and well-being. It can offer coping strategies, mindfulness exercises, and a safe space to reflect on your feelings.',
  },
  {
    question: 'How do I view past journal entries?',
    answer:
      'Tap the calendar icon on the Journal screen to open the Mood Calendar. You can view your entries by month, week, or year. Tap on any day with a mood dot to view that entry.',
  },
  {
    question: 'Can I change my notification time?',
    answer:
      'Yes! Go to Profile > Notifications. Toggle daily tips on and use the time stepper to choose your preferred delivery time.',
  },
  {
    question: 'Is my data private?',
    answer:
      'Absolutely. Your journal entries and chat conversations are encrypted and only accessible to you. We do not sell or share your data with third parties. Visit Profile > Privacy for more details.',
  },
  {
    question: 'How do I change my password?',
    answer:
      "Go to Profile > Profile and use the Change Password form. You'll need your current password and a new password that's at least 8 characters long.",
  },
];

export function HelpSupportScreen() {
  const { colors, fonts } = useTheme();
  const [expandedIdx, setExpandedIdx] = useState(null);
  const appVersion = Constants.expoConfig?.version || Constants.manifest?.version || '1.0.0';

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
    >
      <Card style={{ marginBottom: 16 }}>
        <View style={styles.cardHeader}>
          <Ionicons name="help-buoy-outline" size={22} color={colors.primary} />
          <Text style={[fonts.heading3, { color: colors.text }]}>Frequently Asked Questions</Text>
        </View>

        {FAQ_ITEMS.map((item, idx) => (
          <TouchableOpacity
            key={idx}
            style={[
              styles.faqRow,
              { borderBottomColor: colors.border },
              idx === FAQ_ITEMS.length - 1 && { borderBottomWidth: 0 },
            ]}
            onPress={() => setExpandedIdx(expandedIdx === idx ? null : idx)}
            activeOpacity={0.7}
          >
            <View style={styles.faqHeader}>
              <Text
                style={[
                  fonts.body,
                  { color: colors.text, fontWeight: '600', flex: 1, marginRight: 8 },
                ]}
              >
                {item.question}
              </Text>
              <Ionicons
                name={expandedIdx === idx ? 'chevron-up' : 'chevron-down'}
                size={18}
                color={colors.textSecondary}
              />
            </View>
            {expandedIdx === idx && (
              <Text
                style={[
                  fonts.bodySmall,
                  { color: colors.textSecondary, lineHeight: 21, marginTop: 10 },
                ]}
              >
                {item.answer}
              </Text>
            )}
          </TouchableOpacity>
        ))}
      </Card>

      <Card style={{ marginBottom: 16 }}>
        <View style={styles.cardHeader}>
          <Ionicons name="mail-outline" size={22} color={colors.primary} />
          <Text style={[fonts.heading3, { color: colors.text }]}>Contact Support</Text>
        </View>
        <Text style={[fonts.bodySmall, { color: colors.textSecondary, marginBottom: 14 }]}>
          Having trouble or have a question not covered above?
        </Text>
        <Button
          title="Email Support"
          onPress={() => Linking.openURL('mailto:support@sakina.app?subject=Support%20Request')}
          icon={<Ionicons name="send-outline" size={18} color="#fff" />}
        />
      </Card>

      <Card>
        <View style={styles.cardHeader}>
          <Ionicons name="information-circle-outline" size={22} color={colors.primary} />
          <Text style={[fonts.heading3, { color: colors.text }]}>About</Text>
        </View>
        {[
          { label: 'App Version', value: appVersion },
          { label: 'Platform', value: 'Sakina Wellness' },
        ].map((row, idx, arr) => (
          <View
            key={row.label}
            style={[
              styles.infoRow,
              { borderBottomColor: colors.border },
              idx === arr.length - 1 && { borderBottomWidth: 0 },
            ]}
          >
            <Text style={[fonts.bodySmall, { color: colors.textSecondary }]}>{row.label}</Text>
            <Text style={[fonts.body, { color: colors.text, fontWeight: '600' }]}>{row.value}</Text>
          </View>
        ))}
      </Card>

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  faqRow: { paddingVertical: 14, borderBottomWidth: 1 },
  faqHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
});
