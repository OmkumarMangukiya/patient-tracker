import prisma from "../client.js";
import { tokenVerify } from "./jwtToken.js";
import bcrypt from "bcryptjs";

const setPassword = async (req, res) => {
  const { token, password } = req.body;

  if (!token || !password) {
    return res.status(400).json({ message: "Token and password are required" });
  }

  try {
    // Verify token
    const decoded = tokenVerify(token);
    if (!decoded || decoded.purpose !== 'password-setup') {
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update patient record
    const patient = await prisma.Patient.update({
      where: { id: decoded.patientId },
      data: {
        password: hashedPassword,
        status: 'active'
      }
    });

    return res.status(200).json({ 
      message: "Password set successfully",
      status: 'success'
    });
  } catch (err) {
    console.error('Error setting password:', err);
    return res.status(500).json({ message: "Error setting password" });
  }
};

export default setPassword;
