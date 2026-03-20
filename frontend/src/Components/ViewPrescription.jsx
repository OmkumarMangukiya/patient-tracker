import { useState, useEffect } from 'react';
import apiClient from '../lib/apiClient';
import { format } from 'date-fns';
import { ChevronDown, ChevronUp, Calendar, User, Stethoscope } from 'lucide-react';

function ViewPrescription({ patientId }) {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortBy, setSortBy] = useState('date');
  const [sortDirection, setSortDirection] = useState('desc'); // newest first by default

  useEffect(() => {
    const fetchPrescriptions = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('Authentication token not found');
        }

        const response = await apiClient.get(
          `/patient/prescriptions/${patientId}`,
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

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDirection('desc');
    }
  };

  const sortedPrescriptions = [...prescriptions].sort((a, b) => {
    if (sortBy === 'date') {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
    }
    if (sortBy === 'doctor') {
      const doctorA = a.doctor.name.toLowerCase();
      const doctorB = b.doctor.name.toLowerCase();
      return sortDirection === 'asc'
        ? doctorA.localeCompare(doctorB)
        : doctorB.localeCompare(doctorA);
    }
    return 0;
  });

  if (loading) {
    return (
      <div className="py-12 flex flex-col items-center text-on-surface-variant space-y-4">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"></div>
        <span className="font-medium">Loading prescriptions...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mb-6 p-4 bg-[#FFF5F5] ring-1 ring-[#FFE0E0] rounded-xl flex items-start space-x-3">
        <svg className="h-5 w-5 text-[#D93838] shrink-0 mt-0.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
        </svg>
        <p className="text-sm text-[#D93838] font-medium leading-relaxed">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-surface-lowest rounded-3xl p-6 md:p-8 shadow-[0_20px_60px_rgba(12,30,38,0.05)] ring-1 ring-outline-variant/20 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-primary-container tracking-tight">Prescription History</h2>
          <p className="text-sm text-on-surface-variant font-medium mt-1">Review your prescribed medications</p>
        </div>
        <div className="flex space-x-3 mt-4 md:mt-0">
          <button
            onClick={() => handleSort('date')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-semibold transition-all duration-300 ${sortBy === 'date' ? 'bg-primary-container text-on-primary' : 'bg-surface-variant text-on-surface-variant hover:bg-surface-container-low hover:text-primary-container'}`}
          >
            <Calendar className="h-4 w-4" />
            <span>Date</span>
            {sortBy === 'date' && (
              sortDirection === 'asc' ? <ChevronUp className="h-4 w-4 ml-1" /> : <ChevronDown className="h-4 w-4 ml-1" />
            )}
          </button>
          <button
            onClick={() => handleSort('doctor')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-semibold transition-all duration-300 ${sortBy === 'doctor' ? 'bg-primary-container text-on-primary' : 'bg-surface-variant text-on-surface-variant hover:bg-surface-container-low hover:text-primary-container'}`}
          >
            <User className="h-4 w-4" />
            <span>Doctor</span>
            {sortBy === 'doctor' && (
              sortDirection === 'asc' ? <ChevronUp className="h-4 w-4 ml-1" /> : <ChevronDown className="h-4 w-4 ml-1" />
            )}
          </button>
        </div>
      </div>

      {prescriptions.length === 0 ? (
        <div className="bg-surface-lowest p-12 rounded-3xl text-center shadow-[0_20px_60px_rgba(12,30,38,0.05)] ring-1 ring-outline-variant/20 flex flex-col items-center">
          <div className="bg-surface-variant rounded-full p-4 mb-4">
            <ClipboardList className="h-8 w-8 text-on-surface-variant opacity-60" />
          </div>
          <p className="text-primary-container font-bold text-lg mb-1">No Prescriptions</p>
          <p className="text-on-surface-variant text-sm font-medium">You have no prescription history yet.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {sortedPrescriptions.map((prescription) => (
            <div
              key={prescription.id}
              className="bg-surface-lowest p-6 rounded-3xl shadow-[0_20px_60px_rgba(12,30,38,0.05)] ring-1 ring-outline-variant/20 transition-all hover:shadow-[0_25px_65px_rgba(12,30,38,0.08)]"
            >
              <div className="flex flex-col md:flex-row justify-between mb-6 pb-5 border-b border-outline-variant/20">
                <div className="space-y-2">
                  <div className="flex items-center text-primary-container">
                    <Calendar className="h-5 w-5 mr-3 text-primary" />
                    <span className="font-bold text-lg">
                      {format(new Date(prescription.date), 'MMMM d, yyyy')}
                    </span>
                  </div>
                  <div className="flex items-center text-on-surface-variant font-medium">
                    <User className="h-5 w-5 mr-3 opacity-70" />
                    <span>Dr. {prescription.doctor.name}</span>
                  </div>
                  <div className="flex items-center text-on-surface-variant font-medium">
                    <Stethoscope className="h-5 w-5 mr-3 opacity-70" />
                    <span>Condition: {prescription.condition || 'General'}</span>
                  </div>
                </div>
                <div className="mt-4 md:mt-0 self-start">
                  <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-bold bg-primary/10 text-primary ring-1 ring-primary/20">
                    {prescription.medicines.length} medication{prescription.medicines.length !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-primary-container mb-4 uppercase text-xs tracking-[0.15em]">Medications Details</h4>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {prescription.medicines.map((med) => (
                    <div key={med.id} className="bg-surface-container-lowest p-5 rounded-2xl ring-1 ring-outline-variant/10 hover:ring-primary/20 transition-all duration-300">
                      <h5 className="font-bold text-primary-container text-lg mb-3 flex items-center">
                        {med.medicineName}
                      </h5>
                      <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-sm font-medium">
                        <div className="flex flex-col">
                          <span className="text-on-surface-variant text-xs uppercase tracking-wider mb-1">Dosage</span>
                          <span className="text-primary-container">{med.dosage}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-on-surface-variant text-xs uppercase tracking-wider mb-1">Duration</span>
                          <span className="text-primary-container">{med.duration}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-on-surface-variant text-xs uppercase tracking-wider mb-1">Timing</span>
                          <span className="text-primary-container">{Object.entries(med.timing)
                            .filter(([_, value]) => value === true)
                            .map(([key]) => key)
                            .join(', ')}</span>
                        </div>
                        <div className="flex flex-col col-span-2">
                          <span className="text-on-surface-variant text-xs uppercase tracking-wider mb-1">Instructions</span>
                          <span className="text-primary-container bg-surface-lowest mt-1">{med.instructions}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ViewPrescription;
