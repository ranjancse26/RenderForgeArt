import React from 'react';

export const GeneratedImage = ({ imageSrc }: { imageSrc: string }) => {
    return (
        <div className="generated-image-container">
           <img src={imageSrc} alt="AI generated image" className="generated-image" />
        </div>
    );
};