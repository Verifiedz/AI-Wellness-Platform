import React, { useMemo } from "react";
import { Text, StyleSheet } from "react-native";
import { useTheme } from "../context/ThemeContext";

/**
 * Displays "X words | Y characters" for a given text string.
 *
 * @param {{ text: string, style?: object }} props
 */
export function WordCount({ text, style }) {
  const { colors, fonts } = useTheme();

  const { words, characters } = useMemo(() => {
    const trimmed = (text || "").trim();
    const wordCount = trimmed.length === 0
      ? 0
      : trimmed.split(/\s+/).length;
    return { words: wordCount, characters: (text || "").length };
  }, [text]);

  return (
    <Text
      style={[
        fonts.caption,
        styles.base,
        { color: colors.textLight },
        style,
      ]}
    >
      {words} {words === 1 ? "word" : "words"} | {characters} {characters === 1 ? "character" : "characters"}
    </Text>
  );
}

const styles = StyleSheet.create({
  base: {
    textAlign: "right",
    marginTop: 6,
  },
});
