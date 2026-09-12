import { useState, useEffect } from 'react';
import apiClient from '../lib/apiClient';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Clock, CheckCircle, XCircle, AlertCircle, ChevronDown, ListFilter, User } from 'lucide-react';
import CustomSelect from './ui/CustomSelect';

function AppointmentList({ userRole }) {
  const [appointments, setAppointments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('upcoming');

  useEffect(() => {
    fetchAppointments();
  }, [userRole, statusFilter, dateFilter]);

  const fetchAppointments = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      
      const endpoint = userRole === 'doctor' 
        ? `/doctor/appointments` 
        : `/patient/appointments`;
      
      let queryParams = '';
      if (statusFilter !== 'all') {
        queryParams += `status=${statusFilter}`;
      }
      
      if (dateFilter === 'today') {
        const today = format(new Date(), 'yyyy-MM-dd');
        queryParams += queryParams ? `&date=${today}` : `date=${today}`;
      }
      
      const url = queryParams ? `${endpoint}?${queryParams}` : endpoint;
      
      const response = await apiClient.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Filter appointments based on date criteria
      let filteredAppointments = response.data;
      
      if (dateFilter === 'upcoming') {
        const now = new Date();
        filteredAppointments = filteredAppointments.filter(
          appointment => new Date(appointment.appointmentDate) > now
        );
      } else if (dateFilter === 'past') {
        const now = new Date();
        filteredAppointments = filteredAppointments.filter(
          appointment => new Date(appointment.appointmentDate) < now
        );
      }
      
      setAppointments(filteredAppointments);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching appointments:', error);
      setError('Failed to load appointments. Please try again later.');
      setIsLoading(false);
    }
  };

  const updateAppointmentStatus = async (appointmentId, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      
      await apiClient.post('/appointments/update-status', {
        appointmentId,
        status: newStatus
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Update the local state
      setAppointments(appointments.map(appointment => 
        appointment.id === appointmentId 
          ? { ...appointment, status: newStatus } 
          : appointment
      ));
    } catch (error) {
      console.error('Error updating appointment status:', error);
      setError('Failed to update appointment status. Please try again later.');
    }
  };

  const statusConfig = {
    completed: { color: 'text-primary', badge: 'bg-primary/10 text-primary ring-primary/20', icon: CheckCircle },
    scheduled: { color: 'text-[#0284C7]', badge: 'bg-[#E0F2FE] text-[#0284C7] ring-[#0284C7]/20', icon: Clock },
    cancelled: { color: 'text-[#D93838]', badge: 'bg-[#FFF5F5] text-[#D93838] ring-[#D93838]/20', icon: XCircle },
    missed: { color: 'text-[#D97706]', badge: 'bg-[#FEF3C7] text-[#D97706] ring-[#D97706]/20', icon: AlertCircle },
  };

  const renderAppointmentActions = (appointment) => {
    if (userRole === 'doctor' && appointment.status === 'scheduled') {
      return (
        <div className="flex space-x-2 w-full mt-3 sm:mt-0 sm:w-auto shrink-0">
          <button
            onClick={() => updateAppointmentStatus(appointment.id, 'completed')}
            className="flex-1 sm:flex-none px-3 py-1.5 font-bold text-xs bg-primary/10 text-primary hover:bg-primary hover:text-on-primary rounded-lg transition-colors border border-primary/30"
          >
            Mark Complete
          </button>
          <button
            onClick={() => updateAppointmentStatus(appointment.id, 'cancelled')}
            className="flex-1 sm:flex-none px-3 py-1.5 font-bold text-xs bg-surface-variant/60 text-on-surface-variant hover:bg-[#FFF5F5] hover:text-[#D93838] hover:border-[#D93838]/30 rounded-lg transition-colors border border-outline-variant/60"
          >
            Cancel
          </button>
        </div>
      );
    }
    
    if (appointment.status === 'scheduled') {
      return (
        <button
          onClick={() => updateAppointmentStatus(appointment.id, 'cancelled')}
          className="w-full mt-3 sm:mt-0 sm:w-auto px-3 py-1.5 font-bold text-xs bg-surface-variant/60 text-on-surface-variant hover:bg-[#FFF5F5] hover:text-[#D93838] hover:border-[#D93838]/30 rounded-lg transition-colors border border-outline-variant/60"
        >
          Cancel Appointment
        </button>
      );
    }
    
    return null;
  };

  return (
    <div className="bg-surface-lowest rounded-2xl shadow-xs ring-1 ring-outline-variant/60 p-4 md:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-5 space-y-3 sm:space-y-0 pb-4 border-b border-outline-variant/60">
        <div className="flex items-center space-x-3">
          <div className="bg-primary/10 rounded-xl p-2.5 text-primary shrink-0">
            <ListFilter className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-primary-container tracking-tight">Appointments</h2>
            <p className="text-xs text-on-surface-variant font-medium">Manage your clinical schedule</p>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="w-36">
            <CustomSelect
              size="sm"
              value={statusFilter}
              onChange={setStatusFilter}
              options={[
                { value: 'all', label: 'All Status' },
                { value: 'scheduled', label: 'Scheduled' },
                { value: 'completed', label: 'Completed' },
                { value: 'cancelled', label: 'Cancelled' },
                { value: 'missed', label: 'Missed' }
              ]}
              align="right"
              className="bg-surface-variant/40 border-outline-variant/60 rounded-xl"
            />
          </div>
          
          <div className="w-36">
            <CustomSelect
              size="sm"
              value={dateFilter}
              onChange={setDateFilter}
              options={[
                { value: 'all', label: 'All Dates' },
                { value: 'upcoming', label: 'Upcoming' },
                { value: 'today', label: 'Today' },
                { value: 'past', label: 'Past' }
              ]}
              align="right"
              className="bg-surface-variant/40 border-outline-variant/60 rounded-xl"
            />
          </div>
        </div>
      </div>
      
      {error && (
        <div className="mb-4 p-3 bg-[#FFF5F5] ring-1 ring-[#FFE0E0] rounded-xl flex items-start space-x-2.5">
          <svg className="h-4 w-4 text-[#D93838] shrink-0 mt-0.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <p className="text-xs text-[#D93838] font-medium leading-relaxed">{error}</p>
        </div>
      )}
      
      {isLoading ? (
        <div className="py-10 flex flex-col items-center text-on-surface-variant space-y-3">
           <div className="animate-spin rounded-full h-7 w-7 border-2 border-primary border-t-transparent"></div>
           <span className="text-xs font-medium">Loading appointments...</span>
        </div>
      ) : appointments.length === 0 ? (
        <div className="text-center py-12 bg-surface-container-lowest border border-outline-variant/60 rounded-xl flex flex-col items-center">
          <div className="bg-surface-variant rounded-full p-3 mb-3">
            <CalendarIcon className="h-6 w-6 text-on-surface-variant opacity-60" />
          </div>
          <p className="text-primary-container font-bold text-sm mb-0.5">No Appointments</p>
          <p className="text-on-surface-variant text-xs font-medium">There are no appointments matching your filters.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {appointments.map((appointment) => {
            const appointmentDate = new Date(appointment.appointmentDate);
            const personInfo = userRole === 'doctor' ? appointment.patient : appointment.doctor;
            const statusStyle = statusConfig[appointment.status] || statusConfig.scheduled;
            const StatusIcon = statusStyle.icon;
            
            return (
              <div key={appointment.id} className="group bg-surface hover:bg-surface-container-lowest border border-outline-variant/60 hover:border-primary/40 rounded-xl p-3.5 sm:p-4 hover:shadow-xs transition-all duration-200">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex items-start space-x-3.5">
                    <div className="hidden sm:flex h-10 w-10 rounded-full bg-surface-variant/60 border border-outline-variant/60 items-center justify-center shrink-0">
                       <User className="h-5 w-5 text-on-surface-variant" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2.5 mb-1">
                        <h3 className="font-bold text-base text-primary-container leading-none">
                          {personInfo?.name || 'Unknown'}
                        </h3>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold ring-1 ${statusStyle.badge}`}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                        </span>
                      </div>
                      
                      <div className="flex items-center text-xs text-on-surface-variant font-medium mt-1.5">
                        <CalendarIcon className="w-3.5 h-3.5 mr-1.5 opacity-70 text-primary" />
                        <span>
                          {format(appointmentDate, 'MMMM d, yyyy')} <span className="mx-1 opacity-50">&bull;</span> {format(appointmentDate, 'h:mm a')}
                        </span>
                      </div>
                      
                      {appointment.purpose && (
                        <p className="mt-2 text-xs text-on-surface-variant bg-surface-variant/40 p-2 rounded-lg border border-outline-variant/40 line-clamp-2">
                          <span className="font-bold text-primary-container">Reason:</span> {appointment.purpose}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  {renderAppointmentActions(appointment)}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default AppointmentList; 