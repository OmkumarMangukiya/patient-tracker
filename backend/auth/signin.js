import dotenv from "dotenv";
import { tokenGenerate } from "./jwtToken.js";
import prisma from "../utils/client.js";
import bcrypt from "bcryptjs";

dotenv.config();

const signin = async (req, res) => {
  const { email, password, role } = req.body;

  if (!email || !password || !role) {
    return res.status(400).json({ message: "Email, password, and role are required" });
  }

  try {
    let user;
    if (role === "patient") {
      user = await prisma.patient.findUnique({
        where: { email },
      });
    } else if (role === "doctor") {
      user = await prisma.doctor.findUnique({
        where: { email },
      });
    } else {
      return res.status(400).json({ message: "Invalid role specified" });
    }

    if (!user || !user.password) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const token = tokenGenerate({
      id: user.id,
      email: user.email,
      name: user.name,
      role: role,
      specialization: role === "doctor" ? user.specialization : undefined,
    });

    return res.json({
      message: "Sign-in successful",
      token,
      role,
    });
  } catch (err) {
    console.error("Error in signing in:", err);
    res.status(500).json({ message: err.message });
  }
};

export default signin;
