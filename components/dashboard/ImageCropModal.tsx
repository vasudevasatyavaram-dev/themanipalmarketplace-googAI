import React, { useState, useRef } from 'react';
import ReactCrop, { type Crop, centerCrop, makeAspectCrop } from 'react-image-crop';
import Spinner from '../ui/Spinner';

interface ImageCropModalProps {
  imageSrc: string;
  onClose: () => void;
  onCropComplete: (croppedFile: File) => void;
}

const ImageCropModal: React.FC<ImageCropModalProps> = ({ imageSrc, onClose, onCropComplete }) => {
  const [crop, setCrop] = useState<Crop>();
  const [aspect, setAspect] = useState<number | undefined>(1);
  const [loading, setLoading] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const { width, height } = e.currentTarget;
    const initialCrop = centerCrop(
      makeAspectCrop(
        {
          unit: '%',
          width: 90,
        },
        aspect || 16/9,
        width,
        height
      ),
      width,
      height
    );
    setCrop(initialCrop);
  }

  const handleCrop = async () => {
    if (!imgRef.current || !crop || !crop.width || !crop.height) {
      return;
    }
    setLoading(true);

    const canvas = document.createElement('canvas');
    const scaleX = imgRef.current.naturalWidth / imgRef.current.width;
    const scaleY = imgRef.current.naturalHeight / imgRef.current.height;
    canvas.width = crop.width * scaleX;
    canvas.height = crop.height * scaleY;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(
      imgRef.current,
      crop.x * scaleX,
      crop.y * scaleY,
      crop.width * scaleX,
      crop.height * scaleY,
      0,
      0,
      canvas.width,
      canvas.height
    );

    canvas.toBlob((blob) => {
      if (blob) {
        const croppedFile = new File([blob], 'cropped_image.jpeg', { type: 'image/jpeg' });
        onCropComplete(croppedFile);
      }
      setLoading(false);
    }, 'image/jpeg', 0.95);
  };
  
  const aspectPresets = [
      { name: 'Square', value: 1 / 1 },
      { name: 'Portrait', value: 3 / 4 },
      { name: 'Landscape', value: 16 / 9 },
      { name: 'Auto', value: undefined },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 z-[60] flex justify-center items-center p-4">
      <div className="bg-brand-light rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="p-4 border-b border-brand-dark/10 flex justify-between items-center">
          <h2 className="text-xl font-bold text-brand-dark">Crop Image</h2>
          <button onClick={onClose} className="text-brand-dark/70 hover:text-brand-dark text-3xl leading-none">&times;</button>
        </div>
        <div className="p-4 flex-grow overflow-y-auto">
          <p className="text-sm text-red-600/90 text-center mb-2 italic font-semibold">
            Recommended crop is <strong>Square</strong> for consistency.
          </p>
          <div className="flex justify-center gap-2 mb-4">
             {aspectPresets.map(preset => (
                <button 
                    key={preset.name}
                    onClick={() => setAspect(preset.value)}
                    className={`px-3 py-1 text-sm font-medium rounded-full transition ${aspect === preset.value ? 'bg-brand-accent text-white' : 'bg-brand-cream hover:bg-brand-dark/10'}`}
                >{preset.name}</button>
             ))}
          </div>
          <div className="bg-gray-800 p-2 rounded-lg">
            <ReactCrop
              crop={crop}
              onChange={c => setCrop(c)}
              aspect={aspect}
              minWidth={100}
              minHeight={100}
            >
              <img ref={imgRef} src={imageSrc} onLoad={onImageLoad} alt="Crop preview" className="max-h-[50vh] object-contain" />
            </ReactCrop>
          </div>
        </div>
        <div className="p-3 border-t border-brand-dark/10 flex justify-end gap-3">
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