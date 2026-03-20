import { useState, useEffect } from 'react';
import apiClient from '../lib/apiClient';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Clock, CheckCircle, XCircle, AlertCircle, ChevronDown, ListFilter, User } from 'lucide-react';

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
        <div className="flex space-x-2 w-full mt-4 sm:mt-0 sm:w-auto">
          <button
            onClick={() => updateAppointmentStatus(appointment.id, 'completed')}
            className="flex-1 sm:flex-none px-4 py-2 font-bold text-sm bg-primary/10 text-primary hover:bg-primary hover:text-on-primary rounded-xl transition-colors ring-1 ring-primary/20"
          >
            Mark Complete
          </button>
          <button
            onClick={() => updateAppointmentStatus(appointment.id, 'cancelled')}
            className="flex-1 sm:flex-none px-4 py-2 font-bold text-sm bg-surface-variant text-on-surface-variant hover:bg-[#FFF5F5] hover:text-[#D93838] rounded-xl transition-colors ring-1 ring-outline-variant/20"
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
          className="w-full mt-4 sm:mt-0 sm:w-auto px-4 py-2 font-bold text-sm bg-surface-variant text-on-surface-variant hover:bg-[#FFF5F5] hover:text-[#D93838] rounded-xl transition-colors ring-1 ring-outline-variant/20"
        >
          Cancel Appointment
        </button>
      );
    }
    
    return null;
  };

  return (
    <div className="bg-surface-lowest rounded-3xl shadow-[0_20px_60px_rgba(12,30,38,0.05)] ring-1 ring-outline-variant/20 p-6 md:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 space-y-4 sm:space-y-0 pb-6 border-b border-outline-variant/20">
        <div className="flex items-center space-x-3">
          <div className="bg-primary/10 rounded-2xl p-3 text-primary shrink-0">
            <ListFilter className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-primary-container tracking-tight">Appointments</h2>
            <p className="text-sm text-on-surface-variant font-medium mt-1 inline-block">Manage your schedule</p>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-3">
          <div className="relative">
            <select
              className="appearance-none bg-surface-variant text-primary-container font-medium text-sm rounded-full px-4 py-2 pr-10 focus:ring-1 focus:ring-primary/30 outline-none cursor-pointer"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="scheduled">Scheduled</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
              <option value="missed">Missed</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant pointer-events-none" />
          </div>
          
          <div className="relative">
            <select
              className="appearance-none bg-surface-variant text-primary-container font-medium text-sm rounded-full px-4 py-2 pr-10 focus:ring-1 focus:ring-primary/30 outline-none cursor-pointer"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
            >
              <option value="all">All Dates</option>
              <option value="upcoming">Upcoming</option>
              <option value="today">Today</option>
              <option value="past">Past</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant pointer-events-none" />
          </div>
        </div>
      </div>
      
      {error && (
        <div className="mb-6 p-4 bg-[#FFF5F5] ring-1 ring-[#FFE0E0] rounded-xl flex items-start space-x-3">
          <svg className="h-5 w-5 text-[#D93838] shrink-0 mt-0.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <p className="text-sm text-[#D93838] font-medium leading-relaxed">{error}</p>
        </div>
      )}
      
      {isLoading ? (
        <div className="py-12 flex flex-col items-center text-on-surface-variant space-y-4">
           <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"></div>
           <span className="font-medium">Loading appointments...</span>
        </div>
      ) : appointments.length === 0 ? (
        <div className="text-center py-16 bg-surface-container-lowest rounded-2xl flex flex-col items-center">
          <div className="bg-surface-variant rounded-full p-4 mb-4">
            <CalendarIcon className="h-8 w-8 text-on-surface-variant opacity-60" />
          </div>
          <p className="text-primary-container font-bold text-lg mb-1">No Appointments</p>
          <p className="text-on-surface-variant text-sm font-medium">There are no appointments matching your filters.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {appointments.map((appointment) => {
            const appointmentDate = new Date(appointment.appointmentDate);
            const personInfo = userRole === 'doctor' ? appointment.patient : appointment.doctor;
            const statusStyle = statusConfig[appointment.status] || statusConfig.scheduled;
            const StatusIcon = statusStyle.icon;
            
            return (
              <div key={appointment.id} className="group bg-surface hover:bg-surface-container-lowest border-transparent rounded-2xl p-5 ring-1 ring-outline-variant/10 hover:ring-primary/20 hover:shadow-md transition-all duration-300">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start space-x-4">
                    <div className="hidden sm:flex h-12 w-12 rounded-full bg-surface-variant items-center justify-center shrink-0">
                       <User className="h-6 w-6 text-on-surface-variant" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-3 mb-1">
                        <h3 className="font-bold text-lg text-primary-container leading-none">
                          {personInfo?.name || 'Unknown'}
                        </h3>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ring-1 ${statusStyle.badge}`}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                        </span>
                      </div>
                      
                      <div className="flex items-center text-sm text-on-surface-variant font-medium mt-2">
                        <CalendarIcon className="w-4 h-4 mr-1.5 opacity-70 text-primary" />
                        <span>
                          {format(appointmentDate, 'MMMM d, yyyy')} <span className="mx-1 opacity-50">&bull;</span> {format(appointmentDate, 'h:mm a')}
                        </span>
                      </div>
                      
                      {appointment.purpose && (
                        <p className="mt-3 text-sm text-on-surface-variant bg-surface-variant/50 p-2.5 rounded-lg border border-outline-variant/10 line-clamp-2">
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