import React, { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import { v4 as uuidv4 } from 'uuid';
import Spinner from '../ui/Spinner';
import ImageCropModal from './ImageCropModal';
import ProductFormFields from './ProductFormFields';
import { type Crop } from 'react-image-crop';
import { CroppedImage } from '../../types';


interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProductAdded: () => void;
  userId: string;
}

// Helper function to generate final cropped image from original file and percentage crop data
async function getCroppedFile(imageFile: File, percentCrop: Crop): Promise<File> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const imageUrl = URL.createObjectURL(imageFile);
    image.src = imageUrl;

    image.onload = () => {
      const canvas = document.createElement('canvas');
      
      // Use original image dimensions and percentage crop
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

const AddProductModal: React.FC<AddProductModalProps> = ({ isOpen, onClose, onProductAdded, userId }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [type, setType] = useState<'buy' | 'rent'>('buy');
  const [quantity, setQuantity] = useState(1);
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

  // Effect to process the next image in the queue
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
      if (imageToDelete) {
        URL.revokeObjectURL(imageToDelete.previewUrl);
      }
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

    // If imageToCrop has an ID, it means we are re-cropping an existing image
    if (imageToCrop.id) {
        setImages(prev => prev.map(img => {
            if (img.id === imageToCrop.id) {
                URL.revokeObjectURL(img.previewUrl); // Clean up old preview
                return { ...img, previewUrl: newPreviewUrl, cropData: cropData, cropMode: cropMode };
            }
            return img;
        }));
    } else { // This is a brand new image from the queue
        const newImage: CroppedImage = {
            id: `${imageToCrop.file.name}-${Date.now()}`,
            originalFile: imageToCrop.file,
            previewUrl: newPreviewUrl,
            cropData: cropData,
            cropMode: cropMode,
        };
        setImages(prev => [...prev, newImage]);
        // Remove the processed file from the queue
        setFilesToCropQueue(prev => prev.slice(1));
    }
    
    setImageToCrop(null);
  };

  const onCropCancel = () => {
    if (!imageToCrop) return;
    // If it was a new image, remove from queue. If re-cropping, just close.
    if (!imageToCrop.id) {
      setFilesToCropQueue(prev => prev.slice(1));
    }
    setImageToCrop(null);
  }

  const resetForm = useCallback(() => {
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
      // Ensure all previews are revoked on unmount
      images.forEach(img => URL.revokeObjectURL(img.previewUrl));
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryRef, images]);

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
    if (!title.trim()) newErrors.title = 'Product Title is required.';
    if (!description.trim()) newErrors.description = 'Product Description is required.';
    if (quantity < 1) newErrors.quantity = 'Quantity must be at least 1.';
    if (!price || parseFloat(price) <= 0) newErrors.price = 'A valid price is required.';
    if (type === 'rent' && !sessionString.trim()) newErrors.session = 'Rental Session is required for rentals.';
    if (images.length === 0) newErrors.images = 'At least one image is required.';
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);

    try {
        const imageUploadPromises = images.map(async (image, index) => {
            const finalFile = await getCroppedFile(image.originalFile, image.cropData);
            const fileExtension = finalFile.name.split('.').pop() || 'jpg';
            const fileName = `${userId}/${uuidv4()}/image_${index}.${fileExtension}`;
    
            const { data, error: uploadError } = await supabase.storage
                .from('product_images')
                .upload(fileName, finalFile);
    
            if (uploadError) throw new Error(`Image upload failed: ${uploadError.message}`);
    
            const { data: { publicUrl } } = supabase.storage
                .from('product_images')
                .getPublicUrl(data.path);
            
            return publicUrl;
        });
      
        const uploadedImageUrls = await Promise.all(imageUploadPromises);

        const productData = {
            user_id: userId,
            title,
            description,
            category: categories.length > 0 ? categories : null,
            type,
            quantity_left: quantity,
            price: parseFloat(price),
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
          <form id="add-product-form" onSubmit={handleSubmit} className="p-5 overflow-y-auto flex-grow">
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
                existingImages={[]}
                newImages={images}
                handleExistingImageDelete={() => {}}
                handleNewImageDelete={handleImageDelete}
                handleEditCrop={handleEditCrop}
                errors={errors}
                idPrefix="add-"
            />
          </form>
          <div className="p-4 border-t border-brand-dark/10 flex justify-end gap-3 sticky bottom-0 bg-brand-light">
              <button type="button" onClick={handleClose} className="bg-gray-200 text-gray-800 font-bold py-2.5 px-6 rounded-lg hover:bg-gray-300 transition">Cancel</button>
              <button type="submit" form="add-product-form" disabled={loading} className="bg-brand-accent text-white font-bold py-2.5 px-6 rounded-lg shadow-lg hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center min-w-[120px]">
                {loading ? <Spinner /> : 'Add Product'}
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

export default AddProductModal;