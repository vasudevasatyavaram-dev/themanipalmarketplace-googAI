import { type Crop } from 'react-image-crop';

// Helper function to generate final cropped image from original file and percentage crop data
export async function getCroppedFile(imageFile: File, percentCrop: Crop): Promise<File> {
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
