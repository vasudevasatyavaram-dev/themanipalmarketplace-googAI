import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import Spinner from '../ui/Spinner';

const GoogleIcon = () => (
    <svg className="w-5 h-5 mr-3" viewBox="0 0 48 48">
        <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"></path>
        <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"></path>
        <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"></path>
        <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571l6.19,5.238C42.01,35.846,44,30.138,44,24C44,22.659,43.862,21.35,43.611,20.083z"></path>
    </svg>
);

const StoreIcon = () => (
    <div className="w-20 h-20 bg-brand-accent rounded-full flex items-center justify-center mb-6">
        <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#FAF9E1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9.5L12 4l9 5.5"/><path d="M19 13.5V21a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-7.5"/><path d="M10 17h4v4h-4z"/><path d="M8 22V12.5a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1V22"/>
        </svg>
    </div>
);


const Login: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const [isLoginView, setIsLoginView] = useState(true);
    const [contact, setContact] = useState(''); // Can be email or phone
    const [fullName, setFullName] = useState('');
    const [otp, setOtp] = useState('');
    const [view, setView] = useState<'credentials' | 'otp'>('credentials');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [resendCooldown, setResendCooldown] = useState(0);

    useEffect(() => {
        // Fix: Use ReturnType<typeof setTimeout> for browser compatibility instead of NodeJS.Timeout.
        let timer: ReturnType<typeof setTimeout>;
        if (resendCooldown > 0) {
            timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
        }
        return () => clearTimeout(timer);
    }, [resendCooldown]);


    const handleGoogleLogin = async () => {
        setLoading(true);
        setError('');
        setMessage('');
        const { error } = await supabase!.auth.signInWithOAuth({ provider: 'google' });
        if (error) {
            setError(error.message);
        }
        setLoading(false);
    };
    
    const isEmail = (input: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input);

    const handleSendOtp = async (e?: React.FormEvent) => {
        e?.preventDefault();
        setLoading(true);
        setError('');
        setMessage('');

        if (!isLoginView && !fullName) {
            setError('Please enter your full name.');
            setLoading(false);
            return;
        }

        const options = {
            data: isLoginView ? undefined : { full_name: fullName },
            shouldCreateUser: !isLoginView,
        };

        const contactInfo = isEmail(contact) ? { email: contact } : { phone: contact };

        const { error } = await supabase!.auth.signInWithOtp({
            ...contactInfo,
            options,
        });

        if (error) {
            setError(error.message);
        } else {
            setMessage(`An OTP has been sent to ${contact}.`);
            setView('otp');
            setResendCooldown(60);
        }
        setLoading(false);
    }
    
    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        
        const type = isEmail(contact) ? 'email' : 'sms';
        
        const { error } = await supabase!.auth.verifyOtp({
            ...(type === 'email' ? { email: contact } : { phone: contact }),
            token: otp,
            type: type
        });
        
        if (error) {
            setError(error.message);
        }
        // onAuthStateChange in App.tsx will handle successful login
        setLoading(false);
    }

    const switchView = (isLogin: boolean) => {
        setIsLoginView(isLogin);
        setError('');
        setMessage('');
        setContact('');
        setFullName('');
        setOtp('');
        setView('credentials');
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 font-sans">
            <header className="text-center mb-8 flex flex-col items-center">
                <StoreIcon />
                <h1 className="text-3xl font-bold tracking-wider text-brand-dark">
                    • the manipal marketplace •
                </h1>
                <p className="text-brand-dark/70 mt-1">Seller Dashboard - Manage your products</p>
            </header>

            <main className="w-full max-w-sm bg-white p-8 rounded-2xl shadow-lg border border-gray-200">
                <div className="text-left mb-6">
                    <h2 className="text-2xl font-bold text-brand-dark">Welcome</h2>
                    <p className="text-gray-500 mt-1">Login or create an account to get started</p>
                </div>

                <div className="bg-brand-light p-1 rounded-lg flex mb-6">
                    <button
                        onClick={() => switchView(true)}
                        className={`w-1/2 py-2 text-sm font-semibold rounded-md transition-colors duration-300 ${isLoginView ? 'bg-white shadow' : 'text-brand-dark/60'}`}
                    >
                        Login
                    </button>
                    <button
                        onClick={() => switchView(false)}
                        className={`w-1/2 py-2 text-sm font-semibold rounded-md transition-colors duration-300 ${!isLoginView ? 'bg-white shadow' : 'text-brand-dark/60'}`}
                    >
                        Sign Up
                    </button>
                </div>
                
                {view === 'credentials' ? (
                    <form onSubmit={handleSendOtp} className="space-y-4">
                        {!isLoginView && (
                             <div>
                                <label className="text-sm font-medium text-gray-700 sr-only">Full Name</label>
                                <input
                                    type="text"
                                    placeholder="Full Name"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    className="w-full bg-brand-light border border-gray-300/50 text-brand-dark p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-accent/50"
                                    required
                                />
                            </div>
                        )}
                        <div>
                            <label className="text-sm font-medium text-gray-700 sr-only">Email or Phone</label>
                            <input
                                type="text"
                                placeholder="Email or Phone Number"
                                value={contact}
                                onChange={(e) => setContact(e.target.value)}
                                className="w-full bg-brand-light border border-gray-300/50 text-brand-dark p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-accent/50"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-brand-accent text-white font-bold py-3 px-4 rounded-lg shadow-md hover:opacity-90 transition duration-300 disabled:opacity-50 flex justify-center items-center"
                        >
                            {loading ? <Spinner /> : 'Send OTP'}
                        </button>
                    </form>
                ) : (
                    <form onSubmit={handleVerifyOtp} className="space-y-4">
                         <div>
                            <label className="text-sm font-medium text-gray-700 sr-only">OTP</label>
                            <input
                                type="text"
                                placeholder="Enter OTP"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value)}
                                className="w-full bg-brand-light border border-gray-300/50 text-brand-dark p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-accent/50"
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-brand-accent text-white font-bold py-3 px-4 rounded-lg shadow-md hover:opacity-90 transition duration-300 disabled:opacity-50 flex justify-center items-center"
                        >
                            {loading ? <Spinner /> : 'Verify OTP'}
                        </button>
                         <button
                            type="button"
                            onClick={() => handleSendOtp()}
                            disabled={loading || resendCooldown > 0}
                            className="w-full text-sm text-center text-brand-accent hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {resendCooldown > 0 ? `Resend OTP in ${resendCooldown}s` : 'Resend OTP'}
                        </button>
                    </form>
                )}


                <div className="relative flex py-5 items-center">
                    <div className="flex-grow border-t border-gray-200"></div>
                    <span className="flex-shrink mx-4 text-xs text-gray-400 font-semibold">OR CONTINUE WITH</span>
                    <div className="flex-grow border-t border-gray-200"></div>
                </div>

                <button
                    onClick={handleGoogleLogin}
                    disabled={loading}
                    className="w-full flex items-center justify-center bg-white text-brand-dark font-semibold py-3 px-4 rounded-lg shadow-sm border border-gray-300 hover:bg-gray-50 transition duration-300 disabled:opacity-50"
                >
                    {loading ? <Spinner /> : <><GoogleIcon /> Sign in with Google</>}
                </button>
                
                {error && <p className="mt-4 text-center text-sm text-red-500">{error}</p>}
                {message && !error && <p className="mt-4 text-center text-sm text-green-600">{message}</p>}
            </main>
        </div>
    );
};

export default Login;
