import { tokenVerify } from "../auth/jwtToken.js";
import prisma from "../client.js";
const retrievePatients = async (req,res) => {
    const token = req.headers.authorization.split(' ')[1];
    const doctorId = tokenVerify(token).id;
    try{
        
        const patient = await prisma.Patient.findMany({
            where:{
                doctors: {
                    some: {
                        id: doctorId
                    }
                }
            }
        })
        res.status(200)
        return res.json(patient)
    }
    catch(err){
        console.error('Error in retrieving patients:', err);
        res.status(500).send('Error in retrieving patients');
    }
};
export default retrievePatients;