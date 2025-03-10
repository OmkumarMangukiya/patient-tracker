import { useState } from "react";
import RetirevePatient from "../Components/RetirevePatient";
import AddPatient from "../Components/AddPatient";

function DoctorDashboard() {
  const [activeTab, setActiveTab] = useState("patients");
  // Add state for patient data
  const [patientData, setPatientData] = useState([]);
  // Add state for form inputs
  const [formInputs, setFormInputs] = useState({
    name: "",
    age: "",
    gender: "",
    condition: ""
  });

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormInputs({
      ...formInputs,
      [name]: value
    });
  };

  return (
    <div className="container p-4">
      <h1 className="text-2xl font-bold mb-4">Doctor Dashboard</h1>
      
      {/* Tab Navigation */}
      <div className="mb-4 border-b">
        <button
          onClick={() => setActiveTab("patients")}
          className={`mr-4 p-2 ${activeTab === "patients" ? "font-bold border-b-2 border-blue-500" : ""}`}
        >
          My Patients
        </button>
        <button
          onClick={() => setActiveTab("add")}
          className={`mr-4 p-2 ${activeTab === "add" ? "font-bold border-b-2 border-blue-500" : ""}`}
        >
          Add Patient
        </button>
        <button
          onClick={() => setActiveTab("appointments")}
          className={`mr-4 p-2 ${activeTab === "appointments" ? "font-bold border-b-2 border-blue-500" : ""}`}
        >
          Appointments
        </button>
      </div>
      
      {/* Tab Content */}
      <div className="p-2 border">
        {activeTab === "patients" && <RetirevePatient patientData={patientData} />}
        {activeTab === "add" && <AddPatient formInputs={formInputs} onInputChange={handleInputChange} />}
        {activeTab === "appointments" && (
          <div className="p-2">
            <p>Appointments feature coming soon</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default DoctorDashboard;
