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
            <path d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z" />
            <path d="M9 22V12H15V22" />
        </svg>
    </div>
);

const Login: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [authView, setAuthView] = useState<'login' | 'signup'>('login');
    const [pageView, setPageView] = useState<'form' | 'otp'>('form');
    const [loginMethod, setLoginMethod] = useState<'phone' | 'email'>('phone');

    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [otp, setOtp] = useState('');
    
    const resetForm = () => {
        setError(null);
        setPhone('');
        setEmail('');
        setOtp('');
        setFullName('');
        setPageView('form');
        setLoginMethod('phone');
    }

    const handleAuthAction = async (e: FormEvent) => {
        e.preventDefault();
        setError(null);

        if (authView === 'signup' && (!fullName.trim() || !phone.trim())) {
            setError('Full Name and Phone Number are required.');
            return;
        }

        setLoading(true);

        try {
            if (authView === 'login') {
                const { error } = await supabase.auth.signInWithOtp({
                    email: loginMethod === 'email' ? email : undefined,
                    phone: loginMethod === 'phone' ? `+91${phone}` : undefined,
                });
                if (error) throw error;
            } else { // signup
                const { error } = await supabase.auth.signInWithOtp({
                    phone: `+91${phone}`,
                    options: {
                        data: {
                            full_name: fullName,
                            ...(email && { email_optional: email }),
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
            const isLoginWithEmail = authView === 'login' && loginMethod === 'email';

            if (isLoginWithEmail) {
                const { error } = await supabase.auth.verifyOtp({
                    email,
                    token: otp,
                    type: 'email'
                });
                if (error) throw error;
            } else {
                const { error } = await supabase.auth.verifyOtp({
                    phone: `+91${phone}`,
                    token: otp,
                    type: 'sms'
                });
                if (error) throw error;
            }

        } catch (error: any) {
            setError(error.error_description || error.message);
        } finally {
            setLoading(false);
        }
    };
    
    const signInWithGoogle = async () => {
        setLoading(true);
        setError(null);
        const { error } = await supabase.auth.signInWithOAuth({ provider: 'google' });
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

                { (authView === 'login' && loginMethod === 'email') ? (
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-brand-dark/80">Email address</label>
                        <input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required
                                className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-accent/80 focus:border-brand-accent/80" />
                    </div>
                ) : (
                     <div>
                        <label htmlFor="phone" className="block text-sm font-medium text-brand-dark/80">Phone number</label>
                         <div className="mt-1 flex rounded-lg shadow-sm">
                             <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">+91</span>
                             <input id="phone" type="tel" placeholder="9876543210" value={phone} onChange={(e) => setPhone(e.target.value)} required pattern="[0-9]{10}"
                                className="block w-full flex-1 rounded-none rounded-r-lg px-4 py-3 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-accent/80 focus:border-brand-accent/80" />
                         </div>
                    </div>
                )}

                {authView === 'signup' && (
                    <div>
                        <label htmlFor="emailOptional" className="block text-sm font-medium text-brand-dark/80">Email address (optional)</label>
                        <input id="emailOptional" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)}
                                className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-accent/80 focus:border-brand-accent/80" />
                    </div>
                )}

                <div>
                    <button type="submit" disabled={loading} className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white bg-brand-accent hover:opacity-90 disabled:opacity-50">
                        {loading ? <Spinner /> : 'Send OTP'}
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
                
                {authView === 'login' && pageView === 'form' && (
                     <div className="text-center">
                        <button onClick={() => setLoginMethod(prev => prev === 'email' ? 'phone' : 'email')} className="font-medium text-sm text-brand-accent hover:text-brand-accent/80">
                           {loginMethod === 'email' ? 'Use phone instead' : 'Use email instead'}
                        </button>
                    </div>
                )}

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