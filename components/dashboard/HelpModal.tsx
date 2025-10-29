import React, { useState, FormEvent, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import type { Session } from '@supabase/supabase-js';
import Spinner from '../ui/Spinner';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onQuerySubmitted: () => void;
  session: Session;
}

const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose, onQuerySubmitted, session }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');

  useEffect(() => {
    if (isOpen) {
      // Reset form when modal opens
      setSubject('');
      setBody('');
      setError(null);
    }
  }, [isOpen]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!body.trim()) {
      setError('The message body cannot be empty.');
      return;
    }

    setLoading(true);

    const { error: insertError } = await supabase.from('report_query').insert({
      subject: subject.trim() || null,
      body: body.trim(),
      user_id: session.user.id,
    });

    if (insertError) {
      setError(insertError.message);
    } else {
      onQuerySubmitted();
    }

    setLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center p-2 sm:p-4">
      <div className="bg-brand-light border border-brand-dark/10 rounded-2xl shadow-2xl w-full max-w-lg flex flex-col">
        <div className="p-5 border-b border-brand-dark/10 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-brand-dark">Help & Support</h2>
          <button onClick={onClose} className="text-brand-dark/70 hover:text-brand-dark text-3xl leading-none">&times;</button>
        </div>
        <form id="help-form" onSubmit={handleSubmit} className="p-5 space-y-4">
          <p className="text-sm text-brand-dark/70">
            Have a question or facing an issue? Let us know, and our team will get back to you as soon as possible.
          </p>
          <div>
            <label htmlFor="subject" className="text-brand-dark/80 text-sm font-medium mb-1 block">Subject (Optional)</label>
            <input 
              id="subject" 
              type="text" 
              placeholder="e.g., Issue with product approval" 
              value={subject} 
              onChange={e => setSubject(e.target.value)} 
              className="w-full bg-white text-brand-dark px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-accent/80" 
            />
          </div>
          <div>
            <label htmlFor="body" className="text-brand-dark/80 text-sm font-medium mb-1 block">Message <span className="text-red-500">*</span></label>
            <textarea 
              id="body" 
              placeholder="Please describe your issue in detail..." 
              value={body} 
              onChange={e => setBody(e.target.value)} 
              className={`w-full bg-white text-brand-dark px-4 py-2.5 rounded-lg border focus:outline-none focus:ring-2 focus:ring-brand-accent/80 ${error ? 'border-red-500' : 'border-gray-300'}`} 
              rows={5} 
              required
            ></textarea>
            {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
          </div>
        </form>
        <div className="p-4 border-t border-brand-dark/10 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="bg-gray-200 text-gray-800 font-bold py-2.5 px-6 rounded-lg hover:bg-gray-300 transition">Cancel</button>
          <button 
            type="submit" 
            form="help-form" 
            disabled={loading} 
            className="bg-brand-accent text-white font-bold py-2.5 px-6 rounded-lg shadow-lg hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center min-w-[120px]"
          >
            {loading ? <Spinner /> : 'Submit Query'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default HelpModal;
