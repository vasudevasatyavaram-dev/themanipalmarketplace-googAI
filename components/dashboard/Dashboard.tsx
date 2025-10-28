import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../services/supabase';
import type { Session } from '@supabase/supabase-js';
import type { Product } from '../../types';
import Header from '../layout/Header';
import Footer from '../layout/Footer';
import AddProductModal from './AddProductModal';
import EditProductModal from './EditProductModal';
import VersionHistoryModal from './VersionHistoryModal';
import ProfileModal from './ProfileModal';
import ProductList from './ProductList';
import Spinner from '../ui/Spinner';
import Analytics from './Analytics';
import BestPractices from './BestPractices';

interface DashboardProps {
  session: Session;
}

const PlusIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
);
const PackageIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-brand-accent/70"><path d="M16.5 9.4a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0z"></path><path d="M12 15v8"></path><path d="M12 2v2.4"></path><path d="m16.2 7.8 1.4-1.4"></path><path d="m6.4 6.4 1.4 1.4"></path></svg>);
const InventoryIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-brand-accent/70"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>);
const SalesIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-brand-accent/70"><path d="M12 2v2"></path><path d="M12 20v2"></path><path d="M4.93 4.93l1.41 1.41"></path><path d="M17.66 17.66l1.41 1.41"></path><path d="M2 12h2"></path><path d="M20 12h2"></path><path d="M6.34 17.66l-1.41 1.41"></path><path d="M19.07 4.93l-1.41 1.41"></path><circle cx="12" cy="12" r="4"></circle></svg>);

type View = 'dashboard' | 'best_practices';

const Dashboard: React.FC<DashboardProps> = ({ session }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);
  const [productForHistory, setProductForHistory] = useState<Product | null>(null);
  const [notification, setNotification] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<View>('dashboard');

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.rpc('get_latest_products_for_user', {
      p_user_id: session.user.id
    });

    if (error) {
      setError(error.message);
    } else if (data) {
      setProducts(data as Product[]);
    }
    setLoading(false);
  }, [session.user.id]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    const isAnyModalOpen = isAddModalOpen || isEditModalOpen || isHistoryModalOpen || isProfileModalOpen;
    if (isAnyModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isAddModalOpen, isEditModalOpen, isHistoryModalOpen, isProfileModalOpen]);

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
  
  const handleHistoryReverted = () => {
    fetchProducts();
    setIsHistoryModalOpen(false);
    setProductForHistory(null);
  };

  const openEditModal = (product: Product) => {
    setProductToEdit(product);
    setIsEditModalOpen(true);
  };
  
  const openHistoryModal = (product: Product) => {
    setProductForHistory(product);
    setIsHistoryModalOpen(true);
  };

  const handleDeleteProduct = async (product: Product) => {
    if (window.confirm(`Are you sure you want to delete all versions of "${product.title}"? This action cannot be undone.`)) {
      const { data: allVersions, error: fetchError } = await supabase
        .from('products')
        .select('image_url')
        .eq('product_group_id', product.product_group_id);

      if (fetchError) {
        setError(fetchError.message);
        return;
      }
      
      const allImageUrls = allVersions?.flatMap(p => p.image_url) ?? [];
      if (allImageUrls.length > 0) {
        const uniqueUrls = [...new Set(allImageUrls)];
        // FIX: Cast `url` to string to resolve 'unknown' type error.
        const filePaths = uniqueUrls.map(url => (url as string).split('/product_images/')[1]).filter(Boolean);

        if (filePaths.length > 0) {
          const { error: storageError } = await supabase.storage.from('product_images').remove(filePaths);
          if (storageError) {
            console.error('Error deleting images from storage:', storageError);
            setError('Could not delete product images. Please try again.');
            return;
          }
        }
      }
      
      const { error: dbError } = await supabase
        .from('products')
        .delete()
        .eq('product_group_id', product.product_group_id);

      if (dbError) {
        setError(dbError.message);
      } else {
        setProducts(products.filter(p => p.product_group_id !== product.product_group_id));
      }
    }
  };
  
  const totalQuantity = products
    .filter(p => p.approval_status !== 'rejected')
    .reduce((sum, p) => sum + p.quantity_left, 0);

  const totalSold = products.reduce((sum, p) => sum + p.quantity_sold, 0);

  return (
    <div className="flex flex-col min-h-screen">
      <Header 
        user={session.user} 
        onOpenProfile={() => setIsProfileModalOpen(true)}
        onNavigate={setCurrentView} 
      />
      <main className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto flex-grow w-full">
        {currentView === 'dashboard' && (
            <div className="animate-fade-in">
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
                <>
                  <ProductList products={products} onEdit={openEditModal} onDelete={handleDeleteProduct} onHistory={openHistoryModal} />
                  <Analytics products={products} onNavigate={setCurrentView} />
                </>
              )}
            </div>
        )}
        {currentView === 'best_practices' && (
          <BestPractices onNavigate={setCurrentView} />
        )}
      </main>
      <Footer />
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
      {productForHistory && (
        <VersionHistoryModal
            isOpen={isHistoryModalOpen}
            onClose={() => { setIsHistoryModalOpen(false); setProductForHistory(null); }}
            product={productForHistory}
            onReverted={handleHistoryReverted}
        />
      )}
      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        session={session}
      />
    </div>
  );
};

export default Dashboard;
