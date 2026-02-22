import { DateTime } from "luxon";

/**
 * Timezone Utility Functions
 * Handle conversion between UTC and various user/location timezones
 */

export const timezone = {
  /**
   * Convert UTC time string to user's timezone
   */
  toUserTime: (
    utcDateString: string,
    userTimezone: string
  ): DateTime => {
    return DateTime.fromISO(utcDateString, {
      zone: "utc",
    }).setZone(userTimezone);
  },

  /**
   * Convert user input to UTC for API submission
   */
  toUTC: (
    timeString: string,
    dateString: string,
    timezone: string
  ): DateTime => {
    // Combine date and time
    const localTime = `${dateString}T${timeString}`;
    return DateTime.fromISO(localTime, {
      zone: timezone,
    }).toUTC();
  },

  /**
   * Convert UTC time to location's timezone
   */
  toLocationTime: (
    utcDateString: string,
    locationTimezone: string
  ): DateTime => {
    return DateTime.fromISO(utcDateString, {
      zone: "utc",
    }).setZone(locationTimezone);
  },

  /**
   * Format time for display in user's timezone
   */
  formatUserTime: (
    utcDateString: string,
    userTimezone: string,
    format: string = "HH:mm"
  ): string => {
    return timezone
      .toUserTime(utcDateString, userTimezone)
      .toFormat(format);
  },

  /**
   * Get current time in a specific timezone
   */
  now: (tz: string): DateTime => {
    return DateTime.now().setZone(tz);
  },

  /**
   * Check if time is overnight (spans across midnight)
   */
  isOvernight: (startTime: DateTime, endTime: DateTime): boolean => {
    return startTime.day !== endTime.day;
  },

  /**
   * Split overnight shift into two shifts (one per day)
   */
  splitOvernight: (
    startTime: DateTime,
    endTime: DateTime
  ): { start: DateTime; end: DateTime }[] => {
    if (!timezone.isOvernight(startTime, endTime)) {
      return [{ start: startTime, end: endTime }];
    }

    // First shift: from start to end of day
    const firstShift = {
      start: startTime,
      end: startTime
        .endOf("day")
        .toLocal(),
    };

    // Second shift: from start of next day to end
    const secondShift = {
      start: endTime.startOf("day"),
      end: endTime,
    };

    return [firstShift, secondShift];
  },

  /**
   * Get user's current timezone (from browser or user preference)
   */
  getUserTimezone: (): string => {
    if (typeof Intl !== "undefined") {
      return Intl.DateTimeFormat().resolvedOptions().timeZone;
    }
    return "UTC";
  },

  /**
   * Get all available timezones
   */
  getAllTimezones: (): string[] => {
    return DateTime.now().zoneName ? [DateTime.now().zoneName] : [];
  },

  /**
   * Calculate duration between two times (in minutes)
   */
  getDurationMinutes: (start: DateTime, end: DateTime): number => {
    return Math.round(end.diff(start).as("minutes"));
  },

  /**
   * Format duration as readable string (e.g., "2h 30m")
   */
  formatDuration: (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    if (hours === 0) {
      return `${mins}m`;
    }
    if (mins === 0) {
      return `${hours}h`;
    }
    return `${hours}h ${mins}m`;
  },
};
