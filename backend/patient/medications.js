import prisma from "../client.js";
import { tokenVerify } from "../auth/jwtToken.js";

// Get today's medications for a patient
export const getTodayMedications = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    
    if (!token) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    const decoded = tokenVerify(token);
    if (!decoded || decoded.role !== 'patient') {
      return res.status(403).json({ message: "Unauthorized: Only patients can view medications" });
    }
    
    const { patientId } = req.params;
    
    if (!patientId) {
      return res.status(400).json({ message: "Patient ID is required" });
    }

    // Get current date in YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0];
    
    // Get medications for today - use createdAt instead of scheduledDate if schema not updated
    try {
      const medications = await prisma.MedicineAdherence.findMany({
        where: {
          patientId: parseInt(patientId),
          scheduledDate: today
        },
        orderBy: {
          createdAt: 'asc'
        }
      });

      if (medications.length > 0) {
        // Get unique times from existing medications to ensure we show all time periods
        const existingTimes = [...new Set(medications.map(med => med.scheduledTime))];
        
        // Get prescriptions to extract any time periods that might be missing
        const prescriptions = await prisma.Prescription.findMany({
          where: {
            patientId: parseInt(patientId)
          },
          include: {
            medicines: true
          }
        });
        
        // Check if all time periods from prescriptions exist in our medications
        // If not, generate medications for those missing periods
        const additionalMeds = [];
        for (const prescription of prescriptions) {
          for (const medicine of prescription.medicines) {
            const timing = medicine.timing;
            
            // Check each time period
            for (const timeOfDay of ['morning', 'afternoon', 'evening']) {
              if (timing[timeOfDay] && !existingTimes.includes(timeOfDay)) {
                additionalMeds.push({
                  medicineId: medicine.id,
                  medicineName: medicine.medicineName,
                  dosage: medicine.dosage,
                  instructions: medicine.instructions,
                  scheduledTime: timeOfDay,
                  adherenceStatus: 'Pending',
                  prescriptionId: prescription.id
                });
              }
            }
          }
        }
        
        return res.status(200).json([...medications, ...additionalMeds]);
      }
    } catch (prismaError) {
      console.log('Database query error, trying alternative query method:', prismaError.message);
      
      // Fallback: Query without scheduledDate if not available in schema
      const medications = await prisma.MedicineAdherence.findMany({
        where: {
          patientId: parseInt(patientId),
          createdAt: {
            gte: new Date(today),
            lt: new Date(new Date(today).setDate(new Date(today).getDate() + 1))
          }
        },
        orderBy: {
          createdAt: 'asc'
        }
      });
      
      if (medications.length > 0) {
        return res.status(200).json(medications);
      }
    }

    // If no specific medications found for today, get from prescriptions
    const prescriptions = await prisma.Prescription.findMany({
      where: {
        patientId: parseInt(patientId)
      },
      include: {
        medicines: true
      }
    });

    // Process prescriptions to create medication schedule
    const currentMedications = [];
    
    for (const prescription of prescriptions) {
      for (const medicine of prescription.medicines) {
        // Create morning, afternoon, evening entries if specified in timing
        const timing = medicine.timing;
        
        if (timing.morning) {
          currentMedications.push({
            medicineId: medicine.id,
            medicineName: medicine.medicineName,
            dosage: medicine.dosage,
            instructions: medicine.instructions,
            scheduledTime: 'morning',
            adherenceStatus: 'Pending',
            prescriptionId: prescription.id
          });
        }
        
        if (timing.afternoon) {
          currentMedications.push({
            medicineId: medicine.id,
            medicineName: medicine.medicineName,
            dosage: medicine.dosage,
            instructions: medicine.instructions,
            scheduledTime: 'afternoon',
            adherenceStatus: 'Pending',
            prescriptionId: prescription.id
          });
        }
        
        if (timing.evening) {
          currentMedications.push({
            medicineId: medicine.id,
            medicineName: medicine.medicineName,
            dosage: medicine.dosage,
            instructions: medicine.instructions,
            scheduledTime: 'evening',
            adherenceStatus: 'Pending',
            prescriptionId: prescription.id
          });
        }
      }
    }
    
    return res.status(200).json(currentMedications);
  } catch (err) {
    console.error('Error fetching medications:', err);
    return res.status(500).json({ message: "Error fetching medications: " + err.message });
  }
};

// Update medication status (taken/missed)
export const updateMedicationStatus = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    
    if (!token) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    const decoded = tokenVerify(token);
    if (!decoded || decoded.role !== 'patient') {
      return res.status(403).json({ message: "Unauthorized: Only patients can update medication status" });
    }
    
    const { id, status, patientId, isNewMedication, medication, prescriptionId, medicineId, scheduledTime } = req.body;
    
    if (!status || !patientId) {
      return res.status(400).json({ message: "Status and patient ID are required" });
    }

    // If this is a new medication record (from prescription data, not yet in MedicineAdherence table)
    if (isNewMedication || id.startsWith('temp-')) {
      console.log("Creating new medication record");
      const today = new Date().toISOString().split('T')[0];
      
      const newMedication = await prisma.MedicineAdherence.create({
        data: {
          patientId: parseInt(patientId),
          medication: medication,
          adherenceStatus: status,
          missedDoses: status === 'Missed' ? 1 : 0,
          reminderSent: true,
          prescriptionId,
          medicineId,
          scheduledTime,
          scheduledDate: today
        }
      });
      
      return res.status(201).json(newMedication);
    } else {
      // This is an existing record, update it
      console.log("Updating existing medication record:", id);
      
      if (!id) {
        return res.status(400).json({ message: "Medication ID is required for updates" });
      }
      
      // Check if the medication record exists
      const existingMedication = await prisma.MedicineAdherence.findUnique({
        where: { id }
      });

      if (existingMedication) {
        // Update existing record
        const updatedMedication = await prisma.MedicineAdherence.update({
          where: { id },
          data: {
            adherenceStatus: status,
            missedDoses: status === 'Missed' ? existingMedication.missedDoses + 1 : existingMedication.missedDoses
          }
        });
        
        return res.status(200).json(updatedMedication);
      } else {
        return res.status(404).json({ message: "Medication record not found" });
      }
    }
  } catch (err) {
    console.error('Error updating medication status:', err);
    return res.status(500).json({ message: "Error updating medication status: " + err.message });
  }
};

// Get medication history for a patient
export const getMedicationHistory = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    
    if (!token) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    const decoded = tokenVerify(token);
    if (!decoded || decoded.role !== 'patient') {
      return res.status(403).json({ message: "Unauthorized: Only patients can view medication history" });
    }
    
    const { patientId } = req.params;
    const { days = 7 } = req.query; // Default to 7 days of history
    
    if (!patientId) {
      return res.status(400).json({ message: "Patient ID is required" });
    }

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));
    
    const history = await prisma.MedicineAdherence.findMany({
      where: {
        patientId: parseInt(patientId),
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return res.status(200).json(history);
  } catch (err) {
    console.error('Error fetching medication history:', err);
    return res.status(500).json({ message: "Error fetching medication history: " + err.message });
  }
};

// Get medication adherence statistics
export const getMedicationAdherenceStats = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    
    if (!token) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    const decoded = tokenVerify(token);
    
    const { patientId } = req.params;
    const { days = 30 } = req.query; // Default to 30 days of stats
    
    if (!patientId) {
      return res.status(400).json({ message: "Patient ID is required" });
    }

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));
    
    // Get all medication records in the date range
    const adherenceRecords = await prisma.MedicineAdherence.findMany({
      where: {
        patientId: parseInt(patientId),
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      }
    });

    // Calculate statistics
    const totalCount = adherenceRecords.length;
    const takenCount = adherenceRecords.filter(r => r.adherenceStatus === 'Taken').length;
    const missedCount = adherenceRecords.filter(r => r.adherenceStatus === 'Missed').length;
    const pendingCount = adherenceRecords.filter(r => r.adherenceStatus === 'Pending').length;
    
    // Calculate adherence rate (taken / (taken + missed + pending))
    const adherenceRate = totalCount > 0 ? (takenCount / totalCount) * 100 : 0;
    
    // Group by date to see daily adherence
    const dailyAdherence = {};
    adherenceRecords.forEach(record => {
      const date = new Date(record.createdAt).toISOString().split('T')[0];
      if (!dailyAdherence[date]) {
        dailyAdherence[date] = { total: 0, taken: 0, missed: 0, pending: 0 };
      }
      
      dailyAdherence[date].total++;
      if (record.adherenceStatus === 'Taken') {
        dailyAdherence[date].taken++;
      } else if (record.adherenceStatus === 'Missed') {
        dailyAdherence[date].missed++;
      } else {
        dailyAdherence[date].pending++;
      }
    });
    
    // Convert to array for easier frontend processing
    const dailyStats = Object.keys(dailyAdherence).map(date => ({
      date,
      ...dailyAdherence[date],
      adherenceRate: (dailyAdherence[date].taken / dailyAdherence[date].total) * 100
    }));

    const stats = {
      summary: {
        totalMedications: totalCount,
        takenCount,
        missedCount,
        pendingCount,
        adherenceRate: parseFloat(adherenceRate.toFixed(2))
      },
      dailyStats
    };

    return res.status(200).json(stats);
  } catch (err) {
    console.error('Error fetching medication adherence stats:', err);
    return res.status(500).json({ message: "Error fetching adherence stats: " + err.message });
  }
};
