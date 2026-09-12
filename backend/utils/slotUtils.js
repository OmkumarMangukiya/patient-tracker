/**
 * Normalize an appointment datetime to the start of its 1-hour slot.
 * Matches the hourly slots generated in getAvailableSlots (minutes/seconds/ms zeroed).
 */
export function normalizeToSlotStart(date) {
  const slot = new Date(date);
  slot.setMinutes(0, 0, 0);
  return slot;
}
