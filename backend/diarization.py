import os
from pyannote.audio import Pipeline
import torch

class Diarizer:
    def __init__(self, auth_token=None):
        self.auth_token = auth_token
        self.pipeline = None

    def load_pipeline(self):
        if not self.auth_token:
            raise ValueError("Hugging Face auth token is required for Pyannote Diarization")
        
        try:
            self.pipeline = Pipeline.from_pretrained(
                "pyannote/speaker-diarization-3.1",
                token=self.auth_token
            )
            
            if torch.cuda.is_available():
                self.pipeline.to(torch.device("cuda"))
        except Exception as e:
            raise RuntimeError(f"Failed to load diarization pipeline: {str(e)}")

    def diarize(self, audio_path):
        if not self.pipeline:
            self.load_pipeline()
            
        if not os.path.exists(audio_path):
            raise FileNotFoundError(f"File not found: {audio_path}")

        # Run diarization
        diarization = self.pipeline(audio_path)
        
        # Format results
        results = []
        for turn, _, speaker in diarization.itertracks(yield_label=True):
            results.append({
                "start": turn.start,
                "end": turn.end,
                "speaker": speaker
            })
            
        return results

diarizer_instance = Diarizer()
