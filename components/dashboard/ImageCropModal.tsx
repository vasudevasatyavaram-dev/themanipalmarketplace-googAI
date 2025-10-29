import React, { useState, useRef, useEffect } from 'react';
import ReactCrop, { type Crop } from 'react-image-crop';
import Spinner from '../ui/Spinner';

type CropMode = 'auto' | 'square' | 'portrait' | 'landscape';

interface ImageCropModalProps {
  imageSrc: string;
  onClose: () => void;
  onCropComplete: (croppedFile: File, cropData: Crop, cropMode: CropMode) => void;
  initialCrop?: Crop;
  initialCropMode?: CropMode;
}

/**
 * Creates a centered, percentage-based crop that covers the maximum
 * possible area of the image for a given aspect ratio.
 * @param imageWidth The natural width of the image.
 * @param imageHeight The natural height of the image.
 * @param aspect The desired aspect ratio (e.g., 1 for square, 16/9 for landscape).
 * @returns A Crop object with percentage units.
 */
function createMaxAreaPercentCrop(
  imageWidth: number,
  imageHeight: number,
  aspect: number
): Crop {
  const imageAspect = imageWidth / imageHeight;

  let width: number;
  let height: number;

  if (imageAspect > aspect) {
    // Image is wider than the crop aspect (letterboxed)
    // The height is the constraining dimension
    height = 100;
    width = (imageHeight * aspect / imageWidth) * 100;
  } else {
    // Image is taller than or same aspect as the crop (pillarboxed)
    // The width is the constraining dimension
    width = 100;
    height = (imageWidth / aspect / imageHeight) * 100;
  }

  // Center the crop
  const x = (100 - width) / 2;
  const y = (100 - height) / 2;

  return {
    unit: '%',
    x,
    y,
    width,
    height,
  };
}


const ImageCropModal: React.FC<ImageCropModalProps> = ({ imageSrc, onClose, onCropComplete, initialCrop, initialCropMode }) => {
  const [crop, setCrop] = useState<Crop>();
  const [aspect, setAspect] = useState<number | undefined>(1);
  const [activeMode, setActiveMode] = useState<CropMode>('square');
  const [loading, setLoading] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const modalContentRef = useRef<HTMLDivElement>(null);
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [isInitialCropSet, setIsInitialCropSet] = useState(false);

  // Set initial mode from props when modal opens for a new image or re-cropping
  useEffect(() => {
    if (initialCropMode) {
        const preset = aspectPresets.find(p => p.name.toLowerCase() === initialCropMode);
        setActiveMode(initialCropMode);
        setAspect(preset?.value);
    } else {
        // Default for new images
        setActiveMode('square');
        setAspect(1);
    }
    // Reset flags whenever a new image or props comes in.
    setIsInitialCropSet(false); 
    setIsImageLoaded(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialCropMode, imageSrc]);

  function onImageLoad() {
    setIsImageLoaded(true);
  }

  // This master effect is the single source of truth for calculating and setting the crop.
  // It runs when the image loads, when the mode changes, or when restoring an initial crop.
  useEffect(() => {
    if (!isImageLoaded || !imgRef.current) {
        return;
    }

    // This is a re-crop, and we haven't set the initial crop from props yet.
    if (initialCrop && !isInitialCropSet) {
        setCrop(initialCrop);
        setIsInitialCropSet(true); // Mark as done, so mode changes can recalculate.
        return;
    }
    
    // If we've already set the initial crop, a change in aspect/mode means the user clicked a button.
    // Or, if there's no initialCrop, this is a new image, so we calculate the default.
    const { naturalWidth, naturalHeight } = imgRef.current;
    
    // For 'auto' mode, we default to a square crop initially, then allow free-form resizing.
    const aspectToUse = aspect || 1; 

    setCrop(createMaxAreaPercentCrop(naturalWidth, naturalHeight, aspectToUse));
    
  }, [isImageLoaded, aspect, activeMode, initialCrop, isInitialCropSet]);
  
  const handleModeChange = (mode: CropMode, newAspect: number | undefined) => {
    setActiveMode(mode);
    setAspect(newAspect);
    if (modalContentRef.current) {
        modalContentRef.current.scrollTop = 0;
    }
  };

  const handleCrop = async () => {
    const imageElement = imgRef.current;
    if (!imageElement || !crop || !crop.width || !crop.height) {
      return;
    }
    setLoading(true);

    // Convert percentage crop to pixel crop at the last moment, using stable dimensions
    const pixelCrop: Crop = {
        unit: 'px',
        x: (crop.x * imageElement.naturalWidth) / 100,
        y: (crop.y * imageElement.naturalHeight) / 100,
        width: (crop.width * imageElement.naturalWidth) / 100,
        height: (crop.height * imageElement.naturalHeight) / 100,
    };

    const canvas = document.createElement('canvas');
    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      setLoading(false);
      return;
    }

    ctx.drawImage(
      imageElement,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      canvas.width,
      canvas.height
    );

    canvas.toBlob((blob) => {
      if (blob) {
        const croppedFile = new File([blob], 'cropped_image.jpeg', { type: 'image/jpeg' });
        // Pass the canonical percentage crop data onward
        onCropComplete(croppedFile, crop, activeMode);
      }
      setLoading(false);
    }, 'image/jpeg', 0.95);
  };
  
  const aspectPresets: { name: CropMode, value: number | undefined }[] = [
      { name: 'auto', value: undefined },
      { name: 'square', value: 1 / 1 },
      { name: 'portrait', value: 3 / 4 },
      { name: 'landscape', value: 16 / 9 },
  ];

  useEffect(() => {
      return () => {
          if (imageSrc.startsWith('blob:')) {
              URL.revokeObjectURL(imageSrc);
          }
      };
  }, [imageSrc]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 z-[60] flex justify-center items-center p-4">
      <div className="bg-brand-light rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        <div className="p-4 border-b border-brand-dark/10 flex justify-between items-center flex-shrink-0">
          <h2 className="text-xl font-bold text-brand-dark">Crop Image</h2>
          <button onClick={onClose} className="text-brand-dark/70 hover:text-brand-dark text-3xl leading-none">&times;</button>
        </div>
        <div ref={modalContentRef} className="p-4 flex-grow overflow-y-auto">
          <p className="text-sm text-red-600/90 text-center mb-2 italic font-semibold">
            Recommended crop is <strong>Square</strong> for consistency.
          </p>
          <div className="flex justify-center gap-2 mb-4">
             {aspectPresets.map(preset => (
                <button 
                    key={preset.name}
                    onClick={() => handleModeChange(preset.name, preset.value)}
                    className={`px-3 py-1 text-sm font-medium rounded-full transition capitalize ${activeMode === preset.name ? 'bg-brand-accent text-white' : 'bg-brand-cream hover:bg-brand-dark/10'}`}
                >{preset.name}</button>
             ))}
          </div>
          <div className="bg-gray-800 p-2 rounded-lg flex justify-center">
            <ReactCrop
              crop={crop}
              onChange={(_, percentCrop) => setCrop(percentCrop)}
              aspect={aspect}
              minWidth={100}
              minHeight={100}
              ruleOfThirds
            >
              <img ref={imgRef} src={imageSrc} onLoad={onImageLoad} alt="Crop preview" className="max-h-[65vh] object-contain" />
            </ReactCrop>
          </div>
        </div>
        <div className="p-3 border-t border-brand-dark/10 flex justify-end gap-3 flex-shrink-0">
          <button type="button" onClick={onClose} className="bg-gray-200 text-gray-800 font-bold py-2 px-5 rounded-lg hover:bg-gray-300 transition text-sm">Cancel</button>
          <button onClick={handleCrop} disabled={loading || !isImageLoaded} className="bg-brand-accent text-white font-bold py-2 px-5 rounded-lg shadow-lg hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center min-w-[100px] text-sm">
            {loading ? <Spinner /> : 'Apply Crop'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImageCropModal;