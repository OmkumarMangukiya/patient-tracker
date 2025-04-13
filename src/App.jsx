import './App.css';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import Signin from './pages/Signin';
import DoctorDashboard from './Pages/DoctorDashboard';
import PatientDashboard from './Pages/PatientDashboard';
import SetPassword from './Components/SetPassword';
import Signup from './Pages/Signup';
import { useEffect } from 'react';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-white text-black">
        <Routes>
          <Route path="/" element={<Signin />} />
          <Route path="/doctor/dashboard" element={<WithLogout Component={DoctorDashboard} role="doctor" />} />
          <Route path="/doctor/appointments" element={<WithLogout Component={DoctorDashboard} role="doctor" initialTab="appointments" />} />
          <Route path="/doctor/messages" element={<WithLogout Component={DoctorDashboard} role="doctor" initialTab="messages" />} />
          <Route path="/patient/dashboard" element={<WithLogout Component={PatientDashboard} role="patient" />} />
          <Route path="/patient/appointments" element={<WithLogout Component={PatientDashboard} role="patient" initialTab="appointments" />} />
          <Route path="/patient/messages" element={<WithLogout Component={PatientDashboard} role="patient" initialTab="messages" />} />
          <Route path="/set-password" element={<WithLogout Component={SetPassword} />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/patient/medications" element={<WithLogout Component={PatientDashboard} role="patient" initialTab="medications" />} />
          <Route path="/patient/prescriptions" element={<WithLogout Component={PatientDashboard} role="patient" initialTab="prescriptions" />} />
        </Routes>
      </div>
    </Router>
  );
}

const WithLogout = ({ Component, role, initialTab }) => {
  const navigate = useNavigate();
  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  return (
    <div className="bg-white text-black">
      <nav className="bg-blue-600 p-4 shadow-md">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-white text-xl font-bold">Patient Tracker</h1>
          <div className="flex items-center space-x-4">
            {role === 'doctor' && (
              <>
                <a 
                  href="/doctor/dashboard" 
                  className="text-white hover:text-blue-100 transition-colors"
                >
                  Dashboard
                </a>
                <a 
                  href="/doctor/appointments" 
                  className="text-white hover:text-blue-100 transition-colors"
                >
                  Appointments
                </a>
                <a 
                  href="/doctor/messages" 
                  className="text-white hover:text-blue-100 transition-colors"
                >
                  Messages
                </a>
              </>
            )}
            {role === 'patient' && (
              <>
                <a 
                  href="/patient/dashboard" 
                  className="text-white hover:text-blue-100 transition-colors"
                >
                  Dashboard
                </a>
                <a 
                  href="/patient/medications" 
                  className="text-white hover:text-blue-100 transition-colors"
                >
                  Medications
                </a>
                <a 
                  href="/patient/prescriptions" 
                  className="text-white hover:text-blue-100 transition-colors"
                >
                  Prescriptions
                </a>
                <a 
                  href="/patient/appointments" 
                  className="text-white hover:text-blue-100 transition-colors"
                >
                  Appointments
                </a>
                <a 
                  href="/patient/messages" 
                  className="text-white hover:text-blue-100 transition-colors"
                >
                  Messages
                </a>
              </>
            )}
            <button
              onClick={handleLogout}
              className="bg-white text-blue-600 px-4 py-2 rounded hover:bg-gray-100 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>
      <Component initialTab={initialTab} />
    </div>
  );
};

export default App;
