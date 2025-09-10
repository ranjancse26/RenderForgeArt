import React from 'react';
import { StyleSelector } from './StyleSelector';
import { VoiceRecorder } from './VoiceRecorder';
import { inspirationPrompts, styles, GenerationStyle } from '../types';

interface TextPrompterProps {
    prompt: string;
    onPromptChange: (e: React.ChangeEvent<HTMLTextAreaElement> | {target: {value: string}}) => void;
    onGenerate: () => void;
    onInspirationClick: (prompt: string) => void;
    selectedStyle: GenerationStyle;
    onStyleChange: (style: GenerationStyle) => void;
    setIsLoading: (isLoading: boolean) => void;
    setLoadingMessage: (message: string) => void;
    setError: (error: string | null) => void;
    apiKey: string;
}

export const TextPrompter = ({ apiKey, prompt, onPromptChange, onGenerate, onInspirationClick, selectedStyle, onStyleChange, setIsLoading, setLoadingMessage, setError }: TextPrompterProps) => (
    <div className="text-prompter-container">
        <div className="prompt-textarea-wrapper">
            <textarea
                className="prompt-textarea"
                placeholder="Type or use the mic to describe an image..."
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
        <StyleSelector title="Choose a style:" styles={styles} selectedStyle={selectedStyle} onStyleChange={onStyleChange} />
        <button onClick={onGenerate} className="generate-button" disabled={!prompt}>
            Generate Coloring Page
        </button>

        <div className="inspiration-container">
            <p className="inspiration-title">Need inspiration? Try one of these:</p>
            <div className="inspiration-grid">
                {inspirationPrompts.map(p => (
                    <button 
                        key={p} 
                        className="inspiration-button" 
                        onClick={() => onInspirationClick(p)}
                        aria-label={`Generate coloring page of ${p}`}
                    >
                        {p}
                    </button>
                ))}
            </div>
        </div>
    </div>
);