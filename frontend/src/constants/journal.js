export const MOODS = [
  { id: "great", label: "Great", icon: "happy-outline", color: "#6BAF7D" },
  { id: "good", label: "Good", icon: "sunny-outline", color: "#7C9EB2" },
  { id: "okay", label: "Okay", icon: "remove-outline", color: "#E8C16A" },
  { id: "low", label: "Low", icon: "cloudy-outline", color: "#B5B5B5" },
  { id: "tough", label: "Tough", icon: "sad-outline", color: "#D4726A" },
];

export const MOOD_COLORS = Object.fromEntries(
  MOODS.map((m) => [m.id, m.color])
);

export const EMOTIONS = [
  "Happy",
  "Grateful",
  "Excited",
  "Peaceful",
  "Confident",
  "Anxious",
  "Sad",
  "Frustrated",
  "Overwhelmed",
  "Lonely",
  "Hopeful",
  "Proud",
  "Content",
  "Worried",
  "Stressed",
];
