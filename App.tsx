import React, { useState, useCallback, useEffect } from 'react';
import Header from './components/Header';
import ImageUploader from './components/ImageUploader';
import Loader from './components/Loader';
import { SparklesIcon, DownloadIcon, EraserIcon, ResetIcon, EditIcon, CreateIcon, EnhanceIcon, ExpandIcon, VideoIcon } from './components/icons';
import { editImage, generateImage, dataUrlToBlob, generateVideo } from './services/geminiService';
import { addWatermark } from './utils/watermark';
import { createImageGrid } from './utils/imageUtils';
import type { EditedImageResult, Mode, AspectRatio, User } from './types';
import MaskableImage from './components/MaskableImage';
import ImageComparer from './components/ImageComparer';
import SplashScreen from './components/SplashScreen';
import AnimatedBackground from './components/AnimatedBackground';

const editorExamplePrompts = [
  "make the sky look like a vibrant sunset",
  "add a small, friendly robot sitting on the bench",
  "turn this into a black and white noir photo",
  "apply a vintage, retro film effect",
];

const generatorExamplePrompts = [
    "a photo of a cute cat wearing a tiny wizard hat",
    "a vibrant, detailed illustration of a futuristic city",
    "an oil painting of a serene mountain landscape",
    "a 3D render of a delicious-looking cartoon burger",
];

const videoExamplePrompts = [
    "a cinematic shot of a car driving on a rainy night",
    "a time-lapse of a flower blooming, hyper-realistic",
    "an animated character waving hello",
    "a drone shot flying over a tropical island",
];

type Tool = 'brush' | 'eraser';
type Ripple = { id: number; x: number; y: number; };

const App: React.FC = () => {
  const [showSplash, setShowSplash] = useState(true);
  const [user, setUser] = useState<User>({ isGuest: true });

  const [mode, setMode] = useState<Mode>('editor');
  const [originalFiles, setOriginalFiles] = useState<File[]>([]);
  const [originalImagePreviews, setOriginalImagePreviews] = useState<string[]>([]);
  const [combinedPreviewUrl, setCombinedPreviewUrl] = useState<string | null>(null);
  const [prompt, setPrompt] = useState<string>('');
  const [editedResult, setEditedResult] = useState<EditedImageResult | null>(null);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  const [maskDataUrl, setMaskDataUrl] = useState<string | null>(null);
  const [tool, setTool] = useState<Tool>('brush');
  const [brushSize, setBrushSize] = useState(40);
  const [resetMask, setResetMask] = useState(0);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('1:1');
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const [progressMessage, setProgressMessage] = useState<string>('');


  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 2500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const generateGrid = async () => {
        if (mode === 'editor' && originalImagePreviews.length > 1) {
            setIsLoading(true);
            const gridUrl = await createImageGrid(originalImagePreviews, aspectRatio);
            setCombinedPreviewUrl(gridUrl);
            setIsLoading(false);
        } else {
            setCombinedPreviewUrl(null);
        }
    };
    generateGrid();
  }, [originalImagePreviews, aspectRatio, mode]);

  const resetAllState = (clearFiles = true) => {
      if (clearFiles) {
        setOriginalFiles([]);
        setOriginalImagePreviews([]);
        setCombinedPreviewUrl(null);
      }
      setEditedResult(null);
      setGeneratedImageUrl(null);
      setGeneratedVideoUrl(null);
      setError(null);
      setPrompt('');
      setMaskDataUrl(null);
      setResetMask(k => k + 1);
      setProgressMessage('');
  };

  const handleModeChange = (newMode: Mode) => {
      if (mode !== newMode) {
          setMode(newMode);
          resetAllState();
      }
  };

  const handleImageSelect = useCallback((fileList: FileList) => {
    resetAllState(false);
    const filesArray = Array.from(fileList);
    setOriginalFiles(filesArray);

    const previewPromises = filesArray.map(file => {
        return new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    });

    Promise.all(previewPromises).then(previews => {
        setOriginalImagePreviews(previews);
    });
  }, []);
  
  const prepareExpandData = async (): Promise<{ file: Blob, mask: string } | null> => {
      if (originalImagePreviews.length === 0) return null;
      const imageToExpand = originalImagePreviews[0];

      const img = new Image();
      img.src = imageToExpand;
      await new Promise(resolve => { img.onload = resolve; });

      const expandFactor = 1.5;
      const newWidth = img.width * expandFactor;
      const newHeight = img.height * expandFactor;
      
      const offsetX = (newWidth - img.width) / 2;
      const offsetY = (newHeight - img.height) / 2;

      const imageCanvas = document.createElement('canvas');
      imageCanvas.width = newWidth;
      imageCanvas.height = newHeight;
      const imgCtx = imageCanvas.getContext('2d');
      if (!imgCtx) return null;
      imgCtx.drawImage(img, offsetX, offsetY);
      const expandedImageDataUrl = imageCanvas.toDataURL('image/png');
      const expandedImageBlob = await dataUrlToBlob(expandedImageDataUrl);
      
      const maskCanvas = document.createElement('canvas');
      maskCanvas.width = newWidth;
      maskCanvas.height = newHeight;
      const maskCtx = maskCanvas.getContext('2d');
      if (!maskCtx) return null;
      maskCtx.fillStyle = 'white';
      maskCtx.fillRect(0, 0, newWidth, newHeight);
      maskCtx.fillStyle = 'black';
      maskCtx.fillRect(offsetX, offsetY, img.width, img.height);
      const maskDataUrl = maskCanvas.toDataURL('image/png');
      
      return { file: expandedImageBlob, mask: maskDataUrl };
  };


  const handleSubmit = async () => {
    setIsLoading(true);
    setError(null);
    setEditedResult(null);
    setGeneratedImageUrl(null);
    setGeneratedVideoUrl(null);
    setProgressMessage('');

    if (mode === 'video') {
        if (!prompt) {
            setError('Please provide a prompt.');
            setIsLoading(false);
            return;
        }
        try {
            const videoUrl = await generateVideo(prompt, setProgressMessage);
            if (videoUrl) {
                setGeneratedVideoUrl(videoUrl);
            } else {
                setError("The AI couldn't generate a video. Try again or rephrase your prompt.");
            }
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
        } finally {
            setIsLoading(false);
        }
        return; 
    }

    try {
        let resultUrl: string | null = null;
        let resultText: string = "";
        let promptToSave = prompt;

        switch (mode) {
            case 'editor':
                if (originalFiles.length === 0 || !prompt) {
                    setError('Please upload at least one image and provide a prompt.');
                    setIsLoading(false); return;
                }
                
                const imageToEditBlob: Blob = combinedPreviewUrl 
                    ? await dataUrlToBlob(combinedPreviewUrl)
                    : originalFiles[0];

                const finalPrompt = `${prompt}. Important: The final output image MUST have a ${aspectRatio} aspect ratio.`;
                const editResult = await editImage(imageToEditBlob, finalPrompt, maskDataUrl);
                if (editResult) { resultUrl = editResult.imageUrl; resultText = editResult.text; }
                break;
            
            case 'generator':
                if (!prompt) {
                    setError('Please provide a prompt.');
                    setIsLoading(false); return;
                }
                resultUrl = await generateImage(prompt, aspectRatio);
                break;
            
            case 'enhance':
                 if (originalFiles.length === 0) {
                    setError('Please upload an image to enhance.');
                    setIsLoading(false); return;
                }
                promptToSave = "Significantly enhance the quality, resolution, and details of this image. Make it 4K UHD quality. Sharpen the image and improve vibrancy.";
                const enhanceResult = await editImage(originalFiles[0], promptToSave, null);
                if (enhanceResult) { resultUrl = enhanceResult.imageUrl; resultText = "Image enhanced to 4K quality."; }
                break;

            case 'expand':
                if (originalFiles.length === 0) {
                    setError('Please upload an image to expand.');
                    setIsLoading(false); return;
                }
                const expandData = await prepareExpandData();
                if (!expandData) {
                    setError("Could not prepare image for expansion.");
                    setIsLoading(false); return;
                }
                promptToSave = "Seamlessly expand the image to fill the masked (white) area, continuing the existing scene and matching the style perfectly.";
                const expandResult = await editImage(expandData.file, promptToSave, expandData.mask);
                if (expandResult) { resultUrl = expandResult.imageUrl; resultText = "Image canvas has been expanded."; }
                break;
        }

        if (resultUrl) {
            const watermarkedUrl = await addWatermark(resultUrl);
            if (mode === 'generator') {
                setGeneratedImageUrl(watermarkedUrl);
            } else {
                setEditedResult({ imageUrl: watermarkedUrl, text: resultText });
            }
        } else {
            setError("The AI couldn't generate an image. Try again or rephrase your prompt.");
        }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleExamplePromptClick = (example: string) => setPrompt(example);

  const handleDownload = () => {
    let url: string | null = null;
    let extension: string = 'png';
    let baseName: string = 'generated';

    if (mode === 'video' && generatedVideoUrl) {
        url = generatedVideoUrl;
        extension = 'mp4';
    } else {
        url = mode === 'generator' ? generatedImageUrl : editedResult?.imageUrl;
        baseName = (mode !== 'generator' && originalFiles[0]?.name) 
            ? originalFiles[0].name.split('.').slice(0, -1).join('.')
            : 'generated';
    }

    if (!url) return;
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `pubzelo-${mode}-${baseName}.${extension}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const addRipple = (e: React.MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('button, a, input, [role="button"], textarea')) return;
      
      const newRipple: Ripple = { id: Date.now(), x: e.clientX, y: e.clientY };
      setRipples(currentRipples => [...currentRipples, newRipple]);
      setTimeout(() => {
          setRipples(currentRipples => currentRipples.filter(r => r.id !== newRipple.id));
      }, 1000);
  };
  
  if (showSplash) {
      return <SplashScreen />;
  }
  
  const isUploadNeeded = mode === 'editor' || mode === 'enhance' || mode === 'expand';
  const isPromptNeeded = mode === 'editor' || mode === 'generator' || mode === 'video';
  const isAspectRatioNeeded = mode === 'editor' || mode === 'generator';
  
  const imageToDisplayAndMask = combinedPreviewUrl || (originalImagePreviews.length > 0 ? originalImagePreviews[0] : null);
  const originalImageForComparer = combinedPreviewUrl || (mode === 'expand' ? originalImagePreviews[0] : (originalImagePreviews[0] || null));

  const hasImageResult = (mode !== 'generator' && editedResult) || (mode === 'generator' && generatedImageUrl);
  const hasVideoResult = mode === 'video' && generatedVideoUrl;

  return (
    <div className="min-h-screen bg-slate-900 text-gray-200" onClick={addRipple}>
      <AnimatedBackground />
       {ripples.map(ripple => (
        <div
          key={ripple.id}
          className="pointer-events-none absolute w-24 h-24 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-fuchsia-300/50 ripple-animation"
          style={{ left: ripple.x, top: ripple.y }}
        />
      ))}
      <Header />
      <main className="container mx-auto p-4 md:p-8 relative z-10">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          
          <div className="flex flex-col gap-8">
            <div className="flex flex-col gap-6 p-6 bg-slate-900/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 shadow-2xl">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2 p-1 bg-slate-900/50 rounded-lg">
                    {([['editor', EditIcon, 'Editor'], ['generator', CreateIcon, 'Generator'], ['enhance', EnhanceIcon, 'Enhance'], ['expand', ExpandIcon, 'Expand'], ['video', VideoIcon, 'Video']] as const).map(([m, Icon, label]) => (
                        <button key={m} onClick={() => handleModeChange(m)} className={`flex items-center justify-center gap-2 p-2 rounded-md transition-all duration-300 text-sm transform ${mode === m ? 'bg-fuchsia-600 text-white shadow-lg scale-105' : 'hover:bg-slate-700'}`}>
                            <Icon className="w-5 h-5"/> {label}
                        </button>
                    ))}
                </div>
                
                {isUploadNeeded && (
                    <div>
                        <label className="text-lg font-semibold text-cyan-300 mb-2 block">1. Upload Image(s)</label>
                        {originalImagePreviews.length > 0 ? (
                             <div className="flex justify-between items-center mb-2">
                                <p className="text-sm text-slate-300 truncate pr-4">{originalFiles.length} image(s) loaded. {combinedPreviewUrl && 'Combined into grid.'}</p>
                                <button onClick={() => resetAllState()} className="text-sm text-slate-400 hover:text-white transition-colors flex-shrink-0">Change Images</button>
                            </div>
                        ) : (
                            <ImageUploader onImageSelect={handleImageSelect} />
                        )}
                    </div>
                )}
                
                {mode === 'editor' && imageToDisplayAndMask && (
                    <>
                        <div>
                            <label className="text-lg font-semibold text-cyan-300">2. Mask Image (Optional)</label>
                            <p className="text-sm text-slate-400 mb-2">Draw on the areas you want the AI to change.</p>
                            <MaskableImage 
                                src={imageToDisplayAndMask} tool={tool} brushSize={brushSize}
                                onMaskChange={setMaskDataUrl} resetKey={resetMask}
                            />
                        </div>
                        
                        <div className="p-3 bg-slate-900/50 rounded-lg flex flex-col gap-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <button onClick={() => setTool('brush')} className={`p-2 rounded-md ${tool === 'brush' ? 'bg-fuchsia-500' : 'bg-slate-700 hover:bg-slate-600'}`} aria-label="Brush tool"><EditIcon className="w-5 h-5"/></button>
                                    <button onClick={() => setTool('eraser')} className={`p-2 rounded-md ${tool === 'eraser' ? 'bg-fuchsia-500' : 'bg-slate-700 hover:bg-slate-600'}`} aria-label="Eraser tool"><EraserIcon className="w-5 h-5"/></button>
                                    <button onClick={() => setResetMask(k => k + 1)} className="p-2 rounded-md bg-slate-700 hover:bg-slate-600" aria-label="Reset mask"><ResetIcon className="w-5 h-5"/></button>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <label htmlFor="brush-size" className="text-sm">Brush Size:</label>
                                <input type="range" id="brush-size" min="5" max="100" value={brushSize} onChange={(e) => setBrushSize(Number(e.target.value))} className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-fuchsia-500" />
                            </div>
                        </div>
                    </>
                )}

                {isAspectRatioNeeded && (
                    <div>
                        <label className="text-lg font-semibold text-cyan-300 mb-2 block">{mode === 'editor' ? '3. Aspect Ratio' : '1. Aspect Ratio'}</label>
                         {mode === 'editor' && originalImagePreviews.length > 1 && <p className="text-sm text-slate-400 mb-2">This will update the grid layout.</p>}
                        <div className="grid grid-cols-4 gap-2">
                            {(['1:1', '4:3', '16:9', '9:16'] as AspectRatio[]).map(ratio => (
                                <button key={ratio} onClick={() => setAspectRatio(ratio)} className={`py-2 rounded-md transition-colors ${aspectRatio === ratio ? 'bg-fuchsia-600 text-white' : 'bg-slate-700 hover:bg-slate-600'}`}>{ratio}</button>
                            ))}
                        </div>
                    </div>
                )}

                { isPromptNeeded && (
                    <>
                        <div>
                        <label htmlFor="prompt" className="text-lg font-semibold text-cyan-300 mb-2 block">
                          {mode === 'editor' ? '4. Describe Your Edit' : 
                           mode === 'generator' ? '2. Describe Image' : '1. Describe Your Video'}
                        </label>
                        <textarea id="prompt" value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder={
                            mode === 'editor' ? "e.g., add a dragon flying in the sky" : 
                            mode === 'generator' ? "e.g., a photorealistic portrait of a cat astronaut" : 
                            "e.g., a cinematic shot of a car driving at night"
                        }
                            className="w-full h-24 p-3 bg-slate-800 border-2 border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-fuchsia-500 focus:border-fuchsia-500 transition-colors"
                            disabled={isLoading} />
                        </div>
                        
                        <div>
                        <p className="text-sm text-slate-400 mb-2">Or try an example:</p>
                        <div className="flex flex-wrap gap-2">
                            {(
                                mode === 'editor' ? editorExamplePrompts : 
                                mode === 'generator' ? generatorExamplePrompts : 
                                videoExamplePrompts
                            ).map((p) => (
                            <button key={p} onClick={() => handleExamplePromptClick(p)} disabled={isLoading}
                                className="px-3 py-1 text-sm bg-slate-700 hover:bg-slate-600 rounded-full transition-colors disabled:opacity-50">{p}</button>
                            ))}
                        </div>
                        </div>
                    </>
                )}
                
                <button
                    onClick={handleSubmit}
                    disabled={isLoading || (isUploadNeeded && originalFiles.length === 0) || (isPromptNeeded && !prompt)}
                    className="w-full flex items-center justify-center gap-3 py-3 px-6 bg-gradient-to-r from-fuchsia-600 to-blue-600 hover:from-fuchsia-500 hover:to-blue-500 text-white font-bold rounded-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105"
                    >
                    <SparklesIcon className="w-6 h-6" />
                    {isLoading ? 'Generating...' : 
                        mode === 'editor' ? 'Apply AI Edit' : 
                        mode === 'generator' ? 'Generate Image' :
                        mode === 'enhance' ? 'Enhance Quality' :
                        mode === 'video' ? 'Generate Video' : 'Expand Image'
                    }
                </button>
            </div>
          </div>


          <div className="flex flex-col gap-4 p-6 bg-slate-900/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 shadow-2xl min-h-[30rem] items-center justify-center sticky top-28">
             <label className="text-lg font-semibold text-cyan-300 mb-2 block w-full text-center">Result</label>
            {isLoading && <Loader message={mode === 'video' ? progressMessage : undefined} />}
            {error && <div className="text-center text-red-400 bg-red-900/50 p-4 rounded-md border border-red-700">{error}</div>}
            
            {!isLoading && !error && (hasImageResult || hasVideoResult) && (
              <div className="w-full flex flex-col gap-4 items-center animate-fade-in">
                  {hasImageResult && (
                      <>
                        {(mode === 'editor' || mode === 'enhance' || mode === 'expand') && editedResult && originalImageForComparer ? (
                            <ImageComparer original={originalImageForComparer} edited={editedResult.imageUrl} />
                        ) : (
                            generatedImageUrl && <img src={generatedImageUrl} alt="Generated result" className="rounded-lg max-w-full h-auto max-h-[500px] object-contain"/>
                        )}
                        {(mode !== 'generator' && mode !== 'video') && editedResult?.text && (
                          <p className="text-center italic text-slate-300 bg-slate-800 p-3 rounded-md">"{editedResult.text}"</p>
                        )}
                      </>
                  )}
                  {hasVideoResult && (
                     <video src={generatedVideoUrl!} controls autoPlay loop className="rounded-lg max-w-full h-auto max-h-[500px] object-contain" />
                  )}
                  <button onClick={handleDownload} className="w-full max-w-sm flex items-center justify-center gap-3 py-2 px-6 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-lg transition-colors">
                     <DownloadIcon className="w-5 h-5" />Download {mode === 'video' ? 'Video' : 'Image'}
                   </button>
              </div>
            )}

            {!isLoading && !error && !hasImageResult && !hasVideoResult && (
                 <div className="text-center text-slate-500">
                    <SparklesIcon className="w-20 h-20 mx-auto opacity-20" />
                    <p className="mt-4">{ 
                        mode === 'generator' ? 'Your generated image will appear here.' :
                        mode === 'video' ? 'Your generated video will appear here.' :
                        'Your processed image will appear here.'
                    }</p>
                </div>
            )}
          </div>

        </div>
      </main>
    </div>
  );
};

export default App;