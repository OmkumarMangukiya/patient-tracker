import prisma from "../utils/client.js";

const retrievePatients = async (req, res) => {
  try {
    const doctorId = String(req.user.id);

    const patients = await prisma.patient.findMany({
      where: {
        doctors: {
          some: {
            id: doctorId,
          },
        },
      },
    });

    return res.status(200).json(patients);
  } catch (err) {
    console.error("Error in retrieving patients:", err);
    return res.status(500).json({ message: "Error in retrieving patients" });
  }
};

export default retrievePatients;