import React from 'react';
import type { Product } from '../../types';

interface ProductListProps {
  products: Product[];
}

interface ProductCardProps {
  product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const getStatusChipClass = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500/20 text-yellow-500';
      case 'approved': return 'bg-green-500/20 text-green-500';
      case 'rejected': return 'bg-red-500/20 text-red-500';
      default: return 'bg-gray-500/20 text-gray-500';
    }
  };
  
  return (
    <div className="bg-brand-cream rounded-xl overflow-hidden shadow-lg transition-transform hover:scale-105 duration-300 ease-in-out border border-brand-dark/5">
      {product.image_url?.[0] ? (
        <img src={product.image_url[0]} alt={product.title} className="w-full h-48 object-cover" />
      ) : (
        <div className="w-full h-48 bg-brand-light flex items-center justify-center">
          <span className="text-brand-dark/50">No Image</span>
        </div>
      )}
      <div className="p-4">
        <div className="flex justify-between items-start">
            <h3 className="font-bold text-lg text-brand-dark mb-2 truncate">{product.title}</h3>
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${getStatusChipClass(product.approval_status)}`}>
              {product.approval_status.charAt(0).toUpperCase() + product.approval_status.slice(1)}
            </span>
        </div>
        <p className="text-brand-dark/70 text-sm h-10 overflow-hidden text-ellipsis">{product.description}</p>
        <div className="mt-4 flex justify-between items-center">
          <p className="text-xl font-semibold text-brand-accent">
            ₹{product.price}
          </p>
          <div className="text-right">
             <p className="text-sm text-brand-dark/70">Stock: {product.quantity_left}</p>
             <p className="text-sm text-brand-dark/70 capitalize">For {product.type}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const ProductList: React.FC<ProductListProps> = ({ products }) => {
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
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
};

export default ProductList;