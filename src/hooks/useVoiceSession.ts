// useVoiceSession — Robust Dual-Engine Voice Session
// Combines real-time Web Speech recognition + MediaRecorder audio streaming + Gemini Neural TTS
import { useRef, useState, useCallback, useEffect } from "react";
import useVoiceStore from "@/stores/voiceStore";
import useAppStore from "@/stores/appStore";
import useChatStore from "@/stores/chatStore";
import { matchSchemesRuleBased } from "@/lib/schemeSearch";

// ─── Helpers ────────────────────────────────────────────────────────────────────

/** Detect whether text contains Devanagari (Hindi/Marathi/etc.) */
function hasDevanagari(text: string): boolean {
  return /[\u0900-\u097F]/.test(text);
}

/** Clean raw AI text into a concise, natural phrase suitable for TTS */
function formatSpeechForVoice(rawText: string): string {
  if (!rawText) return "";

  // Strip markdown artifacts
  let clean = rawText
    .replace(/[*#_`~>\[\]\(\)]/g, "")
    .replace(/\n+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  // For short responses, use as-is
  if (clean.length < 200) return clean;

  // For longer responses, extract intro + scheme names for a summary
  const lines = rawText.split("\n").map((l) => l.trim()).filter(Boolean);
  const intro = (lines[0] || "")
    .replace(/[*#_`~>\[\]\(\)]/g, "")
    .replace(/[:：]$/, "")
    .trim();

  const schemeNames: string[] = [];
  for (const line of lines) {
    const m = line.match(/^\d+\.?\s*\*\*([^*]+)\*\*/);
    if (m && m[1]) {
      schemeNames.push(m[1].replace(/\([^)]*\)/g, "").trim());
    }
  }

  const isHindi = hasDevanagari(rawText);

  if (schemeNames.length > 0) {
    const topNames = schemeNames.slice(0, 3).join(", ");
    if (isHindi) {
      return `${intro}। मुख्य योजनाओं में ${topNames} शामिल हैं। पूरी सूची और आवेदन की जानकारी आप स्क्रीन पर देख सकते हैं।`;
    } else {
      return `${intro}. Key eligible schemes include ${topNames}. You can review full details and apply directly on the screen.`;
    }
  }

  // Truncate to first 2 sentences for TTS
  const sentences = clean.match(/[^.!?।]+[.!?।]+/g);
  if (sentences && sentences.length > 2) {
    return sentences.slice(0, 2).join(" ").trim();
  }

  return clean.slice(0, 300);
}

/** Find the best available natural/neural voice in the browser */
function getBestVoice(lang: string): SpeechSynthesisVoice | null {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return null;
  const voices = window.speechSynthesis.getVoices();
  if (!voices || voices.length === 0) return null;

  const isHindi = lang === "hi" || lang.startsWith("hi");

  if (isHindi) {
    const hiVoices = voices.filter(
      (v) =>
        v.lang === "hi-IN" ||
        v.lang.toLowerCase().includes("hi-in") ||
        v.lang.toLowerCase().includes("hindi") ||
        /hindi|swara|madhur|kalpana/i.test(v.name)
    );
    const naturalHi =
      hiVoices.find((v) => /natural|online|google|microsoft/i.test(v.name)) ||
      hiVoices[0];
    if (naturalHi) return naturalHi;
  }

  // English (India) preference
  const enInVoices = voices.filter(
    (v) =>
      v.lang === "en-IN" ||
      v.lang.toLowerCase().includes("en-in") ||
      /india|ravi|heera|neerja/i.test(v.name)
  );
  const naturalEn =
    enInVoices.find((v) => /natural|online|google|microsoft/i.test(v.name)) ||
    enInVoices[0] ||
    voices.find((v) => v.lang.startsWith("en") && /natural|online|google|microsoft/i.test(v.name)) ||
    voices.find((v) => v.lang.startsWith("en"));

  return naturalEn || voices[0] || null;
}

// ─── Hook ────────────────────────────────────────────────────────────────────────

export default function useVoiceSession() {
  const speechRecognitionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const liveTranscriptRef = useRef<string>("");
  const isRecordingActiveRef = useRef<boolean>(false);
  const recognitionFailedRef = useRef<boolean>(false);
  const recognitionRestartCount = useRef<number>(0);

  const [recordingDuration, setRecordingDuration] = useState<number>(0);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const conversationHistoryRef = useRef<Array<{ role: string; content: string }>>([]);

  // Pre-fetch browser voices on mount
  useEffect(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.getVoices();
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices();
      };
    }
  }, []);

  const stopAudioTracks = useCallback(() => {
    isRecordingActiveRef.current = false;
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach((track) => track.stop());
      audioStreamRef.current = null;
    }
    if (speechRecognitionRef.current) {
      try {
        speechRecognitionRef.current.abort();
      } catch {}
      speechRecognitionRef.current = null;
    }
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    setRecordingDuration(0);
  }, []);

  // ─── PCM Base64 Audio Playback (Gemini TTS) ───────────────────────────────

  const playPCMBase64 = useCallback((base64PCM: string, onEnd?: () => void) => {
    try {
      if (typeof window === "undefined") return false;
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return false;

      const audioCtx = new AudioCtx({ sampleRate: 24000 });
      if (audioCtx.state === "suspended") {
        audioCtx.resume();
      }

      const binaryString = atob(base64PCM);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      const int16 = new Int16Array(bytes.buffer);
      const float32 = new Float32Array(int16.length);
      for (let i = 0; i < int16.length; i++) {
        float32[i] = int16[i] / 32768;
      }

      const audioBuffer = audioCtx.createBuffer(1, float32.length, 24000);
      audioBuffer.getChannelData(0).set(float32);

      const source = audioCtx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioCtx.destination);

      useVoiceStore.getState().setIsSpeaking(true);
      useVoiceStore.getState().setIsListening(false);

      source.onended = () => {
        useVoiceStore.getState().setIsSpeaking(false);
        audioCtx.close().catch(() => {});
        onEnd?.();
      };

      source.start();
      return true;
    } catch (e) {
      console.warn("[Voice] Web Audio PCM playback failed:", e);
      return false;
    }
  }, []);

  // ─── TTS: Neural audio first, then browser fallback ────────────────────────

  const speakText = useCallback(
    async (text: string, audioBase64?: string, onEnd?: () => void) => {
      // 1. If Gemini TTS neural audio was provided, play directly
      if (audioBase64) {
        const played = playPCMBase64(audioBase64, onEnd);
        if (played) return;
      }

      // 2. Browser Speech Synthesis fallback
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        try {
          window.speechSynthesis.cancel();
          const cleanSpeechText = formatSpeechForVoice(text);
          if (!cleanSpeechText) {
            onEnd?.();
            return;
          }

          const utterance = new SpeechSynthesisUtterance(cleanSpeechText);
          // Detect language from actual text content, not from UI toggle
          const isHindi = hasDevanagari(cleanSpeechText);
          utterance.lang = isHindi ? "hi-IN" : "en-IN";
          utterance.rate = isHindi ? 0.95 : 0.98;
          utterance.pitch = 1.0;

          const voice = getBestVoice(isHindi ? "hi" : "en");
          if (voice) {
            utterance.voice = voice;
          }

          utterance.onstart = () => {
            useVoiceStore.getState().setIsSpeaking(true);
            useVoiceStore.getState().setIsListening(false);
          };

          utterance.onend = () => {
            useVoiceStore.getState().setIsSpeaking(false);
            onEnd?.();
          };

          utterance.onerror = () => {
            useVoiceStore.getState().setIsSpeaking(false);
            onEnd?.();
          };

          window.speechSynthesis.speak(utterance);
          return;
        } catch (e) {
          console.warn("[Voice] SpeechSynthesis error:", e);
        }
      }

      useVoiceStore.getState().setIsSpeaking(false);
      onEnd?.();
    },
    [playPCMBase64]
  );

  // ─── Send audio + transcript to /api/voice ─────────────────────────────────

  const sendVoicePayload = useCallback(
    async (audioBlob?: Blob, transcribedText?: string) => {
      const voiceStore = useVoiceStore.getState();
      const appStore = useAppStore.getState();

      voiceStore.setIsListening(false);
      voiceStore.setIsThinking(true);

      const deliverPayload = async (base64Audio?: string) => {
        try {
          // Build history from conversationHistoryRef only (no duplication with chatStore)
          const contextHistory = conversationHistoryRef.current.slice(-8);

          // Detect language from the transcribed text to pass accurate language hint
          const spokenLang = transcribedText
            ? (hasDevanagari(transcribedText) ? "hi" : "en")
            : appStore.language;

          const response = await fetch("/api/voice", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              audioBase64: base64Audio || undefined,
              mimeType: audioBlob?.type || "audio/webm",
              text: transcribedText || undefined,
              language: spokenLang,
              history: contextHistory,
              profile: appStore.profile,
            }),
          });

          if (!response.ok) {
            throw new Error(`API status ${response.status}`);
          }

          const result = await response.json();

          // Use Gemini's transcription if available, else use client-side
          const transcript = result.transcript || transcribedText;
          const reply = result.message || "";

          // Update language toggle to match what user actually spoke
          if (transcript) {
            const detectedLang = hasDevanagari(transcript) ? "hi" : "en";
            if (detectedLang !== appStore.language) {
              appStore.setLanguage(detectedLang);
            }
          }

          if (transcript) {
            voiceStore.setInputTranscript(transcript);
            voiceStore.addToLog({ role: "user", text: transcript });
            conversationHistoryRef.current.push({ role: "user", content: transcript });
            useChatStore.getState().addMessage({ role: "user", content: transcript });
          }

          if (reply) {
            voiceStore.setOutputTranscript(reply);
            voiceStore.addToLog({ role: "assistant", text: reply });
            conversationHistoryRef.current.push({ role: "assistant", content: reply });
            useChatStore.getState().addMessage({ role: "assistant", content: reply });
          }

          if (result.profile && Object.keys(result.profile).length > 0) {
            appStore.mergeProfile(result.profile);
          }

          if (result.ready_to_match) {
            const currentProfile = useAppStore.getState().profile;
            const matches =
              result.matches && result.matches.length > 0
                ? result.matches
                : matchSchemesRuleBased(currentProfile);
            appStore.setMatchedSchemes(matches as any);
          }

          voiceStore.setIsThinking(false);

          if (reply) {
            speakText(reply, result.audioBase64);
          }
        } catch (err: any) {
          console.error("[Voice] Processing error:", err);
          voiceStore.setIsThinking(false);
          const lang = useAppStore.getState().language;
          const fallbackMsg =
            lang === "hi"
              ? "कुछ समस्या हुई। कृपया दोबारा बोलें या टेक्स्ट में लिखें।"
              : "Something went wrong. Please speak again or type your message.";
          voiceStore.setOutputTranscript(fallbackMsg);
          speakText(fallbackMsg);
        }
      };

      // Convert audio blob to base64 and send
      if (audioBlob && audioBlob.size > 500) {
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          const base64Data = (reader.result as string)?.split(",")[1];
          deliverPayload(base64Data);
        };
        reader.onerror = () => {
          // Audio failed but we may still have transcript text
          deliverPayload(undefined);
        };
      } else if (transcribedText && transcribedText.trim().length > 0) {
        // No usable audio, but we have text from WebSpeech
        deliverPayload(undefined);
      } else {
        // Nothing captured
        voiceStore.setIsThinking(false);
        const lang = useAppStore.getState().language;
        voiceStore.setOutputTranscript(
          lang === "hi"
            ? "आपकी आवाज़ स्पष्ट नहीं आ सकी। कृपया फिर से बोलें।"
            : "Could not capture your voice. Please try again."
        );
      }
    },
    [speakText]
  );

  // ─── Start Recording: Mic + MediaRecorder + WebSpeech ──────────────────────

  const startRecording = useCallback(async () => {
    stopAudioTracks();
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }

    const voiceStore = useVoiceStore.getState();
    const appStore = useAppStore.getState();
    voiceStore.setIsSpeaking(false);
    voiceStore.setIsThinking(false);
    voiceStore.setSessionState("connecting");
    voiceStore.setInputTranscript("");
    voiceStore.setOutputTranscript("");
    liveTranscriptRef.current = "";
    isRecordingActiveRef.current = true;
    recognitionFailedRef.current = false;
    recognitionRestartCount.current = 0;

    // 1. Get microphone stream
    let stream: MediaStream | null = null;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 16000,
        },
      });
      audioStreamRef.current = stream;
    } catch (micErr: any) {
      console.warn("[Voice] getUserMedia error:", micErr);
      voiceStore.setSessionState("error");
      return;
    }

    // 2. Start MediaRecorder to capture raw audio for Gemini
    if (stream) {
      audioChunksRef.current = [];
      const options =
        typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
          ? { mimeType: "audio/webm;codecs=opus" }
          : typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported("audio/webm")
            ? { mimeType: "audio/webm" }
            : {};

      try {
        const mediaRecorder = new MediaRecorder(stream, options);
        mediaRecorderRef.current = mediaRecorder;

        mediaRecorder.ondataavailable = (event) => {
          if (event.data && event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        mediaRecorder.onstop = () => {
          const audioBlob = new Blob(audioChunksRef.current, {
            type: mediaRecorder.mimeType || "audio/webm",
          });
          const capturedText = liveTranscriptRef.current?.trim() || "";

          // Always send if we have EITHER audio OR text
          if (audioBlob.size > 500 || capturedText.length > 0) {
            sendVoicePayload(audioBlob, capturedText);
          } else {
            voiceStore.setIsListening(false);
            voiceStore.setSessionState("connected");
            const lang = useAppStore.getState().language;
            voiceStore.setOutputTranscript(
              lang === "hi"
                ? "कोई आवाज़ नहीं मिली। कृपया माइक के पास बोलें।"
                : "No voice detected. Please speak closer to the microphone."
            );
          }
        };

        // Record in 200ms chunks for smooth processing
        mediaRecorder.start(200);
      } catch (recErr) {
        console.warn("[Voice] MediaRecorder init error:", recErr);
      }
    }

    // 3. Start Web Speech Recognition for real-time live transcript
    // Use BOTH Hindi and English recognition by trying a multilingual lang code
    if (typeof window !== "undefined") {
      const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SR) {
        try {
          const recognition = new SR();
          recognition.continuous = true;
          recognition.interimResults = true;
          recognition.maxAlternatives = 3; // Get multiple alternatives for better accuracy

          // Set recognition language based on user toggle, but Gemini will re-transcribe accurately
          recognition.lang = appStore.language === "en" ? "en-IN" : "hi-IN";

          recognition.onresult = (ev: any) => {
            let finalStr = "";
            let interimStr = "";
            for (let i = 0; i < ev.results.length; i++) {
              const result = ev.results[i];
              if (result.isFinal) {
                // Pick the best alternative
                finalStr += result[0].transcript + " ";
              } else {
                interimStr += result[0].transcript;
              }
            }
            const combined = (finalStr + interimStr).trim();
            if (combined) {
              liveTranscriptRef.current = combined;
              voiceStore.setInputTranscript(combined);

              // Auto-detect language from spoken words and sync UI
              const spokenIsHindi = hasDevanagari(combined);
              if (spokenIsHindi && appStore.language !== "hi") {
                // User switched to Hindi mid-recording, update recognition lang
                appStore.setLanguage("hi");
              } else if (!spokenIsHindi && combined.length > 5 && /^[a-zA-Z0-9\s.,!?'"()\-]+$/.test(combined) && appStore.language === "hi") {
                appStore.setLanguage("en");
              }
            }
          };

          recognition.onerror = (e: any) => {
            console.warn("[Voice] SpeechRecognition error:", e.error);
            if (e.error === "network" || e.error === "service-not-allowed") {
              // WebSpeech not available; Gemini will transcribe from raw audio
              recognitionFailedRef.current = true;
              console.log("[Voice] WebSpeech unavailable, relying on Gemini audio transcription");
            }
            // For other errors (no-speech, aborted), allow restart
          };

          recognition.onend = () => {
            if (isRecordingActiveRef.current && !recognitionFailedRef.current) {
              recognitionRestartCount.current++;
              if (recognitionRestartCount.current < 50) {
                try {
                  recognition.start();
                } catch {}
              }
            }
          };

          recognition.start();
          speechRecognitionRef.current = recognition;
        } catch (srErr) {
          console.warn("[Voice] WebSpeech start error:", srErr);
        }
      }
    }

    voiceStore.setIsListening(true);
    voiceStore.setSessionState("connected");

    setRecordingDuration(0);
    timerIntervalRef.current = setInterval(() => {
      setRecordingDuration((prev) => prev + 1);
    }, 1000);
  }, [sendVoicePayload, stopAudioTracks]);

  // ─── Stop Recording ────────────────────────────────────────────────────────

  const stopRecording = useCallback(() => {
    isRecordingActiveRef.current = false;

    if (speechRecognitionRef.current) {
      try {
        speechRecognitionRef.current.stop();
      } catch {}
    }

    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop(); // This triggers onstop → sendVoicePayload
    } else {
      const capturedText = liveTranscriptRef.current?.trim() || "";
      const audioBlob =
        audioChunksRef.current.length > 0
          ? new Blob(audioChunksRef.current, { type: "audio/webm" })
          : undefined;
      stopAudioTracks();
      if (capturedText.length > 0 || (audioBlob && audioBlob.size > 500)) {
        sendVoicePayload(audioBlob, capturedText);
      } else {
        useVoiceStore.getState().setIsListening(false);
      }
    }
  }, [sendVoicePayload, stopAudioTracks]);

  // ─── Toggle Recording ──────────────────────────────────────────────────────

  const toggleRecording = useCallback(async () => {
    const isListening = useVoiceStore.getState().isListening;
    if (isListening) {
      stopRecording();
    } else {
      await startRecording();
    }
  }, [startRecording, stopRecording]);

  // ─── Cleanup on unmount ────────────────────────────────────────────────────

  useEffect(() => {
    return () => {
      stopAudioTracks();
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [stopAudioTracks]);

  return {
    startSession: startRecording,
    stopSession: stopRecording,
    toggleRecording,
    recordingDuration,
    isListening: useVoiceStore((s) => s.isListening),
    speakText,
  };
}
