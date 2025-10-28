
import React from 'react';
import type { Product } from '../../types';

interface ProductListProps {
  products: Product[];
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
  onHistory: (product: Product) => void;
}

interface ProductCardProps {
  product: Product;
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
  onHistory: (product: Product) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onEdit, onDelete, onHistory }) => {
  const isRejected = product.approval_status === 'rejected';

  const getStatusChipClass = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500/20 text-yellow-800';
      case 'approved': return 'bg-green-500/20 text-green-800';
      case 'rejected': return 'bg-red-500/20 text-red-800';
      default: return 'bg-gray-500/20 text-gray-700';
    }
  };

  const canEdit = product.approval_status === 'pending' && product.edit_count < 3;

  return (
    <div className={`bg-brand-cream rounded-xl flex flex-col shadow-lg transition-transform hover:scale-[1.02] duration-300 ease-in-out border border-brand-dark/10 overflow-hidden`}>
      <div className={`w-full h-56 bg-white flex items-center justify-center p-2 relative group transition-opacity ${isRejected ? 'opacity-50' : ''}`}>
        {product.image_url?.length > 0 ? (
          <img src={product.image_url[0]} alt={product.title} className="max-w-full max-h-full object-contain" />
        ) : (
          <div className="w-full h-full bg-brand-light flex items-center justify-center">
            <span className="text-brand-dark/50">No Image</span>
          </div>
        )}
      </div>
      <div className="p-5 flex flex-col flex-grow">
        <div className="flex justify-between items-start mb-2">
          <h3 className={`font-bold text-lg text-brand-dark leading-tight pr-2 transition-opacity ${isRejected ? 'opacity-50' : ''}`}>{product.title}</h3>
          <div className="flex items-center gap-2 flex-shrink-0">
            {product.approval_status === 'rejected' && product.reject_explanation && (
                <div className="relative group">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-red-700 cursor-pointer"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
                    <div className="absolute bottom-full mb-2 w-48 bg-brand-dark text-white text-xs rounded-lg py-2 px-3 right-1/2 translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10 shadow-lg">
                        {product.reject_explanation}
                        <svg className="absolute text-brand-dark h-2 w-full left-0 top-full" x="0px" y="0px" viewBox="0 0 255 255"><polygon className="fill-current" points="0,0 127.5,127.5 255,0"/></svg>
                    </div>
                </div>
            )}
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ${getStatusChipClass(product.approval_status)}`}>
                {product.approval_status === 'pending' ? 'Approval Pending' : product.approval_status.charAt(0).toUpperCase() + product.approval_status.slice(1)}
            </span>
          </div>
        </div>
        
        <div className={`space-y-1 text-sm text-brand-dark/80 mb-3 transition-opacity ${isRejected ? 'opacity-50' : ''}`}>
            {product.category && product.category.length > 0 && (
                <p><span className="font-semibold">Category:</span> {product.category.join(', ')}</p>
            )}
             <p><span className="font-semibold">List Price:</span> ₹{product.price}</p>
        </div>
        
        <p className={`text-brand-dark/70 text-sm mb-4 flex-grow transition-opacity whitespace-pre-wrap ${isRejected ? 'opacity-50' : ''}`}>{product.description}</p>

        <div className="border-t border-brand-dark/10 pt-4 mt-auto">
            <div className={`flex justify-between items-center text-sm text-brand-dark/70 mb-4 transition-opacity ${isRejected ? 'opacity-50' : ''}`}>
                <p>Qty Left: <span className="font-bold text-brand-dark">{product.quantity_left}</span></p>
                <p>Qty Sold: <span className="font-bold text-brand-dark">{product.quantity_sold}</span></p>
            </div>
            <div className="flex items-end gap-2">
              <div className={`flex flex-col text-center transition-opacity ${isRejected ? 'opacity-50' : ''}`}>
                {canEdit && (
                  <p className="text-xs text-brand-dark/60 mb-1">
                    {3 - product.edit_count} {3 - product.edit_count === 1 ? 'edit' : 'edits'} left
                  </p>
                )}
                <button 
                  onClick={() => onEdit(product)}
                  disabled={!canEdit}
                  className="w-full text-center bg-white border border-brand-dark/50 text-brand-dark px-3 py-2 text-sm font-semibold rounded-md hover:bg-brand-dark/5 transition disabled:bg-gray-200 disabled:text-gray-500 disabled:border-gray-300 disabled:cursor-not-allowed"
                  title={!canEdit ? (product.approval_status !== 'pending' ? 'Can only edit pending products' : 'Max edits reached') : ''}
                >
                  Edit
                </button>
              </div>
               {product.edit_count > 0 && !isRejected && (
                 <div className="flex flex-col text-center flex-1">
                    <p className="text-xs text-brand-dark/60 mb-1 h-4"></p>
                    <button 
                        onClick={() => onHistory(product)}
                        className="w-full text-center bg-white border border-brand-dark/50 text-brand-dark px-3 py-2 text-sm font-semibold rounded-md hover:bg-brand-dark/5 transition"
                    >
                        History
                    </button>
                 </div>
               )}
              <div className="flex flex-col text-center flex-1">
                <p className="text-xs text-brand-dark/60 mb-1 h-4"></p>
                <button
                  onClick={() => onDelete(product)}
                  className="w-full text-center bg-brand-accent text-white px-3 py-2 text-sm font-semibold rounded-md hover:bg-brand-accent/90 transition"
                >
                  Delete
                </button>
              </div>
            </div>
        </div>
      </div>
    </div>
  );
};

const ProductList: React.FC<ProductListProps> = ({ products, onEdit, onDelete, onHistory }) => {
  if (products.length === 0) {
    return (
      <div className="text-center py-16 px-6 bg-brand-cream rounded-xl border-2 border-dashed border-brand-dark/10">
        <h2 className="text-2xl font-bold text-brand-dark">No Products Yet!</h2>
        <p className="text-brand-dark/70 mt-2">Click "Add New Product" to get started.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} onEdit={onEdit} onDelete={onDelete} onHistory={onHistory}/>
      ))}
    </div>
  );
};

export default ProductList;
