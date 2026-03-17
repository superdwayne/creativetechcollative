import React, { useRef, useState } from 'react';
import { Upload, X, Loader2, Image as ImageIcon } from 'lucide-react';
import { uploadImage } from '@/lib/supabase';
import { cn } from '@/lib/utils';

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  userId: string;
  type: 'profile' | 'project';
  className?: string;
  label?: string;
  aspectRatio?: 'square' | 'video' | 'auto';
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  value,
  onChange,
  userId,
  type,
  className,
  label,
  aspectRatio = 'auto'
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFileSelect = async (file: File) => {
    if (!file) return;

    setIsUploading(true);
    setError(null);

    const result = await uploadImage(file, userId, type);

    if (result.error) {
      setError(result.error);
    } else if (result.url) {
      onChange(result.url);
    }

    setIsUploading(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleRemove = () => {
    onChange('');
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  const aspectClass = {
    square: 'aspect-square',
    video: 'aspect-video',
    auto: 'min-h-[150px]'
  }[aspectRatio];

  return (
    <div className={cn("w-full", className)}>
      {label && (
        <label className="block text-xs font-secondary tracking-wide text-zinc-400 uppercase mb-2">
          {label}
        </label>
      )}
      
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        onChange={handleInputChange}
        className="hidden"
      />

      {value ? (
        <div className={cn("relative border border-zinc-800 overflow-hidden", aspectClass)}>
          <img
            src={value}
            alt="Uploaded"
            className="w-full h-full object-cover"
          />
          <button
            type="button"
            onClick={handleRemove}
            className="absolute top-2 right-2 p-1.5 bg-black/70 hover:bg-black text-white rounded-full transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div
          onClick={() => inputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={cn(
            "flex flex-col items-center justify-center border border-dashed cursor-pointer transition-all",
            aspectClass,
            dragOver 
              ? "border-white bg-zinc-800/50" 
              : "border-zinc-700 hover:border-zinc-500 bg-zinc-900/30"
          )}
        >
          {isUploading ? (
            <Loader2 className="h-8 w-8 text-zinc-400 animate-spin" />
          ) : (
            <>
              <div className="p-3 border border-zinc-700 mb-3">
                {type === 'profile' ? (
                  <ImageIcon className="h-6 w-6 text-zinc-400" />
                ) : (
                  <Upload className="h-6 w-6 text-zinc-400" />
                )}
              </div>
              <p className="text-sm font-secondary text-zinc-400 mb-1">
                {dragOver ? 'Drop image here' : 'Click or drag to upload'}
              </p>
              <p className="text-xs font-secondary text-zinc-600">
                JPG, PNG, GIF, WebP • Max 5MB
              </p>
            </>
          )}
        </div>
      )}

      {error && (
        <p className="mt-2 text-sm font-secondary text-red-400">{error}</p>
      )}
    </div>
  );
};

export default ImageUpload;
