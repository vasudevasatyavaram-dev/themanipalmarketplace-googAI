import React, { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import type { Product } from '../../types';
import Spinner from '../ui/Spinner';
import ImageCropModal from './ImageCropModal';

interface EditProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProductEdited: () => void;
  userId: string;
  productToEdit: Product;
}

interface ImageFile {
  id: string;
  file: File;
  preview: string;
}

interface ExistingImage {
    id: string;
    url: string;
}

const EditProductModal: React.FC<EditProductModalProps> = ({ isOpen, onClose, onProductEdited, userId, productToEdit }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [type, setType] = useState<'buy' | 'rent'>('buy');
  const [quantity, setQuantity] = useState(1);
  const [price, setPrice] = useState('');
  
  const [newImages, setNewImages] = useState<ImageFile[]>([]);
  const [existingImages, setExistingImages] = useState<ExistingImage[]>([]);
  const [imagesToDelete, setImagesToDelete] = useState<string[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const categoryRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const [croppingImage, setCroppingImage] = useState<ImageFile | null>(null);

  const [isDirty, setIsDirty] = useState(false);
  // Fix: The previous type `Partial<Product> & { price: string; ... }` created a conflict for the `price` property (`number` vs `string`), resulting in a `never` type that caused downstream errors. This explicit type correctly defines the shape of the initial form state.
  const initialProductState = useRef<{ title: string; description: string; category: string[]; type: "buy" | "rent"; quantity_left: number; price: string; } | null>(null);

  useEffect(() => {
    if (productToEdit) {
        setTitle(productToEdit.title);
        setDescription(productToEdit.description);
        setCategories(productToEdit.category || []);
        setType(productToEdit.type as 'buy' | 'rent');
        setQuantity(productToEdit.quantity_left);
        setPrice(String(productToEdit.price));
        setExistingImages(productToEdit.image_url.map((url, index) => ({ id: `existing-${index}-${url}`, url })));
        
        // Store initial state for dirty check
        initialProductState.current = {
            title: productToEdit.title,
            description: productToEdit.description,
            category: productToEdit.category || [],
            type: productToEdit.type as 'buy' | 'rent',
            quantity_left: productToEdit.quantity_left,
            price: String(productToEdit.price),
        };
        
        setNewImages([]);
        setImagesToDelete([]);
        setError(null);
        setIsDirty(false);
    }
  }, [productToEdit]);

  useEffect(() => {
    if (!productToEdit || !initialProductState.current) return;

    const sortedCategories = [...categories].sort();
    const sortedInitialCategories = [...initialProductState.current.category].sort();

    const hasChanged = 
      title !== initialProductState.current.title ||
      description !== initialProductState.current.description ||
      quantity !== initialProductState.current.quantity_left ||
      price !== initialProductState.current.price ||
      type !== initialProductState.current.type ||
      JSON.stringify(sortedCategories) !== JSON.stringify(sortedInitialCategories) ||
      newImages.length > 0 ||
      imagesToDelete.length > 0;
    
    setIsDirty(hasChanged);

  }, [title, description, categories, type, quantity, price, newImages, imagesToDelete, productToEdit]);


  const availableCategories = ["Books", "Tech and Gadgets", "Cycles, Bikes, etc", "Brand New", "Home & Kitchen Essentials", "Rent", "Other"];
  
  const MAX_FILE_SIZE = 12 * 1024 * 1024; // 12 MB
  const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp', 'image/svg+xml', 'image/tiff'];
  const MAX_IMAGE_COUNT = 5;

  const handleFiles = (files: File[]) => {
    setError(null);
    if (existingImages.length + newImages.length + files.length > MAX_IMAGE_COUNT) {
      setError(`You can only have a maximum of ${MAX_IMAGE_COUNT} images in total.`);
      return;
    }
     const newImageFiles: ImageFile[] = [];
    for (const file of files) {
      if (file.size > MAX_FILE_SIZE) {
        setError(`File "${file.name}" exceeds the 12 MB size limit.`);
        return;
      }
      if (!ALLOWED_MIME_TYPES.includes(file.type)) {
        setError(`File type for "${file.name}" is not supported.`);
        return;
      }
      newImageFiles.push({
        id: `${file.name}-${file.lastModified}-${Math.random()}`,
        file,
        preview: URL.createObjectURL(file)
      });
    }
    setNewImages(prev => [...prev, ...newImageFiles]);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(Array.from(e.target.files));
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDragEnter = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); };
  const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); };
  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(Array.from(e.dataTransfer.files));
      e.dataTransfer.clearData();
    }
  };
  
  const handleNewImageDelete = (id: string) => {
    setNewImages(prev => {
        const imageToDelete = prev.find(img => img.id === id);
        if (imageToDelete) URL.revokeObjectURL(imageToDelete.preview);
        return prev.filter(img => img.id !== id);
    });
  };

  const handleExistingImageDelete = (id: string, url: string) => {
    setExistingImages(prev => prev.filter(img => img.id !== id));
    setImagesToDelete(prev => [...prev, url]);
  };

  const onCropComplete = (croppedFile: File) => {
    if (!croppingImage) return;
    setNewImages(prev => prev.map(img => {
        if (img.id === croppingImage.id) {
          URL.revokeObjectURL(img.preview);
          return { ...img, file: croppedFile, preview: URL.createObjectURL(croppedFile) };
        }
        return img;
      })
    );
    setCroppingImage(null);
  };

  const handleClose = () => {
    newImages.forEach(img => URL.revokeObjectURL(img.preview));
    onClose();
  };
  
  const handleCategoryChange = (selectedCategory: string) => {
    setCategories(prev => prev.includes(selectedCategory) ? prev.filter(c => c !== selectedCategory) : [...prev, selectedCategory]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (existingImages.length + newImages.length === 0) {
      setError('Please upload at least one image.');
      return;
    }
    
    setLoading(true);

    try {
      // 1. Delete images marked for deletion
      if (imagesToDelete.length > 0) {
        const filePaths = imagesToDelete.map(url => url.split('/product_images/')[1]).filter(Boolean);
        if (filePaths.length > 0) {
            const { error: deleteError } = await supabase.storage.from('product_images').remove(filePaths);
            if (deleteError) throw deleteError;
        }
      }

      // 2. Upload new images
      const sanitizedTitle = title.trim().replace(/\s+/g, '_').replace(/[^\w-]/g, '');
      const uploadPromises = newImages.map(async (imageFile, index) => {
        const fileExtension = imageFile.file.name.split('.').pop() || 'jpg';
        const fileName = `${userId}/${sanitizedTitle}/${Date.now()}_image_${index}.${fileExtension}`;
        const { data, error: uploadError } = await supabase.storage.from('product_images').upload(fileName, imageFile.file);
        if (uploadError) throw uploadError;
        return supabase.storage.from('product_images').getPublicUrl(data.path).data.publicUrl;
      });
      const newImageUrls = await Promise.all(uploadPromises);
      
      // 3. Update product data
      const finalImageUrls = [...existingImages.map(img => img.url), ...newImageUrls];
      
      const productUpdateData = {
        title,
        description,
        category: categories.length > 0 ? categories : null,
        type,
        quantity_left: quantity,
        price: parseFloat(price),
        image_url: finalImageUrls,
        edit_count: productToEdit.edit_count + 1,
      };

      const { error: updateError } = await supabase.from('products').update(productUpdateData).eq('id', productToEdit.id);
      if (updateError) throw updateError;
      
      onProductEdited();
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
          <div className="p-4 border-b border-brand-dark/10 flex justify-between items-center">
            <h2 className="text-xl font-bold text-brand-dark">Edit Product</h2>
            <button onClick={handleClose} className="text-brand-dark/70 hover:text-brand-dark text-3xl leading-none">&times;</button>
          </div>
          <form id="edit-product-form" onSubmit={handleSubmit} className="p-4 space-y-2 overflow-y-auto flex-grow">
            {/* Form fields are identical to AddProductModal, just using state initialized from productToEdit */}
            <div>
              <label htmlFor="title-edit" className="text-brand-dark/70 text-xs font-medium mb-1 block">Product Title <span className="text-red-500">*</span></label>
              <input id="title-edit" type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full bg-white text-brand-dark px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-accent text-sm" required />
            </div>
            <div>
              <label htmlFor="description-edit" className="text-brand-dark/70 text-xs font-medium mb-1 block">Product Description <span className="text-red-500">*</span></label>
              <textarea id="description-edit" value={description} onChange={e => setDescription(e.target.value)} className="w-full bg-white text-brand-dark px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-accent text-sm" rows={2} required></textarea>
            </div>
             <div className="relative" ref={categoryRef}>
                <label className="text-brand-dark/70 text-xs font-medium mb-1 block">Product Categories</label>
                <button type="button" onClick={() => setIsCategoryOpen(!isCategoryOpen)} className="w-full bg-white px-3 py-2 rounded-lg border border-gray-300 text-left flex justify-between items-center text-sm">
                    <span className={`truncate ${categories.length > 0 ? 'text-brand-dark' : 'text-gray-400'}`}>{categories.length > 0 ? categories.join(', ') : 'Select categories'}</span>
                    <svg className={`w-4 h-4 transition-transform ${isCategoryOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
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
                <div>
                    <label className="text-brand-dark/70 text-xs font-medium mb-1 block">Type <span className="text-red-500">*</span></label>
                    <div className="flex bg-brand-cream border border-brand-dark/20 rounded-lg p-0.5">
                        <button type="button" onClick={() => setType('buy')} className={`w-1/2 py-1.5 rounded-md text-xs font-medium transition ${type === 'buy' ? 'bg-brand-accent text-white shadow' : 'text-brand-dark/80'}`}>Buy</button>
                        <button type="button" onClick={() => setType('rent')} className={`w-1/2 py-1.5 rounded-md text-xs font-medium transition ${type === 'rent' ? 'bg-brand-accent text-white shadow' : 'text-brand-dark/80'}`}>Rent</button>
                    </div>
                </div>
                <div>
                    <label htmlFor="quantity-edit" className="text-brand-dark/70 text-xs font-medium mb-1 block">Quantity <span className="text-red-500">*</span></label>
                    <input id="quantity-edit" type="number" value={quantity} onChange={e => setQuantity(Math.max(1, parseInt(e.target.value) || 1))} className="w-full bg-white text-brand-dark px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-accent text-sm" min="1" required />
                </div>
            </div>
            <div>
              <label htmlFor="price-edit" className="text-brand-dark/70 text-xs font-medium mb-1 block">Price (₹) <span className="text-red-500">*</span></label>
              <input id="price-edit" type="number" value={price} onChange={e => setPrice(e.target.value)} className="w-full bg-white text-brand-dark px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-accent text-sm" min="0" required />
            </div>
            <div
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                className={`p-3 border-2 border-dashed rounded-lg transition-colors ${isDragging ? 'border-brand-accent bg-brand-accent/10' : 'border-gray-300'}`}
            >
              <label className="text-brand-dark/70 text-xs font-medium mb-2 block">Images (up to 5) <span className="text-red-500">*</span></label>
              <div className="text-center">
                  <p className="text-xs text-brand-dark/60 mb-2">Drag & drop new images here, or click to browse</p>
                  <input ref={fileInputRef} type="file" onChange={handleImageChange} multiple accept="image/*" className="w-full text-xs text-brand-dark/70 file:mr-2 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-brand-accent file:text-white hover:file:opacity-90 cursor-pointer" />
              </div>
              <p className="text-xs text-brand-dark/60 mt-1 text-center">Max 12 MB per image.</p>
               <div className="mt-2 grid grid-cols-3 sm:grid-cols-5 gap-2">
                    {existingImages.map((image) => (
                        <div key={image.id} className="relative group">
                           <img src={image.url} alt="Existing product" className="w-full h-20 sm:h-24 object-cover rounded-lg" />
                           <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-60 transition-all duration-300 rounded-lg flex items-center justify-center">
                              <button type="button" onClick={() => handleExistingImageDelete(image.id, image.url)} className="text-white opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-full hover:bg-white/20" title="Delete Image">
                                 <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                              </button>
                           </div>
                        </div>
                    ))}
                    {newImages.map((image) => (
                        <div key={image.id} className="relative group">
                           <img src={image.preview} alt="New preview" className="w-full h-20 sm:h-24 object-cover rounded-lg" />
                           <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-60 transition-all duration-300 rounded-lg flex items-center justify-center gap-1">
                              <button type="button" onClick={() => setCroppingImage(image)} className="text-white opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-full hover:bg-white/20" title="Crop Image"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6.13 1L6 16a2 2 0 0 0 2 2h15"></path><path d="M1 6.13L16 6a2 2 0 0 1 2 2v15"></path></svg></button>
                              <button type="button" onClick={() => handleNewImageDelete(image.id)} className="text-white opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-full hover:bg-white/20" title="Delete Image"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg></button>
                           </div>
                        </div>
                    ))}
                </div>
            </div>
            {error && <p className="text-red-500 text-xs text-center py-1">{error}</p>}
          </form>
          <div className="p-3 border-t border-brand-dark/10 flex justify-end gap-3">
              <button type="button" onClick={handleClose} className="bg-gray-200 text-gray-800 font-bold py-2 px-5 rounded-lg hover:bg-gray-300 transition text-sm">Cancel</button>
              <button type="submit" form="edit-product-form" disabled={loading || !isDirty} className="bg-brand-accent text-white font-bold py-2 px-5 rounded-lg shadow-lg hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center min-w-[120px] text-sm">
                {loading ? <Spinner /> : 'Save Changes'}
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

export default EditProductModal;