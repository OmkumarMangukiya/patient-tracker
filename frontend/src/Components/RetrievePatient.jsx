import { useState, useEffect } from 'react';
import apiClient from '../lib/apiClient';
import { useNavigate } from 'react-router-dom';
import AddPrescription from './AddPrescription';
import { format } from 'date-fns';
import { Calendar, User, PlusCircle, FileText, ArrowLeft, Clock, Search } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Input } from './ui/input';

function RetrievePatient({ onAddPrescription }) {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [error, setError] = useState(null);
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const [showPatientDetails, setShowPatientDetails] = useState(false);
  const [patientPrescriptions, setPatientPrescriptions] = useState([]);
  const [loadingPrescriptions, setLoadingPrescriptions] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('Authentication token not found');
        }

        const response = await apiClient.get(
          '/doctor/retrievePatients',
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

  const handleSearch = (event) => {
    setSearchTerm(event.target.value);
  };

  const filteredPatients = patients.filter(patient => {
    const lowerSearchTerm = searchTerm.toLowerCase();
    return (
      patient.name.toLowerCase().includes(lowerSearchTerm) ||
      patient.email.toLowerCase().includes(lowerSearchTerm)
    );
  });

  const handleAddPrescription = (patient) => {
    // If handler provided by parent, use that (for integrated modal approach)
    if (onAddPrescription) {
      onAddPrescription(patient);
    } else {
      // Otherwise use local state for standalone component
      setSelectedPatient(patient);
      setShowPrescriptionModal(true);
    }
  };

  const handleClosePrescriptionModal = () => {
    setShowPrescriptionModal(false);
    setSelectedPatient(null);
  };

  const handleViewPatientDetails = async (patient) => {
    setSelectedPatient(patient);
    setShowPatientDetails(true);
    setLoadingPrescriptions(true);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('Authentication token not found');
        setLoadingPrescriptions(false);
        return;
      }

      const patientId = patient.id || patient._id || patient.uniqueId;
      const response = await apiClient.get(`/doctor/prescriptions/${patientId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      setPatientPrescriptions(response.data);
      setLoadingPrescriptions(false);
    } catch (error) {
      console.error('Error fetching patient prescriptions:', error);
      setLoadingPrescriptions(false);
    }
  };

  const handleBackToPatientList = () => {
    setShowPatientDetails(false);
    setSelectedPatient(null);
    setPatientPrescriptions([]);
  };

  if (loading) {
    return <div className="text-center p-4 text-primary-container">Loading patients...</div>;
  }

  if (error) {
    return <div className="text-red-500 p-4">{error}</div>;
  }

  if (showPatientDetails && selectedPatient) {
    return (
      <div className="w-full p-2 sm:p-4 animate-in fade-in duration-300">
        <button
          onClick={handleBackToPatientList}
          className="flex items-center text-xs font-bold text-primary hover:underline mb-4"
        >
          <ArrowLeft className="h-3.5 w-3.5 mr-1" />
          Back to Patient List
        </button>

        <div className="bg-surface-lowest rounded-2xl shadow-xs border border-outline-variant/60 p-4 sm:p-5 mb-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
            <div>
              <h2 className="text-xl font-bold text-primary-container mb-0.5">{selectedPatient.name}</h2>
              <p className="text-xs text-on-surface-variant font-medium">{selectedPatient.email}</p>
              <div className="flex flex-wrap gap-2 mt-2.5">
                <div className="bg-surface-variant/50 border border-outline-variant/60 px-2.5 py-0.5 rounded-md text-xs font-medium text-primary-container">
                  Age: {selectedPatient.age || 'N/A'}
                </div>
                <div className="bg-surface-variant/50 border border-outline-variant/60 px-2.5 py-0.5 rounded-md text-xs font-medium text-primary-container">
                  Gender: {selectedPatient.gender || 'N/A'}
                </div>
                <div className="bg-surface-variant/50 border border-outline-variant/60 px-2.5 py-0.5 rounded-md text-xs font-medium text-primary-container">
                  Status: {selectedPatient.status || 'Active'}
                </div>
              </div>
            </div>
            <div>
              <button
                onClick={() => handleAddPrescription(selectedPatient)}
                className="bg-primary-container text-on-primary px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center hover:bg-[#0d1322] transition-colors shadow-xs"
              >
                <PlusCircle className="h-4 w-4 mr-1.5" />
                Add New Prescription
              </button>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-bold text-primary-container uppercase tracking-wider mb-3 flex items-center">
            <FileText className="h-4 w-4 mr-1.5 text-primary" />
            Prescription History
          </h3>

          {loadingPrescriptions ? (
            <div className="text-center p-8 bg-surface-lowest rounded-2xl border border-outline-variant/60">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent mx-auto"></div>
              <p className="mt-2 text-xs text-on-surface-variant font-medium">Loading prescriptions...</p>
            </div>
          ) : patientPrescriptions.length === 0 ? (
            <div className="bg-surface-lowest rounded-2xl border border-outline-variant/60 p-6 text-center text-xs text-on-surface-variant font-medium">
              No prescriptions found for this patient
            </div>
          ) : (
            <div className="space-y-3">
              {patientPrescriptions.map((prescription) => (
                <div key={prescription.id} className="bg-surface-lowest rounded-xl p-3.5 sm:p-4 border border-outline-variant/60 shadow-xs">
                  <div className="flex justify-between items-start mb-3 pb-2.5 border-b border-outline-variant/60">
                    <div>
                      <div className="flex items-center text-primary-container text-xs font-bold mb-0.5">
                        <Calendar className="h-3.5 w-3.5 mr-1.5 text-primary" />
                        <span>
                          {format(new Date(prescription.date), 'MMMM d, yyyy')}
                        </span>
                      </div>
                      <div className="flex items-center text-[11px] text-on-surface-variant font-medium">
                        <Clock className="h-3 w-3 mr-1.5 opacity-60" />
                        <span>{format(new Date(prescription.date), 'h:mm a')}</span>
                      </div>
                    </div>
                    <div className="bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-md text-[11px] font-bold text-primary">
                      {prescription.medicines.length} medication{prescription.medicines.length !== 1 ? 's' : ''}
                    </div>
                  </div>

                  <div className="space-y-2">
                    {prescription.medicines.map((med) => (
                      <div key={med.id} className="bg-surface-container-lowest p-2.5 rounded-lg border border-outline-variant/40">
                        <h5 className="font-bold text-xs text-primary-container">{med.medicineName}</h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5 mt-1.5 text-[11px] text-on-surface-variant font-medium">
                          <div>
                            <span className="font-semibold text-primary-container">Dosage:</span> {med.dosage}
                          </div>
                          <div>
                            <span className="font-semibold text-primary-container">Duration:</span> {med.duration}
                          </div>
                          <div className="md:col-span-2">
                            <span className="font-semibold text-primary-container">Timing:</span> {Object.entries(med.timing)
                              .filter(([_, value]) => value === true)
                              .map(([key]) => key)
                              .join(', ')}
                          </div>
                          <div className="md:col-span-2">
                            <span className="font-semibold text-primary-container">Instructions:</span> {med.instructions}
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
    <div className="w-full p-2 sm:p-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-3">
        <div>
          <h2 className="text-xl font-bold text-primary-container tracking-tight">My Patients</h2>
          <p className="text-xs text-on-surface-variant font-medium">Browse and manage assigned patients</p>
        </div>
        <div className="relative w-full md:w-64">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-on-surface-variant opacity-60" />
          </div>
          <Input
            type="text"
            placeholder="Search patients..."
            value={searchTerm}
            onChange={handleSearch}
            className="pl-9 h-8.5 text-xs rounded-xl border-outline-variant/60 bg-surface-lowest text-primary-container w-full"
          />
        </div>
      </div>

      {filteredPatients.length === 0 ? (
        <div className="bg-surface-lowest rounded-2xl border border-outline-variant/60 p-8 text-center">
          <p className="text-xs font-medium text-on-surface-variant">No patients found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredPatients.map(patient => (
            <div key={patient.id} className="bg-surface-lowest rounded-2xl border border-outline-variant/60 hover:border-primary/40 shadow-xs hover:shadow-sm transition-all duration-200 overflow-hidden flex flex-col justify-between">
              <div className="p-3.5 bg-surface-container-low/40 border-b border-outline-variant/60 flex items-center">
                <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mr-2.5 shrink-0 text-primary">
                  <User className="h-4 w-4" />
                </div>
                <div className="overflow-hidden">
                  <h3 className="font-bold text-xs text-primary-container truncate">{patient.name}</h3>
                  <p className="text-[11px] text-on-surface-variant truncate">{patient.email}</p>
                </div>
              </div>

              <div className="p-3.5 flex flex-col justify-between flex-1">
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider font-bold text-on-surface-variant">Patient ID</p>
                    <p className="text-xs font-semibold text-primary-container truncate">{patient.id}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider font-bold text-on-surface-variant">Status</p>
                    <p className={`text-xs font-bold ${patient.status === 'active' ? 'text-[#15803D]' : 'text-[#D97706]'}`}>
                      {patient.status || 'Active'}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => handleViewPatientDetails(patient)}
                  className="w-full py-1.5 px-3 rounded-lg text-xs font-bold bg-surface-variant/50 hover:bg-surface-variant text-primary-container border border-outline-variant/60 hover:border-primary/30 flex items-center justify-center transition-colors"
                >
                  <FileText className="h-3.5 w-3.5 mr-1 text-primary" />
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Standalone Prescription Modal (only used when not integrated with parent) */}
      {!onAddPrescription && showPrescriptionModal && selectedPatient && (
        <AddPrescription
          patientId={selectedPatient.id || selectedPatient._id || selectedPatient.uniqueId}
          patientName={selectedPatient.name}
          onClose={handleClosePrescriptionModal}
        />
      )}
    </div>
  );
}

export default RetrievePatient;