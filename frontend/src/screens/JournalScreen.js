import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { format } from "date-fns";
import { useTheme } from "../context/ThemeContext";
import { journalApi } from "../services/journalApi";
import { MOODS, EMOTIONS } from "../constants/journal";

export function JournalScreen({ navigation }) {
  const { colors } = useTheme();
  const Colors = colors;
  const styles = createStyles(Colors);
  const [selectedMood, setSelectedMood] = useState(null);
  const [selectedEmotions, setSelectedEmotions] = useState([]);
  const [energyLevel, setEnergyLevel] = useState(5);
  const [journalText, setJournalText] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [existingEntry, setExistingEntry] = useState(null);
  const [prompt, setPrompt] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const todayStr = format(new Date(), "yyyy-MM-dd");

  const loadTodayEntry = useCallback(async () => {
    try {
      const result = await journalApi.getEntryByDate(todayStr);
      if (!result.error && result.data) {
        setExistingEntry(result.data);
        setSelectedMood(result.data.mood);
        setSelectedEmotions(result.data.emotions || []);
        setEnergyLevel(result.data.energyLevel || 5);
        setJournalText(result.data.content || "");
      } else {
        setExistingEntry(null);
      }
    } catch {
      // No entry for today - that's fine
    }
  }, [todayStr]);

  const loadPrompt = useCallback(async () => {
    try {
      const result = await journalApi.getRandomPrompt();
      if (!result.error && result.data) {
        setPrompt(result.data);
      }
    } catch {
      // Prompts are optional
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([loadTodayEntry(), loadPrompt()]);
      setLoading(false);
    };
    init();
  }, [loadTodayEntry, loadPrompt]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadTodayEntry(), loadPrompt()]);
    setRefreshing(false);
  };

  const toggleEmotion = (emotion) => {
    setSelectedEmotions((prev) =>
      prev.includes(emotion)
        ? prev.filter((e) => e !== emotion)
        : [...prev, emotion]
    );
  };

  const resetForm = () => {
    setSelectedMood(null);
    setSelectedEmotions([]);
    setEnergyLevel(5);
    setJournalText("");
    setExistingEntry(null);
  };

  const handleSave = async () => {
    if (!selectedMood || !journalText.trim()) {
      Alert.alert(
        "Incomplete Entry",
        "Please select a mood and write a journal entry to save."
      );
      return;
    }

    setSaving(true);
    try {
      const payload = {
        mood: selectedMood,
        emotions: selectedEmotions,
        energyLevel,
        content: journalText.trim(),
        entryDate: todayStr,
      };

      let result;
      if (existingEntry) {
        result = await journalApi.updateEntry(existingEntry.id, payload);
      } else {
        result = await journalApi.createEntry(payload);
      }

      if (result.error) {
        Alert.alert("Error", result.error);
      } else {
        setExistingEntry(result.data);
        Alert.alert(
          "Saved",
          existingEntry
            ? "Journal entry updated successfully!"
            : "Journal entry saved successfully!"
        );
      }
    } catch {
      Alert.alert("Error", "Failed to save journal entry. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    if (!existingEntry) return;

    Alert.alert(
      "Delete Entry",
      "Are you sure you want to delete today's journal entry?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const result = await journalApi.deleteEntry(existingEntry.id);
              if (!result.error) {
                resetForm();
                Alert.alert("Deleted", "Journal entry deleted.");
              } else {
                Alert.alert("Error", result.error);
              }
            } catch {
              Alert.alert("Error", "Failed to delete entry.");
            }
          },
        },
      ]
    );
  };

  const isComplete = selectedMood && journalText.trim().length > 0;

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading journal...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="heart" size={24} color={Colors.primary} />
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>Mood Journal</Text>
            <Text style={styles.headerSubtitle}>Reflect on your day</Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.calendarButton}
          onPress={() => navigation.navigate("MoodCalendar")}
        >
          <Ionicons name="calendar-outline" size={22} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.dateRow}>
        <Ionicons
          name="calendar"
          size={16}
          color={Colors.textSecondary}
        />
        <Text style={styles.dateText}>
          {format(new Date(), "EEEE, MMMM d, yyyy")}
        </Text>
      </View>

      {existingEntry && (
        <View style={styles.existingBanner}>
          <Ionicons name="checkmark-circle" size={18} color={Colors.success} />
          <Text style={styles.existingText}>
            Editing today's entry
          </Text>
        </View>
      )}

      {/* Prompt Card */}
      {prompt && !existingEntry && (
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="bulb-outline" size={20} color={Colors.primary} />
            <Text style={styles.cardTitle}>Today's Prompt</Text>
          </View>
          <Text style={styles.promptText}>{prompt.content}</Text>
          <TouchableOpacity onPress={loadPrompt} style={styles.newPromptBtn}>
            <Ionicons
              name="refresh-outline"
              size={16}
              color={Colors.primary}
            />
            <Text style={styles.newPromptText}>New prompt</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Mood Selection */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>How are you feeling?</Text>
        </View>
        <Text style={styles.cardDescription}>
          Select your overall mood today
        </Text>
        <View style={styles.moodRow}>
          {MOODS.map((mood) => {
            const isSelected = selectedMood === mood.id;
            return (
              <TouchableOpacity
                key={mood.id}
                style={[
                  styles.moodButton,
                  isSelected && { backgroundColor: mood.color },
                  !isSelected && { borderColor: mood.color, borderWidth: 1.5 },
                ]}
                onPress={() => setSelectedMood(mood.id)}
              >
                <Ionicons
                  name={mood.icon}
                  size={22}
                  color={isSelected ? "#fff" : mood.color}
                />
                <Text
                  style={[
                    styles.moodLabel,
                    isSelected && styles.moodLabelSelected,
                    !isSelected && { color: mood.color },
                  ]}
                >
                  {mood.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Energy Level */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="flash" size={20} color={Colors.primary} />
          <Text style={styles.cardTitle}>Energy Level</Text>
        </View>
        <Text style={styles.cardDescription}>
          How energized do you feel? (1-10)
        </Text>
        <View style={styles.energyRow}>
          {Array.from({ length: 10 }, (_, i) => i + 1).map((level) => {
            const isSelected = energyLevel === level;
            return (
              <TouchableOpacity
                key={level}
                style={[
                  styles.energyDot,
                  isSelected && styles.energyDotSelected,
                ]}
                onPress={() => setEnergyLevel(level)}
              >
                <Text
                  style={[
                    styles.energyDotText,
                    isSelected && styles.energyDotTextSelected,
                  ]}
                >
                  {level}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
        <View style={styles.energyLabels}>
          <Text style={styles.energyLabelText}>Low</Text>
          <Text style={styles.energyValue}>{energyLevel}/10</Text>
          <Text style={styles.energyLabelText}>High</Text>
        </View>
      </View>

      {/* Emotions */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>What emotions are you experiencing?</Text>
        </View>
        <Text style={styles.cardDescription}>Select all that apply</Text>
        <View style={styles.emotionWrap}>
          {EMOTIONS.map((emotion) => {
            const isSelected = selectedEmotions.includes(emotion);
            return (
              <TouchableOpacity
                key={emotion}
                style={[
                  styles.emotionChip,
                  isSelected && styles.emotionChipSelected,
                ]}
                onPress={() => toggleEmotion(emotion)}
              >
                <Text
                  style={[
                    styles.emotionChipText,
                    isSelected && styles.emotionChipTextSelected,
                  ]}
                >
                  {emotion}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Journal Entry */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Journal Entry</Text>
        </View>
        <Text style={styles.cardDescription}>
          What's on your mind today?
        </Text>
        <TextInput
          style={styles.textArea}
          placeholder="Write about your day, thoughts, feelings, or anything that's important to you..."
          placeholderTextColor={Colors.textLight}
          value={journalText}
          onChangeText={setJournalText}
          multiline
          textAlignVertical="top"
        />
        <Text style={styles.charCount}>{journalText.length} characters</Text>
      </View>

      {/* Save Button */}
      <TouchableOpacity
        style={[styles.saveButton, !isComplete && styles.saveButtonDisabled]}
        onPress={handleSave}
        disabled={!isComplete || saving}
      >
        {saving ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <>
            <Ionicons name="save-outline" size={20} color="#fff" />
            <Text style={styles.saveButtonText}>
              {existingEntry ? "Update Journal Entry" : "Save Journal Entry"}
            </Text>
          </>
        )}
      </TouchableOpacity>

      {/* Delete Button */}
      {existingEntry && (
        <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
          <Ionicons name="trash-outline" size={18} color={Colors.error} />
          <Text style={styles.deleteButtonText}>Delete Entry</Text>
        </TouchableOpacity>
      )}

      {!isComplete && (
        <Text style={styles.hint}>
          Please select a mood and write a journal entry to save
        </Text>
      )}

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const createStyles = (Colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.background,
  },
  loadingText: {
    marginTop: 12,
    color: Colors.textSecondary,
    fontSize: 15,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  headerTextContainer: {
    gap: 2,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: Colors.text,
  },
  headerSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  calendarButton: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    justifyContent: "center",
    alignItems: "center",
  },

  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 16,
    marginTop: 4,
  },
  dateText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },

  existingBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#E8F8F5",
    padding: 12,
    borderRadius: 10,
    marginBottom: 14,
  },
  existingText: {
    color: Colors.success,
    fontSize: 14,
    fontWeight: "600",
  },

  card: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.text,
  },
  cardDescription: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 14,
  },

  promptText: {
    fontSize: 15,
    color: Colors.text,
    fontStyle: "italic",
    lineHeight: 22,
    marginBottom: 10,
  },
  newPromptBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  newPromptText: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: "500",
  },

  moodRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 6,
  },
  moodButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    gap: 4,
  },
  moodLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  moodLabelSelected: {
    color: "#fff",
  },

  energyRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 4,
    marginBottom: 10,
  },
  energyDot: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    justifyContent: "center",
    alignItems: "center",
  },
  energyDotSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  energyDotText: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  energyDotTextSelected: {
    color: "#fff",
  },
  energyLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  energyLabelText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  energyValue: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.text,
  },

  emotionWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  emotionChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
  },
  emotionChipSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  emotionChipText: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: "500",
  },
  emotionChipTextSelected: {
    color: "#fff",
  },

  textArea: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    padding: 14,
    fontSize: 15,
    color: Colors.text,
    minHeight: 130,
    backgroundColor: Colors.background,
    lineHeight: 22,
  },
  charCount: {
    textAlign: "right",
    fontSize: 12,
    color: Colors.textLight,
    marginTop: 6,
  },

  saveButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 14,
    gap: 8,
    marginBottom: 10,
  },
  saveButtonDisabled: {
    backgroundColor: Colors.disabled,
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },

  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    gap: 6,
    marginBottom: 4,
  },
  deleteButtonText: {
    color: Colors.error,
    fontSize: 14,
    fontWeight: "500",
  },

  hint: {
    textAlign: "center",
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 4,
  },
});
