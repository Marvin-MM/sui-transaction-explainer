import { useState, useRef, useEffect, useCallback } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { createPcmBlob, base64ToBytes, decodeAudioData, PCM_SAMPLE_RATE_INPUT, PCM_SAMPLE_RATE_OUTPUT } from "@/utils/audioUtils";

interface UseLiveSessionReturn {
  isConnected: boolean;
  isError: boolean;
  volume: number; // For visualization 0-1
  connect: () => Promise<void>;
  disconnect: () => void;
  sendText: (text: string) => void;
}

export const useLiveSession = (): UseLiveSessionReturn => {
  const [isConnected, setIsConnected] = useState(false);
  const [isError, setIsError] = useState(false);
  const [volume, setVolume] = useState(0);

  // Refs for audio context and processing
  const audioContextRef = useRef<AudioContext | null>(null);
  const inputContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const inputSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  
  // Refs for session management
  const aiRef = useRef<GoogleGenAI | null>(null);
  const sessionPromiseRef = useRef<Promise<any> | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, []);

  // Visualizer loop
  useEffect(() => {
    let animationFrameId: number;
    const updateVolume = () => {
      if (analyserRef.current) {
        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(dataArray);
        
        // Calculate average volume
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const average = sum / dataArray.length;
        setVolume(average / 255); // Normalize to 0-1
      }
      animationFrameId = requestAnimationFrame(updateVolume);
    };
    
    if (isConnected) {
      updateVolume();
    } else {
      setVolume(0);
    }

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [isConnected]);

  const connect = useCallback(async () => {
    // Re-initialize client right before connection to ensure fresh API key
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
        console.error("AI Client not initialized (missing API Key?)");
        setIsError(true);
        return;
    }
    aiRef.current = new GoogleGenAI({ apiKey });
    
    setIsError(false);

    try {
      // 1. Setup Audio Contexts
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: PCM_SAMPLE_RATE_OUTPUT,
      });
      
      inputContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: PCM_SAMPLE_RATE_INPUT,
      });

      // Resume contexts (needed for browsers requiring user gesture)
      await audioContextRef.current.resume();
      await inputContextRef.current.resume();

      // 2. Setup Analyser for visualization
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      analyserRef.current.smoothingTimeConstant = 0.5;

      // 3. Connect to Gemini Live
      const sessionPromise = aiRef.current.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction: 'You are an intelligent, concise, and helpful voice assistant. Your goal is to explain concepts clearly and simply. You speak naturally with good pacing.',
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } }
          },
        },
        callbacks: {
          onopen: async () => {
            console.log('Session Opened');
            setIsConnected(true);
            
            // Start Microphone Stream
            try {
              streamRef.current = await navigator.mediaDevices.getUserMedia({ 
                audio: { 
                  channelCount: 1, 
                  sampleRate: PCM_SAMPLE_RATE_INPUT,
                  echoCancellation: true,
                  noiseSuppression: true,
                  autoGainControl: true
                } 
              });

              if (!inputContextRef.current) return;

              inputSourceRef.current = inputContextRef.current.createMediaStreamSource(streamRef.current);
              processorRef.current = inputContextRef.current.createScriptProcessor(4096, 1, 1);

              processorRef.current.onaudioprocess = (e) => {
                const inputData = e.inputBuffer.getChannelData(0);
                const pcmBlob = createPcmBlob(inputData);
                
                // Send to model
                sessionPromise.then(session => {
                  session.sendRealtimeInput({ media: pcmBlob });
                });
              };

              inputSourceRef.current.connect(processorRef.current);
              processorRef.current.connect(inputContextRef.current.destination);

            } catch (micError) {
              console.error('Microphone permission denied or error:', micError);
              setIsError(true);
              disconnect();
            }
          },
          onmessage: async (message: LiveServerMessage) => {
            if (!audioContextRef.current || !analyserRef.current) return;

            // Handle Audio Output
            const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (base64Audio) {
               const audioData = base64ToBytes(base64Audio);
               const audioBuffer = await decodeAudioData(audioData, audioContextRef.current);
               
               // Schedule Playback
               const currentTime = audioContextRef.current.currentTime;
               if (nextStartTimeRef.current < currentTime) {
                 nextStartTimeRef.current = currentTime;
               }
               
               const source = audioContextRef.current.createBufferSource();
               source.buffer = audioBuffer;
               
               // Connect to visualizer and output
               source.connect(analyserRef.current);
               analyserRef.current.connect(audioContextRef.current.destination);
               
               source.start(nextStartTimeRef.current);
               nextStartTimeRef.current += audioBuffer.duration;
               
               source.onended = () => {
                 sourcesRef.current.delete(source);
               };
               sourcesRef.current.add(source);
            }

            // Handle Interruptions
            if (message.serverContent?.interrupted) {
              console.log('Interrupted by user');
              sourcesRef.current.forEach(source => {
                try { source.stop(); } catch(e) {}
              });
              sourcesRef.current.clear();
              nextStartTimeRef.current = 0;
            }
          },
          onclose: () => {
            console.log('Session Closed');
            setIsConnected(false);
          },
          onerror: (err) => {
            console.error('Session Error', err);
            setIsError(true);
            disconnect();
          }
        }
      });
      
      sessionPromiseRef.current = sessionPromise;

    } catch (e) {
      console.error("Connection failed", e);
      setIsError(true);
    }
  }, []);

  const disconnect = useCallback(() => {
    // 1. Close Session
    if (sessionPromiseRef.current) {
        sessionPromiseRef.current.then(session => {
             try {
                // @ts-ignore
                if(typeof session.close === 'function') session.close();
             } catch(e) { console.warn("Error closing session", e)}
        });
        sessionPromiseRef.current = null;
    }

    // 2. Stop Audio Sources
    sourcesRef.current.forEach(source => {
        try { source.stop(); } catch(e) {}
    });
    sourcesRef.current.clear();
    nextStartTimeRef.current = 0;

    // 3. Close Microphone
    if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
    }

    if (processorRef.current) {
        processorRef.current.disconnect();
        processorRef.current = null;
    }

    if (inputSourceRef.current) {
        inputSourceRef.current.disconnect();
        inputSourceRef.current = null;
    }

    // 4. Close Contexts
    if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
    }
    if (inputContextRef.current) {
        inputContextRef.current.close();
        inputContextRef.current = null;
    }

    setIsConnected(false);
  }, []);

  const sendText = useCallback((text: string) => {
    if (sessionPromiseRef.current) {
      sessionPromiseRef.current.then(session => {
        try {
          session.send({ parts: [{ text }] }, true); // true for endOfTurn
        } catch (e) {
          console.error("Error sending text:", e);
        }
      });
    }
  }, []);

  return {
    isConnected,
    isError,
    volume,
    connect,
    disconnect,
    sendText
  };
};