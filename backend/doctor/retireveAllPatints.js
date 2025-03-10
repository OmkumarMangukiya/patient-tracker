import prisma from "../client.js"
const retrieveAllPatients = async (req,res) =>{
    try{
        
        const patients = await prisma.Patient.findMany({})
        res.status(200)
        return res.json(patients)
    }
    catch(err){
        console.error('Error in retrieving patients:', err);
        res.status(500).send('Error in retrieving patients');
    }
}
export default retrieveAllPatients;