import React, { useState } from "react";
import { useNavigate, Link } from 'react-router-dom';
import apiClient from '../lib/apiClient';

function Signup() {
    const [role, setRole] = useState('');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [age, setAge] = useState('');
    const [gender, setGender] = useState('');
    const [specialization, setSpecialization] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const navigate = useNavigate();

    async function handleClick(e) {
        e.preventDefault();
        setError('');

        if (!role) {
            setError('Please select a role');
            return;
        }

        if (!name || !email || !password) {
            setError('Please fill in all required fields');
            return;
        }

        if (role === 'patient' && (!age || !gender)) {
            setError('Please fill in all patient details');
            return;
        }

        if (role === 'doctor' && !specialization) {
            setError('Please enter your specialization');
            return;
        }

        setIsLoading(true);

        try {
            const endpoint = '/auth/signup';
            const payload = {
                role, name, email, password,
                ...(role === 'patient' ? { age, gender } : { specialization })
            };
            
            const response = await apiClient.post(endpoint, payload);
            
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('role', response.data.role);
            navigate(role === 'patient' ? '/patient/dashboard' : '/doctor/dashboard');
        } catch (err) {
            setError(err.response?.data?.message || 'Signup failed. Please try again.');
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="min-h-screen bg-surface flex items-center justify-center p-6 font-sans">
            <div className="w-full max-w-md bg-surface-lowest rounded-3xl shadow-[0_20px_60px_rgba(12,30,38,0.05)] ring-1 ring-outline-variant/20 p-10 animate-in fade-in slide-in-from-bottom-4 duration-700 my-8">
                
                <div className="text-center mb-8 space-y-2">
                    <h1 className="text-4xl font-bold tracking-tight text-primary-container">Create Account</h1>
                    <p className="text-on-surface-variant font-medium">
                        {role ? `Register as a ${role}` : 'Select your role to continue'}
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

                <form onSubmit={handleClick} className="space-y-6">
                    <div className="space-y-1.5">
                        <label className="block text-sm font-semibold text-primary-container" htmlFor="role">
                            I am a <span className="text-[#D93838]">*</span>
                        </label>
                        <div className="relative">
                            <select
                                id="role"
                                value={role}
                                onChange={(e) => setRole(e.target.value)}
                                className="w-full px-4 py-3.5 bg-surface-variant border-transparent rounded-xl focus:ring-1 focus:ring-primary/20 focus:bg-surface-lowest transition-all duration-300 text-primary-container font-medium appearance-none"
                                required
                            >
                                <option value="" disabled className="text-on-surface-variant">Select Role</option>
                                <option value="patient" className="text-primary-container">Patient</option>
                                <option value="doctor" className="text-primary-container">Doctor</option>
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-primary-container">
                                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="block text-sm font-semibold text-primary-container" htmlFor="name">
                            Full Name <span className="text-[#D93838]">*</span>
                        </label>
                        <input
                            id="name"
                            type="text"
                            placeholder="John Doe"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-4 py-3.5 bg-surface-variant border-transparent rounded-xl focus:ring-1 focus:ring-primary/20 focus:bg-surface-lowest transition-all duration-300 text-primary-container font-medium placeholder-on-surface-variant/50"
                            required
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="block text-sm font-semibold text-primary-container" htmlFor="email">
                            Email Address <span className="text-[#D93838]">*</span>
                        </label>
                        <input
                            id="email"
                            type="email"
                            placeholder="you@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-3.5 bg-surface-variant border-transparent rounded-xl focus:ring-1 focus:ring-primary/20 focus:bg-surface-lowest transition-all duration-300 text-primary-container font-medium placeholder-on-surface-variant/50"
                            required
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="block text-sm font-semibold text-primary-container" htmlFor="password">
                            Password <span className="text-[#D93838]">*</span>
                        </label>
                        <input
                            id="password"
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-3.5 bg-surface-variant border-transparent rounded-xl focus:ring-1 focus:ring-primary/20 focus:bg-surface-lowest transition-all duration-300 text-primary-container font-medium placeholder-on-surface-variant/50"
                            required
                            minLength="6"
                        />
                    </div>

                    {role === 'patient' && (
                        <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
                            <div className="space-y-1.5">
                                <label className="block text-sm font-semibold text-primary-container" htmlFor="age">
                                    Age <span className="text-[#D93838]">*</span>
                                </label>
                                <input
                                    id="age"
                                    type="number"
                                    placeholder="30"
                                    value={age}
                                    onChange={(e) => setAge(e.target.value)}
                                    className="w-full px-4 py-3.5 bg-surface-variant border-transparent rounded-xl focus:ring-1 focus:ring-primary/20 focus:bg-surface-lowest transition-all duration-300 text-primary-container font-medium placeholder-on-surface-variant/50"
                                    min="1"
                                    max="120"
                                    required
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="block text-sm font-semibold text-primary-container" htmlFor="gender">
                                    Gender <span className="text-[#D93838]">*</span>
                                </label>
                                <div className="relative">
                                    <select
                                        id="gender"
                                        value={gender}
                                        onChange={(e) => setGender(e.target.value)}
                                        className="w-full px-4 py-3.5 bg-surface-variant border-transparent rounded-xl focus:ring-1 focus:ring-primary/20 focus:bg-surface-lowest transition-all duration-300 text-primary-container font-medium appearance-none"
                                        required
                                    >
                                        <option value="" disabled className="text-on-surface-variant">Select</option>
                                        <option value="male" className="text-primary-container">Male</option>
                                        <option value="female" className="text-primary-container">Female</option>
                                        <option value="other" className="text-primary-container">Other</option>
                                        <option value="prefer-not-to-say" className="text-primary-container">Prefer not to say</option>
                                    </select>
                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-primary-container">
                                        <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {role === 'doctor' && (
                        <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2 duration-300">
                            <label className="block text-sm font-semibold text-primary-container" htmlFor="specialization">
                                Specialization <span className="text-[#D93838]">*</span>
                            </label>
                            <input
                                id="specialization"
                                type="text"
                                placeholder="Cardiology, Neurology, etc."
                                value={specialization}
                                onChange={(e) => setSpecialization(e.target.value)}
                                className="w-full px-4 py-3.5 bg-surface-variant border-transparent rounded-xl focus:ring-1 focus:ring-primary/20 focus:bg-surface-lowest transition-all duration-300 text-primary-container font-medium placeholder-on-surface-variant/50"
                                required
                            />
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isLoading}
                        className={`w-full py-4 px-6 rounded-full font-bold text-on-primary bg-linear-to-br from-primary to-primary-container shadow-[0_10px_20px_rgba(12,30,38,0.2)] hover:shadow-[0_15px_30px_rgba(12,30,38,0.3)] transition-all duration-300 transform hover:-translate-y-0.5 mt-4 ${isLoading ? 'opacity-75 cursor-not-allowed transform-none hover:shadow-[0_10px_20px_rgba(12,30,38,0.2)]' : ''}`}
                    >
                        {isLoading ? (
                            <span className="flex items-center justify-center space-x-2">
                                <svg className="animate-spin h-5 w-5 text-on-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                <span>Processing...</span>
                            </span>
                        ) : (
                            'Create Account'
                        )}
                    </button>
                </form>

                <div className="mt-8 text-center text-sm font-medium text-on-surface-variant">
                    Already have an account?{' '}
                    <Link to="/" className="font-bold text-primary-container hover:text-primary transition-colors underline decoration-primary-container/30 hover:decoration-primary-container underline-offset-4">
                        Sign in
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default Signup;