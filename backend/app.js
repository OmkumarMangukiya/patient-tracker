import express from "express";
import dotenv from "dotenv";
dotenv.config();
import signup from "./auth/signup.js";
import signin from "./auth/signin.js";
import addPatient from "./doctor/addPatient.js";
import setPassword from "./auth/setPassword.js";
import retrievePatients from "./doctor/retirevePatients.js";
import retrieveAllPatients from "./doctor/retireveAllPatints.js";
import assignPatient from "./doctor/assign-patient.js";
import cors from "cors";
import prescription from "./doctor/prescription.js";
import { getMedicinesHandler } from "./utils/medicineData.js";
import { getPatientPrescriptions } from "./patient/prescriptions.js";
import {
  getTodayMedications,
  updateMedicationStatus,
  getMedicationHistory,
  getMedicationAdherenceStats,
} from "./patient/medications.js";
import { initScheduler } from "./scheduleTasks.js";
// Import the trigger function instead of middleware
import { triggerMedicationReminder } from "./middleware/MedicationReminder.js";

// Import appointment controllers
import createAppointment from "./appointment/createAppointment.js";
import getDoctorAppointments from "./appointment/getDoctorAppointments.js";
import getPatientAppointments from "./appointment/getPatientAppointments.js";
import updateAppointmentStatus from "./appointment/updateAppointmentStatus.js";
import getAvailableSlots from "./appointment/getAvailableSlots.js";

import { getDoctorPrescriptionsByPatientId } from "./doctor/getPrescriptions.js";

// Import chat controllers
import { createChat, getChatsByDoctor, getChatsByPatient, getChatById } from "./chat/chatController.js";
import { createMessage, getMessagesByChatId } from "./chat/messageController.js";

import http from "http";
import { Server } from "socket.io";

const app = express();
const server = http.createServer(app);

// Initialize Socket.io
const io = new Server(server, {
  cors: {
    origin: "*", // Configure as needed for production
    methods: ["GET", "POST"]
  }
});

app.use(express.json());
app.use("*", cors());

// Create a middleware that triggers reminders for ALL routes without interfering with responses
app.use((req, res, next) => {
  // Trigger reminders asynchronously without waiting for response
  triggerMedicationReminder().catch(console.error);
  next();
});

app.get("/", (req, res) => {
  res.send("Server is running");
});

app.post("/auth/signup", signup);
app.post("/auth/signin", signin);
app.get("/doctor/retrievePatients", retrievePatients);
app.post("/doctor/add-patient", addPatient);
app.post("/auth/set-password", setPassword);
app.get("/doctor/retrieveAllPatients", retrieveAllPatients);
app.post("/doctor/assign-patient", assignPatient);
app.get("/api/medicines", getMedicinesHandler);
app.post("/doctor/prescription", prescription);
app.get("/doctor/prescriptions/:patientId", getDoctorPrescriptionsByPatientId);
app.get("/patient/prescriptions/:patientId", getPatientPrescriptions);

// New medication tracking endpoints
app.get("/patient/medications/today/:patientId", getTodayMedications);
app.post("/patient/medications/update-status", updateMedicationStatus);
app.get("/patient/medications/history/:patientId", getMedicationHistory);
app.get(
  "/patient/medications/adherence-stats/:patientId",
  getMedicationAdherenceStats
);

// Appointment endpoints
app.post("/appointments", createAppointment);
app.get("/doctor/appointments", getDoctorAppointments);
app.get("/patient/appointments", getPatientAppointments);
app.post("/appointments/update-status", updateAppointmentStatus);
app.get("/appointments/available-slots", getAvailableSlots);

// Chat endpoints
app.post("/chats", createChat);
app.get("/doctor/chats", getChatsByDoctor);
app.get("/patient/chats", getChatsByPatient);
app.get("/chats/:chatId", getChatById);
app.post("/chats/:chatId/messages", createMessage);
app.get("/chats/:chatId/messages", getMessagesByChatId);

// Test endpoint to send medication reminders manually
app.post("/admin/send-medication-reminders", async (req, res) => {
  try {
    const { timeOfDay = "morning" } = req.body;
    const { sendReminders } = await import("./scheduleTasks.js");
    await sendReminders(timeOfDay);
    res.json({
      success: true,
      message: `${timeOfDay} medication reminders sent successfully`,
    });
  } catch (error) {
    console.error("Error sending medication reminders:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Socket.io connection handler
io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);
  
  // Join a chat room
  socket.on("join-chat", (chatId) => {
    socket.join(chatId);
    console.log(`User ${socket.id} joined chat ${chatId}`);
  });
  
  // Leave a chat room
  socket.on("leave-chat", (chatId) => {
    socket.leave(chatId);
    console.log(`User ${socket.id} left chat ${chatId}`);
  });
  
  // Handle new message
  socket.on("send-message", async (messageData) => {
    try {
      // Broadcast to all users in the chat room
      io.to(messageData.chatId).emit("receive-message", messageData);
    } catch (error) {
      console.error("Error handling message:", error);
      socket.emit("error", { message: "Failed to process message" });
    }
  });
  
  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

server.listen(8000, () => {
  console.log("Server is running on port 8000");

  // Initialize the medication reminder scheduler
  initScheduler();
});
