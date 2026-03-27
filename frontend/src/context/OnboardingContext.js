import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const OnboardingContext = createContext(null);

const ONBOARDING_KEY = "onboarding_completed_v1";
const ONBOARDING_PREFS_KEY = "onboarding_preferences_v1";

export function OnboardingProvider({ children }) {
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(false);
  const [isReady, setIsReady] = useState(false);

  const [initialAuthRoute, setInitialAuthRoute] = useState("Login");
  const [preferences, setPreferences] = useState({
    goals: [],
    checkInFrequency: "",
    preferredTime: "",
  });

  useEffect(() => {
    (async () => {
      try {
        const [completed, prefs] = await Promise.all([
          AsyncStorage.getItem(ONBOARDING_KEY),
          AsyncStorage.getItem(ONBOARDING_PREFS_KEY),
        ]);
        if (completed === "true") setHasSeenOnboarding(true);
        if (prefs) {
          try {
            setPreferences(JSON.parse(prefs));
          } catch {
            // Corrupt preferences — use defaults
          }
        }
      } catch {
        // Restore failed — treat as not onboarded
      } finally {
        setIsReady(true);
      }
    })();
  }, []);

  const completeOnboarding = useCallback(async (prefs, targetAuthRoute = "Login") => {
    setInitialAuthRoute(targetAuthRoute);
    const merged = {
      goals: prefs?.goals ?? [],
      checkInFrequency: prefs?.checkInFrequency ?? "",
      preferredTime: prefs?.preferredTime ?? "",
    };
    try {
      await Promise.all([
        AsyncStorage.setItem(ONBOARDING_KEY, "true"),
        AsyncStorage.setItem(ONBOARDING_PREFS_KEY, JSON.stringify(merged)),
      ]);
    } catch {
      // Persist failed — non-critical
    }
    setPreferences(merged);
    setHasSeenOnboarding(true);
  }, []);

  const resetOnboarding = useCallback(async () => {
    try {
      await Promise.all([
        AsyncStorage.removeItem(ONBOARDING_KEY),
        AsyncStorage.removeItem(ONBOARDING_PREFS_KEY),
      ]);
    } catch {
      // Reset failed — non-critical
    }
    setPreferences({ goals: [], checkInFrequency: "", preferredTime: "" });
    setHasSeenOnboarding(false);
  }, []);

  const value = useMemo(
    () => ({
      hasSeenOnboarding,
      isOnboardingReady: isReady,
      initialAuthRoute,
      preferences,
      completeOnboarding,
      resetOnboarding,
    }),
    [hasSeenOnboarding, isReady, initialAuthRoute, preferences, completeOnboarding, resetOnboarding]
  );

  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const ctx = useContext(OnboardingContext);
  if (!ctx)
    throw new Error("useOnboarding must be used within an OnboardingProvider");
  return ctx;
}
