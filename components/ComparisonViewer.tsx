import React from 'react';

export const ComparisonViewer = ({ originalSrc, generatedSrc }: { originalSrc: string; generatedSrc: string }) => (
    <div className="comparison-container">
        <div className="comparison-item">
            <p className="comparison-label">Original</p>
            <div className="image-wrapper">
                 <img src={originalSrc} alt="Original user upload" className="comparison-image" />
            </div>
        </div>
        <div className="comparison-item">
            <p className="comparison-label">Generated</p>
             <div className="image-wrapper generated-bg">
                <img src={generatedSrc} alt="AI generated image" className="comparison-image" />
            </div>
        </div>
    </div>
);