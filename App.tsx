import React, { useState, useCallback } from 'react';
import { ImageFile } from './types';
import { generateStyledImage, refineGeneratedImage } from './services/geminiService';
import FileInput from './components/FileInput';
import TextInput from './components/TextInput';
import Button from './components/Button';

interface HistoryItem {
  image: ImageFile;
  prompt: string;
}

const App: React.FC = () => {
  const [referenceImage, setReferenceImage] = useState<ImageFile | null>(null);
  const [productImage, setProductImage] = useState<ImageFile | null>(null);
  const [referencePreview, setReferencePreview] = useState<string | null>(null);
  const [productPreview, setProductPreview] = useState<string | null>(null);
  const [refineImage, setRefineImage] = useState<ImageFile | null>(null);
  const [refinePreview, setRefinePreview] = useState<string | null>(null);

  const [productTitle, setProductTitle] = useState('');
  const [price, setPrice] = useState('');
  const [oldPrice, setOldPrice] = useState('');
  const [refineText, setRefineText] = useState('');

  const [imageHistory, setImageHistory] = useState<HistoryItem[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const currentImage = historyIndex > -1 ? imageHistory[historyIndex].image : null;
  const currentPrompt = historyIndex > -1 ? imageHistory[historyIndex].prompt : '';

  const fileToBase64 = (file: File): Promise<ImageFile> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1];
        resolve({ base64, mimeType: file.type });
      };
      reader.onerror = (err) => reject(err);
    });
  };

  const handleFileChange = useCallback(async (
    e: React.ChangeEvent<HTMLInputElement>,
    setImage: React.Dispatch<React.SetStateAction<ImageFile | null>>,
    setPreview: React.Dispatch<React.SetStateAction<string | null>>
  ) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPreview(URL.createObjectURL(file));
      const imageFile = await fileToBase64(file);
      setImage(imageFile);
      e.target.value = ''; // Allow re-uploading the same file
    }
  }, []);

  const handleGenerate = useCallback(async (baseImgOverride: ImageFile | null = null, instruction: string | null = null) => {
    let imageToRefine = baseImgOverride ?? (historyIndex > -1 ? imageHistory[historyIndex].image : null);

    if (!instruction && (!referenceImage || !productImage || !productTitle || !price)) {
      setError('Please provide a reference image, a product image, title, and price.');
      return;
    }

    if (instruction && !imageToRefine) {
      setError('Please generate an image first before refining.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      let result: ImageFile;
      let promptForHistory: string;

      if (instruction && imageToRefine) {
        result = await refineGeneratedImage(imageToRefine, instruction, refineImage);
        promptForHistory = instruction;
        setRefineText('');
        setRefineImage(null);
        setRefinePreview(null);
      } else if (referenceImage && productImage) {
        result = await generateStyledImage(referenceImage, productImage, productTitle, price, oldPrice);
        promptForHistory = "Initial Generation";
      } else {
        throw new Error("Missing required inputs for generation.");
      }
      const newHistory = imageHistory.slice(0, historyIndex + 1);
      newHistory.push({ image: result, prompt: promptForHistory });
      setImageHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [referenceImage, productImage, productTitle, price, oldPrice, imageHistory, historyIndex, refineImage]);
  
  const handlePrev = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
    }
  };
  
  const handleNext = () => {
    if (historyIndex < imageHistory.length - 1) {
      setHistoryIndex(historyIndex + 1);
    }
  };

  const handleDownload = () => {
    if (currentImage) {
      const link = document.createElement('a');
      link.href = `data:${currentImage.mimeType};base64,${currentImage.base64}`;
      const fileExtension = currentImage.mimeType.split('/')[1] || 'png';
      link.download = `styled-product-image-v${historyIndex + 1}.${fileExtension}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200 font-sans p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="text-center mb-10">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight">
            AI <span className="text-indigo-500">Photo Stylist</span>
          </h1>
          <p className="mt-4 text-lg text-gray-400 max-w-2xl mx-auto">
            Generate stunning product photos by blending your product with the style of a reference image.
          </p>
        </header>
        
        <main className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Controls Panel */}
          <div className="bg-gray-800/50 p-6 rounded-xl shadow-lg flex flex-col gap-6 border border-gray-700">
            <h2 className="text-2xl font-bold text-white border-b border-gray-700 pb-3">1. Upload Your Assets</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FileInput id="reference-image" label="Reference Image (for style)" onChange={(e) => handleFileChange(e, setReferenceImage, setReferencePreview)} previewUrl={referencePreview} />
                <FileInput id="product-image" label="Product Image (to feature)" onChange={(e) => handleFileChange(e, setProductImage, setProductPreview)} previewUrl={productPreview} />
            </div>

            <h2 className="text-2xl font-bold text-white border-b border-gray-700 pb-3 mt-4">2. Enter Product Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <TextInput label="Product Title" id="productTitle" value={productTitle} onChange={(e) => setProductTitle(e.target.value)} placeholder="e.g., Classic Leather Watch" />
              <TextInput label="Price" id="price" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="e.g., $199.99" />
              <TextInput label="Old Price (Optional)" id="oldPrice" value={oldPrice} onChange={(e) => setOldPrice(e.target.value)} placeholder="e.g., $249.99" />
            </div>

            <div className="mt-auto pt-6">
              <Button onClick={() => handleGenerate()} isLoading={isLoading} disabled={!referenceImage || !productImage}>
                {isLoading ? 'Generating...' : 'Generate Image'}
              </Button>
            </div>
          </div>

          {/* Output Panel */}
          <div className="bg-gray-800/50 p-6 rounded-xl shadow-lg flex flex-col gap-4 border border-gray-700 min-h-[500px]">
            <h2 className="text-2xl font-bold text-white border-b border-gray-700 pb-3">3. Your Generated Image</h2>
            <div className="flex-grow flex items-center justify-center bg-gray-900 rounded-lg relative aspect-square">
              {isLoading && (
                  <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center z-20 rounded-lg">
                      <svg className="animate-spin h-10 w-10 text-indigo-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <p className="mt-4 text-lg">AI is working its magic...</p>
                  </div>
              )}
               {error && !isLoading && (
                <div className="text-center text-red-400 p-4">
                  <p className="font-semibold">Generation Failed</p>
                  <p className="text-sm">{error}</p>
                </div>
              )}
              {!currentImage && !isLoading && !error && (
                <div className="text-center text-gray-500">
                  <p>Your generated image will appear here.</p>
                </div>
              )}
              {currentImage && (
                <div className="group w-full h-full">
                  <img src={`data:${currentImage.mimeType};base64,${currentImage.base64}`} alt="Generated product" className="w-full h-full object-contain rounded-lg" />
                  <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-4 z-10 rounded-lg">
                      <button onClick={handleDownload} className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition-transform hover:scale-105">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                          Download
                      </button>
                  </div>
                </div>
              )}
            </div>
            
            {imageHistory.length > 0 && !isLoading && (
              <div className="flex flex-col items-center justify-center gap-2 mt-2">
                 {currentPrompt && <p className="text-xs text-gray-500 text-center italic max-w-md truncate" title={currentPrompt}>Prompt: "{currentPrompt}"</p>}
                {imageHistory.length > 1 && (
                    <div className="flex items-center justify-center gap-4">
                        <Button onClick={handlePrev} disabled={historyIndex <= 0} size="small" fullWidth={false} variant="secondary">
                        Previous
                        </Button>
                        <p className="text-sm text-gray-400 font-medium">
                        Version {historyIndex + 1} of {imageHistory.length}
                        </p>
                        <Button onClick={handleNext} disabled={historyIndex >= imageHistory.length - 1} size="small" fullWidth={false} variant="secondary">
                        Next
                        </Button>
                    </div>
                )}
              </div>
            )}

            {currentImage && !isLoading && (
              <div className="mt-4 pt-4 border-t border-gray-700">
                <h3 className="text-xl font-bold text-white mb-3">4. Refine Your Image</h3>
                <div className="flex flex-col gap-4">
                  <FileInput id="refine-image" label="Add Image to Prompt (Optional)" onChange={(e) => handleFileChange(e, setRefineImage, setRefinePreview)} previewUrl={refinePreview} size="compact" />
                  <div>
                    <label htmlFor="refine-text" className="block text-sm font-medium text-gray-400 mb-2">Refinement Instructions</label>
                    <textarea
                        id="refine-text"
                        value={refineText}
                        onChange={(e) => setRefineText(e.target.value)}
                        placeholder="e.g., 'make the background blue', 'add this logo to the top right'"
                        className="w-full bg-gray-700 border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-white min-h-[60px]"
                        rows={2}
                    />
                  </div>
                  <Button onClick={() => handleGenerate(currentImage, refineText)} variant="secondary" disabled={!refineText}>
                    Refine
                  </Button>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;