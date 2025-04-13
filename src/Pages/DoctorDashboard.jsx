import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import RetirevePatient from '../Components/RetirevePatient';
import AddPatient from '../Components/AddPatient';
import AddPrescription from '../Components/AddPrescription';
import AppointmentList from '../Components/AppointmentList';
import { Calendar, Users, FileText, Plus, ListFilter } from 'lucide-react';

function DoctorDashboard({ initialTab }) {
  const [activeTab, setActiveTab] = useState(initialTab || 'patients');
  const [doctorData, setDoctorData] = useState(null);
  const [patients, setPatients] = useState([]);
  const [appointmentCounts, setAppointmentCounts] = useState({
    today: 0,
    upcoming: 0,
    total: 0
  });
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDoctorData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/');
          return;
        }

        const decodedToken = JSON.parse(atob(token.split('.')[1]));
        console.log('Decoded token:', decodedToken); // Debug: check what's in the token
        setDoctorData(decodedToken);

        // Fetch patients
        const patientsResponse = await axios.get('http://localhost:8000/doctor/retrievePatients', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setPatients(patientsResponse.data);

        // Fetch appointment counts
        const appointmentsResponse = await axios.get('http://localhost:8000/doctor/appointments', {
          headers: { Authorization: `Bearer ${token}` }
        });

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const todayAppointments = appointmentsResponse.data.filter(
          appointment => {
            const appointmentDate = new Date(appointment.appointmentDate);
            return appointmentDate >= today && appointmentDate < tomorrow && appointment.status === 'scheduled';
          }
        );

        const upcomingAppointments = appointmentsResponse.data.filter(
          appointment => {
            const appointmentDate = new Date(appointment.appointmentDate);
            return appointmentDate >= tomorrow && appointment.status === 'scheduled';
          }
        );

        setAppointmentCounts({
          today: todayAppointments.length,
          upcoming: upcomingAppointments.length,
          total: appointmentsResponse.data.length
        });
      } catch (error) {
        console.error('Error fetching doctor data:', error);
      }
    };

    fetchDoctorData();
  }, [navigate]);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="p-6">
            <h2 className="text-2xl font-semibold mb-6 text-gray-800">Welcome, Dr. {doctorData?.name}</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center">
                  <div className="p-3 rounded-lg bg-teal-100 mr-4">
                    <Users className="h-6 w-6 text-teal-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Total Patients</p>
                    <p className="text-2xl font-bold text-gray-800">{patients.length}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center">
                  <div className="p-3 rounded-lg bg-blue-100 mr-4">
                    <Calendar className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Today's Appointments</p>
                    <p className="text-2xl font-bold text-gray-800">{appointmentCounts.today}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center">
                  <div className="p-3 rounded-lg bg-purple-100 mr-4">
                    <Calendar className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Upcoming Appointments</p>
                    <p className="text-2xl font-bold text-gray-800">{appointmentCounts.upcoming}</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mb-8">
              <h3 className="text-xl font-semibold mb-4 text-gray-800">Quick Actions</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={() => setActiveTab('add-patient')}
                  className="flex items-center justify-center gap-2 p-3 bg-teal-50 hover:bg-teal-100 rounded-lg text-teal-700 transition duration-200"
                >
                  <Plus className="w-5 h-5" />
                  <span>Add New Patient</span>
                </button>
                
                <button
                  onClick={() => setActiveTab('add-prescription')}
                  className="flex items-center justify-center gap-2 p-3 bg-blue-50 hover:bg-blue-100 rounded-lg text-blue-700 transition duration-200"
                >
                  <FileText className="w-5 h-5" />
                  <span>Create Prescription</span>
                </button>
                
                <button
                  onClick={() => setActiveTab('appointments')}
                  className="flex items-center justify-center gap-2 p-3 bg-purple-50 hover:bg-purple-100 rounded-lg text-purple-700 transition duration-200"
                >
                  <Calendar className="w-5 h-5" />
                  <span>View Appointments</span>
                </button>
              </div>
            </div>
            
            {/* Recent Patients */}
            {patients.length > 0 && (
              <div>
                <h3 className="text-xl font-semibold mb-4 text-gray-800">Recent Patients</h3>
                <div className="overflow-hidden border border-gray-200 rounded-lg bg-white">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {patients.slice(0, 5).map((patient) => (
                        <tr key={patient.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="font-medium text-gray-900">{patient.name}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-gray-500">{patient.email}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              patient.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                            }`}>
                              {patient.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        );
      
      case 'patients':
        return (
          <div className="p-6">
            <RetirevePatient />
          </div>
        );
      
      case 'add-patient':
        return (
          <div className="p-6">
            <AddPatient />
          </div>
        );
      
      case 'add-prescription':
        return (
          <div className="p-6">
            <AddPrescription />
          </div>
        );
      
      case 'appointments':
        return (
          <div className="p-6">
            <AppointmentList userRole="doctor" />
          </div>
        );
      
      default:
        return (
          <div className="p-6 text-gray-700">
            Select a tab
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Doctor Dashboard</h1>
            <p className="text-gray-600">Manage your patients and appointments</p>
          </div>
          <div className="flex items-center mt-4 md:mt-0">
            <div className="bg-white rounded-lg shadow-sm p-2 flex items-center">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                {doctorData && (
                  <>
                    <p className="font-medium text-gray-700">Dr. {doctorData.name}</p>
                    <p className="text-xs text-gray-500">{doctorData.specialization || 'Physician'}</p>
                  </>
                )}
                {!doctorData && (
                  <>
                    <p className="font-medium text-gray-700">Loading...</p>
                    <p className="text-xs text-gray-500">Please wait</p>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-xl shadow-sm mb-6">
          <div className="flex overflow-x-auto">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-6 py-4 font-medium text-sm flex items-center ${
                activeTab === 'dashboard' 
                  ? 'text-blue-600 border-b-2 border-blue-500 bg-blue-50' 
                  : 'text-gray-500 hover:text-blue-600 hover:bg-blue-50'
              } transition-colors duration-200`}
            >
              <ListFilter className="h-5 w-5 mr-2" />
              Dashboard
            </button>
            
            <button
              onClick={() => setActiveTab('patients')}
              className={`px-6 py-4 font-medium text-sm flex items-center ${
                activeTab === 'patients' 
                  ? 'text-teal-600 border-b-2 border-teal-500 bg-teal-50' 
                  : 'text-gray-500 hover:text-teal-600 hover:bg-teal-50'
              } transition-colors duration-200`}
            >
              <Users className="h-5 w-5 mr-2" />
              My Patients
            </button>
            
            <button
              onClick={() => setActiveTab('add-patient')}
              className={`px-6 py-4 font-medium text-sm flex items-center ${
                activeTab === 'add-patient' 
                  ? 'text-blue-600 border-b-2 border-blue-500 bg-blue-50' 
                  : 'text-gray-500 hover:text-blue-600 hover:bg-blue-50'
              } transition-colors duration-200`}
            >
              <Plus className="h-5 w-5 mr-2" />
              Add Patient
            </button>
            
            <button
              onClick={() => setActiveTab('add-prescription')}
              className={`px-6 py-4 font-medium text-sm flex items-center ${
                activeTab === 'add-prescription' 
                  ? 'text-green-600 border-b-2 border-green-500 bg-green-50' 
                  : 'text-gray-500 hover:text-green-600 hover:bg-green-50'
              } transition-colors duration-200`}
            >
              <FileText className="h-5 w-5 mr-2" />
              Add Prescription
            </button>
            
            <button
              onClick={() => setActiveTab('appointments')}
              className={`px-6 py-4 font-medium text-sm flex items-center ${
                activeTab === 'appointments' 
                  ? 'text-purple-600 border-b-2 border-purple-500 bg-purple-50' 
                  : 'text-gray-500 hover:text-purple-600 hover:bg-purple-50'
              } transition-colors duration-200`}
            >
              <Calendar className="h-5 w-5 mr-2" />
              Appointments
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
}

export default DoctorDashboard;