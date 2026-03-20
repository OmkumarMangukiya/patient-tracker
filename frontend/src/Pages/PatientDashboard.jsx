import { useState, useEffect, useCallback } from 'react';
import ViewPrescription from '../Components/ViewPrescription';
import MedicationTracker from '../Components/MedicationTracker';
import AppointmentBooking from '../Components/AppointmentBooking';
import AppointmentList from '../Components/AppointmentList';
import MessagesInterface from '../Components/Chat/MessagesInterface';
import apiClient from '../lib/apiClient';
import { Calendar, PieChart, PillIcon, Scroll, RefreshCw, MessageSquare } from 'lucide-react';
import io from 'socket.io-client';

function PatientDashboard({ initialTab }) {
  const [activeTab, setActiveTab] = useState(initialTab || 'medications');
  const [patientId, setPatientId] = useState(null);
  const [patientData, setPatientData] = useState(null);
  const [prescriptions, setPrescriptions] = useState([]);
  const [upcomingMedications, setUpcomingMedications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastRefreshed, setLastRefreshed] = useState(null);
  const [userName, setUserName] = useState('');

  useEffect(() => {
    setActiveTab(initialTab || 'medications');
  }, [initialTab]);

  const [viewMedications, setViewMedications] = useState(true);
  const [viewPrescriptions, setViewPrescriptions] = useState(false);
  const [stats, setStats] = useState({
    totalPrescriptions: 0,
    activeMedications: 0,
    adherenceRate: 0,
    upcomingAppointments: 0
  });
  const [socket, setSocket] = useState(null);

  const fetchUpcomingMedications = useCallback(async (id, token) => {
    try {
      setIsLoading(true);
      const response = await apiClient.get(
        `/patient/medications/today/${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          },
          params: {
            _t: new Date().getTime()
          }
        }
      );

      const pendingMedications = response.data.filter(
        med => med.adherenceStatus === 'Pending'
      );

      setUpcomingMedications(pendingMedications);
      setIsLoading(false);
      setLastRefreshed(new Date());
    } catch (error) {
      console.error('Error fetching upcoming medications:', error);
      setIsLoading(false);
      setError("Failed to load medication data. Please try refreshing the page.");
    }
  }, []);

  useEffect(() => {
    // Setup socket connection
    const newSocket = io(import.meta.env.VITE_API_URL || 'http://localhost:8000');
    setSocket(newSocket);

    // Cleanup on unmount
    return () => {
      if (newSocket) newSocket.disconnect();
    };
  }, []);

  useEffect(() => {
    // Listen for medication updates via socket if patientId is available
    if (socket && patientId) {
      const handleMedicationUpdate = (data) => {
        // Check if this update is for the current patient
        if (data.patientId === patientId) {
          console.log('Received medication update via WebSocket:', data);

          // Show a notification to the user
          if (data.message) {
            // You could use a toast notification library here
            alert(data.message);
          }

          // Refresh the data
          handleRefresh();
        }
      };

      // Listen for medication update events
      socket.on('medications-updated', handleMedicationUpdate);

      // Cleanup listener on unmount or when patientId/socket changes
      return () => {
        socket.off('medications-updated', handleMedicationUpdate);
      };
    }
  }, [socket, patientId]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setError("No authentication token found. Please log in again.");
          setIsLoading(false);
          return;
        }

        const decodedToken = JSON.parse(atob(token.split('.')[1]));
        const id = decodedToken.id;
        const name = decodedToken.name || 'Patient';
        setPatientId(id);
        setPatientData(decodedToken);
        setUserName(name);

        if (id) {
          // Fetch medications
          fetchUpcomingMedications(id, token);

          // Fetch prescriptions
          const prescriptionsResponse = await apiClient.get(
            `/patient/prescriptions/${id}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          setPrescriptions(prescriptionsResponse.data);

          // Fetch adherence stats
          const statsResponse = await apiClient.get(
            `/patient/medications/adherence-stats/${id}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );

          // Fetch upcoming appointments count
          const appointmentsResponse = await apiClient.get(
            '/patient/appointments',
            { headers: { Authorization: `Bearer ${token}` } }
          );

          const upcomingAppointments = appointmentsResponse.data.filter(
            appointment =>
              new Date(appointment.appointmentDate) > new Date() &&
              appointment.status === 'scheduled'
          ).length;

          setStats({
            totalPrescriptions: prescriptionsResponse.data.length,
            activeMedications: statsResponse.data.summary?.totalMedications || 0,
            adherenceRate: statsResponse.data.summary?.adherenceRate || 0,
            upcomingAppointments
          });
        }
      } catch (err) {
        console.error("Error loading patient data:", err);
        setError("Failed to load patient data. Please try again later.");
        setIsLoading(false);
      }
    };

    fetchData();
  }, [fetchUpcomingMedications]);

  useEffect(() => {
    if (!patientId) return;

    const refreshInterval = setInterval(() => {
      const token = localStorage.getItem('token');
      if (token && patientId) {
        fetchUpcomingMedications(patientId, token);
      }
    }, 60000);

    // Add event listener for medication updates
    const handleMedicationUpdate = () => {
      handleRefresh();
    };

    window.addEventListener('medicationUpdated', handleMedicationUpdate);

    return () => {
      clearInterval(refreshInterval);
      window.removeEventListener('medicationUpdated', handleMedicationUpdate);
    };
  }, [patientId, fetchUpcomingMedications]);

  // Manual refresh function
  const handleRefresh = () => {
    const token = localStorage.getItem('token');
    if (token && patientId) {
      fetchUpcomingMedications(patientId, token);

      // Also refresh adherence stats, prescriptions, and appointments
      apiClient.get(
        `/patient/medications/adherence-stats/${patientId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      ).then(statsResponse => {
        setStats(prevStats => ({
          ...prevStats,
          activeMedications: statsResponse.data.summary?.totalMedications || 0,
          adherenceRate: statsResponse.data.summary?.adherenceRate || 0
        }));
      }).catch(err => console.error("Error refreshing adherence stats:", err));

      // Refresh prescriptions
      apiClient.get(
        `/patient/prescriptions/${patientId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      ).then(prescriptionsResponse => {
        setPrescriptions(prescriptionsResponse.data);
        setStats(prevStats => ({
          ...prevStats,
          totalPrescriptions: prescriptionsResponse.data.length
        }));
      }).catch(err => console.error("Error refreshing prescriptions:", err));

      // Refresh appointments
      apiClient.get(
        '/patient/appointments',
        { headers: { Authorization: `Bearer ${token}` } }
      ).then(appointmentsResponse => {
        const upcomingAppointments = appointmentsResponse.data.filter(
          appointment =>
            new Date(appointment.appointmentDate) > new Date() &&
            appointment.status === 'scheduled'
        ).length;

        setStats(prevStats => ({
          ...prevStats,
          upcomingAppointments
        }));
      }).catch(err => console.error("Error refreshing appointments:", err));
    }
  };

  const getCurrentTimePeriod = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 18) return 'afternoon';
    return 'evening';
  };

  const getTimeEmoji = (time) => {
    switch (time) {
      case 'morning': return '🌅';
      case 'afternoon': return '☀️';
      case 'evening': return '🌙';
      default: return '⏰';
    }
  };

  const currentTimeMedications = upcomingMedications.filter(
    med => med.scheduledTime === getCurrentTimePeriod()
  );

  if (error) {
    return (
      <div className="p-4 md:p-8 flex items-center justify-center w-full">
        <div className="w-full max-w-md bg-surface-lowest rounded-3xl shadow-[0_20px_60px_rgba(12,30,38,0.05)] ring-1 ring-outline-variant/20 p-8 text-center">
          <div className="mb-4 bg-[#FFF5F5] ring-1 ring-[#FFE0E0] text-[#D93838] p-4 rounded-xl inline-block text-left w-full">
            <strong className="font-bold flex items-center mb-1">
              <svg className="h-4 w-4 mr-1.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              Error
            </strong>
            <span className="block text-sm leading-relaxed">{error}</span>
          </div>
          <button
            onClick={handleRefresh}
            className="w-full bg-linear-to-br from-primary to-primary-container text-on-primary font-bold py-3 rounded-full hover:shadow-[0_10px_20px_rgba(12,30,38,0.2)] hover:-translate-y-0.5 transition-all duration-300"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const switchToTab = (tab) => {
    setActiveTab(tab);
    if (tab === 'medications') {
      setViewMedications(true);
      setViewPrescriptions(false);
    } else if (tab === 'prescriptions') {
      setViewMedications(false);
      setViewPrescriptions(true);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div>
        {/* Header Section */}
        <div className="bg-surface-lowest rounded-3xl p-8 shadow-[0_20px_60px_rgba(12,30,38,0.05)] ring-1 ring-outline-variant/20 mb-8">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center">
            <div>
              <h1 className="text-3xl font-bold text-on-surface">Welcome back, {userName}!</h1>
              <p className="text-on-surface-variant">Here's your health overview for today</p>
            </div>
            <div className="flex items-center mt-4 md:mt-0">
              {lastRefreshed && (
                <span className="text-sm text-on-surface-variant mr-3">
                  Last updated: {lastRefreshed.toLocaleTimeString()}
                </span>
              )}
              <button
                onClick={handleRefresh}
                className="bg-surface-variant text-primary-container px-4 py-2 rounded-lg hover:bg-surface-container-highest flex items-center transition duration-200 font-medium ring-1 ring-outline-variant/20"
              >
                <RefreshCw className="h-5 w-5 mr-2" />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Stats Dashboard */}
        {activeTab === 'dashboard' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-surface-lowest rounded-xl shadow-md p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-lg bg-surface-container-low mr-4">
                  <Scroll className="h-6 w-6 text-primary-container" />
                </div>
                <div>
                  <p className="text-sm text-on-surface-variant">Prescriptions</p>
                  <p className="text-2xl font-bold text-on-surface">{stats.totalPrescriptions}</p>
                </div>
              </div>
            </div>

            <div className="bg-surface-lowest rounded-xl shadow-md p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-lg bg-surface-container-low mr-4">
                  <PillIcon className="h-6 w-6 text-primary-container" />
                </div>
                <div>
                  <p className="text-sm text-on-surface-variant">Active Medications</p>
                  <p className="text-2xl font-bold text-on-surface">{stats.activeMedications}</p>
                </div>
              </div>
            </div>

            <div className="bg-surface-lowest rounded-xl shadow-md p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-lg bg-surface-container-low mr-4">
                  <PieChart className="h-6 w-6 text-primary-container" />
                </div>
                <div>
                  <p className="text-sm text-on-surface-variant">Adherence Rate</p>
                  <p className="text-2xl font-bold text-on-surface">{stats.adherenceRate}%</p>
                </div>
              </div>
            </div>

            <div className="bg-surface-lowest rounded-xl shadow-md p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-lg bg-surface-container-low mr-4">
                  <Calendar className="h-6 w-6 text-primary-container" />
                </div>
                <div>
                  <p className="text-sm text-on-surface-variant">Upcoming Appointments</p>
                  <p className="text-2xl font-bold text-on-surface">{stats.upcomingAppointments}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Medication Reminders */}
        {!isLoading && currentTimeMedications.length > 0 && (
          <div className="bg-linear-to-r from-primary to-primary-container rounded-xl shadow-md p-6 mb-6 text-on-primary">
            <div className="flex items-center mb-4">
              <span className="text-3xl mr-3">{getTimeEmoji(getCurrentTimePeriod())}</span>
              <h2 className="text-2xl font-semibold">Time for your {getCurrentTimePeriod()} medications!</h2>
            </div>
            <p className="mb-4">
              You have {currentTimeMedications.length} medication{currentTimeMedications.length > 1 ? 's' : ''} to take now:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mb-4">
              {currentTimeMedications.map((med, index) => (
                <div key={med.id || index} className="bg-white/15 p-3 rounded-lg backdrop-blur-sm">
                  <div className="font-medium">{med.medicineName || med.medication}</div>
                  <div className="text-sm opacity-80">{med.dosage}</div>
                </div>
              ))}
            </div>
            <button
              onClick={() => switchToTab('medications')}
              className="bg-surface-lowest text-primary-container px-4 py-2 rounded-lg hover:bg-surface-container-low font-medium transition duration-200"
            >
              Mark as Taken
            </button>
          </div>
        )}

        {/* Navigation Tabs - Removed favoring Sidebar */}

        {/* Main Content */}
        <div className="bg-surface-lowest rounded-b-xl shadow-md p-6">
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-container"></div>
            </div>
          ) : (
            <>
              {activeTab === 'dashboard' && (
                <div className="mb-8">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-semibold text-on-surface">Recent Prescriptions</h3>
                    <button
                      onClick={() => switchToTab('prescriptions')}
                      className="text-primary-container hover:text-on-surface flex items-center text-sm font-medium transition-colors"
                    >
                      View All Prescriptions
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>

                  {prescriptions.length === 0 ? (
                    <p className="text-on-surface-variant">No prescriptions found</p>
                  ) : (
                    <div className="space-y-4">
                      {prescriptions.slice(0, 5).map((prescription) => (
                        <div key={prescription.id} className="border border-outline-variant/20 rounded-lg p-4 hover:bg-surface-container-low transition-colors">
                          <div className="flex justify-between">
                            <div>
                              <p className="font-medium text-on-surface">Dr. {prescription.doctor.name}</p>
                              <p className="text-sm text-on-surface-variant">
                                {new Date(prescription.date).toLocaleDateString()}
                                <span className="mx-2">•</span>
                                {prescription.medicines.length} medication{prescription.medicines.length !== 1 ? 's' : ''}
                              </p>
                            </div>
                            <button
                              onClick={() => switchToTab('prescriptions')}
                              className="text-primary-container hover:text-on-surface text-sm font-medium transition-colors"
                            >
                              Details
                            </button>
                          </div>

                          {/* Show a preview of medicines */}
                          {prescription.medicines.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-2">
                              {prescription.medicines.slice(0, 3).map(med => (
                                <div key={med.id} className="bg-secondary-container px-2 py-1 rounded text-xs text-on-secondary-container">
                                  {med.medicineName}
                                </div>
                              ))}
                              {prescription.medicines.length > 3 && (
                                <div className="bg-surface-container-low px-2 py-1 rounded text-xs text-on-surface-variant">
                                  +{prescription.medicines.length - 3} more
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}

                      {prescriptions.length > 5 && (
                        <div className="text-center pt-2">
                          <button
                            onClick={() => switchToTab('prescriptions')}
                            className="text-primary-container hover:text-on-surface text-sm font-medium transition-colors"
                          >
                            See {prescriptions.length - 5} more prescriptions
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'medications' && patientId && <MedicationTracker patientId={patientId} />}
              {activeTab === 'prescriptions' && patientId && <ViewPrescription patientId={patientId} />}
              {activeTab === 'appointments' && (
                <div className="space-y-8">
                  <AppointmentBooking />
                  <AppointmentList userRole="patient" />
                </div>
              )}
              {activeTab === 'messages' && (
                <div className="h-full">
                  <MessagesInterface userRole="patient" />
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default PatientDashboard;