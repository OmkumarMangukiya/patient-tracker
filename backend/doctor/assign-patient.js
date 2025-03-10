const assignPatient = async (req,res) =>{
    const token = req.headers.authorization.split(' ')[1];
    const doctorId = tokenVerify(token).id;
    const patientId = req.body.patientId;
    try{
        const patient = await prisma.Patient.update({
            where:{
                id: patientId
            },
            data:{
                doctors:{
                    connect:{
                        id: doctorId
                    }
                }
            }
        })
        res.status(200)
        return res.json(patient)
    }
    catch(err){
        console.error('Error in assigning patient:', err);
        res.status(500).send('Error in assigning patient');
    }
}
export default assignPatient;