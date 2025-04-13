import './App.css';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import Signin from './pages/Signin';
import DoctorDashboard from './pages/DoctorDashboard';
import PatientDashboard from './pages/PatientDashboard';
import SetPassword from './components/SetPassword';
import Signup from './pages/Signup';
import { useEffect } from 'react';

// Import the Button component
import { Button } from './components/ui/button';

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
      <nav className="bg-medical-green p-4 shadow-md sticky top-0 z-50">
        <div className="container mx-auto flex flex-col md:flex-row md:justify-between md:items-center">
          <div className="flex justify-between items-center w-full md:w-auto mb-4 md:mb-0">
            <h1 className="text-white text-xl font-bold">Patient Tracker</h1>
            <Button
              onClick={handleLogout}
              variant="outline"
              className="md:hidden bg-white text-medical-green hover:bg-gray-100 border-none"
            >
              Logout
            </Button>
          </div>
          
          <div className="flex flex-col md:flex-row md:items-center md:space-x-6 space-y-2 md:space-y-0">
            {role === 'doctor' && (
              <>
                <a 
                  href="/doctor/dashboard" 
                  className="text-white hover:text-medical-green-light transition-colors"
                >
                  Dashboard
                </a>
                <a 
                  href="/doctor/appointments" 
                  className="text-white hover:text-medical-green-light transition-colors"
                >
                  Appointments
                </a>
                <a 
                  href="/doctor/messages" 
                  className="text-white hover:text-medical-green-light transition-colors"
                >
                  Messages
                </a>
              </>
            )}
            {role === 'patient' && (
              <>
                <a 
                  href="/patient/dashboard" 
                  className="text-white hover:text-medical-green-light transition-colors"
                >
                  Dashboard
                </a>
                <a 
                  href="/patient/medications" 
                  className="text-white hover:text-medical-green-light transition-colors"
                >
                  Medications
                </a>
                <a 
                  href="/patient/prescriptions" 
                  className="text-white hover:text-medical-green-light transition-colors"
                >
                  Prescriptions
                </a>
                <a 
                  href="/patient/appointments" 
                  className="text-white hover:text-medical-green-light transition-colors"
                >
                  Appointments
                </a>
                <a 
                  href="/patient/messages" 
                  className="text-white hover:text-medical-green-light transition-colors"
                >
                  Messages
                </a>
              </>
            )}
            <Button
              onClick={handleLogout}
              variant="outline"
              className="hidden md:block text-white hover:bg-white hover:text-medical-green border-white"
            >
              Logout
            </Button>
          </div>
        </div>
      </nav>
      <Component initialTab={initialTab} />
    </div>
  );
};

export default App;
