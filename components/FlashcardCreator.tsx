import React, { useState } from 'react';
import { StyleSelector } from './StyleSelector';
import { VoiceRecorder } from './VoiceRecorder';
import { styles, GenerationStyle } from '../types';

interface FlashcardCreatorProps {
    topic: string;
    onGenerate: (topic: string) => void;
    onTopicChange: (e: React.ChangeEvent<HTMLTextAreaElement> | {target: {value: string}}) => void;
    selectedStyle: GenerationStyle;
    onStyleChange: (style: GenerationStyle) => void;
    setIsLoading: (isLoading: boolean) => void;
    setLoadingMessage: (message: string) => void;
    setError: (error: string | null) => void;
    apiKey: string;
}

export const FlashcardCreator = ({ apiKey, topic, onGenerate, onTopicChange, selectedStyle, onStyleChange, setIsLoading, setLoadingMessage, setError }: FlashcardCreatorProps) => {
    return (
        <div className="text-prompter-container">
            <div className="prompt-textarea-wrapper">
                <textarea
                    className="prompt-textarea"
                    placeholder="Enter a topic like 'The Solar System', 'JavaScript Fundamentals', or paste a block of text..."
                    value={topic}
                    onChange={onTopicChange}
                />
                 <VoiceRecorder 
                    apiKey={apiKey}
                    onTranscription={(text) => onTopicChange({ target: { value: topic ? `${topic} ${text}` : text } })}
                    setIsLoading={setIsLoading}
                    setLoadingMessage={setLoadingMessage}
                    setError={setError}
                />
            </div>
            <StyleSelector title="Choose a style:" styles={styles} selectedStyle={selectedStyle} onStyleChange={onStyleChange} />
            <button onClick={() => onGenerate(topic)} className="generate-button" disabled={!topic}>
                Generate Flashcards
            </button>
        </div>
    );
};
