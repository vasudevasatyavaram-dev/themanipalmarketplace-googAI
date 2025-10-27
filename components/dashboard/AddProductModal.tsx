import React, { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import Spinner from '../ui/Spinner';

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProductAdded: () => void;
  userId: string;
}

const AddProductModal: React.FC<AddProductModalProps> = ({ isOpen, onClose, onProductAdded, userId }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [type, setType] = useState<'buy' | 'rent'>('buy');
  const [quantity, setQuantity] = useState(1);
  const [price, setPrice] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const categoryRef = useRef<HTMLDivElement>(null);

  const availableCategories = ["Books", "Tech and Gadgets", "Cycles, Bikes, etc", "Brand New", "Home & Kitchen Essentials", "Rent", "Other"];

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setImages(filesArray);
      
      const previews = filesArray.map(file => URL.createObjectURL(file as Blob));
      setImagePreviews(previews);
    }
  };

  const resetForm = useCallback(() => {
    setTitle('');
    setDescription('');
    setCategories([]);
    setIsCategoryOpen(false);
    setType('buy');
    setQuantity(1);
    setPrice('');
    setImages([]);
    setImagePreviews([]);
    setError(null);
  }, []);

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleCategoryChange = (selectedCategory: string) => {
    setCategories(prev => 
      prev.includes(selectedCategory)
        ? prev.filter(c => c !== selectedCategory)
        : [...prev, selectedCategory]
    );
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (categoryRef.current && !categoryRef.current.contains(event.target as Node)) {
        setIsCategoryOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [categoryRef]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (images.length === 0) {
        setError('Please upload at least one image.');
        return;
    }
    setLoading(true);
    setError(null);

    try {
      const imageUrls: string[] = [];
      const uploadPromises = images.map(async (file) => {
        const fileName = `${userId}/${Date.now()}-${file.name}`;
        const { data, error: uploadError } = await supabase.storage
          .from('products')
          .upload(fileName, file);
          
        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('products')
          .getPublicUrl(data.path);
        
        return publicUrl;
      });
      
      imageUrls.push(...await Promise.all(uploadPromises));

      const productData = {
        user_id: userId,
        title,
        description,
        category: categories,
        type,
        quantity_left: quantity,
        price: parseInt(price, 10),
        image_urls: imageUrls,
      };

      const { error: insertError } = await supabase.from('products').insert(productData);

      if (insertError) throw insertError;

      onProductAdded();
      handleClose();

    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center p-4">
      <div className="bg-brand-light border border-brand-dark/10 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-brand-dark/10 flex justify-between items-center sticky top-0 bg-brand-light z-10">
          <h2 className="text-2xl font-bold text-brand-dark">Add a New Product</h2>
          <button onClick={handleClose} className="text-brand-dark/70 hover:text-brand-dark text-3xl">&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label htmlFor="title" className="text-brand-dark/70 text-sm mb-1 block">Product Title</label>
            <input id="title" type="text" placeholder="ex: Apple Airpods Pro MagChase Charger" value={title} onChange={e => setTitle(e.target.value)} className="w-full bg-white text-brand-dark p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-accent" required />
          </div>
          
          <div>
            <label htmlFor="description" className="text-brand-dark/70 text-sm mb-1 block">Product Description</label>
            <textarea id="description" placeholder="ex: Mint Condition, Small size, Dove white color, Original price was 5000, etc" value={description} onChange={e => setDescription(e.target.value)} className="w-full bg-white text-brand-dark p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-accent" rows={4} required></textarea>
          </div>
          
          <div className="relative" ref={categoryRef}>
            <label htmlFor="categories-button" className="text-brand-dark/70 text-sm mb-1 block">Categories (Strongly Recommended)</label>
            <button id="categories-button" type="button" onClick={() => setIsCategoryOpen(!isCategoryOpen)} className="w-full bg-white p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-accent text-left flex justify-between items-center">
              <span className={`truncate ${categories.length > 0 ? 'text-brand-dark' : 'text-gray-400'}`}>
                {categories.length > 0 ? categories.join(', ') : 'Select categories'}
              </span>
              <svg className={`w-5 h-5 transition-transform flex-shrink-0 ${isCategoryOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
            </button>
            {isCategoryOpen && (
              <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {availableCategories.map(cat => (
                  <label key={cat} className="flex items-center px-4 py-2 hover:bg-gray-100 cursor-pointer">
                    <input type="checkbox" checked={categories.includes(cat)} onChange={() => handleCategoryChange(cat)} className="h-4 w-4 rounded border-gray-300 text-brand-accent focus:ring-brand-accent" />
                    <span className="ml-3 text-brand-dark text-sm">{cat}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                  <label className="text-brand-dark/70 text-sm mb-1 block">Type</label>
                  <div className="flex bg-brand-cream border border-brand-dark/20 rounded-lg p-1">
                      <button type="button" onClick={() => setType('buy')} className={`w-1/2 py-2 rounded-md text-sm font-medium transition ${type === 'buy' ? 'bg-brand-accent text-white shadow' : 'text-brand-dark/80'}`}>Buy</button>
                      <button type="button" onClick={() => setType('rent')} className={`w-1/2 py-2 rounded-md text-sm font-medium transition ${type === 'rent' ? 'bg-brand-accent text-white shadow' : 'text-brand-dark/80'}`}>Rent</button>
                  </div>
              </div>
              <div className="flex-1">
                  <label htmlFor="quantity" className="text-brand-dark/70 text-sm mb-1 block">Quantity</label>
                  <input id="quantity" type="number" placeholder="e.g. 5" value={quantity} onChange={e => setQuantity(Math.max(1, parseInt(e.target.value) || 1))} className="w-full bg-white text-brand-dark p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-accent" min="1" required />
              </div>
          </div>

          <div>
             <label htmlFor="price" className="text-brand-dark/70 text-sm mb-1 block">Price (₹)</label>
             <input id="price" type="number" placeholder="Enter Price" value={price} onChange={e => setPrice(e.target.value)} onKeyDown={(e) => { if (e.key === '.') e.preventDefault(); }} className="w-full bg-white text-brand-dark p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-accent" step="10" min="0" required />
          </div>

          <div>
            <label className="text-brand-dark/70 text-sm mb-1 block">Images</label>
            <input type="file" onChange={handleImageChange} multiple accept="image/*" className="w-full text-sm text-brand-dark/70 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-brand-accent file:text-white hover:file:opacity-90 cursor-pointer" required />
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-4">
                {imagePreviews.map((src, index) => <img key={index} src={src} alt="Preview" className="w-full h-24 object-cover rounded-lg" />)}
            </div>
          </div>
          
          {error && <p className="text-red-500 text-sm">{error}</p>}

          <div className="pt-4 flex justify-end gap-4 sticky bottom-0 bg-brand-light pb-6 px-6 -mx-6">
            <button type="button" onClick={handleClose} className="bg-gray-200 text-gray-800 font-bold py-3 px-6 rounded-lg hover:bg-gray-300 transition">Cancel</button>
            <button type="submit" disabled={loading} className="bg-brand-accent text-white font-bold py-3 px-6 rounded-lg shadow-lg hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center min-w-[120px]">
              {loading ? <Spinner /> : 'Add Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddProductModal;