import cron from "node-cron";
import prisma from "./client.js";
import { emailServiceAlert } from "./utils/emailServiceAlert.js";
import jwt from "jsonwebtoken";
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

// Also send a reminder for missed medications at 10 PM
cron.schedule("0 22 * * *", async () => {
  console.log("Running missed medication check...");
  await checkForMissedMedications();
});

// Add a check to avoid sending reminders for medications that are already taken
export async function sendReminders(timeOfDay) {
  try {
    // Get all patients with active prescriptions
    const patients = await prisma.Patient.findMany({
      where: {
        prescriptions: {
          some: {}, // Has at least one prescription
        },
      },
    });

    let remindersSent = 0;

    for (const patient of patients) {
      // Check if the patient has medications scheduled for this time of day
      const prescriptions = await prisma.Prescription.findMany({
        where: { patientId: patient.id },
        include: { medicines: true },
      });

      const hasMedicationsForTimeOfDay = prescriptions.some((prescription) =>
        prescription.medicines.some(
          (med) => med.timing && med.timing[timeOfDay] === true
        )
      );

      if (hasMedicationsForTimeOfDay) {
        // Generate a token for the patient
        const token = jwt.sign(
          { id: patient.id, role: "patient" },
          process.env.JWT_SECRET,
          { expiresIn: "24h" }
        );

        // Add logic to check if medication is already taken before sending reminder
        const medicationsToRemind = prescriptions.flatMap((prescription) =>
          prescription.medicines.filter(
            (med) =>
              med.timing &&
              med.timing[timeOfDay] === true &&
              med.status !== "taken"
          )
        );

        // Send reminder
        if (medicationsToRemind.length > 0) {
          const sent = await emailServiceAlert(token);
          if (sent) remindersSent++;
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

async function checkForMissedMedications() {
  try {
    const today = new Date().toISOString().split("T")[0];

    // Find medications that are still pending for today
    const pendingMedications = await prisma.MedicineAdherence.findMany({
      where: {
        scheduledDate: today,
        adherenceStatus: "Pending",
      },
      include: {
        patient: true,
      },
    });

    // Group by patient
    const patientGroups = pendingMedications.reduce((groups, med) => {
      if (!groups[med.patientId]) {
        groups[med.patientId] = {
          patient: med.patient,
          medications: [],
        };
      }
      groups[med.patientId].medications.push(med);
      return groups;
    }, {});

    // Send missed medication reminders
    for (const patientId in patientGroups) {
      const { patient, medications } = patientGroups[patientId];

      // Send a reminder about the missed medications
      const token = jwt.sign(
        { id: patient.id, role: "patient" },
        process.env.JWT_SECRET,
        { expiresIn: "24h" }
      );

      // Update medications to "Missed" if they are older reminders
      const timeNow = new Date().getHours();
      for (const med of medications) {
        let shouldMarkMissed = false;

        switch (med.scheduledTime) {
          case "morning":
            shouldMarkMissed = timeNow >= 12;
            break;
          case "afternoon":
            shouldMarkMissed = timeNow >= 18;
            break;
          case "evening":
            shouldMarkMissed = timeNow >= 22;
            break;
        }

        if (shouldMarkMissed) {
          await prisma.MedicineAdherence.update({
            where: { id: med.id },
            data: {
              adherenceStatus: "Missed",
              missedDoses: {
                increment: 1,
              },
            },
          });
        }
      }
    }

    console.log(
      `Checked ${pendingMedications.length} pending medications for missed doses`
    );
  } catch (error) {
    console.error("Error checking for missed medications:", error);
  }
}

export const initScheduler = () => {
  console.log("Medication reminder scheduler initialized");

  // You could uncomment this to send test reminders when the server starts
  // setTimeout(() => {
  //   console.log('Sending test reminder...');
  //   sendReminders('morning');
  // }, 5000);
};
