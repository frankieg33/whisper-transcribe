# Whisper Vibe Desktop App - Implementation Plan

## Goal Description
Build a modern desktop application for audio/video transcription using OpenAI's Whisper model. The app will support local processing and OpenAI API, speaker diarization, flexible exports, and a rich transcript editor.

## User Review Required
> [!IMPORTANT]
> **Tech Stack Decision**: I am proposing **Electron + React (Vite)** for the frontend to achieve the "vibe" and **Python (FastAPI)** for the backend to handle Whisper and Diarization.
> **Speaker Diarization**: I plan to use `pyannote.audio` or `whisperX` for speaker detection. This may require downloading additional models.
> **FFmpeg**: The user will need FFmpeg installed or I will need to bundle a static binary. For now, I will assume I can use a system-installed FFmpeg or try to download a portable one if needed.

## Proposed Changes

### Project Structure
I will create a directory `whisper-transcribe` with the following structure:
- `frontend/`: Electron + React + Vite application.
- `backend/`: Python FastAPI application.
- `shared/`: Shared types/interfaces (if possible, or just manual sync).

### Frontend (Electron + React)
#### [NEW] `frontend/`
- Initialize with `npm create vite@latest . -- --template react-ts`
- Add `electron`, `electron-builder` for desktop packaging.
- Add `tailwindcss` for styling.
- **Components**:
    - `DropZone`: For drag & drop file input.
    - `QueueManager`: To handle batch processing lists.
    - `TranscriptEditor`: A rich text editor (maybe `Slate.js` or `TipTap` or just a custom `contenteditable`) synced with an audio player.
    - `WaveformPlayer`: Visual audio player (using `wavesurfer.js`).
    - `SettingsPanel`: For configuring models, API keys, and themes.
    - **[NEW] SpeakerLabel**: Component to display and edit speaker names.

### Backend (Python)
#### [NEW] `backend/`
- `main.py`: FastAPI entry point.
- `transcriber.py`: Wrapper around `whisper` and `pyannote.audio` / `whisperX`.
- `diarization.py`: Handling speaker identification.
- `utils.py`: FFmpeg helpers for format conversion.
- `requirements.txt`: `fastapi`, `uvicorn`, `openai-whisper`, `torch`, `numpy`, `python-multipart`.

### Integration
- **Electron Main Process**:
    - On launch, spawn the Python FastAPI server as a child process.
    - Manage the lifecycle of the Python process.
    - Proxy requests or let the renderer talk directly to `localhost:<port>`.

### [NEW] UI/UX "Vibe" Upgrade
- **Design System**:
    - **Colors**: Deep, rich dark mode with vibrant accents (Neon Cyan, Electric Purple).
    - **Typography**: Modern sans-serif (Inter or Outfit).
    - **Effects**: Glassmorphism (backdrop-blur), smooth transitions, micro-interactions.
- **Layout**:
    - Split view: Queue/Player on the left, Transcript on the right (or top/bottom).
    - **Waveform**: Prominent visualization of the audio.

### [NEW] Advanced Features
- **Export**:
    - Backend must return segments with start/end times.
    - Frontend generates SRT/VTT from these segments.
- **Diarization**:
    - Backend uses `pyannote.audio` to identify speakers.
    - Frontend groups transcript segments by speaker.

## Verification Plan

### Automated Tests
- **Backend**: Write `pytest` tests for the FastAPI endpoints (mocking the heavy Whisper calls).
- **Frontend**: Basic component rendering tests with `vitest`.

### Manual Verification
1.  **Setup**: Run `npm install` and `pip install -r requirements.txt`.
2.  **Launch**: Run `npm run dev` (which should start Electron and the Python server).
3.  **Test Flow**:
    -   Drag and drop an MP3 file.
    -   Verify it appears in the queue.
    -   Click "Start".
    -   Verify progress bar updates.
    -   Verify transcription appears in the editor.
    -   Test "Speaker Naming" (renaming `Speaker 0` to `Alice`).
    -   Test Export to SRT/TXT.
