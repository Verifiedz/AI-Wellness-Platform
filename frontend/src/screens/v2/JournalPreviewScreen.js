/**
 * Wave D.5 verification — composes the journal sub-components with fixture
 * data. Mounted at /?journalpreview=1&screen=editor|calendar|calendar-week|calendar-year
 *
 * Note: previews the visible UI. The real screens use journalApi + voice +
 * autoSave + photos + ToastContext, which require the full provider tree.
 */

import React, { useMemo, useState } from 'react';
import { Platform, Pressable, View } from 'react-native';
import { format } from 'date-fns';
import { useV2Theme } from '../../theme/v2';
import { useTheme } from '../../context/ThemeContext';
import {
  Card,
  Chip,
  IconButton,
  ScreenHeader,
  ScreenScaffold,
  Surface,
  Text,
  Button,
} from '../../ui/v2';
import {
  CalendarBlank,
  Lightbulb,
  ArrowsClockwise,
  Lightning,
  Camera,
  CheckCircle,
  FloppyDisk,
  CaretLeft,
  CaretRight,
  ChartBar,
} from 'phosphor-react-native';
import { MoodPicker } from './journal/MoodPicker';
import { EnergyScale } from './journal/EnergyScale';
import { EmotionChips } from './journal/EmotionChips';
import { MOOD_TOKENS } from './home/moodTokens';

const SCREENS = {
  editor: 'Editor',
  calendar: 'Month',
  'calendar-week': 'Week',
  'calendar-year': 'Year',
};

const FIXTURE_EMOTIONS = ['Calm', 'Hopeful', 'Tender', 'Grateful', 'Tired'];

function getInitial() {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return 'editor';
  const params = new URLSearchParams(window.location.search);
  return params.get('screen') || 'editor';
}

export function JournalPreviewScreen() {
  const v2 = useV2Theme();
  const { isDarkMode, toggleDarkMode } = useTheme();
  const [screen, setScreen] = useState(getInitial);
  const [mood, setMood] = useState('good');
  const [energy, setEnergy] = useState(3);
  const [emotions, setEmotions] = useState(['Calm', 'Grateful']);
  const [text, setText] = useState('Today felt steadier than yesterday. The morning was quiet.');

  return (
    <View style={{ flex: 1, backgroundColor: v2.palette.bg.base }}>
      {screen === 'editor' ? (
        <EditorPreview
          v2={v2}
          mood={mood}
          setMood={setMood}
          energy={energy}
          setEnergy={setEnergy}
          emotions={emotions}
          setEmotions={setEmotions}
          text={text}
          setText={setText}
        />
      ) : (
        <CalendarPreview v2={v2} mode={screen} />
      )}

      {/* Floating dev switcher */}
      <View
        pointerEvents="box-none"
        style={{ position: 'absolute', top: 12, left: 12, right: 12, alignItems: 'center' }}
      >
        <View
          style={{
            flexDirection: 'row',
            gap: 6,
            backgroundColor: v2.palette.bg.elevated,
            borderColor: v2.palette.border.subtle,
            borderWidth: 1,
            borderRadius: v2.radius.full,
            paddingHorizontal: 6,
            paddingVertical: 4,
          }}
        >
          {Object.entries(SCREENS).map(([k, label]) => {
            const active = k === screen;
            return (
              <Pressable
                key={k}
                onPress={() => setScreen(k)}
                accessibilityRole="button"
                accessibilityLabel={`Show ${label}`}
                accessibilityState={{ selected: active }}
                style={{
                  paddingHorizontal: 10,
                  paddingVertical: 6,
                  borderRadius: 999,
                  backgroundColor: active ? v2.palette.primary : 'transparent',
                }}
              >
                <Text
                  variant="label"
                  style={{
                    color: active ? v2.palette.text.onPrimary : v2.palette.text.secondary,
                  }}
                >
                  {label}
                </Text>
              </Pressable>
            );
          })}
          <Pressable
            onPress={toggleDarkMode}
            accessibilityRole="button"
            accessibilityLabel="Toggle theme"
            style={{
              paddingHorizontal: 10,
              paddingVertical: 6,
              borderRadius: 999,
              backgroundColor: v2.palette.bg.surface,
            }}
          >
            <Text variant="label">{isDarkMode ? 'DARK' : 'LIGHT'}</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function EditorPreview({ v2, mood, setMood, energy, setEnergy, emotions, setEmotions, text }) {
  return (
    <ScreenScaffold ambient ambientIntensity="subtle">
      <ScreenHeader
        title="Journal"
        subtitle={format(new Date(), 'EEEE, MMMM d, yyyy')}
        right={
          <IconButton
            icon={CalendarBlank}
            accessibilityLabel="Open mood calendar"
            variant="solid"
            onPress={() => {}}
          />
        }
      />

      <Surface
        elevation="raised"
        padding={3}
        style={{
          marginBottom: v2.spacing[3],
          marginTop: v2.spacing[2],
          flexDirection: 'row',
          alignItems: 'center',
          gap: v2.spacing[2],
        }}
      >
        <CheckCircle size={18} color={v2.palette.success} weight="fill" />
        <Text variant="body-sm" color="secondary" style={{ flex: 1 }}>
          Editing today’s entry
        </Text>
      </Surface>

      <Card padding={4} style={{ marginBottom: v2.spacing[3] }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: v2.spacing[2] }}>
          <Lightbulb size={20} color={v2.palette.warning} weight="duotone" />
          <Text variant="h3">Today’s prompt</Text>
        </View>
        <Text variant="body" color="secondary" style={{ marginTop: v2.spacing[2], fontStyle: 'italic' }}>
          “What is one thing you would tell yesterday-you, with kindness?”
        </Text>
        <View style={{ marginTop: v2.spacing[3] }}>
          <Button variant="ghost" size="sm" leadingIcon={ArrowsClockwise} onPress={() => {}}>
            New prompt
          </Button>
        </View>
      </Card>

      <View style={{ gap: v2.spacing[3] }}>
        <Card padding={4}>
          <Text variant="h3">How are you feeling?</Text>
          <Text variant="body-sm" color="secondary" style={{ marginTop: 4 }}>
            Select your overall mood.
          </Text>
          <View style={{ marginTop: v2.spacing[4] }}>
            <MoodPicker value={mood} onChange={setMood} />
          </View>
        </Card>

        <Card padding={4}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: v2.spacing[2] }}>
            <Lightning size={20} color={v2.palette.primary} weight="duotone" />
            <Text variant="h3">Energy</Text>
          </View>
          <Text variant="body-sm" color="secondary" style={{ marginTop: 4 }}>
            How energised do you feel?
          </Text>
          <View style={{ marginTop: v2.spacing[4] }}>
            <EnergyScale value={energy} onChange={setEnergy} />
          </View>
        </Card>

        <Card padding={4}>
          <Text variant="h3">Emotions</Text>
          <Text variant="body-sm" color="secondary" style={{ marginTop: 4 }}>
            Select any that apply.
          </Text>
          <View style={{ marginTop: v2.spacing[4] }}>
            <EmotionChips
              options={FIXTURE_EMOTIONS}
              selected={emotions}
              onChange={setEmotions}
            />
          </View>
        </Card>

        <Card padding={4}>
          <Text variant="h3">Journal entry</Text>
          <Text variant="body-sm" color="secondary" style={{ marginTop: 4 }}>
            What’s on your mind?
          </Text>
          <Surface
            elevation="flat"
            padding={3}
            style={{ marginTop: v2.spacing[3], minHeight: 96 }}
          >
            <Text variant="body">{text}</Text>
          </Surface>
        </Card>

        <Card padding={4}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: v2.spacing[2] }}>
            <Camera size={20} color={v2.palette.primary} weight="duotone" />
            <Text variant="h3">Photos</Text>
          </View>
          <Text variant="body-sm" color="secondary" style={{ marginTop: 4 }}>
            Attach up to 3 photos to your entry.
          </Text>
        </Card>
      </View>

      <View style={{ marginTop: v2.spacing[5] }}>
        <Button variant="primary" size="lg" fullWidth leadingIcon={FloppyDisk} onPress={() => {}}>
          Update entry
        </Button>
      </View>
    </ScreenScaffold>
  );
}

function CalendarPreview({ v2, mode }) {
  // Build fixture entries: pick deterministic moods for some days of the current month.
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const fixtureMoods = ['great', 'good', 'okay', 'low', 'tough', 'good', 'great', 'good', 'okay'];
  const sampleDays = [2, 4, 7, 9, 12, 14, 16, 19, 21];
  const entryByDate = useMemo(() => {
    const map = new Map();
    sampleDays.forEach((d, i) => {
      map.set(format(new Date(year, month, d), 'yyyy-MM-dd'), {
        mood: fixtureMoods[i % fixtureMoods.length],
        entryDate: format(new Date(year, month, d), 'yyyy-MM-dd'),
      });
    });
    return map;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year, month]);

  const headerSubtitle =
    mode === 'calendar'
      ? format(today, 'MMMM yyyy')
      : mode === 'calendar-week'
      ? `${format(today, 'MMM d')} – ${format(new Date(year, month, today.getDate() + 6), 'MMM d, yyyy')}`
      : String(year);

  return (
    <ScreenScaffold ambient ambientIntensity="subtle">
      <ScreenHeader
        title="Mood calendar"
        subtitle={headerSubtitle}
        onBack={() => {}}
        right={
          <View style={{ flexDirection: 'row', gap: v2.spacing[1] }}>
            <IconButton icon={CaretLeft} accessibilityLabel="Previous" onPress={() => {}} variant="solid" size="sm" />
            <IconButton icon={CaretRight} accessibilityLabel="Next" onPress={() => {}} variant="solid" size="sm" />
          </View>
        }
      />

      <View style={{ flexDirection: 'row', gap: v2.spacing[2], marginTop: v2.spacing[2] }}>
        <Chip selected={mode === 'calendar'} onPress={() => {}}>Monthly</Chip>
        <Chip selected={mode === 'calendar-week'} onPress={() => {}}>Weekly</Chip>
        <Chip selected={mode === 'calendar-year'} onPress={() => {}}>Yearly</Chip>
      </View>

      <Card padding={4} style={{ marginTop: v2.spacing[4] }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: v2.spacing[2] }}>
          <ChartBar size={20} color={v2.palette.primary} weight="duotone" />
          <Text variant="h3">Summary</Text>
        </View>
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-around',
            marginTop: v2.spacing[3],
          }}
        >
          <View style={{ alignItems: 'center' }}>
            <Text variant="h2">{sampleDays.length}</Text>
            <Text variant="caption" color="tertiary">Entries</Text>
          </View>
          <View style={{ alignItems: 'center' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <View
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: 6,
                  backgroundColor: MOOD_TOKENS.find((m) => m.id === 'good').colorOf(v2.palette),
                }}
              />
              <Text variant="body" style={{ fontFamily: 'DMSans_600SemiBold' }}>Good</Text>
            </View>
            <Text variant="caption" color="tertiary">Top mood</Text>
          </View>
          <View style={{ alignItems: 'center' }}>
            <Text variant="h2">6.2</Text>
            <Text variant="caption" color="tertiary">Avg energy</Text>
          </View>
        </View>
      </Card>

      <View style={{ marginTop: v2.spacing[4] }}>
        {mode === 'calendar' ? (
          <PreviewMonth v2={v2} entryByDate={entryByDate} year={year} month={month} />
        ) : null}
        {mode === 'calendar-week' ? (
          <PreviewWeek v2={v2} entryByDate={entryByDate} year={year} month={month} />
        ) : null}
        {mode === 'calendar-year' ? (
          <PreviewYear v2={v2} year={year} entryByDate={entryByDate} />
        ) : null}
      </View>

      <Card padding={4} style={{ marginTop: v2.spacing[4] }}>
        <Text variant="h3">Mood legend</Text>
        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: v2.spacing[3],
            marginTop: v2.spacing[3],
          }}
        >
          {MOOD_TOKENS.map(({ id, label, colorOf }) => (
            <View key={id} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <View
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: 6,
                  backgroundColor: colorOf(v2.palette),
                }}
              />
              <Text variant="body-sm" color="secondary">
                {label}
              </Text>
            </View>
          ))}
        </View>
      </Card>
    </ScreenScaffold>
  );
}

function PreviewMonth({ v2, entryByDate, year, month }) {
  const DAY_NAMES = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  const firstDay = new Date(year, month, 1).getDay();
  const days = new Date(year, month + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push({ day: null, key: `e-${i}` });
  for (let d = 1; d <= days; d++) cells.push({ day: d, key: `d-${d}` });

  return (
    <Card padding={4}>
      <View style={{ flexDirection: 'row' }}>
        {DAY_NAMES.map((n, i) => (
          <View key={`${n}-${i}`} style={{ flex: 1, alignItems: 'center', paddingVertical: 6 }}>
            <Text variant="caption" color="tertiary">{n}</Text>
          </View>
        ))}
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {cells.map((c) => {
          if (c.day === null) {
            return <View key={c.key} style={{ width: '14.2857%', paddingVertical: 8 }} />;
          }
          const dateStr = format(new Date(year, month, c.day), 'yyyy-MM-dd');
          const entry = entryByDate.get(dateStr);
          const today = c.day === new Date().getDate();
          const moodToken = entry ? MOOD_TOKENS.find((t) => t.id === entry.mood) : null;
          return (
            <View key={c.key} style={{ width: '14.2857%', alignItems: 'center', paddingVertical: 8, gap: 4 }}>
              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: today ? v2.palette.bg.surfaceHigh : 'transparent',
                  borderWidth: today ? 1 : 0,
                  borderColor: v2.palette.primary,
                }}
              >
                <Text
                  variant="body-sm"
                  style={{
                    color: today ? v2.palette.primary : v2.palette.text.primary,
                    fontFamily: today ? 'DMSans_700Bold' : 'DMSans_400Regular',
                  }}
                >
                  {c.day}
                </Text>
              </View>
              {moodToken ? (
                <View
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: moodToken.colorOf(v2.palette),
                  }}
                />
              ) : (
                <View style={{ height: 8 }} />
              )}
            </View>
          );
        })}
      </View>
    </Card>
  );
}

function PreviewWeek({ v2, entryByDate, year, month }) {
  const FULL_DAY = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const today = new Date(year, month, new Date().getDate());
  const start = new Date(today);
  start.setDate(start.getDate() - today.getDay());
  return (
    <View style={{ gap: v2.spacing[2] }}>
      {Array.from({ length: 7 }).map((_, i) => {
        const date = new Date(start);
        date.setDate(start.getDate() + i);
        const dateStr = format(date, 'yyyy-MM-dd');
        const entry = entryByDate.get(dateStr);
        const moodToken = entry ? MOOD_TOKENS.find((t) => t.id === entry.mood) : null;
        const isToday = date.toDateString() === new Date().toDateString();
        return (
          <View
            key={dateStr}
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: 14,
              borderRadius: v2.radius.lg,
              backgroundColor: v2.palette.bg.surface,
              borderWidth: isToday ? 2 : 1,
              borderColor: isToday ? v2.palette.primary : v2.palette.border.subtle,
            }}
          >
            <View>
              <Text variant="caption" color="tertiary">{FULL_DAY[i]}</Text>
              <Text variant="body" style={{ marginTop: 2 }}>{format(date, 'MMM d')}</Text>
            </View>
            {moodToken ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: 6,
                    backgroundColor: moodToken.colorOf(v2.palette),
                  }}
                />
                <Text variant="body" style={{ textTransform: 'capitalize' }}>
                  {entry.mood}
                </Text>
              </View>
            ) : (
              <Text variant="body-sm" color="tertiary" style={{ fontStyle: 'italic' }}>
                No entry
              </Text>
            )}
          </View>
        );
      })}
    </View>
  );
}

function PreviewYear({ v2, year }) {
  const months = Array.from({ length: 12 }, (_, i) => i);
  const dominant = ['great', 'good', 'good', 'okay', 'good', 'great', 'good', 'low', 'okay', 'good', 'good', 'great'];
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: v2.spacing[2] }}>
      {months.map((m) => {
        const moodToken = MOOD_TOKENS.find((t) => t.id === dominant[m]);
        return (
          <View
            key={m}
            style={{
              width: '31%',
              alignItems: 'center',
              padding: 12,
              borderRadius: v2.radius.lg,
              backgroundColor: v2.palette.bg.surface,
              borderWidth: 1,
              borderColor: v2.palette.border.subtle,
              gap: 4,
            }}
          >
            <Text variant="body" style={{ fontFamily: 'DMSans_600SemiBold' }}>
              {format(new Date(year, m), 'MMM')}
            </Text>
            <Text variant="caption" color="tertiary">12 entries</Text>
            {moodToken ? (
              <View
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: 9,
                  marginTop: 2,
                  backgroundColor: moodToken.colorOf(v2.palette),
                }}
              />
            ) : null}
          </View>
        );
      })}
    </View>
  );
}

export default JournalPreviewScreen;
