import { useState, useEffect } from 'react';
import axios from 'axios';
import AddPrescription from './AddPrescription';
import { format } from 'date-fns';
import { Calendar, User, PlusCircle, FileText, ArrowLeft, Clock } from 'lucide-react';

function RetirevePatient() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [error, setError] = useState(null);
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const [showPatientDetails, setShowPatientDetails] = useState(false);
  const [patientPrescriptions, setPatientPrescriptions] = useState([]);
  const [loadingPrescriptions, setLoadingPrescriptions] = useState(false);

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

        // Ensure each patient has an id field for consistent key usage
        const patientsWithConsistentIds = response.data.map(patient => ({
          ...patient,
          // Use existing id or _id, or generate a fallback
          uniqueId: patient.id || patient._id || `patient-${Math.random().toString(36).substr(2, 9)}`
        }));

        setPatients(patientsWithConsistentIds);
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

  const handleViewPatientDetails = async (patient) => {
    setSelectedPatient(patient);
    setShowPatientDetails(true);
    
    try {
      setLoadingPrescriptions(true);
      const token = localStorage.getItem('token');
      const patientId = patient.id || patient._id;
      
      if (patientId) {
        // Try to fetch using the doctor endpoint first
        try {
          const response = await axios.get(
            `http://localhost:8000/doctor/prescriptions/${patientId}`,
            {
              headers: {
                Authorization: `Bearer ${token}`
              }
            }
          );
          
          setPatientPrescriptions(response.data);
        } catch (error) {
          // If doctor endpoint fails, fall back to patient endpoint
          console.log("Falling back to patient endpoint for prescriptions");
          const fallbackResponse = await axios.get(
            `http://localhost:8000/patient/prescriptions/${patientId}`,
            {
              headers: {
                Authorization: `Bearer ${token}`
              }
            }
          );
          
          setPatientPrescriptions(fallbackResponse.data);
        }
      } else {
        console.error("Patient ID is missing");
      }
    } catch (err) {
      console.error("Error fetching patient prescriptions:", err);
      setPatientPrescriptions([]); // Ensure empty array on error
    } finally {
      setLoadingPrescriptions(false);
    }
  };

  const handleBackToPatientList = () => {
    setShowPatientDetails(false);
    setSelectedPatient(null);
    setPatientPrescriptions([]);
  };

  if (loading) {
    return <div className="text-center p-4 text-black">Loading patients...</div>;
  }

  if (error) {
    return <div className="text-red-500 p-4">{error}</div>;
  }

  if (showPatientDetails && selectedPatient) {
    return (
      <div className="container mx-auto p-4">
        <button 
          onClick={handleBackToPatientList}
          className="flex items-center text-blue-600 hover:text-blue-800 mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Patient List
        </button>
        
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col md:flex-row justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">{selectedPatient.name}</h2>
              <p className="text-gray-600 mb-1">{selectedPatient.email}</p>
              <div className="flex flex-wrap gap-4 mt-3">
                <div className="bg-gray-100 px-3 py-1 rounded text-gray-700">
                  Age: {selectedPatient.age || 'Not specified'}
                </div>
                <div className="bg-gray-100 px-3 py-1 rounded text-gray-700">
                  Gender: {selectedPatient.gender || 'Not specified'}
                </div>
                <div className="bg-gray-100 px-3 py-1 rounded text-gray-700">
                  Status: {selectedPatient.status || 'Active'}
                </div>
              </div>
            </div>
            <div className="mt-4 md:mt-0">
              <button
                onClick={() => handleAddPrescription(selectedPatient)}
                className="bg-blue-500 text-white px-4 py-2 rounded flex items-center hover:bg-blue-600"
              >
                <PlusCircle className="h-5 w-5 mr-2" />
                Add New Prescription
              </button>
            </div>
          </div>
        </div>
        
        <div className="mt-8">
          <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
            <FileText className="h-5 w-5 mr-2 text-blue-600" />
            Prescription History
          </h3>
          
          {loadingPrescriptions ? (
            <div className="text-center p-6 bg-white rounded-lg shadow-sm">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading prescriptions...</p>
            </div>
          ) : patientPrescriptions.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-6 text-center text-gray-600">
              No prescriptions found for this patient
            </div>
          ) : (
            <div className="space-y-4">
              {patientPrescriptions.map((prescription) => (
                <div key={prescription.id} className="bg-white rounded-lg shadow-sm p-5 border border-gray-200">
                  <div className="flex justify-between items-start mb-4 pb-3 border-b">
                    <div>
                      <div className="flex items-center text-gray-700 mb-1">
                        <Calendar className="h-4 w-4 mr-2 text-blue-600" />
                        <span className="font-medium">
                          {format(new Date(prescription.date), 'MMMM d, yyyy')}
                        </span>
                      </div>
                      <div className="flex items-center text-gray-600">
                        <Clock className="h-4 w-4 mr-2 text-gray-500" />
                        <span>{format(new Date(prescription.date), 'h:mm a')}</span>
                      </div>
                    </div>
                    <div className="bg-blue-50 px-2 py-1 rounded-full text-xs text-blue-600">
                      {prescription.medicines.length} medication{prescription.medicines.length !== 1 ? 's' : ''}
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    {prescription.medicines.map((med) => (
                      <div key={med.id} className="bg-gray-50 p-3 rounded">
                        <h5 className="font-medium text-gray-800">{med.medicineName}</h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2 text-sm text-gray-600">
                          <div>
                            <span className="text-gray-700">Dosage:</span> {med.dosage}
                          </div>
                          <div>
                            <span className="text-gray-700">Duration:</span> {med.duration}
                          </div>
                          <div className="md:col-span-2">
                            <span className="text-gray-700">Timing:</span> {Object.entries(med.timing)
                              .filter(([_, value]) => value === true)
                              .map(([key]) => key)
                              .join(', ')}
                          </div>
                          <div className="md:col-span-2">
                            <span className="text-gray-700">Instructions:</span> {med.instructions}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4 text-black">My Patients</h2>
      
      {patients.length === 0 ? (
        <p className="text-black">You haven't added any patients yet.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {patients.map((patient) => (
            <div key={patient.uniqueId} className="bg-white border p-4 rounded shadow-sm hover:shadow-md transition-shadow">
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
              <div className="mt-4 flex justify-end space-x-2">
                <button
                  onClick={() => handleViewPatientDetails(patient)}
                  className="bg-gray-100 text-gray-700 px-3 py-1 rounded hover:bg-gray-200"
                >
                  View Details
                </button>
                <button
                  onClick={() => handleAddPrescription(patient)}
                  className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
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
          patientId={selectedPatient.id || selectedPatient._id || selectedPatient.uniqueId}
          patientName={selectedPatient.name}
          onClose={handleClosePrescriptionModal}
        />
      )}
    </div>
  );
}

export default RetirevePatient;