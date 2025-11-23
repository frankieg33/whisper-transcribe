import React, { useState, useEffect, useRef } from 'react';
import { Edit3, Save, User, Clock } from 'lucide-react';

interface Segment {
    start: number;
    end: number;
    text: string;
    speaker?: string;
}

interface TranscriptEditorProps {
    initialText: string;
    segments?: Segment[];
    onSave: (text: string, segments?: Segment[]) => void;
    currentTime?: number;
    onSeek?: (time: number) => void;
    showTimestamps?: boolean;
    onToggleTimestamps?: () => void;
}

const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

export const TranscriptEditor: React.FC<TranscriptEditorProps> = ({
    initialText,
    segments: initialSegments,
    onSave,
    currentTime,
    onSeek,
    showTimestamps = true,
    onToggleTimestamps
}) => {
    const [text, setText] = useState(initialText);
    const [segments, setSegments] = useState<Segment[]>(initialSegments || []);
    const [isFocused, setIsFocused] = useState(false);
    const activeSegmentRef = useRef<HTMLElement>(null);

    useEffect(() => {
        setText(initialText);
        if (initialSegments) {
            setSegments(initialSegments);
        }
    }, [initialText, initialSegments]);

    useEffect(() => {
        if (activeSegmentRef.current && !isFocused) {
            activeSegmentRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }, [currentTime, isFocused]);

    const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newText = e.target.value;
        setText(newText);
        onSave(newText, segments.length > 0 ? segments : undefined);
    };

    const handleSegmentTextChange = (index: number, newText: string) => {
        const newSegments = [...segments];
        newSegments[index] = { ...newSegments[index], text: newText };
        setSegments(newSegments);

        // Reconstruct full text
        const fullText = newSegments.map(s => {
            const speakerPrefix = s.speaker ? `[${s.speaker}] ` : '';
            return `${speakerPrefix}${s.text}`;
        }).join('\n\n');

        setText(fullText);
        onSave(fullText, newSegments);
    };

    const handleSpeakerChange = (oldSpeaker: string, newSpeaker: string) => {
        const newSegments = segments.map(seg =>
            seg.speaker === oldSpeaker ? { ...seg, speaker: newSpeaker } : seg
        );
        setSegments(newSegments);

        // Reconstruct full text
        const fullText = newSegments.map(s => {
            const speakerPrefix = s.speaker ? `[${s.speaker}] ` : '';
            return `${speakerPrefix}${s.text}`;
        }).join('\n\n');

        setText(fullText);
        onSave(fullText, newSegments);
    };

    const wordCount = text.trim().split(/\s+/).filter(word => word.length > 0).length;

    return (
        <div className={`w-full h-full flex flex-col bg-[#1e293b]/50 rounded-xl border transition-all ${isFocused ? 'border-purple-500/50 shadow-lg shadow-purple-500/10' : 'border-white/10'
            } overflow-hidden backdrop-blur-sm`}>
            <div className="bg-white/5 px-5 py-3 border-b border-white/5 flex justify-between items-center flex-shrink-0">
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 text-purple-400">
                        <Edit3 size={16} />
                        <span className="text-sm font-semibold text-slate-200">Transcript Editor</span>
                    </div>
                    <div className="h-4 w-px bg-white/10"></div>

                    {segments.length > 0 && (
                        <button
                            onClick={onToggleTimestamps}
                            className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium transition-all ${showTimestamps
                                ? 'bg-purple-500/20 text-purple-300'
                                : 'text-slate-400 hover:bg-white/5 hover:text-slate-300'
                                }`}
                            title={showTimestamps ? "Hide Timestamps" : "Show Timestamps"}
                        >
                            <Clock size={12} />
                            <span>{showTimestamps ? 'Timestamps On' : 'Timestamps Off'}</span>
                        </button>
                    )}

                    <div className="h-4 w-px bg-white/10"></div>
                    <div className="flex items-center gap-1.5 text-xs text-emerald-400/80">
                        <Save size={12} />
                        <span>Auto-saved</span>
                    </div>
                </div>
                <div className="flex gap-4 text-xs text-slate-500 font-medium">
                    <span>{segments.length > 0 ? `${segments.length} segments` : ''}</span>
                    <span>{wordCount} words</span>
                </div>
            </div>

            {segments.length > 0 ? (
                <div className="flex-1 overflow-y-auto p-6 space-y-8">
                    {(() => {
                        const groups = [];
                        if (segments.length > 0) {
                            let currentGroup = {
                                speaker: segments[0].speaker,
                                segments: [segments[0]],
                                startIndices: [0]
                            };

                            for (let i = 1; i < segments.length; i++) {
                                if (segments[i].speaker === currentGroup.speaker) {
                                    currentGroup.segments.push(segments[i]);
                                    currentGroup.startIndices.push(i);
                                } else {
                                    groups.push(currentGroup);
                                    currentGroup = {
                                        speaker: segments[i].speaker,
                                        segments: [segments[i]],
                                        startIndices: [i]
                                    };
                                }
                            }
                            groups.push(currentGroup);
                        }

                        return groups.map((group, groupIndex) => (
                            <div key={groupIndex} className="relative pl-4 border-l-2 border-white/5 hover:border-purple-500/30 transition-colors">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="flex items-center gap-2">
                                        <User size={12} className="text-cyan-400" />
                                        <input
                                            type="text"
                                            value={group.speaker || 'Unknown'}
                                            onChange={(e) => handleSpeakerChange(group.speaker || 'Unknown', e.target.value)}
                                            className="bg-transparent border border-transparent hover:border-white/10 focus:border-cyan-500/50 rounded px-1 py-0.5 text-xs font-bold text-cyan-400 focus:ring-0 focus:outline-none transition-all"
                                            title="Click to rename speaker (renames all occurrences)"
                                        />
                                    </div>
                                    {showTimestamps && (
                                        <div className="text-xs font-mono text-slate-500">
                                            {formatTime(group.segments[0].start)}
                                        </div>
                                    )}
                                </div>

                                <div className="text-slate-200 text-sm leading-relaxed">
                                    {group.segments.map((segment, segIndex) => {
                                        const globalIndex = group.startIndices[segIndex];
                                        const isActive = currentTime !== undefined && currentTime >= segment.start && currentTime < segment.end;

                                        return (
                                            <span
                                                key={globalIndex}
                                                ref={isActive ? activeSegmentRef : null}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onSeek?.(segment.start);
                                                }}
                                                contentEditable
                                                suppressContentEditableWarning
                                                onBlur={(e) => handleSegmentTextChange(globalIndex, e.currentTarget.textContent || '')}
                                                className={`mr-1 px-0.5 rounded cursor-pointer transition-colors hover:bg-white/5 ${isActive ? 'bg-purple-500/20 text-purple-200' : ''
                                                    }`}
                                                title={`${formatTime(segment.start)} - ${formatTime(segment.end)}`}
                                            >
                                                {segment.text}
                                            </span>
                                        );
                                    })}
                                </div>
                            </div>
                        ));
                    })()}
                </div>
            ) : (
                <textarea
                    className="flex-1 w-full p-6 bg-transparent text-slate-200 focus:outline-none resize-none leading-relaxed font-mono text-sm"
                    value={text}
                    onChange={handleTextChange}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    placeholder="Transcript will appear here..."
                    spellCheck={false}
                />
            )}
        </div>
    );
};
