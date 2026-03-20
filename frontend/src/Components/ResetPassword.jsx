import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import apiClient from '../lib/apiClient';

function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const tokenFromUrl = searchParams.get('token');
    if (tokenFromUrl) {
      setToken(tokenFromUrl);
    } else {
      setError('Invalid reset link');
    }
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validate password
    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);

    try {
      const response = await apiClient.post('/auth/reset-password', {
        token,
        password
      });

      setSuccess(true);
      // Redirect to login page after 2 seconds
      setTimeout(() => {
        navigate('/');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Error resetting password. Link may be expired.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-surface p-4 sm:p-6 lg:p-8 animate-in fade-in slide-in-from-bottom-4 duration-700 relative overflow-hidden">
      {/* Decorative gradient blobs */}
      <div className="fixed top-[10%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-primary/5 blur-3xl opacity-50 pointer-events-none"></div>
      <div className="fixed bottom-[-10%] left-[-10%] w-[60vw] h-[60vw] rounded-full bg-primary-container/5 blur-3xl opacity-50 pointer-events-none"></div>

      <div className="w-full max-w-md bg-surface-lowest rounded-3xl p-8 sm:p-10 shadow-[0_20px_60px_rgba(12,30,38,0.05)] ring-1 ring-outline-variant/20 relative z-10">
        <div className="text-left mb-8">
          <h1 className="text-3xl font-bold text-primary-container tracking-tight mb-2">Create New Password</h1>
          <p className="text-on-surface-variant font-medium text-sm">
            Please enter a strong new password below.
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
            <p className="text-[#16A34A] font-medium leading-relaxed mb-1">
              Password reset successfully!
            </p>
            <p className="text-[#16A34A]/80 text-sm">Redirecting to login...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-semibold text-primary-container">
                New Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3.5 bg-surface-variant border-transparent rounded-xl focus:ring-1 focus:ring-primary/20 focus:bg-surface-lowest transition-all duration-300 text-primary-container font-medium"
                placeholder="Must be at least 8 characters"
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="confirm-password" className="block text-sm font-semibold text-primary-container">
                Confirm Password
              </label>
              <input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3.5 bg-surface-variant border-transparent rounded-xl focus:ring-1 focus:ring-primary/20 focus:bg-surface-lowest transition-all duration-300 text-primary-container font-medium"
                placeholder="Confirm your new password"
                required
              />
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
                {isLoading ? 'Resetting...' : 'Update Password'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default ResetPassword; 