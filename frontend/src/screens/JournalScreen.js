import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
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
import { EMOTIONS } from "../constants/journal";
import { Card } from "../components/Card";
import { MoodSelector } from "../components/MoodSelector";
import { ChipGroup } from "../components/ChipGroup";
import { Input } from "../components/Input";
import { Button } from "../components/Button";
import { Banner } from "../components/Banner";
import { SectionHeader } from "../components/SectionHeader";
import { AnimatedCard } from "../components/AnimatedCard";
import { VoiceInputButton } from "../components/VoiceInputButton";
import { useVoiceInput } from "../hooks/useVoiceInput";

const ENERGY_LEVELS = [
  { id: 1, label: "Very\nLow" },
  { id: 2, label: "Low" },
  { id: 3, label: "Mid" },
  { id: 4, label: "High" },
  { id: 5, label: "Very\nHigh" },
];

export function JournalScreen({ navigation, route }) {
  const { colors, fonts } = useTheme();
  const voice = useVoiceInput();
  const [selectedMood, setSelectedMood] = useState(null);
  const [selectedEmotions, setSelectedEmotions] = useState([]);
  const [energyLevel, setEnergyLevel] = useState(3);
  const [journalText, setJournalText] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [existingEntry, setExistingEntry] = useState(null);
  const [prompt, setPrompt] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const todayStr = format(new Date(), "yyyy-MM-dd");
  const selectedDate = route.params?.selectedDate || todayStr;
  const preselectedMood = route.params?.preselectedMood;
  const isViewingPast = selectedDate !== todayStr;

  // Append voice transcript to journal text when recognition stops
  useEffect(() => {
    if (!voice.isListening && voice.transcript) {
      setJournalText((prev) => {
        const separator = prev.trim() ? " " : "";
        return prev + separator + voice.transcript;
      });
      voice.resetTranscript();
    }
  }, [voice.isListening, voice.transcript, voice.resetTranscript]);

  useEffect(() => {
    if (preselectedMood && !selectedMood) {
      setSelectedMood(preselectedMood);
    }
  }, [preselectedMood]);

  const loadEntry = useCallback(async () => {
    try {
      const result = await journalApi.getEntryByDate(selectedDate);
      if (!result.error && result.data) {
        setExistingEntry(result.data);
        setSelectedMood(result.data.mood);
        setSelectedEmotions(result.data.emotions || []);
        const rawEnergy = result.data.energyLevel || 5;
        setEnergyLevel(Math.ceil(rawEnergy / 2));
        setJournalText(result.data.content || "");
      } else if (result.status === 404 || !result.data) {
        setExistingEntry(null);
      } else {
        Alert.alert("Error", result.error || "Failed to load journal entry.");
        setExistingEntry(null);
      }
    } catch {
      Alert.alert("Error", "Could not connect to server. Please try again.");
      setExistingEntry(null);
    }
  }, [selectedDate]);

  const loadPrompt = useCallback(async () => {
    try {
      const result = await journalApi.getRandomPrompt();
      if (!result.error && result.data) setPrompt(result.data);
    } catch {
      // Prompts are optional
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([loadEntry(), loadPrompt()]);
      setLoading(false);
    };
    init();
  }, [loadEntry, loadPrompt]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadEntry(), loadPrompt()]);
    setRefreshing(false);
  };

  const resetForm = () => {
    setSelectedMood(null);
    setSelectedEmotions([]);
    setEnergyLevel(3);
    setJournalText("");
    setExistingEntry(null);
  };

  const handleSave = async () => {
    if (!selectedMood || !journalText.trim()) {
      Alert.alert("Incomplete Entry", "Please select a mood and write a journal entry to save.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        mood: selectedMood,
        emotions: selectedEmotions,
        energyLevel: energyLevel * 2,
        content: journalText.trim(),
        entryDate: selectedDate,
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
        Alert.alert("Saved", existingEntry ? "Journal entry updated!" : "Journal entry saved!");
      }
    } catch {
      Alert.alert("Error", "Failed to save journal entry. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    if (!existingEntry) return;
    Alert.alert("Delete Entry", "Are you sure you want to delete this journal entry?", [
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
    ]);
  };

  const isComplete = selectedMood && journalText.trim().length > 0;

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[fonts.body, { color: colors.textSecondary, marginTop: 12 }]}>Loading journal...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      keyboardDismissMode="on-drag"
      keyboardShouldPersistTaps="handled"
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.headerRow}>
        <View>
          <Text style={[fonts.heading1, { color: colors.text }]}>Mood Journal</Text>
          <Text style={[fonts.bodySmall, { color: colors.textSecondary, marginTop: 2 }]}>
            {format(new Date(selectedDate + "T00:00:00"), "EEEE, MMMM d, yyyy")}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.calBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => navigation.navigate("MoodCalendar")}
        >
          <Ionicons name="calendar-outline" size={22} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {isViewingPast && (
        <TouchableOpacity
          style={[styles.backBtn, { backgroundColor: `${colors.primary}12` }]}
          onPress={() => navigation.setParams({ selectedDate: undefined })}
        >
          <Ionicons name="arrow-back" size={16} color={colors.primary} />
          <Text style={[fonts.bodySmall, { color: colors.primary, fontWeight: "600" }]}>Back to Today</Text>
        </TouchableOpacity>
      )}

      {existingEntry && (
        <Banner
          variant="success"
          message={isViewingPast ? `Editing entry for ${format(new Date(selectedDate + "T00:00:00"), "MMMM d")}` : "Editing today's entry"}
        />
      )}

      {prompt && !existingEntry && (
        <Card style={{ marginBottom: 16 }}>
          <View style={styles.promptRow}>
            <Ionicons name="bulb-outline" size={20} color={colors.primary} />
            <Text style={[fonts.heading3, { color: colors.text }]}>Today's Prompt</Text>
          </View>
          <Text style={[fonts.body, { color: colors.text, fontStyle: "italic", lineHeight: 22, marginTop: 8 }]}>
            {prompt.content}
          </Text>
          <TouchableOpacity onPress={loadPrompt} style={styles.refreshPrompt}>
            <Ionicons name="refresh-outline" size={16} color={colors.primary} />
            <Text style={[fonts.bodySmall, { color: colors.primary, fontWeight: "500" }]}>New prompt</Text>
          </TouchableOpacity>
        </Card>
      )}

      {/* Mood */}
      <AnimatedCard index={0}>
        <Card style={{ marginBottom: 16 }}>
          <Text style={[fonts.heading3, { color: colors.text, marginBottom: 4 }]}>How are you feeling?</Text>
          <Text style={[fonts.bodySmall, { color: colors.textSecondary, marginBottom: 16 }]}>Select your overall mood</Text>
          <MoodSelector selected={selectedMood} onSelect={setSelectedMood} />
        </Card>
      </AnimatedCard>

      {/* Energy */}
      <AnimatedCard index={1}>
      <Card style={{ marginBottom: 16 }}>
        <View style={styles.promptRow}>
          <Ionicons name="flash" size={20} color={colors.primary} />
          <Text style={[fonts.heading3, { color: colors.text }]}>Energy Level</Text>
        </View>
        <Text style={[fonts.bodySmall, { color: colors.textSecondary, marginTop: 4, marginBottom: 14 }]}>
          How energized do you feel?
        </Text>
        <View style={styles.energyRow}>
          {ENERGY_LEVELS.map((level) => {
            const active = energyLevel === level.id;
            return (
              <TouchableOpacity
                key={level.id}
                style={[
                  styles.energyBtn,
                  {
                    backgroundColor: active ? colors.primary : colors.background,
                    borderColor: active ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => setEnergyLevel(level.id)}
              >
                <Text
                  style={[
                    fonts.caption,
                    { color: active ? "#fff" : colors.textSecondary, fontWeight: active ? "600" : "400", textAlign: "center" },
                  ]}
                >
                  {level.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </Card>
      </AnimatedCard>

      {/* Emotions */}
      <AnimatedCard index={2}>
      <Card style={{ marginBottom: 16 }}>
        <Text style={[fonts.heading3, { color: colors.text, marginBottom: 4 }]}>Emotions</Text>
        <Text style={[fonts.bodySmall, { color: colors.textSecondary, marginBottom: 14 }]}>Select all that apply</Text>
        <ChipGroup
          items={EMOTIONS}
          selected={selectedEmotions}
          onSelect={setSelectedEmotions}
          multiSelect
        />
      </Card>
      </AnimatedCard>

      {/* Journal Text */}
      <AnimatedCard index={3}>
      <Card style={{ marginBottom: 16 }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
          <Text style={[fonts.heading3, { color: colors.text }]}>Journal Entry</Text>
          {voice.isAvailable && (
            <VoiceInputButton
              isListening={voice.isListening}
              onPress={voice.isListening ? voice.stopListening : voice.startListening}
              disabled={saving}
            />
          )}
        </View>
        <Text style={[fonts.bodySmall, { color: colors.textSecondary, marginBottom: 14 }]}>
          {voice.isListening ? "Listening... tap mic to stop" : "What's on your mind?"}
        </Text>
        <Input
          value={journalText}
          onChangeText={setJournalText}
          placeholder="Write about your day, thoughts, feelings..."
          multiline
          style={{ marginBottom: 0 }}
        />
        <Text style={[fonts.caption, { color: colors.textLight, textAlign: "right", marginTop: 6 }]}>
          {journalText.length} characters
        </Text>
      </Card>
      </AnimatedCard>

      <Button
        title={existingEntry ? "Update Journal Entry" : "Save Journal Entry"}
        onPress={handleSave}
        loading={saving}
        disabled={!isComplete}
        icon={<Ionicons name="save-outline" size={20} color="#fff" />}
      />

      {existingEntry && (
        <Button
          variant="danger"
          title="Delete Entry"
          onPress={handleDelete}
          icon={<Ionicons name="trash-outline" size={18} color={colors.error} />}
          style={{ marginTop: 10 }}
        />
      )}

      {!isComplete && (
        <Text style={[fonts.bodySmall, { color: colors.textSecondary, textAlign: "center", marginTop: 12 }]}>
          Select a mood and write an entry to save
        </Text>
      )}

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  calBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    marginBottom: 14,
    alignSelf: "flex-start",
  },
  promptRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  refreshPrompt: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 10 },
  energyRow: { flexDirection: "row", gap: 8 },
  energyBtn: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 46,
  },
});
