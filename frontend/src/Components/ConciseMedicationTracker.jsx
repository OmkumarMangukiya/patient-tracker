import { useState, useEffect } from 'react';
import apiClient from '../lib/apiClient';
import { CheckCircle, XCircle, AlertTriangle, Clock, ChevronDown, ChevronUp } from 'lucide-react';

function ConciseMedicationTracker({ patientId }) {
  const [summary, setSummary] = useState({ taken: 0, pending: 0, missed: 0 });
  const [medications, setMedications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const fetchTodaySummary = async () => {
      if (!patientId) {
        setError('Patient ID not provided');
        setLoading(false);
        return;
      }
      
      setLoading(true);
      setError(null);
      
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('Authentication token not found');
        }

        const response = await apiClient.get(
          `/doctor/patient-medications/today/${patientId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );

        const todayMeds = response.data;
        setMedications(todayMeds);
        
        const takenCount = todayMeds.filter(m => m.adherenceStatus === 'Taken').length;
        const pendingCount = todayMeds.filter(m => m.adherenceStatus === 'Pending').length;
        const missedCount = todayMeds.filter(m => m.adherenceStatus === 'Missed').length;

        setSummary({ taken: takenCount, pending: pendingCount, missed: missedCount });
        
      } catch (err) {
        console.error("Error fetching today's medication summary for doctor:", err);
        setError('Failed to load summary');
      } finally {
        setLoading(false);
      }
    };

    fetchTodaySummary();
    
    // Refresh summary periodically
    const interval = setInterval(fetchTodaySummary, 5 * 60 * 1000); // Refresh every 5 minutes
    return () => clearInterval(interval);

  }, [patientId]);

  // Group medications by time period
  const getMedicationsByTimePeriod = () => {
    const grouped = {
      morning: [],
      afternoon: [],
      evening: []
    };
    
    medications.forEach(med => {
      if (grouped[med.scheduledTime]) {
        grouped[med.scheduledTime].push(med);
      }
    });
    
    return grouped;
  };
  
  // Get icon for medication status
  const getStatusIcon = (status) => {
    switch(status) {
      case 'Taken':
        return <CheckCircle className="h-3.5 w-3.5 text-emerald-600 shrink-0" />;
      case 'Missed':
        return <XCircle className="h-3.5 w-3.5 text-rose-600 shrink-0" />;
      default:
        return <Clock className="h-3.5 w-3.5 text-amber-600 shrink-0" />;
    }
  };
  
  const getTimePeriodIcon = (period) => {
    switch(period) {
      case 'morning':
        return '🌅';
      case 'afternoon':
        return '☀️';
      case 'evening':
        return '🌙';
      default:
        return '⏰';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4 text-xs text-on-surface-variant">
        <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-primary-container mr-2"></div>
        Loading adherence...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center p-3 text-xs text-[#D93838] bg-[#FFF5F5] border border-[#D93838]/40 rounded-lg">
        <AlertTriangle className="h-3.5 w-3.5 mr-2 shrink-0" />
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      {/* Summary Stat Cards */}
      <div className="grid grid-cols-3 gap-2 text-center">
        {/* Taken Card */}
        <div className="bg-surface-container-low/70 hover:bg-surface-container-low border border-outline-variant/60 rounded-xl p-2.5 flex flex-col items-center justify-center transition-all">
          <div className="w-6 h-6 rounded-full bg-emerald-500/15 flex items-center justify-center mb-1">
            <CheckCircle className="h-3.5 w-3.5 text-emerald-600" />
          </div>
          <p className="text-lg font-bold text-primary-container leading-none">{summary.taken}</p>
          <p className="text-[10px] font-semibold text-on-surface-variant uppercase tracking-wider mt-0.5">Taken</p>
        </div>

        {/* Pending Card */}
        <div className="bg-surface-container-low/70 hover:bg-surface-container-low border border-outline-variant/60 rounded-xl p-2.5 flex flex-col items-center justify-center transition-all">
          <div className="w-6 h-6 rounded-full bg-amber-500/15 flex items-center justify-center mb-1">
            <Clock className="h-3.5 w-3.5 text-amber-600" />
          </div>
          <p className="text-lg font-bold text-primary-container leading-none">{summary.pending}</p>
          <p className="text-[10px] font-semibold text-on-surface-variant uppercase tracking-wider mt-0.5">Pending</p>
        </div>

        {/* Missed Card */}
        <div className="bg-surface-container-low/70 hover:bg-surface-container-low border border-outline-variant/60 rounded-xl p-2.5 flex flex-col items-center justify-center transition-all">
          <div className="w-6 h-6 rounded-full bg-rose-500/15 flex items-center justify-center mb-1">
            <XCircle className="h-3.5 w-3.5 text-rose-600" />
          </div>
          <p className="text-lg font-bold text-primary-container leading-none">{summary.missed}</p>
          <p className="text-[10px] font-semibold text-on-surface-variant uppercase tracking-wider mt-0.5">Missed</p>
        </div>
      </div>

      {/* Expand/Collapse Button */}
      {medications.length > 0 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-xs font-semibold text-primary-container hover:text-primary transition-colors flex items-center justify-center w-full py-1 gap-1 cursor-pointer"
        >
          <span>{expanded ? 'Hide Breakdown' : 'View Detailed Breakdown'}</span>
          {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>
      )}
      
      {/* Detailed Medication List View */}
      {expanded && (
        <div className="text-xs space-y-2 pt-1 max-h-48 overflow-y-auto pr-1">
          {Object.entries(getMedicationsByTimePeriod()).map(([period, meds]) => (
            meds.length > 0 && (
              <div key={period} className="bg-surface-lowest border border-outline-variant/60 rounded-lg p-2.5">
                <h4 className="font-semibold mb-1.5 text-primary-container text-[11px] uppercase tracking-wider flex items-center">
                  <span className="mr-1">{getTimePeriodIcon(period)}</span>
                  {period.charAt(0).toUpperCase() + period.slice(1)}
                </h4>
                <div className="space-y-1">
                  {meds.map((med, index) => {
                    const status = med.adherenceStatus;
                    const statusClass = 
                      status === 'Taken' ? 'text-emerald-700 bg-emerald-50 ring-1 ring-emerald-600/30' :
                      status === 'Missed' ? 'text-rose-700 bg-rose-50 ring-1 ring-rose-600/30' :
                      'text-amber-700 bg-amber-50 ring-1 ring-amber-600/30';

                    return (
                      <div 
                        key={med.id || index} 
                        className="py-1 px-2 rounded-md flex items-center justify-between bg-surface-container-low/40 border border-outline-variant/40"
                      >
                        <div className="flex items-center truncate mr-2">
                          {getStatusIcon(status)}
                          <span className="ml-1.5 font-medium text-on-surface truncate">{med.medication || med.medicineName}</span>
                        </div>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${statusClass}`}>
                          {status}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )
          ))}
          
          {/* If no medications are found for today */}
          {medications.length === 0 && (
            <div className="text-on-surface-variant text-center py-2 bg-surface-container-low/30 rounded-lg text-xs">
              No medications scheduled for today
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default ConciseMedicationTracker;