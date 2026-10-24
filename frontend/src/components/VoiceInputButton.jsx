/**
 * frontend/src/components/VoiceInputButton.jsx
 *
 * SpeechRecognition Voice Dictation Button (Progressive Enhancement)
 * ─────────────────────────────────────────────────────────────────────────────
 * • Uses window.SpeechRecognition / window.webkitSpeechRecognition.
 * • Progressively enhanced: if unsupported in the browser, gracefully returns null (hidden).
 * • Respects active language: 'en' -> 'en-IN', 'hi' -> 'hi-IN', 'gu' -> 'gu-IN'.
 * • Animated pulsing microphone and audio wave ring while listening.
 * • Emits transcribed text through onResult callback for standard input resolution.
 */

import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { useT } from '../i18n/useT';

export default function VoiceInputButton({
  onResult,
  lang: propLang,
  className = '',
  title,
}) {
  const { lang: currentLang, t } = useT();
  const effectiveLang = propLang || currentLang || 'en';

  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const recognitionRef = useRef(null);

  useEffect(() => {
    const SpeechRecognition =
      typeof window !== 'undefined'
        ? window.SpeechRecognition || window.webkitSpeechRecognition
        : null;

    setIsSupported(Boolean(SpeechRecognition));
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {}
      }
    };
  }, []);

  // Progressive enhancement: hide if unsupported
  if (!isSupported) {
    return null;
  }

  const handleToggleListening = (e) => {
    e.preventDefault();
    e.stopPropagation();

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    if (isListening) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (err) {}
      }
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      // Locale mapping
      let locale = 'en-IN';
      if (effectiveLang === 'hi') locale = 'hi-IN';
      if (effectiveLang === 'gu') locale = 'gu-IN';
      recognition.lang = locale;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event) => {
        const transcript = event.results?.[0]?.[0]?.transcript;
        if (transcript && onResult) {
          onResult(transcript);
        }
        setIsListening(false);
      };

      recognition.onerror = (err) => {
        console.warn('[VoiceInput] Speech recognition error:', err.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.warn('[VoiceInput] Could not initialize speech recognition:', err);
      setIsListening(false);
    }
  };

  const buttonTitle =
    title || (isListening ? t('common.listening', 'Listening... Speak now') : t('common.voice_input', 'Voice input'));

  return (
    <div className={`relative inline-flex items-center ${className}`}>
      <button
        type="button"
        onClick={handleToggleListening}
        title={buttonTitle}
        aria-label={buttonTitle}
        className={`relative p-2 rounded-full transition-all flex items-center justify-center cursor-pointer ${
          isListening
            ? 'bg-rose-500 text-white shadow-lg ring-4 ring-rose-400/40 animate-pulse'
            : 'text-[var(--ink-3)] hover:text-[var(--brand-600)] hover:bg-[var(--surface-2)] active:scale-95'
        }`}
      >
        {isListening ? (
          <>
            <Mic className="w-4 h-4 animate-bounce" />
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-600" />
            </span>
          </>
        ) : (
          <Mic className="w-4 h-4" />
        )}
      </button>

      {/* Floating listening feedback tooltip when active */}
      {isListening && (
        <div
          role="status"
          aria-live="polite"
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1 bg-rose-600 text-white text-[11px] font-bold rounded-lg shadow-md whitespace-nowrap z-50 pointer-events-none flex items-center gap-1.5"
        >
          <span className="w-2 h-2 rounded-full bg-white animate-ping" />
          <span>{t('common.listening', 'Listening...')}</span>
        </div>
      )}
    </div>
  );
}
