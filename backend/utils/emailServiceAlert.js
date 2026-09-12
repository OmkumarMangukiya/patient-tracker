/**
 * Backward compatibility wrapper for emailServiceAlert.
 * All core email sending is now unified in utils/emailService.js.
 */
import { sendMedicationReminderEmail } from "./emailService.js";

export const emailServiceAlert = async () => {
  console.warn("Deprecated: emailServiceAlert called directly. Use utils/emailService.js instead.");
  return false;
};

export default emailServiceAlert;
