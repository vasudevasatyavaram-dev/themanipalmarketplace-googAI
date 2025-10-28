import React, { useState, useEffect, FormEvent } from 'react';
import { supabase } from '../../services/supabase';
import type { Session } from '@supabase/supabase-js';
import Spinner from '../ui/Spinner';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: Session;
}

type View = 'viewing' | 'editing_name' | 'editing_email' | 'verifying_email' | 'editing_phone' | 'verifying_phone';

const GoogleIcon = () => (
    <svg className="w-5 h-5" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"></path><path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"></path><path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"></path><path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571l6.19,5.238C42.01,35.846,44,30.138,44,24C44,22.659,43.862,21.35,43.611,20.083z"></path></svg>
);
const LogOutIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" x2="9" y1="12" y2="12"></line></svg>
);


const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose, session }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [view, setView] = useState<View>('viewing');
  
  const [fullName, setFullName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [otp, setOtp] = useState('');

  useEffect(() => {
    if (isOpen) {
      setFullName(session.user.user_metadata.full_name || '');
      // Reset state when modal opens
      setView('viewing');
      setError(null);
      setSuccess(null);
      setNewEmail('');
      setNewPhone('');
      setOtp('');
    }
  }, [isOpen, session]);

  const handleNameUpdate = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    const { error } = await supabase.auth.updateUser({ data: { full_name: fullName } });
    if (error) {
      setError(error.message);
    } else {
      setSuccess('Full name updated successfully!');
      setView('viewing');
    }
    setLoading(false);
  };

  const handleSendUpdateOtp = async (type: 'email' | 'phone') => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    const credentials = type === 'email' ? { email: newEmail } : { phone: `+91${newPhone}` };
    const { error } = await supabase.auth.updateUser(credentials);
    
    if (error) {
      setError(error.message);
    } else {
      setView(type === 'email' ? 'verifying_email' : 'verifying_phone');
      setSuccess(`Verification code sent to ${type === 'email' ? newEmail : `+91${newPhone}`}.`);
    }
    setLoading(false);
  };
  
  const handleVerifyUpdateOtp = async (type: 'email' | 'phone') => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    const verificationDetails = type === 'email' 
      ? { email: newEmail, token: otp, type: 'email_change' as const }
      : { phone: `+91${newPhone}`, token: otp, type: 'phone_change' as const };

    const { error } = await supabase.auth.verifyOtp(verificationDetails);

    if (error) {
      setError(error.message);
    } else {
      setSuccess(`${type === 'email' ? 'Email' : 'Phone'} updated successfully!`);
      setView('viewing');
      setNewEmail('');
      setNewPhone('');
      setOtp('');
    }
    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const isGoogleUser = session.user.app_metadata.provider === 'google';

  const renderContent = () => {
    switch(view) {
        case 'editing_name':
            return (
                <form onSubmit={handleNameUpdate} className="space-y-4">
                    <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} className="w-full bg-white text-brand-dark px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-accent/80" required />
                    <div className="flex gap-2 justify-end">
                        <button type="button" onClick={() => setView('viewing')} className="bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded-lg hover:bg-gray-300 transition text-sm">Cancel</button>
                        <button type="submit" disabled={loading} className="bg-brand-accent text-white font-bold py-2 px-4 rounded-lg shadow-lg hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center min-w-[80px] text-sm">{loading ? <Spinner /> : 'Save'}</button>
                    </div>
                </form>
            );
        case 'editing_email':
            return (
                <div className="space-y-4">
                    <input type="email" placeholder="Enter new email" value={newEmail} onChange={e => setNewEmail(e.target.value)} className="w-full bg-white text-brand-dark px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-accent/80" required />
                    <div className="flex gap-2 justify-end">
                        <button type="button" onClick={() => setView('viewing')} className="bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded-lg hover:bg-gray-300 transition text-sm">Cancel</button>
                        <button onClick={() => handleSendUpdateOtp('email')} disabled={loading} className="bg-brand-accent text-white font-bold py-2 px-4 rounded-lg shadow-lg hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center min-w-[120px] text-sm">{loading ? <Spinner /> : 'Send OTP'}</button>
                    </div>
                </div>
            );
        case 'verifying_email':
             return (
                <div className="space-y-4">
                    <input type="text" placeholder="Enter OTP" value={otp} onChange={e => setOtp(e.target.value)} className="w-full bg-white text-brand-dark px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-accent/80" required />
                    <div className="flex gap-2 justify-end">
                        <button type="button" onClick={() => setView('editing_email')} className="bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded-lg hover:bg-gray-300 transition text-sm">Back</button>
                        <button onClick={() => handleVerifyUpdateOtp('email')} disabled={loading} className="bg-brand-accent text-white font-bold py-2 px-4 rounded-lg shadow-lg hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center min-w-[100px] text-sm">{loading ? <Spinner /> : 'Verify'}</button>
                    </div>
                </div>
            );
        case 'editing_phone':
             return (
                <div className="space-y-4">
                    <div className="flex rounded-lg shadow-sm">
                        <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">+91</span>
                        <input type="tel" placeholder="9876543210" value={newPhone} onChange={e => setNewPhone(e.target.value)} required pattern="[0-9]{10}" className="block w-full flex-1 rounded-none rounded-r-lg px-4 py-2.5 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-accent/80" />
                    </div>
                    <div className="flex gap-2 justify-end">
                        <button type="button" onClick={() => setView('viewing')} className="bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded-lg hover:bg-gray-300 transition text-sm">Cancel</button>
                        <button onClick={() => handleSendUpdateOtp('phone')} disabled={loading} className="bg-brand-accent text-white font-bold py-2 px-4 rounded-lg shadow-lg hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center min-w-[120px] text-sm">{loading ? <Spinner /> : 'Send OTP'}</button>
                    </div>
                </div>
            );
        case 'verifying_phone':
             return (
                <div className="space-y-4">
                    <input type="text" placeholder="Enter OTP" value={otp} onChange={e => setOtp(e.target.value)} className="w-full bg-white text-brand-dark px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-accent/80" required />
                    <div className="flex gap-2 justify-end">
                        <button type="button" onClick={() => setView('editing_phone')} className="bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded-lg hover:bg-gray-300 transition text-sm">Back</button>
                        <button onClick={() => handleVerifyUpdateOtp('phone')} disabled={loading} className="bg-brand-accent text-white font-bold py-2 px-4 rounded-lg shadow-lg hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center min-w-[100px] text-sm">{loading ? <Spinner /> : 'Verify'}</button>
                    </div>
                </div>
            );
        default: // 'viewing'
            return (
                <>
                    <div className="space-y-2">
                        <div className="flex justify-between items-center py-3">
                            <div>
                                <p className="text-sm text-brand-dark/70">Full Name</p>
                                <p className="font-semibold">{session.user.user_metadata.full_name || 'Not set'}</p>
                            </div>
                            <button onClick={() => setView('editing_name')} className="text-sm font-bold text-brand-accent hover:underline">Edit</button>
                        </div>
                        <div className="flex justify-between items-center py-3 border-t border-brand-dark/10">
                            <div>
                                <p className="text-sm text-brand-dark/70">Email Address</p>
                                <p className="font-semibold">{session.user.email || 'Not set'}</p>
                            </div>
                            {!isGoogleUser && <button onClick={() => setView('editing_email')} className="text-sm font-bold text-brand-accent hover:underline">Edit</button>}
                        </div>
                        <div className="flex justify-between items-center py-3 border-t border-brand-dark/10">
                            <div>
                                <p className="text-sm text-brand-dark/70">Phone Number</p>
                                <p className="font-semibold">{session.user.phone || 'Not set'}</p>
                            </div>
                            <button onClick={() => setView('editing_phone')} className="text-sm font-bold text-brand-accent hover:underline">Edit</button>
                        </div>
                    </div>
                    <div className="pt-4 border-t border-brand-dark/10">
                        <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 text-brand-dark/80 hover:bg-brand-dark/5 border border-brand-dark/20 transition-colors px-4 py-2.5 rounded-lg font-semibold">
                            <LogOutIcon />
                            Logout
                        </button>
                    </div>
                </>
            );
    }
  };


  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center p-2 sm:p-4">
      <div className="bg-brand-light border border-brand-dark/10 rounded-2xl shadow-2xl w-full max-w-lg flex flex-col">
        <div className="p-5 border-b border-brand-dark/10 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-brand-dark">Profile Settings</h2>
          <button onClick={onClose} className="text-brand-dark/70 hover:text-brand-dark text-3xl leading-none">&times;</button>
        </div>
        <div className="p-5 space-y-4">
            {error && <p className="text-red-500 text-sm text-center p-2 bg-red-100 rounded-md">{error}</p>}
            {success && <p className="text-green-800 text-sm text-center p-2 bg-green-100 rounded-md">{success}</p>}
            
            {renderContent()}

            {view === 'viewing' && isGoogleUser && (
                 <div className="p-3 bg-brand-cream rounded-lg border border-brand-dark/10 flex items-center gap-3">
                    <GoogleIcon />
                    <div>
                        <p className="font-semibold text-sm">Connected with Google</p>
                        <p className="text-xs text-brand-dark/70">Email is managed by your Google account.</p>
                    </div>
                </div>
            )}
        </div>
        <div className="p-4 border-t border-brand-dark/10 flex justify-end">
          <button type="button" onClick={onClose} className="bg-gray-200 text-gray-800 font-bold py-2.5 px-6 rounded-lg hover:bg-gray-300 transition">Close</button>
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;