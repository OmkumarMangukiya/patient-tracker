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
          <div className="bg-white p-6 rounded-lg shadow-sm text-black">
            <h2 className="text-2xl font-semibold mb-6">Welcome, Dr. {doctorData?.name}</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-black">Total Patients</h3>
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <p className="text-2xl font-semibold text-black">{patients.length}</p>
              </div>
              
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-black">Today's Appointments</h3>
                  <Calendar className="w-5 h-5 text-green-600" />
                </div>
                <p className="text-2xl font-semibold text-black">{appointmentCounts.today}</p>
              </div>
              
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-black">Upcoming Appointments</h3>
                  <Calendar className="w-5 h-5 text-purple-600" />
                </div>
                <p className="text-2xl font-semibold text-black">{appointmentCounts.upcoming}</p>
              </div>
            </div>
            
            <div className="mb-8">
              <h3 className="text-xl font-semibold mb-4 text-black">Quick Actions</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={() => setActiveTab('add-patient')}
                  className="flex items-center justify-center gap-2 p-3 bg-white border border-blue-200 text-blue-700 rounded-lg hover:bg-blue-50"
                >
                  <Plus className="w-5 h-5" />
                  <span>Add New Patient</span>
                </button>
                
                <button
                  onClick={() => setActiveTab('add-prescription')}
                  className="flex items-center justify-center gap-2 p-3 bg-white border border-green-200 text-green-700 rounded-lg hover:bg-green-50"
                >
                  <FileText className="w-5 h-5" />
                  <span>Create Prescription</span>
                </button>
                
                <button
                  onClick={() => setActiveTab('appointments')}
                  className="flex items-center justify-center gap-2 p-3 bg-white border border-purple-200 text-purple-700 rounded-lg hover:bg-purple-50"
                >
                  <Calendar className="w-5 h-5" />
                  <span>View Appointments</span>
                </button>
              </div>
            </div>
            
            {/* Recent Patients */}
            {patients.length > 0 && (
              <div>
                <h3 className="text-xl font-semibold mb-4 text-black">Recent Patients</h3>
                <div className="overflow-hidden border border-gray-200 rounded-lg">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-white">
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
        return <RetirevePatient />;
      
      case 'add-patient':
        return <AddPatient />;
      
      case 'add-prescription':
        return <AddPrescription />;
      
      case 'appointments':
        return <AppointmentList userRole="doctor" />;
      
      default:
        return <div className="text-black">Select a tab</div>;
    }
  };

  return (
    <div className="container mx-auto p-4 bg-white text-black">
      <div className="bg-white shadow-sm p-4 mb-6 rounded-lg">
        <div className="flex overflow-x-auto">
          <button
            className={`px-4 py-2 font-medium text-sm rounded-md mr-2 ${
              activeTab === 'dashboard'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
            }`}
            onClick={() => setActiveTab('dashboard')}
          >
            <span className="flex items-center gap-1">
              <ListFilter className="w-4 h-4" />
              Dashboard
            </span>
          </button>
          
          <button
            className={`px-4 py-2 font-medium text-sm rounded-md mr-2 ${
              activeTab === 'patients'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
            }`}
            onClick={() => setActiveTab('patients')}
          >
            <span className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              Patients
            </span>
          </button>
          
          <button
            className={`px-4 py-2 font-medium text-sm rounded-md mr-2 ${
              activeTab === 'add-patient'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
            }`}
            onClick={() => setActiveTab('add-patient')}
          >
            <span className="flex items-center gap-1">
              <Plus className="w-4 h-4" />
              Add Patient
            </span>
          </button>
          
          <button
            className={`px-4 py-2 font-medium text-sm rounded-md mr-2 ${
              activeTab === 'add-prescription'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
            }`}
            onClick={() => setActiveTab('add-prescription')}
          >
            <span className="flex items-center gap-1">
              <FileText className="w-4 h-4" />
              Add Prescription
            </span>
          </button>
          
          <button
            className={`px-4 py-2 font-medium text-sm rounded-md ${
              activeTab === 'appointments'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
            }`}
            onClick={() => setActiveTab('appointments')}
          >
            <span className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              Appointments
            </span>
          </button>
        </div>
      </div>
      
      {renderTabContent()}
    </div>
  );
}

export default DoctorDashboard;
