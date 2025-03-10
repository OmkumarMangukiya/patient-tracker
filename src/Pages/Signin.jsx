import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import backgroundImage from './PatientTracker1.jpg'; // Import the image
function Signin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  async function handleLogin() {
    try {

      const response = await axios.post("http://localhost:8000/auth/signin", { email, password,role });
      localStorage.setItem("token", response.data.token);
      localStorage.setItem("role", response.data.role);
      navigate(response.data.role === "patient" ? "/patient/dashboard" : "/doctor/dashboard");
    } catch (error) {
      console.error("Signin failed", error);
    }
  } 

  return (
    <div className="flex flex-col items-center p-4 bg-blue-200 min-h-screen" style={{ backgroundImage: `url(${backgroundImage})` }}>
      <div className="absolute inset-0 bg-black opacity-50 mix-blend-multiply"></div>
      <h1 className="text-2xl font-bold text-black">Signin</h1>
        <select className="text-black border-black" value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="">Select Role</option>
            <option value="patient">Patient</option>
            <option value="doctor">Doctor</option>
        </select>
      <input className=" text-black border-black" type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <div className="relative">
        <input className=" text-black border-black" type={showPassword ? "text" : "password"} placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <button  type="button" onClick={() => setShowPassword(!showPassword)}>👁</button>
      </div>
      <button className='text-white bg-white border border-black px-4 py-2'onClick={handleLogin}>Signin</button>
      <button className='text-white bg-white border border-black px-4 py-2' onClick={() => navigate("/signup")}>Signup</button>
    </div>
  );
}

export default Signin;