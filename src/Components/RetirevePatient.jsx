import axios from "axios";
import { useState, useEffect } from "react";
function RetirevePatient () {
    const [patients, setPatients] = useState([]);
    
    const getPatients = async() => {
        try{
            const token = localStorage.getItem('token');
            
            const response = await axios.get(`http://localhost:8000/doctor/retrievePatients/`,{
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            setPatients(response.data);
        }
        catch(err){
            console.error('Error in retrieving patients:', err);
        }
    }

    useEffect(() => {
        getPatients();
    }, []);
    
    return (
        <div>
            <p>
                {patients.map((patient, index) => (
                    <div key={index}>{patient.name}</div>
                ))}
            </p>
        </div>
    )
}
export default RetirevePatient;