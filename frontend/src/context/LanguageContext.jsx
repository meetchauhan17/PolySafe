import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import en from '../i18n/en.json';
import hi from '../i18n/hi.json';
import gu from '../i18n/gu.json';

const dictionaries = { en, hi, gu };

export const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  // Detect language: localStorage > navigator.language > 'en'
  const [lang, setLangState] = useState(() => {
    try {
      const saved = localStorage.getItem('polysafe_lang');
      if (saved && ['en', 'hi', 'gu'].includes(saved)) {
        return saved;
      }
      const browserLang = (navigator.language || navigator.userLanguage || '').toLowerCase();
      if (browserLang.startsWith('hi')) return 'hi';
      if (browserLang.startsWith('gu')) return 'gu';
    } catch (e) {
      // ignore
    }
    return 'en';
  });

  // Text-size: 'sm' (A-), 'md' (A), 'lg' (A+)
  const [textSize, setTextSizeState] = useState(() => {
    try {
      const saved = localStorage.getItem('polysafe_text_size');
      if (saved && ['sm', 'md', 'lg'].includes(saved)) {
        return saved;
      }
    } catch (e) {}
    return 'md';
  });

  const [ariaAnnouncement, setAriaAnnouncement] = useState('');

  // Update HTML attributes when language or text size changes
  useEffect(() => {
    try {
      document.documentElement.lang = lang;
    } catch (e) {}
  }, [lang]);

  useEffect(() => {
    try {
      document.documentElement.classList.remove('text-sm', 'text-md', 'text-lg');
      document.documentElement.classList.add(`text-${textSize}`);
    } catch (e) {}
  }, [textSize]);

  const setLang = useCallback((newLang) => {
    if (!['en', 'hi', 'gu'].includes(newLang)) return;
    setLangState(newLang);
    try {
      localStorage.setItem('polysafe_lang', newLang);
      document.documentElement.lang = newLang;
    } catch (e) {}

    const announcements = {
      en: 'Language changed to English',
      hi: 'भाषा बदलकर हिंदी कर दी गई है',
      gu: 'ભાષા બદલીને ગુજરાતી કરવામાં આવી છે',
    };
    setAriaAnnouncement(announcements[newLang] || `Language changed to ${newLang}`);
  }, []);

  const setTextSize = useCallback((newSize) => {
    if (!['sm', 'md', 'lg'].includes(newSize)) return;
    setTextSizeState(newSize);
    try {
      localStorage.setItem('polysafe_text_size', newSize);
    } catch (e) {}
  }, []);

  const t = useCallback((key, fallbackOrParams = {}, maybeParams = {}) => {
    if (!key) return '';
    const currentDict = dictionaries[lang] || dictionaries.en;
    const fallbackDict = dictionaries.en;

    const params = (typeof fallbackOrParams === 'object' && fallbackOrParams !== null)
      ? fallbackOrParams
      : (typeof maybeParams === 'object' && maybeParams !== null ? maybeParams : {});

    const fallbackString = typeof fallbackOrParams === 'string' ? fallbackOrParams : null;

    const parts = key.split('.');
    let cur = currentDict;
    for (const part of parts) {
      cur = cur?.[part];
    }

    if (cur === undefined || cur === null) {
      let fb = fallbackDict;
      for (const part of parts) {
        fb = fb?.[part];
      }
      cur = fb;
    }

    if (cur === undefined || cur === null) {
      cur = fallbackString !== null ? fallbackString : key;
    }

    if (typeof cur === 'string') {
      return cur.replace(/\{(\w+)\}/g, (match, paramName) => {
        return params[paramName] !== undefined ? params[paramName] : match;
      });
    }

    return cur;
  }, [lang]);

  return (
    <LanguageContext.Provider value={{ lang, setLang, t, textSize, setTextSize, ariaAnnouncement }}>
      {children}
      {/* Screen-reader accessible live announcement for language changes */}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
        style={{ position: 'absolute', width: '1px', height: '1px', padding: 0, margin: '-1px', overflow: 'hidden', clip: 'rect(0, 0, 0, 0)', whiteSpace: 'nowrap', border: 0 }}
      >
        {ariaAnnouncement}
      </div>
    </LanguageContext.Provider>
  );
}

export function useT() {
  const context = useContext(LanguageContext);
  if (!context) {
    return {
      lang: 'en',
      setLang: () => {},
      t: (key, fallbackOrParams, maybeParams) => {
        const params = (typeof fallbackOrParams === 'object' && fallbackOrParams !== null)
          ? fallbackOrParams
          : (typeof maybeParams === 'object' && maybeParams !== null ? maybeParams : {});
        const str = typeof fallbackOrParams === 'string' ? fallbackOrParams : key;
        return str.replace(/\{(\w+)\}/g, (match, p) => (params[p] !== undefined ? params[p] : match));
      },
      textSize: 'md',
      setTextSize: () => {},
      ariaAnnouncement: '',
    };
  }
  return context;
}
