import React, { useState, FormEvent } from 'react';
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
    <div className="w-20 h-20 bg-brand-accent rounded-full flex items-center justify-center">
        <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#FAF9E1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z" />
            <path d="M9 22V12H15V22" />
        </svg>
    </div>
);

const Login: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [otp, setOtp] = useState('');
    const [view, setView] = useState<'email' | 'phone' | 'otp'>('email');
    const [otpMethod, setOtpMethod] = useState<'email' | 'phone'>('email');
    const [error, setError] = useState<string | null>(null);

    const handleLogin = async (e: FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            setOtpMethod(view as 'email' | 'phone');
            const { error } = await supabase.auth.signInWithOtp({
                email: view === 'email' ? email : undefined,
                phone: view === 'phone' ? `+91${phone}` : undefined,
            });

            if (error) throw error;
            setView('otp');
        } catch (error: any) {
            setError(error.error_description || error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async (e: FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
             const params = otpMethod === 'email' 
                ? { email, token: otp, type: 'email' as const } 
                : { phone: `+91${phone}`, token: otp, type: 'sms' as const };
            
            const { error } = await supabase.auth.verifyOtp(params);
            
            if (error) throw error;
            // The onAuthStateChange listener in App.tsx will handle the session update
        } catch (error: any) {
            setError(error.error_description || error.message);
        } finally {
            setLoading(false);
        }
    };
    
    const signInWithGoogle = async () => {
        setLoading(true);
        setError(null);
        await supabase.auth.signInWithOAuth({ provider: 'google' });
        setLoading(false);
    }

    const renderForm = () => {
        if (view === 'otp') {
            return (
                <form onSubmit={handleVerifyOtp} className="space-y-6">
                    <div>
                        <label htmlFor="otp" className="block text-sm font-medium text-brand-dark/80">Enter OTP</label>
                        <input
                            id="otp"
                            className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-brand-accent focus:border-brand-accent"
                            type="text"
                            placeholder="123456"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value)}
                            required
                        />
                    </div>
                    <div>
                        <button type="submit" disabled={loading} className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-bold text-white bg-brand-accent hover:opacity-90 disabled:opacity-50">
                            {loading ? <Spinner /> : 'Verify OTP'}
                        </button>
                    </div>
                </form>
            );
        }
        return (
            <form onSubmit={handleLogin} className="space-y-6">
                {view === 'email' ? (
                     <div>
                        <label htmlFor="email" className="block text-sm font-medium text-brand-dark/80">Email address</label>
                        <input
                            id="email"
                            className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-brand-accent focus:border-brand-accent"
                            type="email"
                            placeholder="you@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                ) : (
                     <div>
                        <label htmlFor="phone" className="block text-sm font-medium text-brand-dark/80">Phone number</label>
                         <div className="flex">
                             <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">+91</span>
                             <input
                                id="phone"
                                className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-r-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-brand-accent focus:border-brand-accent"
                                type="tel"
                                placeholder="9876543210"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                required
                                pattern="[0-9]{10}"
                            />
                         </div>
                    </div>
                )}
                <div>
                    <button type="submit" disabled={loading} className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-bold text-white bg-brand-accent hover:opacity-90 disabled:opacity-50">
                        {loading ? <Spinner /> : 'Send OTP'}
                    </button>
                </div>
            </form>
        );
    }
    
    return (
        <div className="min-h-screen flex flex-col justify-center items-center bg-brand-light p-4">
            <div className="text-center mb-8">
                <div className="inline-block">
                    <StoreIcon />
                </div>
                <h1 className="mt-4 text-3xl font-bold text-brand-dark tracking-wider">
                    • the manipal marketplace •
                </h1>
                <p className="mt-1 text-md text-brand-dark/70">
                    Seller Dashboard - Manage your products
                </p>
            </div>
            <div className="max-w-md w-full bg-brand-cream shadow-2xl rounded-2xl p-8 space-y-6">
                <div className="text-left">
                    <h2 className="text-3xl font-bold text-brand-dark">
                        Welcome
                    </h2>
                    <p className="mt-1 text-brand-dark/70">
                        Login or create an account to get started
                    </p>
                </div>
                
                {renderForm()}
                
                {view !== 'otp' && (
                     <div className="text-center pt-4">
                        <button onClick={() => setView(view === 'email' ? 'phone' : 'email')} className="font-medium text-sm text-brand-accent hover:text-brand-accent/80">
                           {view === 'email' ? 'Use phone instead' : 'Use email instead'}
                        </button>
                    </div>
                )}

                {error && <p className="text-red-500 text-sm text-center">{error}</p>}

                <div className="relative pt-2">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-300"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-brand-cream text-gray-500">Or continue with</span>
                    </div>
                </div>

                <div>
                    <button onClick={signInWithGoogle} disabled={loading && view !== 'otp'} className="w-full inline-flex justify-center items-center py-3 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50">
                        <GoogleIcon />
                        Sign in with Google
                    </button>
                </div>
            </div>
        </div>
    );
}

export default Login;