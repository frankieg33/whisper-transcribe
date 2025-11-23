# Whisper Transcribe

A powerful desktop application for audio transcription using OpenAI's Whisper model with advanced features like speaker diarization, interactive waveform playback, and an intuitive text editor.

## Features

✨ **High-Quality Transcription**
- Powered by OpenAI's Whisper model
- Supports multiple audio formats
- Accurate transcription with timestamps

🎯 **Speaker Diarization**
- Automatic speaker detection and labeling
- Powered by Pyannote AI
- Color-coded speaker segments

🎵 **Interactive Waveform Player**
- Visual waveform display with WaveSurfer.js
- Variable playback speed (0.5x - 2.0x presets, 0.1x - 16x fine control)
- Skip forward/backward controls (5-second intervals)
- Volume control with mute toggle

📝 **Smart Text Editor**
- Real-time transcript editing
- Click timestamps to jump to audio position
- Toggle timestamp visibility
- Auto-sync with audio playback

🎨 **Modern UI**
- Beautiful dark theme with glassmorphism effects
- Responsive design
- Smooth animations and transitions

## Tech Stack

**Frontend:**
- Electron + Vite
- React + TypeScript
- TailwindCSS
- WaveSurfer.js for audio visualization

**Backend:**
- FastAPI (Python)
- OpenAI Whisper for transcription
- Pyannote for speaker diarization
- PyTorch

## Prerequisites

- **Node.js** (v18 or higher)
- **Python** (v3.10 or higher)
- **npm** or **yarn**
- **Git** (for version control)

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/whisper-transcribe.git
cd whisper-transcribe
```

### 2. Backend Setup

```bash
cd backend

# Create a virtual environment
python -m venv venv

# Activate the virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Note: If you have a CUDA-capable GPU, install PyTorch with CUDA support
# Visit https://pytorch.org/get-started/locally/ for specific instructions
```

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Build the application
npm run build
```

## Running the Application

### Development Mode

```bash
cd frontend
npm run dev
```

This will:
1. Start the Vite development server (frontend)
2. Launch Electron
3. Automatically start the Python backend server

### Production Build

```bash
cd frontend
npm run build
```

The packaged application will be in the `dist` folder.

## Usage

1. **Launch the application**
2. **Upload an audio file**
   - Click the upload area or drag & drop an audio file
   - Supported formats: MP3, WAV, M4A, FLAC, and more

3. **Wait for transcription**
   - The app will process your audio file
   - Progress will be displayed in real-time

4. **Review and edit transcript**
   - Click on timestamps to jump to that point in the audio
   - Edit the transcript text directly
   - Toggle timestamp visibility with the timestamps button

5. **Control playback**
   - **Play/Pause**: Start or stop audio playback
   - **Skip buttons**: Jump backward/forward by 5 seconds
   - **Speed control**: 
     - Left-click: Cycle through preset speeds (0.5x, 1.0x, 1.2x, 1.4x, 1.6x, 1.8x, 2.0x)
     - Right-click: Open slider for fine-grained speed control (0.1x - 16x)
   - **Volume**: Adjust or mute audio volume

## Configuration

### Python Backend Port
The backend runs on `http://127.0.0.1:8000` by default. To change this, edit:
- `backend/main.py` - Update the `uvicorn.run()` parameters
- `frontend/src/App.tsx` - Update the API URL

### Whisper Model
By default, the app uses the `base` model. To use a different model:
1. Edit `backend/main.py`
2. Change the model name in the `load_model()` function
3. Available models: `tiny`, `base`, `small`, `medium`, `large`

## Uploading to GitHub

### First Time Setup

1. **Create a new repository on GitHub**
   - Go to https://github.com/new
   - Name it `whisper-transcribe`
   - Don't initialize with README (we already have one)

2. **Initialize Git in your project** (if not already done)
   ```bash
   cd whisper-transcribe
   git init
   ```

3. **Create a `.gitignore` file** (to exclude unnecessary files)
   ```bash
   # See the .gitignore section below
   ```

4. **Add your files**
   ```bash
   git add .
   git commit -m "Initial commit: Whisper Transcribe application"
   ```

5. **Link to GitHub and push**
   ```bash
   git remote add origin https://github.com/yourusername/whisper-transcribe.git
   git branch -M main
   git push -u origin main
   ```

### Recommended `.gitignore`

Create a `.gitignore` file in the root directory with:

```
# Python
backend/venv/
backend/__pycache__/
*.pyc
*.pyo
*.pyd
.Python
*.so
*.egg
*.egg-info/
dist/
build/

# Node
frontend/node_modules/
frontend/dist/
frontend/dist-electron/
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# OS
.DS_Store
Thumbs.db
*.swp
*.swo
*~

# IDE
.vscode/
.idea/
*.sublime-*

# Environment
.env
.env.local

# Misc
*.tmp
temp/
```

## Troubleshooting

### Backend doesn't start
- Make sure Python virtual environment is activated
- Check that all dependencies are installed: `pip install -r requirements.txt`
- Verify PyTorch is installed correctly: `python -c "import torch; print(torch.__version__)"`

### Frontend build fails
- Clear node_modules and reinstall: `rm -rf node_modules && npm install`
- Check Node.js version: `node --version` (should be v18+)

### Audio doesn't play
- Check browser console for errors
- Verify the audio file format is supported
- Try converting to MP3 or WAV

### Transcription is slow
- Consider using a smaller Whisper model (`tiny` or `base`)
- If you have a GPU, install PyTorch with CUDA support
- Disable speaker diarization for faster processing

## Performance Optimization

### CPU-Only Mode
If you're running on a system without a GPU, use the CPU-optimized PyTorch:
```bash
cd backend
.\reduce_size_cpu_only.bat  # Windows
```

### GPU Mode
For systems with CUDA-capable GPUs:
```bash
cd backend
.\restore_gpu_mode.bat  # Windows
```

Or manually install:
```bash
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118
```

## License

MIT License - feel free to use this project for personal or commercial purposes.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Acknowledgments

- [OpenAI Whisper](https://github.com/openai/whisper) - Transcription model
- [Pyannote Audio](https://github.com/pyannote/pyannote-audio) - Speaker diarization
- [WaveSurfer.js](https://wavesurfer-js.org/) - Waveform visualization
- [Electron](https://www.electronjs.org/) - Desktop application framework

## Support

If you encounter any issues or have questions, please open an issue on GitHub.

---

Made with ❤️ using Whisper AI
