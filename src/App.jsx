import './App.css';
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom';
import Signup from './pages/Signup';
import Signin from './pages/Signin';
import DoctorDashboard from './pages/DoctorDashboard';
import PatientDashboard from './pages/PatientDashboard';

// Create a header component that uses location
function Header() {
  const location = useLocation();
  const showLogout = location.pathname !== '/' && location.pathname !== '/signup';

  return showLogout ? (
    <header>
      <button onClick={() => {
        localStorage.clear();
        window.location.href = "/"; // Redirect to signin page after logout
      }}>Logout</button>
    </header>
  ) : null;
}

function App() {
  return (
    <BrowserRouter>
      <Header />
      <Routes>
        <Route path="/" element={<Signin/>}/>
        <Route path="/signup" element={<Signup/>}/>
        <Route path="/patient/dashboard" element={<PatientDashboard/>}/>
        <Route path="/doctor/dashboard" element={<DoctorDashboard/>}/>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
