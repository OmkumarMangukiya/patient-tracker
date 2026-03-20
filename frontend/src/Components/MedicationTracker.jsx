import { useState, useEffect } from 'react';
import apiClient from '../lib/apiClient';
import { Info, Lightbulb } from 'lucide-react';

function MedicationTracker({ patientId, initialTab = 'current' }) {
  const [medications, setMedications] = useState([]);
  const [medicationHistory, setMedicationHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(initialTab);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const refreshData = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  useEffect(() => {
    if (activeTab === 'current') {
      fetchTodayMedications();
    } else {
      fetchMedicationHistory();
    }
  }, [patientId, activeTab, refreshTrigger]);

  const fetchTodayMedications = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Authentication token not found');

      const response = await apiClient.get(
        `/patient/medications/today/${patientId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setMedications(response.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching medications:', err);
      setError('Failed to load medications');
      setLoading(false);
    }
  };

  const fetchMedicationHistory = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Authentication token not found');

      const response = await apiClient.get(
        `/patient/medications/history/${patientId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setMedicationHistory(response.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching medication history:', err);
      setError('Failed to load medication history');
      setLoading(false);
    }
  };

  const updateMedicationStatus = async (medication, status) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Authentication token not found');

      const isNewMedication = !medication.id;

      await apiClient.post(
        `/patient/medications/update-status`,
        {
          id: medication.id || `temp-${Date.now()}`,
          status,
          patientId: parseInt(patientId),
          medication: medication.medicineName || medication.medication,
          prescriptionId: medication.prescriptionId,
          medicineId: medication.medicineId,
          scheduledTime: medication.scheduledTime,
          isNewMedication
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      fetchTodayMedications();
      refreshData();

      const event = new CustomEvent('medicationUpdated', { detail: { patientId } });
      window.dispatchEvent(event);
    } catch (err) {
      console.error('Error updating medication status:', err);
      setError('Failed to update medication status. Please try again.');
    }
  };

  // Grouping logic
  const groupMedicationsByTime = (meds) => {
    return meds.reduce((groups, med) => {
      let time = med.scheduledTime ? med.scheduledTime.toLowerCase() : 'unscheduled';
      if (!['morning', 'afternoon', 'evening'].includes(time)) time = 'unscheduled';
      if (!groups[time]) groups[time] = [];
      groups[time].push(med);
      return groups;
    }, {});
  };

  const timeOrder = ['morning', 'afternoon', 'evening', 'unscheduled'];

  const getSortedTimeGroups = () => {
    const groups = groupMedicationsByTime(medications);
    return timeOrder
      .filter(time => groups[time] && groups[time].length > 0)
      .map(time => ({
        time,
        medications: groups[time]
      }));
  };

  const getTimeDisplayName = (time) => {
    switch (time) {
      case 'morning': return 'Morning';
      case 'afternoon': return 'Afternoon';
      case 'evening': return 'Evening';
      default: return 'Unscheduled';
    }
  };

  // Adherence Calculations
  const totalMeds = medications.length;
  const takenMeds = medications.filter(m => m.adherenceStatus === 'Taken').length;
  const adherencePercentage = totalMeds === 0 ? 0 : Math.round((takenMeds / totalMeds) * 100);

  if (loading) {
    return (
      <div className="min-h-[200px] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary-container"></div>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col space-y-10 animate-in fade-in duration-500">

      {/* Header & Adherence Bar */}
      {activeTab === 'current' && (
        <div className="flex flex-col md:flex-row md:items-end justify-between space-y-8 md:space-y-0 relative">

          {/* Adherence Stats */}
          <div className="flex-1 max-w-xl">
            <h2 className="text-xs font-bold tracking-[0.15em] text-on-surface-variant uppercase mb-2">Daily Adherence</h2>
            <div className="text-6xl font-black text-primary-container tracking-tighter mb-6 leading-none">
              {adherencePercentage}% <span className="text-4xl text-on-surface-variant/80 font-bold ml-1">Overall</span>
            </div>

            {/* Progress Bar Container */}
            <div className="h-3 w-full bg-surface-container-high rounded-full overflow-hidden mb-3">
              <div
                className="h-full bg-primary-container rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${adherencePercentage}%` }}
              />
            </div>

            <div className="flex items-center space-x-2 text-sm text-on-surface-variant font-medium">
              <Info className="w-4 h-4 opacity-70" />
              <span>You have taken {takenMeds} out of {totalMeds} prescribed doses today.</span>
            </div>
          </div>
        </div>
      )}

      {/* Toggle Pills - Always visible */}
      <div className="flex justify-end">
        <div className="bg-surface-container-high rounded-full p-1.5 inline-flex shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] border border-outline-variant/30">
          <button
            onClick={() => setActiveTab('current')}
            className={`px-8 py-3 rounded-full text-sm font-semibold transition-all duration-300 ${activeTab === 'current' ? 'bg-surface-lowest text-primary-container shadow-sm' : 'text-on-secondary-container hover:text-primary-container'}`}
          >
            Today's Medications
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-8 py-3 rounded-full text-sm font-semibold transition-all duration-300 ${activeTab === 'history' ? 'bg-surface-lowest text-primary-container shadow-sm' : 'text-on-secondary-container hover:text-primary-container'}`}
          >
            Medication History
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-800 rounded-xl">
          {error}
        </div>
      )}

      {activeTab === 'current' ? (
        <div className="flex flex-col lg:flex-row lg:space-x-8 lg:items-start pt-4">

          {/* Main List Area */}
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-8 pt-4">
            {medications.length === 0 ? (
              <p className="text-on-surface-variant font-medium col-span-full">No medications scheduled for today.</p>
            ) : (
              getSortedTimeGroups().map(group => {
                const groupTotal = group.medications.length;
                const groupTaken = group.medications.filter(m => m.adherenceStatus === 'Taken').length;
                const groupAdherence = groupTotal === 0 ? 0 : Math.round((groupTaken / groupTotal) * 100);

                return (
                  <div key={group.time} className="flex flex-col space-y-6">
                    {/* Time Header */}
                    <div className="flex items-center space-x-4">
                      <h3 className="text-xl font-bold text-primary-container tracking-tight">
                        {getTimeDisplayName(group.time)}
                      </h3>
                      <div className="bg-surface-container-highest px-3 py-1 rounded-full flex items-center space-x-2 text-xs font-semibold text-primary-container">
                        <span className="w-2 h-2 rounded-full bg-primary-container"></span>
                        <span>{groupAdherence}%</span>
                      </div>
                    </div>

                    {/* Cards Column */}
                    <div className="flex flex-col gap-5">
                      {group.medications.map((medication, index) => {
                        const status = medication.adherenceStatus;
                        const isTaken = status === 'Taken';
                        const isMissed = status === 'Missed';
                        const isPending = status === 'Pending';

                        return (
                          <div
                            key={medication.id || index}
                            className={`flex flex-col justify-between p-7 rounded-2xl transition-all duration-300 ${isTaken ? 'bg-surface-lowest shadow-[0_10px_40px_rgba(12,30,38,0.03)]' :
                                isMissed ? 'bg-[#FFF5F5] ring-1 ring-[#FFE0E0] shadow-sm relative overflow-hidden' :
                                  'bg-surface-lowest shadow-[0_10px_40px_rgba(12,30,38,0.05)] ring-1 ring-outline-variant/10'
                              }`}
                          >
                            {/* Missed active edge */}
                            {isMissed && <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#FFD1D1]" />}

                            <div className="flex flex-col space-y-3 items-start mb-6">
                              <div className="flex flex-col">
                                <h4 className="text-lg font-bold text-primary-container leading-tight mb-1">
                                  {medication.medicineName || medication.medication}
                                </h4>
                                <span className="text-sm text-on-surface-variant font-medium">
                                  {medication.dosage} • {medication.instructions || 'As directed'}
                                </span>
                              </div>

                              {/* Status Badge */}
                              <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${isTaken ? 'bg-surface-container-high text-primary-container' :
                                  isMissed ? 'bg-[#FFE5E5] text-[#D93838]' :
                                    'bg-surface-container-high text-primary-container'
                                }`}>
                                {status}
                              </div>
                            </div>

                            <div className="mt-auto flex items-end justify-between">
                              {/* Bottom Left Context */}
                              {isTaken ? (
                                <span className="text-xs text-on-surface-variant font-medium italic">
                                  Logged today
                                </span>
                              ) : (
                                <div className="flex-1" />
                              )}

                              {/* Action Buttons */}
                              {isPending && (
                                <button
                                  onClick={() => updateMedicationStatus(medication, 'Taken')}
                                  className="w-full bg-primary-container text-primary-container rounded-full py-3.5 font-semibold transition-transform hover:scale-[1.02] shadow-md"
                                >
                                  Mark as Taken
                                </button>
                              )}

                              {isMissed && (
                                <button
                                  onClick={() => updateMedicationStatus(medication, 'Taken')}
                                  className="w-full bg-surface-container-high text-primary-container rounded-full py-3.5 font-semibold transition-transform hover:scale-[1.02]"
                                >
                                  Mark as Taken
                                </button>
                              )}

                              {isTaken && (
                                <button
                                  onClick={() => updateMedicationStatus(medication, 'Pending')}
                                  className="text-sm font-semibold text-primary-container underline decoration-primary-container/30 hover:decoration-primary-container underline-offset-4 pl-4 transition-colors"
                                >
                                  Undo
                                </button>
                              )}
                            </div>

                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      ) : (
        <div className="bg-surface-lowest rounded-2xl p-8 shadow-[0_10px_40px_rgba(12,30,38,0.03)] ring-1 ring-outline-variant/10">
          <h2 className="text-2xl font-bold mb-6 text-primary-container tracking-tight">Medication History</h2>

          {medicationHistory.length === 0 ? (
            <p className="text-on-surface-variant">No medication history available.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left">
                <thead>
                  <tr className="text-on-surface-variant text-sm font-semibold border-b border-surface-container-high">
                    <th className="py-4 px-4 font-semibold tracking-wide">Date</th>
                    <th className="py-4 px-4 font-semibold tracking-wide">Time</th>
                    <th className="py-4 px-4 font-semibold tracking-wide">Medication</th>
                    <th className="py-4 px-4 font-semibold tracking-wide text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-container-low text-sm font-medium">
                  {medicationHistory.map((record) => (
                    <tr key={record.id} className="hover:bg-surface-container/30 transition-colors">
                      <td className="py-4 px-4 text-primary-container">
                        {new Date(record.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td className="py-4 px-4 text-on-surface-variant capitalize">
                        {record.scheduledTime || 'Unscheduled'}
                      </td>
                      <td className="py-4 px-4 text-primary-container font-bold">
                        {record.medication}
                      </td>
                      <td className="py-4 px-4 text-right">
                        <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${record.adherenceStatus === 'Taken' ? 'bg-surface-container-highest text-primary-container' :
                            record.adherenceStatus === 'Missed' ? 'bg-[#FFE5E5] text-[#D93838]' :
                              'bg-surface-container-highest text-primary-container'
                          }`}>
                          {record.adherenceStatus}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default MedicationTracker;
