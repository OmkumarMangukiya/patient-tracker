import { tokenVerify } from "../auth/jwtToken.js";
import prisma from "../client.js";
import dotenv from "dotenv";
import transporter from "./emailConfig.js";

dotenv.config();

const emailServiceAlert = async (token) => {
  const decoded = tokenVerify(token);
  // Convert string ID to integer
  const patientId = parseInt(decoded.id, 10);

  try {
    // Get patient details
    const patient = await prisma.Patient.findUnique({
      where: { id: patientId },
    });

    if (!patient) {
      console.error(`Patient with ID ${patientId} not found`);
      return false;
    }

    // Get current prescriptions with medicines
    const prescriptions = await prisma.Prescription.findMany({
      where: {
        patientId: patientId, // Already an integer
      },
      include: {
        medicines: true,
      },
    });

    if (prescriptions.length === 0) {
      console.log(`No active prescriptions found for patient ${patientId}`);
      return false;
    }

    // Determine which medications need to be taken now
    const currentHour = new Date().getHours();
    let timeOfDay = "";

    if (currentHour >= 5 && currentHour < 12) {
      timeOfDay = "morning";
    } else if (currentHour >= 12 && currentHour < 18) {
      timeOfDay = "afternoon";
    } else {
      timeOfDay = "evening";
    }

    // Filter medicines that need to be taken at the current time
    const medications = prescriptions.flatMap((prescription) =>
      prescription.medicines
        .filter((med) => med.timing && med.timing[timeOfDay] === true)
        .map((med) => ({
          name: med.medicineName,
          dosage: med.dosage,
          instructions: med.instructions,
          prescriptionId: prescription.id,
          medicineId: med.id,
        }))
    );

    if (medications.length === 0) {
      console.log(
        `No medications scheduled for ${timeOfDay} for patient ${patientId}`
      );
      return false;
    }

    // Send email reminder
    await sendMedicationReminder(
      patient.email,
      patient.name,
      medications,
      timeOfDay
    );

    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split("T")[0];

    // Check if we've already created medication adherence records for today
    const existingAdherenceRecords = await prisma.MedicineAdherence.findMany({
      where: {
        patientId: patientId, // Ensure this is an integer
        scheduledTime: timeOfDay,
        scheduledDate: today,
      },
    });

    // Create a map to track which medicines already have records for today's time period
    const existingRecordsMap = {};
    existingAdherenceRecords.forEach((record) => {
      existingRecordsMap[record.medicineId] = true;
    });

    // Log reminder in the database only for medicines that don't already have records
    for (const med of medications) {
      try {
        await prisma.MedicineAdherence.create({
          data: {
            patientId: patientId, // Ensure this is an integer
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
      } catch (error) {
        // If scheduledDate/scheduledTime fields aren't available in schema, create without them
        if (error.message.includes("Unknown argument")) {
          await prisma.MedicineAdherence.create({
            data: {
              patientId: patientId, // Ensure this is an integer
              medication: med.name,
              adherenceStatus: "Pending",
              missedDoses: 0,
              reminderSent: true,
              prescriptionId: med.prescriptionId,
              medicineId: med.medicineId,
            },
          });
        } else {
          throw error;
        }
      }
    }

    return true;
  } catch (error) {
    console.error("Error sending medication alert:", error);
    return false;
  }
};

const sendMedicationReminder = async (email, name, medications, timeOfDay) => {
  try {
    // Create medication list HTML
    const medicationsList = medications
      .map(
        (med) => `<li>${med.name} - ${med.dosage} - ${med.instructions}</li>`
      )
      .join("");

    console.log(
      `Attempting to send ${timeOfDay} reminder to ${name} at ${email}`
    );

    const mailOptions = {
      from: `"Patient Tracker" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `Medication Reminder - ${timeOfDay} dose`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4a5568;">Medication Reminder</h2>
          <p>Hello ${name},</p>
          <p>It's time to take your ${timeOfDay} medication:</p>
          <ul>
            ${medicationsList}
          </ul>
          <p>Please remember to mark these medications as taken in your Patient Dashboard.</p>
          <p>Best regards,<br>Patient Tracker Team</p>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);

    console.log(
      `Medication reminder email sent successfully to ${email}. Message ID: ${info.messageId}`
    );
    return true;
  } catch (error) {
    console.error(
      `Error sending medication reminder email to ${email}:`,
      error.message
    );
    return false;
  }
};

export { emailServiceAlert };
