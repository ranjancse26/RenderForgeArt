import React, { useRef, useEffect, useState } from 'react';

interface ImageEditorProps {
    imageSrc: string;
    onApplyEdit: (imageWithTransparency: string, prompt: string) => Promise<void>;
    onCancel: () => void;
    isLoading: boolean;
}

export const ImageEditor = ({ imageSrc, onApplyEdit, onCancel, isLoading }: ImageEditorProps) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const imageRef = useRef<HTMLImageElement>(null);
    const contextRef = useRef<CanvasRenderingContext2D | null>(null);

    const [isDrawing, setIsDrawing] = useState(false);
    const [brushSize, setBrushSize] = useState(30);
    const [tool, setTool] = useState<'brush' | 'eraser'>('brush');
    const [prompt, setPrompt] = useState('');
    const [isDirty, setIsDirty] = useState(false);

    useEffect(() => {
        const image = imageRef.current;
        const canvas = canvasRef.current;
        if (!image || !canvas) return;

        const handleImageLoad = () => {
            canvas.width = image.naturalWidth;
            canvas.height = image.naturalHeight;
            const context = canvas.getContext('2d');
            if (context) {
                context.lineCap = 'round';
                context.lineJoin = 'round';
                contextRef.current = context;
            }
        };

        if (image.complete) {
            handleImageLoad();
        } else {
            image.addEventListener('load', handleImageLoad);
        }

        return () => {
            image.removeEventListener('load', handleImageLoad);
        };
    }, [imageSrc]);

    const getCoords = (event: React.MouseEvent | React.TouchEvent) => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };
        const rect = canvas.getBoundingClientRect();
        const touch = 'touches' in event ? event.touches[0] : event;
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        return {
            x: (touch.clientX - rect.left) * scaleX,
            y: (touch.clientY - rect.top) * scaleY,
        };
    };

    const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
        const context = contextRef.current;
        if (!context) return;
        const { x, y } = getCoords(e);
        context.beginPath();
        context.moveTo(x, y);
        setIsDrawing(true);
        setIsDirty(true);
    };

    const stopDrawing = () => {
        const context = contextRef.current;
        if (!context) return;
        context.closePath();
        setIsDrawing(false);
    };

    const draw = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDrawing) return;
        const context = contextRef.current;
        if (!context) return;
        
        const { x, y } = getCoords(e);
        
        context.lineWidth = brushSize;
        context.globalCompositeOperation = tool === 'brush' ? 'source-over' : 'destination-out';
        context.strokeStyle = 'rgba(239, 68, 68, 0.7)'; // Semi-transparent red for visibility

        context.lineTo(x, y);
        context.stroke();
    };

    const clearCanvas = () => {
        const canvas = canvasRef.current;
        const context = contextRef.current;
        if (canvas && context) {
            context.clearRect(0, 0, canvas.width, canvas.height);
            setIsDirty(false);
        }
    };

    const handleApply = async () => {
        const maskCanvas = canvasRef.current;
        const image = imageRef.current;
        if (!maskCanvas || !image || !isDirty || !prompt) return;

        // Create an offscreen canvas to combine the image and mask
        const offscreenCanvas = document.createElement('canvas');
        offscreenCanvas.width = image.naturalWidth;
        offscreenCanvas.height = image.naturalHeight;
        const ctx = offscreenCanvas.getContext('2d');
        if (!ctx) return;

        // 1. Draw the original image
        ctx.drawImage(image, 0, 0);

        // 2. "Punch a hole" in the image using the mask
        ctx.globalCompositeOperation = 'destination-out';
        ctx.drawImage(maskCanvas, 0, 0);

        const imageWithTransparency = offscreenCanvas.toDataURL('image/png');
        await onApplyEdit(imageWithTransparency, prompt);
    };

    return (
        <div className="image-editor-container">
            <div className="image-editor-canvas-wrapper">
                <img
                    ref={imageRef}
                    src={imageSrc}
                    alt="Image to edit"
                    className="image-editor-source-image"
                    crossOrigin="anonymous" // Required for canvas operations
                />
                <canvas
                    ref={canvasRef}
                    className="image-editor-mask-canvas"
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                />
            </div>
            <div className="sketch-toolbar">
                 <div className="tool-group">
                    <button className={`tool-button ${tool === 'brush' ? 'active' : ''}`} onClick={() => setTool('brush')} title="Brush">
                         <svg xmlns="http://www.w.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125" /></svg>
                    </button>
                    <button className={`tool-button ${tool === 'eraser' ? 'active' : ''}`} onClick={() => setTool('eraser')} title="Eraser">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M5.25 7.5A2.25 2.25 0 0 1 7.5 5.25h9a2.25 2.25 0 0 1 2.25 2.25v9a2.25 2.25 0 0 1-2.25 2.25h-9a2.25 2.25 0 0 1-2.25-2.25v-9Z" /></svg>
                    </button>
                </div>
                <div className="tool-group">
                    <label htmlFor="brushSize">Brush Size:</label>
                    <input type="range" id="brushSize" className="brush-slider" min="5" max="100" value={brushSize} onChange={(e) => setBrushSize(Number(e.target.value))} />
                </div>
                <div className="tool-group">
                     <button className="tool-button" onClick={clearCanvas} title="Clear Mask">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.134-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.067-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg>
                    </button>
                </div>
            </div>
             <textarea
                className="image-editor-prompt"
                placeholder="Describe your edit... e.g., 'add a birthday hat', 'make the shirt blue', 'change background to a beach'"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
            />
             <div className="image-editor-actions">
                <button onClick={onCancel} className="action-button" disabled={isLoading}>
                    Cancel
                </button>
                <button onClick={handleApply} className="action-button primary" disabled={!isDirty || !prompt || isLoading}>
                    {isLoading ? 'Applying...' : 'Apply Edit'}
                </button>
            </div>
        </div>
    );
};
