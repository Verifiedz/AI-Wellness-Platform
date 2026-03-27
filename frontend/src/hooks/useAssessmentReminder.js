import { useCallback, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { assessmentApi } from "../services/assessmentApi";

const REMINDER_DAYS = 14;

/**
 * Hook that checks if 14+ days have passed since the last assessment.
 * Returns whether a reminder should be shown and for which type.
 */
export function useAssessmentReminder() {
  const [reminder, setReminder] = useState({ show: false, type: null, daysSince: 0 });

  const check = useCallback(async () => {
    try {
      const [phq9Result, gad7Result] = await Promise.all([
        assessmentApi.getLatest("PHQ9"),
        assessmentApi.getLatest("GAD7"),
      ]);

      const now = Date.now();
      let oldestType = null;
      let maxDays = 0;

      for (const [type, result] of [["PHQ9", phq9Result], ["GAD7", gad7Result]]) {
        if (result.error || !result.data) {
          // Never taken — highest priority
          oldestType = type;
          maxDays = Infinity;
          break;
        }

        const daysSince = Math.floor(
          (now - new Date(result.data.completedAt).getTime()) / (1000 * 60 * 60 * 24)
        );

        if (daysSince >= REMINDER_DAYS && daysSince > maxDays) {
          maxDays = daysSince;
          oldestType = type;
        }
      }

      setReminder({
        show: oldestType !== null,
        type: oldestType,
        daysSince: maxDays === Infinity ? -1 : maxDays,
      });
    } catch {
      // Check failed silently
      setReminder({ show: false, type: null, daysSince: 0 });
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      check();
    }, [check])
  );

  return reminder;
}
