import prisma from '../client.js';
import { tokenVerify } from '../auth/jwtToken.js';

// Store a reference to Socket.io instance
let io;

/**
 * Configure the middleware with Socket.io instance
 */
export const configureSocketIO = (socketIO) => {
  io = socketIO;
};

/**
 * Middleware to automatically check for and mark missed medications
 * whenever a patient accesses their dashboard or medication data
 */
export const checkForMissedMedications = async (req, res, next) => {
  try {
    // Only process for authenticated patient requests
    const token = req.headers.authorization?.split(" ")[1];
    
    if (!token) {
      return next();
    }
    
    // Try to decode the token
    try {
      const decoded = tokenVerify(token);
      
      // Only process for patient users
      if (decoded && decoded.role === 'patient') {
        const patientId = decoded.id;
        
        // Get current date in YYYY-MM-DD format
        const today = new Date().toISOString().split("T")[0];
        
        // Get current time period
        const currentTime = getCurrentTimePeriod();
        
        // Find all pending medications for this patient for today
        // that are scheduled for an earlier time period
        const pendingMedications = await prisma.MedicineAdherence.findMany({
          where: {
            patientId: parseInt(patientId, 10),
            scheduledDate: today,
            adherenceStatus: 'Pending',
            scheduledTime: {
              in: getPreviousTimePeriods(currentTime)
            }
          }
        });
        
        // Mark these medications as missed
        let markedAnyMedications = false;
        for (const med of pendingMedications) {
          await prisma.MedicineAdherence.update({
            where: { id: med.id },
            data: {
              adherenceStatus: 'Missed',
              missedDoses: {
                increment: 1
              }
            }
          });
          
          markedAnyMedications = true;
          console.log(`[Middleware] Auto-marked medication ${med.id} as missed for patient ${patientId}`);
        }
        
        if (pendingMedications.length > 0) {
          console.log(`[Middleware] Auto-marked ${pendingMedications.length} medications as missed for patient ${patientId}`);
          
          // Notify frontend via WebSocket if any medications were marked
          if (markedAnyMedications && io) {
            io.emit('medications-updated', { 
              patientId: patientId,
              count: pendingMedications.length
            });
          }
        }
      }
    } catch (tokenError) {
      // If token is invalid, just continue with the request
      console.error("Token verification error in missed medication middleware:", tokenError);
    }
  } catch (error) {
    console.error("Error in missed medication middleware:", error);
    // Continue with the request even if there's an error in this middleware
  }
  
  // Always continue with the request
  next();
};

/**
 * Function to directly check and mark missed medications for a patient
 * This can be called from other parts of the application
 */
export const directlyCheckMissedMedications = async (patientId) => {
  try {
    if (!patientId) return;
    
    // Get current date in YYYY-MM-DD format
    const today = new Date().toISOString().split("T")[0];
    
    // Get current time period
    const currentTime = getCurrentTimePeriod();
    
    // Find all pending medications for this patient for today
    // that are scheduled for an earlier time period
    const pendingMedications = await prisma.MedicineAdherence.findMany({
      where: {
        patientId: parseInt(patientId, 10),
        scheduledDate: today,
        adherenceStatus: 'Pending',
        scheduledTime: {
          in: getPreviousTimePeriods(currentTime)
        }
      }
    });
    
    // Mark these medications as missed
    let markedAnyMedications = false;
    for (const med of pendingMedications) {
      await prisma.MedicineAdherence.update({
        where: { id: med.id },
        data: {
          adherenceStatus: 'Missed',
          missedDoses: {
            increment: 1
          }
        }
      });
      
      markedAnyMedications = true;
    }
    
    if (pendingMedications.length > 0) {
      console.log(`[Direct Check] Auto-marked ${pendingMedications.length} medications as missed for patient ${patientId}`);
      
      // Notify frontend via WebSocket if any medications were marked
      if (markedAnyMedications && io) {
        io.emit('medications-updated', { 
          patientId: patientId,
          count: pendingMedications.length
        });
      }
      
      return pendingMedications.length;
    }
    
    return 0;
  } catch (error) {
    console.error("Error in direct missed medication check:", error);
    return 0;
  }
};

/**
 * Helper to get the current time period (morning, afternoon, evening)
 */
function getCurrentTimePeriod() {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 18) return 'afternoon';
  return 'evening';
}

/**
 * Helper to get all time periods that come before the current one
 */
function getPreviousTimePeriods(currentPeriod) {
  const timeOrder = ['morning', 'afternoon', 'evening'];
  const currentIndex = timeOrder.indexOf(currentPeriod);
  
  if (currentIndex <= 0) return []; // Morning has no previous periods
  
  return timeOrder.slice(0, currentIndex);
} 