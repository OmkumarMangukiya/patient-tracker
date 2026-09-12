import prisma from "../utils/client.js";
import { tokenVerify } from "./jwtToken.js";
import bcrypt from "bcryptjs";

const setPassword = async (req, res) => {
  const { token, password } = req.body;

  if (!token || !password) {
    return res.status(400).json({ message: "Token and password are required" });
  }

  try {
    const decoded = tokenVerify(token);

    if (!decoded) {
      return res.status(400).json({ message: "Token is invalid or has expired" });
    }

    if (!decoded.purpose || decoded.purpose !== "password-setup") {
      return res.status(400).json({ message: "Invalid token purpose: token not meant for password setup" });
    }

    if (!decoded.patientId) {
      return res.status(400).json({ message: "Invalid token format: missing patient ID" });
    }

    const patientExists = await prisma.patient.findUnique({
      where: { id: decoded.patientId },
    });

    if (!patientExists) {
      return res.status(404).json({ message: "Patient not found" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.patient.update({
      where: { id: decoded.patientId },
      data: {
        password: hashedPassword,
        status: "active",
      },
    });

    return res.status(200).json({
      message: "Password set successfully",
      status: "success",
    });
  } catch (err) {
    console.error("Error setting password:", err);
    return res.status(500).json({ message: "Error setting password" });
  }
};

export default setPassword;
