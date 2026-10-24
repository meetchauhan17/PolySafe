/**
 * frontend/src/components/AudioListenButton.jsx
 *
 * Web SpeechSynthesis TTS Read-Aloud Player
 * ─────────────────────────────────────────────────────────────────────────────
 * • Supports English (en-IN), Hindi (hi-IN), and Gujarati (gu-IN).
 * • Detects available voices dynamically via window.speechSynthesis.getVoices().
 * • If no voice exists for the selected language, cleanly returns null (shows nothing broken).
 * • Includes play / pause toggle and adjustable speech rate (0.8x slower speech vs 1.0x normal).
 * • Cleans text from raw markdown markers so speech sounds clear and natural.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Volume2, VolumeX, Pause, Play, Gauge } from 'lucide-react';
import { useT } from '../i18n/useT';

function cleanSpeechText(raw) {
  if (!raw) return '';
  return String(raw)
    .replace(/\[Original:[^\]]*\]/gi, '') // remove original english bracketed text in translated fallbacks
    .replace(/[*_#`~[\]()]/g, ' ')       // remove markdown punctuation
    .replace(/\s+/g, ' ')
    .trim();
}

export default function AudioListenButton({
  text = '',
  lang: propLang,
  className = '',
  compact = false,
}) {
  const { lang: currentLang, t } = useT();
  const effectiveLang = propLang || currentLang || 'en';

  const [isPlaying, setIsPlaying] = useState(false);
  const [rate, setRate] = useState(1.0); // 0.8x or 1.0x
  const [matchingVoice, setMatchingVoice] = useState(null);
  const utteranceRef = useRef(null);

  // Check available voices for the target language
  const checkVoices = useCallback(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      setMatchingVoice(null);
      return;
    }

    const voices = window.speechSynthesis.getVoices() || [];
    if (!voices.length) return;

    let targetCode = 'en';
    if (effectiveLang === 'hi') targetCode = 'hi';
    if (effectiveLang === 'gu') targetCode = 'gu';

    // Priority 1: Exact target locale (e.g. hi-IN, gu-IN, en-IN)
    let voice = voices.find(
      (v) =>
        v.lang &&
        v.lang.toLowerCase().replace('_', '-').startsWith(`${targetCode}-`)
    );

    // Priority 2: Language code prefix (e.g. hi, gu, en)
    if (!voice) {
      voice = voices.find(
        (v) =>
          v.lang &&
          v.lang.toLowerCase().replace('_', '-').startsWith(targetCode)
      );
    }

    // Priority 3: Name match (e.g. contains 'Hindi' or 'Gujarati' in voice name)
    if (!voice) {
      const nameKeywords = {
        hi: 'hindi',
        gu: 'gujarati',
        en: 'english',
      };
      const kw = nameKeywords[targetCode];
      voice = voices.find((v) => v.name && v.name.toLowerCase().includes(kw));
    }

    // For English fallback, any English voice or default voice is valid
    if (!voice && targetCode === 'en') {
      voice = voices.find((v) => v.lang && v.lang.toLowerCase().startsWith('en')) || voices[0];
    }

    setMatchingVoice(voice || null);
  }, [effectiveLang]);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    checkVoices();

    const handleVoicesChanged = () => {
      checkVoices();
    };

    window.speechSynthesis.addEventListener('voiceschanged', handleVoicesChanged);
    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', handleVoicesChanged);
    };
  }, [checkVoices]);

  // Stop playback when unmounting or when language/text changes
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, [effectiveLang, text]);

  // "Detect available voices; if no voice exists for the language, hide the button and show nothing broken."
  if (!matchingVoice || !text) {
    return null;
  }

  const handleTogglePlay = (e) => {
    e.stopPropagation();
    e.preventDefault();

    if (!window.speechSynthesis) return;

    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      return;
    }

    // Cancel any previous utterance before starting
    window.speechSynthesis.cancel();

    const clean = cleanSpeechText(text);
    if (!clean) return;

    const utter = new SpeechSynthesisUtterance(clean);
    utter.voice = matchingVoice;
    utter.lang = matchingVoice.lang || (effectiveLang === 'hi' ? 'hi-IN' : effectiveLang === 'gu' ? 'gu-IN' : 'en-IN');
    utter.rate = rate;

    utter.onend = () => {
      setIsPlaying(false);
    };

    utter.onerror = () => {
      setIsPlaying(false);
    };

    utteranceRef.current = utter;
    window.speechSynthesis.speak(utter);
    setIsPlaying(true);
  };

  const handleToggleRate = (e) => {
    e.stopPropagation();
    e.preventDefault();
    const nextRate = rate === 1.0 ? 0.8 : 1.0;
    setRate(nextRate);

    // If currently playing, restart with new rate
    if (isPlaying && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      const clean = cleanSpeechText(text);
      const utter = new SpeechSynthesisUtterance(clean);
      utter.voice = matchingVoice;
      utter.lang = matchingVoice.lang;
      utter.rate = nextRate;
      utter.onend = () => setIsPlaying(false);
      utter.onerror = () => setIsPlaying(false);
      utteranceRef.current = utter;
      window.speechSynthesis.speak(utter);
    }
  };

  const listenLabel = t('common.listen', 'Listen');
  const pauseLabel = t('common.pause', 'Pause');

  return (
    <div className={`inline-flex items-center gap-1.5 ${className}`}>
      <button
        type="button"
        onClick={handleTogglePlay}
        aria-label={isPlaying ? pauseLabel : listenLabel}
        title={isPlaying ? pauseLabel : listenLabel}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
          isPlaying
            ? 'bg-cyan-600 text-white shadow-sm ring-2 ring-cyan-400/40 animate-pulse'
            : 'bg-[var(--surface-2)] text-[var(--ink-2)] hover:bg-[var(--brand-50)] hover:text-[var(--brand-700)] border border-[var(--border)]'
        }`}
      >
        {isPlaying ? (
          <>
            <Pause className="w-3.5 h-3.5" />
            <span>{compact ? '' : pauseLabel}</span>
          </>
        ) : (
          <>
            <Volume2 className="w-3.5 h-3.5 text-[var(--brand-600)]" />
            <span>{compact ? '' : listenLabel}</span>
          </>
        )}
      </button>

      {/* Speed control toggle (0.8x / 1.0x) */}
      <button
        type="button"
        onClick={handleToggleRate}
        title={`Speech rate: ${rate}x (Click to toggle)`}
        aria-label={`Speech rate: ${rate}x`}
        className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold border transition-colors cursor-pointer ${
          rate === 0.8
            ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30'
            : 'bg-[var(--surface-2)] text-[var(--ink-3)] hover:text-[var(--ink)] border-[var(--border)]'
        }`}
      >
        {rate}x
      </button>
    </div>
  );
}
