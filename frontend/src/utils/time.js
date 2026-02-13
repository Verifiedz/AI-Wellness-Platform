import { format } from "date-fns";
import { toZonedTime, fromZonedTime } from "date-fns-tz";
import * as Localization from "expo-localization";

/**
 * Get the device's IANA timezone (e.g. "America/New_York").
 */
export function getDeviceTimezone() {
  try {
    return Localization.getCalendars()[0]?.timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

/**
 * Convert a local time string "HH:mm" and IANA timezone to UTC "HH:mm:ss".
 *
 * @param {string} localTime – "HH:mm" in the given timezone
 * @param {string} timezone  – IANA timezone identifier
 * @returns {string} "HH:mm:ss" in UTC
 */
export function localTimeToUtc(localTime, timezone) {
  const today = new Date();
  const [hours, minutes] = localTime.split(":").map(Number);

  // Build a wall-clock date in the target timezone, then shift to UTC
  const localDate = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
    hours,
    minutes,
    0
  );
  const utcDate = fromZonedTime(localDate, timezone);

  // Use getUTC* methods to format in UTC — date-fns format() uses the
  // device's local timezone which gives wrong results when device ≠ UTC.
  const h = String(utcDate.getUTCHours()).padStart(2, "0");
  const m = String(utcDate.getUTCMinutes()).padStart(2, "0");
  return `${h}:${m}:00`;
}

/**
 * Convert a UTC time string "HH:mm:ss" and IANA timezone to local "HH:mm".
 *
 * @param {string} utcTime  – "HH:mm:ss" in UTC
 * @param {string} timezone – IANA timezone identifier
 * @returns {string} "HH:mm" in the given timezone
 */
export function utcToLocalTime(utcTime, timezone) {
  const today = new Date();
  const [hours, minutes, seconds] = utcTime.split(":").map(Number);

  const utcDate = new Date(
    Date.UTC(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
      hours,
      minutes,
      seconds || 0
    )
  );
  const zonedDate = toZonedTime(utcDate, timezone);

  return format(zonedDate, "HH:mm");
}

/**
 * Format a 24-hour "HH:mm" string for display (e.g. "9:00 AM").
 */
export function formatTimeForDisplay(time24) {
  const [hours, minutes] = time24.split(":").map(Number);
  const date = new Date(2000, 0, 1, hours, minutes);
  return format(date, "h:mm a");
}
