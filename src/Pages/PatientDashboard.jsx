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
  const [userName, setUserName] = useState('');

  const fetchUpcomingMedications = useCallback(async (id, token) => {
    try {
      setIsLoading(true);
      const response = await axios.get(
        `http://localhost:8000/patient/medications/today/${id}`,
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
      setUserName(name);

      if (id) {
        fetchUpcomingMedications(id, token);
      }
    } catch (err) {
      console.error("Error parsing token:", err);
      setError("Authentication error. Please log in again.");
      setIsLoading(false);
    }
  }, [fetchUpcomingMedications]);

  useEffect(() => {
    if (!patientId) return;

    const refreshInterval = setInterval(() => {
      const token = localStorage.getItem('token');
      if (token && patientId) {
        fetchUpcomingMedications(patientId, token);
      }
    }, 60000);

    return () => clearInterval(refreshInterval);
  }, [patientId, fetchUpcomingMedications]);

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

  const currentTimeMedications = upcomingMedications.filter(
    med => med.scheduledTime === getCurrentTimePeriod()
  );

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-xl shadow-md p-8">
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
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header Section */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Welcome back, {userName}!</h1>
              <p className="text-gray-600">Here's your medication overview for today</p>
            </div>
            <div className="flex items-center mt-4 md:mt-0">
              {lastRefreshed && (
                <span className="text-sm text-gray-500 mr-3">
                  Last updated: {lastRefreshed.toLocaleTimeString()}
                </span>
              )}
              <button
                onClick={handleRefresh}
                className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 flex items-center transition duration-200"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Medication Reminders */}
        {!isLoading && currentTimeMedications.length > 0 && (
          <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl shadow-md p-6 mb-6 text-white">
            <div className="flex items-center mb-4">
              <span className="text-3xl mr-3">{getTimeEmoji(getCurrentTimePeriod())}</span>
              <h2 className="text-2xl font-semibold">Time for your {getCurrentTimePeriod()} medications!</h2>
            </div>
            <p className="mb-4">
              You have {currentTimeMedications.length} medication{currentTimeMedications.length > 1 ? 's' : ''} to take now:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mb-4">
              {currentTimeMedications.map((med, index) => (
                <div key={med.id || index} className="bg-white bg-opacity-20 p-3 rounded-lg backdrop-blur-sm">
                  <div className="font-medium">{med.medicineName || med.medication}</div>
                  <div className="text-sm opacity-80">{med.dosage}</div>
                </div>
              ))}
            </div>
            <button
              onClick={() => {
                setViewPrescriptions(false);
                setViewMedications(true);
              }}
              className="bg-white text-blue-600 px-4 py-2 rounded-lg hover:bg-gray-100 font-medium transition duration-200"
            >
              Mark as Taken
            </button>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex mb-6 border-b border-gray-200">
          <button
            onClick={() => {
              setViewPrescriptions(false);
              setViewMedications(true);
            }}
            className={`${viewMedications ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'} px-4 py-2 font-medium text-sm focus:outline-none`}
          >
            <div className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Medication Tracker
            </div>
          </button>
          <button
            onClick={() => {
              setViewPrescriptions(true);
              setViewMedications(false);
            }}
            className={`${viewPrescriptions ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'} px-4 py-2 font-medium text-sm focus:outline-none`}
          >
            <div className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              My Prescriptions
            </div>
          </button>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-xl shadow-md p-6">
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <>
              {viewPrescriptions && patientId && <ViewPrescription patientId={patientId} />}
              {viewMedications && patientId && <MedicationTracker patientId={patientId} />}
            </>
          )}
        </div>

        {/* Quick Stats (Optional) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-lg font-medium text-gray-700 mb-2">Today's Medications</h3>
            <p className="text-3xl font-bold text-blue-600">
              {upcomingMedications.length}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-lg font-medium text-gray-700 mb-2">Due Now</h3>
            <p className="text-3xl font-bold text-indigo-600">
              {currentTimeMedications.length}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-lg font-medium text-gray-700 mb-2">Current Time</h3>
            <p className="text-2xl font-bold text-gray-800 capitalize">
              {getCurrentTimePeriod()} {getTimeEmoji(getCurrentTimePeriod())}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PatientDashboard;