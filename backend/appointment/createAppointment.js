import { Prisma } from "@prisma/client";
import prisma from "../utils/client.js";
import { normalizeToSlotStart } from "../utils/slotUtils.js";

const SLOT_UNAVAILABLE_MESSAGE = "This time slot is already booked";

const createAppointment = async (req, res) => {
  try {
    const patient = req.user;

    if (patient.role !== "patient") {
      return res.status(403).json({ error: "Only patients can book appointments" });
    }

    const { doctorId, appointmentDate, purpose } = req.body;

    if (!doctorId || !appointmentDate) {
      return res.status(400).json({ error: "Doctor ID and appointment date are required" });
    }

    const patientIdInt = parseInt(patient.id, 10);
    const doctorIdStr = String(doctorId);
    const slotStart = normalizeToSlotStart(new Date(appointmentDate));

    const doctor = await prisma.doctor.findUnique({
      where: { id: doctorIdStr },
    });

    if (!doctor) {
      return res.status(404).json({ error: "Doctor not found" });
    }

    const patientRecord = await prisma.patient.findFirst({
      where: {
        id: patientIdInt,
        doctors: {
          some: {
            id: doctorIdStr,
          },
        },
      },
    });

    if (!patientRecord) {
      return res.status(403).json({
        error: "You can only book appointments with your assigned doctors",
      });
    }

    // Fast-path check; the partial unique index is the real concurrency guard
    const conflictingAppointment = await prisma.appointment.findFirst({
      where: {
        doctorId: doctorIdStr,
        slotStart,
        status: { not: "cancelled" },
      },
    });

    if (conflictingAppointment) {
      return res.status(409).json({ error: SLOT_UNAVAILABLE_MESSAGE });
    }

    const appointment = await prisma.appointment.create({
      data: {
        patientId: patientIdInt,
        doctorId: doctorIdStr,
        appointmentDate: slotStart,
        slotStart,
        status: "scheduled",
        purpose: purpose || "General checkup",
      },
    });

    return res.status(201).json(appointment);
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return res.status(409).json({ error: SLOT_UNAVAILABLE_MESSAGE });
    }

    console.error("Error creating appointment:", error);
    return res.status(500).json({ error: "Failed to create appointment" });
  }
};

export default createAppointment;
