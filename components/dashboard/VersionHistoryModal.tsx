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
            // Identify and delete orphaned images before deleting DB records
            const urlsToDelete = new Set(newerVersions.flatMap(v => v.image_url));
            const urlsToKeep = new Set(versions
                .filter(v => v.edit_count <= revertToVersion.edit_count)
                .flatMap(v => v.image_url)
            );
            const orphanedUrls = [...urlsToDelete].filter(url => !urlsToKeep.has(url));

            if (orphanedUrls.length > 0) {
                // FIX: Cast `url` to string to resolve 'unknown' type error.
                const filePaths = orphanedUrls.map(url => (url as string).split('/product_images/')[1]).filter(Boolean);
                if (filePaths.length > 0) {
                    const { error: storageError } = await supabase.storage
                        .from('product_images')
                        .remove(filePaths);
                    if (storageError) {
                        console.error("Failed to delete orphaned images, but proceeding with revert:", storageError);
                    }
                }
            }
            
            // Now, delete the database records for the newer versions
            const { error: deleteError } = await supabase
              .from('products')
              .delete()
              .eq('product_group_id', product.product_group_id)
              .gt('edit_count', revertToVersion.edit_count);
            
            if (deleteError) throw deleteError;
        }
        
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
              {versions.map((version, index) => {
                const isApproved = version.approval_status === 'approved';
                const isRejected = version.approval_status === 'rejected';
                const isLatest = index === 0;

                let versionClasses = 'p-4 rounded-lg border transition-all';
                if (isApproved) {
                    versionClasses += ' bg-green-50 border-green-400 shadow';
                } else if (isRejected) {
                    versionClasses += ' bg-red-50 border-red-200';
                } else if (isLatest) {
                    versionClasses += ' bg-brand-cream border-brand-accent/50 shadow';
                } else {
                    versionClasses += ' bg-white border-gray-200';
                }
                
                return (
                  <div key={version.id} className={versionClasses}>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                      <div className={isRejected ? 'opacity-60' : ''}>
                        <h3 className="font-bold text-lg text-brand-dark flex items-center flex-wrap gap-x-3 gap-y-1">
                          <span>Version {version.edit_count}</span>
                          {isApproved && <span className="text-xs font-semibold text-green-800 bg-green-200 px-2 py-0.5 rounded-full">Live</span>}
                          {isLatest && <span className="text-sm font-semibold text-brand-accent">(Latest)</span>}
                        </h3>
                        <p className={`text-xs text-brand-dark/60 mt-1`}>Created on: {formatDate(version.created_at)}</p>
                      </div>
                      
                       <div className="flex items-center gap-2 mt-3 sm:mt-0">
                          {isRejected && (
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold text-red-800 bg-red-100 px-2 py-0.5 rounded-full">Rejected</span>
                                {version.reject_explanation && (
                                     <div className="relative group/tooltip">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-red-700 cursor-pointer"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
                                        <div className="absolute top-full mt-2 w-48 bg-brand-dark text-white text-xs rounded-lg py-2 px-3 right-1/2 translate-x-1/2 opacity-0 group-hover/tooltip:opacity-100 transition-opacity duration-300 pointer-events-none z-40 shadow-lg">
                                            {version.reject_explanation}
                                            <svg className="absolute text-brand-dark h-2 w-full left-0 bottom-full" x="0px" y="0px" viewBox="0 0 255 255" xmlSpace="preserve"><polygon className="fill-current" points="0,255 127.5,127.5 255,255"/></svg>
                                        </div>
                                    </div>
                                )}
                            </div>
                          )}
                          {!isLatest && (
                            <button 
                              onClick={() => handleRevert(version)}
                              disabled={isRejected}
                              className="bg-white border border-brand-dark/50 text-brand-dark px-4 py-2 text-sm font-semibold rounded-md hover:bg-brand-dark/5 transition disabled:opacity-50 disabled:cursor-not-allowed"
                              title={isRejected ? "Cannot revert to a rejected version" : ""}
                            >
                              Revert to this version
                            </button>
                          )}
                      </div>
                    </div>
                    <div className={`mt-3 pt-3 border-t border-brand-dark/10 text-sm space-y-1 ${isRejected ? 'opacity-60' : ''}`}>
                      <p><span className="font-semibold">Title:</span> {version.title}</p>
                      <p>
                          <span className="font-semibold">{version.type === 'rent' ? 'Rental Price:' : 'Price:'}</span>
                          {' '}₹{version.price}{version.type === 'rent' && version.session && ` / ${version.session}`}
                      </p>
                      <p className="whitespace-pre-wrap"><span className="font-semibold">Description:</span> {version.description}</p>
                    </div>
                  </div>
                );
              })}
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
