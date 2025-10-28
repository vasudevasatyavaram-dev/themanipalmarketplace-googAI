import React, { useState, FormEvent } from 'react';
import { supabase } from '../../services/supabase';
import Spinner from '../ui/Spinner';

interface ReportProblemModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
}

const ReportProblemModal: React.FC<ReportProblemModalProps> = ({ isOpen, onClose, userId }) => {
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const resetForm = () => {
    setSubject('');
    setBody('');
    setLoading(false);
    setError(null);
    setSuccess(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!body.trim()) {
      setError('The description of the problem cannot be empty.');
      return;
    }

    setLoading(true);
    const { error: insertError } = await supabase.from('queries').insert({
      user_id: userId,
      subject: subject.trim() || null,
      body: body.trim(),
    });

    if (insertError) {
      setError(insertError.message);
    } else {
      setSuccess(true);
    }
    setLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center p-2 sm:p-4">
      <div className="bg-brand-light border border-brand-dark/10 rounded-2xl shadow-2xl w-full max-w-lg flex flex-col">
        <div className="p-5 border-b border-brand-dark/10 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-brand-dark">Help & Support</h2>
          <button onClick={handleClose} className="text-brand-dark/70 hover:text-brand-dark text-3xl leading-none">&times;</button>
        </div>
        
        {success ? (
          <div className="p-8 text-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-600 mx-auto mb-4"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
            <h3 className="text-2xl font-bold text-brand-dark">Query Submitted!</h3>
            <p className="text-brand-dark/70 mt-2">Thank you for reaching out. Our team will review your query and get back to you as soon as possible.</p>
          </div>
        ) : (
          <form id="report-problem-form" onSubmit={handleSubmit} className="p-5 space-y-4">
            <div>
              <label htmlFor="subject" className="text-brand-dark/80 text-sm font-medium mb-1 block">Subject (Optional)</label>
              <input id="subject" type="text" placeholder="e.g., Problem with product approval" value={subject} onChange={e => setSubject(e.target.value)} className="w-full bg-white text-brand-dark px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-accent/80" />
            </div>
            <div>
              <label htmlFor="body" className="text-brand-dark/80 text-sm font-medium mb-1 block">Description of Problem/Query <span className="text-red-500">*</span></label>
              <textarea id="body" placeholder="Please provide as much detail as possible..." value={body} onChange={e => setBody(e.target.value)} className="w-full bg-white text-brand-dark px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-accent/80" rows={5} required></textarea>
            </div>
            <p className="text-xs text-brand-dark/60 text-center !mt-2">
              Note: Your user account will be associated with this query for context.
            </p>
            {error && <p className="text-red-500 text-sm text-center py-1">{error}</p>}
          </form>
        )}

        <div className="p-4 border-t border-brand-dark/10 flex justify-end gap-3">
          <button type="button" onClick={handleClose} className="bg-gray-200 text-gray-800 font-bold py-2.5 px-6 rounded-lg hover:bg-gray-300 transition">Close</button>
          {!success && (
            <button type="submit" form="report-problem-form" disabled={loading} className="bg-brand-accent text-white font-bold py-2.5 px-6 rounded-lg shadow-lg hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center min-w-[120px]">
              {loading ? <Spinner /> : 'Submit Query'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReportProblemModal;