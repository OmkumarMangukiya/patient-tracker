import prisma from "../utils/client.js";

const getAllDoctors = async (req, res) => {
  try {
    const doctors = await prisma.patient.findMany({
      include: {
        doctors: {
          select: {
            id: true,
            name: true,
            specialization: true,
            email: true,
          },
        },
      },
    });

    return res.status(200).json(doctors);
  } catch (err) {
    console.error("Error in retrieving doctors:", err);
    return res.status(500).json({ message: "Error in retrieving doctors" });
  }
};

export default getAllDoctors;