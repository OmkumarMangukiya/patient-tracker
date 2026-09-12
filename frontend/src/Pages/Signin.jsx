import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import apiClient from '../lib/apiClient';
import backgroundImage from './PatientTracker1.jpg';
import { User, Stethoscope, Eye, EyeOff } from "lucide-react";

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
    <div className="relative flex flex-col items-center justify-center min-h-screen h-screen overflow-y-auto sm:overflow-hidden p-4 sm:p-6 bg-cover bg-center bg-no-repeat font-sans"
      style={{ backgroundImage: `url(${backgroundImage})` }}>

      {/* Elegant dark overlay */}
      <div className="absolute inset-0 bg-primary-container/60 backdrop-blur-sm pointer-events-none"></div>

      {/* Main content container */}
      <div className="relative z-10 w-full max-w-md my-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="bg-surface/95 backdrop-blur-2xl rounded-3xl shadow-[0_20px_60px_rgba(12,30,38,0.3)] ring-1 ring-outline-variant/60 p-6 sm:p-8 space-y-5">
          
          {/* Logo/Header */}
          <div className="text-center space-y-1">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-primary-container">Welcome Back</h1>
            <p className="text-sm text-on-surface-variant font-medium">Please sign in to continue</p>
          </div>

          {/* Error message */}
          {error && (
            <div className="bg-[#FFF5F5] ring-1 ring-[#FFE0E0] p-3.5 rounded-xl flex items-start space-x-2.5">
              <svg className="h-5 w-5 text-[#D93838] shrink-0 mt-0.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <p className="text-xs sm:text-sm text-[#D93838] font-medium leading-relaxed">{error}</p>
            </div>
          )}

          {/* Form */}
          <form className="space-y-4" onSubmit={handleLogin}>
            
            {/* Role selection */}
            <div className="space-y-1.5">
              <label className="block text-xs sm:text-sm font-semibold text-primary-container">
                I am a
              </label>
              <div className="grid grid-cols-2 gap-2 p-1 bg-surface-variant/60 rounded-2xl ring-1 ring-outline-variant/60">
                <button
                  type="button"
                  onClick={() => setRole("patient")}
                  className={`cursor-pointer flex items-center justify-center space-x-2 py-2.5 px-3 rounded-xl font-semibold text-xs sm:text-sm transition-all duration-300 ${
                    role === "patient"
                      ? "bg-primary-container text-on-primary shadow-md transform scale-[1.01]"
                      : "text-on-surface-variant/70 hover:text-primary-container hover:bg-surface/60"
                  }`}
                >
                  <User className="w-4 h-4 shrink-0" />
                  <span>Patient</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRole("doctor")}
                  className={`cursor-pointer flex items-center justify-center space-x-2 py-2.5 px-3 rounded-xl font-semibold text-xs sm:text-sm transition-all duration-300 ${
                    role === "doctor"
                      ? "bg-primary-container text-on-primary shadow-md transform scale-[1.01]"
                      : "text-on-surface-variant/70 hover:text-primary-container hover:bg-surface/60"
                  }`}
                >
                  <Stethoscope className="w-4 h-4 shrink-0" />
                  <span>Doctor</span>
                </button>
              </div>
            </div>

            {/* Email field */}
            <div className="space-y-1.5">
              <label htmlFor="email" className="block text-xs sm:text-sm font-semibold text-primary-container">
                Email address
              </label>
              <input
                id="email"
                className="w-full px-4 py-2.5 sm:py-3 bg-surface-container-lowest ring-1 ring-outline-variant/40 border-transparent rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all duration-300 text-primary-container font-medium text-sm placeholder-on-surface-variant/50 shadow-xs"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            {/* Password field */}
            <div className="space-y-1.5">
              <label htmlFor="password" className="block text-xs sm:text-sm font-semibold text-primary-container">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  className="w-full px-4 py-2.5 sm:py-3 bg-surface-container-lowest ring-1 ring-outline-variant/40 border-transparent rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all duration-300 pr-12 text-primary-container font-medium text-sm placeholder-on-surface-variant/50 shadow-xs"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  className="cursor-pointer absolute inset-y-0 right-0 pr-4 flex items-center text-on-surface-variant/70 hover:text-primary-container transition-colors focus:outline-none"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  className="cursor-pointer text-xs sm:text-sm font-semibold text-on-surface-variant hover:text-primary-container transition-colors"
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
              className={`cursor-pointer w-full py-3 sm:py-3.5 px-6 rounded-full font-bold text-sm sm:text-base text-on-primary bg-primary-container hover:bg-[#0d1322] shadow-[0_10px_20px_rgba(19,27,46,0.25)] hover:shadow-[0_15px_30px_rgba(19,27,46,0.35)] transition-all duration-300 transform hover:-translate-y-0.5 ${isLoading ? 'opacity-75 cursor-not-allowed transform-none hover:shadow-[0_10px_20px_rgba(19,27,46,0.2)]' : ''}`}
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
          <div className="text-center text-xs sm:text-sm font-medium text-on-surface-variant pt-1">
            Don't have an account?{' '}
            <Link
              to="/signup"
              className="cursor-pointer font-bold text-primary-container hover:text-primary transition-colors underline decoration-primary-container/30 hover:decoration-primary-container underline-offset-4"
            >
              Sign up
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Signin;