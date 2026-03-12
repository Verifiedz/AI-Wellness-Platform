export const MOODS = [
  { id: "great", label: "Great", icon: "happy-outline", color: "#00B894" },
  { id: "good", label: "Good", icon: "sunny-outline", color: "#4A90D9" },
  { id: "okay", label: "Okay", icon: "remove-outline", color: "#FDCB6E" },
  { id: "low", label: "Low", icon: "cloudy-outline", color: "#B2BEC3" },
  { id: "tough", label: "Tough", icon: "sad-outline", color: "#E17055" },
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
