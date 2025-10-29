import React from 'react';
import { CroppedImage, ExistingImage } from '../../types';

interface ProductFormFieldsProps {
    title: string;
    setTitle: (value: string) => void;
    description: string;
    setDescription: (value: string) => void;
    descriptionRef: React.RefObject<HTMLTextAreaElement>;
    handleAddBulletPoint: () => void;
    handleDescriptionKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
    categories: string[];
    isCategoryOpen: boolean;
    setIsCategoryOpen: (value: boolean) => void;
    categoryRef: React.RefObject<HTMLDivElement>;
    availableCategories: string[];
    handleCategoryChange: (category: string) => void;
    type: 'buy' | 'rent';
    setType: (value: 'buy' | 'rent') => void;
    price: string;
    setPrice: (value: string) => void;
    quantity: number;
    setQuantity: (value: number) => void;
    sessionString: string;
    setSessionString: (value: string) => void;
    fileInputRef: React.RefObject<HTMLInputElement>;
    isDragging: boolean;
    handleDragEnter: (e: React.DragEvent) => void;
    handleDragLeave: (e: React.DragEvent) => void;
    handleDragOver: (e: React.DragEvent) => void;
    handleDrop: (e: React.DragEvent) => void;
    handleImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    ALLOWED_MIME_TYPES: string[];
    MAX_IMAGE_COUNT: number;
    existingImages: ExistingImage[];
    newImages: CroppedImage[];
    handleExistingImageDelete: (id: string) => void;
    handleNewImageDelete: (id: string) => void;
    handleEditCrop: (id: string) => void;
    errors: Record<string, string>;
    idPrefix?: string;
}

const CropIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6.13 1L6 16a2 2 0 0 0 2 2h15"></path><path d="M1 6.13L16 6a2 2 0 0 1 2 2v15"></path></svg>
);


const ProductFormFields: React.FC<ProductFormFieldsProps> = ({
    title, setTitle,
    description, setDescription, descriptionRef, handleAddBulletPoint, handleDescriptionKeyDown,
    categories, isCategoryOpen, setIsCategoryOpen, categoryRef, availableCategories, handleCategoryChange,
    type, setType,
    price, setPrice,
    quantity, setQuantity,
    sessionString, setSessionString,
    fileInputRef, isDragging, handleDragEnter, handleDragLeave, handleDragOver, handleDrop, handleImageChange,
    ALLOWED_MIME_TYPES, MAX_IMAGE_COUNT,
    existingImages, newImages, handleExistingImageDelete, handleNewImageDelete, handleEditCrop,
    errors,
    idPrefix = ''
}) => {
    const totalImageCount = existingImages.length + newImages.length;
    
    return (
        <div className="space-y-4">
            <div>
              <label htmlFor={`${idPrefix}title`} className="text-brand-dark/80 text-sm font-medium mb-1 block">Product Title <span className="text-red-500">*</span></label>
              <input id={`${idPrefix}title`} type="text" placeholder="Enter product title " value={title} onChange={e => setTitle(e.target.value)} className={`w-full bg-white text-brand-dark px-4 py-2.5 rounded-lg border focus:outline-none focus:ring-2 focus:ring-brand-accent/80 ${errors.title ? 'border-red-500' : 'border-gray-300'}`} required />
              {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
            </div>
            
            <div>
                <div className="flex justify-between items-center mb-1">
                    <label htmlFor={`${idPrefix}description`} className="text-brand-dark/80 text-sm font-medium">Product Description <span className="text-red-500">*</span></label>
                    <button type="button" onClick={handleAddBulletPoint} className="text-xs font-semibold text-brand-accent hover:underline">Add Bullet Point</button>
                </div>
              <textarea ref={descriptionRef} id={`${idPrefix}description`} placeholder="Condition, features, flaws, etc" value={description} onChange={e => setDescription(e.target.value)} onKeyDown={handleDescriptionKeyDown} className={`w-full bg-white text-brand-dark px-4 py-2.5 rounded-lg border focus:outline-none focus:ring-2 focus:ring-brand-accent/80 ${errors.description ? 'border-red-500' : 'border-gray-300'}`} rows={3} required></textarea>
              {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description}</p>}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  <label className="text-brand-dark/80 text-sm font-medium mb-1 block">Type <span className="text-red-500">*</span></label>
                  <div className="flex bg-brand-cream border border-brand-dark/20 rounded-lg p-1">
                      <button type="button" onClick={() => setType('buy')} className={`w-1/2 py-2 rounded-md font-medium transition ${type === 'buy' ? 'bg-brand-accent text-white shadow' : 'text-brand-dark/80 hover:bg-white/50'}`}>Buy</button>
                      <button type="button" onClick={() => setType('rent')} className={`w-1/2 py-2 rounded-md font-medium transition ${type === 'rent' ? 'bg-brand-accent text-white shadow' : 'text-brand-dark/80 hover:bg-white/50'}`}>Rent</button>
                  </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor={`${idPrefix}price`} className="text-brand-dark/80 text-sm font-medium mb-1 block">Price (₹) <span className="text-red-500">*</span></label>
                <input id={`${idPrefix}price`} type="number" placeholder="Enter value" value={price} onChange={e => setPrice(e.target.value)} onKeyDown={(e) => { if (e.key === '.') e.preventDefault(); }} className={`w-full bg-white text-brand-dark px-4 py-2.5 rounded-lg border focus:outline-none focus:ring-2 focus:ring-brand-accent/80 ${errors.price ? 'border-red-500' : 'border-gray-300'}`} min="1" required />
                {errors.price && <p className="text-red-500 text-xs mt-1">{errors.price}</p>}
              </div>
              <div>
                  <label htmlFor={`${idPrefix}quantity`} className="text-brand-dark/80 text-sm font-medium mb-1 block">Quantity <span className="text-red-500">*</span></label>
                  <input
                    id={`${idPrefix}quantity`}
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

            {type === 'rent' && (
              <div className="animate-fade-in-fast">
                <label htmlFor={`${idPrefix}session`} className="text-brand-dark/80 text-sm font-medium mb-1 block">Rental Session <span className="text-red-500">*</span></label>
                <input id={`${idPrefix}session`} type="text" placeholder="e.g., per night, per hour, per day" value={sessionString} onChange={e => setSessionString(e.target.value)} className={`w-full bg-white text-brand-dark px-4 py-2.5 rounded-lg border focus:outline-none focus:ring-2 focus:ring-brand-accent/80 ${errors.session ? 'border-red-500' : 'border-gray-300'}`} required />
                {errors.session && <p className="text-red-500 text-xs mt-1">{errors.session}</p>}
              </div>
            )}
            
             <div>
                <label className="text-brand-dark/80 text-sm font-medium mb-1 block">Product Images <span className="text-red-500">*</span></label>
                <div
                    onClick={() => fileInputRef.current?.click()}
                    onDragEnter={handleDragEnter}
                    onDragLeave={handleDragLeave}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    className={`flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${isDragging ? 'border-brand-accent bg-brand-accent/10' : 'border-gray-300 hover:border-brand-accent/50'} ${errors.images ? 'border-red-500' : ''}`}
                >
                  <input ref={fileInputRef} type="file" onChange={handleImageChange} multiple accept={ALLOWED_MIME_TYPES.join(',')} className="hidden" disabled={totalImageCount >= MAX_IMAGE_COUNT}/>
                  <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-brand-accent/80 mb-2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                  <p className="text-brand-dark font-semibold">Drag & drop images here, or click to browse</p>
                  <p className="text-xs text-brand-dark/60 mt-1">Add up to {MAX_IMAGE_COUNT} images. Max 12MB each.</p>
                </div>
                {errors.images && <p className="text-red-500 text-sm text-center mt-2">{errors.images}</p>}
                
                {(totalImageCount > 0) && (
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 mt-4">
                        {existingImages.map((image) => (
                            <div key={image.id} className="relative group aspect-square bg-white rounded-lg border border-gray-200 overflow-hidden">
                               <div className="w-full h-full flex items-center justify-center">
                                  <img src={image.url} alt="Existing product" className="max-w-full max-h-full object-contain" />
                               </div>
                               <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-60 transition-all duration-300 rounded-lg">
                                  <button
                                    type="button"
                                    onClick={() => handleExistingImageDelete(image.id)}
                                    className="absolute top-2 right-2 text-white opacity-0 group-hover:opacity-100 transition-opacity p-1.5 bg-black/50 rounded-full hover:bg-red-500"
                                    title="Delete Image"
                                  >
                                     <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                                  </button>
                               </div>
                            </div>
                        ))}
                        {newImages.map((image) => (
                          <div key={image.id} className="relative group aspect-square bg-white rounded-lg border border-gray-200 overflow-hidden">
                             <div className="w-full h-full flex items-center justify-center">
                                <img src={image.previewUrl} alt="Preview" className="max-w-full max-h-full object-contain" />
                             </div>
                             <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-60 transition-all duration-300 rounded-lg flex items-center justify-center">
                                <button
                                    type="button"
                                    onClick={() => handleEditCrop(image.id)}
                                    className="absolute text-white opacity-0 group-hover:opacity-100 transition-opacity p-2 bg-black/50 rounded-full hover:bg-blue-500"
                                    title="Edit Crop"
                                >
                                  <CropIcon />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleNewImageDelete(image.id)}
                                    className="absolute top-2 right-2 text-white opacity-0 group-hover:opacity-100 transition-opacity p-1.5 bg-black/50 rounded-full hover:bg-red-500"
                                    title="Delete Image"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                                </button>
                             </div>
                          </div>
                        ))}
                    </div>
                )}
            </div>

            {errors.form && <p className="text-red-500 text-sm text-center py-1">{errors.form}</p>}
        </div>
    );
};

export default ProductFormFields;
