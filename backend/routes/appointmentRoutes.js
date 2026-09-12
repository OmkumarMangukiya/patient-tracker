import express from "express";
import createAppointment from "../appointment/createAppointment.js";
import updateAppointmentStatus from "../appointment/updateAppointmentStatus.js";
import getAvailableSlots from "../appointment/getAvailableSlots.js";

const router = express.Router();

router.post("/", createAppointment);
router.post("/update-status", updateAppointmentStatus);
router.get("/available-slots", getAvailableSlots);

export default router;
