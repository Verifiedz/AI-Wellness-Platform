import { useState, useCallback, useEffect, useRef } from 'react';
import { Platform } from 'react-native';

let ExpoSpeechRecognitionModule = null;
let useSpeechRecognitionEvent = null;

try {
  const mod = require('expo-speech-recognition');
  ExpoSpeechRecognitionModule = mod.ExpoSpeechRecognitionModule;
  useSpeechRecognitionEvent = mod.useSpeechRecognitionEvent;
} catch {
  // Package not available (e.g. web or unsupported platform)
}

/**
 * Custom hook wrapping expo-speech-recognition.
 *
 * Returns { isAvailable, isListening, transcript, error, startListening, stopListening, resetTranscript }
 *
 * When the package is not installed or the platform doesn't support it,
 * isAvailable is false and the mic button should be hidden.
 */
export function useVoiceInput() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState(null);
  const isAvailable = ExpoSpeechRecognitionModule != null && Platform.OS !== 'web';
  const transcriptRef = useRef('');

  // Register event listeners when the module is available
  if (useSpeechRecognitionEvent) {
    useSpeechRecognitionEvent('start', () => {
      setIsListening(true);
      setError(null);
    });

    useSpeechRecognitionEvent('end', () => {
      setIsListening(false);
    });

    useSpeechRecognitionEvent('result', (event) => {
      const text = event.results?.[0]?.transcript ?? '';
      transcriptRef.current = text;
      setTranscript(text);
    });

    useSpeechRecognitionEvent('error', (event) => {
      setIsListening(false);
      // "no-speech" is not a real error, just means user didn't say anything
      if (event.error !== 'no-speech') {
        setError(event.message || 'Speech recognition failed');
      }
    });
  }

  const startListening = useCallback(async () => {
    if (!ExpoSpeechRecognitionModule) return;

    setError(null);
    setTranscript('');
    transcriptRef.current = '';

    const result = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
    if (!result.granted) {
      setError('Microphone permission denied');
      return;
    }

    ExpoSpeechRecognitionModule.start({
      lang: 'en-US',
      interimResults: true,
      continuous: false,
    });
  }, []);

  const stopListening = useCallback(() => {
    if (!ExpoSpeechRecognitionModule) return;
    ExpoSpeechRecognitionModule.stop();
  }, []);

  const resetTranscript = useCallback(() => {
    setTranscript('');
    transcriptRef.current = '';
  }, []);

  return {
    isAvailable,
    isListening,
    transcript,
    error,
    startListening,
    stopListening,
    resetTranscript,
  };
}
