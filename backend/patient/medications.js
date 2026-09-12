import prisma from "../utils/client.js";
import { fetchTodayMedications } from "../utils/medicationHelpers.js";

// Get today's medications for a patient
export const getTodayMedications = async (req, res) => {
  try {
    if (req.user.role !== "patient") {
      return res
        .status(403)
        .json({ message: "Unauthorized: Only patients can view medications" });
    }

    const { patientId } = req.params;
    const patientIdInt = parseInt(patientId, 10);

    if (isNaN(patientIdInt)) {
      return res.status(400).json({ message: "Valid patient ID is required" });
    }

    // Patients can only view their own medications
    if (parseInt(req.user.id, 10) !== patientIdInt) {
      return res.status(403).json({ message: "Forbidden: You can only view your own medications" });
    }

    const currentMedications = await fetchTodayMedications(patientIdInt);
    return res.status(200).json(currentMedications);
  } catch (err) {
    console.error("Error fetching medications:", err);
    return res
      .status(500)
      .json({ message: "Error fetching medications: " + err.message });
  }
};

// Update a specific medication's status (Taken/Missed)
export const updateMedicationStatus = async (req, res) => {
  try {
    const user = req.user;
    const { status, patientId, medication, prescriptionId, medicineId, scheduledTime, isNewMedication } = req.body;

    const patientIdInt = parseInt(patientId, 10);
    if (isNaN(patientIdInt)) {
      return res.status(400).json({ message: "Valid patient ID is required" });
    }

    // Verify user is authorized: either the patient themselves or a doctor
    const isAuthorized =
      (user.role === "patient" && parseInt(user.id, 10) === patientIdInt) ||
      user.role === "doctor";

    if (!isAuthorized) {
      return res.status(403).json({ message: "Unauthorized: You do not have permission to update this medication" });
    }

    const today = new Date().toISOString().split("T")[0];

    // Check if a record already exists for this medication on this date and time period
    const existingRecord = await prisma.medicineAdherence.findFirst({
      where: {
        patientId: patientIdInt,
        scheduledDate: today,
        scheduledTime: scheduledTime,
        medicineId: medicineId,
      },
    });

    let result;

    if (existingRecord) {
      result = await prisma.medicineAdherence.update({
        where: {
          id: existingRecord.id,
        },
        data: {
          adherenceStatus: status,
          missedDoses: status === "Missed" ? 1 : 0,
          updatedAt: new Date(),
        },
      });
    } else if (isNewMedication || !medicineId) {
      result = await prisma.medicineAdherence.create({
        data: {
          patientId: patientIdInt,
          medication: medication,
          scheduledDate: today,
          scheduledTime: scheduledTime,
          adherenceStatus: status,
          prescriptionId: prescriptionId,
          medicineId: medicineId,
          missedDoses: status === "Missed" ? 1 : 0,
        },
      });
    } else {
      return res.status(400).json({ message: "Unable to determine if medication record should be created or updated" });
    }

    return res.json(result);
  } catch (error) {
    console.error("Error updating medication status:", error);
    return res.status(500).json({ message: "Failed to update medication status" });
  }
};

// Get medication history for a patient
export const getMedicationHistory = async (req, res) => {
  try {
    if (req.user.role !== "patient") {
      return res.status(403).json({
        message: "Unauthorized: Only patients can view medication history",
      });
    }

    const { patientId } = req.params;
    const { days = 7 } = req.query;

    const patientIdInt = parseInt(patientId, 10);
    if (isNaN(patientIdInt)) {
      return res.status(400).json({ message: "Valid patient ID is required" });
    }

    if (parseInt(req.user.id, 10) !== patientIdInt) {
      return res.status(403).json({ message: "Forbidden: You can only view your own medication history" });
    }

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days, 10));

    const history = await prisma.medicineAdherence.findMany({
      where: {
        patientId: patientIdInt,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.status(200).json(history);
  } catch (err) {
    console.error("Error fetching medication history:", err);
    return res
      .status(500)
      .json({ message: "Error fetching medication history: " + err.message });
  }
};

// Get medication adherence statistics
export const getMedicationAdherenceStats = async (req, res) => {
  try {
    const { patientId } = req.params;
    const { days = 30 } = req.query;

    const patientIdInt = parseInt(patientId, 10);
    if (isNaN(patientIdInt)) {
      return res.status(400).json({ message: "Valid patient ID is required" });
    }

    // Patients can view their own; doctors can view assigned patients
    if (req.user.role === "patient" && parseInt(req.user.id, 10) !== patientIdInt) {
      return res.status(403).json({ message: "Forbidden: You can only view your own stats" });
    }

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days, 10));

    // Get all medication records in the date range
    const adherenceRecords = await prisma.medicineAdherence.findMany({
      where: {
        patientId: patientIdInt,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    // Get prescriptions to count unique medicines
    const prescriptions = await prisma.prescription.findMany({
      where: {
        patientId: patientIdInt,
      },
      include: {
        medicines: true,
      },
    });

    const uniqueMedicines = new Set();
    prescriptions.forEach((prescription) => {
      prescription.medicines.forEach((medicine) => {
        uniqueMedicines.add(medicine.id);
      });
    });

    const totalActiveCount = adherenceRecords.filter(
      (r) => r.adherenceStatus !== "Pending"
    ).length;

    const takenCount = adherenceRecords.filter(
      (r) => r.adherenceStatus === "Taken"
    ).length;

    const missedCount = adherenceRecords.filter(
      (r) => r.adherenceStatus === "Missed"
    ).length;

    const pendingCount = adherenceRecords.filter(
      (r) => r.adherenceStatus === "Pending"
    ).length;

    const adherenceRate = totalActiveCount > 0
      ? (takenCount / totalActiveCount) * 100
      : 0;

    // Group by date to see daily adherence
    const dailyAdherence = {};
    adherenceRecords.forEach((record) => {
      const date = new Date(record.createdAt).toISOString().split("T")[0];
      if (!dailyAdherence[date]) {
        dailyAdherence[date] = { total: 0, taken: 0, missed: 0, pending: 0 };
      }

      dailyAdherence[date].total++;
      if (record.adherenceStatus === "Taken") {
        dailyAdherence[date].taken++;
      } else if (record.adherenceStatus === "Missed") {
        dailyAdherence[date].missed++;
      } else {
        dailyAdherence[date].pending++;
      }
    });

    const dailyStats = Object.keys(dailyAdherence).map((date) => {
      const activeTotal = dailyAdherence[date].taken + dailyAdherence[date].missed;
      return {
        date,
        ...dailyAdherence[date],
        adherenceRate: activeTotal > 0
          ? (dailyAdherence[date].taken / activeTotal) * 100
          : 0,
      };
    });

    const stats = {
      summary: {
        totalMedications: uniqueMedicines.size,
        takenCount,
        missedCount,
        pendingCount,
        adherenceRate: parseFloat(adherenceRate.toFixed(2)),
      },
      dailyStats,
    };

    return res.status(200).json(stats);
  } catch (err) {
    console.error("Error fetching medication adherence stats:", err);
    return res
      .status(500)
      .json({ message: "Error fetching adherence stats: " + err.message });
  }
};
