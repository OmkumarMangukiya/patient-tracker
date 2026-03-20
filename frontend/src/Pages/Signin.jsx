import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import apiClient from '../lib/apiClient';
import backgroundImage from './PatientTracker1.jpg';

function Signin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  async function handleLogin(e) {
    e.preventDefault();
    setError("");

    if (!role) {
      setError("Please select your role");
      return;
    }
    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiClient.post("/auth/signin", {
        email,
        password,
        role
      });
      localStorage.setItem("token", response.data.token);
      localStorage.setItem("role", response.data.role);
      navigate(response.data.role === "patient" ? "/patient/dashboard" : "/doctor/dashboard");
    } catch (error) {
      console.error("Signin failed", error);
      setError(error.response?.data?.message || "Signin failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen bg-cover bg-center bg-no-repeat font-sans"
      style={{ backgroundImage: `url(${backgroundImage})` }}>

      {/* Elegant dark overlay */}
      <div className="absolute inset-0 bg-primary-container/60 backdrop-blur-sm pointer-events-none"></div>

      {/* Main content container */}
      <div className="relative z-10 w-full max-w-md px-6 py-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="bg-surface/95 backdrop-blur-2xl rounded-3xl shadow-[0_20px_60px_rgba(12,30,38,0.3)] ring-1 ring-outline-variant/30 p-10 space-y-8">
          
          {/* Logo/Header */}
          <div className="text-center space-y-2">
            <h1 className="text-4xl font-bold tracking-tight text-primary-container">Welcome Back</h1>
            <p className="text-on-surface-variant font-medium">Please sign in to continue</p>
          </div>

          {/* Error message */}
          {error && (
            <div className="bg-[#FFF5F5] ring-1 ring-[#FFE0E0] p-4 rounded-xl flex items-start space-x-3">
              <svg className="h-5 w-5 text-[#D93838] shrink-0 mt-0.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <p className="text-sm text-[#D93838] font-medium leading-relaxed">{error}</p>
            </div>
          )}

          {/* Form */}
          <form className="space-y-6" onSubmit={handleLogin}>
            
            {/* Role selection */}
            <div className="space-y-1.5">
              <label htmlFor="role" className="block text-sm font-semibold text-primary-container">
                I am a
              </label>
              <div className="relative">
                <select
                  id="role"
                  className="w-full px-4 py-3.5 bg-surface-variant border-transparent rounded-xl focus:ring-1 focus:ring-primary/20 focus:bg-surface-container-lowest transition-all duration-300 text-primary-container font-medium appearance-none"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                >
                  <option value="" disabled className="text-on-surface-variant">Select your role</option>
                  <option value="patient" className="text-primary-container">Patient</option>
                  <option value="doctor" className="text-primary-container">Doctor</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-primary-container">
                  <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                </div>
              </div>
            </div>

            {/* Email field */}
            <div className="space-y-1.5">
              <label htmlFor="email" className="block text-sm font-semibold text-primary-container">
                Email address
              </label>
              <input
                id="email"
                className="w-full px-4 py-3.5 bg-surface-variant border-transparent rounded-xl focus:ring-1 focus:ring-primary/20 focus:bg-surface-container-lowest transition-all duration-300 text-primary-container font-medium placeholder-on-surface-variant/50"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            {/* Password field */}
            <div className="space-y-1.5">
              <label htmlFor="password" className="block text-sm font-semibold text-primary-container">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  className="w-full px-4 py-3.5 bg-surface-variant border-transparent rounded-xl focus:ring-1 focus:ring-primary/20 focus:bg-surface-container-lowest transition-all duration-300 pr-12 text-primary-container font-medium placeholder-on-surface-variant/50"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-on-surface-variant hover:text-primary-container transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  )}
                </button>
              </div>
              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  className="text-sm font-semibold text-on-surface-variant hover:text-primary-container transition-colors"
                  onClick={() => navigate("/forgot-password")}
                >
                  Forgot password?
                </button>
              </div>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-4 px-6 rounded-full font-bold text-on-primary bg-linear-to-br from-primary to-primary-container shadow-[0_10px_20px_rgba(12,30,38,0.2)] hover:shadow-[0_15px_30px_rgba(12,30,38,0.3)] transition-all duration-300 transform hover:-translate-y-0.5 ${isLoading ? 'opacity-75 cursor-not-allowed transform-none hover:shadow-[0_10px_20px_rgba(12,30,38,0.2)]' : ''}`}
            >
              {isLoading ? (
                <div className="flex items-center justify-center space-x-2">
                  <svg className="animate-spin h-5 w-5 text-on-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Signing in...</span>
                </div>
              ) : (
                'Sign in'
              )}
            </button>
          </form>

          {/* Sign up link */}
          <div className="text-center text-sm font-medium text-on-surface-variant">
            Don't have an account?{' '}
            <button
              className="font-bold text-primary-container hover:text-primary transition-colors underline decoration-primary-container/30 hover:decoration-primary-container underline-offset-4"
              onClick={() => navigate("/signup")}
            >
              Sign up
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Signin;