import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../services/supabase';
import type { Session } from '@supabase/supabase-js';
import type { Product } from '../../types';
import Header from '../layout/Header';
import AddProductModal from './AddProductModal';
import ProductList from './ProductList';
import Spinner from '../ui/Spinner';

interface DashboardProps {
  session: Session;
}

const PlusIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
);

const Dashboard: React.FC<DashboardProps> = ({ session }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase!
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
    setIsModalOpen(false);
  };
  
  const totalQuantity = products.reduce((sum, p) => sum + p.quantity_left, 0);
  const totalSold = products.reduce((sum, p) => sum + p.quantity_sold, 0);

  return (
    <div className="min-h-screen bg-brand-dark">
      <Header user={session.user} />
      <main className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
                <h1 className="text-3xl font-bold text-brand-cream">Welcome, Seller!</h1>
                <p className="text-brand-light/70 mt-1">Here's your product overview.</p>
            </div>
            <button
                onClick={() => setIsModalOpen(true)}
                className="w-full md:w-auto flex items-center justify-center gap-2 bg-brand-accent text-white font-bold py-3 px-6 rounded-lg shadow-lg hover:opacity-90 transition duration-300"
            >
                <PlusIcon />
                Add New Product
            </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-black/20 p-6 rounded-xl shadow-lg">
                <h3 className="text-brand-light/70 text-sm font-medium">Total Products</h3>
                <p className="text-3xl font-bold text-brand-cream mt-1">{products.length}</p>
            </div>
             <div className="bg-black/20 p-6 rounded-xl shadow-lg">
                <h3 className="text-brand-light/70 text-sm font-medium">Total Items in Stock</h3>
                <p className="text-3xl font-bold text-brand-cream mt-1">{totalQuantity}</p>
            </div>
             <div className="bg-black/20 p-6 rounded-xl shadow-lg">
                <h3 className="text-brand-light/70 text-sm font-medium">Total Items Sold</h3>
                <p className="text-3xl font-bold text-brand-cream mt-1">{totalSold}</p>
            </div>
        </div>

        {loading ? (
          <div className="flex justify-center mt-16"><Spinner /></div>
        ) : error ? (
          <p className="text-center text-red-500">{error}</p>
        ) : (
          <ProductList products={products} />
        )}
      </main>
      <AddProductModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onProductAdded={handleProductAdded}
        userId={session.user.id}
      />
    </div>
  );
};

export default Dashboard;