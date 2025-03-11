import { useState, useEffect } from 'react';
import axios from 'axios';
import AddPrescription from './AddPrescription';

function RetirevePatient() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [error, setError] = useState(null);
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('Authentication token not found');
        }

        const response = await axios.get(
          'http://localhost:8000/doctor/retrievePatients',
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );

        setPatients(response.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching patients:', err);
        setError('Failed to load patients');
        setLoading(false);
      }
    };

    fetchPatients();
  }, []);

  const handleAddPrescription = (patient) => {
    setSelectedPatient(patient);
    setShowPrescriptionModal(true);
  };

  const handleClosePrescriptionModal = () => {
    setShowPrescriptionModal(false);
    setSelectedPatient(null);
  };

  if (loading) {
    return <div className="text-center p-4 text-black">Loading patients...</div>;
  }

  if (error) {
    return <div className="text-red-500 p-4">{error}</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4 text-black">My Patients</h2>
      
      {patients.length === 0 ? (
        <p className="text-black">You haven't added any patients yet.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {patients.map((patient) => (
            <div key={patient._id} className="border p-4 rounded shadow-sm">
              <h3 className="font-bold text-lg text-black">{patient.name}</h3>
              <p className="text-gray-600">{patient.email}</p>
              <div className="mt-2">
                <span className="text-sm text-gray-500">
                  Age: {patient.age || 'Not specified'}
                </span>
                <span className="text-sm text-gray-500 ml-4">
                  Gender: {patient.gender || 'Not specified'}
                </span>
              </div>
              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => handleAddPrescription(patient)}
                  className="bg-blue-500 text-white px-4 py-1 rounded hover:bg-blue-600"
                >
                  Add Prescription
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {showPrescriptionModal && selectedPatient && (
        <AddPrescription 
          patientId={selectedPatient.id || selectedPatient._id}
          patientName={selectedPatient.name}
          onClose={handleClosePrescriptionModal}
        />
      )}
    </div>
  );
}

export default RetirevePatient;