import express from "express";
import retrievePatients from "../doctor/retrievePatients.js";
import getAllDoctors from "../doctor/getAllDoctors.js";
import addPatient from "../doctor/addPatient.js";
import prescription from "../doctor/prescription.js";
import assignPatient from "../doctor/assign-patient.js";
import removePatient from "../doctor/remove-patient.js";
import { getDoctorPrescriptionsByPatientId } from "../doctor/getPrescriptions.js";
import deletePrescription from "../doctor/deletePrescription.js";
import { getPatientMedicationsTodayForDoctor } from "../doctor/medications.js";
import getDoctorAppointments from "../appointment/getDoctorAppointments.js";
import { getChatsByDoctor } from "../chat/chatController.js";

const router = express.Router();

router.get("/retrievePatients", retrievePatients);
router.get("/doctors", getAllDoctors);
router.post("/add-patient", addPatient);
router.post("/prescription", prescription);
router.post("/assign-patient", assignPatient);
router.post("/remove-patient", removePatient);
router.get("/prescriptions/:patientId", getDoctorPrescriptionsByPatientId);
router.delete("/prescription/:prescriptionId", deletePrescription);
router.get("/patient-medications/today/:patientId", getPatientMedicationsTodayForDoctor);
router.get("/appointments", getDoctorAppointments);
router.get("/chats", getChatsByDoctor);

export default router;
