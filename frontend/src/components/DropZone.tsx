import React, { useCallback, useState } from 'react';
import type { ReactNode } from 'react';

interface DropZoneProps {
    onFilesDropped: (files: File[]) => void;
    children?: ReactNode;
    className?: string;
}

export const DropZone: React.FC<DropZoneProps> = ({ onFilesDropped, children, className }) => {
    const [isDragging, setIsDragging] = useState(false);

    const handleDrop = useCallback(
        (e: React.DragEvent<HTMLDivElement>) => {
            e.preventDefault();
            e.stopPropagation();
            setIsDragging(false);

            const files = Array.from(e.dataTransfer.files);
            if (files.length > 0) {
                // In Electron, the File object has a 'path' property.
                // We don't need to do anything special here as the File object itself is passed.
                // The App component will check for the 'path' property.
                files.forEach((file) => {
                    if ((file as any).path) {
                        console.log(`File dropped with path: ${(file as any).path}`);
                    } else {
                        console.log('File dropped without path (using browser upload mode)');
                    }
                });
                onFilesDropped(files);
            }
        },
        [onFilesDropped]
    );

    const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
    }, []);

    const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    }, []);

    const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const filesList = Array.from(e.target.files);
            onFilesDropped(filesList);
            // Reset input value to allow re-adding the same file
            e.target.value = '';
        }
    };

    const handleClick = async () => {
        // Try to use Electron dialog if available
        try {
            // Dynamic import to avoid issues in browser environment if not mocked
            const electron = (window as any).require ? (window as any).require('electron') : null;
            const remote = electron ? (electron.remote || electron) : null;
            // Note: @electron/remote might be needed if remote is not on electron object directly
            // For now, let's stick to the simple file input trigger if electron dialog fails or isn't easy to access
            // The previous implementation had complex logic here, let's simplify for now and rely on the hidden input
            // unless we really need the system dialog. 
            // Actually, the system dialog is better for selecting files.

            if (remote && remote.dialog) {
                const result = await remote.dialog.showOpenDialog({
                    properties: ['openFile', 'multiSelections'],
                    filters: [
                        { name: 'Audio/Video', extensions: ['mp3', 'wav', 'mp4', 'mkv', 'm4a', 'flac', 'ogg', 'avi', 'mov', 'webm', 'aac', 'wma'] }
                    ]
                });
                if (!result.canceled && result.filePaths.length > 0) {
                    // ... (reconstruct File objects logic if needed, or just pass paths if backend handles it)
                    // For consistency with browser File API, we might just want to click the input.
                    // But input doesn't give full paths in browser (fake path). In Electron it does.
                }
            }
        } catch (error) {
            // console.log('Electron dialog not available', error);
        }

        document.getElementById('dropzone-file')?.click();
    };

    if (children) {
        return (
            <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onClick={handleClick}
                className={`relative ${className || ''} ${isDragging ? 'opacity-50' : ''}`}
            >
                {children}
                <input
                    id="dropzone-file"
                    type="file"
                    className="hidden"
                    multiple
                    accept="audio/*,video/*"
                    onChange={handleFileInputChange}
                />
            </div>
        );
    }

    return (
        <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onClick={handleClick}
            className={`relative flex flex-col items-center justify-center w-full h-full min-h-[300px] border-4 border-dashed rounded-3xl cursor-pointer transition-all duration-300 ${isDragging
                ? 'border-cyan-400 bg-cyan-500/10 scale-[1.01] shadow-2xl shadow-cyan-500/20'
                : 'border-slate-700 hover:border-cyan-500/50 bg-slate-900/50 hover:bg-slate-800/80'
                }`}
        >
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-blue-500/5 rounded-3xl pointer-events-none" />

            <div className="relative flex flex-col items-center justify-center px-8 text-center">
                <div className={`transition-all duration-300 ${isDragging ? 'scale-110 rotate-3' : ''}`}>
                    <svg
                        className={`w-20 h-20 mb-6 ${isDragging ? 'text-cyan-400' : 'text-slate-600'}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                        ></path>
                    </svg>
                </div>

                <p className="mb-3 text-2xl font-bold text-slate-200 tracking-tight">
                    <span className="text-cyan-400">Click to upload</span> or drag and drop
                </p>

                <p className="text-lg text-slate-500 mb-2 font-medium">
                    MP3, WAV, MP4, MKV, M4A, FLAC, OGG
                </p>

                <p className="text-sm text-slate-600">
                    Maximum file size: 2GB
                </p>
            </div>

            <input
                id="dropzone-file"
                type="file"
                className="hidden"
                multiple
                accept="audio/*,video/*"
                onChange={handleFileInputChange}
            />
        </div>
    );
};
