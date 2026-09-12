import prisma from "../utils/client.js";
import { fetchTodayMedications } from "../utils/medicationHelpers.js";

/**
 * Get today's medication adherence for a specific patient, accessible by their assigned doctor
 */
export async function getPatientMedicationsTodayForDoctor(req, res) {
  const { patientId } = req.params;

  try {
    const doctorId = String(req.user.id);

    if (req.user.role !== "doctor") {
      return res.status(403).json({ message: "Unauthorized: Only doctors can access this data" });
    }

    const patientIdInt = parseInt(patientId, 10);
    if (isNaN(patientIdInt)) {
      return res.status(400).json({ message: "Invalid patient ID" });
    }

    // Verify the doctor is assigned to this patient
    const doctor = await prisma.doctor.findUnique({
      where: { id: doctorId },
      include: {
        patients: {
          where: { id: patientIdInt },
        },
      },
    });

    if (!doctor || doctor.patients.length === 0) {
      return res.status(403).json({ message: "Unauthorized: Doctor is not assigned to this patient" });
    }

    const currentMedications = await fetchTodayMedications(patientIdInt);
    return res.status(200).json(currentMedications);
  } catch (error) {
    console.error("Error fetching patient medication data for doctor:", error);
    return res.status(500).json({ message: "Failed to retrieve medication data: " + error.message });
  }
}