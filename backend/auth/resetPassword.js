import prisma from "../utils/client.js";
import { tokenVerify } from "./jwtToken.js";
import bcrypt from "bcryptjs";

const resetPassword = async (req, res) => {
  const { token, password } = req.body;

  if (!token || !password) {
    return res.status(400).json({ message: "Token and password are required" });
  }

  try {
    const decoded = tokenVerify(token);

    if (!decoded) {
      return res.status(400).json({ message: "Token is invalid or has expired" });
    }

    if (decoded.purpose !== "password-reset") {
      return res.status(400).json({ message: "Invalid token purpose: token not meant for password reset" });
    }

    if (!decoded.id || !decoded.role) {
      return res.status(400).json({ message: "Invalid token format: missing user information" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    if (decoded.role === "patient") {
      await prisma.patient.update({
        where: { id: parseInt(decoded.id, 10) },
        data: { password: hashedPassword },
      });
    } else if (decoded.role === "doctor") {
      await prisma.doctor.update({
        where: { id: String(decoded.id) },
        data: { password: hashedPassword },
      });
    } else {
      return res.status(400).json({ message: "Invalid user role in token" });
    }

    return res.status(200).json({
      message: "Password reset successfully",
      status: "success",
    });
  } catch (err) {
    console.error("Error resetting password:", err);
    return res.status(500).json({ message: "Error resetting password" });
  }
};

export default resetPassword;