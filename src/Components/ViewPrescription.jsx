import { useState, useEffect } from 'react';
import axios from 'axios';

function ViewPrescription({ patientId }) {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPrescriptions = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('Authentication token not found');
        }

        const response = await axios.get(
          `http://localhost:8000/patient/prescriptions/${patientId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );

        setPrescriptions(response.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching prescriptions:', err);
        setError('Failed to load prescriptions');
        setLoading(false);
      }
    };

    fetchPrescriptions();
  }, [patientId]);

  if (loading) {
    return <div className="text-center p-4 text-black">Loading prescriptions...</div>;
  }

  if (error) {
    return <div className="text-red-500 p-4">{error}</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4 text-black">My Prescriptions</h2>
      
      {prescriptions.length === 0 ? (
        <p className="text-black">You have no prescriptions yet.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {prescriptions.map((prescription) => (
            <div key={prescription.id} className="border p-4 rounded shadow-sm hover:shadow-md transition-shadow">
              <h3 className="font-bold text-lg text-black">Prescription Date: {new Date(prescription.date).toLocaleDateString()}</h3>
              <p className="text-gray-600">Doctor: {prescription.doctor.name}</p>
              <div className="mt-2">
                <h4 className="font-semibold text-black">Medicines:</h4>
                <ul className="mt-2 space-y-2">
                  {prescription.medicines.map((med) => (
                    <li key={med.id} className="bg-blue-50 p-2 rounded border border-blue-100">
                      <div className="font-medium text-black">{med.medicineName}</div>
                      <div className="text-sm text-gray-600">
                        <div>Dosage: {med.dosage}</div>
                        <div>Duration: {med.duration}</div>
                        <div>Timing: {Object.entries(med.timing)
                          .filter(([_, value]) => value === true)
                          .map(([key]) => key)
                          .join(', ')}
                        </div>
                        <div>Instructions: {med.instructions}</div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ViewPrescription;
