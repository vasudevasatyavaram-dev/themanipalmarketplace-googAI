
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
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const categoryRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const [filesToCrop, setFilesToCrop] = useState<File[]>([]);
  const [croppingImage, setCroppingImage] = useState<{ id: string; preview: string } | null>(null);

  const [isDirty, setIsDirty] = useState(false);
  const initialProductState = useRef<Partial<Product> & {image_urls_count: number} | null>(null);

  useEffect(() => {
    if (productToEdit) {
        setTitle(productToEdit.title);
        setDescription(productToEdit.description);
        setCategories(productToEdit.category || []);
        setType(productToEdit.type as 'buy' | 'rent');
        setQuantity(productToEdit.quantity_left);
        setPrice(String(productToEdit.price));
        setExistingImages(productToEdit.image_url.map((url, index) => ({ id: `existing-${index}-${url}`, url })));
        
        initialProductState.current = {
            title: productToEdit.title,
            description: productToEdit.description,
            category: productToEdit.category || [],
            type: productToEdit.type as 'buy' | 'rent',
            quantity_left: productToEdit.quantity_left,
            price: Number(productToEdit.price),
            image_urls_count: productToEdit.image_url.length,
        };
        
        newImages.forEach(img => URL.revokeObjectURL(img.preview));
        setNewImages([]);
        setFilesToCrop([]);
        setCroppingImage(null);
        setError(null);
        setIsDirty(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productToEdit]);

  useEffect(() => {
    if (!productToEdit || !initialProductState.current) return;

    const sortedCategories = [...categories].sort();
    const sortedInitialCategories = [...(initialProductState.current.category || [])].sort();

    const hasChanged = 
      title !== initialProductState.current.title ||
      description !== initialProductState.current.description ||
      quantity !== initialProductState.current.quantity_left ||
      price !== String(initialProductState.current.price) ||
      type !== initialProductState.current.type ||
      JSON.stringify(sortedCategories) !== JSON.stringify(sortedInitialCategories) ||
      (existingImages.length + newImages.length) !== initialProductState.current.image_urls_count;
    
    setIsDirty(hasChanged);

  }, [title, description, categories, type, quantity, price, newImages, existingImages, productToEdit]);


  const availableCategories = ["Books", "Tech and Gadgets", "Sports and Fitness", "Cycles, Bikes, etc", "Brand New", "Home & Kitchen Essentials", "Rent", "Other"];
  
  const MAX_FILE_SIZE = 12 * 1024 * 1024; // 12 MB
  const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp', 'image/svg+xml', 'image/tiff'];
  const MAX_IMAGE_COUNT = 5;

   useEffect(() => {
    if (!croppingImage && filesToCrop.length > 0) {
      const nextFile = filesToCrop[0];
      setCroppingImage({
        id: `${nextFile.name}-${nextFile.lastModified}`,
        preview: URL.createObjectURL(nextFile),
      });
    }
  }, [filesToCrop, croppingImage]);

  const handleFiles = (incomingFiles: File[]) => {
    setError(null);
    if (existingImages.length + newImages.length + filesToCrop.length + incomingFiles.length > MAX_IMAGE_COUNT) {
      setError(`You can only have a maximum of ${MAX_IMAGE_COUNT} images in total.`);
      return;
    }

    const validFiles: File[] = [];
    for (const file of incomingFiles) {
      if (file.size > MAX_FILE_SIZE) {
        setError(`File "${file.name}" exceeds the 12 MB size limit.`);
        return;
      }
      if (!ALLOWED_MIME_TYPES.includes(file.type)) {
        setError(`File type for "${file.name}" is not supported.`);
        return;
      }
      validFiles.push(file);
    }
    setFilesToCrop(prev => [...prev, ...validFiles]);
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

  const handleExistingImageDelete = (id: string) => {
    setExistingImages(prev => prev.filter(img => img.id !== id));
  };

  const onCropComplete = (croppedFile: File) => {
    if (!croppingImage) return;

    const newImage: ImageFile = {
      id: `${croppedFile.name}-${Date.now()}`,
      file: croppedFile,
      preview: URL.createObjectURL(croppedFile),
    };
    setNewImages(prev => [...prev, newImage]);

    URL.revokeObjectURL(croppingImage.preview);
    setCroppingImage(null);
    setFilesToCrop(prev => prev.slice(1));
  };

  const onCropCancel = () => {
    if (!croppingImage) return;
    URL.revokeObjectURL(croppingImage.preview);
    setCroppingImage(null);
    setFilesToCrop(prev => prev.slice(1));
  };

  const handleClose = () => {
    newImages.forEach(img => URL.revokeObjectURL(img.preview));
    onClose();
  };
  
  const handleCategoryChange = (selectedCategory: string) => {
    setCategories(prev => prev.includes(selectedCategory) ? prev.filter(c => c !== selectedCategory) : [...prev, selectedCategory]);
  };

  const handleAddBulletPoint = () => {
    const textarea = descriptionRef.current;
    if (!textarea) return;

    const { selectionStart, selectionEnd, value } = textarea;
    const newText = 
        value.substring(0, selectionStart) + 
        '• ' + 
        value.substring(selectionEnd);

    setDescription(newText);

    setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(selectionStart + 2, selectionStart + 2);
    }, 0);
  };

  const handleDescriptionKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        const textarea = e.currentTarget;
        const { value, selectionStart } = textarea;

        const lineStartIndex = value.lastIndexOf('\n', selectionStart - 1) + 1;
        const currentLine = value.substring(lineStartIndex, selectionStart);

        if (currentLine.trim().startsWith('•')) {
            e.preventDefault();

            if (currentLine.trim() === '•') {
                const textBefore = value.substring(0, lineStartIndex);
                const textAfter = value.substring(selectionStart);
                const newValue = textBefore + textAfter;
                setDescription(newValue);
                setTimeout(() => {
                    textarea.selectionStart = textarea.selectionEnd = lineStartIndex;
                }, 0);
            } else {
                const textBefore = value.substring(0, selectionStart);
                const textAfter = value.substring(selectionStart);
                const newValue = `${textBefore}\n• ${textAfter}`;
                setDescription(newValue);
                setTimeout(() => {
                    const newCursorPos = selectionStart + 3;
                    textarea.selectionStart = textarea.selectionEnd = newCursorPos;
                }, 0);
            }
        }
    }
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
      // Note: We don't delete old images because the old version might be reverted to.
      // A cleanup job could handle orphaned images later if needed.

      const sanitizedTitle = title.trim().replace(/\s+/g, '_').replace(/[^\w-]/g, '');
      const uploadPromises = newImages.map(async (imageFile, index) => {
        const fileExtension = imageFile.file.name.split('.').pop() || 'jpg';
        const fileName = `${userId}/${sanitizedTitle}/${Date.now()}_image_${index}.${fileExtension}`;
        const { data, error: uploadError } = await supabase.storage.from('product_images').upload(fileName, imageFile.file);
        if (uploadError) throw uploadError;
        return supabase.storage.from('product_images').getPublicUrl(data.path).data.publicUrl;
      });
      const newImageUrls = await Promise.all(uploadPromises);
      
      const finalImageUrls = [...existingImages.map(img => img.url), ...newImageUrls];
      
      // Create a new product entry for the new version
      const newProductVersion = {
        product_group_id: productToEdit.product_group_id, // Link to the original product
        user_id: userId,
        title,
        description,
        category: categories.length > 0 ? categories : null,
        type,
        quantity_left: quantity,
        price: parseFloat(price),
        image_url: finalImageUrls,
        edit_count: productToEdit.edit_count + 1,
        quantity_sold: productToEdit.quantity_sold, // Carry over sold count
        approval_status: 'pending', // Reset for re-approval
        product_status: 'available',
        reject_explanation: null,
      };

      const { error: insertError } = await supabase.from('products').insert(newProductVersion);
      if (insertError) throw insertError;
      
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
        <div className="bg-brand-light border border-brand-dark/10 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[95vh] flex flex-col">
          <div className="p-5 border-b border-brand-dark/10 flex justify-between items-center">
            <h2 className="text-2xl font-bold text-brand-dark">Edit Product (Version {productToEdit.edit_count + 1})</h2>
            <button onClick={handleClose} className="text-brand-dark/70 hover:text-brand-dark text-3xl leading-none">&times;</button>
          </div>
          <form id="edit-product-form" onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-grow">
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                className={`flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${isDragging ? 'border-brand-accent bg-brand-accent/10' : 'border-gray-300 hover:border-brand-accent/50'}`}
            >
              <input ref={fileInputRef} type="file" onChange={handleImageChange} multiple accept={ALLOWED_MIME_TYPES.join(',')} className="hidden" disabled={existingImages.length + newImages.length >= MAX_IMAGE_COUNT}/>
              <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-brand-accent/80 mb-2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
              <p className="text-brand-dark font-semibold">Drag & drop new images, or click to browse</p>
              <p className="text-xs text-brand-dark/60 mt-1">Add up to 5 images total. Max 12MB each.</p>
            </div>
               <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                    {existingImages.map((image) => (
                        <div key={image.id} className="relative group aspect-square">
                           <img src={image.url} alt="Existing product" className="w-full h-full object-cover rounded-lg" />
                           <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-60 transition-all duration-300 rounded-lg flex items-center justify-center">
                              <button type="button" onClick={() => handleExistingImageDelete(image.id)} className="text-white opacity-0 group-hover:opacity-100 transition-opacity p-2 rounded-full hover:bg-red-500/80" title="Delete Image">
                                 <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                              </button>
                           </div>
                        </div>
                    ))}
                    {newImages.map((image) => (
                        <div key={image.id} className="relative group aspect-square">
                           <img src={image.preview} alt="New preview" className="w-full h-full object-cover rounded-lg" />
                           <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-60 transition-all duration-300 rounded-lg flex items-center justify-center">
                              <button type="button" onClick={() => handleNewImageDelete(image.id)} className="text-white opacity-0 group-hover:opacity-100 transition-opacity p-2 rounded-full hover:bg-red-500/80" title="Delete Image"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg></button>
                           </div>
                        </div>
                    ))}
                </div>
            <div>
              <label htmlFor="title-edit" className="text-brand-dark/80 text-sm font-medium mb-1 block">Product Title <span className="text-red-500">*</span></label>
              <input id="title-edit" type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full bg-white text-brand-dark px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-accent/80" required />
            </div>
            <div>
              <div className="flex justify-between items-center mb-1">
                <label htmlFor="description-edit" className="text-brand-dark/80 text-sm font-medium">Product Description <span className="text-red-500">*</span></label>
                <button type="button" onClick={handleAddBulletPoint} className="text-xs font-semibold text-brand-accent hover:underline">Add Bullet Point</button>
              </div>
              <textarea ref={descriptionRef} id="description-edit" value={description} onChange={e => setDescription(e.target.value)} onKeyDown={handleDescriptionKeyDown} className="w-full bg-white text-brand-dark px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-accent/80" rows={3} required></textarea>
            </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div className="relative" ref={categoryRef}>
                  <label className="text-brand-dark/80 text-sm font-medium mb-1 block">Categories</label>
                  <button type="button" onClick={() => setIsCategoryOpen(!isCategoryOpen)} className="w-full bg-white px-4 py-2.5 rounded-lg border border-gray-300 text-left flex justify-between items-center">
                      <span className={`truncate ${categories.length > 0 ? 'text-brand-dark' : 'text-gray-400'}`}>{categories.length > 0 ? categories.join(', ') : 'Select categories'}</span>
                      <svg className={`w-5 h-5 transition-transform text-gray-500 ${isCategoryOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                  </button>
                  {isCategoryOpen && (
                  <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                      {availableCategories.map(cat => (
                      <label key={cat} className="flex items-center px-4 py-2.5 hover:bg-gray-100 cursor-pointer">
                          <input type="checkbox" checked={categories.includes(cat)} onChange={() => handleCategoryChange(cat)} className="h-4 w-4 rounded border-gray-300 text-brand-accent focus:ring-brand-accent" />
                          <span className="ml-3 text-brand-dark">{cat}</span>
                      </label>
                      ))}
                  </div>
                  )}
              </div>
              <div>
                    <label className="text-brand-dark/80 text-sm font-medium mb-1 block">Type <span className="text-red-500">*</span></label>
                    <div className="flex bg-brand-cream border border-brand-dark/20 rounded-lg p-1">
                        <button type="button" onClick={() => setType('buy')} className={`w-1/2 py-2 rounded-md font-medium transition ${type === 'buy' ? 'bg-brand-accent text-white shadow' : 'text-brand-dark/80 hover:bg-white/50'}`}>Buy</button>
                        <button type="button" onClick={() => setType('rent')} className={`w-1/2 py-2 rounded-md font-medium transition ${type === 'rent' ? 'bg-brand-accent text-white shadow' : 'text-brand-dark/80 hover:bg-white/50'}`}>Rent</button>
                    </div>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                  <label htmlFor="quantity-edit" className="text-brand-dark/80 text-sm font-medium mb-1 block">Quantity <span className="text-red-500">*</span></label>
                  <input id="quantity-edit" type="number" value={quantity} onChange={e => setQuantity(Math.max(1, parseInt(e.target.value) || 1))} className="w-full bg-white text-brand-dark px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-accent/80" min="1" required />
              </div>
              <div>
                <label htmlFor="price-edit" className="text-brand-dark/80 text-sm font-medium mb-1 block">Price (₹) <span className="text-red-500">*</span></label>
                <input id="price-edit" type="number" value={price} onChange={e => setPrice(e.target.value)} onKeyDown={(e) => { if (e.key === '.') e.preventDefault(); }} className="w-full bg-white text-brand-dark px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-accent/80" min="1" required />
              </div>
            </div>
            {error && <p className="text-red-500 text-sm text-center py-1">{error}</p>}
          </form>
          <div className="p-4 border-t border-brand-dark/10 flex justify-end gap-3">
              <button type="button" onClick={handleClose} className="bg-gray-200 text-gray-800 font-bold py-2.5 px-6 rounded-lg hover:bg-gray-300 transition">Cancel</button>
              <button type="submit" form="edit-product-form" disabled={loading || !isDirty} className="bg-brand-accent text-white font-bold py-2.5 px-6 rounded-lg shadow-lg hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center min-w-[140px]">
                {loading ? <Spinner /> : 'Save as New Version'}
              </button>
          </div>
        </div>
      </div>
       {croppingImage && (
        <ImageCropModal 
          imageSrc={croppingImage.preview}
          onClose={onCropCancel}
          onCropComplete={onCropComplete}
        />
      )}
    </>
  );
};

export default EditProductModal;