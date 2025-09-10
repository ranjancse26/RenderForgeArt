import React, { useState } from 'react';

interface ApiKeyManagerProps {
    onKeySubmit: (key: string) => void;
}

export const ApiKeyManager = ({ onKeySubmit }: ApiKeyManagerProps) => {
    const [key, setKey] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (key.trim()) {
            onKeySubmit(key.trim());
        }
    };

    return (
        <div className="api-key-manager">
            <h2>Enter Your Google Gemini API Key</h2>
            <p>To use this application, you need to provide your own API key. Your key will be stored in session storage and will not be sent to any server besides Google's.</p>
            <form onSubmit={handleSubmit} className="api-key-form">
                <input
                    type="password"
                    value={key}
                    onChange={(e) => setKey(e.target.value)}
                    placeholder="Enter your API key"
                    className="api-key-input"
                    aria-label="Google Gemini API Key"
                />
                <button type="submit" className="generate-button" disabled={!key.trim()}>
                    Save and Continue
                </button>
            </form>
            <p className="api-key-info">
                You can get your API key from <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer">Google AI Studio</a>.
            </p>
        </div>
    );
};
