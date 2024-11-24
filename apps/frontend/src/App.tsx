import { useEffect, useRef, useState } from 'react'
import './App.css'
import { createClient } from '@supabase/supabase-js'
import { useChat } from 'ai/react'
import Anthropic from '@anthropic-ai/sdk';
import { pipeline, env, read_audio } from '@xenova/transformers';
env.allowLocalModels = false;

interface SpeechSegment {
  text: string;
  timestamp: number;
}

interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message?: string;
}

interface SpeechSynthesisUtterance {
  text: string;
  voice: SpeechSynthesisVoice | null;
  volume: number;
  rate: number;
  pitch: number;
  lang: string;
  onend: () => void;
}

interface SpeechGenerator {
  generate: (text: string) => Promise<Float32Array>;
}

declare global {
  interface Window {
    SpeechRecognition: new () => any;
    webkitSpeechRecognition: new () => any;
  }
}

// Create the Supabase client outside the component
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_PROJECT_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

const anthropic = new Anthropic({
  apiKey: import.meta.env.VITE_ANTHROPIC_API_KEY,
  dangerouslyAllowBrowser: true
})


function App() {
  const [speechSegments, setSpeechSegments] = useState<SpeechSegment[]>([])
  const [interimSpeech, setInterimSpeech] = useState<string>('')
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const recognitionRef = useRef<any>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const cleanupIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const interimTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const pauseTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const currentTranscriptRef = useRef<string>('')
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [speechQueue, setSpeechQueue] = useState<string[]>([])
  const isProcessingSpeechRef = useRef(false)
  const [audioContext] = useState<AudioContext>(() => new AudioContext());
  const speechGeneratorRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const {messages, input, append} = useChat({
    api: "https://supahack-webhooks.oof2win2.workers.dev/ai/chat",
    onToolCall: async (toolCall) => {
      console.log("tool call", toolCall)
      if (toolCall.toolCall.toolName === "getCurrentImage") {
        const image = getCurrentImage()
        console.log("image", image.slice(image.indexOf(',') + 1)) 
        const imageDescription = await anthropic.messages.create({
          model: "claude-3-5-sonnet-20240620",
          max_tokens: 1024,
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "image",
                  source: {
                    type: "base64",
                    media_type: "image/jpeg",
                    data: image.slice(image.indexOf(',') + 1)
                  }
                },
                {
                  type: "text",
                  text: "Describe the image in a few words"
                }
              ]
            }
          ]
        })
        const description = imageDescription.content[0].text as string
        return description
      }
    },
    maxSteps: 5,
    onFinish: (message) => {
      console.log("AI Finished with message", message)
      if (message.role === 'assistant') {
        setSpeechQueue(queue => [...queue, message.content])
      }
    }
  })

  // Add function to initialize ASR pipeline
  const initializeASR = async () => {
    try {
      const p = await pipeline('automatic-speech-recognition', 'Xenova/whisper-tiny.en');
      recognitionRef.current = p;

      console.log('ASR pipeline initialized');
    } catch (error) {
      console.error('Error initializing ASR:', error);
    }
  };

  // Replace initializeSpeechRecognition with this new function
  const initializeAudioRecording = () => {
    if (!streamRef.current) return;

    audioContextRef.current = new AudioContext();
    mediaRecorderRef.current = new MediaRecorder(streamRef.current);

    mediaRecorderRef.current.ondataavailable = async (event) => {
      if (event.data.size > 0) {
        audioChunksRef.current.push(event.data);
      }

      // Process audio when we have enough data
      if (audioChunksRef.current.length > 0) {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        audioChunksRef.current = []; // Clear the chunks

        try {
          // Convert blob to URL
          const audioUrl = URL.createObjectURL(audioBlob);
          
          // Use read_audio to get the correct format
          const audioData = await read_audio(audioUrl, 16000);
          
          // Clean up the URL
          URL.revokeObjectURL(audioUrl);
          
          // Transcribe the audio using the correct pipeline method
          if (recognitionRef.current) {
            const result = await recognitionRef.current(audioData, {
              language: "english"
            });
            
            if (result?.text?.trim()) {
              const completedSegment = {
                text: result.text.trim(),
                timestamp: Date.now()
              };
              
              console.log('Speech segment completed:', completedSegment.text);
              
              // Send to Anthropic
              append({
                role: "user",
                content: completedSegment.text
              });
              
              setSpeechSegments(prev => [...prev, completedSegment]);
            }
          }
        } catch (error) {
          console.error('Error processing audio:', error);
        }
      }
    };

    // Start recording in chunks
    mediaRecorderRef.current.start(3000); // Process every 3 seconds
  };

  // Update the initialize effect
  useEffect(() => {
    const initialize = async () => {
      // Initialize ASR pipeline first
      await initializeASR();
      
      // Then initialize media stream
      const stream = await initializeMediaStream();
      if (!stream) return;

      // Initialize audio recording
      initializeAudioRecording();
    };

    initialize();

    // Update cleanup function
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    };
  }, []);

  // Initialize media stream
  const initializeMediaStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true,
        audio: true 
      })
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
      streamRef.current = stream
      return stream
    } catch (err) {
      console.error('Error accessing the camera or microphone:', err)
      return null
    }
  }

  // Clean up old 3s
  useEffect(() => {
    cleanupIntervalRef.current = setInterval(() => {
      const thirtySecondsAgo = Date.now() - 30000
      setSpeechSegments(prev => 
        prev.filter(segment => segment.timestamp > thirtySecondsAgo)
      )
    }, 100)

    return () => {
      if (cleanupIntervalRef.current) {
        clearInterval(cleanupIntervalRef.current)
      }
    }
  }, [])

  // Add this function to initialize the speech generator
  const initializeSpeechGenerator = async () => {
    try {
      speechGeneratorRef.current = await pipeline('text-to-speech', 'Xenova/speecht5_tts');
      console.log('Speech generator initialized');
    } catch (error) {
      console.error('Error initializing speech generator:', error);
    }
  };

  // Add this function to play audio from Float32Array
  const playAudio = async (audioData: Float32Array) => {
    const buffer = audioContext.createBuffer(1, audioData.length, 16000);
    buffer.getChannelData(0).set(audioData);
    
    const source = audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(audioContext.destination);
    
    source.onended = () => {
      setIsSpeaking(false);
      // Process next item in queue
      isProcessingSpeechRef.current = false;
      setSpeechQueue(prevQueue => prevQueue.filter((_, index) => index !== 0));
    };
    
    setIsSpeaking(true);
    source.start();
  };

  // Update the processSpeechQueue function
  const processSpeechQueue = async () => {
    if (isProcessingSpeechRef.current || !speechGeneratorRef.current || speechQueue.length === 0) return;
    
    isProcessingSpeechRef.current = true;
    const text = speechQueue[0];
    
    try {
      const result = await speechGeneratorRef.current.generate(text);
      await playAudio(result.audio);
    } catch (error) {
      console.error('Error generating speech:', error);
      isProcessingSpeechRef.current = false;
      setSpeechQueue(prevQueue => prevQueue.filter((_, index) => index !== 0));
    }
  };

  // Replace the speech synthesis initialization effect with the new one
  useEffect(() => {
    initializeSpeechGenerator();
    
    return () => {
      // Cleanup audio context if needed
      if (audioContext.state !== 'closed') {
        audioContext.close();
      }
    };
  }, []);

  // Add this function inside the App component
  const getCurrentImage = (): string => {
    if (!videoRef.current || !canvasRef.current) return '';
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    // Set canvas dimensions to match video dimensions
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Draw current video frame to canvas
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';
    
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Convert canvas content to base64 string
    try {
      return canvas.toDataURL('image/jpeg');
    } catch (error) {
      console.error('Error converting canvas to base64:', error);
      return '';
    }
  }

  // Add this effect to periodically save frames
  useEffect(() => {
    const frameInterval = setInterval(() => {
      const image = getCurrentImage();
      if (image) {
        saveFrameToSupabase(image);
      }
    }, 1000);

    return () => {
      clearInterval(frameInterval);
    };
  }, []);

  return (
    <div>
      <video 
        ref={videoRef} 
        autoPlay 
        playsInline 
        style={{ width: '320px', height: '240px' }}
      />
      <canvas 
        ref={canvasRef} 
        style={{ display: 'none' }}
      />
      <div style={{ marginTop: '20px' }}>
        <h3>Speech Stream:</h3>
        <div style={{ 
          padding: '1rem',
          borderRadius: '8px',
          backgroundColor: '#f5f5f5',
          minHeight: '100px',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          color: "#000",
          transition: 'all 0.3s ease'
        }}>
          <span style={{ display: 'block' }}>
            {speechSegments.map(segment => segment.text).join(' ')}
          </span>
          <span style={{ 
            color: '#666',
            display: 'block',
            minHeight: '1.2em',
            transition: 'opacity 0.3s ease'
          }}>
            {interimSpeech && ` ${interimSpeech}`}
          </span>
        </div>
        <button 
          onClick={() => setSpeechSegments([])}
          style={{ marginTop: '10px' }}
        >
          Clear Speech
        </button>
      </div>
    </div>
  )
}

export default App
