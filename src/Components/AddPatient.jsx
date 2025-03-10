import { useState, useEffect } from 'react';
import axios from 'axios';

function AddPatient({ formInputs = null, onInputChange = null }) {
  // Use local state if no external state is provided
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    age: '',
    gender: 'male' // Default value
  });
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  
  // If external state management is provided, sync with it
  useEffect(() => {
    if (formInputs) {
      setFormData(prev => ({
        ...prev,
        ...formInputs
      }));
    }
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
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ text: '', type: '' });
    
    try {
      const token = localStorage.getItem('token');
      
      const response = await axios.post(
        'http://localhost:8000/doctor/add-patient', 
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
      
      // Reset form after successful submission
      setFormData({
        name: '',
        email: '',
        age: '',
        gender: 'male'
      });
      
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
    <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-semibold mb-6 text-center">Add New Patient</h2>
      
      {message.text && (
        <div className={`p-4 mb-4 rounded ${
          message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        }`}>
          {message.text}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="name" className="block text-gray-700 font-medium mb-2">Full Name</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
            placeholder="Enter patient's full name"
            required
          />
        </div>
        
        <div className="mb-4">
          <label htmlFor="email" className="block text-gray-700 font-medium mb-2">Email Address</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
            placeholder="patient@example.com"
            required
          />
        </div>
        
        <div className="mb-4">
          <label htmlFor="age" className="block text-gray-700 font-medium mb-2">Age</label>
          <input
            type="number"
            id="age"
            name="age"
            value={formData.age}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
            placeholder="Enter age"
          />
        </div>
        
        <div className="mb-6">
          <label className="block text-gray-700 font-medium mb-2">Gender</label>
          <div className="flex space-x-4">
            <label className="inline-flex items-center">
              <input
                type="radio"
                name="gender"
                value="male"
                checked={formData.gender === 'male'}
                onChange={handleChange}
                className="form-radio h-4 w-4 text-blue-600"
              />
              <span className="ml-2 text-gray-800">Male</span>
            </label>
            <label className="inline-flex items-center">
              <input
                type="radio"
                name="gender"
                value="female"
                checked={formData.gender === 'female'}
                onChange={handleChange}
                className="form-radio h-4 w-4 text-blue-600"
              />
              <span className="ml-2 text-gray-800">Female</span>
            </label>
            <label className="inline-flex items-center">
              <input
                type="radio"
                name="gender"
                value="other"
                checked={formData.gender === 'other'}
                onChange={handleChange}
                className="form-radio h-4 w-4 text-blue-600"
              />
              <span className="ml-2 text-gray-800">Other</span>
            </label>
          </div>
        </div>
        
        <button
          type="submit"
          disabled={loading}
          className={`w-full py-2 px-4 rounded font-medium text-white ${
            loading ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {loading ? 'Adding Patient...' : 'Add Patient'}
        </button>
      </form>
    </div>
  );
}

export default AddPatient;
