import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";

import { authenticate } from "./middleware/authMiddleware.js";
import { initScheduler, sendReminders } from "./scheduleTasks.js";
import { triggerMedicationReminder } from "./middleware/MedicationReminder.js";
import { checkForMissedMedications, configureSocketIO } from "./middleware/MissedMedicationChecker.js";
import { setupChatSocket } from "./chat/chatSocket.js";

// Routes
import authRoutes from "./routes/authRoutes.js";
import doctorRoutes from "./routes/doctorRoutes.js";
import patientRoutes from "./routes/patientRoutes.js";
import appointmentRoutes from "./routes/appointmentRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";
import medicineRoutes from "./routes/medicineRoutes.js";

dotenv.config();

const app = express();
const server = http.createServer(app);

// Initialize Socket.io
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

global.io = io;
configureSocketIO(io);
setupChatSocket(io);

app.use(express.json());
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    credentials: true,
  })
);

app.use((req, res, next) => {
  triggerMedicationReminder().catch(console.error);
  next();
});

app.use(checkForMissedMedications);

app.get("/", (req, res) => {
  res.send("Server is running");
});

// Mount Routes
app.use("/auth", authRoutes);
app.use("/doctor", authenticate, doctorRoutes);
app.use("/patient", authenticate, patientRoutes);
app.use("/appointments", authenticate, appointmentRoutes);
app.use("/chats", authenticate, chatRoutes);
app.use("/api/medicines", medicineRoutes);

// Test endpoint to send medication reminders manually
app.post("/admin/send-medication-reminders", async (req, res) => {
  try {
    const { timeOfDay = "morning" } = req.body;
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

const PORT = process.env.PORT || 8000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  initScheduler();
});

export default app;