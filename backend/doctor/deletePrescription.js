import prisma from "../utils/client.js";

const deletePrescription = async (req, res) => {
  try {
    if (req.user.role !== "doctor") {
      return res.status(403).json({ message: "Unauthorized: Only doctors can delete prescriptions" });
    }

    const { prescriptionId } = req.params;

    if (!prescriptionId) {
      return res.status(400).json({ message: "Prescription ID is required" });
    }

    await prisma.$transaction(async (tx) => {
      const existing = await tx.prescription.findUnique({
        where: { id: prescriptionId },
        select: { id: true },
      });

      if (!existing) {
        throw new Error("Prescription not found");
      }

      // Delete associated adherence records
      await tx.medicineAdherence.deleteMany({
        where: { prescriptionId },
      });

      // Delete PrescribedMedicine records
      await tx.prescribedMedicine.deleteMany({
        where: { prescriptionId },
      });

      // Delete the Prescription record
      await tx.prescription.delete({
        where: { id: prescriptionId },
      });
    });

    return res.status(200).json({ message: "Prescription and associated records deleted successfully" });
  } catch (err) {
    console.error("Error deleting prescription:", err);
    if (err.message === "Prescription not found") {
      return res.status(404).json({ message: "Prescription not found" });
    }
    return res.status(500).json({ message: "Error deleting prescription: " + err.message });
  }
};

export default deletePrescription;