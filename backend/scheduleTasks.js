import cron from "node-cron";
import prisma from "./utils/client.js";
import { sendMedicationReminderEmail } from "./utils/emailService.js";
import dotenv from "dotenv";

dotenv.config();

// Schedule morning medication reminders (8:00 AM)
cron.schedule("0 8 * * *", async () => {
  console.log("Running morning medication reminders...");
  await sendReminders("morning");
});

// Schedule afternoon medication reminders (1:00 PM)
cron.schedule("0 13 * * *", async () => {
  console.log("Running afternoon medication reminders...");
  await sendReminders("afternoon");
});

// Schedule evening medication reminders (8:00 PM)
cron.schedule("0 20 * * *", async () => {
  console.log("Running evening medication reminders...");
  await sendReminders("evening");
});

// Continuous monitoring: Check every minute for missed medications
cron.schedule("* * * * *", async () => {
  await continuouslyCheckMissedMedications();
});

// Check at 12:30 PM (for missed morning medications)
cron.schedule("30 12 * * *", async () => {
  console.log("Checking for missed morning medications...");
  await checkForMissedMedications("morning");
});

// Check at 6:30 PM (for missed afternoon medications)
cron.schedule("30 18 * * *", async () => {
  console.log("Checking for missed afternoon medications...");
  await checkForMissedMedications("afternoon");
});

// Check at 10:00 PM (for missed evening medications)
cron.schedule("0 22 * * *", async () => {
  console.log("Checking for missed evening medications...");
  await checkForMissedMedications("evening");
});

// Continuous monitoring function that runs every minute
async function continuouslyCheckMissedMedications() {
  try {
    const today = new Date().toISOString().split("T")[0];
    const currentHour = new Date().getHours();
    const currentMinute = new Date().getMinutes();

    // Define transition hours for time periods
    const morningEndHour = 12; // 12:00 PM - end of morning period
    const afternoonEndHour = 18; // 6:00 PM - end of afternoon period
    const eveningEndHour = 22; // 10:00 PM - end of evening period

    const timePeriodsToCheck = [];

    // Determine which time periods should be checked based on current hour
    if (currentHour >= morningEndHour && currentHour < afternoonEndHour) {
      timePeriodsToCheck.push("morning");
    } else if (currentHour >= afternoonEndHour && currentHour < eveningEndHour) {
      timePeriodsToCheck.push("morning", "afternoon");
    } else if (currentHour >= eveningEndHour || currentHour < 5) {
      timePeriodsToCheck.push("morning", "afternoon", "evening");
    }

    if (timePeriodsToCheck.length === 0) return;

    const transitionMinutes = 5;
    const isTransitionPoint =
      (currentHour === morningEndHour && currentMinute === transitionMinutes) ||
      (currentHour === afternoonEndHour && currentMinute === transitionMinutes) ||
      (currentHour === eveningEndHour && currentMinute === transitionMinutes);

    // Perform check at transition points or every 15 minutes
    if (isTransitionPoint || currentMinute % 15 === 0) {
      const pendingMedications = await prisma.medicineAdherence.findMany({
        where: {
          scheduledDate: today,
          adherenceStatus: "Pending",
          scheduledTime: {
            in: timePeriodsToCheck,
          },
        },
        include: {
          patient: true,
        },
      });

      if (pendingMedications.length > 0) {
        const medicationsByPatient = {};

        for (const med of pendingMedications) {
          await prisma.medicineAdherence.update({
            where: { id: med.id },
            data: {
              adherenceStatus: "Missed",
              missedDoses: {
                increment: 1,
              },
            },
          });

          if (!medicationsByPatient[med.patientId]) {
            medicationsByPatient[med.patientId] = {
              count: 0,
              patient: med.patient,
            };
          }
          medicationsByPatient[med.patientId].count++;
        }

        if (global.io) {
          for (const patientId in medicationsByPatient) {
            const data = medicationsByPatient[patientId];
            global.io.emit("medications-updated", {
              patientId: parseInt(patientId, 10),
              count: data.count,
              message: `${data.count} medication(s) automatically marked as missed`,
            });
          }
        }

        console.log(`Successfully marked ${pendingMedications.length} medications as missed`);
      }
    }
  } catch (error) {
    console.error("Error in continuous medication check:", error);
  }
}

// Send reminders to patients who have not taken their medications for current time period
export async function sendReminders(timeOfDay) {
  try {
    const today = new Date().toISOString().split("T")[0];

    // Get all patients with active prescriptions
    const patients = await prisma.patient.findMany({
      where: {
        prescriptions: {
          some: {},
        },
      },
    });

    let remindersSent = 0;

    for (const patient of patients) {
      const prescriptions = await prisma.prescription.findMany({
        where: { patientId: patient.id },
        include: { medicines: true },
      });

      const existingAdherenceRecords = await prisma.medicineAdherence.findMany({
        where: {
          patientId: patient.id,
          scheduledTime: timeOfDay,
          scheduledDate: today,
        },
      });

      const medicationStatusMap = {};
      const existingRecordsMap = {};
      existingAdherenceRecords.forEach((record) => {
        medicationStatusMap[record.medicineId] = record.adherenceStatus;
        existingRecordsMap[record.medicineId] = true;
      });

      // Filter untaken medicines scheduled for this time period
      const medicationsToRemind = prescriptions.flatMap((prescription) =>
        prescription.medicines
          .filter((med) => {
            const isMedForThisTimePeriod = med.timing && med.timing[timeOfDay] === true;
            const isMedAlreadyTaken = medicationStatusMap[med.id] === "Taken";
            return isMedForThisTimePeriod && !isMedAlreadyTaken;
          })
          .map((med) => ({
            name: med.medicineName,
            dosage: med.dosage,
            instructions: med.instructions,
            prescriptionId: prescription.id,
            medicineId: med.id,
          }))
      );

      if (medicationsToRemind.length > 0) {
        const sent = await sendMedicationReminderEmail(
          patient.email,
          patient.name,
          medicationsToRemind,
          timeOfDay
        );

        if (sent) {
          remindersSent++;

          // Mark reminderSent in database
          for (const med of medicationsToRemind) {
            if (existingRecordsMap[med.medicineId]) {
              await prisma.medicineAdherence.updateMany({
                where: {
                  patientId: patient.id,
                  medicineId: med.medicineId,
                  scheduledTime: timeOfDay,
                  scheduledDate: today,
                },
                data: { reminderSent: true },
              });
            } else {
              await prisma.medicineAdherence.create({
                data: {
                  patientId: patient.id,
                  medication: med.name,
                  adherenceStatus: "Pending",
                  missedDoses: 0,
                  reminderSent: true,
                  prescriptionId: med.prescriptionId,
                  medicineId: med.medicineId,
                  scheduledTime: timeOfDay,
                  scheduledDate: today,
                },
              });
            }
          }
        }
      }
    }

    console.log(`Sent ${timeOfDay} reminders to ${remindersSent} patients`);
    return remindersSent;
  } catch (error) {
    console.error(`Error sending ${timeOfDay} reminders:`, error);
    throw error;
  }
}

// Enhanced function to check for missed medications for a specific time period
async function checkForMissedMedications(timeOfDay) {
  try {
    const today = new Date().toISOString().split("T")[0];

    const whereClause = {
      scheduledDate: today,
      adherenceStatus: "Pending",
    };

    if (timeOfDay) {
      whereClause.scheduledTime = timeOfDay;
    }

    const pendingMedications = await prisma.medicineAdherence.findMany({
      where: whereClause,
      include: {
        patient: true,
      },
    });

    console.log(`Found ${pendingMedications.length} pending ${timeOfDay || "all"} medications`);

    for (const med of pendingMedications) {
      await prisma.medicineAdherence.update({
        where: { id: med.id },
        data: {
          adherenceStatus: "Missed",
          missedDoses: {
            increment: 1,
          },
        },
      });
    }

    console.log(`Completed missed medication check for ${timeOfDay || "all time periods"}`);
  } catch (error) {
    console.error("Error checking for missed medications:", error);
  }
}

export const initScheduler = () => {
  console.log("Medication reminder scheduler initialized");

  // Run an immediate check when the server starts
  setTimeout(() => {
    console.log("Running initial missed medication check...");
    continuouslyCheckMissedMedications();
  }, 5000);
};
