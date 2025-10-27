import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../services/supabase';
import type { Session } from '@supabase/supabase-js';
import type { Product } from '../../types';
import Header from '../layout/Header';
import AddProductModal from './AddProductModal';
import EditProductModal from './EditProductModal';
import ProductList from './ProductList';
import Spinner from '../ui/Spinner';

interface DashboardProps {
  session: Session;
}

const PlusIcon = () => (
    <svg xmlns="http://www.w.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
);

const Dashboard: React.FC<DashboardProps> = ({ session }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false });

    if (error) {
      setError(error.message);
    } else if (data) {
      setProducts(data);
    }
    setLoading(false);
  }, [session.user.id]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleProductAdded = () => {
    fetchProducts();
    setIsAddModalOpen(false);
  };

  const handleProductEdited = () => {
    fetchProducts();
    setIsEditModalOpen(false);
    setProductToEdit(null);
  };

  const openEditModal = (product: Product) => {
    setProductToEdit(product);
    setIsEditModalOpen(true);
  };

  const handleDeleteProduct = async (product: Product) => {
    if (window.confirm(`Are you sure you want to delete "${product.title}"? This action cannot be undone.`)) {
      // 1. Delete images from storage
      if (product.image_url && product.image_url.length > 0) {
        const filePaths = product.image_url.map(url => {
          const parts = url.split('/product_images/');
          return parts[1];
        }).filter(Boolean);

        if (filePaths.length > 0) {
          const { error: storageError } = await supabase.storage.from('product_images').remove(filePaths);
          if (storageError) {
            console.error('Error deleting images from storage:', storageError);
            setError('Could not delete product images. Please try again.');
            return;
          }
        }
      }
      
      // 2. Delete product from database
      const { error: dbError } = await supabase.from('products').delete().eq('id', product.id);

      if (dbError) {
        setError(dbError.message);
      } else {
        // 3. Refresh product list
        setProducts(products.filter(p => p.id !== product.id));
      }
    }
  };
  
  const totalQuantity = products.reduce((sum, p) => sum + p.quantity_left, 0);
  const totalSold = products.reduce((sum, p) => sum + p.quantity_sold, 0);

  return (
    <div>
      <Header user={session.user} />
      <main className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
                <h1 className="text-3xl font-bold text-brand-dark">Welcome, Seller!</h1>
                <p className="text-brand-dark/70 mt-1">Here's your product overview.</p>
            </div>
            <button
                onClick={() => setIsAddModalOpen(true)}
                className="w-full md:w-auto flex items-center justify-center gap-2 bg-brand-accent text-white font-bold py-3 px-6 rounded-lg shadow-lg hover:opacity-90 transition duration-300"
            >
                <PlusIcon />
                Add New Product
            </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-brand-cream p-6 rounded-xl shadow-md border border-brand-dark/5">
                <h3 className="text-brand-dark/70 text-sm font-medium">Total Products</h3>
                <p className="text-3xl font-bold text-brand-dark mt-1">{products.length}</p>
            </div>
             <div className="bg-brand-cream p-6 rounded-xl shadow-md border border-brand-dark/5">
                <h3 className="text-brand-dark/70 text-sm font-medium">Total Items in Stock</h3>
                <p className="text-3xl font-bold text-brand-dark mt-1">{totalQuantity}</p>
            </div>
             <div className="bg-brand-cream p-6 rounded-xl shadow-md border border-brand-dark/5">
                <h3 className="text-brand-dark/70 text-sm font-medium">Total Items Sold</h3>
                <p className="text-3xl font-bold text-brand-dark mt-1">{totalSold}</p>
            </div>
        </div>

        {loading ? (
          <div className="flex justify-center mt-16"><Spinner /></div>
        ) : error ? (
          <p className="text-center text-red-500">{error}</p>
        ) : (
          <ProductList products={products} onEdit={openEditModal} onDelete={handleDeleteProduct} />
        )}
      </main>
      <AddProductModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onProductAdded={handleProductAdded}
        userId={session.user.id}
      />
      {productToEdit && (
        <EditProductModal
            isOpen={isEditModalOpen}
            onClose={() => { setIsEditModalOpen(false); setProductToEdit(null); }}
            onProductEdited={handleProductEdited}
            userId={session.user.id}
            productToEdit={productToEdit}
        />
      )}
    </div>
  );
};

export default Dashboard;