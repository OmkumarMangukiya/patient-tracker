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
    <div className="w-full flex flex-col space-y-4 animate-in fade-in duration-500">

      {/* Header & Adherence Bar */}
      {activeTab === 'current' && (
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2 border-b border-outline-variant/60">

          {/* Adherence Stats */}
          <div className="flex-1 max-w-2xl">
            <h2 className="text-xs font-bold tracking-wider text-on-surface-variant uppercase mb-1">Daily Adherence</h2>
            <div className="text-3xl md:text-4xl font-extrabold text-primary-container tracking-tight mb-2 leading-none">
              {adherencePercentage}% <span className="text-xl text-on-surface-variant font-semibold ml-1">Overall</span>
            </div>

            {/* Progress Bar Container */}
            <div className="h-2 w-full bg-surface-container-high rounded-full overflow-hidden mb-2">
              <div
                className="h-full bg-primary-container rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${adherencePercentage}%` }}
              />
            </div>

            <div className="flex items-center space-x-1.5 text-xs text-on-surface-variant font-medium">
              <Info className="w-3.5 h-3.5 opacity-70 shrink-0" />
              <span>You have taken {takenMeds} of {totalMeds} prescribed doses today.</span>
            </div>
          </div>

          {/* Toggle Pills */}
          <div className="flex justify-end shrink-0">
            <div className="bg-surface-container-high rounded-full p-1 inline-flex border border-outline-variant/60 shadow-xs">
              <button
                onClick={() => setActiveTab('current')}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 cursor-pointer ${activeTab === 'current' ? 'bg-surface-lowest text-primary-container shadow-xs' : 'text-on-secondary-container hover:text-primary-container'}`}
              >
                Today's Medications
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 cursor-pointer ${activeTab === 'history' ? 'bg-surface-lowest text-primary-container shadow-xs' : 'text-on-secondary-container hover:text-primary-container'}`}
              >
                Medication History
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="flex justify-end mb-2">
          <div className="bg-surface-container-high rounded-full p-1 inline-flex border border-outline-variant/60 shadow-xs">
            <button
              onClick={() => setActiveTab('current')}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 cursor-pointer ${activeTab === 'current' ? 'bg-surface-lowest text-primary-container shadow-xs' : 'text-on-secondary-container hover:text-primary-container'}`}
            >
              Today's Medications
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 cursor-pointer ${activeTab === 'history' ? 'bg-surface-lowest text-primary-container shadow-xs' : 'text-on-secondary-container hover:text-primary-container'}`}
            >
              Medication History
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="p-3 bg-[#FFF5F5] text-[#D93838] border border-[#D93838]/40 rounded-xl text-xs font-medium">
          {error}
        </div>
      )}

      {activeTab === 'current' ? (
        <div>
          {/* Main List Area */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {medications.length === 0 ? (
              <div className="bg-surface-container-low/40 rounded-xl border border-outline-variant/60 p-6 text-center text-xs font-medium text-on-surface-variant col-span-full">
                No medications scheduled for today.
              </div>
            ) : (
              getSortedTimeGroups().map(group => {
                const groupTotal = group.medications.length;
                const groupTaken = group.medications.filter(m => m.adherenceStatus === 'Taken').length;
                const groupAdherence = groupTotal === 0 ? 0 : Math.round((groupTaken / groupTotal) * 100);

                return (
                  <div key={group.time} className="flex flex-col space-y-2.5">
                    {/* Time Header */}
                    <div className="flex items-center justify-between px-1">
                      <h3 className="text-sm font-bold text-primary-container tracking-tight flex items-center">
                        {getTimeDisplayName(group.time)}
                      </h3>
                      <div className="bg-surface-container-highest px-2 py-0.5 rounded-full flex items-center space-x-1.5 text-[11px] font-semibold text-primary-container">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary-container"></span>
                        <span>{groupAdherence}%</span>
                      </div>
                    </div>

                    {/* Cards Column */}
                    <div className="flex flex-col gap-2.5">
                      {group.medications.map((medication, index) => {
                        const status = medication.adherenceStatus;
                        const isTaken = status === 'Taken';
                        const isMissed = status === 'Missed';
                        const isPending = status === 'Pending';

                        const statusBadgeClass = 
                          isTaken ? 'text-emerald-700 bg-emerald-50 ring-1 ring-emerald-600/30' :
                          isMissed ? 'text-rose-700 bg-rose-50 ring-1 ring-rose-600/30' :
                          'text-amber-700 bg-amber-50 ring-1 ring-amber-600/30';

                        return (
                          <div
                            key={medication.id || index}
                            className={`flex flex-col justify-between p-3.5 rounded-xl transition-all duration-200 border ${
                              isTaken ? 'bg-surface-lowest border-outline-variant/60 shadow-xs' :
                              isMissed ? 'bg-[#FFF5F5] border-[#D93838]/40 shadow-xs relative overflow-hidden' :
                              'bg-surface-lowest border-outline-variant/60 shadow-xs'
                            }`}
                          >
                            {/* Missed active edge */}
                            {isMissed && <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#D93838]" />}

                            <div className="flex flex-col space-y-1.5 items-start mb-3">
                              <div className="flex justify-between items-start w-full gap-2">
                                <h4 className="text-sm font-bold text-primary-container leading-tight">
                                  {medication.medicineName || medication.medication}
                                </h4>
                                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${statusBadgeClass}`}>
                                  {status}
                                </span>
                              </div>
                              <span className="text-xs text-on-surface-variant font-medium">
                                {medication.dosage} • {medication.instructions || 'As directed'}
                              </span>
                            </div>

                            <div className="mt-auto flex items-center justify-between pt-1">
                              {isTaken && (
                                <span className="text-[11px] text-on-surface-variant font-medium italic">
                                  Logged today
                                </span>
                              )}

                              {/* Action Buttons */}
                              {isPending && (
                                <button
                                  onClick={() => updateMedicationStatus(medication, 'Taken')}
                                  className="w-full bg-primary-container hover:bg-[#0d1322] text-on-primary rounded-lg py-1.5 text-xs font-semibold transition-all shadow-xs cursor-pointer"
                                >
                                  Mark as Taken
                                </button>
                              )}

                              {isMissed && (
                                <button
                                  onClick={() => updateMedicationStatus(medication, 'Taken')}
                                  className="w-full bg-primary-container hover:bg-[#0d1322] text-on-primary rounded-lg py-1.5 text-xs font-semibold transition-all shadow-xs cursor-pointer"
                                >
                                  Mark as Taken
                                </button>
                              )}

                              {isTaken && (
                                <button
                                  onClick={() => updateMedicationStatus(medication, 'Pending')}
                                  className="text-xs font-semibold text-primary-container hover:text-primary underline decoration-primary-container/40 hover:decoration-primary-container underline-offset-2 ml-auto transition-colors cursor-pointer"
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
        <div className="bg-surface-lowest rounded-2xl p-4 md:p-6 shadow-xs border border-outline-variant/60">
          <h2 className="text-lg font-bold mb-4 text-primary-container tracking-tight">Medication History</h2>

          {medicationHistory.length === 0 ? (
            <div className="bg-surface-container-low/40 rounded-xl border border-outline-variant/60 p-5 text-center text-xs font-medium text-on-surface-variant">
              No medication history available.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left">
                <thead>
                  <tr className="text-on-surface-variant text-xs font-semibold border-b border-outline-variant/60">
                    <th className="py-2.5 px-3 tracking-wide">Date</th>
                    <th className="py-2.5 px-3 tracking-wide">Time</th>
                    <th className="py-2.5 px-3 tracking-wide">Medication</th>
                    <th className="py-2.5 px-3 tracking-wide text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/30 text-xs font-medium">
                  {medicationHistory.map((record) => (
                    <tr key={record.id} className="hover:bg-surface-container-low/50 transition-colors">
                      <td className="py-2.5 px-3 text-primary-container">
                        {new Date(record.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td className="py-2.5 px-3 text-on-surface-variant capitalize">
                        {record.scheduledTime || 'Unscheduled'}
                      </td>
                      <td className="py-2.5 px-3 text-primary-container font-semibold">
                        {record.medication}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                          record.adherenceStatus === 'Taken' ? 'text-emerald-700 bg-emerald-50 ring-1 ring-emerald-600/30' :
                          record.adherenceStatus === 'Missed' ? 'text-rose-700 bg-rose-50 ring-1 ring-rose-600/30' :
                          'text-amber-700 bg-amber-50 ring-1 ring-amber-600/30'
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
