import suppress_warnings  # Suppress repetitive warnings
from fastapi import FastAPI, HTTPException, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import PlainTextResponse
from pydantic import BaseModel
import os
import tempfile
from typing import Optional, List, Dict
from transcriber import transcriber_instance
from diarization import diarizer_instance
from utils import assign_speakers

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class TranscribeRequest(BaseModel):
    file_path: str
    enable_diarization: bool = False
    hf_token: Optional[str] = None

class ExportRequest(BaseModel):
    segments: List[Dict]
    format: str  # 'txt', 'srt', 'vtt'

@app.get("/")
def read_root():
    return {"message": "Whisper Vibe Backend is running"}

@app.post("/transcribe/upload")
async def transcribe_upload(
    file: UploadFile = File(...),
    enable_diarization: bool = Form(False),
    hf_token: Optional[str] = Form(None)
):
    """Accept file upload and transcribe it"""
    temp_path = None
    try:
        # Save uploaded file to temp directory
        suffix = os.path.splitext(file.filename or "audio.mp3")[1]
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as temp_file:
            temp_path = temp_file.name
            content = await file.read()
            temp_file.write(content)
        
        # Run transcription
        result = transcriber_instance.transcribe(temp_path)

        # Optionally run diarization
        if enable_diarization and hf_token:
            diarizer_instance.auth_token = hf_token
            diarization = diarizer_instance.diarize(temp_path)
            segments = assign_speakers(result.get('segments', []), diarization)
            result['segments'] = segments
        else:
            # No diarization, just add Unknown speaker
            segments = result.get('segments', [])
            if segments:
                for seg in segments:
                    seg['speaker'] = 'Unknown'
        
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        # Clean up temp file
        if temp_path and os.path.exists(temp_path):
            try:
                os.unlink(temp_path)
            except:
                pass

@app.post("/transcribe")
def transcribe_audio(request: TranscribeRequest):
    if not os.path.exists(request.file_path):
        raise HTTPException(status_code=404, detail="File not found")
    
    try:
        # Run transcription
        result = transcriber_instance.transcribe(request.file_path)
        
        # Optionally run diarization
        if request.enable_diarization and request.hf_token:
            diarizer_instance.auth_token = request.hf_token
            diarization = diarizer_instance.diarize(request.file_path)
            segments = assign_speakers(result.get('segments', []), diarization)
            result['segments'] = segments
        else:
            # No diarization, just add Unknown speaker
            segments = result.get('segments', [])
            if segments:
                for seg in segments:
                    seg['speaker'] = 'Unknown'
        
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/export/txt")
def export_txt(request: ExportRequest):
    try:
        text = "\n\n".join([seg.get('text', '') for seg in request.segments])
        return PlainTextResponse(content=text)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/export/srt")
def export_srt(request: ExportRequest):
    try:
        srt_content = ""
        for i, seg in enumerate(request.segments, 1):
            start = seg.get('start', 0)
            end = seg.get('end', 0)
            text = seg.get('text', '').strip()
            speaker = seg.get('speaker', '')
            
            # Format timestamps
            start_time = format_timestamp_srt(start)
            end_time = format_timestamp_srt(end)
            
            # Add speaker prefix if available
            if speaker:
                text = f"[{speaker}] {text}"
            
            srt_content += f"{i}\n{start_time} --> {end_time}\n{text}\n\n"
        
        return PlainTextResponse(content=srt_content)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/export/vtt")
def export_vtt(request: ExportRequest):
    try:
        vtt_content = "WEBVTT\n\n"
        for seg in request.segments:
            start = seg.get('start', 0)
            end = seg.get('end', 0)
            text = seg.get('text', '').strip()
            speaker = seg.get('speaker', '')
            
            # Format timestamps
            start_time = format_timestamp_vtt(start)
            end_time = format_timestamp_vtt(end)
            
            # Add speaker prefix if available
            if speaker:
                text = f"[{speaker}] {text}"
            
            vtt_content += f"{start_time} --> {end_time}\n{text}\n\n"
        
        return PlainTextResponse(content=vtt_content)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

def format_timestamp_srt(seconds):
    """Format seconds to SRT timestamp format (HH:MM:SS,mmm)"""
    hours = int(seconds // 3600)
    minutes = int((seconds % 3600) // 60)
    secs = int(seconds % 60)
    millis = int((seconds - int(seconds)) * 1000)
    return f"{hours:02d}:{minutes:02d}:{secs:02d},{millis:03d}"

def format_timestamp_vtt(seconds):
    """Format seconds to WebVTT timestamp format (HH:MM:SS.mmm)"""
    hours = int(seconds // 3600)
    minutes = int((seconds % 3600) // 60)
    secs = int(seconds % 60)
    millis = int((seconds - int(seconds)) * 1000)
    return f"{hours:02d}:{minutes:02d}:{secs:02d}.{millis:03d}"
