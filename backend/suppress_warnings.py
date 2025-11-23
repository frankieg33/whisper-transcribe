"""
Suppress repetitive deprecation warnings from torchaudio and pyannote
"""
import warnings

# Suppress specific warnings
# warnings.filterwarnings('ignore', category=UserWarning, module='torchaudio')
# warnings.filterwarnings('ignore', category=UserWarning, module='pyannote')
# warnings.filterwarnings('ignore', message='.*torchaudio._backend.*')
# warnings.filterwarnings('ignore', message='.*torchcodec.*')
warnings.filterwarnings('ignore', message='.*std\\(\\): degrees of freedom.*')
