import React, { useState } from 'react';
import type { Product } from '../../types';

interface ProductListProps {
  products: Product[];
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
}

interface ProductCardProps {
  product: Product;
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onEdit, onDelete }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const getStatusChipClass = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500/20 text-yellow-700';
      case 'approved': return 'bg-green-500/20 text-green-700';
      case 'rejected': return 'bg-red-500/20 text-red-700';
      default: return 'bg-gray-500/20 text-gray-700';
    }
  };
  
  const nextImage = (e: React.MouseEvent) => {
      e.stopPropagation();
      setCurrentImageIndex(prev => (prev + 1) % product.image_url.length);
  };
  const prevImage = (e: React.MouseEvent) => {
      e.stopPropagation();
      setCurrentImageIndex(prev => (prev - 1 + product.image_url.length) % product.image_url.length);
  };

  const canEdit = product.approval_status === 'pending' && product.edit_count < 3;
  const hasMultipleImages = product.image_url && product.image_url.length > 1;

  return (
    <div className="bg-brand-cream rounded-xl flex flex-col shadow-lg transition-transform hover:scale-[1.02] duration-300 ease-in-out border border-brand-dark/5 overflow-hidden">
      <div className="w-full h-56 bg-white flex items-center justify-center p-2 relative group">
        {product.image_url?.length > 0 ? (
          <img src={product.image_url[currentImageIndex]} alt={product.title} className="max-w-full max-h-full object-contain" />
        ) : (
          <div className="w-full h-full bg-brand-light flex items-center justify-center">
            <span className="text-brand-dark/50">No Image</span>
          </div>
        )}
        {hasMultipleImages && (
            <>
                <button onClick={prevImage} className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/30 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
                </button>
                <button onClick={nextImage} className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/30 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
                </button>
            </>
        )}
      </div>
      <div className="p-4 flex flex-col flex-grow">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-bold text-lg text-brand-dark leading-tight pr-2">{product.title}</h3>
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap ${getStatusChipClass(product.approval_status)}`}>
              {product.approval_status === 'pending' ? 'Approval Pending' : product.approval_status.charAt(0).toUpperCase() + product.approval_status.slice(1)}
          </span>
        </div>
        
        <div className="space-y-1 text-sm text-brand-dark/80 mb-3">
            {product.category && product.category.length > 0 && (
                <p><span className="font-semibold">Category:</span> {product.category.join(', ')}</p>
            )}
             <p><span className="font-semibold">List Price:</span> ₹{product.price}</p>
        </div>
        
        <p className="text-brand-dark/70 text-sm mb-4 flex-grow">{product.description}</p>

        <div className="border-t border-brand-dark/10 pt-3 mt-auto">
            <div className="flex justify-between items-center text-sm text-brand-dark/70 mb-3">
                <p>Qty Left: <span className="font-bold text-brand-dark">{product.quantity_left}</span></p>
                <p>Qty Sold: <span className="font-bold text-brand-dark">{product.quantity_sold}</span></p>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => onEdit(product)}
                disabled={!canEdit}
                className="flex-1 text-center bg-blue-600/90 text-white px-3 py-2 text-sm font-semibold rounded-md hover:bg-blue-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
                title={!canEdit ? (product.approval_status !== 'pending' ? 'Can only edit pending products' : 'Max edits reached') : ''}
              >
                Edit {product.approval_status === 'pending' ? `(${3 - product.edit_count} left)` : ''}
              </button>
              <button
                onClick={() => onDelete(product)}
                className="flex-1 text-center bg-red-600/90 text-white px-3 py-2 text-sm font-semibold rounded-md hover:bg-red-700 transition"
              >
                Delete
              </button>
            </div>
        </div>

      </div>
    </div>
  );
};

const ProductList: React.FC<ProductListProps> = ({ products, onEdit, onDelete }) => {
  if (products.length === 0) {
    return (
      <div className="text-center py-16 px-6 bg-brand-cream rounded-xl border border-brand-dark/5">
        <h2 className="text-2xl font-bold text-brand-dark">No Products Yet!</h2>
        <p className="text-brand-dark/70 mt-2">Click "Add New Product" to get started.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} onEdit={onEdit} onDelete={onDelete}/>
      ))}
    </div>
  );
};

export default ProductList;