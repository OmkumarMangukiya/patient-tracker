import prisma from "../utils/client.js";
import { resolvePatient } from "../utils/medicationHelpers.js";

const removePatient = async (req, res) => {
  try {
    if (req.user.role !== "doctor") {
      return res.status(403).json({ message: "Unauthorized: Only doctors can remove patients" });
    }

    const doctorId = String(req.user.id);
    const patientIdentifier = req.body.patientId;

    if (!patientIdentifier) {
      return res.status(400).json({ message: "Patient identifier is required" });
    }

    const patient = await resolvePatient(patientIdentifier);
    if (!patient) {
      return res.status(404).json({ message: `Patient not found for identifier: ${patientIdentifier}` });
    }

    // Check if the patient is assigned to this doctor
    const doctor = await prisma.doctor.findUnique({
      where: { id: doctorId },
      include: {
        patients: {
          where: { id: patient.id },
        },
      },
    });

    if (!doctor || doctor.patients.length === 0) {
      return res.status(404).json({ message: "This patient is not assigned to you or doesn't exist" });
    }

    // Remove the association between doctor and patient
    const updatedDoctor = await prisma.doctor.update({
      where: { id: doctorId },
      data: {
        patients: {
          disconnect: { id: patient.id },
        },
      },
      include: {
        patients: true,
      },
    });

    return res.status(200).json({
      message: "Patient removed successfully",
      patientsCount: updatedDoctor.patients.length,
    });
  } catch (err) {
    console.error("Error in removing patient:", err);
    return res.status(500).json({ message: "Error in removing patient", error: err.message });
  }
};

export default removePatient;