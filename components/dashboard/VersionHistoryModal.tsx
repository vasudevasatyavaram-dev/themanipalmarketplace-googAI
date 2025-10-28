
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../services/supabase';
import type { Product } from '../../types';
import Spinner from '../ui/Spinner';

interface VersionHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product;
  onReverted: () => void;
}

const VersionHistoryModal: React.FC<VersionHistoryModalProps> = ({ isOpen, onClose, product, onReverted }) => {
  const [versions, setVersions] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchVersions = useCallback(async () => {
    if (!product) return;
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('product_group_id', product.product_group_id)
        .order('edit_count', { ascending: false });

      if (error) throw error;
      setVersions(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [product]);

  useEffect(() => {
    if (isOpen) {
      fetchVersions();
    }
  }, [isOpen, fetchVersions]);

  const handleRevert = async (revertToVersion: Product) => {
    const newerVersions = versions.filter(v => v.edit_count > revertToVersion.edit_count);
    const confirmationMessage = `Are you sure you want to revert to Version ${revertToVersion.edit_count}? ${newerVersions.length > 0 ? `All newer versions (${newerVersions.map(v => `V${v.edit_count}`).join(', ')}) will be permanently deleted.` : ''}`;
    
    if (window.confirm(confirmationMessage)) {
      setLoading(true);
      setError(null);
      try {
        if (newerVersions.length > 0) {
            const { error: deleteError } = await supabase
              .from('products')
              .delete()
              .eq('product_group_id', product.product_group_id)
              .gt('edit_count', revertToVersion.edit_count);
            
            if (deleteError) throw deleteError;
        }
        
        // Note: Images for deleted versions are kept in storage in case the user
        // made a mistake and wants to re-upload them. A separate cleanup
        // process could handle orphaned images if necessary.
        
        onReverted();

      } catch (err: any) {
        setError(err.message);
        setLoading(false);
      }
    }
  };
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center p-2 sm:p-4">
      <div className="bg-brand-light border border-brand-dark/10 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[95vh] flex flex-col">
        <div className="p-5 border-b border-brand-dark/10 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-brand-dark">Version History</h2>
            <p className="text-sm text-brand-dark/70 truncate pr-4">{product.title}</p>
          </div>
          <button onClick={onClose} className="text-brand-dark/70 hover:text-brand-dark text-3xl leading-none">&times;</button>
        </div>
        <div className="p-5 overflow-y-auto flex-grow">
          {loading ? (
            <div className="flex justify-center py-8"><Spinner /></div>
          ) : error ? (
            <p className="text-center text-red-500">{error}</p>
          ) : (
            <div className="space-y-4">
              {versions.map((version, index) => (
                <div key={version.id} className={`p-4 rounded-lg border transition-all ${index === 0 ? 'bg-brand-cream border-brand-accent/50 shadow' : 'bg-white border-gray-200'}`}>
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                    <div>
                      <h3 className="font-bold text-lg text-brand-dark">
                        Version {version.edit_count} 
                        {index === 0 && <span className="text-sm font-semibold text-brand-accent ml-2">(Latest)</span>}
                      </h3>
                      <p className="text-xs text-brand-dark/60 mt-1">Created on: {formatDate(version.created_at)}</p>
                    </div>
                    {index > 0 && (
                      <button 
                        onClick={() => handleRevert(version)}
                        className="mt-3 sm:mt-0 bg-white border border-brand-dark/50 text-brand-dark px-4 py-2 text-sm font-semibold rounded-md hover:bg-brand-dark/5 transition"
                      >
                        Revert to this version
                      </button>
                    )}
                  </div>
                  <div className="mt-3 pt-3 border-t border-brand-dark/10 text-sm space-y-1">
                    <p><span className="font-semibold">Title:</span> {version.title}</p>
                    <p><span className="font-semibold">Price:</span> ₹{version.price}</p>
                    <p className="whitespace-pre-wrap"><span className="font-semibold">Description:</span> {version.description}</p>
                  </div>
                </div>
              ))}
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

export default VersionHistoryModal;