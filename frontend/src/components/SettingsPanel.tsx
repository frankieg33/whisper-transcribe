import React, { useState } from 'react';

interface Settings {
    modelQuality: string
    useAPI: boolean
    apiKey: string
    temperature: number
    enableDiarization: boolean
    hfToken: string
    showTimestamps: boolean
    exportPath: string
}

interface SettingsPanelProps {
    onClose: () => void;
    onSave: (settings: Settings) => void;
    initialSettings: Settings;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ onClose, onSave, initialSettings }) => {
    const [modelQuality, setModelQuality] = useState(initialSettings.modelQuality);
    const [apiKey, setApiKey] = useState(initialSettings.apiKey);
    const [useAPI, setUseAPI] = useState(initialSettings.useAPI);
    const [temperature, setTemperature] = useState(initialSettings.temperature);
    const [enableDiarization, setEnableDiarization] = useState(initialSettings.enableDiarization || false);
    const [hfToken, setHfToken] = useState(initialSettings.hfToken || '');
    const [showTimestamps, setShowTimestamps] = useState(initialSettings.showTimestamps ?? true);
    const [exportPath, setExportPath] = useState(initialSettings.exportPath || '');

    const handleSave = () => {
        onSave({
            modelQuality,
            useAPI,
            apiKey,
            temperature,
            enableDiarization,
            hfToken,
            showTimestamps,
            exportPath
        });
    };

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-lg flex items-center justify-center z-50 p-4">
            <div className="bg-[#1e293b] rounded-3xl border border-white/10 shadow-2xl shadow-black/50 w-full max-w-2xl max-h-[90vh] flex flex-col">
                {/* Header - Fixed */}
                <div className="flex justify-between items-center p-8 pb-6 border-b border-white/5 flex-shrink-0">
                    <h2 className="text-3xl font-bold text-white">
                        Settings
                    </h2>
                    <button
                        onClick={onClose}
                        className="w-10 h-10 flex items-center justify-center bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-slate-400 hover:text-white transition-all"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-8 space-y-6 min-h-0">
                    {/* Model Quality */}
                    <div className="bg-slate-900/50 p-6 rounded-2xl border border-white/5">
                        <label className="block text-base font-bold text-cyan-400 mb-3">
                            Model Quality
                        </label>
                        <select
                            value={modelQuality}
                            onChange={(e) => setModelQuality(e.target.value)}
                            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-5 py-4 text-white font-medium focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all"
                        >
                            <option value="tiny">Tiny - Fastest, Less Accurate</option>
                            <option value="base">Base - Balanced</option>
                            <option value="small">Small - Good Quality</option>
                            <option value="medium">Medium - High Quality</option>
                            <option value="large">Large - Best Quality, Slowest</option>
                        </select>
                        <p className="text-sm text-slate-400 mt-3">
                            Higher quality models provide better accuracy but take longer to process
                        </p>
                    </div>

                    {/* Export Path */}
                    <div className="bg-slate-900/50 p-6 rounded-2xl border border-white/5">
                        <label className="block text-base font-bold text-cyan-400 mb-3">
                            Default Export Path
                        </label>
                        <input
                            type="text"
                            value={exportPath}
                            onChange={(e) => setExportPath(e.target.value)}
                            placeholder="e.g. C:\Users\Name\Documents\Transcripts"
                            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-5 py-4 text-white font-medium focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all placeholder:text-slate-600"
                        />
                        <p className="text-sm text-slate-400 mt-3">
                            Leave empty to ask for location every time
                        </p>
                    </div>

                    {/* UI Settings */}
                    <div className="bg-slate-900/50 p-6 rounded-2xl border border-white/5">
                        <label className="flex items-center space-x-4 cursor-pointer group">
                            <div className="relative">
                                <input
                                    type="checkbox"
                                    checked={showTimestamps}
                                    onChange={(e) => setShowTimestamps(e.target.checked)}
                                    className="sr-only peer"
                                />
                                <div className="w-14 h-8 bg-slate-700 rounded-full peer-checked:bg-purple-500 transition-all border border-slate-600 peer-checked:border-purple-400"></div>
                                <div className="absolute left-1 top-1 w-6 h-6 bg-white rounded-full transition-transform peer-checked:translate-x-6 shadow-lg"></div>
                            </div>
                            <span className="text-base font-bold text-slate-200 group-hover:text-white transition-colors">
                                Show Timestamps in Editor
                            </span>
                        </label>
                    </div>

                    {/* Speaker Diarization */}
                    <div className="bg-slate-900/50 p-6 rounded-2xl border border-white/5">
                        <label className="flex items-center space-x-4 cursor-pointer group mb-4">
                            <div className="relative">
                                <input
                                    type="checkbox"
                                    checked={enableDiarization}
                                    onChange={(e) => setEnableDiarization(e.target.checked)}
                                    className="sr-only peer"
                                />
                                <div className="w-14 h-8 bg-slate-700 rounded-full peer-checked:bg-emerald-500 transition-all border border-slate-600 peer-checked:border-emerald-400"></div>
                                <div className="absolute left-1 top-1 w-6 h-6 bg-white rounded-full transition-transform peer-checked:translate-x-6 shadow-lg"></div>
                            </div>
                            <span className="text-base font-bold text-slate-200 group-hover:text-white transition-colors">
                                Enable Speaker Diarization
                            </span>
                        </label>

                        {enableDiarization && (
                            <div className="animate-in slide-in-from-top fade-in mt-4">
                                <label className="block text-base font-bold text-emerald-400 mb-3">
                                    Hugging Face Token
                                </label>
                                <input
                                    type="password"
                                    value={hfToken}
                                    onChange={(e) => setHfToken(e.target.value)}
                                    placeholder="hf_..."
                                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-5 py-4 text-white font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all placeholder:text-slate-600"
                                />
                                <p className="text-sm text-slate-400 mt-3">
                                    Required for Pyannote.audio. Accept user conditions on Hugging Face for <code>pyannote/speaker-diarization-3.1</code>.
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Use OpenAI API */}
                    <div className="bg-slate-900/50 p-6 rounded-2xl border border-white/5">
                        <label className="flex items-center space-x-4 cursor-pointer group">
                            <div className="relative">
                                <input
                                    type="checkbox"
                                    checked={useAPI}
                                    onChange={(e) => setUseAPI(e.target.checked)}
                                    className="sr-only peer"
                                />
                                <div className="w-14 h-8 bg-slate-700 rounded-full peer-checked:bg-blue-500 transition-all border border-slate-600 peer-checked:border-blue-400"></div>
                                <div className="absolute left-1 top-1 w-6 h-6 bg-white rounded-full transition-transform peer-checked:translate-x-6 shadow-lg"></div>
                            </div>
                            <span className="text-base font-bold text-slate-200 group-hover:text-white transition-colors">
                                Use OpenAI API (requires API key)
                            </span>
                        </label>
                    </div>

                    {/* API Key */}
                    {useAPI && (
                        <div className="bg-slate-900/50 p-6 rounded-2xl border border-white/5 animate-in slide-in-from-top fade-in">
                            <label className="block text-base font-bold text-blue-400 mb-3">
                                OpenAI API Key
                            </label>
                            <input
                                type="password"
                                value={apiKey}
                                onChange={(e) => setApiKey(e.target.value)}
                                placeholder="sk-..."
                                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-5 py-4 text-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all placeholder:text-slate-600"
                            />
                        </div>
                    )}

                    {/* Temperature */}
                    <div className="bg-slate-900/50 p-6 rounded-2xl border border-white/5">
                        <label className="block text-base font-bold text-violet-400 mb-3">
                            Temperature: <span className="text-white text-xl ml-2">{temperature.toFixed(1)}</span>
                        </label>
                        <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.1"
                            value={temperature}
                            onChange={(e) => setTemperature(parseFloat(e.target.value))}
                            className="w-full h-2 bg-slate-700 rounded-full appearance-none cursor-pointer accent-violet-500"
                        />
                        <p className="text-sm text-slate-400 mt-3">
                            Controls randomness (0 = precise, 1 = creative)
                        </p>
                    </div>
                </div>

                {/* Footer Buttons - Always Visible */}
                <div className="flex justify-end gap-4 p-8 pt-6 border-t border-white/5 bg-[#1e293b] flex-shrink-0">
                    <button
                        onClick={onClose}
                        className="bg-slate-800 hover:bg-slate-700 text-white px-8 py-3 rounded-xl transition-all font-bold text-lg border border-slate-700"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-xl transition-all font-bold text-lg shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 hover:scale-105"
                    >
                        Save Settings
                    </button>
                </div>
            </div>
        </div>
    );
};
