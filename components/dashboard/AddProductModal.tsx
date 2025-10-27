import React, { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import Spinner from '../ui/Spinner';
import ImageCropModal from './ImageCropModal';

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProductAdded: () => void;
  userId: string;
}

interface ImageFile {
  id: string;
  file: File;
  preview: string;
}

const AddProductModal: React.FC<AddProductModalProps> = ({ isOpen, onClose, onProductAdded, userId }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [type, setType] = useState<'buy' | 'rent'>('buy');
  const [quantity, setQuantity] = useState(1);
  const [price, setPrice] = useState('');
  const [images, setImages] = useState<ImageFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const categoryRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [croppingImage, setCroppingImage] = useState<ImageFile | null>(null);

  const availableCategories = ["Books", "Tech and Gadgets", "Cycles, Bikes, etc", "Brand New", "Home & Kitchen Essentials", "Rent", "Other"];
  
  const MAX_FILE_SIZE = 12 * 1024 * 1024; // 12 MB
  const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp', 'image/svg+xml', 'image/tiff'];
  const MAX_IMAGE_COUNT = 5;


  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    if (!e.target.files) return;

    const files = Array.from(e.target.files);
    
    if (images.length + files.length > MAX_IMAGE_COUNT) {
      setError(`You can only upload a maximum of ${MAX_IMAGE_COUNT} images.`);
       if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    const newImageFiles: ImageFile[] = [];
    for (const file of files) {
      if (file.size > MAX_FILE_SIZE) {
        setError(`File "${file.name}" exceeds the 12 MB size limit.`);
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }
      if (!ALLOWED_MIME_TYPES.includes(file.type)) {
        setError(`File type for "${file.name}" is not supported.`);
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }
      newImageFiles.push({
        id: `${file.name}-${file.lastModified}-${Math.random()}`,
        file,
        preview: URL.createObjectURL(file)
      });
    }
    
    setImages(prev => [...prev, ...newImageFiles]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };
  
  const handleImageDelete = (id: string) => {
    setImages(prevImages => {
      const imageToDelete = prevImages.find(img => img.id === id);
      if (imageToDelete) {
        URL.revokeObjectURL(imageToDelete.preview);
      }
      return prevImages.filter(img => img.id !== id);
    });
  };

  const onCropComplete = (croppedFile: File) => {
    if (!croppingImage) return;

    setImages(prevImages => {
      return prevImages.map(img => {
        if (img.id === croppingImage.id) {
          URL.revokeObjectURL(img.preview); // Clean up old preview
          return {
            ...img,
            file: croppedFile,
            preview: URL.createObjectURL(croppedFile)
          };
        }
        return img;
      });
    });

    setCroppingImage(null);
  };


  const resetForm = useCallback(() => {
    setTitle('');
    setDescription('');
    setCategories([]);
    setIsCategoryOpen(false);
    setType('buy');
    setQuantity(1);
    setPrice('');
    images.forEach(img => URL.revokeObjectURL(img.preview));
    setImages([]);
    setError(null);
  }, [images]);

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
      images.forEach(img => URL.revokeObjectURL(img.preview));
    };
  }, [categoryRef, images]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim() || !description.trim() || quantity < 1 || !price || parseFloat(price) <= 0 || images.length === 0) {
      setError('Please fill all required fields.');
      return;
    }
    if (images.length === 0) {
      setError('Please upload at least one image.');
      return;
    }

    setLoading(true);

    try {
      const sanitizedTitle = title.trim().replace(/\s+/g, '_').replace(/[^\w-]/g, '');
      if (!sanitizedTitle) throw new Error("Product title is invalid.");

      const uploadPromises = images.map(async (imageFile, index) => {
        const fileExtension = imageFile.file.name.split('.').pop() || 'jpg';
        const fileName = `${userId}/${sanitizedTitle}/${Date.now()}_image_${index}.${fileExtension}`;

        const { data, error: uploadError } = await supabase.storage
          .from('product_images')
          .upload(fileName, imageFile.file);
          
        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('product_images')
          .getPublicUrl(data.path);
        
        return publicUrl;
      });
      
      const uploadedImageUrls = await Promise.all(uploadPromises);

      const productData = {
        user_id: userId,
        title,
        description,
        category: categories.length > 0 ? categories : null,
        type,
        quantity_left: quantity,
        price: parseFloat(price),
        image_url: uploadedImageUrls,
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
    <>
      <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center p-2 sm:p-4">
        <div className="bg-brand-light border border-brand-dark/10 rounded-2xl shadow-2xl w-full max-w-xl max-h-[95vh] flex flex-col">
          <div className="p-4 border-b border-brand-dark/10 flex justify-between items-center sticky top-0 bg-brand-light z-10">
            <h2 className="text-xl font-bold text-brand-dark">Add New Product</h2>
            <button onClick={handleClose} className="text-brand-dark/70 hover:text-brand-dark text-3xl leading-none">&times;</button>
          </div>
          <form id="add-product-form" onSubmit={handleSubmit} className="p-4 space-y-2 overflow-y-auto flex-grow">
            <div>
              <label htmlFor="title" className="text-brand-dark/70 text-xs font-medium mb-1 block">Product Title <span className="text-red-500">*</span></label>
              <input id="title" type="text" placeholder="ex: Apple Airpods Pro MagChase Charger" value={title} onChange={e => setTitle(e.target.value)} className="w-full bg-white text-brand-dark px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-accent text-sm" required />
            </div>
            
            <div>
              <label htmlFor="description" className="text-brand-dark/70 text-xs font-medium mb-1 block">Product Description <span className="text-red-500">*</span></label>
              <textarea id="description" placeholder="ex: Mint Condition, Small size, etc" value={description} onChange={e => setDescription(e.target.value)} className="w-full bg-white text-brand-dark px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-accent text-sm" rows={2} required></textarea>
            </div>
            
            <div className="relative" ref={categoryRef}>
              <label htmlFor="categories-button" className="text-brand-dark/70 text-xs font-medium mb-1 block">Product Categories (strongly recommended)</label>
              <button id="categories-button" type="button" onClick={() => setIsCategoryOpen(!isCategoryOpen)} className="w-full bg-white px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-accent text-left flex justify-between items-center text-sm">
                <span className={`truncate ${categories.length > 0 ? 'text-brand-dark' : 'text-gray-400'}`}>
                  {categories.length > 0 ? categories.join(', ') : 'Select categories'}
                </span>
                <svg className={`w-4 h-4 transition-transform flex-shrink-0 ${isCategoryOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
              </button>
              {isCategoryOpen && (
                <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  {availableCategories.map(cat => (
                    <label key={cat} className="flex items-center px-3 py-2 hover:bg-gray-100 cursor-pointer">
                      <input type="checkbox" checked={categories.includes(cat)} onChange={() => handleCategoryChange(cat)} className="h-4 w-4 rounded border-gray-300 text-brand-accent focus:ring-brand-accent" />
                      <span className="ml-2 text-brand-dark text-sm">{cat}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-3">
                <div className="col-span-1">
                    <label className="text-brand-dark/70 text-xs font-medium mb-1 block">Type <span className="text-red-500">*</span></label>
                    <div className="flex bg-brand-cream border border-brand-dark/20 rounded-lg p-0.5">
                        <button type="button" onClick={() => setType('buy')} className={`w-1/2 py-1.5 rounded-md text-xs font-medium transition ${type === 'buy' ? 'bg-brand-accent text-white shadow' : 'text-brand-dark/80'}`}>Buy</button>
                        <button type="button" onClick={() => setType('rent')} className={`w-1/2 py-1.5 rounded-md text-xs font-medium transition ${type === 'rent' ? 'bg-brand-accent text-white shadow' : 'text-brand-dark/80'}`}>Rent</button>
                    </div>
                </div>
                <div className="col-span-1">
                    <label htmlFor="quantity" className="text-brand-dark/70 text-xs font-medium mb-1 block">Quantity <span className="text-red-500">*</span></label>
                    <input id="quantity" type="number" placeholder="e.g. 5" value={quantity} onChange={e => setQuantity(Math.max(1, parseInt(e.target.value) || 1))} className="w-full bg-white text-brand-dark px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-accent text-sm" min="1" required />
                </div>
            </div>

            <div>
              <label htmlFor="price" className="text-brand-dark/70 text-xs font-medium mb-1 block">Price (₹) <span className="text-red-500">*</span></label>
              <input id="price" type="number" placeholder="e.g. 1500" value={price} onChange={e => setPrice(e.target.value)} onKeyDown={(e) => { if (e.key === '.') e.preventDefault(); }} className="w-full bg-white text-brand-dark px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-accent text-sm" step="10" min="0" required />
            </div>

            <div>
              <label className="text-brand-dark/70 text-xs font-medium mb-1 block">Images (up to 5) <span className="text-red-500">*</span></label>
              <input ref={fileInputRef} type="file" onChange={handleImageChange} multiple accept="image/jpeg,image/png,image/gif,image/webp,image/bmp,image/svg+xml,image/tiff" className="w-full text-xs text-brand-dark/70 file:mr-2 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-brand-accent file:text-white hover:file:opacity-90 cursor-pointer" />
              <p className="text-xs text-brand-dark/60 mt-1">Max 12 MB per image. Allowed types: JPG, PNG, GIF, etc.</p>
              {images.length > 0 && (
                  <div className="mt-2 grid grid-cols-3 sm:grid-cols-5 gap-2">
                      {images.map((image) => (
                        <div key={image.id} className="relative group">
                           <img src={image.preview} alt="Preview" className="w-full h-20 sm:h-24 object-cover rounded-lg" />
                           <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-60 transition-all duration-300 rounded-lg flex items-center justify-center gap-1">
                              <button type="button" onClick={() => setCroppingImage(image)} className="text-white opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-full hover:bg-white/20" title="Crop Image">
                                 <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6.13 1L6 16a2 2 0 0 0 2 2h15"></path><path d="M1 6.13L16 6a2 2 0 0 1 2 2v15"></path></svg>
                              </button>
                              <button type="button" onClick={() => handleImageDelete(image.id)} className="text-white opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-full hover:bg-white/20" title="Delete Image">
                                  <svg xmlns="http://www.w.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                              </button>
                           </div>
                        </div>
                      ))}
                  </div>
              )}
            </div>
            
            {error && <p className="text-red-500 text-xs text-center py-1">{error}</p>}
          </form>
          <div className="p-3 border-t border-brand-dark/10 flex justify-end gap-3 sticky bottom-0 bg-brand-light">
              <button type="button" onClick={handleClose} className="bg-gray-200 text-gray-800 font-bold py-2 px-5 rounded-lg hover:bg-gray-300 transition text-sm">Cancel</button>
              <button type="submit" form="add-product-form" disabled={loading} className="bg-brand-accent text-white font-bold py-2 px-5 rounded-lg shadow-lg hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center min-w-[100px] text-sm">
                {loading ? <Spinner /> : 'Add Product'}
              </button>
          </div>
        </div>
      </div>
      {croppingImage && (
        <ImageCropModal 
          imageSrc={croppingImage.preview}
          onClose={() => setCroppingImage(null)}
          onCropComplete={onCropComplete}
        />
      )}
    </>
  );
};

export default AddProductModal;
