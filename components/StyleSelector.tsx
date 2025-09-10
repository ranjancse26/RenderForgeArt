import React from 'react';

interface StyleSelectorProps<T extends string> {
    title: string;
    styles: readonly T[] | T[];
    selectedStyle: T;
    onStyleChange: (style: T) => void;
}

export const StyleSelector = <T extends string>({ title, styles, selectedStyle, onStyleChange }: StyleSelectorProps<T>) => (
    <div className="style-selector-container">
        <p className="style-selector-title">{title}</p>
        <div className="style-buttons">
            {styles.map(style => (
                <button 
                    key={style}
                    className={`style-button ${selectedStyle === style ? 'active' : ''}`}
                    onClick={() => onStyleChange(style)}
                >
                    {style.charAt(0).toUpperCase() + style.slice(1)}
                </button>
            ))}
        </div>
    </div>
);