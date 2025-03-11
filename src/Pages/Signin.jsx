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
      const response = await axios.post("http://localhost:8000/auth/signin", { email, password, role });
      localStorage.setItem("token", response.data.token);
      localStorage.setItem("role", response.data.role);
      navigate(response.data.role === "patient" ? "/patient/dashboard" : "/doctor/dashboard");
    } catch (error) {
      console.error("Signin failed", error);
    }
  } 

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen bg-cover bg-center" 
      style={{ backgroundImage: `url(${backgroundImage})` }}>
      {/* Overlay with pointer-events: none so clicks pass through */}
      <div className="absolute inset-0 bg-black opacity-50 mix-blend-multiply pointer-events-none"></div>
      
      {/* Content container with higher z-index */}
      <div className="relative z-10 flex flex-col items-center bg-white p-8 rounded-lg shadow-lg space-y-4 max-w-md w-full">
        <h1 className="text-3xl font-bold text-red-800 mb-4">Sign In</h1>
        
        <select 
          className="w-full p-2 border border-gray-300 rounded text-red-800 focus:outline-none focus:ring-2 focus:ring-blue-500" 
          value={role} 
          onChange={(e) => setRole(e.target.value)}
        >
          <option value="">Select Role</option>
          <option value="patient">Patient</option>
          <option value="doctor">Doctor</option>
        </select>
        
        <input 
          className="w-full p-2 border border-gray-300 rounded text-red-800 focus:outline-none focus:ring-2 focus:ring-blue-500" 
          type="email" 
          placeholder="Email" 
          value={email} 
          onChange={(e) => setEmail(e.target.value)} 
        />
        
        <div className="relative w-full">
          <input 
            className="w-full p-2 border border-gray-300 rounded text-red-800 focus:outline-none focus:ring-2 focus:ring-blue-500" 
            type={showPassword ? "text" : "password"} 
            placeholder="Password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
          />
          <button 
            type="button" 
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-red-500 hover:text-red-700"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? '👁️' : '👁️‍🗨️'}
          </button>
        </div>
        
        <button 
          className="w-full bg-blue-600 hover:bg-blue-700 text-red font-medium py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          onClick={handleLogin}
        >
          Sign In
        </button>
        
        <div className="flex justify-center w-full pt-2">
          <span className="text-red-600 mr-2">Don't have an account?</span>
          <button 
            className="text-blue-600 hover:text-blue-800 font-medium focus:outline-none"
            onClick={() => navigate("/signup")}
          >
            Sign Up
          </button>
        </div>
      </div>
    </div>
  );
}

export default Signin;