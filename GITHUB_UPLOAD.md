# Quick GitHub Upload Guide

## Step 1: Initialize Git (if not already done)
```bash
cd whisper-transcribe
git init
```

## Step 2: Add all files
```bash
git add .
```

## Step 3: Create your first commit
```bash
git commit -m "Initial commit: Whisper Transcribe application with speaker diarization and waveform player"
```

## Step 4: Create a new repository on GitHub
1. Go to https://github.com/new
2. Repository name: `whisper-transcribe`
3. Description: "Audio transcription app with OpenAI Whisper, speaker diarization, and interactive waveform player"
4. Don't initialize with README (we already have one)
5. Click "Create repository"

## Step 5: Link and push to GitHub
Replace `YOUR_USERNAME` with your actual GitHub username:

```bash
git remote add origin https://github.com/frankieg33/whisper-transcribe.git
git branch -M main
git push -u origin main
```

## Future Updates
After making changes:
```bash
git add .
git commit -m "Describe your changes here"
git push
```

## Notes
- The `.gitignore` file ensures that `node_modules`, `venv`, and other unnecessary files won't be uploaded
- Large model files and audio test files will also be excluded
- Make sure you have a GitHub account and are logged in via Git CLI
