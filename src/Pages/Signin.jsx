import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

function Signin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  async function handleLogin() {
    try {
      const response = await axios.post("http://localhost:8000/auth/signin", { email, password });
      localStorage.setItem("token", response.data.token);
      localStorage.setItem("role", response.data.role);
      navigate(response.data.role === "patient" ? "/patient/dashboard" : "/doctor/dashboard");
    } catch (error) {
      console.error("Signin failed", error);
    }
  } 

  return (
    <div className="flex flex-col items-center p-4 bg-blue-200 min-h-screen">
      <h1 className="text-2xl font-bold text-black">Signin</h1>
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