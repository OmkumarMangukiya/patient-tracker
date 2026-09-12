import prisma from "../utils/client.js";

const getPatientAppointments = async (req, res) => {
  try {
    const patient = req.user;

    if (patient.role !== "patient") {
      return res.status(403).json({ error: "Only patients can access this endpoint" });
    }

    const patientId = parseInt(patient.id, 10);
    const { status } = req.query;

    const whereClause = { patientId };

    if (status) {
      whereClause.status = status;
    }

    const appointments = await prisma.appointment.findMany({
      where: whereClause,
      include: {
        doctor: {
          select: {
            id: true,
            name: true,
            email: true,
            specialization: true,
          },
        },
      },
      orderBy: {
        appointmentDate: "asc",
      },
    });

    return res.status(200).json(appointments);
  } catch (error) {
    console.error("Error fetching patient appointments:", error);
    return res.status(500).json({ error: "Failed to fetch appointments" });
  }
};

export default getPatientAppointments;