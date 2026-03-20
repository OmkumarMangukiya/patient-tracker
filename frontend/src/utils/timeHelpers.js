/**
 * Shared time-related helper functions used across multiple components
 * (PatientDashboard, MedicationTracker, ConciseMedicationTracker).
 */

/**
 * Returns the current time period: 'morning', 'afternoon', or 'evening'.
 */
export function getCurrentTimePeriod() {
  const hour = new Date().getHours();
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  return 'evening';
}

/**
 * Returns an emoji representing the given time period.
 * @param {string} period - 'morning', 'afternoon', or 'evening'
 */
export function getTimeEmoji(period) {
  switch (period) {
    case 'morning': return '🌅';
    case 'afternoon': return '☀️';
    case 'evening': return '🌙';
    default: return '⏰';
  }
}
