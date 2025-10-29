import React, { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import { v4 as uuidv4 } from 'uuid';
import type { Product, CroppedImage, ExistingImage, CropMode } from '../../types';
import Spinner from '../ui/Spinner';
import ImageCropModal from './ImageCropModal';
import ProductFormFields from './ProductFormFields';
import { type Crop } from 'react-image-crop';

interface EditProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProductEdited: () => void;
  userId: string;
  productToEdit: Product;
}

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
        image.naturalWidth * (percentCrop.x / 100),
        image.naturalHeight * (percentCrop.y / 100),
        canvas.width, canvas.height, 0, 0, canvas.width, canvas.height
      );
      URL.revokeObjectURL(imageUrl);

      canvas.toBlob(blob => {
        if (!blob) return reject(new Error('Canvas is empty'));
        resolve(new File([blob], imageFile.name, { type: 'image/jpeg' }));
      }, 'image/jpeg', 0.95);
    };
    image.onerror = (error) => {
      URL.revokeObjectURL(imageUrl);
      reject(error);
    };
  });
}

const EditProductModal: React.FC<EditProductModalProps> = ({ isOpen, onClose, onProductEdited, userId, productToEdit }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [type, setType] = useState<'buy' | 'rent'>('buy');
  const [quantity, setQuantity] = useState(1);
  const [price, setPrice] = useState('');
  const [sessionString, setSessionString] = useState('');
  
  const [newImages, setNewImages] = useState<CroppedImage[]>([]);
  const [existingImages, setExistingImages] = useState<ExistingImage[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const categoryRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const [filesToCropQueue, setFilesToCropQueue] = useState<File[]>([]);
  const [imageToCrop, setImageToCrop] = useState<{ id?: string; file: File; initialCrop?: Crop; initialCropMode?: CropMode } | null>(null);

  const [isDirty, setIsDirty] = useState(false);
  const initialProductState = useRef<Partial<Product> & {image_url: string[]} | null>(null);

  useEffect(() => {
    if (productToEdit) {
        setTitle(productToEdit.title);
        setDescription(productToEdit.description);
        setCategories(productToEdit.category || []);
        setType(productToEdit.type as 'buy' | 'rent');
        setQuantity(productToEdit.quantity_left);
        setPrice(String(productToEdit.price));
        setSessionString(productToEdit.session || '');
        setExistingImages(productToEdit.image_url.map((url, index) => ({ id: `existing-${index}-${url}`, url })));
        
        initialProductState.current = {
            title: productToEdit.title,
            description: productToEdit.description,
            category: productToEdit.category || [],
            type: productToEdit.type as 'buy' | 'rent',
            quantity_left: productToEdit.quantity_left,
            price: Number(productToEdit.price),
            session: productToEdit.session || null,
            image_url: productToEdit.image_url,
        };
        
        newImages.forEach(img => URL.revokeObjectURL(img.previewUrl));
        setNewImages([]);
        setFilesToCropQueue([]);
        setImageToCrop(null);
        setErrors({});
        setIsDirty(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productToEdit]);

  useEffect(() => {
    if (!productToEdit || !initialProductState.current) return;

    const sortedCategories = [...categories].sort();
    const sortedInitialCategories = [...(initialProductState.current.category || [])].sort();

    const initialImageUrls = initialProductState.current.image_url || [];
    const currentExistingImageUrls = existingImages.map(img => img.url);
    const imagesChanged = newImages.length > 0 || initialImageUrls.length !== currentExistingImageUrls.length || JSON.stringify(initialImageUrls.sort()) !== JSON.stringify(currentExistingImageUrls.sort());


    const hasChanged = 
      title !== initialProductState.current.title ||
      description !== initialProductState.current.description ||
      quantity !== initialProductState.current.quantity_left ||
      price !== String(initialProductState.current.price) ||
      type !== initialProductState.current.type ||
      (type === 'rent' && sessionString !== (initialProductState.current.session || '')) ||
      (type === 'buy' && (initialProductState.current.session !== null)) ||
      JSON.stringify(sortedCategories) !== JSON.stringify(sortedInitialCategories) ||
      imagesChanged;
    
    setIsDirty(hasChanged);

  }, [title, description, categories, type, quantity, price, sessionString, newImages, existingImages, productToEdit]);


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
    if (existingImages.length + newImages.length + filesToCropQueue.length + incomingFiles.length > MAX_IMAGE_COUNT) {
      setErrors(prev => ({...prev, images: `You can only have a maximum of ${MAX_IMAGE_COUNT} images in total.`}));
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
  
  const handleNewImageDelete = (id: string) => {
    setNewImages(prev => {
        const imageToDelete = prev.find(img => img.id === id);
        if (imageToDelete) URL.revokeObjectURL(imageToDelete.previewUrl);
        return prev.filter(img => img.id !== id);
    });
  };
  
  const handleEditCrop = (id: string) => {
    const image = newImages.find(img => img.id === id);
    if (image) {
      setImageToCrop({ id: image.id, file: image.originalFile, initialCrop: image.cropData, initialCropMode: image.cropMode });
    }
  };

  const handleExistingImageDelete = (id: string) => {
    setExistingImages(prev => prev.filter(img => img.id !== id));
  };

  const onCropComplete = (croppedFile: File, cropData: Crop, cropMode: CropMode) => {
    if (!imageToCrop) return;
    const newPreviewUrl = URL.createObjectURL(croppedFile);

    if (imageToCrop.id) {
        setNewImages(prev => prev.map(img => {
            if (img.id === imageToCrop.id) {
                URL.revokeObjectURL(img.previewUrl);
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
        setNewImages(prev => [...prev, newImage]);
        setFilesToCropQueue(prev => prev.slice(1));
    }
    setImageToCrop(null);
  };

  const onCropCancel = () => {
    if (!imageToCrop) return;
    if (!imageToCrop.id) {
      setFilesToCropQueue(prev => prev.slice(1));
    }
    setImageToCrop(null);
  };

  const handleClose = () => {
    newImages.forEach(img => URL.revokeObjectURL(img.previewUrl));
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
    setErrors({});

    const newErrors: Record<string, string> = {};
    if (existingImages.length + newImages.length === 0) {
      newErrors.images = 'Please upload at least one image.';
    }
    if (type === 'rent' && !sessionString.trim()) {
      newErrors.session = 'Rental Session is required for rentals.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    setLoading(true);

    try {
        const uploadPromises = newImages.map(async (image, index) => {
            const finalFile = await getCroppedFile(image.originalFile, image.cropData);
            const fileExtension = finalFile.name.split('.').pop() || 'jpg';
            const fileName = `${userId}/${uuidv4()}/image_${index}.${fileExtension}`;
            const { data, error: uploadError } = await supabase.storage.from('product_images').upload(fileName, finalFile);
            if (uploadError) throw new Error(`Image upload failed: ${uploadError.message}`);
            return supabase.storage.from('product_images').getPublicUrl(data.path).data.publicUrl;
        });
        const newImageUrls = await Promise.all(uploadPromises);
      
        const finalImageUrls = [...existingImages.map(img => img.url), ...newImageUrls];
      
        const newProductVersion = {
            product_group_id: productToEdit.product_group_id,
            user_id: userId,
            title,
            description,
            category: categories.length > 0 ? categories : null,
            type,
            quantity_left: quantity,
            price: parseFloat(price),
            image_url: finalImageUrls,
            session: type === 'rent' ? sessionString.trim() : null,
            edit_count: productToEdit.edit_count + 1,
            quantity_sold: productToEdit.quantity_sold,
            approval_status: 'pending',
            product_status: 'available',
            reject_explanation: null,
        };

        const { error: insertError } = await supabase.from('products').insert(newProductVersion);
        if (insertError) throw new Error(`Failed to save product details: ${insertError.message}`);
      
        onProductEdited();
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
          <div className="p-5 border-b border-brand-dark/10 flex justify-between items-center">
            <h2 className="text-2xl font-bold text-brand-dark">Edit Product (Version {productToEdit.edit_count + 1})</h2>
            <button onClick={handleClose} className="text-brand-dark/70 hover:text-brand-dark text-3xl leading-none">&times;</button>
          </div>
          <form id="edit-product-form" onSubmit={handleSubmit} className="p-5 overflow-y-auto flex-grow">
            <ProductFormFields
                title={title}
                setTitle={setTitle}
                description={description}
                setDescription={setDescription}
                descriptionRef={descriptionRef}
                handleAddBulletPoint={handleAddBulletPoint}
                handleDescriptionKeyDown={handleDescriptionKeyDown}
                categories={categories}
                isCategoryOpen={isCategoryOpen}
                setIsCategoryOpen={setIsCategoryOpen}
                categoryRef={categoryRef}
                availableCategories={availableCategories}
                handleCategoryChange={handleCategoryChange}
                type={type}
                setType={setType}
                price={price}
                setPrice={setPrice}
                quantity={quantity}
                setQuantity={setQuantity}
                sessionString={sessionString}
                setSessionString={setSessionString}
                fileInputRef={fileInputRef}
                isDragging={isDragging}
                handleDragEnter={handleDragEnter}
                handleDragLeave={handleDragLeave}
                handleDragOver={handleDragOver}
                handleDrop={handleDrop}
                handleImageChange={handleImageChange}
                ALLOWED_MIME_TYPES={ALLOWED_MIME_TYPES}
                MAX_IMAGE_COUNT={MAX_IMAGE_COUNT}
                existingImages={existingImages}
                newImages={newImages}
                handleExistingImageDelete={handleExistingImageDelete}
                handleNewImageDelete={handleNewImageDelete}
                handleEditCrop={handleEditCrop}
                errors={errors}
                idPrefix="edit-"
            />
          </form>
          <div className="p-4 border-t border-brand-dark/10 flex justify-end gap-3">
              <button type="button" onClick={handleClose} className="bg-gray-200 text-gray-800 font-bold py-2.5 px-6 rounded-lg hover:bg-gray-300 transition">Cancel</button>
              <button type="submit" form="edit-product-form" disabled={loading || !isDirty} className="bg-brand-accent text-white font-bold py-2.5 px-6 rounded-lg shadow-lg hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center min-w-[140px]">
                {loading ? <Spinner /> : 'Save as New Version'}
              </button>
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

export default EditProductModal;