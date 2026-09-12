import { useState, useEffect } from 'react';
import apiClient from '../lib/apiClient';

function AddPrescription({ patientId, patientName, onClose }) {
  const [medicines, setMedicines] = useState([]);
  const [filteredMedicines, setFilteredMedicines] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [selectedMedicines, setSelectedMedicines] = useState([]);
  const [validPatientId, setValidPatientId] = useState(null);
  const [condition, setCondition] = useState('General');

  // Common medical conditions
  const commonConditions = [
    'General',
    'Hypertension',
    'Diabetes',
    'Asthma',
    'Arthritis',
    'Common Cold',
    'Influenza',
    'Allergies',
    'Migraine',
    'Gastritis',
    'Anxiety',
    'Depression',
    'Insomnia',
    'GERD',
    'Urinary Tract Infection',
    'Other'
  ];

  // Debug log to check patientId and validate it
  useEffect(() => {
    console.log("Patient ID received:", patientId, typeof patientId);

    // Validate patientId and ensure it's in the correct format
    if (patientId) {
      const id = typeof patientId === 'string' ? patientId : String(patientId);
      setValidPatientId(id);
      console.log("Valid patient ID set:", id);
    } else {
      console.error("Invalid or missing patient ID");
      setMessage({ text: 'Patient ID is missing. Please try again later.', type: 'error' });
    }
  }, [patientId]);

  useEffect(() => {
    // Load medicines from API
    const fetchMedicines = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get('/api/medicines');
        setMedicines(response.data);
        setFilteredMedicines(response.data);
      } catch (error) {
        console.error('Error fetching medicines:', error);
        setMessage({ text: 'Failed to load medicines', type: 'error' });
      } finally {
        setLoading(false);
      }
    };

    fetchMedicines();
  }, []);

  useEffect(() => {
    // Filter medicines based on search term
    if (search.trim() === '') {
      setFilteredMedicines(medicines);
    } else {
      const results = medicines.filter(med =>
        med.name.toLowerCase().includes(search.toLowerCase())
      );
      setFilteredMedicines(results);
    }
  }, [search, medicines]);

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
  };

  const handleConditionChange = (e) => {
    setCondition(e.target.value);
  };

  const handleAddMedicine = (medicine) => {
    setSelectedMedicines([...selectedMedicines, {
      ...medicine,
      dosage: '1',
      timing: {
        morning: false,
        afternoon: false,
        evening: false
      },
      instructions: 'after_food',
      duration: '7 days'
    }]);
  };

  const handleRemoveMedicine = (index) => {
    const newList = [...selectedMedicines];
    newList.splice(index, 1);
    setSelectedMedicines(newList);
  };

  const handleMedicineChange = (index, field, value) => {
    const updatedMedicines = selectedMedicines.map((med, i) => {
      if (i === index) {
        if (field.startsWith('timing.')) {
          const timingKey = field.split('.')[1];
          return {
            ...med,
            timing: {
              ...med.timing,
              [timingKey]: value
            }
          };
        }
        return { ...med, [field]: value };
      }
      return med;
    });

    setSelectedMedicines(updatedMedicines);
  };

  const handleCloseModal = (e) => {
    // Prevent event from bubbling up
    if (e) {
      e.stopPropagation();
    }
    // Call the onClose prop
    if (onClose) onClose();
  };

  const handleSubmit = async () => {
    if (selectedMedicines.length === 0) {
      setMessage({ text: 'Please add at least one medicine', type: 'error' });
      return;
    }

    if (!validPatientId) {
      setMessage({ text: 'Patient ID is missing or invalid. Please try again.', type: 'error' });
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      // Make sure we're formatting the medicines data correctly
      const medicinesPayload = selectedMedicines.map(med => ({
        id: med.id,
        name: med.name,
        dosage: med.dosage,
        timing: med.timing,
        instructions: med.instructions,
        duration: med.duration,
        composition1: med.composition1 || '',
        composition2: med.composition2 || ''
      }));

      console.log("Sending request with patient ID:", validPatientId);

      const response = await apiClient.post(
        '/doctor/prescription',
        {
          patientId: validPatientId,
          medicines: medicinesPayload,
          condition: condition
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      setMessage({ text: 'Prescription added successfully', type: 'success' });
      setTimeout(() => {
        if (onClose) onClose();
      }, 1500);
    } catch (error) {
      console.error('Error adding prescription:', error);
      setMessage({
        text: error.response?.data?.message || 'Failed to add prescription',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-primary-container/60 backdrop-blur-xs flex items-center justify-center p-3 md:p-4 overflow-auto z-50" onClick={handleCloseModal}>
      <div className="bg-surface-lowest rounded-2xl shadow-xl ring-1 ring-outline-variant/60 p-4 md:p-6 w-full max-w-4xl max-h-[90vh] overflow-auto" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4 pb-3 border-b border-outline-variant/60">
          <div>
            <h2 className="text-xl font-bold text-primary-container tracking-tight">
              Add Prescription
            </h2>
            <p className="text-xs text-on-surface-variant font-medium">Patient: <span className="font-semibold text-primary-container">{patientName || 'Patient'}</span></p>
          </div>
          <button
            onClick={handleCloseModal}
            className="text-on-surface-variant hover:text-primary-container p-1 rounded-lg hover:bg-surface-variant transition-colors"
            type="button"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>

        {!validPatientId && (
          <div className="p-3 mb-3 rounded-xl bg-[#FFF5F5] text-[#D93838] border border-[#FFE0E0] text-xs">
            <strong>Patient ID is missing.</strong> This is likely a system error. Please try:
            <ul className="list-disc ml-5 mt-1">
              <li>Closing this modal and selecting the patient again</li>
              <li>Refreshing the page and trying again</li>
            </ul>
          </div>
        )}

        {message.text && (
          <div className={`p-3 mb-3 rounded-xl text-xs font-medium ${message.type === 'success' ? 'bg-[#F0FDF4] text-[#15803D] border border-[#BBF7D0]' : 'bg-[#FFF5F5] text-[#D93838] border border-[#FFE0E0]'
            }`}>
            {message.text}
          </div>
        )}

        <div className="p-3.5 mb-4 border border-outline-variant/60 rounded-xl bg-surface-container-low/50">
          <h3 className="text-xs font-bold text-primary-container uppercase tracking-wider mb-1.5">Medical Condition</h3>
          <div>
            <select
              id="condition"
              name="condition"
              value={condition}
              onChange={handleConditionChange}
              className="w-full border border-outline-variant/60 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary/40 focus:border-primary text-xs font-medium text-primary-container bg-surface"
            >
              {commonConditions.map(cond => (
                <option key={cond} value={cond}>{cond}</option>
              ))}
            </select>
            {condition === 'Other' && (
              <input
                type="text"
                placeholder="Specify condition"
                className="w-full mt-2 border border-outline-variant/60 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary/40 focus:border-primary text-xs text-primary-container bg-surface"
                onChange={(e) => setCondition(e.target.value)}
              />
            )}
          </div>
          <p className="text-[11px] text-on-surface-variant font-medium mt-1">This condition will be associated with the prescription and visible to the patient</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Left column: Medicine search and list */}
          <div className="border border-outline-variant/60 rounded-xl p-3.5 bg-surface-lowest">
            <h3 className="font-bold text-xs uppercase tracking-wider mb-2.5 text-primary-container">Search Medicines</h3>

            <div className="mb-3">
              <input
                type="text"
                placeholder="Search medicine by name..."
                value={search}
                onChange={handleSearchChange}
                className="w-full px-3 py-1.5 border border-outline-variant/60 rounded-lg text-xs text-primary-container bg-surface focus:outline-none focus:ring-1 focus:ring-primary/40 focus:border-primary"
              />
            </div>

            <div className="max-h-80 overflow-y-auto border border-outline-variant/60 rounded-lg divide-y divide-outline-variant/40">
              {loading ? (
                <div className="p-4 text-center text-xs text-on-surface-variant font-medium">Loading medicines...</div>
              ) : filteredMedicines.length > 0 ? (
                <ul>
                  {filteredMedicines.slice(0, 50).map((med) => (
                    <li key={med.id} className="p-2.5 hover:bg-surface-variant/30 flex justify-between items-center border-b border-outline-variant/30 last:border-0 transition-colors">
                      <div>
                        <div className="font-bold text-xs text-primary-container">{med.name}</div>
                        <div className="text-[11px] text-on-surface-variant font-medium">
                          {med.composition1} {med.composition2}
                        </div>
                        <div className="text-[11px] font-semibold text-primary">₹{med.price}</div>
                      </div>
                      <button
                        onClick={() => handleAddMedicine(med)}
                        className="bg-primary/10 text-primary hover:bg-primary hover:text-on-primary px-2.5 py-1 rounded-md text-xs font-bold border border-primary/20 transition-colors"
                        type="button"
                      >
                        Add
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="p-4 text-center text-xs text-on-surface-variant">No medicines found</div>
              )}
            </div>
          </div>

          {/* Right column: Selected medications and prescription details */}
          <div className="border border-outline-variant/60 rounded-xl p-3.5 bg-surface-lowest flex flex-col justify-between">
            <div>
              <h3 className="font-bold text-xs uppercase tracking-wider mb-2.5 text-primary-container">Prescription Details</h3>

              {selectedMedicines.length === 0 ? (
                <div className="p-6 text-center text-xs text-on-surface-variant border border-outline-variant/60 rounded-lg mb-3 bg-surface-container-lowest">
                  No medicines added to prescription yet. Search and add medicines from the left panel.
                </div>
              ) : (
                <div className="max-h-80 overflow-y-auto border border-outline-variant/60 rounded-lg divide-y divide-outline-variant/40 mb-3">
                  {selectedMedicines.map((med, index) => (
                    <div key={`${med.id}-${index}`} className="p-3 bg-surface">
                      <div className="flex justify-between items-start mb-1.5">
                        <div className="font-bold text-xs text-primary-container">{med.name}</div>
                        <button
                          onClick={() => handleRemoveMedicine(index)}
                          className="text-[#D93838] hover:opacity-80 p-0.5 rounded transition-opacity"
                          type="button"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                          </svg>
                        </button>
                      </div>

                      <div className="text-[11px] text-on-surface-variant mb-2">
                        {med.composition1} {med.composition2}
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-on-surface-variant mb-0.5">
                            Dosage
                          </label>
                          <select
                            value={med.dosage}
                            onChange={(e) => handleMedicineChange(index, 'dosage', e.target.value)}
                            className="w-full border border-outline-variant/60 rounded-md px-2 py-1 text-xs text-primary-container bg-surface-lowest focus:ring-1 focus:ring-primary/40 outline-none"
                          >
                            <option value="0.5">1/2 tab/cap</option>
                            <option value="1">1 tab/cap</option>
                            <option value="2">2 tabs/caps</option>
                            <option value="5ml">5ml (liquid)</option>
                            <option value="10ml">10ml (liquid)</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-on-surface-variant mb-0.5">
                            Duration
                          </label>
                          <select
                            value={med.duration}
                            onChange={(e) => handleMedicineChange(index, 'duration', e.target.value)}
                            className="w-full border border-outline-variant/60 rounded-md px-2 py-1 text-xs text-primary-container bg-surface-lowest focus:ring-1 focus:ring-primary/40 outline-none"
                          >
                            <option value="3 days">3 days</option>
                            <option value="5 days">5 days</option>
                            <option value="7 days">7 days</option>
                            <option value="10 days">10 days</option>
                            <option value="15 days">15 days</option>
                            <option value="30 days">30 days</option>
                          </select>
                        </div>
                      </div>

                      <div className="mt-2">
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-on-surface-variant mb-0.5">
                          Timing
                        </label>
                        <div className="flex space-x-3 text-xs">
                          <label className="flex items-center space-x-1 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={med.timing.morning}
                              onChange={(e) => handleMedicineChange(index, 'timing.morning', e.target.checked)}
                              className="rounded border-outline-variant/60 text-primary focus:ring-primary/30"
                            />
                            <span className="text-[11px] text-primary-container font-medium">Morn</span>
                          </label>
                          <label className="flex items-center space-x-1 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={med.timing.afternoon}
                              onChange={(e) => handleMedicineChange(index, 'timing.afternoon', e.target.checked)}
                              className="rounded border-outline-variant/60 text-primary focus:ring-primary/30"
                            />
                            <span className="text-[11px] text-primary-container font-medium">Aft</span>
                          </label>
                          <label className="flex items-center space-x-1 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={med.timing.evening}
                              onChange={(e) => handleMedicineChange(index, 'timing.evening', e.target.checked)}
                              className="rounded border-outline-variant/60 text-primary focus:ring-primary/30"
                            />
                            <span className="text-[11px] text-primary-container font-medium">Eve</span>
                          </label>
                        </div>
                      </div>

                      <div className="mt-2">
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-on-surface-variant mb-0.5">
                          Instructions
                        </label>
                        <select
                          value={med.instructions}
                          onChange={(e) => handleMedicineChange(index, 'instructions', e.target.value)}
                          className="w-full border border-outline-variant/60 rounded-md px-2 py-1 text-xs text-primary-container bg-surface-lowest focus:ring-1 focus:ring-primary/40 outline-none"
                        >
                          <option value="before_food">Before food</option>
                          <option value="after_food">After food</option>
                          <option value="with_food">With food</option>
                          <option value="empty_stomach">Empty stomach</option>
                          <option value="as_needed">As needed</option>
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={handleSubmit}
              disabled={loading || selectedMedicines.length === 0}
              className={`w-full py-2 rounded-xl font-bold text-xs text-on-primary transition-all shadow-xs ${loading || selectedMedicines.length === 0 ? 'bg-primary-container/40 cursor-not-allowed' : 'bg-primary-container hover:bg-[#0d1322] active:scale-[0.99]'
                }`}
              type="button"
            >
              {loading ? 'Processing...' : 'Submit Prescription'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AddPrescription;
