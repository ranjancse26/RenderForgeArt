import React from 'react';

export const LoadingSpinner = ({ message }: { message: string }) => (
    <div className="loading-container" aria-label="Generating">
        <div className="spinner"></div>
        <p>{message}</p>
    </div>
);