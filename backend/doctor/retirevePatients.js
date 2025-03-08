import axios from "axios";
import prisma from "../client.js";
const retrievePatients = async (req,res) => {
    const doctorId = await req.params.doctorId;
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