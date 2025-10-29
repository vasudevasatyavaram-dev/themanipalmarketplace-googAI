import React, { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import { v4 as uuidv4 } from 'uuid';
import Spinner from '../ui/Spinner';
import ImageCropModal from './ImageCropModal';
import { type Crop } from 'react-image-crop';
import { CroppedImage } from '../../types';

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProductAdded: () => void;
  userId: string;
}

const CropIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6.13 1L6 16a2 2 0 0 0 2 2h15"></path><path d="M1 6.13L16 6a2 2 0 0 1 2 2v15"></path></svg>
);

// Helper function to generate final cropped image from original file and percentage crop data
async function getCroppedFile(imageFile: File, percentCrop: Crop): Promise<File> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const imageUrl = URL.createObjectURL(imageFile);
    image.src = imageUrl;

    image.onload = () => {
      const canvas = document.createElement('canvas');
      
      const cropWidth = image.naturalWidth * (percentCrop.width / 100);
      const cropHeight = image.naturalHeight * (percentCrop.height / 100);

      if (cropWidth < 1 || cropHeight < 1) {
          URL.revokeObjectURL(imageUrl);
          return reject(new Error('Crop dimensions are too small.'));
      }

      canvas.width = cropWidth;
      canvas.height = cropHeight;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        URL.revokeObjectURL(imageUrl);
        return reject(new Error('Could not get canvas context.'));
      }

      ctx.drawImage(
        image,
        image.naturalWidth * (percentCrop.x / 100), // sx
        image.naturalHeight * (percentCrop.y / 100), // sy
        canvas.width, // sWidth
        canvas.height, // sHeight
        0, 0,
        canvas.width, canvas.height
      );
      
      URL.revokeObjectURL(imageUrl);

      canvas.toBlob(blob => {
        if (!blob) {
          return reject(new Error('Canvas is empty'));
        }
        resolve(new File([blob], imageFile.name, { type: 'image/jpeg' }));
      }, 'image/jpeg', 0.95);
    };

    image.onerror = (error) => {
      URL.revokeObjectURL(imageUrl);
      reject(error);
    };
  });
}

const ProgressIndicator: React.FC<{ currentStep: number }> = ({ currentStep }) => {
    const steps = ["The Basics", "Details & Images"];
    return (
        <div className="flex justify-between items-center px-5 py-3 border-b border-brand-dark/10">
            {steps.map((step, index) => {
                const stepNumber = index + 1;
                const isCompleted = currentStep > stepNumber;
                const isActive = currentStep === stepNumber;
                return (
                    <React.Fragment key={step}>
                        <div className="flex items-center gap-2">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${
                                isActive ? 'bg-brand-accent text-white' : isCompleted ? 'bg-green-500 text-white' : 'bg-brand-cream border-2 border-brand-dark/20 text-brand-dark/50'
                            }`}>
                                {isCompleted ? '✓' : stepNumber}
                            </div>
                            <div>
                                <p className={`font-semibold transition-colors text-sm ${isActive || isCompleted ? 'text-brand-dark' : 'text-brand-dark/50'}`}>{step}</p>
                            </div>
                        </div>
                        {stepNumber < steps.length && <div className="flex-grow h-0.5 bg-brand-dark/10 mx-2"></div>}
                    </React.Fragment>
                );
            })}
        </div>
    );
};


const AddProductModal: React.FC<AddProductModalProps> = ({ isOpen, onClose, onProductAdded, userId }) => {
  const [step, setStep] = useState(1);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [type, setType] = useState<'buy' | 'rent'>('buy');
  const [quantity, setQuantity] = useState<number>(1);
  const [price, setPrice] = useState('');
  const [sessionString, setSessionString] = useState('');
  const [images, setImages] = useState<CroppedImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const categoryRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  const [filesToCropQueue, setFilesToCropQueue] = useState<File[]>([]);
  const [imageToCrop, setImageToCrop] = useState<{ id?: string; file: File; initialCrop?: Crop; initialCropMode?: any } | null>(null);

  const availableCategories = ["Books", "Tech and Gadgets", "Sports and Fitness", "Cycles, Bikes, etc", "Brand New", "Home & Kitchen Essentials", "Rent", "Other"];
  
  const MAX_FILE_SIZE = 12 * 1024 * 1024; // 12 MB
  const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp', 'image/svg+xml', 'image/tiff'];
  const MAX_IMAGE_COUNT = 5;

  useEffect(() => {
    if (!imageToCrop && filesToCropQueue.length > 0) {
      const nextFile = filesToCropQueue[0];
      setImageToCrop({ file: nextFile });
    }
  }, [filesToCropQueue, imageToCrop]);

  const handleFiles = (incomingFiles: File[]) => {
    setErrors(prev => ({ ...prev, images: undefined }));
    if (images.length + filesToCropQueue.length + incomingFiles.length > MAX_IMAGE_COUNT) {
      setErrors(prev => ({...prev, images: `You can only upload a maximum of ${MAX_IMAGE_COUNT} images.`}));
      return;
    }

    const validFiles: File[] = [];
    for (const file of incomingFiles) {
      if (file.size > MAX_FILE_SIZE) {
        setErrors(prev => ({...prev, images: `File "${file.name}" exceeds the 12 MB size limit.`}));
        return;
      }
      if (!ALLOWED_MIME_TYPES.includes(file.type)) {
        setErrors(prev => ({...prev, images: `File type for "${file.name}" is not supported.`}));
        return;
      }
      validFiles.push(file);
    }
    setFilesToCropQueue(prev => [...prev, ...validFiles]);
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

  const handleImageDelete = (id: string) => {
    setImages(prevImages => {
      const imageToDelete = prevImages.find(img => img.id === id);
      if (imageToDelete) URL.revokeObjectURL(imageToDelete.previewUrl);
      return prevImages.filter(img => img.id !== id);
    });
  };
  
  const handleEditCrop = (id: string) => {
    const image = images.find(img => img.id === id);
    if (image) {
      setImageToCrop({ id: image.id, file: image.originalFile, initialCrop: image.cropData, initialCropMode: image.cropMode });
    }
  };

  const onCropComplete = (croppedFile: File, cropData: Crop, cropMode: any) => {
    if (!imageToCrop) return;
    const newPreviewUrl = URL.createObjectURL(croppedFile);
    if (imageToCrop.id) {
        setImages(prev => prev.map(img => {
            if (img.id === imageToCrop.id) {
                URL.revokeObjectURL(img.previewUrl); // Clean up old preview
                return { ...img, previewUrl: newPreviewUrl, cropData: cropData, cropMode: cropMode };
            }
            return img;
        }));
    } else {
        const newImage: CroppedImage = {
            id: `${imageToCrop.file.name}-${Date.now()}`,
            originalFile: imageToCrop.file,
            previewUrl: newPreviewUrl,
            cropData: cropData,
            cropMode: cropMode,
        };
        setImages(prev => [...prev, newImage]);
        setFilesToCropQueue(prev => prev.slice(1));
    }
    setImageToCrop(null);
  };

  const onCropCancel = () => {
    if (!imageToCrop) return;
    if (!imageToCrop.id) setFilesToCropQueue(prev => prev.slice(1));
    setImageToCrop(null);
  }

  const resetForm = useCallback(() => {
    setStep(1);
    setTitle('');
    setDescription('');
    setCategories([]);
    setIsCategoryOpen(false);
    setType('buy');
    setQuantity(1);
    setPrice('');
    setSessionString('');
    images.forEach(img => URL.revokeObjectURL(img.previewUrl));
    setImages([]);
    setFilesToCropQueue([]);
    setImageToCrop(null);
    setErrors({});
  }, [images]);

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleCategoryChange = (selectedCategory: string) => {
    setCategories(prev => prev.includes(selectedCategory) ? prev.filter(c => c !== selectedCategory) : [...prev, selectedCategory]);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (categoryRef.current && !categoryRef.current.contains(event.target as Node)) setIsCategoryOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      images.forEach(img => URL.revokeObjectURL(img.previewUrl));
    };
  }, [categoryRef, images]);

  const handleAddBulletPoint = () => {
    const textarea = descriptionRef.current;
    if (!textarea) return;
    const { selectionStart, selectionEnd, value } = textarea;
    const newText = value.substring(0, selectionStart) + '• ' + value.substring(selectionEnd);
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
                const newValue = value.substring(0, lineStartIndex) + value.substring(selectionStart);
                setDescription(newValue);
                setTimeout(() => { textarea.selectionStart = textarea.selectionEnd = lineStartIndex; }, 0);
            } else {
                const newValue = `${value.substring(0, selectionStart)}\n• ${value.substring(selectionStart)}`;
                setDescription(newValue);
                setTimeout(() => { textarea.selectionStart = textarea.selectionEnd = selectionStart + 3; }, 0);
            }
        }
    }
  };
  
  const validateStep1 = () => {
    const newErrors: Record<string, string> = {};
    if (!title.trim()) newErrors.title = 'Product Title is required.';
    if (!description.trim()) newErrors.description = 'Product Description is required.';
    if (isNaN(quantity) || quantity < 1) newErrors.quantity = 'Quantity must be at least 1.';
    if (!price || parseFloat(price) <= 0) newErrors.price = 'A valid price is required.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) setStep(2);
  };

  const handleBack = () => setStep(prev => prev > 1 ? prev - 1 : 1);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    if (type === 'rent' && !sessionString.trim()) {
      newErrors.session = 'Rental Session is required for rentals.';
    }
    if (images.length === 0) {
      newErrors.images = 'At least one image is required.';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setErrors({});
    setLoading(true);

    try {
        const imageUploadPromises = images.map(async (image, index) => {
            const finalFile = await getCroppedFile(image.originalFile, image.cropData);
            const fileExtension = finalFile.name.split('.').pop() || 'jpg';
            const fileName = `${userId}/${uuidv4()}/image_${index}.${fileExtension}`;
            const { data, error: uploadError } = await supabase.storage.from('product_images').upload(fileName, finalFile);
            if (uploadError) throw new Error(`Image upload failed: ${uploadError.message}`);
            const { data: { publicUrl } } = supabase.storage.from('product_images').getPublicUrl(data.path);
            return publicUrl;
        });
        const uploadedImageUrls = await Promise.all(imageUploadPromises);
        const productData = {
            user_id: userId, title, description,
            category: categories.length > 0 ? categories : null,
            type, quantity_left: quantity, price: parseFloat(price),
            image_url: uploadedImageUrls,
            session: type === 'rent' ? sessionString.trim() : null,
        };
        const { error: insertError } = await supabase.from('products').insert(productData);
        if (insertError) throw new Error(`Failed to save product details: ${insertError.message}`);
        onProductAdded();
        handleClose();
    } catch (err: any) {
      setErrors({ form: err.message || 'An unexpected error occurred.' });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center p-2 sm:p-4">
        <div className="bg-brand-light border border-brand-dark/10 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[95vh] flex flex-col">
          <div className="p-5 border-b border-brand-dark/10 flex justify-between items-center sticky top-0 bg-brand-light z-10">
            <h2 className="text-2xl font-bold text-brand-dark">Add New Product</h2>
            <button onClick={handleClose} className="text-brand-dark/70 hover:text-brand-dark text-3xl leading-none">&times;</button>
          </div>
          <ProgressIndicator currentStep={step} />
          <form id="add-product-form" onSubmit={handleSubmit} className="p-5 overflow-y-auto flex-grow">
            
            {step === 1 && (
                <div className="space-y-4 animate-fade-in">
                    <div>
                        <label htmlFor="title" className="text-brand-dark/80 text-sm font-medium mb-1 block">Product Title <span className="text-red-500">*</span></label>
                        <input id="title" type="text" placeholder="e.g. Used Engineering Graphics Textbook" value={title} onChange={e => setTitle(e.target.value)} className={`w-full bg-white text-brand-dark px-4 py-2.5 rounded-lg border focus:outline-none focus:ring-2 focus:ring-brand-accent/80 ${errors.title ? 'border-red-500' : 'border-gray-300'}`} required />
                        {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
                    </div>
                    <div>
                        <div className="flex justify-between items-center mb-1">
                            <label htmlFor="description" className="text-brand-dark/80 text-sm font-medium">Product Description <span className="text-red-500">*</span></label>
                            <button type="button" onClick={handleAddBulletPoint} className="text-xs font-semibold text-brand-accent hover:underline">Add Bullet Point</button>
                        </div>
                        <textarea ref={descriptionRef} id="description" placeholder="Describe the item's condition, features, any flaws, etc." value={description} onChange={e => setDescription(e.target.value)} onKeyDown={handleDescriptionKeyDown} className={`w-full bg-white text-brand-dark px-4 py-2.5 rounded-lg border focus:outline-none focus:ring-2 focus:ring-brand-accent/80 ${errors.description ? 'border-red-500' : 'border-gray-300'}`} rows={5} required></textarea>
                        {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description}</p>}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="price" className="text-brand-dark/80 text-sm font-medium mb-1 block">Price (₹) <span className="text-red-500">*</span></label>
                            <input id="price" type="number" placeholder="e.g. 500" value={price} onChange={e => setPrice(e.target.value)} onKeyDown={(e) => { if (e.key === '.') e.preventDefault(); }} className={`w-full bg-white text-brand-dark px-4 py-2.5 rounded-lg border focus:outline-none focus:ring-2 focus:ring-brand-accent/80 ${errors.price ? 'border-red-500' : 'border-gray-300'}`} min="1" required />
                            {errors.price && <p className="text-red-500 text-xs mt-1">{errors.price}</p>}
                        </div>
                        <div>
                            <label htmlFor="quantity" className="text-brand-dark/80 text-sm font-medium mb-1 block">Quantity <span className="text-red-500">*</span></label>
                            <input
                                id="quantity"
                                type="number"
                                placeholder="e.g. 1"
                                value={quantity}
                                onChange={e => setQuantity(parseInt(e.target.value, 10))}
                                onBlur={() => { if (isNaN(quantity) || quantity < 1) setQuantity(1); }}
                                className={`w-full bg-white text-brand-dark px-4 py-2.5 rounded-lg border focus:outline-none focus:ring-2 focus:ring-brand-accent/80 ${errors.quantity ? 'border-red-500' : 'border-gray-300'}`}
                                min="1"
                                required
                            />
                            {errors.quantity && <p className="text-red-500 text-xs mt-1">{errors.quantity}</p>}
                        </div>
                    </div>
                </div>
            )}
            
            {step === 2 && (
                <div className="space-y-4 animate-fade-in">
                    <div>
                        <label className="text-brand-dark/80 text-sm font-medium mb-1 block">Type <span className="text-red-500">*</span></label>
                        <div className="flex bg-brand-cream border border-brand-dark/20 rounded-lg p-1">
                            <button type="button" onClick={() => setType('buy')} className={`w-1/2 py-2 rounded-md font-medium transition ${type === 'buy' ? 'bg-brand-accent text-white shadow' : 'text-brand-dark/80 hover:bg-white/50'}`}>Buy</button>
                            <button type="button" onClick={() => setType('rent')} className={`w-1/2 py-2 rounded-md font-medium transition ${type === 'rent' ? 'bg-brand-accent text-white shadow' : 'text-brand-dark/80 hover:bg-white/50'}`}>Rent</button>
                        </div>
                    </div>

                    {type === 'rent' && (
                        <div className="animate-fade-in-fast">
                            <label htmlFor="session" className="text-brand-dark/80 text-sm font-medium mb-1 block">Rental Session <span className="text-red-500">*</span></label>
                            <input id="session" type="text" placeholder="e.g., per night, per semester" value={sessionString} onChange={e => setSessionString(e.target.value)} className={`w-full bg-white text-brand-dark px-4 py-2.5 rounded-lg border focus:outline-none focus:ring-2 focus:ring-brand-accent/80 ${errors.session ? 'border-red-500' : 'border-gray-300'}`} required />
                            {errors.session && <p className="text-red-500 text-xs mt-1">{errors.session}</p>}
                        </div>
                    )}

                    <div className="relative" ref={categoryRef}>
                        <label className="text-brand-dark/80 text-sm font-medium mb-1 block">Categories (Recommended)</label>
                        <button type="button" onClick={() => setIsCategoryOpen(!isCategoryOpen)} className="w-full bg-white px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-accent/80 text-left flex justify-between items-center">
                            <span className={`truncate ${categories.length > 0 ? 'text-brand-dark' : 'text-gray-400'}`}>
                                {categories.length > 0 ? categories.join(', ') : 'Select categories...'}
                            </span>
                            <svg className={`w-5 h-5 transition-transform flex-shrink-0 text-gray-500 ${isCategoryOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
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
                      <label className="text-brand-dark/80 text-sm font-medium mb-1 block">Product Images <span className="text-red-500">*</span></label>
                      <div
                          onClick={() => fileInputRef.current?.click()}
                          onDragEnter={handleDragEnter} onDragLeave={handleDragLeave}
                          onDragOver={handleDragOver} onDrop={handleDrop}
                          className={`flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${isDragging ? 'border-brand-accent bg-brand-accent/10' : 'border-gray-300 hover:border-brand-accent/50'} ${errors.images ? 'border-red-500' : ''}`}
                      >
                          <input ref={fileInputRef} type="file" onChange={handleImageChange} multiple accept={ALLOWED_MIME_TYPES.join(',')} className="hidden" disabled={images.length >= MAX_IMAGE_COUNT}/>
                          <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-brand-accent/80 mb-2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                          <p className="text-brand-dark font-semibold">Drag & drop images here, or click to browse</p>
                          <p className="text-xs text-brand-dark/60 mt-1">Add up to {MAX_IMAGE_COUNT} images. Max 12MB each.</p>
                      </div>
                      {errors.images && <p className="text-red-500 text-sm text-center mt-2">{errors.images}</p>}
                      
                      {images.length > 0 && (
                          <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 mt-4">
                              {images.map((image) => (
                                  <div key={image.id} className="relative group aspect-square bg-white rounded-lg border border-gray-200 overflow-hidden">
                                      <div className="w-full h-full flex items-center justify-center">
                                          <img src={image.previewUrl} alt="Preview" className="max-w-full max-h-full object-contain" />
                                      </div>
                                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-60 transition-all duration-300 rounded-lg flex items-center justify-center">
                                          <button type="button" onClick={() => handleEditCrop(image.id)} className="absolute text-white opacity-0 group-hover:opacity-100 transition-opacity p-2 bg-black/50 rounded-full hover:bg-blue-500" title="Edit Crop">
                                              <CropIcon />
                                          </button>
                                          <button type="button" onClick={() => handleImageDelete(image.id)} className="absolute top-2 right-2 text-white opacity-0 group-hover:opacity-100 transition-opacity p-1.5 bg-black/50 rounded-full hover:bg-red-500" title="Delete Image">
                                              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                                          </button>
                                      </div>
                                  </div>
                              ))}
                          </div>
                      )}
                    </div>
                </div>
            )}
            {errors.form && <p className="text-red-500 text-sm text-center py-1">{errors.form}</p>}
          </form>
          <div className="p-4 border-t border-brand-dark/10 flex justify-between gap-3 sticky bottom-0 bg-brand-light">
            <div>
                {step > 1 && (
                    <button type="button" onClick={handleBack} className="bg-gray-200 text-gray-800 font-bold py-2.5 px-6 rounded-lg hover:bg-gray-300 transition">Back</button>
                )}
            </div>
            <div>
              {step < 2 ? (
                <button type="button" onClick={handleNext} className="bg-brand-accent text-white font-bold py-2.5 px-6 rounded-lg shadow-lg hover:opacity-90 transition">Next</button>
              ) : (
                <button type="submit" form="add-product-form" disabled={loading} className="bg-brand-accent text-white font-bold py-2.5 px-6 rounded-lg shadow-lg hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center min-w-[140px]">
                    {loading ? <Spinner /> : 'List My Item'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
      {imageToCrop && (
        <ImageCropModal 
          imageSrc={URL.createObjectURL(imageToCrop.file)}
          initialCrop={imageToCrop.initialCrop}
          initialCropMode={imageToCrop.initialCropMode}
          onClose={onCropCancel}
          onCropComplete={onCropComplete}
        />
      )}
    </>
  );
};

export default AddProductModal;
