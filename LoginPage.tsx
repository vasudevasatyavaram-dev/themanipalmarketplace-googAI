import React, { useState, FormEvent } from 'react';
import { supabase } from './services/supabase';
import Spinner from './components/ui/Spinner';
import GoogleIcon from './components/ui/GoogleIcon';

const LoginPage: React.FC = () => {
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

        if (!email.trim()) {
            setError('Email is required.');
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

        } catch (error: any) {
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
                        <label htmlFor="otp" className="block text-sm font-medium text-brand-dark/80">Enter verification code</label>
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

            <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-gray-300"></div>
                <span className="flex-shrink mx-4 text-xs text-gray-400 font-semibold">OR</span>
                <div className="flex-grow border-t border-gray-300"></div>
            </div>

            <div className="mt-2">
                <button onClick={signInWithGoogle} disabled={loading} className="w-full inline-flex justify-center items-center py-3 px-4 border border-gray-300 rounded-lg shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50">
                    <GoogleIcon />
                    Sign in with Google
                </button>
            </div>
        </div>
    );
}

export default LoginPage;