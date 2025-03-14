import { useState, useEffect, useCallback } from 'react';
import ViewPrescription from '../Components/ViewPrescription';
import MedicationTracker from '../Components/MedicationTracker';
import axios from 'axios';

function PatientDashboard() {
  const [viewPrescriptions, setViewPrescriptions] = useState(false);
  const [viewMedications, setViewMedications] = useState(true);
  const [patientId, setPatientId] = useState(null);
  const [upcomingMedications, setUpcomingMedications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastRefreshed, setLastRefreshed] = useState(null);

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

      if (id) {
        fetchUpcomingMedications(id, token);
      }
    } catch (err) {
      console.error("Error parsing token:", err);
      setError("Authentication error. Please log in again.");
      setIsLoading(false);
    }
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

  // Manual refresh function for the refresh button
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
      <div className="container mx-auto p-4">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <strong className="font-bold">Error:</strong>
          <span className="block sm:inline"> {error}</span>
          <button
            onClick={handleRefresh}
            className="mt-2 bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-white">Patient Dashboard</h1>
        <div className="flex items-center">
          {lastRefreshed && (
            <span className="text-xs text-gray-300 mr-2">
              Last updated: {lastRefreshed.toLocaleTimeString()}
            </span>
          )}
          <button
            onClick={handleRefresh}
            className="bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600 flex items-center text-sm"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>
      </div>

      {/* Medication Reminders Alert */}
      {!isLoading && currentTimeMedications.length > 0 && (
        <div className="mb-6 bg-yellow-100 p-4 rounded-md border border-yellow-300 shadow-md">
          <h2 className="text-lg font-semibold text-yellow-800 flex items-center">
            {getTimeEmoji(getCurrentTimePeriod())} Medication Reminder
          </h2>
          <p className="text-yellow-800 mb-2">
            You have {currentTimeMedications.length} medication(s) to take for {getCurrentTimePeriod()}.
          </p>
          <div className="flex flex-wrap gap-2">
            {currentTimeMedications.map((med, index) => (
              <span key={med.id || index} className="bg-white px-2 py-1 rounded-md text-sm text-yellow-800 border border-yellow-300">
                {med.medicineName || med.medication}
              </span>
            ))}
          </div>
          <button
            onClick={() => {
              setViewPrescriptions(false);
              setViewMedications(true);
            }}
            className="mt-3 bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
          >
            Mark Medications
          </button>
        </div>
      )}

      <div className="flex mb-4 space-x-3">
        <button
          onClick={() => {
            setViewPrescriptions(false);
            setViewMedications(true);
          }}
          className={`${viewMedications ? 'bg-blue-600' : 'bg-blue-500'} text-white px-4 py-2 rounded hover:bg-blue-600 shadow-sm`}
        >
          Medication Tracker
        </button>

        <button
          onClick={() => {
            setViewPrescriptions(true);
            setViewMedications(false);
          }}
          className={`${viewPrescriptions ? 'bg-blue-600' : 'bg-blue-500'} text-white px-4 py-2 rounded hover:bg-blue-600 shadow-sm`}
        >
          View Prescriptions
        </button>
      </div>

      {viewPrescriptions && patientId && <ViewPrescription patientId={patientId} />}
      {viewMedications && patientId && <MedicationTracker patientId={patientId} />}
    </div>
  );
}

export default PatientDashboard;