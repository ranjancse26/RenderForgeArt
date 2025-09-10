import React, { useState, useRef, useEffect } from 'react';
import { StyleSelector } from './StyleSelector';
import { VoiceRecorder } from './VoiceRecorder';
import { styles, GenerationStyle, StickerSource } from '../types';

interface StickerCreatorProps {
    prompt: string;
    onPromptChange: (e: React.ChangeEvent<HTMLTextAreaElement> | {target: {value: string}}) => void;
    onGenerateFromText: (prompt: string) => void;
    onGenerateFromImage: (file: File, url: string) => void;
    setError: (error: string | null) => void;
    selectedStyle: GenerationStyle;
    onStyleChange: (style: GenerationStyle) => void;
    setIsLoading: (isLoading: boolean) => void;
    setLoadingMessage: (message: string) => void;
    apiKey: string;
}

export const StickerCreator = ({ apiKey, onGenerateFromText, prompt, onPromptChange, onGenerateFromImage, setError, selectedStyle, onStyleChange, setIsLoading, setLoadingMessage }: StickerCreatorProps) => {
    const [stickerMode, setStickerMode] = useState<StickerSource>('text');
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);
    const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isDragging, setIsDragging] = useState(false);

    useEffect(() => {
        setUploadedFile(null);
        setImagePreviewUrl(null);
        setError(null);
    }, [stickerMode]);

    const handleFileChange = (file: File) => {
        if (file && file.type.startsWith('image/')) {
            setUploadedFile(file);
            setImagePreviewUrl(URL.createObjectURL(file));
            setError(null);
        } else {
            setError('Please upload a valid image file. Accepted formats are PNG, JPG, and WebP.');
        }
    };
    
    const handleDragEnter = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); };
    const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); };
    const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); };
    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault(); e.stopPropagation(); setIsDragging(false);
        if (e.dataTransfer.files?.[0]) {
            handleFileChange(e.dataTransfer.files[0]);
            e.dataTransfer.clearData();
        }
    };
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) handleFileChange(e.target.files[0]);
    };
    
    const handleGenerate = () => {
        if (stickerMode === 'text') {
            onGenerateFromText(prompt);
        } else if (stickerMode === 'image' && uploadedFile && imagePreviewUrl) {
            onGenerateFromImage(uploadedFile, imagePreviewUrl);
        }
    };

    return (
        <div className="sticker-creator-container">
            <div className="sub-mode-switcher">
                <button className={`sub-mode-button ${stickerMode === 'text' ? 'active' : ''}`} onClick={() => setStickerMode('text')}>From Text</button>
                <button className={`sub-mode-button ${stickerMode === 'image' ? 'active' : ''}`} onClick={() => setStickerMode('image')}>From Photo</button>
            </div>

            {stickerMode === 'text' && (
                 <div className="prompt-textarea-wrapper">
                    <textarea
                        className="prompt-textarea"
                        placeholder="e.g., A happy avocado, a retro robot, a cat wearing sunglasses..."
                        value={prompt}
                        onChange={onPromptChange}
                    />
                    <VoiceRecorder 
                        apiKey={apiKey}
                        onTranscription={(text) => onPromptChange({ target: { value: prompt ? `${prompt} ${text}` : text } })}
                        setIsLoading={setIsLoading}
                        setLoadingMessage={setLoadingMessage}
                        setError={setError}
                    />
                </div>
            )}

            {stickerMode === 'image' && (
                !imagePreviewUrl ? (
                  <>
                    <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept="image/png, image/jpeg, image/webp" style={{ display: 'none' }} />
                    <div
                      className={`drop-zone ${isDragging ? 'drag-over' : ''}`}
                      onClick={() => fileInputRef.current?.click()}
                      onDrop={handleDrop} onDragOver={handleDragOver} onDragEnter={handleDragEnter} onDragLeave={handleDragLeave}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l-3.75 3.75M12 9.75l3.75 3.75M3 17.25V6.75A2.25 2.25 0 015.25 4.5h13.5A2.25 2.25 0 0121 6.75v10.5A2.25 2.25 0 0118.75 19.5H5.25A2.25 2.25 0 013 17.25z" /></svg>
                      <p>Drag & drop your photo here or <strong>browse files</strong></p>
                    </div>
                  </>
                ) : (
                  <div className="image-preview-container"><img src={imagePreviewUrl} alt="Uploaded preview" className="image-preview" /></div>
                )
            )}
            
            <StyleSelector title="Choose a style:" styles={styles} selectedStyle={selectedStyle} onStyleChange={onStyleChange} />

            <button 
                className="generate-button" 
                onClick={handleGenerate} 
                disabled={(stickerMode === 'text' && !prompt) || (stickerMode === 'image' && !uploadedFile)}
            >
                Generate Sticker
            </button>
        </div>
    );
};