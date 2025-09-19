import React from 'react';

interface FileInputProps {
  id: string;
  label: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  previewUrl: string | null;
  size?: 'normal' | 'compact';
}

const FileInput: React.FC<FileInputProps> = ({ id, label, onChange, previewUrl, size = 'normal' }) => {
  const sizeClasses = {
    normal: 'h-48',
    compact: 'h-32 text-sm'
  };

  const svgSizeClasses = {
    normal: 'h-12 w-12',
    compact: 'h-10 w-10'
  };

  return (
    <div className="w-full">
      <p className="block text-sm font-medium text-gray-400 mb-2">{label}</p>
      <label className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-600 border-dashed rounded-md hover:border-indigo-500 transition-colors duration-300 cursor-pointer bg-gray-800/50 ${sizeClasses[size]}`}>
        <div className="space-y-1 text-center w-full h-full flex flex-col justify-center items-center">
          {previewUrl ? (
             <img src={previewUrl} alt="Preview" className="max-h-full max-w-full object-contain rounded-md" />
          ) : (
            <>
              <svg className={`mx-auto text-gray-500 ${svgSizeClasses[size]}`} stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <div className="flex text-gray-400">
                <p className="pl-1">Upload an image</p>
                <input id={id} name={id} type="file" className="sr-only" onChange={onChange} accept="image/png, image/jpeg, image/webp" />
              </div>
               {size === 'normal' && <p className="text-xs text-gray-500">PNG, JPG, WEBP up to 10MB</p>}
            </>
          )}
        </div>
      </label>
    </div>
  );
};

export default FileInput;