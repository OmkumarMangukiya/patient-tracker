import prisma from "../client.js";

/**
 * Check if a prescribed medicine is still within its active duration.
 * @param {Object} medicine - The prescribed medicine object
 * @param {Date} prescriptionDate - The date the prescription was created
 * @returns {boolean}
 */
export function isStillActive(medicine, prescriptionDate) {
  const durationStr = medicine.duration.toLowerCase();
  const match = durationStr.match(/(\d+)/);
  if (!match) return true;

  const amount = parseInt(match[1]);
  const startDate = new Date(prescriptionDate);
  const endDate = new Date(startDate);

  if (durationStr.includes("day")) {
    endDate.setDate(endDate.getDate() + amount);
  } else if (durationStr.includes("week")) {
    endDate.setDate(endDate.getDate() + amount * 7);
  } else if (durationStr.includes("month")) {
    endDate.setMonth(endDate.getMonth() + amount);
  } else if (durationStr.includes("year")) {
    endDate.setFullYear(endDate.getFullYear() + amount);
  } else {
    return true;
  }

  return new Date() <= endDate;
}

/**
 * Resolve a patient by ID (numeric) or email (string).
 * @param {string|number} identifier - Patient ID or email
 * @returns {Promise<Object|null>} The patient record or null
 */
export async function resolvePatient(identifier) {
  const isNumeric = !isNaN(identifier) && !isNaN(parseInt(identifier));

  if (isNumeric) {
    return prisma.patient.findUnique({ where: { id: parseInt(identifier) } });
  } else {
    return prisma.patient.findUnique({ where: { email: identifier } });
  }
}
