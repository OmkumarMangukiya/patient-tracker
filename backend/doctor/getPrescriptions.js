import prisma from "../client.js";

export const getDoctorPrescriptionsByPatientId = async (req, res) => {
  try {
    if (req.user.role !== 'doctor') {
      return res.status(403).json({ message: "Unauthorized: Only doctors can access this endpoint" });
    }
    
    const doctorId = req.user.id;
    const { patientId } = req.params;
    
    if (!patientId) {
      return res.status(400).json({ message: "Patient ID is required" });
    }

    // Convert patientId to integer
    const patientIdInt = parseInt(patientId, 10);
    
    if (isNaN(patientIdInt)) {
      return res.status(400).json({ message: "Invalid patient ID format" });
    }

    // Check if patient exists
    const patient = await prisma.Patient.findUnique({
      where: { id: patientIdInt }
    });

    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    // Check if this doctor has access to this patient
    const doctorPatientRelation = await prisma.Patient.findFirst({
      where: {
        id: patientIdInt,
        doctors: {
          some: {
            id: doctorId
          }
        }
      }
    });

    if (!doctorPatientRelation) {
      return res.status(403).json({ message: "This patient is not assigned to you" });
    }

    // Fetch prescriptions for the patient
    const prescriptions = await prisma.Prescription.findMany({
      where: { patientId: patientIdInt },
      include: {
        medicines: true,
        doctor: {
          select: {
            name: true,
            specialization: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return res.status(200).json(prescriptions);
  } catch (err) {
    console.error('Error fetching doctor prescriptions:', err);
    return res.status(500).json({ message: "Error fetching prescriptions: " + err.message });
  }
}; 