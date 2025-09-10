import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";

interface VoiceRecorderProps {
    onTranscription: (text: string) => void;
    setIsLoading: (isLoading: boolean) => void;
    setLoadingMessage: (message: string) => void;
    setError: (error: string | null) => void;
    apiKey: string;
}

export const VoiceRecorder = ({ apiKey, onTranscription, setIsLoading, setLoadingMessage, setError }: VoiceRecorderProps) => {
    const [isRecording, setIsRecording] = useState(false);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);

    const handleToggleRecording = async () => {
        if (isRecording) {
            mediaRecorderRef.current?.stop();
            setIsRecording(false);
            return;
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const recorder = new MediaRecorder(stream);
            mediaRecorderRef.current = recorder;
            audioChunksRef.current = [];

            recorder.ondataavailable = (event) => {
                audioChunksRef.current.push(event.data);
            };

            recorder.onstop = async () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                stream.getTracks().forEach(track => track.stop());
                
                setIsLoading(true);
                setLoadingMessage("Transcribing your voice...");
                setError(null);
                
                try {
                    const toBase64 = (blob: Blob): Promise<string> => new Promise((resolve, reject) => {
                        const reader = new FileReader();
                        reader.readAsDataURL(blob);
                        reader.onload = () => resolve((reader.result as string).split(',')[1]);
                        reader.onerror = error => reject(error);
                    });

                    const base64Data = await toBase64(audioBlob);
                    
                    const ai = new GoogleGenAI({ apiKey });
                    const response = await ai.models.generateContent({
                        model: 'gemini-2.5-flash',
                        contents: { 
                            parts: [
                                { inlineData: { mimeType: audioBlob.type, data: base64Data } },
                                { text: "Transcribe the following audio recording accurately." }
                            ]
                        },
                    });
                    
                    const transcript = response.text.trim();
                    if (transcript) {
                        onTranscription(transcript);
                    } else {
                        throw new Error("Transcription failed or returned empty text.");
                    }
                } catch (err) {
                    console.error(err);
                    setError(`Transcription failed: ${err.message}`);
                } finally {
                    setIsLoading(false);
                }
            };
            
            recorder.start();
            setIsRecording(true);
        } catch (err) {
            console.error("Microphone access error:", err);
            setError("Microphone access is required for voice input. Please enable it in your browser settings.");
        }
    };
    
    useEffect(() => {
        return () => {
            if (mediaRecorderRef.current?.state === 'recording') {
                mediaRecorderRef.current.stop();
            }
        };
    }, []);

    return (
        <button
            onClick={handleToggleRecording}
            className={`voice-recorder-button ${isRecording ? 'is-recording' : ''}`}
            title={isRecording ? 'Stop Recording' : 'Start Recording'}
            aria-label={isRecording ? 'Stop voice recording' : 'Start voice recording'}
        >
            {isRecording ? (
                 <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M4.5 4.5a3 3 0 0 0-3 3v9a3 3 0 0 0 3 3h9a3 3 0 0 0 3-3v-9a3 3 0 0 0-3-3h-9Z" /></svg>
            ) : (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 0 1 6 0v8.25a3 3 0 0 1-3 3Z" /></svg>
            )}
        </button>
    );
};