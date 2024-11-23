import { useEffect, useRef, useState } from 'react'
import './App.css'
import { createClient } from '@supabase/supabase-js'
import { useChat } from 'ai/react'
import Anthropic from '@anthropic-ai/sdk';

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
  const synthRef = useRef<SpeechSynthesis | null>(null)
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)
  const [speechQueue, setSpeechQueue] = useState<string[]>([])
  const isProcessingSpeechRef = useRef(false)

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

  // Initialize speech recognition
  const initializeSpeechRecognition = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      console.error('Speech recognition not supported in this browser')
      return null
    }

    const recognition = new SpeechRecognition()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'en-US'

    let isRestarting = false

    const handlePause = () => {
      if (currentTranscriptRef.current.trim()) {
        const completedSegment = {
          text: currentTranscriptRef.current.trim(),
          timestamp: Date.now()
        }
        console.log('Speech segment completed:', completedSegment.text)
        
        // Send to Anthropic
        append({
          role: "user",
          content: completedSegment.text
        })
        
        console.log("submit")
        
        setSpeechSegments(prev => [...prev, completedSegment])
        currentTranscriptRef.current = ''
        setInterimSpeech('')
      }
    }

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const last = event.results.length - 1
      const transcript = event.results[last][0].transcript

      // Clear any existing pause timeout
      if (pauseTimeoutRef.current) {
        clearTimeout(pauseTimeoutRef.current)
      }
      
      if (event.results[last].isFinal) {
        currentTranscriptRef.current = transcript
        // Set a timeout to handle the pause after speech
        pauseTimeoutRef.current = setTimeout(handlePause, 1000)
        setInterimSpeech('')
      } else {
        setInterimSpeech(transcript)
      }
    }

    recognition.onspeechend = () => {
      // When speech ends, wait a bit and then handle the pause
      if (pauseTimeoutRef.current) {
        clearTimeout(pauseTimeoutRef.current)
      }
      pauseTimeoutRef.current = setTimeout(handlePause, 1000)
    }

    recognition.onend = () => {
      if (!isRestarting && recognitionRef.current === recognition) {
        isRestarting = true
        setTimeout(() => {
          try {
            recognition.start()
            isRestarting = false
          } catch (error) {
            console.error('Failed to restart speech recognition:', error)
          }
        }, 100)
      }
    }

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('Speech recognition error:', event.error)
      if (event.error === 'network') {
        // Handle network errors
        setTimeout(() => {
          if (recognitionRef.current === recognition) {
            try {
              recognition.start()
            } catch (error) {
              console.error('Failed to restart after network error:', error)
            }
          }
        }, 1000)
      } else if (event.error === 'not-allowed') {
        console.error('Microphone access denied')
      } else if (event.error !== 'aborted') {
        // Handle other errors except aborted
        setTimeout(() => {
          if (recognitionRef.current === recognition) {
            try {
              recognition.start()
            } catch (error) {
              console.error('Failed to restart after error:', error)
            }
          }
        }, 1000)
      }
    }

    return recognition
  }

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

  // Initialize everything
  useEffect(() => {
    const initialize = async () => {
      // Initialize media stream first
      const stream = await initializeMediaStream()
      if (!stream) return

      // Then initialize speech recognition
      const recognition = initializeSpeechRecognition()
      if (!recognition) return

      recognitionRef.current = recognition
      recognition.start()
    }

    initialize()

    // Cleanup function
    return () => {
      // Stop speech recognition
      if (recognitionRef.current) {
        recognitionRef.current.stop()
        recognitionRef.current = null
      }

      // Stop all tracks in the media stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
        streamRef.current = null
      }

      // Clear video srcObject
      if (videoRef.current) {
        videoRef.current.srcObject = null
      }
      if (interimTimeoutRef.current) {
        clearTimeout(interimTimeoutRef.current)
      }
      if (pauseTimeoutRef.current) {
        clearTimeout(pauseTimeoutRef.current)
      }
    }
  }, [])

  useEffect(() => {
    if ('speechSynthesis' in window) {
      synthRef.current = window.speechSynthesis
    }
  }, [])

  useEffect(() => {
    return () => {
      if (synthRef.current) {
        synthRef.current.cancel()
        isProcessingSpeechRef.current = false
        setSpeechQueue([])
      }
    }
  }, [])

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

  // Update the processSpeechQueue function
  const processSpeechQueue = async () => {
    if (isProcessingSpeechRef.current || !synthRef.current || speechQueue.length === 0) return;
    
    isProcessingSpeechRef.current = true;
    const text = speechQueue[0];
    
    const utterance = new window.SpeechSynthesisUtterance(text);
    utterance.onend = () => {
      // Remove the spoken message from the queue
      setSpeechQueue(prevQueue => prevQueue.filter((_, index) => index !== 0));
      isProcessingSpeechRef.current = false;
      setIsSpeaking(false);
    };
    
    setIsSpeaking(true);
    synthRef.current.speak(utterance);
  };

  // Update the useEffect to watch for queue changes and process next message
  useEffect(() => {
    if (speechQueue.length > 0 && !isProcessingSpeechRef.current) {
      processSpeechQueue();
    }
  }, [speechQueue, isProcessingSpeechRef.current]);

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
