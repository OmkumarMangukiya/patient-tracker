import { useState, useEffect, useCallback } from 'react';
import ViewPrescription from '../Components/ViewPrescription';
import MedicationTracker from '../Components/MedicationTracker';
import AppointmentBooking from '../Components/AppointmentBooking';
import AppointmentList from '../Components/AppointmentList';
import axios from 'axios';
import { Calendar, PieChart, PillIcon, Scroll, RefreshCw } from 'lucide-react';

function PatientDashboard({ initialTab }) {
  const [activeTab, setActiveTab] = useState(initialTab || 'medications');
  const [patientId, setPatientId] = useState(null);
  const [patientData, setPatientData] = useState(null);
  const [prescriptions, setPrescriptions] = useState([]);
  const [upcomingMedications, setUpcomingMedications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastRefreshed, setLastRefreshed] = useState(null);
  const [stats, setStats] = useState({
    totalPrescriptions: 0,
    activeMedications: 0,
    adherenceRate: 0,
    upcomingAppointments: 0
  });

  // Memoize the fetch function to avoid recreating it on every render
  const fetchUpcomingMedications = useCallback(async (id, token) => {
    try {
      setIsLoading(true);
      const response = await axios.get(
        `http://localhost:8000/patient/medications/today/${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          },
          // Add cache-busting parameter to prevent caching
          params: {
            _t: new Date().getTime()
          }
        }
      );

      // Filter only pending medications
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
        setPatientId(id);
        setPatientData(decodedToken);

        if (id) {
          // Fetch medications
          fetchUpcomingMedications(id, token);
          
          // Fetch prescriptions
          const prescriptionsResponse = await axios.get(
            `http://localhost:8000/patient/prescriptions/${id}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          setPrescriptions(prescriptionsResponse.data);
          
          // Fetch adherence stats
          const statsResponse = await axios.get(
            `http://localhost:8000/patient/medications/adherence-stats/${id}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          
          // Fetch upcoming appointments count
          const appointmentsResponse = await axios.get(
            'http://localhost:8000/patient/appointments',
            { headers: { Authorization: `Bearer ${token}` } }
          );
          
          const upcomingAppointments = appointmentsResponse.data.filter(
            appointment => 
              new Date(appointment.appointmentDate) > new Date() && 
              appointment.status === 'scheduled'
          ).length;
          
          setStats({
            totalPrescriptions: prescriptionsResponse.data.length,
            activeMedications: statsResponse.data.totalMedications || 0,
            adherenceRate: statsResponse.data.overallAdherenceRate || 0,
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

  // Set up auto-refresh every minute to keep medication status updated
  useEffect(() => {
    if (!patientId) return;

    const refreshInterval = setInterval(() => {
      const token = localStorage.getItem('token');
      if (token && patientId) {
        console.log("Auto-refreshing medication data...");
        fetchUpcomingMedications(patientId, token);
      }
    }, 60000); // Refresh every minute

    return () => clearInterval(refreshInterval);
  }, [patientId, fetchUpcomingMedications]);

  // Manual refresh function
  const handleRefresh = () => {
    const token = localStorage.getItem('token');
    if (token && patientId) {
      fetchUpcomingMedications(patientId, token);
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

  // Filter medications due for the current time period
  const currentTimeMedications = upcomingMedications.filter(
    med => med.scheduledTime === getCurrentTimePeriod()
  );

  if (error) {
    return (
      <div className="container mx-auto p-4 bg-white text-black">
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded">
          <strong className="font-bold">Error:</strong>
          <span className="block sm:inline"> {error}</span>
          <button
            onClick={handleRefresh}
            className="mt-2 bg-red-100 text-red-800 px-3 py-1 rounded hover:bg-red-200"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="text-black">
            <h2 className="text-2xl font-semibold mb-6">Welcome, {patientData?.name}</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium">Prescriptions</h3>
                  <Scroll className="w-5 h-5 text-blue-600" />
                </div>
                <p className="text-2xl font-semibold">{stats.totalPrescriptions}</p>
              </div>
              
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium">Active Medications</h3>
                  <PillIcon className="w-5 h-5 text-green-600" />
                </div>
                <p className="text-2xl font-semibold">{stats.activeMedications}</p>
              </div>
              
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium">Adherence Rate</h3>
                  <PieChart className="w-5 h-5 text-amber-600" />
                </div>
                <p className="text-2xl font-semibold">{stats.adherenceRate}%</p>
              </div>
              
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium">Upcoming Appointments</h3>
                  <Calendar className="w-5 h-5 text-purple-600" />
                </div>
                <p className="text-2xl font-semibold">{stats.upcomingAppointments}</p>
              </div>
            </div>
            
            {/* Medication Reminders Alert */}
            {!isLoading && currentTimeMedications.length > 0 && (
              <div className="mb-6 bg-yellow-50 p-4 rounded-md border border-yellow-200 shadow-sm">
                <h2 className="text-lg font-semibold text-yellow-800 flex items-center">
                  {getTimeEmoji(getCurrentTimePeriod())} Medication Reminder
                </h2>
                <p className="text-yellow-800 mb-2">
                  You have {currentTimeMedications.length} medication(s) to take for {getCurrentTimePeriod()}.
                </p>
                <div className="flex flex-wrap gap-2">
                  {currentTimeMedications.map((med, index) => (
                    <span key={med.id || index} className="bg-white px-2 py-1 rounded-md text-sm text-yellow-800 border border-yellow-200">
                      {med.medicineName || med.medication}
                    </span>
                  ))}
                </div>
                <button
                  onClick={() => setActiveTab('medications')}
                  className="mt-3 bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                >
                  Mark Medications
                </button>
              </div>
            )}
            
            <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
              <h3 className="text-xl font-semibold mb-4">Recent Prescriptions</h3>
              
              {prescriptions.length === 0 ? (
                <p className="text-gray-500">No prescriptions found</p>
              ) : (
                <div className="space-y-4">
                  {prescriptions.slice(0, 3).map((prescription) => (
                    <div key={prescription.id} className="border-b pb-3">
                      <p className="font-medium">Dr. {prescription.doctor.name}</p>
                      <p className="text-sm text-gray-600">
                        {new Date(prescription.date).toLocaleDateString()}
                      </p>
                      <p className="text-sm mt-1">
                        {prescription.medicines.length} medications prescribed
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      
      case 'medications':
        return patientId && <MedicationTracker patientId={patientId} />;
      
      case 'prescriptions':
        return patientId && <ViewPrescription patientId={patientId} />;
      
      case 'appointments':
        return (
          <div className="space-y-8">
            <AppointmentBooking />
            <AppointmentList userRole="patient" />
          </div>
        );
      
      default:
        return <div>Select a tab</div>;
    }
  };

  return (
    <div className="container mx-auto p-4 bg-white text-black">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Patient Dashboard</h1>
        <div className="flex items-center">
          {lastRefreshed && (
            <span className="text-xs text-gray-500 mr-2">
              Last updated: {lastRefreshed.toLocaleTimeString()}
            </span>
          )}
          <button
            onClick={handleRefresh}
            className="flex items-center gap-1 text-sm bg-gray-100 text-gray-700 px-2 py-1 rounded hover:bg-gray-200"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>
      </div>
      
      <div className="bg-white shadow-sm p-4 mb-6 rounded-lg">
        <div className="flex overflow-x-auto">
          <button
            className={`px-4 py-2 font-medium text-sm rounded-md mr-2 ${
              activeTab === 'dashboard'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
            }`}
            onClick={() => setActiveTab('dashboard')}
          >
            Dashboard
          </button>
          
          <button
            className={`px-4 py-2 font-medium text-sm rounded-md mr-2 ${
              activeTab === 'medications'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
            }`}
            onClick={() => setActiveTab('medications')}
          >
            Medication Tracker
          </button>
          
          <button
            className={`px-4 py-2 font-medium text-sm rounded-md mr-2 ${
              activeTab === 'prescriptions'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
            }`}
            onClick={() => setActiveTab('prescriptions')}
          >
            Prescriptions
          </button>
          
          <button
            className={`px-4 py-2 font-medium text-sm rounded-md ${
              activeTab === 'appointments'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
            }`}
            onClick={() => setActiveTab('appointments')}
          >
            Appointments
          </button>
        </div>
      </div>
      
      <div>{renderTabContent()}</div>
    </div>
  );
}

export default PatientDashboard;