// Custom hook for Web Speech API (Speech-to-Text) with robust live feedback & error handling
import { useState, useRef, useEffect, useCallback } from "react";

export default function useSpeechRecognition(language = "hi") {
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [supported, setSupported] = useState(false);
  const [error, setError] = useState(null);
  const recognitionRef = useRef(null);
  const isListeningRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      setSupported(false);
      return;
    }

    setSupported(true);
    const recognition = new SR();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    const langMap = {
      hi: "hi-IN",
      en: "en-IN",
      ta: "ta-IN",
      te: "te-IN",
      bn: "bn-IN",
      mr: "mr-IN",
      gu: "gu-IN",
      kn: "kn-IN",
      ml: "ml-IN",
      pa: "pa-IN",
      or: "or-IN",
    };
    recognition.lang = langMap[language] || "hi-IN";

    recognition.onstart = () => {
      setListening(true);
      isListeningRef.current = true;
      setError(null);
    };

    recognition.onresult = (event) => {
      let finalStr = "";
      let interimStr = "";

      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalStr += result[0].transcript + " ";
        } else {
          interimStr += result[0].transcript;
        }
      }

      const combined = (finalStr + interimStr).trim();
      if (combined) {
        setTranscript(combined);
      }
      setInterimTranscript(interimStr);
    };

    recognition.onerror = (event) => {
      console.warn("[SpeechRecognition] Error:", event.error);
      if (event.error === "not-allowed") {
        setError("Microphone permission was denied. Please allow microphone in browser.");
        setListening(false);
        isListeningRef.current = false;
      } else if (event.error === "no-speech") {
        // Ignored in continuous mode unless user stopped
      } else if (event.error === "network") {
        setError("Network error in voice recognition. Please try typing.");
        setListening(false);
        isListeningRef.current = false;
      } else {
        if (isListeningRef.current) {
          setTimeout(() => {
            if (isListeningRef.current && recognitionRef.current) {
              try {
                recognitionRef.current.start();
              } catch { }
            }
          }, 200);
        }
      }
    };

    recognition.onend = () => {
      if (isListeningRef.current) {
        try {
          recognition.start();
        } catch {
          setListening(false);
          isListeningRef.current = false;
          setInterimTranscript("");
        }
      } else {
        setListening(false);
        isListeningRef.current = false;
        setInterimTranscript("");
      }
    };

    recognitionRef.current = recognition;

    return () => {
      try {
        recognition.abort();
      } catch { }
    };
  }, [language]);

  const startListening = useCallback(() => {
    setError(null);
    if (!recognitionRef.current) {
      setError("Speech recognition is not supported in this browser. Please use Chrome/Edge or type your message.");
      return;
    }

    if (isListeningRef.current) return;

    try {
      setTranscript("");
      setInterimTranscript("");
      recognitionRef.current.start();
    } catch (e) {
      console.warn("[SpeechRecognition] start error:", e);
      try {
        recognitionRef.current.abort();
        setTimeout(() => {
          try {
            recognitionRef.current?.start();
          } catch { }
        }, 100);
      } catch { }
    }
  }, []);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListeningRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        try {
          recognitionRef.current.abort();
        } catch { }
      }
      setListening(false);
      isListeningRef.current = false;
    }
  }, []);

  return {
    listening,
    transcript: transcript || interimTranscript,
    rawFinalTranscript: transcript,
    interimTranscript,
    supported,
    error,
    startListening,
    stopListening,
  };
}
