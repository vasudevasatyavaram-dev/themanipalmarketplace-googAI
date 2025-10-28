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
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
);
const PackageIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-brand-accent/70"><path d="M16.5 9.4a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0z"></path><path d="M12 15v8"></path><path d="M12 2v2.4"></path><path d="m16.2 7.8 1.4-1.4"></path><path d="m6.4 6.4 1.4 1.4"></path></svg>);
const InventoryIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-brand-accent/70"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>);
const SalesIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-brand-accent/70"><path d="M12 2v2"></path><path d="M12 20v2"></path><path d="M4.93 4.93l1.41 1.41"></path><path d="M17.66 17.66l1.41 1.41"></path><path d="M2 12h2"></path><path d="M20 12h2"></path><path d="M6.34 17.66l-1.41 1.41"></path><path d="M19.07 4.93l-1.41 1.41"></path><circle cx="12" cy="12" r="4"></circle></svg>);


const Dashboard: React.FC<DashboardProps> = ({ session }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

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
    const isFirstProduct = products.length === 0;
    fetchProducts();
    setIsAddModalOpen(false);

    if (isFirstProduct) {
        setNotification("Congratulations on listing your first product! You'll be notified on your verified phone number once it's approved.");
    } else {
        setNotification("Product listed successfully! You'll be notified on your verified phone number once it's approved.");
    }
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
  
  const totalQuantity = products
    .filter(p => p.approval_status !== 'rejected')
    .reduce((sum, p) => sum + p.quantity_left, 0);

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

        {notification && (
            <div className="mb-6 p-4 bg-green-100 text-green-800 border border-green-200 rounded-lg shadow-md flex justify-between items-center">
                <span>{notification}</span>
                <button onClick={() => setNotification(null)} className="text-green-800 hover:text-green-900 text-2xl leading-none font-bold">&times;</button>
            </div>
        )}
        
        <div className="flex overflow-x-auto md:grid md:grid-cols-3 gap-6 mb-8 pb-4 md:pb-0">
            <div className="bg-brand-cream p-6 rounded-xl shadow-md border border-brand-dark/10 flex-shrink-0 w-2/3 sm:w-1/2 md:w-auto">
                <div className="flex justify-between items-start">
                  <h3 className="text-brand-dark/70 text-sm font-medium">Total Products</h3>
                  <PackageIcon />
                </div>
                <p className="text-4xl font-bold text-brand-dark mt-2">{products.length}</p>
            </div>
             <div className="bg-brand-cream p-6 rounded-xl shadow-md border border-brand-dark/10 flex-shrink-0 w-2/3 sm:w-1/2 md:w-auto">
                <div className="flex justify-between items-start">
                    <h3 className="text-brand-dark/70 text-sm font-medium">Total Items in Stock</h3>
                    <InventoryIcon />
                </div>
                <p className="text-4xl font-bold text-brand-dark mt-2">{totalQuantity}</p>
            </div>
             <div className="bg-brand-cream p-6 rounded-xl shadow-md border border-brand-dark/10 flex-shrink-0 w-2/3 sm:w-1/2 md:w-auto">
                <div className="flex justify-between items-start">
                    <h3 className="text-brand-dark/70 text-sm font-medium">Total Items Sold</h3>
                    <SalesIcon />
                </div>
                <p className="text-4xl font-bold text-brand-dark mt-2">{totalSold}</p>
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