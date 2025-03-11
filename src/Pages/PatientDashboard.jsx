import { useState, useEffect } from 'react';
import ViewPrescription from '../Components/ViewPrescription';

function PatientDashboard() {
  const [viewPrescriptions, setViewPrescriptions] = useState(false);
  const [patientId, setPatientId] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const decodedToken = JSON.parse(atob(token.split('.')[1]));
    const id = decodedToken.id;
    setPatientId(id);
  }, []);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4 text-black">Patient Dashboard</h1>
      
      <button
        onClick={() => setViewPrescriptions(!viewPrescriptions)}
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
      >
        {viewPrescriptions ? 'Hide Prescriptions' : 'View Prescriptions'}
      </button>

      {viewPrescriptions && patientId && <ViewPrescription patientId={patientId} />}
    </div>
  );
}

export default PatientDashboard;