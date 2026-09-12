import { useState, useEffect, useRef } from 'react';
import apiClient from '../lib/apiClient';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Clock, User, FileText, ChevronDown, Check } from 'lucide-react';

function AppointmentBooking() {
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [isDoctorDropdownOpen, setIsDoctorDropdownOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState('');
  const [purpose, setPurpose] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const doctorDropdownRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (doctorDropdownRef.current && !doctorDropdownRef.current.contains(event.target)) {
        setIsDoctorDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch the list of doctors assigned to the patient
  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        // Decode the token to get patient data
        const decoded = JSON.parse(atob(token.split('.')[1]));
        if (!decoded || !decoded.id) {
          setError('Authentication error. Please log in again.');
          return;
        }

        // Get the patient's doctors instead of trying to get patients assigned to the patient
        const response = await apiClient.get(`/doctor/doctors`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        // Filter only the doctors that are assigned to this patient
        const patientRecord = response.data.find(p => p.id === parseInt(decoded.id, 10));
        if (patientRecord && patientRecord.doctors) {
          setDoctors(patientRecord.doctors);
        } else {
          setDoctors([]);
        }
      } catch (error) {
        console.error('Error fetching doctors:', error);
        setError('Failed to load your doctors. Please try again later.');
      }
    };

    fetchDoctors();
  }, []);

  // Fetch available slots when doctor and date are selected
  useEffect(() => {
    const fetchAvailableSlots = async () => {
      if (!selectedDoctor || !selectedDate) return;

      try {
        setIsLoading(true);
        const token = localStorage.getItem('token');
        const response = await apiClient.get(`/appointments/available-slots?doctorId=${selectedDoctor}&date=${selectedDate}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setAvailableSlots(response.data.availableSlots);
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching available slots:', error);
        setError('Failed to load available time slots. Please try again later.');
        setIsLoading(false);
      }
    };

    fetchAvailableSlots();
  }, [selectedDoctor, selectedDate]);

  const handleSelectDoctor = (doctorId) => {
    setSelectedDoctor(doctorId);
    setIsDoctorDropdownOpen(false);
    setSelectedSlot('');
    setAvailableSlots([]);
  };

  const handleDateChange = (e) => {
    setSelectedDate(e.target.value);
    setSelectedSlot('');
    setAvailableSlots([]);
  };

  const handleSlotSelect = (slot) => {
    setSelectedSlot(slot);
  };

  const selectedDoctorObj = doctors.find(d => String(d.id) === String(selectedDoctor));

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedDoctor || !selectedSlot || !purpose) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');

      const response = await apiClient.post('/appointments', {
        doctorId: selectedDoctor,
        appointmentDate: selectedSlot,
        purpose
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setSuccessMessage('Appointment booked successfully!');
      setIsLoading(false);

      // Reset form
      setSelectedDoctor('');
      setSelectedDate('');
      setSelectedSlot('');
      setPurpose('');
      setAvailableSlots([]);

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    } catch (error) {
      console.error('Error booking appointment:', error);
      setError(error.response?.data?.error || 'Failed to book appointment. Please try again later.');
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-surface-lowest rounded-2xl shadow-xs ring-1 ring-outline-variant/60 p-4 md:p-6">
      <div className="flex items-center space-x-3 mb-4 pb-3.5 border-b border-outline-variant/60">
        <div className="bg-primary/10 rounded-xl p-2.5 text-primary shrink-0">
          <CalendarIcon className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-primary-container tracking-tight">Book an Appointment</h2>
          <p className="text-xs text-on-surface-variant font-medium mt-0.5">Select a doctor and schedule a time</p>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-[#FFF5F5] border border-[#D93838]/40 rounded-xl flex items-start space-x-2.5">
          <svg className="h-4 w-4 text-[#D93838] shrink-0 mt-0.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <p className="text-xs text-[#D93838] font-medium leading-relaxed">{error}</p>
        </div>
      )}

      {successMessage && (
        <div className="mb-4 p-3 bg-[#F0FDF4] border border-[#16A34A]/40 rounded-xl flex items-start space-x-2.5">
          <svg className="h-4 w-4 text-[#16A34A] shrink-0 mt-0.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM13.707 9.293a1 1 0 00-1.414-1.414L9 11.172 7.707 9.879a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <p className="text-xs text-[#16A34A] font-medium leading-relaxed">{successMessage}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {/* Custom Doctor Selection Dropdown */}
          <div className="space-y-1.5" ref={doctorDropdownRef}>
            <label className="flex items-center text-xs font-semibold text-primary-container">
              <User className="w-3.5 h-3.5 mr-1.5 opacity-70" />
              Select Doctor
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsDoctorDropdownOpen(!isDoctorDropdownOpen)}
                className="w-full px-3.5 py-2.5 bg-surface-lowest border border-outline-variant/60 hover:border-primary/40 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-xs md:text-sm text-left flex items-center justify-between cursor-pointer shadow-xs min-h-10.5"
              >
                {selectedDoctorObj ? (
                  <span className="flex items-center space-x-2 font-medium text-primary-container truncate">
                    <span className="font-semibold">{selectedDoctorObj.name}</span>
                    <span className="text-on-surface-variant/40">&bull;</span>
                    <span className="text-[11px] font-semibold text-primary bg-secondary-container px-2 py-0.5 rounded-full truncate">
                      {selectedDoctorObj.specialization}
                    </span>
                  </span>
                ) : (
                  <span className="text-on-surface-variant/70 font-normal">Select a doctor...</span>
                )}
                <ChevronDown className={`w-4 h-4 text-on-surface-variant shrink-0 ml-2 transition-transform duration-200 ${isDoctorDropdownOpen ? 'rotate-180 text-primary' : ''}`} />
              </button>

              {/* Styled Dropdown Menu */}
              {isDoctorDropdownOpen && (
                <div className="absolute left-0 right-0 top-full mt-1.5 bg-surface-lowest border border-outline-variant/60 rounded-xl shadow-[0_12px_32px_rgba(19,27,46,0.12)] z-50 p-1.5 max-h-56 overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
                  {doctors.length === 0 ? (
                    <div className="p-3 text-center text-xs text-on-surface-variant font-medium">
                      No assigned doctors available
                    </div>
                  ) : (
                    doctors.map((doctor) => {
                      const isSelected = String(doctor.id) === String(selectedDoctor);
                      return (
                        <div
                          key={doctor.id}
                          onClick={() => handleSelectDoctor(doctor.id)}
                          className={`flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer text-xs transition-all ${isSelected
                              ? 'bg-primary-container text-on-primary font-bold shadow-xs'
                              : 'text-primary-container hover:bg-surface-container-low font-medium'
                            }`}
                        >
                          <div className="flex items-center space-x-2 truncate">
                            <span className="truncate">{doctor.name}</span>
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${isSelected ? 'bg-white/20 text-white' : 'bg-surface-container text-on-secondary-container'
                              }`}>
                              {doctor.specialization}
                            </span>
                          </div>
                          {isSelected && <Check className="w-3.5 h-3.5 shrink-0 ml-2 text-white" />}
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="flex items-center text-xs font-semibold text-primary-container">
              <CalendarIcon className="w-3.5 h-3.5 mr-1.5 opacity-70" />
              Select Date
            </label>
            <input
              type="date"
              className="w-full px-3.5 py-2 bg-surface-container-low/40 border border-outline-variant/60 rounded-xl focus:ring-1 focus:ring-primary/20 focus:bg-surface-lowest transition-all text-xs md:text-sm text-primary-container font-medium min-h-9.5"
              value={selectedDate}
              onChange={handleDateChange}
              min={format(new Date(), 'yyyy-MM-dd')}
              required
            />
          </div>
        </div>

        {isLoading && (
          <div className="py-2 flex items-center text-on-surface-variant space-x-2">
            <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-on-surface-variant border-t-transparent"></div>
            <span className="font-medium text-xs">Loading available slots...</span>
          </div>
        )}

        {availableSlots.length > 0 && (
          <div className="space-y-2 pt-1">
            <label className="flex items-center text-xs font-semibold text-primary-container">
              <Clock className="w-3.5 h-3.5 mr-1.5 opacity-70" />
              Available Time Slots
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
              {availableSlots.map((slot) => (
                <button
                  key={slot.time}
                  type="button"
                  className={`py-1.5 px-2.5 rounded-lg text-center text-xs font-semibold transition-all cursor-pointer ${selectedSlot === slot.time
                    ? 'bg-primary-container text-on-primary shadow-xs'
                    : 'bg-surface-container-low/50 text-primary-container hover:bg-surface-container border border-outline-variant/60'
                    }`}
                  onClick={() => handleSlotSelect(slot.time)}
                >
                  {slot.formattedTime}
                </button>
              ))}
            </div>
          </div>
        )}

        {availableSlots.length === 0 && selectedDate && selectedDoctor && !isLoading && (
          <div className="bg-surface-container-low/40 border border-outline-variant/60 rounded-xl p-3 text-center">
            <p className="text-on-surface-variant font-medium text-xs">No available slots for this date. Please select another date.</p>
          </div>
        )}

        <div className="space-y-1.5 pt-1">
          <label className="flex items-center text-xs font-semibold text-primary-container">
            <FileText className="w-3.5 h-3.5 mr-1.5 opacity-70" />
            Appointment Purpose
          </label>
          <textarea
            className="w-full px-3.5 py-2.5 bg-surface-container-low/40 border border-outline-variant/60 rounded-xl focus:ring-1 focus:ring-primary/20 focus:bg-surface-lowest transition-all text-xs md:text-sm text-primary-container font-medium placeholder-on-surface-variant/50 resize-y min-h-17.5"
            rows="2"
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
            placeholder="Briefly describe the reason for this appointment"
            required
          />
        </div>

        <div className="pt-2">
          <button
            type="submit"
            className={`w-full py-2.5 px-5 rounded-xl text-xs md:text-sm font-bold transition-all shadow-xs cursor-pointer ${isLoading || !selectedDoctor || !selectedSlot || !purpose
              ? 'bg-surface-variant text-on-surface-variant/50 shadow-none cursor-not-allowed'
              : 'text-on-primary bg-primary-container hover:bg-[#0d1322]'
              }`}
            disabled={isLoading || !selectedDoctor || !selectedSlot || !purpose}
          >
            {isLoading ? 'Booking...' : 'Confirm Appointment'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default AppointmentBooking; 