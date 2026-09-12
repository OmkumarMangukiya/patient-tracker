import prisma from "../utils/client.js";
import { resolvePatient } from "../utils/medicationHelpers.js";

const assignPatient = async (req, res) => {
  try {
    if (req.user.role !== "doctor") {
      return res.status(403).json({ message: "Unauthorized: Only doctors can assign patients" });
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

    const updatedPatient = await prisma.patient.update({
      where: { id: patient.id },
      data: {
        doctors: {
          connect: { id: doctorId },
        },
      },
    });

    return res.status(200).json({
      message: "Patient assigned successfully",
      patient: updatedPatient,
    });
  } catch (err) {
    console.error("Error in assigning patient:", err);
    return res.status(500).json({ message: "Error in assigning patient", error: err.message });
  }
};

export default assignPatient;