import { useState, useEffect } from 'react';
import apiClient from '../lib/apiClient';

function AddPatient({ formInputs = null, onInputChange = null }) {
  // Use local state if no external state is provided
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    age: '',
    gender: 'male' // Default value
  });
  const [allPatients, setAllPatients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [mode, setMode] = useState('new'); // 'new' or 'existing'
  const [selectedPatientId, setSelectedPatientId] = useState('');

  async function getPatients() {
    try {
      const token = localStorage.getItem('token');
      const response = await apiClient.get('/doctor/doctors', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setAllPatients(response.data);
    } catch (error) {
      console.error("Failed to fetch patients", error);
    }
  }

  // If external state management is provided, sync with it
  useEffect(() => {
    if (formInputs) {
      setFormData(prev => ({
        ...prev,
        ...formInputs
      }));
    }
    getPatients();
  }, [formInputs]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Update local state
    setFormData(prev => ({ ...prev, [name]: value }));

    // If external onChange handler is provided, call it
    if (onInputChange) {
      onInputChange(e);
    }
  };

  const handlePatientSelect = (e) => {
    const patientId = e.target.value;
    setSelectedPatientId(patientId);

    // Optionally, you can find the patient and populate the form data
    const selectedPatient = allPatients.find(p => p.id === parseInt(patientId) || p.id === patientId);
    if (selectedPatient) {
      setFormData({
        name: selectedPatient.name || '',
        email: selectedPatient.email || '',
        age: selectedPatient.age || '',
        gender: selectedPatient.gender || 'male'
      });
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setMessage({ text: '', type: '' });

    try {
      const token = localStorage.getItem('token');

      if (mode === 'new') {
        // Creating a new patient
        await apiClient.post(
          '/doctor/add-patient',
          formData,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );

        setMessage({
          text: `Patient ${formData.name} added successfully! An invitation email has been sent.`,
          type: 'success'
        });
      } else {
        // Adding an existing patient
        await apiClient.post(
          '/doctor/assign-patient',
          { patientId: selectedPatientId },
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );

        setMessage({
          text: `Existing patient assigned successfully!`,
          type: 'success'
        });
      }

      // Reset form after successful submission
      setFormData({
        name: '',
        email: '',
        age: '',
        gender: 'male'
      });
      setSelectedPatientId('');

    } catch (err) {
      setMessage({
        text: err.response?.data?.message || 'Failed to add patient',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-4 p-5 bg-surface-lowest rounded-2xl shadow-xs border border-outline-variant/60">
      <h2 className="text-xl font-bold mb-4 text-center text-primary-container tracking-tight">Add Patient</h2>

      {message.text && (
        <div className={`p-3 mb-4 rounded-xl text-xs font-medium ${message.type === 'success' ? 'bg-[#F0FDF4] text-[#15803D] border border-[#BBF7D0]' : 'bg-[#FFF5F5] text-[#D93838] border border-[#FFE0E0]'
          }`}>
          {message.text}
        </div>
      )}

      <div className="mb-4">
        <div className="flex bg-surface-variant/40 p-1 rounded-xl border border-outline-variant/60">
          <button
            type="button"
            onClick={() => setMode('new')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
              mode === 'new'
                ? 'bg-surface-lowest text-primary-container shadow-xs'
                : 'text-on-surface-variant hover:text-primary-container'
            }`}
          >
            Create New Patient
          </button>
          <button
            type="button"
            onClick={() => setMode('existing')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
              mode === 'existing'
                ? 'bg-surface-lowest text-primary-container shadow-xs'
                : 'text-on-surface-variant hover:text-primary-container'
            }`}
          >
            Add Existing Patient
          </button>
        </div>
      </div>

      {mode === 'existing' ? (
        <div className="mb-4">
          <label htmlFor="existingPatient" className="block text-on-surface-variant text-xs font-bold uppercase tracking-wider mb-1.5">Select Existing Patient</label>
          <select
            id="existingPatient"
            name="existingPatient"
            value={selectedPatientId}
            onChange={handlePatientSelect}
            className="w-full px-3 py-2 border border-outline-variant/60 rounded-xl focus:outline-none focus:ring-1 focus:ring-primary/40 focus:border-primary text-xs font-medium text-primary-container bg-surface"
            required
          >
            <option value="">-- Select a patient --</option>
            {allPatients.map(patient => (
              <option key={patient.id} value={patient.id}>
                {patient.name} ({patient.email})
              </option>
            ))}
          </select>
        </div>
      ) : (
        <>
          <div className="mb-3">
            <label htmlFor="name" className="block text-on-surface-variant text-xs font-bold uppercase tracking-wider mb-1">Full Name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-outline-variant/60 rounded-xl focus:outline-none focus:ring-1 focus:ring-primary/40 focus:border-primary text-xs text-primary-container bg-surface"
              placeholder="Enter patient's full name"
              required
            />
          </div>

          <div className="mb-3">
            <label htmlFor="email" className="block text-on-surface-variant text-xs font-bold uppercase tracking-wider mb-1">Email Address</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-outline-variant/60 rounded-xl focus:outline-none focus:ring-1 focus:ring-primary/40 focus:border-primary text-xs text-primary-container bg-surface"
              placeholder="patient@example.com"
              required
            />
          </div>

          <div className="mb-3">
            <label htmlFor="age" className="block text-on-surface-variant text-xs font-bold uppercase tracking-wider mb-1">Age</label>
            <input
              type="number"
              id="age"
              name="age"
              value={formData.age}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-outline-variant/60 rounded-xl focus:outline-none focus:ring-1 focus:ring-primary/40 focus:border-primary text-xs text-primary-container bg-surface"
              placeholder="Enter age"
            />
          </div>

          <div className="mb-4">
            <label className="block text-on-surface-variant text-xs font-bold uppercase tracking-wider mb-1.5">Gender</label>
            <div className="flex space-x-4">
              {[
                { value: 'male', label: 'Male' },
                { value: 'female', label: 'Female' },
                { value: 'other', label: 'Other' }
              ].map(option => (
                <label key={`gender-${option.value}`} className="inline-flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="gender"
                    value={option.value}
                    checked={formData.gender === option.value}
                    onChange={handleChange}
                    className="form-radio h-3.5 w-3.5 text-primary focus:ring-primary/30"
                  />
                  <span className="ml-1.5 text-xs font-medium text-primary-container">{option.label}</span>
                </label>
              ))}
            </div>
          </div>
        </>
      )}

      <button
        onClick={handleSubmit}
        disabled={loading}
        className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs text-on-primary transition-all shadow-xs ${loading ? 'bg-primary-container/40 cursor-not-allowed' : 'bg-primary-container hover:bg-[#0d1322] active:scale-[0.99]'
          }`}
      >
        {loading ? 'Processing...' : mode === 'new' ? 'Add New Patient' : 'Assign Existing Patient'}
      </button>
    </div>
  );
}

export default AddPatient;
