"""Fetch the official MediaPipe test photo; it is not included in the app."""
from pathlib import Path
import urllib.request
dest = Path(__file__).resolve().parents[1] / 'native/androidTest/assets/hand.jpg'
dest.parent.mkdir(parents=True, exist_ok=True)
if not dest.exists():
    with urllib.request.urlopen('https://storage.googleapis.com/mediapipe-assets/right_hands.jpg', timeout=45) as response:
        data = response.read()
    if not data.startswith(b'\xff\xd8') or len(data) > 2_000_000:
        raise RuntimeError('Unexpected MediaPipe fixture')
    dest.write_bytes(data)
print('Native palm detection fixture is ready.')
