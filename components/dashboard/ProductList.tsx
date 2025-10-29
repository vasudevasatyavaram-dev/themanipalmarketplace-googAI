import React, { useState } from 'react';
import type { Product } from '../../types';
import type { UnapprovedEditStatus } from './Dashboard';

interface ProductListProps {
  products: Product[];
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
  onHistory: (product: Product) => void;
  unapprovedEditsStatus: Map<string, UnapprovedEditStatus>;
}

interface ProductCardProps {
  product: Product;
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
  onHistory: (product: Product) => void;
  unapprovedStatus?: UnapprovedEditStatus;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onEdit, onDelete, onHistory, unapprovedStatus }) => {
  const isRejected = product.approval_status === 'rejected';
  const isApproved = product.approval_status === 'approved';
  const [currentIndex, setCurrentIndex] = useState(0);

  const getStatusChipClass = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500/20 text-yellow-800';
      case 'approved': return 'bg-green-500/20 text-green-800';
      case 'rejected': return 'bg-red-500/20 text-red-800';
      default: return 'bg-gray-500/20 text-gray-700';
    }
  };

  const canEditNonApproved = product.edit_count < 3;
  const showEditButton = isApproved || ((isRejected || product.approval_status === 'pending') && canEditNonApproved);
  const showHistoryButton = (isApproved && unapprovedStatus) || (!isApproved && product.edit_count > 0);

  const goToPrevious = () => {
    const isFirstSlide = currentIndex === 0;
    const newIndex = isFirstSlide ? product.image_url.length - 1 : currentIndex - 1;
    setCurrentIndex(newIndex);
  };

  const goToNext = () => {
    const isLastSlide = currentIndex === product.image_url.length - 1;
    const newIndex = isLastSlide ? 0 : currentIndex + 1;
    setCurrentIndex(newIndex);
  };
  
  const contentShouldBeFaded = isRejected;

  return (
    <div className="group">
      <div className={`bg-brand-cream rounded-xl flex flex-col transition-all duration-300 ease-in-out overflow-hidden group-hover:shadow-2xl group-hover:-translate-y-1 ${isApproved ? 'border-2 border-green-500 shadow-xl' : 'border border-brand-dark/10 shadow-lg'}`}>
        <div className={`w-full h-56 bg-white flex items-center justify-center p-2 relative group/carousel ${contentShouldBeFaded ? 'opacity-50' : ''}`}>
          {isApproved && (
            <div className="absolute top-2 left-2 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 z-10 shadow">
              //<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
              <span>Live</span>
            </div>
          )}
          {product.image_url?.length > 0 ? (
            <img src={product.image_url[currentIndex]} alt={product.title} className="max-w-full max-h-full object-contain" />
          ) : (
            <div className="w-full h-full bg-brand-light flex items-center justify-center">
              <span className="text-brand-dark/50">No Image</span>
            </div>
          )}
          {product.image_url?.length > 1 && (
            <>
              <button onClick={goToPrevious} className="absolute top-1/2 left-2 -translate-y-1/2 bg-black/40 text-white rounded-full p-1.5 opacity-0 group-hover/carousel:opacity-100 transition-opacity duration-300 hover:bg-black/60 z-10">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
              </button>
              <button onClick={goToNext} className="absolute top-1/2 right-2 -translate-y-1/2 bg-black/40 text-white rounded-full p-1.5 opacity-0 group-hover/carousel:opacity-100 transition-opacity duration-300 hover:bg-black/60 z-10">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
              </button>
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
                {product.image_url.map((_, slideIndex) => (
                  <div key={slideIndex} className={`w-2 h-2 rounded-full transition-all duration-300 ${currentIndex === slideIndex ? 'bg-brand-accent' : 'bg-gray-400/70'}`}></div>
                ))}
              </div>
            </>
          )}
        </div>
        <div className="p-5 flex flex-col flex-grow">
          <div className="flex justify-between items-start mb-2">
            <h3 className={`font-bold text-lg text-brand-dark leading-tight pr-2 truncate ${contentShouldBeFaded ? 'opacity-50' : ''}`}>{product.title}</h3>
            <div className="flex items-center gap-2 flex-shrink-0 flex-wrap justify-end">
              
                {isRejected && product.reject_explanation && (
                    <div className="relative group/tooltip inline-block">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-red-700 cursor-pointer"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
                        <div className="absolute bottom-full mb-2 w-48 bg-brand-dark text-white text-xs rounded-lg py-2 px-3 right-1/2 translate-x-1/2 opacity-0 group-hover/tooltip:opacity-100 transition-opacity duration-300 pointer-events-none z-20 shadow-lg">
                            {product.reject_explanation}
                            <svg className="absolute text-brand-dark h-2 w-full left-0 top-full" x="0px" y="0px" viewBox="0 0 255 255"><polygon className="fill-current" points="0,0 127.5,127.5 255,0"/></svg>
                        </div>
                    </div>
                )}
              
              {isApproved && unapprovedStatus?.status === 'pending' && (
                 <span className="text-xs font-semibold px-2 py-0.5 rounded-full whitespace-nowrap bg-yellow-500/20 text-yellow-800">
                    Pending Edit
                 </span>
              )}
              {isApproved && unapprovedStatus?.status === 'rejected' && (
                 <div className="flex items-center gap-1 bg-red-500/20 text-red-800 text-xs font-semibold px-2 py-0.5 rounded-full whitespace-nowrap">
                    <span>Edit Rejected</span>
                    {unapprovedStatus.explanation && (
                       <div className="relative group/tooltip">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-red-700 cursor-pointer"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
                          <div className="absolute bottom-full mb-2 w-48 bg-brand-dark text-white text-xs rounded-lg py-2 px-3 right-1/2 translate-x-1/2 opacity-0 group-hover/tooltip:opacity-100 transition-opacity duration-300 pointer-events-none z-20 shadow-lg">
                              {unapprovedStatus.explanation}
                              <svg className="absolute text-brand-dark h-2 w-full left-0 top-full" x="0px" y="0px" viewBox="0 0 255 255"><polygon className="fill-current" points="0,0 127.5,127.5 255,0"/></svg>
                          </div>
                      </div>
                    )}
                 </div>
              )}
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ${getStatusChipClass(product.approval_status)}`}>
                  {product.approval_status === 'pending' ? 'Approval Pending' : product.approval_status.charAt(0).toUpperCase() + product.approval_status.slice(1)}
              </span>
            </div>
          </div>
          
          <div className={`space-y-1 text-sm text-brand-dark/80 mb-3 ${contentShouldBeFaded ? 'opacity-50' : ''}`}>
              {product.category && product.category.length > 0 && (
                  <p><span className="font-semibold">Category:</span> {product.category.join(', ')}</p>
              )}
               <p>
                <span className="font-semibold">{product.type === 'rent' ? 'Rental Price:' : 'List Price:'}</span>
                {' '}₹{product.price}{product.type === 'rent' && product.session && ` / ${product.session}`}
               </p>
          </div>
          
          <p className={`text-brand-dark/70 text-sm mb-4 flex-grow whitespace-pre-wrap ${contentShouldBeFaded ? 'opacity-50' : ''}`}>{product.description}</p>

          <div className="border-t border-brand-dark/10 pt-4 mt-auto">
              <div className={`flex justify-between items-center text-sm text-brand-dark/70 mb-4 ${contentShouldBeFaded ? 'opacity-50' : ''}`}>
                  <p>Qty Left: <span className="font-bold text-brand-dark">{product.quantity_left}</span></p>
                  <p>Qty Sold: <span className="font-bold text-brand-dark">{product.quantity_sold}</span></p>
              </div>
              <div className="flex items-end gap-2">
                 {showEditButton && (
                    <div className="flex flex-col text-center flex-1">
                      <p className={`text-xs text-brand-dark/60 mb-1 h-4 ${contentShouldBeFaded ? 'opacity-50' : ''}`}>
                        {!isApproved && canEditNonApproved && `${3 - product.edit_count} ${3 - product.edit_count === 1 ? 'edit' : 'edits'} left`}
                      </p>
                      <button 
                        onClick={() => onEdit(product)}
                        disabled={!isApproved && !canEditNonApproved}
                        className="w-full text-center bg-white border border-brand-dark/50 text-brand-dark px-3 py-2 text-sm font-semibold rounded-md hover:bg-brand-dark/5 transition disabled:bg-gray-200 disabled:text-gray-500 disabled:border-gray-300 disabled:cursor-not-allowed"
                        title={!isApproved && !canEditNonApproved ? 'Max edits reached' : ''}
                      >
                        {isRejected ? 'Resubmit' : 'Edit'}
                      </button>
                    </div>
                 )}
                 {showHistoryButton && (
                   <div className="flex flex-col text-center flex-1">
                      <p className={`text-xs text-brand-dark/60 mb-1 h-4 ${contentShouldBeFaded ? 'opacity-50' : ''}`}></p>
                      <button 
                          onClick={() => onHistory(product)}
                          className="w-full text-center bg-white border border-brand-dark/50 text-brand-dark px-3 py-2 text-sm font-semibold rounded-md hover:bg-brand-dark/5 transition"
                      >
                          History
                      </button>
                   </div>
                 )}
                <div className="flex flex-col text-center flex-1">
                  <p className={`text-xs text-brand-dark/60 mb-1 h-4 ${contentShouldBeFaded ? 'opacity-50' : ''}`}></p>
                  <button
                    onClick={() => onDelete(product)}
                    className="w-full text-center bg-transparent border border-brand-accent text-brand-accent px-3 py-2 text-sm font-semibold rounded-md hover:bg-brand-accent hover:text-white transition"
                  >
                    Delete
                  </button>
                </div>
              </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ProductList: React.FC<ProductListProps> = ({ products, onEdit, onDelete, onHistory, unapprovedEditsStatus }) => {
  if (products.length === 0) {
    return (
      <div className="text-center py-16 px-6 bg-brand-cream rounded-xl border-2 border-dashed border-brand-dark/10">
        <svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="mx-auto text-brand-dark/30 mb-4"><path d="M21 10.3c.1-.5.1-1.1.1-1.3 0-2.5-2-4-4-4h-2.5c-.4 0-.7 0-1 .1 -2.3.4-4.5 2.1-6.1 4.1 -2.3 2.9-3.2 6.4-2.6 9.8 .1.6.2 1.2.4 1.7"></path><path d="M14 22c1.7 0 3-1.3 3-3 0-1.2-.8-2.3-2-2.8"></path><path d="M4.7 19.3c-1.2-1.5-1.7-3.4-1.7-5.3 0-4.4 3.6-8 8-8h.5"></path><path d="M16 22c-1.1 0-2.1-.6-2.6-1.5"></path><path d="M8 14A6 6 0 0 0 2 8"></path></svg>
        <h2 className="text-2xl font-bold text-brand-dark">Your Storefront is Empty!</h2>
        <p className="text-brand-dark/70 mt-2 max-w-md mx-auto">This is where your products will appear. Ready to make your first sale? Add your first product to get started.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {products.map((product) => (
        <ProductCard 
          key={product.id} 
          product={product} 
          onEdit={onEdit} 
          onDelete={onDelete} 
          onHistory={onHistory}
          unapprovedStatus={unapprovedEditsStatus.get(product.product_group_id)}
        />
      ))}
    </div>
  );
};

export default ProductList;