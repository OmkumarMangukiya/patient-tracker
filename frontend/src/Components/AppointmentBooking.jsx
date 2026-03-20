import { useState, useEffect } from 'react';
import apiClient from '../lib/apiClient';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Clock, User, FileText } from 'lucide-react';

function AppointmentBooking() {
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState('');
  const [purpose, setPurpose] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Fetch the list of doctors assigned to the patient
  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        // Decode the token to get patient data
        const decoded = JSON.parse(atob(token.split('.')[1]));

        if (decoded.role !== 'patient') {
          setError('Only patients can book appointments');
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

  const handleDoctorChange = (e) => {
    setSelectedDoctor(e.target.value);
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
    <div className="bg-surface-lowest rounded-3xl shadow-[0_20px_60px_rgba(12,30,38,0.05)] ring-1 ring-outline-variant/20 p-8">
      <div className="flex items-center space-x-3 mb-8 pb-6 border-b border-outline-variant/20">
        <div className="bg-primary/10 rounded-2xl p-3 text-primary shrink-0">
          <CalendarIcon className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-primary-container tracking-tight">Book an Appointment</h2>
          <p className="text-sm text-on-surface-variant font-medium mt-1 inline-block">Select a doctor and schedule a time</p>
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

      {successMessage && (
        <div className="mb-6 p-4 bg-[#F0FDF4] ring-1 ring-[#DCFCE7] rounded-xl flex items-start space-x-3">
          <svg className="h-5 w-5 text-[#16A34A] shrink-0 mt-0.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM13.707 9.293a1 1 0 00-1.414-1.414L9 11.172 7.707 9.879a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <p className="text-sm text-[#16A34A] font-medium leading-relaxed">{successMessage}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <label className="flex items-center text-sm font-semibold text-primary-container">
            <User className="w-4 h-4 mr-2 opacity-70" />
            Select Doctor
          </label>
          <div className="relative">
            <select
              className="w-full px-4 py-3.5 bg-surface-variant border-transparent rounded-xl focus:ring-1 focus:ring-primary/20 focus:bg-surface-lowest transition-all duration-300 text-primary-container font-medium appearance-none"
              value={selectedDoctor}
              onChange={handleDoctorChange}
              required
            >
              <option value="" disabled className="text-on-surface-variant">Select a doctor</option>
              {doctors.map((doctor) => (
                <option key={doctor.id} value={doctor.id} className="text-primary-container">
                  {doctor.name} &mdash; {doctor.specialization}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-primary-container">
              <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <label className="flex items-center text-sm font-semibold text-primary-container">
            <CalendarIcon className="w-4 h-4 mr-2 opacity-70" />
            Select Date
          </label>
          <input
            type="date"
            className="w-full px-4 py-3.5 bg-surface-variant border-transparent rounded-xl focus:ring-1 focus:ring-primary/20 focus:bg-surface-lowest transition-all duration-300 text-primary-container font-medium"
            value={selectedDate}
            onChange={handleDateChange}
            min={format(new Date(), 'yyyy-MM-dd')}
            required
          />
        </div>

        {isLoading && (
          <div className="py-4 flex items-center text-on-surface-variant space-x-3">
             <div className="animate-spin rounded-full h-4 w-4 border-2 border-on-surface-variant border-t-transparent"></div>
             <span className="font-medium text-sm">Loading available slots...</span>
          </div>
        )}

        {availableSlots.length > 0 && (
          <div className="space-y-4 pt-2">
            <label className="flex items-center text-sm font-semibold text-primary-container">
              <Clock className="w-4 h-4 mr-2 opacity-70" />
              Available Time Slots
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {availableSlots.map((slot) => (
                <button
                  key={slot.time}
                  type="button"
                  className={`py-3 px-4 rounded-xl text-center font-medium transition-all duration-200 ${selectedSlot === slot.time
                      ? 'bg-primary-container text-on-primary shadow-md ring-1 ring-primary-container'
                      : 'bg-surface-variant text-primary-container hover:bg-surface-container-low hover:ring-1 hover:ring-outline-variant/30'
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
          <div className="bg-surface-variant rounded-xl p-4 text-center">
             <p className="text-on-surface-variant font-medium text-sm">No available slots for this date. Please select another date.</p>
          </div>
        )}

        <div className="space-y-2 pt-2">
          <label className="flex items-center text-sm font-semibold text-primary-container">
            <FileText className="w-4 h-4 mr-2 opacity-70" />
            Appointment Purpose
          </label>
          <textarea
            className="w-full px-4 py-3.5 bg-surface-variant border-transparent rounded-xl focus:ring-1 focus:ring-primary/20 focus:bg-surface-lowest transition-all duration-300 text-primary-container font-medium placeholder-on-surface-variant/50 resize-y min-h-[100px]"
            rows="3"
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
            placeholder="Briefly describe the reason for this appointment"
            required
          />
        </div>

        <div className="pt-4">
          <button
            type="submit"
            className={`w-full py-4 px-6 rounded-full font-bold transition-all duration-300 transform shadow-[0_10px_20px_rgba(12,30,38,0.2)] ${isLoading || !selectedDoctor || !selectedSlot || !purpose 
                ? 'bg-surface-variant text-on-surface-variant/50 shadow-none cursor-not-allowed' 
                : 'text-on-primary bg-primary hover:bg-primary-container hover:-translate-y-0.5 hover:shadow-[0_15px_30px_rgba(12,30,38,0.3)]'
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