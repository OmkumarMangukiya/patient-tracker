import React, { useState, useEffect } from 'react';
import apiClient from '../lib/apiClient';
import { useNavigate } from 'react-router-dom';
import RetrievePatient from '../Components/RetrievePatient';
import AddPatient from '../Components/AddPatient';
import AddPrescription from '../Components/AddPrescription';
import AppointmentList from '../Components/AppointmentList';
import EnhancedChatInterface from '../Components/Chat/EnhancedChatInterface';
import ConciseMedicationTracker from '../Components/ConciseMedicationTracker';
import {
  AreaChart,
  Bell,
  Calendar,
  FileText,
  Layers,
  LayoutDashboard,
  LifeBuoy,
  LogOut,
  Settings,
  User,
  Users,
  Plus,
  ListFilter,
  MessageSquare,
  ArrowLeft,
  PlusCircle,
  Clock,
  Trash2,
  AlertCircle,
  X,
  Stethoscope,
} from "lucide-react";

// Import shadcn components
import { Button } from '@/Components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/Components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/Components/ui/alert-dialog';

function DoctorDashboard({ initialTab }) {
  const [activeTab, setActiveTab] = useState(initialTab || 'patients');

  useEffect(() => {
    setActiveTab(initialTab || 'patients');
  }, [initialTab]);
  const [doctorData, setDoctorData] = useState(null);
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [selectedChatPatient, setSelectedChatPatient] = useState(null);
  const [previousTab, setPreviousTab] = useState(null);
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const [showPatientDetails, setShowPatientDetails] = useState(false);
  const [patientPrescriptions, setPatientPrescriptions] = useState([]);
  const [loadingPrescriptions, setLoadingPrescriptions] = useState(false);
  const [showConfirmRemoveModal, setShowConfirmRemoveModal] = useState(false);
  const [patientToRemove, setPatientToRemove] = useState(null);
  const [isRemoving, setIsRemoving] = useState(false);
  const [appointmentCounts, setAppointmentCounts] = useState({
    today: 0,
    upcoming: 0,
    total: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [prescriptionToDelete, setPrescriptionToDelete] = useState(null);
  const [isDeletingPrescription, setIsDeletingPrescription] = useState(false);
  const [deletePrescriptionError, setDeletePrescriptionError] = useState(null);
  const [deletePrescriptionSuccess, setDeletePrescriptionSuccess] = useState(null);
  const navigate = useNavigate();

  const fetchDoctorData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/');
        return;
      }

      const decodedToken = JSON.parse(atob(token.split('.')[1]));
      console.log('Decoded token:', decodedToken);
      setDoctorData(decodedToken);

      // Fetch patients
      const patientsResponse = await apiClient.get('/doctor/retrievePatients', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPatients(patientsResponse.data);
      console.log('Patients loaded:', patientsResponse.data);

      // Fetch appointment counts
      const appointmentsResponse = await apiClient.get('/doctor/appointments', {
        headers: { Authorization: `Bearer ${token}` }
      });

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const todayAppointments = appointmentsResponse.data.filter(
        appointment => {
          const appointmentDate = new Date(appointment.appointmentDate);
          return appointmentDate >= today && appointmentDate < tomorrow && appointment.status === 'scheduled';
        }
      );

      const upcomingAppointments = appointmentsResponse.data.filter(
        appointment => {
          const appointmentDate = new Date(appointment.appointmentDate);
          return appointmentDate >= tomorrow && appointment.status === 'scheduled';
        }
      );

      setAppointmentCounts({
        today: todayAppointments.length,
        upcoming: upcomingAppointments.length,
        total: appointmentsResponse.data.length
      });

      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching doctor data:', error);
      setError('Failed to load data. Please refresh and try again.');
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctorData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Function to handle patient selection for prescription
  const handleSelectPatientForPrescription = (patient) => {
    setSelectedPatient(patient);
    setShowPrescriptionModal(true);
  };

  // Function to close the prescription modal
  const handleClosePrescriptionModal = () => {
    setShowPrescriptionModal(false);
    setSelectedPatient(null);
  };

  // Function to handle viewing patient details
  const handleViewPatient = async (patientId) => {
    if (!patientId) {
      console.error('Patient ID is undefined or null');
      return;
    }

    try {
      setLoadingPrescriptions(true);

      // Find the selected patient using various ID properties
      const patient = patients.find(p =>
        (p._id && p._id === patientId) ||
        (p.id && p.id === patientId) ||
        (p.uniqueId && p.uniqueId === patientId)
      );

      if (patient) {
        setSelectedPatient(patient);
        setShowPatientDetails(true);
        setActiveTab('patient-details');

        // Fetch patient's prescriptions
        const token = localStorage.getItem('token');
        const response = await apiClient.get(`/doctor/prescriptions/${patientId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        setPatientPrescriptions(response.data);
      } else {
        console.error(`Patient with ID ${patientId} not found`);
      }

      setLoadingPrescriptions(false);
      setPrescriptionToDelete(null);
      setDeletePrescriptionError(null);
      setDeletePrescriptionSuccess(null);
    } catch (error) {
      console.error('Error fetching patient prescriptions:', error);
      setLoadingPrescriptions(false);
    }
  };

  // Function to handle contacting a patient
  const handleContactPatient = (patient) => {
    setSelectedChatPatient(patient);
    setPreviousTab(activeTab);
    setActiveTab('messages');
  };

  // Function to handle patient removal
  const handleRemovePatient = (patient) => {
    setPatientToRemove(patient);
    setShowConfirmRemoveModal(true);
  };

  // Function to confirm patient removal
  const confirmRemovePatient = async () => {
    if (!patientToRemove) return;

    try {
      setIsRemoving(true);
      const token = localStorage.getItem('token');

      // Get the patient ID, handling different ID properties
      const patientId = patientToRemove._id || patientToRemove.id || patientToRemove.uniqueId;

      // Make API call to remove doctor-patient relationship
      await apiClient.post(
        '/doctor/remove-patient',
        { patientId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Update local state to remove the patient
      setPatients(patients.filter(p =>
        (p._id !== patientId) && (p.id !== patientId) && (p.uniqueId !== patientId)
      ));

      // Close the confirmation modal
      setShowConfirmRemoveModal(false);
      setPatientToRemove(null);

      // If we're in the patient details view, go back to patients list
      if (activeTab === 'patient-details') {
        setShowPatientDetails(false);
        setActiveTab('patients');
      }

      setIsRemoving(false);
    } catch (error) {
      console.error('Error removing patient:', error);
      setIsRemoving(false);
      // Handle error as needed
    }
  };

  // Function to handle opening the delete prescription confirmation
  const handleDeletePrescription = (prescriptionId) => {
    setPrescriptionToDelete(prescriptionId);
    setDeletePrescriptionError(null);
    setDeletePrescriptionSuccess(null);
  };

  // Function to confirm and execute prescription deletion
  const confirmDeletePrescription = async () => {
    if (!prescriptionToDelete) return;

    setIsDeletingPrescription(true);
    setDeletePrescriptionError(null);
    setDeletePrescriptionSuccess(null);

    try {
      const token = localStorage.getItem('token');
      await apiClient.delete(`/doctor/prescription/${prescriptionToDelete}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Update local state to remove the prescription
      setPatientPrescriptions(prev => prev.filter(p => p.id !== prescriptionToDelete));
      setDeletePrescriptionSuccess('Prescription deleted successfully.');
      setPrescriptionToDelete(null);

    } catch (error) {
      console.error('Error deleting prescription:', error);
      setDeletePrescriptionError(error.response?.data?.message || 'Failed to delete prescription.');
    } finally {
      setIsDeletingPrescription(false);
    }
  };

  // Function to close the delete prescription dialog
  const closeDeletePrescriptionDialog = () => {
    setPrescriptionToDelete(null);
    setDeletePrescriptionError(null);
    setDeletePrescriptionSuccess(null);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="p-6">
            <h2 className="text-2xl font-bold mb-6">Dashboard Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{patients.length}</div>
                  <p className="text-xs text-muted-foreground">
                    {patients.length > 0 ? `${patients.length} patients registered` : 'No patients yet'}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Today's Appointments</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{appointmentCounts.today}</div>
                  <p className="text-xs text-muted-foreground">
                    {appointmentCounts.today > 0 ? `${appointmentCounts.today} appointments scheduled today` : 'No appointments today'}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Upcoming Appointments</CardTitle>
                  <AreaChart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{appointmentCounts.upcoming}</div>
                  <p className="text-xs text-muted-foreground">
                    {appointmentCounts.upcoming > 0 ? `${appointmentCounts.upcoming} upcoming appointments` : 'No upcoming appointments'}
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        );
      case 'patients':
        return (
          <div className="p-2 sm:p-4">
            <h2 className="text-xl font-bold mb-4 text-primary-container tracking-tight">Patient List</h2>

            {isLoading ? (
              <div className="flex justify-center items-center h-48">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"></div>
              </div>
            ) : error ? (
              <div className="bg-[#FFF5F5] border border-[#D93838]/40 text-[#D93838] px-4 py-3 rounded-xl text-xs">
                <p>{error}</p>
                <Button onClick={() => fetchDoctorData()} className="mt-2 bg-primary-container text-on-primary hover:bg-[#0d1322] text-xs h-8">
                  Try Again
                </Button>
              </div>
            ) : patients.length === 0 ? (
              <div className="text-center p-8 bg-surface-lowest rounded-2xl border border-outline-variant/60">
                <Users className="w-10 h-10 mx-auto text-on-surface-variant/60 mb-3" />
                <h3 className="text-base font-bold text-primary-container mb-1">No Patients Found</h3>
                <p className="text-xs text-on-surface-variant mb-4">You haven't added any patients yet.</p>
                <Button 
                  onClick={() => setActiveTab('add-patient')} 
                  className="bg-primary-container text-on-primary font-bold hover:bg-[#0d1322] shadow-xs text-xs px-4 py-2 rounded-xl"
                >
                  <Plus className="h-4 w-4 mr-1.5" />
                  Add Your First Patient
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-outline-variant/60 bg-surface-lowest">
                <table className="min-w-full">
                  <thead>
                    <tr className="bg-surface-container-low/50 text-on-surface-variant border-b border-outline-variant/60 text-xs uppercase tracking-wider font-bold">
                      <th className="py-2.5 px-4 text-left">Name</th>
                      <th className="py-2.5 px-4 text-left">Age</th>
                      <th className="py-2.5 px-4 text-left">Last Visit</th>
                      <th className="py-2.5 px-4 text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/40 text-xs">
                    {patients.map((patient) => (
                      <tr key={patient._id || patient.id || `patient-${patient.name}`} className="hover:bg-surface-container-low/30 transition-colors">
                        <td className="py-2.5 px-4 font-bold text-primary-container">{patient.name}</td>
                        <td className="py-2.5 px-4 text-on-surface-variant">{patient.age || 'N/A'}</td>
                        <td className="py-2.5 px-4 text-on-surface-variant">{patient.lastVisit ? new Date(patient.lastVisit).toLocaleDateString() : 'Never'}</td>
                        <td className="py-2.5 px-4">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleSelectPatientForPrescription(patient)}
                              className="text-primary hover:underline font-bold text-xs"
                            >
                              Prescribe
                            </button>
                            <span className="text-outline-variant">&bull;</span>
                            <button
                              onClick={() => {
                                const patientId = patient._id || patient.id || patient.uniqueId;
                                if (patientId) {
                                  handleViewPatient(patientId);
                                } else {
                                  console.error('Patient has no ID');
                                }
                              }}
                              className="text-primary-container hover:text-primary font-semibold text-xs"
                            >
                              Details
                            </button>
                            <span className="text-outline-variant">&bull;</span>
                            <button
                              onClick={() => handleContactPatient(patient)}
                              className="text-primary-container hover:text-primary font-semibold text-xs inline-flex items-center"
                            >
                              <MessageSquare className="h-3 w-3 inline mr-1" />
                              Chat
                            </button>
                            <span className="text-outline-variant">&bull;</span>
                            <button
                              onClick={() => handleRemovePatient(patient)}
                              className="text-[#D93838] hover:text-[#B82E2E] font-semibold text-xs inline-flex items-center"
                            >
                              <Trash2 className="h-3 w-3 inline mr-1" />
                              Remove
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      case 'add-patient':
        return (
          <div className="p-2 sm:p-4">
            <AddPatient />
          </div>
        );
      case 'add-prescription':
        return (
          <div className="p-2 sm:p-4">
            {selectedPatient ? (
              <AddPrescription
                patientId={selectedPatient._id || selectedPatient.id || selectedPatient.uniqueId}
                patientName={selectedPatient.name}
                onClose={() => setSelectedPatient(null)}
              />
            ) : (
              <div className="text-center p-8 bg-surface-lowest rounded-2xl border border-outline-variant/60">
                <FileText className="w-10 h-10 mx-auto text-on-surface-variant/60 mb-3" />
                <h3 className="text-base font-bold text-primary-container mb-1">No Patient Selected</h3>
                <p className="text-xs text-on-surface-variant mb-4">Please select a patient from the Patients tab to create a prescription.</p>
                <Button onClick={() => setActiveTab('patients')} className="bg-primary-container text-on-primary font-bold text-xs px-4 py-2 rounded-xl">
                  Go to Patients List
                </Button>
              </div>
            )}
          </div>
        );
      case 'appointments':
        return (
          <div className="p-2 sm:p-4">
            <AppointmentList userRole="doctor" />
          </div>
        );
      case 'messages':
        return (
          <div className="p-2 sm:p-4 h-full">
            <EnhancedChatInterface
              userRole="doctor"
              initialSelectedPatient={selectedChatPatient}
              onPatientSelect={() => setSelectedChatPatient(null)}
              onBack={() => {
                setSelectedChatPatient(null);
                if (previousTab) {
                  setActiveTab(previousTab);
                  setPreviousTab(null);
                } else if (selectedPatient) {
                  setActiveTab('patient-details');
                } else {
                  setActiveTab('patients');
                }
              }}
            />
          </div>
        );
      case 'patient-details':
        return (
          <div className="p-1 md:p-2">
            {selectedPatient ? (
              <div>
                {/* Patient Header */}
                <div className="mb-4 flex flex-col md:flex-row md:justify-between md:items-start gap-3 pb-3.5 border-b border-outline-variant/60">
                  <div>
                    <button
                      onClick={() => {
                        setShowPatientDetails(false);
                        setActiveTab('patients');
                      }}
                      className="inline-flex items-center text-xs font-semibold text-primary-container hover:text-primary bg-surface-container-low hover:bg-surface-container px-2.5 py-1 rounded-full transition-colors mb-2 cursor-pointer"
                    >
                      <ArrowLeft className="h-3.5 w-3.5 mr-1" />
                      Back to Patients
                    </button>
                    <h2 className="text-xl md:text-2xl font-bold text-primary-container tracking-tight">{selectedPatient.name}</h2>
                    <p className="text-xs text-on-surface-variant font-medium mt-0.5">{selectedPatient.email}</p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <div className="bg-surface-container-low/80 border border-outline-variant/60 px-2.5 py-0.5 rounded-full text-xs font-semibold text-primary-container">
                        Age: {selectedPatient.age || 'Not specified'}
                      </div>
                      {selectedPatient.phone && (
                        <div className="bg-surface-container-low/80 border border-outline-variant/60 px-2.5 py-0.5 rounded-full text-xs font-semibold text-primary-container">
                          Phone: {selectedPatient.phone}
                        </div>
                      )}
                      <div className="bg-surface-container-low/80 border border-outline-variant/60 px-2.5 py-0.5 rounded-full text-xs font-semibold text-primary-container">
                        Last Visit: {selectedPatient.lastVisit ? new Date(selectedPatient.lastVisit).toLocaleDateString() : 'Never'}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      onClick={() => handleSelectPatientForPrescription(selectedPatient)}
                      className="bg-primary-container hover:bg-[#0d1322] text-on-primary font-semibold flex items-center shadow-xs rounded-lg px-3 py-1.5 text-xs transition-all h-8"
                    >
                      <PlusCircle className="h-3.5 w-3.5 mr-1.5" />
                      Add Prescription
                    </Button>
                    <Button
                      onClick={() => handleContactPatient(selectedPatient)}
                      variant="outline"
                      className="border-outline-variant/60 bg-surface-lowest text-primary-container hover:bg-surface-container-low font-semibold flex items-center rounded-lg px-3 py-1.5 text-xs h-8"
                    >
                      <MessageSquare className="h-3.5 w-3.5 mr-1.5" />
                      Contact Patient
                    </Button>
                    <Button
                      onClick={() => handleRemovePatient(selectedPatient)}
                      className="border border-[#D93838]/40 bg-[#FFF5F5] hover:bg-[#FFEBEB] text-[#D93838] font-semibold flex items-center rounded-lg px-3 py-1.5 text-xs transition-colors shadow-none h-8"
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                      Remove Patient
                    </Button>
                  </div>
                </div>

                {/* Prescription Deletion Messages */}
                {deletePrescriptionError && (
                  <div className="mb-3 p-2.5 text-xs rounded-lg bg-[#FFF5F5] text-[#D93838] border border-[#D93838]/40">
                    {deletePrescriptionError}
                  </div>
                )}
                {deletePrescriptionSuccess && (
                  <div className="mb-3 p-2.5 text-xs rounded-lg bg-surface-container-low text-primary-container border border-outline-variant/60">
                    {deletePrescriptionSuccess}
                  </div>
                )}

                {/* Two-Column Side-by-Side Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                  {/* Left Column: Prescription History (7 cols) */}
                  <div className="lg:col-span-7 flex flex-col">
                    <h3 className="text-sm font-bold text-primary-container mb-2 flex items-center">
                      <FileText className="h-4 w-4 mr-1.5 text-primary-container" />
                      Prescription History
                    </h3>

                    {loadingPrescriptions ? (
                      <div className="text-center p-4 bg-surface-lowest rounded-xl border border-outline-variant/60">
                        <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-primary-container mx-auto"></div>
                        <p className="mt-1.5 text-xs text-on-surface-variant">Loading prescriptions...</p>
                      </div>
                    ) : patientPrescriptions.length === 0 ? (
                      <div className="bg-surface-container-low/40 rounded-xl border border-outline-variant/60 p-4 text-center text-xs font-medium text-on-surface-variant flex items-center justify-center min-h-[100px]">
                        No prescriptions found for this patient
                      </div>
                    ) : (
                      <div className="space-y-2.5 max-h-[340px] overflow-y-auto pr-1">
                        {patientPrescriptions.map((prescription, index) => (
                          <div key={prescription.id || `prescription-${index}`} className="bg-surface-lowest rounded-xl p-3 border border-outline-variant/60 shadow-xs">
                            <div className="flex justify-between items-start mb-2.5 pb-2 border-b border-outline-variant/40">
                              <div>
                                <div className="flex items-center text-on-surface mb-0.5 text-xs">
                                  <Calendar className="h-3.5 w-3.5 mr-1.5 text-primary-container" />
                                  <span className="font-semibold">
                                    {new Date(prescription.date).toLocaleDateString('en-US', {
                                      year: 'numeric',
                                      month: 'short',
                                      day: 'numeric'
                                    })}
                                  </span>
                                </div>
                                <div className="flex items-center text-on-surface-variant text-[11px]">
                                  <Clock className="h-3 w-3 mr-1 text-on-surface-variant" />
                                  <span>{new Date(prescription.date).toLocaleTimeString('en-US', {
                                    hour: 'numeric',
                                    minute: 'numeric'
                                  })}</span>
                                  <span className="mx-1.5">•</span>
                                  <span className="font-medium">Condition: {prescription.condition || 'General'}</span>
                                </div>
                              </div>
                              <div className="flex gap-1.5 items-center">
                                <div className="bg-secondary-container px-2 py-0.5 rounded-full text-[10px] font-semibold text-on-secondary-container">
                                  {prescription.medicines.length} med{prescription.medicines.length !== 1 ? 's' : ''}
                                </div>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="text-[#D93838] hover:bg-[#FFF5F5] h-6 w-6 rounded-md cursor-pointer"
                                      onClick={() => handleDeletePrescription(prescription.id)}
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                  </AlertDialogTrigger>
                                </AlertDialog>
                              </div>
                            </div>

                            <div className="space-y-1.5">
                              {prescription.medicines.map((med, index) => (
                                <div key={med.id || `med-${index}`} className="bg-surface-container-low/50 border border-outline-variant/40 p-2 rounded-lg text-xs">
                                  <div className="flex justify-between items-center">
                                    <h5 className="font-semibold text-on-surface text-xs">{med.medicineName}</h5>
                                    <span className="text-[11px] text-on-surface-variant">{med.dosage} • {med.duration}</span>
                                  </div>
                                  <div className="text-[11px] text-on-surface-variant mt-0.5">
                                    <span>Timing: {Object.entries(med.timing).filter(([_, value]) => value === true).map(([key]) => key).join(', ')}</span>
                                    {med.instructions && <span className="ml-2">• {med.instructions}</span>}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Right Column: Medication Adherence (5 cols) */}
                  <div className="lg:col-span-5 flex flex-col">
                    <h3 className="text-sm font-bold text-primary-container mb-2 flex items-center">
                      <Clock className="h-4 w-4 mr-1.5 text-primary-container" />
                      Medication Adherence
                    </h3>
                    <div className="bg-surface-lowest rounded-xl p-3 border border-outline-variant/60 shadow-xs">
                      <ConciseMedicationTracker
                        patientId={selectedPatient._id || selectedPatient.id || selectedPatient.uniqueId}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center p-6">
                <div className="text-on-surface-variant text-sm">No patient selected</div>
              </div>
            )}
          </div>
        );
      default:
        return (
          <div className="p-6 text-on-surface-variant">
            Select a tab
          </div>
        );
    }
  };

  return (
    <div className="w-full space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Premium Header Section */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center bg-surface-lowest rounded-2xl p-4 md:p-6 shadow-[0_10px_30px_rgba(12,30,38,0.03)] ring-1 ring-outline-variant/60">
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-primary-container">Doctor Dashboard</h1>
          <p className="text-xs md:text-sm text-on-surface-variant font-medium">Manage your patients, review health data, and organize your appointments seamlessly.</p>
        </div>
        <div className="flex flex-col md:flex-row items-end md:items-center gap-3 mt-4 md:mt-0">
          <Button 
            onClick={() => setActiveTab('add-patient')}
            className="flex items-center bg-primary-container text-on-primary font-semibold hover:bg-[#0d1322] shadow-xs rounded-xl px-4 py-2 text-xs md:text-sm"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            New Patient
          </Button>
          <div className="flex items-center bg-surface-variant p-2 pr-4 pl-2 rounded-full ring-1 ring-outline-variant/60">
            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center mr-3 text-primary shrink-0">
              <User className="h-5 w-5" />
            </div>
            <div>
              {doctorData ? (
                <>
                  <p className="font-bold text-xs md:text-sm text-primary-container leading-none">Dr. {doctorData.name}</p>
                  <p className="text-[11px] text-on-surface-variant font-medium mt-0.5">{doctorData.specialization || 'Physician'}</p>
                </>
              ) : (
                <>
                  <p className="font-bold text-xs text-primary-container leading-none">Loading...</p>
                  <p className="text-[11px] text-on-surface-variant font-medium mt-0.5">Please wait</p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="bg-surface-lowest rounded-2xl p-4 md:p-5 shadow-[0_10px_30px_rgba(12,30,38,0.03)] ring-1 ring-outline-variant/60">
        {renderTabContent()}
      </div>

      {/* Prescription Modal */}
      {showPrescriptionModal && selectedPatient && (
        <AddPrescription
          patientId={selectedPatient._id || selectedPatient.id || selectedPatient.uniqueId}
          patientName={selectedPatient.name}
          onClose={handleClosePrescriptionModal}
        />
      )}

      {/* Confirm Remove Patient Modal */}
      {showConfirmRemoveModal && patientToRemove && (
        <div className="fixed inset-0 bg-primary-container/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-surface-lowest rounded-lg shadow-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-[#D93838] flex items-center">
                <AlertCircle className="h-5 w-5 mr-2" />
                Remove Patient
              </h3>
              <button
                onClick={() => {
                  setShowConfirmRemoveModal(false);
                  setPatientToRemove(null);
                }}
                className="text-on-surface-variant hover:text-on-surface transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mb-6">
              <p className="text-on-surface mb-4">
                Are you sure you want to remove <span className="font-bold">{patientToRemove.name}</span> from your patient list?
              </p>
              <p className="text-on-surface-variant text-sm">
                This will remove the patient from your list, but their data will still be stored in the system.
              </p>
            </div>

            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowConfirmRemoveModal(false);
                  setPatientToRemove(null);
                }}
                disabled={isRemoving}
                className="text-primary-container"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={confirmRemovePatient}
                disabled={isRemoving}
                className="flex items-center text-white"
              >
                {isRemoving ? (
                  <>
                    <div className="h-4 w-4 border-2 border-t-transparent border-white rounded-full animate-spin mr-2"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Remove Patient
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Prescription Confirmation Dialog */}
      <AlertDialog open={!!prescriptionToDelete} onOpenChange={(open) => !open && closeDeletePrescriptionDialog()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Prescription?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this prescription? This action cannot be undone.
              Deleting this prescription will also remove associated medication tracking data for the patient.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {deletePrescriptionError && (
            <p className="text-sm text-[#D93838] mt-2">{deletePrescriptionError}</p>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel onClick={closeDeletePrescriptionDialog} disabled={isDeletingPrescription}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeletePrescription}
              disabled={isDeletingPrescription}
              className="bg-[#D93838] hover:bg-[#B82E2E] text-white"
            >
              {isDeletingPrescription ? 'Deleting...' : 'Delete Prescription'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}

export default DoctorDashboard;