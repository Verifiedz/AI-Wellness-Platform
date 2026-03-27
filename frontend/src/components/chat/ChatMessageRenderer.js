import React from "react";
import { View } from "react-native";
import Markdown from "react-native-markdown-display";
import {
  MOOD_CHECK_MARKER,
  MARKER_REGEX,
  getExerciseType,
} from "../../constants/exerciseMarkers";
import { MoodQuickReply } from "./MoodQuickReply";
import { ExerciseCard } from "./ExerciseCard";

/**
 * Parses an assistant message into segments of plain text and interactive
 * markers, then renders each segment with the appropriate component.
 *
 * Plain text segments are rendered with react-native-markdown-display.
 * [MOOD_CHECK] segments render MoodQuickReply.
 * [EXERCISE:*] segments render ExerciseCard.
 */
export function ChatMessageRenderer({
  message,
  markdownStyles,
  onMoodSelect,
  selectedMood,
  moodDisabled,
  onStartBreathing,
}) {
  // Split message by markers, keeping the markers in the result array
  const segments = message.split(MARKER_REGEX).filter(Boolean);

  // If no markers found, render plain markdown
  if (segments.length === 1 && !MARKER_REGEX.test(segments[0])) {
    return <Markdown style={markdownStyles}>{message}</Markdown>;
  }

  return (
    <View>
      {segments.map((segment, index) => {
        // Mood check marker
        if (segment === MOOD_CHECK_MARKER) {
          return (
            <MoodQuickReply
              key={`mood-${index}`}
              onMoodSelect={onMoodSelect}
              selectedMood={selectedMood}
              disabled={moodDisabled}
            />
          );
        }

        // Exercise markers
        const exerciseType = getExerciseType(segment);
        if (exerciseType) {
          return (
            <ExerciseCard
              key={`exercise-${index}`}
              exerciseType={exerciseType}
              onStartBreathing={onStartBreathing}
            />
          );
        }

        // Plain text segment — render as markdown
        const trimmed = segment.trim();
        if (!trimmed) return null;

        return (
          <Markdown key={`text-${index}`} style={markdownStyles}>
            {trimmed}
          </Markdown>
        );
      })}
    </View>
  );
}
