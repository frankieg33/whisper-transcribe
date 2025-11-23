@echo off
echo Switching to CPU-only mode to save space...
echo WARNING: Transcription will be significantly slower without GPU acceleration.
echo.

cd backend
call venv\Scripts\activate

echo Uninstalling heavy GPU libraries...
pip uninstall -y torch torchaudio torchvision

echo Installing lightweight CPU libraries...
pip install torch torchaudio --index-url https://download.pytorch.org/whl/cpu

echo Re-installing other dependencies...
pip install -r requirements.txt

echo.
echo Done! Your app size should now be much smaller.
pause
