import React, { useState, useRef, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleGenAI, Modality, Type } from "@google/genai";

import { Mode, GenerationStyle, Flashcard as FlashcardType, ImageArtStyle } from './types';
import { ApiKeyManager } from './components/ApiKeyManager';
import { ComparisonViewer } from './components/ComparisonViewer';
import { FlashcardCreator } from './components/FlashcardCreator';
import { FlashcardViewer } from './components/FlashcardViewer';
import { GeneratedImage } from './components/GeneratedImage';
import { ImageUploader } from './components/ImageUploader';
import { ImageEditor } from './components/ImageEditor';
import { LoadingSpinner } from './components/LoadingSpinner';
import { Sketcher } from './components/Sketcher';
import { StickerCreator } from './components/StickerCreator';
import { TextPrompter } from './components/TextPrompter';
import { ThemeToggleButton } from './components/ThemeToggleButton';
import { VideoCreator } from './components/VideoCreator';


const App = () => {
    const [apiKey, setApiKey] = useState<string | null>(() => sessionStorage.getItem('gemini-api-key'));
    const [mode, setMode] = useState<Mode>('image');
    const [style, setStyle] = useState<GenerationStyle>('realistic');
    const [prompt, setPrompt] = useState('');
    const [topic, setTopic] = useState('');
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);
    const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);
    const [generatedVideo, setGeneratedVideo] = useState<string | null>(null);
    const [originalImageForComparison, setOriginalImageForComparison] = useState<string | null>(null);
    const [flashcards, setFlashcards] = useState<FlashcardType[] | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState("Our AI is bringing your idea to life... this may take a moment.");
    const [error, setError] = useState<string | null>(null);
    const [theme, setTheme] = useState(() => {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme) return savedTheme;
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    });

    // New state for the image editor
    const [isEditing, setIsEditing] = useState(false);
    const [imageToEdit, setImageToEdit] = useState<string | null>(null);

    const sketcherRef = useRef<{ getCanvasData: () => string | null }>(null);

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
    }, [theme]);

    const getAiClient = () => {
        if (!apiKey) {
            const err = "API Key is not set. Please set it to continue.";
            setError(err);
            throw new Error(err);
        }
        return new GoogleGenAI({ apiKey });
    };

    const toggleTheme = () => {
        setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
    };

    const handleApiKeySubmit = (key: string) => {
        sessionStorage.setItem('gemini-api-key', key);
        setApiKey(key);
    };

    const handleClearApiKey = () => {
        sessionStorage.removeItem('gemini-api-key');
        setApiKey(null);
    };

    const toBase64 = (file: File): Promise<string> => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = error => reject(error);
    });

    const getStyleInstruction = (baseAction: string, selectedStyle: GenerationStyle): string => {
        switch (selectedStyle) {
            case 'realistic':
                return `${baseAction} in a highly detailed, photorealistic style.`;
            case 'abstract':
                return `${baseAction} in a whimsical, abstract style with flowing lines and imaginative shapes.`;
            case 'cartoon':
                return `${baseAction} in a fun, bold cartoon style, similar to a classic animated character.`;
            case 'branded':
                return `${baseAction} in a clean, minimalist vector art style, like a modern brand illustration.`;
            default:
                return baseAction;
        }
    };

    const handleApiResponse = (response: any) => {
        let imageFound = false;
        if (response.candidates?.[0]?.content?.parts) {
            for (const part of response.candidates[0].content.parts) {
                if (part.inlineData) {
                    const base64ImageBytes = part.inlineData.data;
                    const mimeType = part.inlineData.mimeType;
                    const imageUrl = `data:${mimeType};base64,${base64ImageBytes}`;
                    setGeneratedImage(imageUrl);
                    imageFound = true;
                    break;
                }
            }
        }
        if (!imageFound) {
            throw new Error("AI did not return a valid image. Please try again.");
        }
    };
    
    const callApiWithParts = async (model: string, parts: any[], config: any) => {
        setIsLoading(true);
        setLoadingMessage("Our AI is working its magic... this may take a moment.");
        setError(null);
        setGeneratedImage(null);
        setGeneratedVideo(null);
        try {
            const ai = getAiClient();
            const response = await ai.models.generateContent({
                model,
                contents: { parts },
                config,
            });
            handleApiResponse(response);
        } catch (err) {
            console.error(err);
            setError(`Failed to generate the image: ${err.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const callGeminiForImageEditing = async (imageWithTransparency: string, editPrompt: string) => {
        const getBase64 = (dataUrl: string) => dataUrl.split(',')[1];
        const getMimeType = (dataUrl: string) => dataUrl.substring(dataUrl.indexOf(":") + 1, dataUrl.indexOf(";"));

        const imagePart = {
            inlineData: {
                mimeType: getMimeType(imageWithTransparency),
                data: getBase64(imageWithTransparency)
            }
        };
        const fullPrompt = `Carefully analyze the provided image. A specific area has been made transparent. Your task is to inpaint this transparent region based on the following instruction, ensuring the result is seamless and high-quality: "${editPrompt}"`;
        const textPart = { text: fullPrompt };

        await callApiWithParts('gemini-2.5-flash-image-preview', [imagePart, textPart], { responseModalities: [Modality.IMAGE, Modality.TEXT] });
        setIsEditing(false); // Exit editing mode on success
    };

    
    const callGeminiForImageToImage = async (file: File, artStyle: ImageArtStyle) => {
        if (imagePreviewUrl) {
            setOriginalImageForComparison(imagePreviewUrl);
        }
        const base64Data = await toBase64(file);
        const imagePart = { inlineData: { mimeType: file.type, data: base64Data } };
        
        let styleInstruction = '';
        switch (artStyle) {
            case 'Sci-Fi':
                styleInstruction = 'in a futuristic sci-fi art style, with sleek lines, cybernetic details, and holographic elements.';
                break;
            case 'Chibi':
                styleInstruction = 'in an adorable chibi art style, with large expressive eyes, a small body, and exaggerated cute features.';
                break;
            case 'Anime':
                styleInstruction = 'in a classic Japanese anime/manga style, featuring dynamic lines, distinct facial expressions, and stylized hair.';
                break;
            case 'Cartoon':
                styleInstruction = 'in a fun, bold cartoon style, similar to a classic animated character with simple shapes and clear outlines.';
                break;
            case 'Fantasy':
                 styleInstruction = 'in a high-fantasy art style, with epic and magical elements, ornate details, and mythical creature features.';
                 break;
            case 'Cyberpunk':
                 styleInstruction = 'in a gritty, neon-soaked cyberpunk style, featuring futuristic technology, dystopian vibes, and cybernetic enhancements.';
                 break;
            case 'Steampunk':
                 styleInstruction = 'in a steampunk style, incorporating Victorian aesthetics with industrial steam-powered machinery, cogs, and gears.';
                 break;
            case 'Vintage Comic':
                 styleInstruction = 'in a retro comic book style, using dot shading (Ben-Day dots), bold ink outlines, and a classic Silver Age look.';
                 break;
        }

        const promptText = `Convert this photo into a black and white, line-art coloring book page. Reinterpret the subject ${styleInstruction} Ensure the lines are bold and clear for easy coloring, with no shading or gradients, and a clean white background.`;
        const textPart = { text: promptText };
        
        callApiWithParts('gemini-2.5-flash-image-preview', [imagePart, textPart], { responseModalities: [Modality.IMAGE, Modality.TEXT] });
    };
    
    const callGeminiForSketchToImage = async (sketchDataUrl: string, selectedStyle: GenerationStyle) => {
        const base64Data = sketchDataUrl.split(',')[1];
        const imagePart = { inlineData: { mimeType: 'image/png', data: base64Data } };
        const textPart = { text: getStyleInstruction("Transform this sketch into a crisp, detailed, and high-quality image", selectedStyle) };

        callApiWithParts('gemini-2.5-flash-image-preview', [imagePart, textPart], { responseModalities: [Modality.IMAGE, Modality.TEXT] });
    };

    const callGeminiForTextToImage = async (textPrompt: string, selectedStyle: GenerationStyle) => {
        if (!textPrompt) {
            setError('A text description is required to generate a coloring page.');
            return;
        }
        setIsLoading(true);
        setLoadingMessage("Our AI is creating your coloring page...");
        setError(null);
        setGeneratedImage(null);
        setGeneratedVideo(null);
        setOriginalImageForComparison(null);

        try {
            const ai = getAiClient();
            const basePrompt = `A black and white, line-art coloring book page of: "${textPrompt}". The image should have bold, clear, thick outlines suitable for coloring, with no shading or gradients, and a clean white background.`;
            const fullPrompt = getStyleInstruction(basePrompt, selectedStyle);
            
            const response = await ai.models.generateImages({
                model: 'imagen-4.0-generate-001',
                prompt: fullPrompt,
                config: { numberOfImages: 1, outputMimeType: 'image/png', aspectRatio: '1:1' },
            });

            if (response.generatedImages?.[0]?.image.imageBytes) {
                const base64ImageBytes = response.generatedImages[0].image.imageBytes;
                const imageUrl = `data:image/png;base64,${base64ImageBytes}`;
                setGeneratedImage(imageUrl);
            } else {
                throw new Error("AI could not generate an image for this prompt. Please try a different one.");
            }

        } catch (err) {
            console.error(err);
            setError(`Failed to generate coloring page: ${err.message}`);
        } finally {
            setIsLoading(false);
        }
    };
    
    const callGeminiForStickerFromText = async (textPrompt: string, selectedStyle: GenerationStyle) => {
        if (!textPrompt) {
            setError('A text description is required to generate a sticker.');
            return;
        }
        setIsLoading(true);
        setLoadingMessage("Generating your custom sticker...");
        setError(null);
        setGeneratedImage(null);
        setGeneratedVideo(null);
        setOriginalImageForComparison(null);

        try {
            const ai = getAiClient();
            const basePrompt = `a vibrant, die-cut sticker of: "${textPrompt}"`;
            const styledPrompt = getStyleInstruction(basePrompt, selectedStyle);
            const fullPrompt = `${styledPrompt}. The sticker must have a clean, thick white border and a subtle drop shadow to make it pop. The background must be transparent.`;

            const response = await ai.models.generateImages({
                model: 'imagen-4.0-generate-001',
                prompt: fullPrompt,
                config: { numberOfImages: 1, outputMimeType: 'image/png', aspectRatio: '1:1' },
            });
            if (response.generatedImages?.[0]?.image.imageBytes) {
                const base64ImageBytes = response.generatedImages[0].image.imageBytes;
                const imageUrl = `data:image/png;base64,${base64ImageBytes}`;
                setGeneratedImage(imageUrl);
            } else {
                throw new Error("AI could not generate a sticker for this prompt. Please try a different one.");
            }
        } catch (err) {
            console.error(err);
            setError(`Failed to generate sticker: ${err.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const callGeminiForStickerFromImage = async (file: File, selectedStyle: GenerationStyle, previewUrl: string) => {
        setOriginalImageForComparison(previewUrl);
        
        const base64Data = await toBase64(file);
        const imagePart = { inlineData: { mimeType: file.type, data: base64Data } };
        
        const basePrompt = "Analyze the provided image to identify its primary subject. Create a high-quality, die-cut sticker based *only* on this main subject.";
        const stylePrompt = getStyleInstruction("Reimagine the subject", selectedStyle);
        const fullPrompt = `${basePrompt} ${stylePrompt}. The sticker should be vibrant and visually appealing. Isolate the subject perfectly from its background, add a clean and prominent white die-cut border around it, and apply a subtle drop shadow for a 3D effect. The final output must be a PNG image with a fully transparent background.`;

        const textPart = { text: fullPrompt };
        
        callApiWithParts('gemini-2.5-flash-image-preview', [imagePart, textPart], { responseModalities: [Modality.IMAGE, Modality.TEXT] });
    };

    const callGeminiForFlashcards = async (topic: string, selectedStyle: GenerationStyle) => {
        if (!topic) {
            setError('A topic is required to generate flashcards.');
            return;
        }
        setIsLoading(true);
        setError(null);
        setFlashcards(null);
        const ai = getAiClient();

        try {
            setLoadingMessage('Generating flashcard questions and answers...');
            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: `Create a set of 8-10 flashcards for the topic: "${topic}". The flashcards should be clear and concise, suitable for studying.`,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            flashcards: {
                                type: Type.ARRAY,
                                description: "A list of flashcards.",
                                items: {
                                    type: Type.OBJECT,
                                    properties: {
                                        front: { type: Type.STRING, description: 'The front of the flashcard (term or question).' },
                                        back: { type: Type.STRING, description: 'The back of the flashcard (definition or answer).' }
                                    },
                                    required: ["front", "back"]
                                },
                            },
                        },
                        required: ["flashcards"],
                    },
                },
            });
            
            const jsonStr = response.text.trim();
            const parsed = JSON.parse(jsonStr);
            const textFlashcards = parsed.flashcards;

            if (!textFlashcards || textFlashcards.length === 0) {
                throw new Error("AI did not return valid flashcard data. Please try a different topic.");
            }

            setLoadingMessage('Creating colorful illustrations for each card...');

            const flashcardsWithImages = await Promise.all(
                textFlashcards.map(async (card: {front: string, back: string}) => {
                    const imagePrompt = getStyleInstruction(`A vibrant, simple, and colorful illustration for a flashcard about: "${card.front}"`, selectedStyle) + " on a clean white background.";
                    const imageResponse = await ai.models.generateImages({
                        model: 'imagen-4.0-generate-001',
                        prompt: imagePrompt,
                        config: { numberOfImages: 1, outputMimeType: 'image/png', aspectRatio: '1:1' },
                    });

                    if (imageResponse.generatedImages?.[0]?.image.imageBytes) {
                        const base64ImageBytes = imageResponse.generatedImages[0].image.imageBytes;
                        const imageUrl = `data:image/png;base64,${base64ImageBytes}`;
                        return { ...card, image: imageUrl };
                    }
                    // In case of image generation failure, return card without image
                    return { ...card, image: '' }; 
                })
            );
            
            setFlashcards(flashcardsWithImages.filter(card => card.image));

        } catch (err) {
            console.error(err);
            setError(`Failed to generate flashcards: ${err.message}`);
        } finally {
            setIsLoading(false);
        }
    };
    
    const callGeminiForVideo = async (prompt: string, file: File | null) => {
        if (!prompt) {
            setError("A text prompt is required to generate a video.");
            return;
        }
        setIsLoading(true);
        setError(null);
        handleReset();

        try {
            const ai = getAiClient();
            let requestPayload: any = {
                model: 'veo-2.0-generate-001',
                prompt: prompt,
                config: { numberOfVideos: 1 }
            };

            if (file) {
                setLoadingMessage("Preparing your image for the video model...");
                const base64Data = await toBase64(file);
                requestPayload.image = {
                    imageBytes: base64Data,
                    mimeType: file.type,
                };
            }

            setLoadingMessage("Sending request to the video model...");
            let operation = await ai.models.generateVideos(requestPayload);

            const pollingMessages = [
                "Your video is in the queue...",
                "AI is warming up the cameras...",
                "Generating initial frames...",
                "This can take a few minutes, please be patient...",
                "Stitching the scenes together...",
                "Applying final touches and rendering..."
            ];
            let messageIndex = 0;
            setLoadingMessage(pollingMessages[messageIndex]);

            while (!operation.done) {
                await new Promise(resolve => setTimeout(resolve, 10000)); // Poll every 10 seconds
                messageIndex = (messageIndex + 1) % pollingMessages.length;
                setLoadingMessage(pollingMessages[messageIndex]);
                operation = await ai.operations.getVideosOperation({ operation: operation });
            }

            const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;

            if (downloadLink) {
                setLoadingMessage("Finalizing your video...");
                const response = await fetch(`${downloadLink}&key=${apiKey}`);
                if (!response.ok) {
                    throw new Error(`Failed to download video file. Status: ${response.status}`);
                }
                const videoBlob = await response.blob();
                const videoUrl = URL.createObjectURL(videoBlob);
                setGeneratedVideo(videoUrl);
            } else {
                throw new Error("Video generation failed or did not return a valid link.");
            }

        } catch (err) {
            console.error(err);
            setError(`Failed to generate video: ${err.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleInspirationClick = (inspirationPrompt: string) => {
        setPrompt(inspirationPrompt);
        callGeminiForTextToImage(inspirationPrompt, style);
    };

    const handleReset = () => {
        setUploadedFile(null);
        setImagePreviewUrl(null);
        setGeneratedImage(null);
        setGeneratedVideo(null);
        setOriginalImageForComparison(null);
        setFlashcards(null);
        setPrompt('');
        setTopic('');
        setError(null);
        setIsLoading(false);
        setIsEditing(false);
        setImageToEdit(null);
    };
    
    const handleDownload = () => {
        if (!generatedImage) return;
        const link = document.createElement('a');
        link.href = generatedImage;
        link.download = `ai_generated_image.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleDownloadVideo = () => {
        if (!generatedVideo) return;
        const link = document.createElement('a');
        link.href = generatedVideo;
        link.download = `ai_generated_video.mp4`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleDownloadAllFlashcards = () => {
        if (!flashcards) return;
        flashcards.forEach((card, index) => {
            if (card.image) {
                setTimeout(() => {
                    const link = document.createElement('a');
                    link.href = card.image;
                    const sanitizedFront = card.front.replace(/[^a-z0-9]/gi, '_').toLowerCase().substring(0, 20);
                    link.download = `flashcard_${index + 1}_${sanitizedFront}.png`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                }, index * 300); // Stagger downloads to prevent browser blocking
            }
        });
    };

    const handleFileChange = (file: File) => {
      if (file && file.type.startsWith('image/')) {
        setUploadedFile(file);
        setImagePreviewUrl(URL.createObjectURL(file));
        setError(null);
      } else {
        setError('Please upload a valid image file. Accepted formats are PNG, JPG, and WebP.');
      }
    };

    const handleModeChange = (newMode: Mode) => {
        if (mode !== newMode) {
            setMode(newMode);
            handleReset();
        }
    };
    
    const handleStartEditing = () => {
        if (generatedImage) {
            setImageToEdit(generatedImage);
            setOriginalImageForComparison(generatedImage); // Set current image as 'before'
            setIsEditing(true);
        }
    };

    const handleCancelEditing = () => {
        setIsEditing(false);
        setImageToEdit(null);
        // Keep the generatedImage and originalImageForComparison as they were
    };


    const hasResult = generatedImage || flashcards || generatedVideo;

    const renderContent = () => {
        if (isLoading) {
            return <LoadingSpinner message={loadingMessage} />;
        }
        if (isEditing && imageToEdit) {
            return (
                <ImageEditor
                    imageSrc={imageToEdit}
                    onApplyEdit={callGeminiForImageEditing}
                    onCancel={handleCancelEditing}
                    isLoading={isLoading}
                />
            );
        }
        if (error) {
            return <p className="error-message">{error}</p>;
        }
        if (hasResult) {
            return (
               <div className="result-container">
                    {originalImageForComparison && generatedImage ? (
                        <ComparisonViewer originalSrc={originalImageForComparison} generatedSrc={generatedImage} />
                    ) : generatedImage ? (
                        <GeneratedImage imageSrc={generatedImage} />
                    ) : null}

                    {generatedVideo && (
                        <div className="video-player-container">
                            <video src={generatedVideo} controls className="generated-video" />
                        </div>
                    )}

                    {flashcards && <FlashcardViewer flashcards={flashcards} />}
                    <div className="actions-container">
                        {generatedImage && <button onClick={handleDownload} className="action-button primary">Download Image</button>}
                        {generatedVideo && <button onClick={handleDownloadVideo} className="action-button primary">Download Video</button>}
                        {generatedImage && <button onClick={handleStartEditing} className="action-button">Edit Image</button>}
                        {flashcards && <button onClick={handleDownloadAllFlashcards} className="action-button primary">Download All Flashcards</button>}
                        <button onClick={handleReset} className="action-button">Start Over</button>
                    </div>
                </div>
            );
        }
        // Initial view with mode switchers
        return (
            <>
                <div className="mode-switcher">
                    <button className={`mode-button ${mode === 'image' ? 'active' : ''}`} onClick={() => handleModeChange('image')}>From Image</button>
                    <button className={`mode-button ${mode === 'text' ? 'active' : ''}`} onClick={() => handleModeChange('text')}>From Text</button>
                    <button className={`mode-button ${mode === 'sketch' ? 'active' : ''}`} onClick={() => handleModeChange('sketch')}>From Sketch</button>
                    <button className={`mode-button ${mode === 'sticker' ? 'active' : ''}`} onClick={() => handleModeChange('sticker')}>Sticker</button>
                    <button className={`mode-button ${mode === 'flashcard' ? 'active' : ''}`} onClick={() => handleModeChange('flashcard')}>Flashcard</button>
                    <button className={`mode-button ${mode === 'video' ? 'active' : ''}`} onClick={() => handleModeChange('video')}>Video</button>
                </div>
                
                {mode === 'image' && (
                    <ImageUploader 
                        onFileChange={handleFileChange}
                        imagePreviewUrl={imagePreviewUrl}
                        hasFile={!!uploadedFile}
                        onGenerate={(artStyle) => uploadedFile && callGeminiForImageToImage(uploadedFile, artStyle)}
                    />
                )}
                {mode === 'text' && (
                    <TextPrompter 
                        apiKey={apiKey!}
                        prompt={prompt}
                        onPromptChange={(e) => setPrompt(e.target.value)}
                        onGenerate={() => callGeminiForTextToImage(prompt, style)}
                        onInspirationClick={handleInspirationClick}
                        selectedStyle={style}
                        onStyleChange={setStyle}
                        setIsLoading={setIsLoading}
                        setLoadingMessage={setLoadingMessage}
                        setError={setError}
                    />
                )}
                {mode === 'sketch' && (
                    <Sketcher ref={sketcherRef} onGenerate={() => {
                        const sketchData = sketcherRef.current?.getCanvasData();
                        if (sketchData) {
                            callGeminiForSketchToImage(sketchData, style);
                        } else {
                            setError('Please draw something on the canvas first.');
                        }
                    }} 
                    selectedStyle={style}
                    onStyleChange={setStyle}
                    />
                )}
                {mode === 'sticker' && (
                    <StickerCreator
                        apiKey={apiKey!}
                        prompt={prompt}
                        onPromptChange={(e) => setPrompt(e.target.value)}
                        onGenerateFromText={(p) => callGeminiForStickerFromText(p, style)}
                        onGenerateFromImage={(f, url) => callGeminiForStickerFromImage(f, style, url)}
                        setError={setError}
                        selectedStyle={style}
                        onStyleChange={setStyle}
                        setIsLoading={setIsLoading}
                        setLoadingMessage={setLoadingMessage}
                    />
                )}
                {mode === 'flashcard' && (
                    <FlashcardCreator 
                        apiKey={apiKey!}
                        topic={topic}
                        onGenerate={(topic) => callGeminiForFlashcards(topic, style)}
                        onTopicChange={(e) => setTopic(e.target.value)}
                        selectedStyle={style}
                        onStyleChange={setStyle}
                        setIsLoading={setIsLoading}
                        setLoadingMessage={setLoadingMessage}
                        setError={setError}
                    />
                )}
                {mode === 'video' && (
                    <VideoCreator 
                        prompt={prompt}
                        onPromptChange={(e) => setPrompt(e.target.value)}
                        onGenerate={callGeminiForVideo}
                        setError={setError}
                    />
                )}
            </>
        );
    };

    const renderApp = () => {
         if (!apiKey) {
            return (
                <div className="main-content">
                    <ApiKeyManager onKeySubmit={handleApiKeySubmit} />
                </div>
            );
        }
        return (
             <main className="main-content">
                {renderContent()}
            </main>
        );
    }

    return (
        <div className="app-container">
            <header className="header">
                 <div className="header-content">
                    <h1>AI Creative Suite</h1>
                    <p>Generate images, videos, stickers, and flashcards. Then, edit them with AI.</p>
                </div>
                <div className="header-actions">
                    {apiKey && <button onClick={handleClearApiKey} className="action-button">Clear Key</button>}
                    <ThemeToggleButton theme={theme} onClick={toggleTheme} />
                </div>
            </header>
            {renderApp()}
        </div>
    );
};

const container = document.getElementById('root');
const root = createRoot(container);
root.render(<App />);