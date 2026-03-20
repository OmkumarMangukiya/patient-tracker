import prisma from "../client.js";

const retrievePatients = async (req, res) => {
    try {
        const doctorId = String(req.user.id);
        
        const patient = await prisma.Patient.findMany({
            where: {
                doctors: {
                    some: {
                        id: doctorId
                    }
                }
            }
        });
        
        res.status(200).json(patient);
    } catch (err) {
        console.error('Error in retrieving patients:', err);
        res.status(500).send('Error in retrieving patients');
    }
};

export default retrievePatients;