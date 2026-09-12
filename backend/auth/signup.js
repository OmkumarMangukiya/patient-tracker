import { tokenGenerate } from "./jwtToken.js";
import prisma from "../utils/client.js";
import bcrypt from "bcryptjs";

const signup = async (req, res) => {
  const { role } = req.body;

  try {
    if (role === "patient") {
      const { name, email, age, gender, password } = req.body;

      if (!email || !password || !name) {
        return res.status(400).json({ message: "Name, email, and password are required" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await prisma.patient.create({
        data: {
          name,
          age: age ? parseInt(age, 10) : null,
          gender,
          password: hashedPassword,
          email,
        },
      });

      const token = tokenGenerate({
        role,
        name,
        email,
        age,
        id: user.id,
      });

      return res.json({ msg: "done signup", token, role });
    } else if (role === "doctor") {
      const { name, email, password, specialization } = req.body;

      if (!email || !password || !name) {
        return res.status(400).json({ message: "Name, email, and password are required" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await prisma.doctor.create({
        data: {
          name,
          specialization: specialization || "General",
          password: hashedPassword,
          email,
        },
      });

      const token = tokenGenerate({
        role,
        name,
        email,
        id: user.id,
        specialization: user.specialization,
      });

      return res.json({ msg: "done signup", token, role });
    } else {
      return res.status(400).json({ message: "Invalid role. Role must be 'patient' or 'doctor'" });
    }
  } catch (err) {
    console.error("Error in creating user:", err);
    res.status(400).send("Error in creating user");
  }
};

export default signup;