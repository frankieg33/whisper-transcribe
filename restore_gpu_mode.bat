@echo off
echo Restoring GPU acceleration for fast transcription...
echo This will download ~2.5GB of data.
echo.

cd backend
call venv\Scripts\activate

echo Uninstalling CPU libraries...
pip uninstall -y torch torchaudio torchvision

echo Installing GPU libraries (CUDA 11.8)...
pip install torch torchaudio --index-url https://download.pytorch.org/whl/cu118

echo Re-installing other dependencies...
pip install -r requirements.txt

echo.
echo Done! Fast transcription is enabled again.
pause
