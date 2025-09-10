import React, { useState } from 'react';
import { Flashcard as FlashcardType } from '../types';

const Flashcard = ({ card }: { card: FlashcardType }) => {
    const [isFlipped, setIsFlipped] = useState(false);
    return (
        <div className={`flashcard ${isFlipped ? 'is-flipped' : ''}`} onClick={() => setIsFlipped(!isFlipped)}>
            <div className="flashcard-inner">
                <div className="flashcard-front">
                    <img src={card.image} alt={`Illustration for ${card.front}`} className="flashcard-image" />
                    <p className="flashcard-front-text">{card.front}</p>
                </div>
                <div className="flashcard-back">
                    <p>{card.back}</p>
                </div>
            </div>
        </div>
    );
};

export const FlashcardViewer = ({ flashcards }: { flashcards: FlashcardType[] }) => {
    return (
        <div className="flashcard-viewer">
            {flashcards.map((card, index) => (
                <Flashcard key={index} card={card} />
            ))}
        </div>
    );
};