import whisper
import os

class Transcriber:
    def __init__(self, model_name="base"):
        self.model = whisper.load_model(model_name)

    def transcribe(self, audio_path: str):
        if not os.path.exists(audio_path):
            raise FileNotFoundError(f"File not found: {audio_path}")
        
        result = self.model.transcribe(audio_path)
        return result

transcriber_instance = Transcriber()
