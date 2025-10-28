import React, { useState, useRef, useEffect } from 'react';
import ReactCrop, { type Crop, centerCrop, makeAspectCrop } from 'react-image-crop';
import Spinner from '../ui/Spinner';

type CropMode = 'auto' | 'square' | 'portrait' | 'landscape';

interface ImageCropModalProps {
  imageSrc: string;
  onClose: () => void;
  onCropComplete: (croppedFile: File, cropData: Crop, cropMode: CropMode) => void;
  initialCrop?: Crop;
  initialCropMode?: CropMode;
}

const ImageCropModal: React.FC<ImageCropModalProps> = ({ imageSrc, onClose, onCropComplete, initialCrop, initialCropMode }) => {
  const [pixelCrop, setPixelCrop] = useState<Crop>();
  const [percentCrop, setPercentCrop] = useState<Crop>();
  const [aspect, setAspect] = useState<number | undefined>(1);
  const [activeMode, setActiveMode] = useState<CropMode>('square');
  const [loading, setLoading] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const modalContentRef = useRef<HTMLDivElement>(null);

  // Set initial state from props when modal opens for re-cropping
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialCropMode]);


  function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const { width, height } = e.currentTarget;
    
    if (initialCrop && initialCrop.unit === '%') {
        setPercentCrop(initialCrop);
        // Convert initial percentage crop to pixels for ReactCrop
        const newPixelCrop = {
            unit: 'px' as const,
            x: (initialCrop.x * width) / 100,
            y: (initialCrop.y * height) / 100,
            width: (initialCrop.width * width) / 100,
            height: (initialCrop.height * height) / 100,
        };
        setPixelCrop(newPixelCrop);
    } else {
        const newCrop = centerCrop(
            makeAspectCrop({ unit: '%', width: 90 }, aspect || 1, width, height),
            width, height
        );
        setPixelCrop(newCrop);
        // Convert this to percent for consistency
        const newPercentCrop = {
            unit: '%' as const,
            x: (newCrop.x / width) * 100,
            y: (newCrop.y / height) * 100,
            width: (newCrop.width / width) * 100,
            height: (newCrop.height / height) * 100,
        };
        setPercentCrop(newPercentCrop);
    }
  }
  
  const handleModeChange = (mode: CropMode, newAspect: number | undefined) => {
    setActiveMode(mode);
    setAspect(newAspect); // For 'auto', this will be undefined to allow free resizing.

    if (imgRef.current) {
        const { width, height } = imgRef.current;
        
        // If the new mode is 'auto', we want the INITIAL crop to be a square (aspect 1).
        // For other modes, we use their specific aspect.
        const aspectToCenter = mode === 'auto' ? 1 : newAspect || (width / height);

        const newCrop = centerCrop(
            makeAspectCrop({ unit: '%', width: 90 }, aspectToCenter, width, height),
            width, height
        );
        setPixelCrop(newCrop);
        // Also set percent crop
        const newPercentCrop = {
            unit: '%' as const,
            x: (newCrop.x / width) * 100,
            y: (newCrop.y / height) * 100,
            width: (newCrop.width / width) * 100,
            height: (newCrop.height / height) * 100,
        };
        setPercentCrop(newPercentCrop);
        if (modalContentRef.current) {
            modalContentRef.current.scrollTop = 0;
        }
    }
  };

  const handleCrop = async () => {
    if (!imgRef.current || !pixelCrop || !pixelCrop.width || !pixelCrop.height || !percentCrop) {
      return;
    }
    setLoading(true);

    const canvas = document.createElement('canvas');
    const scaleX = imgRef.current.naturalWidth / imgRef.current.width;
    const scaleY = imgRef.current.naturalHeight / imgRef.current.height;
    canvas.width = pixelCrop.width * scaleX;
    canvas.height = pixelCrop.height * scaleY;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(
      imgRef.current,
      pixelCrop.x * scaleX,
      pixelCrop.y * scaleY,
      pixelCrop.width * scaleX,
      pixelCrop.height * scaleY,
      0,
      0,
      canvas.width,
      canvas.height
    );

    canvas.toBlob((blob) => {
      if (blob) {
        const croppedFile = new File([blob], 'cropped_image.jpeg', { type: 'image/jpeg' });
        onCropComplete(croppedFile, percentCrop, activeMode);
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
              crop={pixelCrop}
              onChange={(c, pc) => { setPixelCrop(c); setPercentCrop(pc); }}
              aspect={aspect}
              minWidth={100}
              minHeight={100}
            >
              <img ref={imgRef} src={imageSrc} onLoad={onImageLoad} alt="Crop preview" className="max-h-[65vh] object-contain" />
            </ReactCrop>
          </div>
        </div>
        <div className="p-3 border-t border-brand-dark/10 flex justify-end gap-3 flex-shrink-0">
          <button type="button" onClick={onClose} className="bg-gray-200 text-gray-800 font-bold py-2 px-5 rounded-lg hover:bg-gray-300 transition text-sm">Cancel</button>
          <button onClick={handleCrop} disabled={loading} className="bg-brand-accent text-white font-bold py-2 px-5 rounded-lg shadow-lg hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center min-w-[100px] text-sm">
            {loading ? <Spinner /> : 'Apply Crop'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImageCropModal;