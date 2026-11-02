"""Serve an Expo static export, including extensionless routes, for local UI tests."""
from pathlib import Path
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

ROOT = Path(__file__).resolve().parents[1] / 'dist'

class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)
    def translate_path(self, url):
        resolved = super().translate_path(url)
        return resolved + '.html' if Path(resolved + '.html').is_file() else resolved

print('Taro production export: http://127.0.0.1:8873', flush=True)
ThreadingHTTPServer(('127.0.0.1', 8873), Handler).serve_forever()
