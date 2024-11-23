import { useEffect, useRef, useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import { createClient } from '@supabase/supabase-js'

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

function App() {
  const [count, setCount] = useState(0)
  const [speechSegments, setSpeechSegments] = useState<SpeechSegment[]>([])
  const [interimSpeech, setInterimSpeech] = useState<string>('')
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const cleanupIntervalRef = useRef<NodeJS.Timeout | null>(null)

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

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const last = event.results.length - 1
      const transcript = event.results[last][0].transcript
      
      if (event.results[last].isFinal) {
        setSpeechSegments(prev => [...prev, {
          text: transcript,
          timestamp: Date.now()
        }])
        setInterimSpeech('')
      } else {
        setInterimSpeech(transcript)
      }
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

  // Clean up old speech segments
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
    }
  }, [])

  return (
    <div>
      <h1>Vite + React</h1>
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <p>
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
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
          color: "#000"
        }}>
          {speechSegments.map(segment => segment.text).join(' ')}
          <span>
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
