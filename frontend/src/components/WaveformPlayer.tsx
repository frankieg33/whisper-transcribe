import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react'
import WaveSurfer from 'wavesurfer.js'
import { Play, Pause, Volume2, VolumeX, RotateCcw, RotateCw, Gauge } from 'lucide-react'

interface WaveformPlayerProps {
    audioUrl: string
    onReady?: () => void
    onPlay?: () => void
    onPause?: () => void
    onTimeUpdate?: (time: number) => void
}

export interface WaveformPlayerRef {
    seek: (time: number) => void
}

export const WaveformPlayer = forwardRef<WaveformPlayerRef, WaveformPlayerProps>(({ audioUrl, onReady, onPlay, onPause, onTimeUpdate }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null)
    const wavesurfer = useRef<WaveSurfer | null>(null)
    const [isPlaying, setIsPlaying] = useState(false)
    const [volume, setVolume] = useState(1)
    const [isMuted, setIsMuted] = useState(false)
    const [playbackRate, setPlaybackRate] = useState(1)

    const [showSpeedMenu, setShowSpeedMenu] = useState(false)
    const [menuPos, setMenuPos] = useState({ x: 0, y: 0 })
    const speedButtonRef = useRef<HTMLDivElement>(null)
    const menuRef = useRef<HTMLDivElement>(null)
    const isOpeningRef = useRef(false)

    useImperativeHandle(ref, () => ({
        seek: (time: number) => {
            if (wavesurfer.current) {
                wavesurfer.current.setTime(time)
            }
        }
    }))

    useEffect(() => {
        if (!containerRef.current) return

        const ws = WaveSurfer.create({
            container: containerRef.current,
            waveColor: '#818cf8', // Indigo-400
            progressColor: '#c084fc', // Purple-400
            cursorColor: '#f472b6', // Pink-400
            barWidth: 2,
            barGap: 3,
            height: 80,
            barRadius: 3,
            normalize: true,
        })

        wavesurfer.current = ws

        ws.on('ready', () => {
            onReady?.()
            ws.setPlaybackRate(playbackRate)
        })

        ws.on('play', () => {
            setIsPlaying(true)
            onPlay?.()
        })

        ws.on('pause', () => {
            setIsPlaying(false)
            onPause?.()
        })

        ws.on('timeupdate', (currentTime) => {
            onTimeUpdate?.(currentTime)
        })

        // Handle load errors gracefully
        const loadAudio = async () => {
            try {
                await ws.load(audioUrl)
            } catch (err) {
                // Ignore AbortError which happens on rapid component unmounts
                if (err instanceof Error && err.name === 'AbortError') return
                console.error("Error loading audio:", err)
            }
        }
        loadAudio()

        return () => {
            try {
                ws.destroy()
            } catch (e) {
                console.debug("WaveSurfer destroy error:", e)
            }
            wavesurfer.current = null
        }
    }, [audioUrl])

    useEffect(() => {
        const closeMenu = (e: MouseEvent) => {
            // Don't close if we're in the process of opening
            if (isOpeningRef.current) return

            // Don't close if clicking inside the menu or the speed button
            if (
                menuRef.current?.contains(e.target as Node) ||
                speedButtonRef.current?.contains(e.target as Node)
            ) {
                return
            }
            setShowSpeedMenu(false)
        }

        const closeOnRightClick = (e: MouseEvent) => {
            // Don't close if we're in the process of opening
            if (isOpeningRef.current) return

            // Close menu on right-click outside
            if (
                !menuRef.current?.contains(e.target as Node) &&
                !speedButtonRef.current?.contains(e.target as Node)
            ) {
                setShowSpeedMenu(false)
            }
        }

        window.addEventListener('click', closeMenu)
        window.addEventListener('contextmenu', closeOnRightClick)
        return () => {
            window.removeEventListener('click', closeMenu)
            window.removeEventListener('contextmenu', closeOnRightClick)
        }
    }, [])

    const togglePlay = () => {
        wavesurfer.current?.playPause()
    }

    const toggleMute = () => {
        if (wavesurfer.current) {
            const newMuted = !isMuted
            setIsMuted(newMuted)
            wavesurfer.current.setVolume(newMuted ? 0 : volume)
        }
    }

    const skipBackward = () => {
        wavesurfer.current?.skip(-5)
    }

    const skipForward = () => {
        wavesurfer.current?.skip(5)
    }

    const handleSpeedChange = (newSpeed: number) => {
        setPlaybackRate(newSpeed)
        wavesurfer.current?.setPlaybackRate(newSpeed)
    }

    const handleContextMenu = (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()

        // Set flag to prevent immediate closure
        isOpeningRef.current = true

        setMenuPos({ x: e.clientX, y: e.clientY })
        setShowSpeedMenu(true)

        // Clear the flag after a brief delay to allow menu to render
        setTimeout(() => {
            isOpeningRef.current = false
        }, 100)
    }

    const presets = [0.5, 1.0, 1.2, 1.4, 1.6, 1.8, 2.0]

    const handleMainClick = (e: React.MouseEvent) => {
        e.stopPropagation() // Prevent closing menu if it's open (though it will toggle preset)
        // Cycle to next preset
        // Find index of current rate in presets
        const currentIndex = presets.indexOf(playbackRate)

        let nextRate;
        if (currentIndex !== -1) {
            // If currently on a preset, go to next
            nextRate = presets[(currentIndex + 1) % presets.length]
        } else {
            // If on a custom rate, find the next highest preset
            nextRate = presets.find(p => p > playbackRate) || presets[0]
        }

        handleSpeedChange(nextRate)
    }

    return (
        <div className="bg-black/20 backdrop-blur-md rounded-2xl p-4 border border-white/10 shadow-xl relative">
            <div ref={containerRef} className="w-full mb-4" />

            <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-4">
                    <button
                        onClick={skipBackward}
                        className="p-2 rounded-full hover:bg-white/10 transition-all text-white/70 hover:text-white"
                        title="Rewind 5s"
                    >
                        <RotateCcw size={20} />
                    </button>

                    <button
                        onClick={togglePlay}
                        className="p-3 rounded-full bg-white/10 hover:bg-white/20 transition-all text-white hover:scale-105 active:scale-95"
                    >
                        {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" />}
                    </button>

                    <button
                        onClick={skipForward}
                        className="p-2 rounded-full hover:bg-white/10 transition-all text-white/70 hover:text-white"
                        title="Forward 5s"
                    >
                        <RotateCw size={20} />
                    </button>
                </div>

                <div className="flex items-center gap-6">
                    {/* Speed Control */}
                    <div
                        ref={speedButtonRef}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-white/10 transition-all group cursor-pointer select-none"
                        onClick={handleMainClick}
                        onContextMenu={handleContextMenu}
                        role="button"
                        title="Left-click: Cycle Presets | Right-click: Fine Tune Slider"
                    >
                        <Gauge size={16} className="text-white/70 group-hover:text-white transition-colors" />
                        <span className="text-xs font-mono font-bold text-white/90 w-8 text-center">{playbackRate.toFixed(1)}x</span>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={toggleMute}
                            className="p-2 rounded-full hover:bg-white/10 transition-all text-white/70 hover:text-white"
                        >
                            {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                        </button>
                        <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.05"
                            value={isMuted ? 0 : volume}
                            onChange={(e) => {
                                const val = parseFloat(e.target.value)
                                setVolume(val)
                                setIsMuted(val === 0)
                                wavesurfer.current?.setVolume(val)
                            }}
                            className="w-24 accent-purple-500 h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer"
                        />
                    </div>
                </div>
            </div>

            {/* Speed Slider Context Menu */}
            {showSpeedMenu && (
                <div
                    ref={menuRef}
                    style={{ top: menuPos.y, left: menuPos.x }}
                    className="fixed z-50 bg-slate-800 border border-white/10 rounded-xl shadow-2xl p-4 flex flex-col min-w-[200px] animate-in fade-in zoom-in-95 duration-100"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="flex justify-between items-center mb-3">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Fine Tune Speed</span>
                        <span className="text-xs font-mono text-cyan-400">{playbackRate.toFixed(2)}x</span>
                    </div>

                    <input
                        type="range"
                        min="0.1"
                        max="16"
                        step="0.1"
                        value={playbackRate}
                        onChange={(e) => handleSpeedChange(parseFloat(e.target.value))}
                        className="w-full accent-cyan-500 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer mb-2"
                    />
                    <div className="flex justify-between text-[10px] text-slate-500 font-mono px-1">
                        <span>0.1x</span>
                        <span>16x</span>
                    </div>
                </div>
            )}
        </div>
    )
})
