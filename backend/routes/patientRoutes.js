import express from "express";
import { getPatientPrescriptions } from "../patient/prescriptions.js";
import {
  getTodayMedications,
  updateMedicationStatus,
  getMedicationHistory,
  getMedicationAdherenceStats,
} from "../patient/medications.js";
import getPatientAppointments from "../appointment/getPatientAppointments.js";
import { getChatsByPatient } from "../chat/chatController.js";

const router = express.Router();

router.get("/prescriptions/:patientId", getPatientPrescriptions);
router.get("/medications/today/:patientId", getTodayMedications);
router.post("/medications/update-status", updateMedicationStatus);
router.get("/medications/history/:patientId", getMedicationHistory);
router.get("/medications/adherence-stats/:patientId", getMedicationAdherenceStats);
router.get("/appointments", getPatientAppointments);
router.get("/chats", getChatsByPatient);

export default router;
