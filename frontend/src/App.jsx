import './App.css';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation, Link } from 'react-router-dom';
import Signin from './Pages/Signin';
import DoctorDashboard from './Pages/DoctorDashboard';
import PatientDashboard from './Pages/PatientDashboard';
import SetPassword from './Components/SetPassword';
import Signup from './Pages/Signup';
import ForgotPassword from './Components/ForgotPassword';
import ResetPassword from './Components/ResetPassword';
import { useEffect, useState } from 'react';

// Icons
import { 
  LayoutDashboard, 
  Pill, 
  ClipboardList, 
  Calendar, 
  Mail, 
  Plus, 
  Settings, 
  HelpCircle,
  LogOut,
  User,
  Menu,
  X,
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react';

function App() {
  return (
    <Router>
      <div className="font-sans min-h-screen bg-surface text-on-surface">
        <Routes>
          <Route path="/" element={<Signin />} />
          <Route path="/doctor/dashboard" element={<SidebarLayout Component={DoctorDashboard} role="doctor" />} />
          <Route path="/doctor/appointments" element={<SidebarLayout Component={DoctorDashboard} role="doctor" initialTab="appointments" />} />
          <Route path="/doctor/messages" element={<SidebarLayout Component={DoctorDashboard} role="doctor" initialTab="messages" />} />
          
          <Route path="/patient/dashboard" element={<SidebarLayout Component={PatientDashboard} role="patient" />} />
          <Route path="/patient/medications" element={<SidebarLayout Component={PatientDashboard} role="patient" initialTab="medications" />} />
          <Route path="/patient/prescriptions" element={<SidebarLayout Component={PatientDashboard} role="patient" initialTab="prescriptions" />} />
          <Route path="/patient/appointments" element={<SidebarLayout Component={PatientDashboard} role="patient" initialTab="appointments" />} />
          <Route path="/patient/messages" element={<SidebarLayout Component={PatientDashboard} role="patient" initialTab="messages" />} />
          
          <Route path="/set-password" element={<SidebarLayout Component={SetPassword} />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/signup" element={<Signup />} />
        </Routes>
      </div>
    </Router>
  );
}

const SidebarLayout = ({ Component, role, initialTab }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [userData, setUserData] = useState({ name: 'User', id: '0000' });
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decodedToken = JSON.parse(atob(token.split('.')[1]));
        setUserData({
          name: decodedToken.name || 'User',
          id: decodedToken.id || '0000',
        });
      } catch (e) {
        console.error("Error parsing token", e);
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  const currentPath = location.pathname;
  
  const navItems = role === 'doctor' 
    ? [
        { name: 'Dashboard', path: '/doctor/dashboard', icon: LayoutDashboard },
        { name: 'Appointments', path: '/doctor/appointments', icon: Calendar },
        { name: 'Messages', path: '/doctor/messages', icon: Mail },
      ]
    : [
        { name: 'Dashboard', path: '/patient/dashboard', icon: LayoutDashboard },
        { name: 'Prescriptions', path: '/patient/prescriptions', icon: ClipboardList },
        { name: 'Appointments', path: '/patient/appointments', icon: Calendar },
        { name: 'Messages', path: '/patient/messages', icon: Mail },
      ];

  // Helper to determine active state using standard pathname or initialTab fallback
  const isActive = (path) => {
    if (currentPath === path) return true;
    // Fallback for paths that map to the same component but different initialTab
    if (initialTab && path.includes(initialTab)) return true;
    if (!initialTab && path.includes('dashboard') && currentPath.includes('dashboard')) return true;
    return false;
  };

  return (
    <div className="flex min-h-screen bg-surface text-on-surface">
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-on-surface/40 backdrop-blur-sm z-40 transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 shrink-0 border-r border-transparent flex flex-col p-6 space-y-8 bg-surface transform transition-all duration-300 ease-in-out ${
        isSidebarOpen ? 'translate-x-0 shadow-2xl lg:shadow-none w-[280px]' : '-translate-x-full lg:translate-x-0 w-[280px]'
      } ${isSidebarCollapsed ? 'lg:w-20! lg:items-center lg:px-3' : 'lg:w-64'}`}>
        <div className="flex items-center justify-between w-full">
          {/* Brand */}
          {!isSidebarCollapsed && (
            <div className="font-bold text-2xl tracking-tight text-primary-container pl-2">
              Clinical Curator
            </div>
          )}
          {/* Desktop Collapse Toggle */}
          <button 
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} 
            className="hidden lg:flex p-2 text-on-surface-variant hover:bg-surface-container-highest rounded-lg transition-colors"
            title={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isSidebarCollapsed ? <PanelLeftOpen className="w-5 h-5" /> : <PanelLeftClose className="w-5 h-5" />}
          </button>
          {/* Mobile Close Button */}
          <button 
            onClick={() => setIsSidebarOpen(false)} 
            className="lg:hidden p-2 text-on-surface-variant hover:bg-surface-container-highest rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Card */}
        <div className={`bg-surface-lowest rounded-md p-4 shadow-[0_10px_40px_rgba(12,30,38,0.05)] flex items-center ${isSidebarCollapsed ? 'justify-center' : 'space-x-4'}`}>
          <div className="w-12 h-12 rounded-full bg-primary-container text-on-primary flex items-center justify-center overflow-hidden shrink-0">
            {/* Placeholder for User Profile Image */}
            <User className="w-6 h-6" />
          </div>
          {!isSidebarCollapsed && (
            <div className="flex flex-col">
              <span className="font-semibold text-primary-container leading-tight">{userData.name}</span>
              <span className="text-xs text-on-surface-variant">
                ID: #{userData.id ? String(userData.id).substring(0,4) : '...'}
              </span>
            </div>
          )}
        </div>

        {/* Primary Navigation */}
        <nav className="flex-1 space-y-2">
          {navItems.map((item) => {
            const active = isActive(item.path);
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                to={item.path}
                title={isSidebarCollapsed ? item.name : undefined}
                className={`flex items-center ${isSidebarCollapsed ? 'justify-center' : 'space-x-3'} px-4 py-3 rounded-lg transition-colors font-medium
                  ${active 
                    ? 'bg-surface-container-highest text-primary-container shadow-sm ring-1 ring-outline-variant/20' 
                    : 'text-on-surface-variant hover:bg-surface-container-low hover:text-primary-container'
                  }`}
              >
                <Icon className={`w-5 h-5 shrink-0 ${active ? 'text-primary-container' : 'text-on-surface-variant'}`} />
                {!isSidebarCollapsed && <span>{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Footer Navigation */}
        <div className="space-y-4 pt-8">
          {role !== 'doctor' && (
            <button 
              onClick={() => navigate(`/${role}/appointments`)}
              title={isSidebarCollapsed ? 'New Appointment' : undefined}
              className={`w-full flex items-center justify-center bg-linear-to-br from-primary to-primary-container text-on-primary rounded-full font-semibold transition-transform hover:scale-[1.02] shadow-[0_10px_40px_rgba(12,30,38,0.1)] ${isSidebarCollapsed ? 'p-3' : 'space-x-2 py-4 px-6'}`}
            >
              <Plus className="w-5 h-5 shrink-0" />
              {!isSidebarCollapsed && <span>New Appointment</span>}
            </button>
          )}
          
          <div className="pt-8 border-t border-outline-variant/20 space-y-2">
            <button 
              onClick={handleLogout}
              title={isSidebarCollapsed ? 'Logout' : undefined}
              className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center' : 'space-x-3'} px-4 py-3 rounded-lg text-[#D93838] hover:bg-[#FFF5F5] hover:text-[#D93838] transition-colors font-medium`}
            >
              <LogOut className="w-5 h-5 shrink-0" />
              {!isSidebarCollapsed && <span>Logout</span>}
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 bg-surface h-screen">
        {/* Mobile Header */}
        <div className="lg:hidden flex items-center justify-between p-4 bg-surface border-b border-outline-variant/20 sticky top-0 z-30">
          <div className="font-bold text-xl tracking-tight text-primary-container pl-2">
            Clinical Curator
          </div>
          <button 
            onClick={() => setIsSidebarOpen(true)} 
            className="p-2 -mr-2 text-on-surface-variant hover:bg-surface-container-low rounded-xl transition-colors"
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>


        <div className="flex-1 flex flex-col min-w-0 px-4 lg:pl-4 lg:pr-8 py-6 overflow-y-auto">
          <div className="flex-1 flex flex-col max-w-7xl w-full mx-auto">
            <Component initialTab={initialTab} />
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
