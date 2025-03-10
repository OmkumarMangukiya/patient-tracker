import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Send an invitation email with password setup link
 * @param {string} patientEmail - Email address of the patient
 * @param {string} patientName - Name of the patient
 * @param {string} token - JWT token for password setup
 */
export const sendInviteEmail = async (patientEmail, patientName, token) => {
  const link = `${process.env.FRONTEND_URL}/set-password?token=${token}`;
  
  try {
    const response = await axios({
      method: 'post',
      url: 'https://api.sendinblue.com/v3/smtp/email',
      headers: {
        'Content-Type': 'application/json',
        'api-key': process.env.BREVO_API_KEY
      },
      data: {
        sender: {
          name: 'Patient Tracker',
          email: process.env.EMAIL_USER
        },
        to: [
          {
            email: patientEmail,
            name: patientName
          }
        ],
        subject: 'Welcome to Patient Tracker - Set Your Password',
        htmlContent: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #4a5568;">Welcome to Patient Tracker!</h2>
            <p>Hello ${patientName},</p>
            <p>You've been added to the Patient Tracker system by your doctor. Please set up your password to access your account.</p>
            <p><a href="${link}" style="background-color: #4299e1; color: white; padding: 10px 15px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0;">Set Your Password</a></p>
            <p>This link will expire in 24 hours for security purposes.</p>
            <p>If you didn't expect this email, please ignore it.</p>
            <p>Best regards,<br>Patient Tracker Team</p>
          </div>
        `
      }
    });
    
    console.log('Invitation email sent:', response.data);
    return true;
  } catch (error) {
    console.error('Error sending invitation email:', error.response?.data || error.message);
    return false;
  }
};

export default {
  sendInviteEmail
};
