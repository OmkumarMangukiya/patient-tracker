import prisma from "./client.js";

/**
 * Check if a prescribed medicine is still within its active duration.
 * Supports both signatures:
 *   - isStillActive(prescriptionDate, durationStr)
 *   - isStillActive(medicine, prescriptionDate)
 *
 * @param {Date|string|Object} prescriptionDateOrMedicine
 * @param {string|Date} durationStrOrPrescriptionDate
 * @returns {boolean}
 */
export function isStillActive(prescriptionDateOrMedicine, durationStrOrPrescriptionDate) {
  let prescriptionDate;
  let durationStr;

  if (
    typeof prescriptionDateOrMedicine === "object" &&
    prescriptionDateOrMedicine !== null &&
    !(prescriptionDateOrMedicine instanceof Date)
  ) {
    // Called as isStillActive(medicine, prescriptionDate)
    durationStr = prescriptionDateOrMedicine.duration;
    prescriptionDate = durationStrOrPrescriptionDate;
  } else {
    // Called as isStillActive(prescriptionDate, durationStr)
    prescriptionDate = prescriptionDateOrMedicine;
    durationStr = durationStrOrPrescriptionDate;
  }

  if (!prescriptionDate || !durationStr) return true;

  try {
    const durationMatch = String(durationStr).toLowerCase().match(/(\d+)\s*(\w*)/);
    if (!durationMatch) return true;

    const amount = parseInt(durationMatch[1], 10);
    const unit = durationMatch[2] || "day";

    const startDate = prescriptionDate instanceof Date
      ? prescriptionDate
      : new Date(prescriptionDate);
    const endDate = new Date(startDate);

    if (unit.includes("day")) {
      endDate.setDate(endDate.getDate() + amount);
    } else if (unit.includes("week")) {
      endDate.setDate(endDate.getDate() + amount * 7);
    } else if (unit.includes("month")) {
      endDate.setMonth(endDate.getMonth() + amount);
    } else if (unit.includes("year")) {
      endDate.setFullYear(endDate.getFullYear() + amount);
    } else {
      return true;
    }

    return new Date() <= endDate;
  } catch (error) {
    console.error("Error checking medication duration:", error);
    return true;
  }
}

/**
 * Resolve a patient by ID (number/string), email, or formatted label ("Name (email@domain)").
 * @param {string|number} identifier
 * @returns {Promise<Object|null>} The patient record or null
 */
export async function resolvePatient(identifier) {
  if (identifier === undefined || identifier === null) return null;

  const raw = String(identifier).trim();

  // If it's a numeric ID (e.g. 12 or "12")
  if (!isNaN(raw) && !isNaN(parseInt(raw, 10)) && !raw.includes("@")) {
    return prisma.patient.findUnique({
      where: { id: parseInt(raw, 10) },
    });
  }

  // If it's an email or "Name (email@example.com)"
  let email = raw;
  if (raw.includes("@")) {
    const match = raw.match(/\(([^)]+)\)/);
    if (match && match[1].includes("@")) {
      email = match[1].trim();
    }
    return prisma.patient.findUnique({
      where: { email },
    });
  }

  return null;
}

/**
 * Canonical generator for today's medications for a given patient.
 * Combines existing adherence records for today with active prescription schedules.
 * @param {number|string} patientId
 * @returns {Promise<Array>}
 */
export async function fetchTodayMedications(patientId) {
  const patientIdInt = parseInt(patientId, 10);
  if (isNaN(patientIdInt)) {
    throw new Error("Invalid patient ID format");
  }

  const today = new Date().toISOString().split("T")[0];

  // 1. Existing adherence records for today
  const existingAdherence = await prisma.medicineAdherence.findMany({
    where: {
      patientId: patientIdInt,
      scheduledDate: today,
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  // Track medicines that already have entries for each time period
  const existingMedicineTimeMap = {};
  existingAdherence.forEach((med) => {
    if (!existingMedicineTimeMap[med.medicineId]) {
      existingMedicineTimeMap[med.medicineId] = new Set();
    }
    existingMedicineTimeMap[med.medicineId].add(med.scheduledTime);
  });

  // 2. Active prescriptions for this patient
  const prescriptions = await prisma.prescription.findMany({
    where: {
      patientId: patientIdInt,
    },
    include: {
      medicines: true,
    },
  });

  // 3. Populate missing schedule slots from active prescriptions
  const additionalMeds = [];
  const addedCombos = new Set();

  for (const prescription of prescriptions) {
    for (const medicine of prescription.medicines) {
      if (!isStillActive(prescription.date, medicine.duration)) {
        continue;
      }

      const timing = medicine.timing || {};

      for (const timeOfDay of ["morning", "afternoon", "evening"]) {
        if (timing[timeOfDay]) {
          const inDb = existingMedicineTimeMap[medicine.id]?.has(timeOfDay);
          const comboKey = `${medicine.id}-${timeOfDay}`;

          if (!inDb && !addedCombos.has(comboKey)) {
            additionalMeds.push({
              medicineId: medicine.id,
              medicineName: medicine.medicineName,
              dosage: medicine.dosage,
              instructions: medicine.instructions,
              scheduledTime: timeOfDay,
              adherenceStatus: "Pending",
              prescriptionId: prescription.id,
            });
            addedCombos.add(comboKey);
          }
        }
      }
    }
  }

  return [...existingAdherence, ...additionalMeds];
}
