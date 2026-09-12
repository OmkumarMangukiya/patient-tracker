import prisma from "../utils/client.js";
import { tokenVerify } from "../auth/jwtToken.js";

let io;

// Configure the middleware with Socket.io instance
export const configureSocketIO = (socketIO) => {
  io = socketIO;
};

// function to get the current time period (morning, afternoon, evening)
function getCurrentTimePeriod() {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return "morning";
  if (hour >= 12 && hour < 18) return "afternoon";
  return "evening";
}

// function to get all time periods that come before the current one
function getPreviousTimePeriods(currentPeriod) {
  const timeOrder = ["morning", "afternoon", "evening"];
  const currentIndex = timeOrder.indexOf(currentPeriod);

  if (currentIndex <= 0) return []; // Morning has no previous periods
  return timeOrder.slice(0, currentIndex);
}

/**
 * Middleware to automatically check for and mark missed medications
 * whenever an authenticated patient accesses the system.
 */
export const checkForMissedMedications = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return next();
    }

    const token = authHeader.split(" ")[1];
    const decoded = req.user || tokenVerify(token);

    if (decoded && decoded.role === "patient") {
      const patientId = parseInt(decoded.id, 10);
      const today = new Date().toISOString().split("T")[0];
      const currentTime = getCurrentTimePeriod();
      const previousPeriods = getPreviousTimePeriods(currentTime);

      if (previousPeriods.length > 0) {
        const pendingMedications = await prisma.medicineAdherence.findMany({
          where: {
            patientId,
            scheduledDate: today,
            adherenceStatus: "Pending",
            scheduledTime: {
              in: previousPeriods,
            },
          },
        });

        if (pendingMedications.length > 0) {
          for (const med of pendingMedications) {
            await prisma.medicineAdherence.update({
              where: { id: med.id },
              data: {
                adherenceStatus: "Missed",
                missedDoses: {
                  increment: 1,
                },
              },
            });
          }

          if (io) {
            io.emit("medications-updated", {
              patientId,
              count: pendingMedications.length,
            });
          }
        }
      }
    }
  } catch (error) {
    console.error("Error in missed medication middleware:", error);
  }
  next();
};