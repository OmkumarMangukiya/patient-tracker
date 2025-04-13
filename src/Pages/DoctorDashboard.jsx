import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import RetirevePatient from '../components/RetirevePatient';
import AddPatient from '../components/AddPatient';
import AddPrescription from '../components/AddPrescription';
import AppointmentList from '../components/AppointmentList';
import EnhancedChatInterface from '../components/Chat/EnhancedChatInterface';
import { Calendar, Users, FileText, Plus, ListFilter, MessageSquare } from 'lucide-react';

// Import shadcn components
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';

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
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-3 rounded-lg bg-medical-green-light mr-4">
                      <Users className="h-6 w-6 text-medical-green-dark" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Total Patients</p>
                      <p className="text-2xl font-bold text-gray-800">{patients.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-3 rounded-lg bg-medical-green-light mr-4">
                      <Calendar className="h-6 w-6 text-medical-green-dark" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Today's Appointments</p>
                      <p className="text-2xl font-bold text-gray-800">{appointmentCounts.today}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-3 rounded-lg bg-medical-green-light mr-4">
                      <Calendar className="h-6 w-6 text-medical-green-dark" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Upcoming Appointments</p>
                      <p className="text-2xl font-bold text-gray-800">{appointmentCounts.upcoming}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="mb-8">
              <h3 className="text-xl font-semibold mb-4 text-gray-800">Quick Actions</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <Button
                  onClick={() => setActiveTab('add-patient')}
                  variant="outline"
                  className="flex items-center justify-center gap-2 h-auto py-3"
                >
                  <Plus className="w-5 h-5" />
                  <span>Add New Patient</span>
                </Button>
                
                <Button
                  onClick={() => setActiveTab('add-prescription')}
                  variant="outline"
                  className="flex items-center justify-center gap-2 h-auto py-3"
                >
                  <FileText className="w-5 h-5" />
                  <span>Create Prescription</span>
                </Button>
                
                <Button
                  onClick={() => setActiveTab('appointments')}
                  variant="outline"
                  className="flex items-center justify-center gap-2 h-auto py-3"
                >
                  <Calendar className="w-5 h-5" />
                  <span>View Appointments</span>
                </Button>
                
                <Button
                  onClick={() => setActiveTab('messages')}
                  variant="outline"
                  className="flex items-center justify-center gap-2 h-auto py-3"
                >
                  <MessageSquare className="w-5 h-5" />
                  <span>Messages</span>
                </Button>
              </div>
            </div>
            
            {/* Recent Patients */}
            {patients.length > 0 && (
              <div>
                <h3 className="text-xl font-semibold mb-4 text-gray-800">Recent Patients</h3>
                <Card>
                  <div className="overflow-hidden rounded-lg">
                    <div className="overflow-x-auto">
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
                                  patient.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-medical-green-light text-medical-green-dark'
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
                </Card>
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
      
      case 'messages':
        return (
          <div className="p-6 h-full">
            <EnhancedChatInterface userRole="doctor" />
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row md:justify-between md:items-center">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Doctor Dashboard</h1>
                <p className="text-gray-600">Manage your patients and appointments</p>
              </div>
              <div className="flex items-center mt-4 md:mt-0">
                <div className="bg-white rounded-lg shadow-sm p-2 flex items-center">
                  <div className="w-10 h-10 rounded-full bg-medical-green-light flex items-center justify-center mr-3">
                    <Users className="h-6 w-6 text-medical-green-dark" />
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
          </CardContent>
        </Card>

        {/* Tab Navigation */}
        <div className="bg-white rounded-xl shadow-sm mb-6 overflow-x-auto">
          <div className="flex">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-4 md:px-6 py-4 font-medium text-sm flex items-center whitespace-nowrap ${
                activeTab === 'dashboard' 
                  ? 'text-medical-green border-b-2 border-medical-green bg-medical-green-light/20' 
                  : 'text-gray-500 hover:text-medical-green hover:bg-medical-green-light/10'
              } transition-colors duration-200`}
            >
              <ListFilter className="h-5 w-5 mr-2" />
              Dashboard
            </button>
            
            <button
              onClick={() => setActiveTab('patients')}
              className={`px-4 md:px-6 py-4 font-medium text-sm flex items-center whitespace-nowrap ${
                activeTab === 'patients' 
                  ? 'text-medical-green border-b-2 border-medical-green bg-medical-green-light/20' 
                  : 'text-gray-500 hover:text-medical-green hover:bg-medical-green-light/10'
              } transition-colors duration-200`}
            >
              <Users className="h-5 w-5 mr-2" />
              My Patients
            </button>
            
            <button
              onClick={() => setActiveTab('add-patient')}
              className={`px-4 md:px-6 py-4 font-medium text-sm flex items-center whitespace-nowrap ${
                activeTab === 'add-patient' 
                  ? 'text-medical-green border-b-2 border-medical-green bg-medical-green-light/20' 
                  : 'text-gray-500 hover:text-medical-green hover:bg-medical-green-light/10'
              } transition-colors duration-200`}
            >
              <Plus className="h-5 w-5 mr-2" />
              Add Patient
            </button>
            
            <button
              onClick={() => setActiveTab('appointments')}
              className={`px-4 md:px-6 py-4 font-medium text-sm flex items-center whitespace-nowrap ${
                activeTab === 'appointments' 
                  ? 'text-medical-green border-b-2 border-medical-green bg-medical-green-light/20' 
                  : 'text-gray-500 hover:text-medical-green hover:bg-medical-green-light/10'
              } transition-colors duration-200`}
            >
              <Calendar className="h-5 w-5 mr-2" />
              Appointments
            </button>
            
            <button
              onClick={() => setActiveTab('messages')}
              className={`px-4 md:px-6 py-4 font-medium text-sm flex items-center whitespace-nowrap ${
                activeTab === 'messages' 
                  ? 'text-medical-green border-b-2 border-medical-green bg-medical-green-light/20' 
                  : 'text-gray-500 hover:text-medical-green hover:bg-medical-green-light/10'
              } transition-colors duration-200`}
            >
              <MessageSquare className="h-5 w-5 mr-2" />
              Messages
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <Card>
          {renderTabContent()}
        </Card>
      </div>
    </div>
  );
}

export default DoctorDashboard;