import prisma from "../utils/client.js";

const updateAppointmentStatus = async (req, res) => {
  try {
    const user = req.user;
    const { appointmentId, status } = req.body;

    if (!appointmentId || !status) {
      return res.status(400).json({ error: "Appointment ID and status are required" });
    }

    // Validate status value
    const validStatuses = ["scheduled", "completed", "cancelled", "missed"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        error: "Invalid status. Must be one of: scheduled, completed, cancelled, missed",
      });
    }

    const appointmentIdStr = String(appointmentId);

    // Fetch the appointment
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentIdStr },
    });

    if (!appointment) {
      return res.status(404).json({ error: "Appointment not found" });
    }

    // Check permissions
    if (user.role === "doctor" && appointment.doctorId !== String(user.id)) {
      return res.status(403).json({ error: "You can only update your own appointments" });
    }

    if (user.role === "patient" && appointment.patientId !== parseInt(user.id, 10)) {
      return res.status(403).json({ error: "You can only update your own appointments" });
    }

    // Patients can only cancel appointments
    if (user.role === "patient" && status !== "cancelled") {
      return res.status(403).json({ error: "Patients can only cancel appointments" });
    }

    // Update the appointment
    const updatedAppointment = await prisma.appointment.update({
      where: { id: appointmentIdStr },
      data: { status },
    });

    return res.status(200).json(updatedAppointment);
  } catch (error) {
    console.error("Error updating appointment status:", error);
    return res.status(500).json({
      error: "Failed to update appointment status",
      details: error.message,
    });
  }
};

export default updateAppointmentStatus;