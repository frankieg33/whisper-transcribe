# Testing Guide

## Testing the App

Since the frontend is running with `npm run dev`, Vite should have hot-reloaded the changes automatically.

### Steps to Test:

1. **Check the Electron window** - it should still be open
2. **Refresh the app** if needed (Ctrl+R or Cmd+R)
3. **Try the new features**:
   - Click the **Settings** button in the top right
   - Drag and drop an audio/video file
   - Click **Transcribe** - it should now work!
   - Watch the progress in the terminal

### Important Notes:

- **File Upload**: The app now uploads the entire file to the backend instead of using file paths
- **This may be slower for large files** (files are uploaded over HTTP)
- The backend saves files to a temp directory and cleans them up after processing

### Backend Restart

The Python backend needs to be restarted to pick up the new `/transcribe/upload` endpoint.

**To restart:**
1. Stop the current `npm run dev` (Ctrl+C in the terminal)
2. Run `npm run dev` again

This will restart both the Electron app and the Python backend.

### Expected Behavior:

When you click "Transcribe":
1. Status should change to "⏳ Processing..."
2. In the terminal, you should see Whisper processing logs
3. After completion, the transcript appears in an editable text box
4. You can click "📄 TXT" to download the transcript

### Troubleshooting:

If transcription doesn't work:
- Check the terminal for error messages
- Open DevTools (Ctrl+Shift+I) and check the Console tab
- Make sure the Python backend is running (you should see "Uvicorn running on...")
