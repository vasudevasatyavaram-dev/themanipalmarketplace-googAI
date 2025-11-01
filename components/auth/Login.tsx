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
    <div className="w-20 h-20 bg-brand-accent rounded-full flex items-center justify-center shadow-lg">
        <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#FAF9E1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <path d="M16 10a4 4 0 0 1-8 0" />
        </svg>
    </div>
);

const Login: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [authView, setAuthView] = useState<'login' | 'signup'>('login');
    const [pageView, setPageView] = useState<'form' | 'otp'>('form');

    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    
    const resetForm = () => {
        setError(null);
        setEmail('');
        setOtp('');
        setFullName('');
        setPageView('form');
    }

    const handleAuthAction = async (e: FormEvent) => {
        e.preventDefault();
        setError(null);

        if (authView === 'signup' && (!fullName.trim() || !email.trim())) {
            setError('Full Name and Email are required.');
            return;
        }

        setLoading(true);

        try {
            if (authView === 'login') {
                const { error } = await supabase.auth.signInWithOtp({ email });
                if (error) throw error;
            } else { // signup
                const { error } = await supabase.auth.signInWithOtp({
                    email: email,
                    options: {
                        data: {
                            full_name: fullName,
                        },
                    },
                });
                if (error) throw error;
            }
            setPageView('otp');
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
            const verificationType = authView === 'signup' ? 'signup' : 'email';
            const { error } = await supabase.auth.verifyOtp({
                email,
                token: otp,
                type: verificationType,
            });
            if (error) throw error;

        } catch (error: any)
{
            setError(error.error_description || error.message);
        } finally {
            setLoading(false);
        }
    };
    
    const signInWithGoogle = async () => {
        setLoading(true);
        setError(null);
        const { error } = await supabase.auth.signInWithOAuth({ 
            provider: 'google',
            options: {
                redirectTo: 'http://themanipalmarketplace-seller.vercel.app',
            },
        });
        if (error) {
            setError(error.message);
            setLoading(false);
        }
    };

    const renderFormContent = () => {
        if (pageView === 'otp') {
            return (
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                    <div>
                        <label htmlFor="otp" className="block text-sm font-medium text-brand-dark/80">Enter OTP</label>
                        <input id="otp" type="text" placeholder="123456" value={otp} onChange={(e) => setOtp(e.target.value)} required
                            className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-accent/80 focus:border-brand-accent/80" />
                    </div>
                    <div>
                        <button type="submit" disabled={loading} className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white bg-brand-accent hover:opacity-90 disabled:opacity-50">
                            {loading ? <Spinner /> : 'Verify & Continue'}
                        </button>
                    </div>
                     <div className="text-center">
                        <button type="button" onClick={() => setPageView('form')} className="font-medium text-sm text-brand-accent hover:text-brand-accent/80">
                           Back to {authView === 'login' ? 'Login' : 'Sign Up'}
                        </button>
                    </div>
                </form>
            );
        }

        return (
            <form onSubmit={handleAuthAction} className="space-y-4">
                {authView === 'signup' && (
                    <div>
                        <label htmlFor="fullName" className="block text-sm font-medium text-brand-dark/80">Full Name</label>
                        <input id="fullName" type="text" placeholder="John Doe" value={fullName} onChange={(e) => setFullName(e.target.value)} required
                                className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-accent/80 focus:border-brand-accent/80" />
                    </div>
                )}
                
                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-brand-dark/80">Email address</label>
                    <input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required
                            className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-accent/80 focus:border-brand-accent/80" />
                </div>

                <div>
                    <button type="submit" disabled={loading} className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white bg-brand-accent hover:opacity-90 disabled:opacity-50">
                        {loading ? <Spinner /> : 'Send Link'}
                    </button>
                </div>
            </form>
        );
    }
    
    return (
        <div className="min-h-screen flex flex-col justify-center items-center bg-brand-light p-4">
            <div className="text-center mb-6">
                <div className="inline-block">
                    <StoreIcon />
                </div>
                <h1 className="mt-4 text-2xl sm:text-[28px] font-bold text-brand-dark tracking-normal sm:tracking-wider whitespace-nowrap">
                    <span className="text-brand-accent">•</span> the manipal marketplace <span className="text-brand-accent">•</span>
                </h1>
                <p className="mt-1 text-md text-brand-dark/70">
                    Seller Dashboard - Manage your products
                </p>
            </div>
            <div className="max-w-md w-full bg-brand-cream shadow-xl rounded-2xl p-6 space-y-4 border border-brand-dark/10">
                <div className="text-left">
                    <h2 className="text-2xl font-bold text-brand-dark">
                        Welcome
                    </h2>
                    <p className="mt-1 text-brand-dark/70">
                        Login or create an account to get started
                    </p>
                </div>
                
                <div className="flex bg-brand-light p-1 rounded-lg border border-gray-300/80">
                    <button onClick={() => { setAuthView('login'); resetForm(); }} className={`w-1/2 p-2 rounded-md font-semibold transition-colors duration-300 ${authView === 'login' ? 'bg-white shadow' : 'text-brand-dark/60'}`}>Login</button>
                    <button onClick={() => { setAuthView('signup'); resetForm(); }} className={`w-1/2 p-2 rounded-md font-semibold transition-colors duration-300 ${authView === 'signup' ? 'bg-white shadow' : 'text-brand-dark/60'}`}>Sign Up</button>
                </div>

                <div>
                    {renderFormContent()}
                </div>
                
                {error && <p className="text-red-500 text-sm text-center">{error}</p>}

                <div className="mt-4">
                    <button onClick={signInWithGoogle} disabled={loading} className="w-full inline-flex justify-center items-center py-3 px-4 border border-gray-300 rounded-lg shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50">
                        <GoogleIcon />
                        Sign in with Google instead
                    </button>
                </div>
            </div>
        </div>
    );
}

export default Login;
