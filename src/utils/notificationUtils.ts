import { AppNotification } from '../types';

/**
 * Extracts a numeric timestamp from a notification using all available clues:
 * 1. explicit numeric timestamp
 * 2. createdAt Date/string
 * 3. Unix milliseconds embedded in ID (e.g. notif-std-1760083200000)
 * 4. parsed date string
 */
export function getNotificationTimestamp(notif: AppNotification): number {
  if (typeof notif.timestamp === 'number' && notif.timestamp > 0) {
    return notif.timestamp;
  }

  if (notif.createdAt) {
    const t = new Date(notif.createdAt).getTime();
    if (!isNaN(t) && t > 0) return t;
  }

  // Check if ID contains a millisecond timestamp (13 digits starting with 17 or 18)
  const idMatch = notif.id?.match(/(17\d{11}|18\d{11})/);
  if (idMatch) {
    const parsed = parseInt(idMatch[1], 10);
    if (!isNaN(parsed) && parsed > 0) return parsed;
  }

  // Check if date contains a parseable date string (e.g. '2026-10-06 10:15')
  if (notif.date) {
    const parsedDate = new Date(notif.date).getTime();
    if (!isNaN(parsedDate) && parsedDate > 0) {
      return parsedDate;
    }
  }

  // Check if ID contains any large numbers
  const shortNumMatch = notif.id?.match(/\d+/g);
  if (shortNumMatch && shortNumMatch.length > 0) {
    const val = parseInt(shortNumMatch[shortNumMatch.length - 1], 10);
    if (!isNaN(val) && val > 1000000000) {
      return val;
    }
  }

  return 0;
}

/**
 * Sorts notifications strictly with the newest notifications at the very top (descending).
 * Consistent on both mobile and desktop so newly posted alerts appear right at the top.
 */
export function sortNotificationsNewestFirst(a: AppNotification, b: AppNotification): number {
  const timeA = getNotificationTimestamp(a);
  const timeB = getNotificationTimestamp(b);
  if (timeB !== timeA) {
    return timeB - timeA;
  }

  // Fallback to ID string comparison
  return (b.id || '').localeCompare(a.id || '');
}

/**
 * Strict chronological sorting by date/timestamp descending (newest first).
 */
export function sortNotificationsChronological(a: AppNotification, b: AppNotification): number {
  const timeA = getNotificationTimestamp(a);
  const timeB = getNotificationTimestamp(b);
  if (timeB !== timeA) {
    return timeB - timeA;
  }
  return (b.id || '').localeCompare(a.id || '');
}
