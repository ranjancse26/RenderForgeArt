import React, { useRef, useEffect, useState } from 'react';
import { StyleSelector } from './StyleSelector';
import { styles, GenerationStyle } from '../types';

interface SketcherProps {
    onGenerate: () => void;
    selectedStyle: GenerationStyle;
    onStyleChange: (style: GenerationStyle) => void;
}

export const Sketcher = React.forwardRef<{ getCanvasData: () => string | null }, SketcherProps>(({ onGenerate, selectedStyle, onStyleChange }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const contextRef = useRef<CanvasRenderingContext2D | null>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [brushColor, setBrushColor] = useState('#000000');
    const [brushSize, setBrushSize] = useState(5);
    const [tool, setTool] = useState<'pen' | 'eraser'>('pen');
    const [isDirty, setIsDirty] = useState(false);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const context = canvas.getContext('2d');
        if (!context) return;
        context.lineCap = 'round';
        context.lineJoin = 'round';
        contextRef.current = context;
    }, []);

    const startDrawing = ({ nativeEvent }) => {
        const { offsetX, offsetY } = nativeEvent;
        contextRef.current?.beginPath();
        contextRef.current?.moveTo(offsetX, offsetY);
        setIsDrawing(true);
        setIsDirty(true);
    };

    const stopDrawing = () => {
        contextRef.current?.closePath();
        setIsDrawing(false);
    };

    const draw = ({ nativeEvent }) => {
        if (!isDrawing) return;
        const { offsetX, offsetY } = nativeEvent;
        contextRef.current.lineWidth = brushSize;
        contextRef.current.strokeStyle = tool === 'pen' ? brushColor : '#FFFFFF';
        contextRef.current?.lineTo(offsetX, offsetY);
        contextRef.current?.stroke();
    };

    const clearCanvas = () => {
        const canvas = canvasRef.current;
        if (canvas && contextRef.current) {
            contextRef.current.clearRect(0, 0, canvas.width, canvas.height);
            setIsDirty(false);
        }
    };

    React.useImperativeHandle(ref, () => ({
        getCanvasData: () => {
            if (!isDirty || !canvasRef.current) return null;
            return canvasRef.current.toDataURL('image/png');
        }
    }));

    return (
        <div className="sketcher-container">
            <canvas
                ref={canvasRef}
                width="500"
                height="500"
                className="sketch-canvas"
                onMouseDown={startDrawing}
                onMouseUp={stopDrawing}
                onMouseMove={draw}
                onMouseLeave={stopDrawing}
            />
            <div className="sketch-toolbar">
                <div className="tool-group">
                    <label htmlFor="colorPicker">Color:</label>
                    <input type="color" id="colorPicker" className="color-picker" value={brushColor} onChange={(e) => { setBrushColor(e.target.value); setTool('pen'); }} />
                </div>
                 <div className="tool-group">
                    <label htmlFor="brushSize">Size:</label>
                    <input type="range" id="brushSize" className="brush-slider" min="1" max="50" value={brushSize} onChange={(e) => setBrushSize(Number(e.target.value))} />
                </div>
                <div className="tool-group">
                    <button className={`tool-button ${tool === 'pen' ? 'active' : ''}`} onClick={() => setTool('pen')} title="Pen">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125" /></svg>
                    </button>
                    <button className={`tool-button ${tool === 'eraser' ? 'active' : ''}`} onClick={() => setTool('eraser')} title="Eraser">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M5.25 7.5A2.25 2.25 0 0 1 7.5 5.25h9a2.25 2.25 0 0 1 2.25 2.25v9a2.25 2.25 0 0 1-2.25 2.25h-9a2.25 2.25 0 0 1-2.25-2.25v-9Z" /></svg>
                    </button>
                     <button className="tool-button" onClick={clearCanvas} title="Clear Canvas">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.134-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.067-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg>
                    </button>
                </div>
            </div>
            <StyleSelector title="Choose a style:" styles={styles} selectedStyle={selectedStyle} onStyleChange={onStyleChange} />
            <button onClick={onGenerate} className="generate-button" disabled={!isDirty}>
              Generate Image
            </button>
        </div>
    );
});