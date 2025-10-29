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
  const [crop, setCrop] = useState<Crop>();
  const [aspect, setAspect] = useState<number | undefined>(1);
  const [activeMode, setActiveMode] = useState<CropMode>('square');
  const [loading, setLoading] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const modalContentRef = useRef<HTMLDivElement>(null);
  const initialLoadDone = useRef(false);

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
    initialLoadDone.current = false; // Reset on new image
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialCropMode, imageSrc]);


  function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const { width, height } = e.currentTarget;
    
    if (initialCrop && initialCrop.unit === '%') {
        setCrop(initialCrop);
    } else {
        const newCrop = centerCrop(
            makeAspectCrop({ unit: '%', width: 90 }, aspect || 1, width, height),
            width, height
        );
        // Convert to percentage crop to store as the source of truth
        setCrop({
            unit: '%',
            x: (newCrop.x / width) * 100,
            y: (newCrop.y / height) * 100,
            width: (newCrop.width / width) * 100,
            height: (newCrop.height / height) * 100,
        });
    }
    initialLoadDone.current = true;
  }
  
  const handleModeChange = (mode: CropMode, newAspect: number | undefined) => {
    setActiveMode(mode);
    setAspect(newAspect);
  };

  // This effect runs when the aspect ratio changes, ensuring the crop is updated AFTER the aspect state is set.
  useEffect(() => {
    if (!initialLoadDone.current || !imgRef.current) {
      return;
    }

    const { width, height } = imgRef.current;
    const aspectToCenter = activeMode === 'auto' ? 1 : aspect || (width / height);

    const newPixelCrop = centerCrop(
        makeAspectCrop({ unit: '%', width: 90 }, aspectToCenter, width, height),
        width, height
    );
    
    // Convert to percentage crop to store as the source of truth
    setCrop({
        unit: '%',
        x: (newPixelCrop.x / width) * 100,
        y: (newPixelCrop.y / height) * 100,
        width: (newPixelCrop.width / width) * 100,
        height: (newPixelCrop.height / height) * 100,
    });


    if (modalContentRef.current) {
        modalContentRef.current.scrollTop = 0;
    }
  }, [aspect, activeMode]);

  const handleCrop = async () => {
    const imageElement = imgRef.current;
    if (!imageElement || !crop || !crop.width || !crop.height) {
      return;
    }
    setLoading(true);

    // Convert percentage crop to pixel crop at the last moment, using stable dimensions
    const pixelCrop: Crop = {
        unit: 'px',
        x: (crop.x * imageElement.width) / 100,
        y: (crop.y * imageElement.height) / 100,
        width: (crop.width * imageElement.width) / 100,
        height: (crop.height * imageElement.height) / 100,
    };

    const canvas = document.createElement('canvas');
    const scaleX = imageElement.naturalWidth / imageElement.width;
    const scaleY = imageElement.naturalHeight / imageElement.height;
    canvas.width = pixelCrop.width * scaleX;
    canvas.height = pixelCrop.height * scaleY;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      setLoading(false);
      return;
    }

    ctx.drawImage(
      imageElement,
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
          <button onClick={handleCrop} disabled={loading} className="bg-brand-accent text-white font-bold py-2 px-5 rounded-lg shadow-lg hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center min-w-[100px] text-sm">
            {loading ? <Spinner /> : 'Apply Crop'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImageCropModal;
