import { useState, useEffect, useMemo, useRef } from 'react'
import { DropZone } from './components/DropZone'
import { TranscriptEditor } from './components/TranscriptEditor'
import { SettingsPanel } from './components/SettingsPanel'
import { WaveformPlayer } from './components/WaveformPlayer'
import type { WaveformPlayerRef } from './components/WaveformPlayer'
import {
  Settings,
  FileAudio,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Download,
  Trash2,
  Plus,
  Cpu,
  Cloud,
  Layers,
  XCircle,
  RefreshCw
} from 'lucide-react'

interface QueueItem {
  id: string
  file: File
  status: 'pending' | 'processing' | 'completed' | 'error' | 'cancelled'
  transcript?: string
  segments?: any[]
  progress?: number
  progressMessage?: string
  startTime?: number
  elapsedTime?: number
  audioUrl?: string
}

interface AppSettings {
  modelQuality: string
  useAPI: boolean
  apiKey: string
  temperature: number
  enableDiarization: boolean
  hfToken: string
  showTimestamps: boolean
  exportPath: string
}

const DEFAULT_SETTINGS: AppSettings = {
  modelQuality: 'base',
  useAPI: false,
  apiKey: '',
  temperature: 0,
  enableDiarization: false,
  hfToken: '',
  showTimestamps: true,
  exportPath: ''
}

function App() {
  const [sidebarWidth, setSidebarWidth] = useState(320)
  const [isResizing, setIsResizing] = useState(false)
  const [queue, setQueue] = useState<QueueItem[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [showSettings, setShowSettings] = useState(false)
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS)
  const [currentTime, setCurrentTime] = useState(0)

  const abortControllers = useRef<Map<string, AbortController>>(new Map())
  const waveformPlayerRef = useRef<WaveformPlayerRef>(null)

  // Load settings
  useEffect(() => {
    const saved = localStorage.getItem('whisper-settings')
    if (saved) {
      try {
        setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(saved) })
      } catch (e) {
        console.error('Failed to load settings:', e)
      }
    }
  }, [])

  const handleSaveSettings = (newSettings: AppSettings) => {
    setSettings(newSettings)
    localStorage.setItem('whisper-settings', JSON.stringify(newSettings))
    setShowSettings(false)
  }

  const startResizing = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsResizing(true)
  }

  const stopResizing = () => {
    setIsResizing(false)
  }

  const resize = (e: MouseEvent) => {
    if (isResizing) {
      const newWidth = e.clientX
      if (newWidth > 200 && newWidth < 600) {
        setSidebarWidth(newWidth)
      }
    }
  }

  useEffect(() => {
    window.addEventListener('mousemove', resize)
    window.addEventListener('mouseup', stopResizing)
    return () => {
      window.removeEventListener('mousemove', resize)
      window.removeEventListener('mouseup', stopResizing)
    }
  }, [isResizing])

  const handleFilesDropped = (droppedFiles: File[]) => {
    const newItems = droppedFiles.map((file) => ({
      id: crypto.randomUUID(),
      file,
      status: 'pending' as const,
      audioUrl: URL.createObjectURL(file)
    }))
    setQueue((prev) => [...prev, ...newItems])
    // Select the first new item if nothing is selected
    if (!selectedId && newItems.length > 0) {
      setSelectedId(newItems[0].id)
    }
  }

  const transcribeFile = async (id: string) => {
    const index = queue.findIndex(q => q.id === id)
    if (index === -1) return

    console.log('=== TRANSCRIBE STARTED ===')
    const startTime = Date.now()
    const item = queue[index]
    const file = item.file

    // Create AbortController
    const controller = new AbortController()
    abortControllers.current.set(id, controller)

    // Check if we have direct file path (Electron)
    const filePath = (file as any).path

    let progressInterval: number | undefined;

    setQueue((prev) =>
      prev.map((q) => (q.id === id ? {
        ...q,
        status: 'processing',
        progress: 0,
        progressMessage: filePath ? '🎙️ Transcribing audio with Whisper AI...' : '⏳ Preparing audio for transcription...',
        startTime
      } : q))
    )

    // Simulate progress updates (Whisper doesn't provide real progress)
    progressInterval = setInterval(() => {
      setQueue((prev) => {
        const item = prev.find(q => q.id === id)
        if (!item || item.status !== 'processing') {
          if (progressInterval) clearInterval(progressInterval)
          return prev
        }

        const elapsed = Date.now() - (item.startTime || Date.now())
        const fileSizeMB = item.file.size / 1024 / 1024

        // Estimate: roughly 1-2 seconds per MB for base model
        const estimatedTotalTime = fileSizeMB * 1500 // milliseconds
        const progress = Math.min(95, (elapsed / estimatedTotalTime) * 100)

        return prev.map((q) => (q.id === id ? { ...q, progress } : q))
      })
    }, 500) // Update every 500ms

    try {
      let response;

      if (filePath) {
        response = await fetch('http://127.0.0.1:8000/transcribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            file_path: filePath,
            enable_diarization: settings.enableDiarization,
            hf_token: settings.hfToken
          }),
          signal: controller.signal
        })
      } else {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('enable_diarization', String(settings.enableDiarization))
        if (settings.hfToken) {
          formData.append('hf_token', settings.hfToken)
        }
        // Note: Upload endpoint might not support cancellation mid-upload easily without XHR, but fetch signal works for the request
        response = await fetch('http://127.0.0.1:8000/transcribe/upload', {
          method: 'POST',
          body: formData,
          signal: controller.signal,
        })

        const uploadTime = Date.now() - startTime
        setQueue((prev) =>
          prev.map((q) => (q.id === id ? {
            ...q,
            progress: 50, // Upload complete, transcription starting
            progressMessage: '🎙️ Transcribing audio with Whisper AI...',
            elapsedTime: uploadTime
          } : q))
        )
      }

      if (progressInterval) clearInterval(progressInterval)

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Server returned ${response.status}: ${errorText}`)
      }

      const data = await response.json()
      const totalTime = Date.now() - startTime

      setQueue((prev) =>
        prev.map((q) =>
          q.id === id ? {
            ...q,
            status: 'completed',
            progress: 100,
            transcript: data.text,
            segments: data.segments,
            progressMessage: undefined,
            elapsedTime: totalTime
          } : q
        )
      )
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('Transcription cancelled')
        setQueue((prev) =>
          prev.map((q) => (q.id === id ? {
            ...q,
            status: 'cancelled',
            progressMessage: '🚫 Cancelled',
            elapsedTime: Date.now() - startTime
          } : q))
        )
      } else {
        console.error('=== TRANSCRIBE ERROR ===', error)
        const errorMessage = error instanceof Error ? error.message : String(error)
        setQueue((prev) =>
          prev.map((q) => (q.id === id ? {
            ...q,
            status: 'error',
            progressMessage: `❌ Error: ${errorMessage}`,
            elapsedTime: Date.now() - startTime
          } : q))
        )
      }
    } finally {
      if (progressInterval) clearInterval(progressInterval)
      abortControllers.current.delete(id)
    }
  }

  const cancelTranscription = (id: string) => {
    const controller = abortControllers.current.get(id)
    if (controller) {
      controller.abort()
    }
  }

  const retryTranscription = (id: string) => {
    transcribeFile(id)
  }

  const transcribeAll = async () => {
    const pendingIds = queue.filter(q => q.status === 'pending').map(q => q.id)
    if (pendingIds.length === 0) return

    for (const id of pendingIds) {
      await transcribeFile(id)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const exportTranscript = async (id: string, format: 'txt' | 'srt' | 'vtt' | 'json') => {
    const item = queue.find(q => q.id === id)
    if (!item) return

    try {
      let content = ''
      let filename = `${item.file.name.replace(/\.[^/.]+$/, "")}.${format}`

      if (format === 'txt') {
        content = item.segments
          ? item.segments.map(s => `[${formatTime(s.start)} - ${formatTime(s.end)}] ${s.speaker || 'Unknown'}: ${s.text}`).join('\n')
          : item.transcript || ''
      } else if (format === 'json') {
        content = JSON.stringify({
          text: item.transcript,
          segments: item.segments
        }, null, 2)
      } else if (item.segments) {
        // Fetch SRT/VTT from backend
        const response = await fetch(`http://127.0.0.1:8000/export/${format}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ segments: item.segments, format }),
        });

        if (!response.ok) throw new Error('Export failed');
        content = await response.text();
      } else {
        alert('No segment data available for this transcript. Re-transcribe to enable SRT/VTT export.');
        return;
      }

      // Try to save to exportPath if in Electron and path is set
      if (settings.exportPath && (window as any).require) {
        try {
          const fs = (window as any).require('fs');
          const path = (window as any).require('path');

          // Ensure directory exists
          if (!fs.existsSync(settings.exportPath)) {
            fs.mkdirSync(settings.exportPath, { recursive: true });
          }

          const fullPath = path.join(settings.exportPath, filename);
          fs.writeFileSync(fullPath, content);
          alert(`Saved to ${fullPath}`);
          return;
        } catch (err) {
          console.error("Failed to save to export path, falling back to download:", err);
        }
      }

      const blob = new Blob([content], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export transcript.');
    }
  }

  const removeItem = (id: string) => {
    cancelTranscription(id) // Cancel if running
    setQueue(prev => prev.filter(q => q.id !== id))
    if (selectedId === id) {
      setSelectedId(null)
    }
  }

  const handleTimeUpdate = (time: number) => {
    setCurrentTime(time)
  }

  const handleSeek = (time: number) => {
    if (waveformPlayerRef.current) {
      waveformPlayerRef.current.seek(time)
    }
  }

  const selectedItem = useMemo(() => queue.find(q => q.id === selectedId), [queue, selectedId])
  const hasPendingItems = useMemo(() => queue.some(q => q.status === 'pending'), [queue])

  return (
    <div className="flex h-screen bg-slate-950 text-slate-50 overflow-hidden font-sans selection:bg-cyan-500/30">
      {/* Sidebar */}
      <div
        style={{ width: sidebarWidth }}
        className="flex-shrink-0 border-r border-white/5 bg-slate-900/50 backdrop-blur-xl flex flex-col h-full relative group"
      >
        <div className="p-6 border-b border-white/5">
          <h1
            onClick={() => setSelectedId(null)}
            className="text-2xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500 mb-2 cursor-pointer hover:opacity-80 transition-opacity"
          >
            Whisper Transcribe
          </h1>
          <div className="flex items-center gap-2 text-xs font-medium text-slate-400 tracking-wide">
            <div className={`w-2 h-2 rounded-full ${settings.useAPI ? 'bg-blue-400' : 'bg-emerald-400'}`} />
            {settings.useAPI ? 'OpenAI API' : `Model: ${settings.modelQuality}`}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2 min-h-0">
          {queue.map((item) => (
            <div
              key={item.id}
              onClick={() => setSelectedId(item.id)}
              className={`group relative p-4 rounded-xl cursor-pointer transition-all border border-transparent hover:border-white/10 ${selectedId === item.id
                ? 'bg-white/5 border-white/10 shadow-lg'
                : 'hover:bg-white/5'
                }`}
            >
              <div className="flex items-center gap-4 mb-2">
                <div className={`p-2.5 rounded-xl ${item.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400' :
                  item.status === 'processing' ? 'bg-blue-500/10 text-blue-400 animate-pulse' :
                    item.status === 'error' ? 'bg-red-500/10 text-red-400' :
                      item.status === 'cancelled' ? 'bg-slate-700/50 text-slate-400' :
                        'bg-slate-800 text-slate-400'
                  }`}>
                  {item.status === 'completed' ? <CheckCircle2 size={18} /> :
                    item.status === 'processing' ? <Loader2 size={18} className="animate-spin" /> :
                      item.status === 'error' ? <AlertCircle size={18} /> :
                        item.status === 'cancelled' ? <XCircle size={18} /> :
                          <FileAudio size={18} />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm truncate text-slate-200 group-hover:text-white transition-colors tracking-wide">
                    {item.file.name}
                  </div>
                  <div className="text-xs text-slate-500 truncate mt-0.5">
                    {(item.file.size / 1024 / 1024).toFixed(1)} MB • {item.status}
                  </div>
                </div>

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {item.status === 'processing' && (
                    <button
                      onClick={(e) => { e.stopPropagation(); cancelTranscription(item.id) }}
                      className="p-2 hover:bg-white/10 text-slate-400 hover:text-white rounded-lg transition-all"
                      title="Cancel"
                    >
                      <XCircle size={16} />
                    </button>
                  )}
                  {(item.status === 'error' || item.status === 'cancelled') && (
                    <button
                      onClick={(e) => { e.stopPropagation(); retryTranscription(item.id) }}
                      className="p-2 hover:bg-white/10 text-slate-400 hover:text-white rounded-lg transition-all"
                      title="Retry"
                    >
                      <RefreshCw size={16} />
                    </button>
                  )}
                  <button
                    onClick={(e) => { e.stopPropagation(); removeItem(item.id) }}
                    className="p-2 hover:bg-red-500/10 text-slate-500 hover:text-red-400 rounded-lg transition-all"
                    title="Remove"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              {item.status === 'processing' && (
                <div className="mt-2">
                  <div className="relative h-1 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-300 ease-out"
                      style={{ width: `${item.progress || 0}%` }}
                    />
                  </div>
                  {item.progress !== undefined && (
                    <div className="text-[10px] text-cyan-400 font-bold mt-1 text-right tracking-wider">
                      {item.progress.toFixed(0)}%
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}

          {queue.length === 0 && (
            <div className="text-center py-12 text-slate-500 text-sm tracking-wide">
              No files in queue
            </div>
          )}
        </div>

        <div className="p-4 border-t border-white/5 space-y-3 bg-slate-900/80 backdrop-blur-xl z-10">
          <DropZone onFilesDropped={handleFilesDropped}>
            <button className="w-full py-4 rounded-xl border border-dashed border-slate-700 hover:border-cyan-500/50 hover:bg-cyan-500/5 text-slate-400 hover:text-cyan-400 transition-all flex items-center justify-center gap-2 text-sm font-semibold tracking-wide">
              <Plus size={18} />
              Add Files
            </button>
          </DropZone>

          <button
            onClick={() => setShowSettings(true)}
            className="w-full py-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all flex items-center justify-center gap-2 text-sm font-semibold tracking-wide"
          >
            <Settings size={18} />
            Settings
          </button>
        </div>

        {/* Resize Handle */}
        <div
          className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-cyan-500/50 transition-colors z-50"
          onMouseDown={startResizing}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col bg-slate-950 relative min-w-0">
        {/* Background Gradient Mesh */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-900/20 via-slate-950 to-slate-950 pointer-events-none" />

        {selectedItem ? (
          <div className="flex-1 flex flex-col h-full overflow-hidden relative z-10">
            {/* Header */}
            <div className="p-8 border-b border-white/5 flex justify-between items-center backdrop-blur-sm bg-slate-950/50 flex-shrink-0">
              <div>
                <h2 className="text-2xl font-bold text-white truncate max-w-2xl tracking-tight">{selectedItem.file.name}</h2>
                <div className="flex items-center gap-4 mt-2 text-sm text-slate-400 font-medium">
                  <span>{(selectedItem.file.size / 1024 / 1024).toFixed(2)} MB</span>
                  {selectedItem.elapsedTime && (
                    <span>• {(selectedItem.elapsedTime / 1000).toFixed(1)}s processing time</span>
                  )}
                </div>
              </div>

              <div className="flex gap-3">
                {hasPendingItems && (
                  <button
                    onClick={transcribeAll}
                    className="bg-slate-800 hover:bg-slate-700 text-white px-5 py-3 rounded-xl font-bold transition-all flex items-center gap-2 border border-white/10 shadow-lg"
                    title="Transcribe all pending files"
                  >
                    <Layers size={18} />
                    Process Queue
                  </button>
                )}

                {selectedItem.status === 'pending' && (
                  <button
                    onClick={() => transcribeFile(selectedItem.id)}
                    className="bg-cyan-600 hover:bg-cyan-500 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/30 transition-all flex items-center gap-2 tracking-wide"
                  >
                    <Cpu size={18} />
                    Transcribe
                  </button>
                )}

                {selectedItem.status === 'completed' && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => exportTranscript(selectedItem.id, 'txt')}
                      className="bg-slate-800 hover:bg-slate-700 text-white px-5 py-3 rounded-xl font-medium transition-all flex items-center gap-2 border border-white/5"
                    >
                      <Download size={18} /> TXT
                    </button>
                    <button
                      onClick={() => exportTranscript(selectedItem.id, 'srt')}
                      className="bg-slate-800 hover:bg-slate-700 text-white px-5 py-3 rounded-xl font-medium transition-all flex items-center gap-2 border border-white/5"
                    >
                      <Download size={18} /> SRT
                    </button>
                    <button
                      onClick={() => exportTranscript(selectedItem.id, 'vtt')}
                      className="bg-slate-800 hover:bg-slate-700 text-white px-5 py-3 rounded-xl font-medium transition-all flex items-center gap-2 border border-white/5"
                    >
                      <Download size={18} /> VTT
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Player & Content */}
            <div className="flex-1 flex flex-col p-8 space-y-8 min-h-0">
              {selectedItem.audioUrl && (
                <div className="flex-shrink-0">
                  <WaveformPlayer
                    ref={waveformPlayerRef}
                    audioUrl={selectedItem.audioUrl}
                    onTimeUpdate={handleTimeUpdate}
                  />
                </div>
              )}

              {selectedItem.status === 'completed' && selectedItem.transcript ? (
                <div className="flex-1 bg-slate-900/50 rounded-2xl border border-white/5 overflow-hidden shadow-xl min-h-0">
                  <TranscriptEditor
                    initialText={selectedItem.transcript}
                    segments={selectedItem.segments}
                    onSave={(newText, newSegments) => {
                      setQueue(prev => prev.map(q => q.id === selectedItem.id ? {
                        ...q,
                        transcript: newText,
                        segments: newSegments
                      } : q))
                    }}
                    currentTime={currentTime}
                    onSeek={handleSeek}
                    showTimestamps={settings.showTimestamps}
                    onToggleTimestamps={() => handleSaveSettings({ ...settings, showTimestamps: !settings.showTimestamps })}
                  />
                </div>
              ) : selectedItem.status === 'processing' ? (
                <div className="flex flex-col items-center justify-center flex-1 text-center">
                  <div className="w-20 h-20 mb-8 relative">
                    <div className="absolute inset-0 rounded-full border-4 border-cyan-500/20 animate-ping" />
                    <div className="absolute inset-0 rounded-full border-4 border-t-cyan-500 border-r-transparent border-b-transparent border-l-transparent animate-spin" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-3 tracking-tight">Transcribing...</h3>
                  <p className="text-slate-400 text-lg">{selectedItem.progressMessage}</p>
                </div>
              ) : selectedItem.status === 'error' ? (
                <div className="bg-red-500/5 border border-red-500/10 rounded-2xl p-12 text-center">
                  <AlertCircle size={64} className="mx-auto text-red-400 mb-6" />
                  <h3 className="text-2xl font-bold text-red-400 mb-3">Transcription Failed</h3>
                  <p className="text-red-200/60 text-lg">{selectedItem.progressMessage}</p>
                </div>
              ) : selectedItem.status === 'cancelled' ? (
                <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-12 text-center">
                  <XCircle size={64} className="mx-auto text-slate-500 mb-6" />
                  <h3 className="text-2xl font-bold text-slate-400 mb-3">Transcription Cancelled</h3>
                  <p className="text-slate-500 text-lg">The transcription process was cancelled.</p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center flex-1 text-center opacity-40">
                  <FileAudio size={80} className="mb-6 text-slate-600" />
                  <p className="text-slate-400 text-xl font-medium">Ready to transcribe</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center relative z-10">
            <div className="w-32 h-32 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 rounded-[2rem] flex items-center justify-center mb-8 backdrop-blur-xl border border-white/5 shadow-2xl shadow-cyan-500/10">
              <Cloud size={64} className="text-cyan-400" />
            </div>
            <h2 className="text-4xl font-black text-white mb-4 tracking-tight">Welcome to Whisper Transcribe</h2>
            <p className="text-slate-400 max-w-lg mb-12 text-lg leading-relaxed">
              Drag and drop audio or video files here to start transcribing with state-of-the-art AI.
            </p>
            <div className="w-full max-w-2xl h-64">
              <DropZone onFilesDropped={handleFilesDropped} />
            </div>
          </div>
        )}
      </div>

      {showSettings && (
        <SettingsPanel
          onClose={() => setShowSettings(false)}
          onSave={handleSaveSettings}
          initialSettings={settings}
        />
      )}
    </div>
  )
}

export default App
