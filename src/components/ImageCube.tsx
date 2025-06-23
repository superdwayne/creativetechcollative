// This file is now replaced by AsciiImageCube.tsx
// Keeping this file for backward compatibility but redirecting to ASCII version
import AsciiImageCube from './AsciiImageCube';

interface ImageCubeProps {
  size?: number;
  rotationSpeed?: number;
  position?: { x: number; y: number; z: number };
}

// Redirect to ASCII version
const ImageCube: React.FC<ImageCubeProps> = (props) => {
  return <AsciiImageCube {...props} />;
};

export default ImageCube;