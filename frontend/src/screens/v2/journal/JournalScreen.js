/**
 * JournalScreen v2 — mood journal editor.
 *
 * Behavior preserved end-to-end:
 *   - journalApi.getEntryByDate / createEntry / updateEntry / deleteEntry / saveDraft
 *   - useAutoSave with 2s debounce, gated on isComplete + !isViewingPast
 *   - useFocusEffect refresh-on-return
 *   - voice transcript append to journalText
 *   - preselectedMood from route params still locks in the mood
 *   - selectedDate / isViewingPast banner + back-to-today affordance
 *   - Photo attachment kept (legacy PhotoAttachment retained)
 *
 * Visual rewrite: ScreenScaffold w/ subtle aurora, v2 Cards, Phosphor icons,
 * MoodPicker / EnergyScale / EmotionChips extracted, autoSave indicator
 * uses Skia Blob.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, View } from 'react-native';
import { format } from 'date-fns';
import { useFocusEffect } from '@react-navigation/native';
import {
  CalendarBlank,
  ArrowLeft,
  Lightbulb,
  ArrowsClockwise,
  Lightning,
  CheckCircle,
  FloppyDisk,
  Trash,
  Camera,
} from 'phosphor-react-native';
import { journalApi } from '../../../services/journalApi';
import { useToast } from '../../../context/ToastContext';
import { useVoiceInput } from '../../../hooks/useVoiceInput';
import { useAutoSave } from '../../../hooks/useAutoSave';
import { EMOTIONS } from '../../../constants/journal';
import { PhotoAttachment } from '../../../components/PhotoAttachment';
import { VoiceInputButton } from '../../../components/VoiceInputButton';
import { useV2Theme } from '../../../theme/v2';
import {
  Button,
  Card,
  Input,
  IconButton,
  ScreenScaffold,
  ScreenHeader,
  Surface,
  Text,
  LoadingState,
  Blob,
  ParticleBloom,
} from '../../../ui/v2';
import { MoodPicker } from './MoodPicker';
import { EnergyScale } from './EnergyScale';
import { EmotionChips } from './EmotionChips';

export function JournalScreen({ navigation, route }) {
  const v2 = useV2Theme();
  const { showToast } = useToast();
  const voice = useVoiceInput();

  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const selectedDate = route?.params?.selectedDate || todayStr;
  const preselectedMood = route?.params?.preselectedMood;
  const preselectedTs = route?.params?._ts;
  const isViewingPast = selectedDate !== todayStr;

  const [selectedMood, setSelectedMood] = useState(null);
  const [selectedEmotions, setSelectedEmotions] = useState([]);
  const [energyLevel, setEnergyLevel] = useState(3);
  const [journalText, setJournalText] = useState('');
  const [photos, setPhotos] = useState([]);
  const [existingEntry, setExistingEntry] = useState(null);
  const [prompt, setPrompt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const bloomRef = useRef(null);

  // Voice transcript append
  useEffect(() => {
    if (!voice.isListening && voice.transcript) {
      setJournalText((prev) => {
        const sep = prev.trim() ? ' ' : '';
        return prev + sep + voice.transcript;
      });
      voice.resetTranscript();
    }
  }, [voice.isListening, voice.transcript, voice.resetTranscript, voice]);

  // Preselected mood from Home flow
  useEffect(() => {
    if (preselectedMood) setSelectedMood(preselectedMood);
  }, [preselectedMood, preselectedTs]);

  const loadEntry = useCallback(async () => {
    try {
      const result = await journalApi.getEntryByDate(selectedDate);
      if (!result.error && result.data) {
        setExistingEntry(result.data);
        setSelectedMood(result.data.mood);
        setSelectedEmotions(result.data.emotions || []);
        const rawEnergy = result.data.energyLevel || 5;
        setEnergyLevel(Math.ceil(rawEnergy / 2));
        setJournalText(result.data.content || '');
      } else if (result.status === 404 || !result.data) {
        setExistingEntry(null);
      } else {
        showToast({ message: result.error || 'Failed to load journal entry.', variant: 'error' });
        setExistingEntry(null);
      }
    } catch {
      showToast({ message: 'Could not connect to server. Please try again.', variant: 'error' });
      setExistingEntry(null);
    }
  }, [selectedDate, showToast]);

  const loadPrompt = useCallback(async () => {
    try {
      const result = await journalApi.getRandomPrompt();
      if (!result.error && result.data) setPrompt(result.data);
    } catch {
      // Prompts are optional.
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      await Promise.all([loadEntry(), loadPrompt()]);
      if (mounted) setLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, [loadEntry, loadPrompt]);

  const hasMountedFocusRef = useRef(false);
  useFocusEffect(
    useCallback(() => {
      if (!hasMountedFocusRef.current) {
        hasMountedFocusRef.current = true;
        return undefined;
      }
      loadEntry();
      return undefined;
    }, [loadEntry])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([loadEntry(), loadPrompt()]);
    setRefreshing(false);
  }, [loadEntry, loadPrompt]);

  const isComplete = !!selectedMood && journalText.trim().length > 0;

  const autoSaveValue = useMemo(
    () => ({
      mood: selectedMood,
      emotions: selectedEmotions,
      energyLevel: energyLevel * 2,
      content: journalText.trim(),
      entryDate: selectedDate,
    }),
    [selectedMood, selectedEmotions, energyLevel, journalText, selectedDate]
  );

  const handleAutoSave = useCallback(
    async (payload) => {
      if (!payload.mood || !payload.content) return undefined;
      const result = await journalApi.saveDraft(existingEntry?.id || null, payload);
      if (!result.error && result.data) setExistingEntry(result.data);
      return result;
    },
    [existingEntry?.id]
  );

  const autoSave = useAutoSave({
    value: autoSaveValue,
    delay: 2000,
    onSave: handleAutoSave,
    enabled: isComplete && !isViewingPast && !loading && !saving,
  });

  const handleSave = useCallback(async () => {
    if (!isComplete) {
      showToast({
        message: 'Please select a mood and write an entry to save.',
        variant: 'warning',
      });
      return;
    }
    setSaving(true);
    setSaveError(null);
    try {
      const payload = autoSaveValue;
      const result = existingEntry
        ? await journalApi.updateEntry(existingEntry.id, payload)
        : await journalApi.createEntry(payload);
      if (result.error) {
        setSaveError(result.error || 'Failed to save. Tap Retry to try again.');
      } else {
        setExistingEntry(result.data);
        bloomRef.current?.bloom({ x: 200, y: 400, count: 18 });
        showToast({
          message: existingEntry ? 'Journal entry updated' : 'Journal entry saved',
          variant: 'success',
        });
      }
    } catch {
      setSaveError('Failed to save journal entry.');
    } finally {
      setSaving(false);
    }
  }, [autoSaveValue, existingEntry, isComplete, showToast]);

  const handleDelete = useCallback(() => {
    if (!existingEntry) return;
    Alert.alert('Delete entry', 'Are you sure you want to delete this journal entry?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            const result = await journalApi.deleteEntry(existingEntry.id);
            if (!result.error) {
              setSelectedMood(null);
              setSelectedEmotions([]);
              setEnergyLevel(3);
              setJournalText('');
              setExistingEntry(null);
              setPhotos([]);
              showToast({ message: 'Journal entry deleted.', variant: 'success' });
            } else {
              showToast({ message: result.error, variant: 'error' });
            }
          } catch {
            showToast({ message: 'Failed to delete entry.', variant: 'error' });
          }
        },
      },
    ]);
  }, [existingEntry, showToast]);

  if (loading) {
    return (
      <ScreenScaffold ambient ambientIntensity="subtle" paddingBottom="tabBar">
        <LoadingState caption="Opening your journal" />
      </ScreenScaffold>
    );
  }

  return (
    <ScreenScaffold
      ambient
      ambientIntensity="subtle"
      keyboardAware
      paddingBottom="tabBar"
      refreshControl={{ refreshing, onRefresh }}
      bottomAccessory={<ParticleBloom ref={bloomRef} />}
    >
      <ScreenHeader
        title="Journal"
        subtitle={format(new Date(`${selectedDate}T00:00:00`), 'EEEE, MMMM d, yyyy')}
        right={
          <IconButton
            icon={CalendarBlank}
            accessibilityLabel="Open mood calendar"
            variant="solid"
            onPress={() => navigation.navigate('MoodCalendar')}
          />
        }
      />

      {isViewingPast ? (
        <View style={{ marginTop: v2.spacing[2], marginBottom: v2.spacing[3] }}>
          <Button
            variant="ghost"
            size="sm"
            leadingIcon={ArrowLeft}
            onPress={() => navigation.setParams({ selectedDate: undefined })}
          >
            Back to today
          </Button>
        </View>
      ) : null}

      {existingEntry ? (
        <Surface
          elevation="raised"
          padding={3}
          style={{ marginBottom: v2.spacing[3], flexDirection: 'row', alignItems: 'center', gap: v2.spacing[2] }}
        >
          <CheckCircle size={18} color={v2.palette.success} weight="fill" />
          <Text variant="body-sm" color="secondary" style={{ flex: 1 }}>
            {isViewingPast
              ? `Editing entry for ${format(new Date(`${selectedDate}T00:00:00`), 'MMMM d')}`
              : 'Editing today’s entry'}
          </Text>
        </Surface>
      ) : null}

      {prompt && !existingEntry ? (
        <Card padding={4} style={{ marginBottom: v2.spacing[3] }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: v2.spacing[2] }}>
            <Lightbulb size={20} color={v2.palette.warning} weight="duotone" />
            <Text variant="h3">Today’s prompt</Text>
          </View>
          <Text
            variant="body"
            color="secondary"
            style={{ marginTop: v2.spacing[2], fontStyle: 'italic' }}
          >
            “{prompt.content}”
          </Text>
          <View style={{ marginTop: v2.spacing[3] }}>
            <Button variant="ghost" size="sm" leadingIcon={ArrowsClockwise} onPress={loadPrompt}>
              New prompt
            </Button>
          </View>
        </Card>
      ) : null}

      <View style={{ gap: v2.spacing[3] }}>
        {/* Mood */}
        <Card padding={4}>
          <Text variant="h3">How are you feeling?</Text>
          <Text variant="body-sm" color="secondary" style={{ marginTop: 4 }}>
            Select your overall mood.
          </Text>
          <View style={{ marginTop: v2.spacing[4] }}>
            <MoodPicker value={selectedMood} onChange={setSelectedMood} />
          </View>
        </Card>

        {/* Energy */}
        <Card padding={4}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: v2.spacing[2] }}>
            <Lightning size={20} color={v2.palette.primary} weight="duotone" />
            <Text variant="h3">Energy</Text>
          </View>
          <Text variant="body-sm" color="secondary" style={{ marginTop: 4 }}>
            How energised do you feel?
          </Text>
          <View style={{ marginTop: v2.spacing[4] }}>
            <EnergyScale value={energyLevel} onChange={setEnergyLevel} />
          </View>
        </Card>

        {/* Emotions */}
        <Card padding={4}>
          <Text variant="h3">Emotions</Text>
          <Text variant="body-sm" color="secondary" style={{ marginTop: 4 }}>
            Select any that apply.
          </Text>
          <View style={{ marginTop: v2.spacing[4] }}>
            <EmotionChips
              options={EMOTIONS}
              selected={selectedEmotions}
              onChange={setSelectedEmotions}
            />
          </View>
        </Card>

        {/* Journal text */}
        <Card padding={4}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Text variant="h3">Journal entry</Text>
            {voice.isAvailable ? (
              <VoiceInputButton
                isListening={voice.isListening}
                onPress={voice.isListening ? voice.stopListening : voice.startListening}
                disabled={saving}
              />
            ) : null}
          </View>
          <Text variant="body-sm" color="secondary" style={{ marginTop: 4 }}>
            {voice.isListening ? 'Listening… tap mic to stop.' : 'What’s on your mind?'}
          </Text>
          <View style={{ marginTop: v2.spacing[3] }}>
            <Input
              label="Reflection"
              value={journalText}
              onChangeText={setJournalText}
              multiline
              placeholder="Write about your day, thoughts, feelings…"
            />
          </View>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginTop: -v2.spacing[1],
            }}
          >
            <Text variant="caption" color="tertiary">
              {wordCount(journalText)} words
            </Text>
            <AutoSaveIndicator state={autoSave} v2={v2} />
          </View>
        </Card>

        {/* Photos */}
        <Card padding={4}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: v2.spacing[2] }}>
            <Camera size={20} color={v2.palette.primary} weight="duotone" />
            <Text variant="h3">Photos</Text>
          </View>
          <Text variant="body-sm" color="secondary" style={{ marginTop: 4 }}>
            Attach up to 3 photos to your entry.
          </Text>
          <View style={{ marginTop: v2.spacing[3] }}>
            <PhotoAttachment
              photos={photos}
              onPhotosChange={setPhotos}
              maxPhotos={3}
              disabled={saving}
            />
          </View>
        </Card>
      </View>

      {saveError ? (
        <Surface
          elevation="raised"
          padding={3}
          style={{
            marginTop: v2.spacing[4],
            borderColor: v2.palette.error,
            flexDirection: 'row',
            alignItems: 'center',
            gap: v2.spacing[2],
          }}
        >
          <Text variant="body-sm" color="error" style={{ flex: 1 }}>
            {saveError}
          </Text>
          <Button variant="secondary" size="sm" onPress={handleSave}>
            Retry
          </Button>
        </Surface>
      ) : null}

      <View style={{ gap: v2.spacing[2], marginTop: v2.spacing[5] }}>
        <Button
          variant="primary"
          size="lg"
          fullWidth
          loading={saving}
          disabled={!isComplete}
          leadingIcon={FloppyDisk}
          onPress={handleSave}
        >
          {existingEntry ? 'Update entry' : 'Save entry'}
        </Button>
        {existingEntry ? (
          <Button
            variant="ghost"
            size="md"
            leadingIcon={Trash}
            onPress={handleDelete}
            haptic="warn"
          >
            Delete entry
          </Button>
        ) : null}
        {!isComplete ? (
          <Text
            variant="body-sm"
            color="tertiary"
            align="center"
            style={{ marginTop: v2.spacing[1] }}
          >
            Select a mood and write an entry to save.
          </Text>
        ) : null}
      </View>
    </ScreenScaffold>
  );
}

function wordCount(text) {
  if (!text) return 0;
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}

function AutoSaveIndicator({ state, v2 }) {
  if (state.isSaving) {
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <Blob size={12} />
        <Text variant="caption" color="tertiary">
          Saving…
        </Text>
      </View>
    );
  }
  if (state.error) {
    return (
      <Text variant="caption" color="error">
        Save failed
      </Text>
    );
  }
  if (state.lastSavedAt) {
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <CheckCircle size={12} color={v2.palette.success} weight="fill" />
        <Text variant="caption" color="tertiary">
          Auto-saved
        </Text>
      </View>
    );
  }
  return null;
}

export default JournalScreen;
