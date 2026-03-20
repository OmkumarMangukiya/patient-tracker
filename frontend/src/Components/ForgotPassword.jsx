import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../lib/apiClient';

function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('patient');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email) {
      setError('Email is required');
      return;
    }

    setIsLoading(true);

    try {
      const response = await apiClient.post('/auth/forgot-password', {
        email,
        role
      });

      setSuccess(true);
    } catch (err) {
      setError('An error occurred. Please try again later.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-surface p-4 sm:p-6 lg:p-8 animate-in fade-in slide-in-from-bottom-4 duration-700 relative overflow-hidden">
      {/* Decorative gradient blobs */}
      <div className="fixed top-[-20%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-primary/5 blur-3xl opacity-50 pointer-events-none"></div>
      <div className="fixed bottom-[-20%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-primary-container/5 blur-3xl opacity-50 pointer-events-none"></div>

      <div className="w-full max-w-md bg-surface-lowest rounded-3xl p-8 sm:p-10 shadow-[0_20px_60px_rgba(12,30,38,0.05)] ring-1 ring-outline-variant/20 relative z-10">
        <div className="text-left mb-8">
          <h1 className="text-3xl font-bold text-primary-container tracking-tight mb-2">Reset Password</h1>
          <p className="text-on-surface-variant font-medium text-sm">
            Enter your email address and we'll send you a link to reset your password
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-[#FFF5F5] ring-1 ring-[#FFE0E0] rounded-xl flex items-start space-x-3">
            <svg className="h-5 w-5 text-[#D93838] shrink-0 mt-0.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <p className="text-sm text-[#D93838] font-medium leading-relaxed">{error}</p>
          </div>
        )}

        {success ? (
          <div className="mb-6 p-5 bg-[#F0FDF4] ring-1 ring-[#DCFCE7] rounded-xl text-center">
            <svg className="h-10 w-10 text-[#16A34A] mx-auto mb-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM13.707 9.293a1 1 0 00-1.414-1.414L9 11.172 7.707 9.879a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <p className="text-[#16A34A] font-medium leading-relaxed">
              If an account with that email exists, a password reset link has been sent. Please check your inbox.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-semibold text-primary-container">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3.5 bg-surface-variant border-transparent rounded-xl focus:ring-1 focus:ring-primary/20 focus:bg-surface-lowest transition-all duration-300 text-primary-container font-medium"
                placeholder="Ex. sarah@example.com"
                required
              />
            </div>

            <div className="space-y-3">
              <label className="block text-sm font-semibold text-primary-container">
                Account Type
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className={`cursor-pointer flex items-center justify-center py-3 rounded-xl transition-all duration-300 font-bold text-sm ${role === 'patient' ? 'bg-primary-container text-on-primary shadow-sm' : 'bg-surface-variant text-on-surface-variant hover:bg-surface-container-low hover:text-primary-container'}`}>
                  <input
                    type="radio"
                    name="role"
                    value="patient"
                    checked={role === "patient"}
                    onChange={() => setRole("patient")}
                    className="sr-only"
                  />
                  Patient
                </label>
                <label className={`cursor-pointer flex items-center justify-center py-3 rounded-xl transition-all duration-300 font-bold text-sm ${role === 'doctor' ? 'bg-primary-container text-on-primary shadow-sm' : 'bg-surface-variant text-on-surface-variant hover:bg-surface-container-low hover:text-primary-container'}`}>
                  <input
                    type="radio"
                    name="role"
                    value="doctor"
                    checked={role === "doctor"}
                    onChange={() => setRole("doctor")}
                    className="sr-only"
                  />
                  Doctor
                </label>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full py-4 px-6 rounded-full font-bold transition-all duration-300 transform shadow-[0_10px_20px_rgba(12,30,38,0.2)] ${isLoading 
                    ? 'bg-surface-variant text-on-surface-variant/50 shadow-none cursor-not-allowed' 
                    : 'text-on-primary bg-linear-to-br from-primary to-primary-container hover:-translate-y-0.5 hover:shadow-[0_15px_30px_rgba(12,30,38,0.3)]'
                  }`}
              >
                {isLoading ? 'Sending Request...' : 'Send Reset Link'}
              </button>
            </div>

            <div className="pt-4 text-center">
              <button
                type="button"
                onClick={() => navigate('/')}
                className="text-on-surface-variant font-medium hover:text-primary transition-colors text-sm"
              >
                Return to Login
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default ForgotPassword; 