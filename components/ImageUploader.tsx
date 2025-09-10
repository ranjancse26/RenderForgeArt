import React, { useRef, useState } from 'react';
import { StyleSelector } from './StyleSelector';
import { imageArtStyles, ImageArtStyle } from '../types';

interface ImageUploaderProps {
    onFileChange: (file: File) => void;
    onGenerate: (artStyle: ImageArtStyle) => void;
    imagePreviewUrl: string | null;
    hasFile: boolean;
}

export const ImageUploader = ({ onFileChange, onGenerate, imagePreviewUrl, hasFile }: ImageUploaderProps) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [selectedArtStyle, setSelectedArtStyle] = useState<ImageArtStyle>(imageArtStyles[0]);

    const handleDragEnter = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); };
    const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); };
    const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); };
    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        if (e.dataTransfer.files?.[0]) {
            onFileChange(e.dataTransfer.files[0]);
            e.dataTransfer.clearData();
        }
    };
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
            onFileChange(e.target.files[0]);
        }
    };

    return (
      <div className="uploader-container">
        {!imagePreviewUrl ? (
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
          <>
            <div className="image-preview-container"><img src={imagePreviewUrl} alt="Uploaded preview" className="image-preview" /></div>
            {/* Fix: The state setter from useState has a broader type than the onStyleChange prop expects. Wrapping it in a lambda ensures the types match. */}
            <StyleSelector title="Choose an art style:" styles={imageArtStyles} selectedStyle={selectedArtStyle} onStyleChange={(style) => setSelectedArtStyle(style)} />
            <button onClick={() => onGenerate(selectedArtStyle)} className="generate-button" disabled={!hasFile}>Generate Coloring Page</button>
          </>
        )}
      </div>
    );
};