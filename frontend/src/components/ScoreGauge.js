import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { getSeverityBand } from '../constants/assessments';

/**
 * Visual bar gauge showing the score position on a severity scale.
 *
 * @param {{ score: number, assessment: object }} props
 */
export function ScoreGauge({ score, assessment }) {
  const { fonts, colors } = useTheme();
  const band = getSeverityBand(assessment, score);
  const percentage = Math.min((score / assessment.maxScore) * 100, 100);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[fonts.heading1, { color: band.color, fontSize: 36 }]}>{score}</Text>
        <Text style={[fonts.bodySmall, { color: colors.textSecondary }]}>
          out of {assessment.maxScore}
        </Text>
      </View>

      <View style={[styles.trackOuter, { backgroundColor: colors.border }]}>
        <View
          style={[styles.trackFill, { width: `${percentage}%`, backgroundColor: band.color }]}
        />
      </View>

      <View style={styles.bandsRow}>
        {assessment.severityBands.map((b) => {
          const width = ((b.max - b.min + 1) / (assessment.maxScore + 1)) * 100;
          return (
            <View key={b.key} style={[styles.bandSegment, { width: `${width}%` }]}>
              <View style={[styles.bandDot, { backgroundColor: b.color }]} />
              <Text
                style={[
                  fonts.caption,
                  {
                    color: b.key === band.key ? b.color : colors.textLight,
                    fontWeight: b.key === band.key ? '700' : '400',
                    fontSize: 10,
                  },
                ]}
                numberOfLines={1}
              >
                {b.label}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', paddingVertical: 8 },
  header: { alignItems: 'center', marginBottom: 16 },
  trackOuter: {
    width: '100%',
    height: 10,
    borderRadius: 5,
    overflow: 'hidden',
  },
  trackFill: {
    height: '100%',
    borderRadius: 5,
  },
  bandsRow: {
    flexDirection: 'row',
    width: '100%',
    marginTop: 8,
  },
  bandSegment: { alignItems: 'center', gap: 2 },
  bandDot: { width: 6, height: 6, borderRadius: 3 },
});
