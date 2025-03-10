import './App.css';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import Signin from './pages/Signin';
import DoctorDashboard from './Pages/DoctorDashboard';
import PatientDashboard from './Pages/PatientDashboard';
import SetPassword from './Components/SetPassword';
import Signup from './Pages/Signup';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Signin />} />
        <Route path="/doctor/dashboard" element={<WithLogout Component={DoctorDashboard} />} />
        <Route path="/patient/dashboard" element={<WithLogout Component={PatientDashboard} />} />
        <Route path="/set-password" element={<WithLogout Component={SetPassword} />} />
        <Route path="/signup" element={<Signup />} />
      </Routes>
    </Router>
  );
}

const WithLogout = ({ Component }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  return (
    <>
      <button onClick={handleLogout}>Logout</button>
      <Component />
    </>
  );
};

export default App;
