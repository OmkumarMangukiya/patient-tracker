import prisma from "../utils/client.js";

const getDoctorAppointments = async (req, res) => {
  try {
    const doctor = req.user;

    if (doctor.role !== "doctor") {
      return res.status(403).json({ error: "Only doctors can access this endpoint" });
    }

    const doctorId = String(doctor.id);
    const { status, date } = req.query;

    const whereClause = { doctorId };

    if (status) {
      whereClause.status = status;
    }

    if (date) {
      const queryDate = new Date(date);
      const nextDay = new Date(queryDate);
      nextDay.setDate(nextDay.getDate() + 1);

      whereClause.appointmentDate = {
        gte: queryDate,
        lt: nextDay,
      };
    }

    const appointments = await prisma.appointment.findMany({
      where: whereClause,
      include: {
        patient: {
          select: {
            id: true,
            name: true,
            email: true,
            age: true,
            gender: true,
          },
        },
      },
      orderBy: {
        appointmentDate: "asc",
      },
    });

    return res.status(200).json(appointments);
  } catch (error) {
    console.error("Error fetching doctor appointments:", error);
    return res.status(500).json({ error: "Failed to fetch appointments" });
  }
};

export default getDoctorAppointments;