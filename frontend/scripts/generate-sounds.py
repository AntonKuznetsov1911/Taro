"""Generate small offline sound cues for the native app (no sampled recordings)."""
import math
import random
import struct
import sys
import wave
from pathlib import Path

RATE = 22050
DEST = Path(__file__).resolve().parents[1] / 'assets' / 'sounds'
DEST.mkdir(parents=True, exist_ok=True)
rng = random.Random(1911)

for name, duration in [('tap', .25), ('flip', .65), ('reveal', 1.9), ('shuffle', .88), ('chime', 2.1), ('draw', 1.7)]:
    samples = [0.] * int(RATE * duration)

    def tone(freq, delay, length, level):
        for i in range(int(length * RATE)):
            j = i + int(delay * RATE)
            if j >= len(samples): break
            t = i / RATE
            envelope = min(1, t / .018) * math.exp(-5 * t / length)
            samples[j] += level * envelope * (math.sin(2 * math.pi * freq * t) + .22 * math.sin(2 * math.pi * freq * 2.01 * t))

    def rustle(delay, length, level):
        prev = 0.
        for i in range(int(length * RATE)):
            j = i + int(delay * RATE)
            if j >= len(samples): break
            t = i / RATE
            prev = .72 * prev + .28 * rng.uniform(-1, 1)
            samples[j] += level * prev * min(1, t / .012) * math.exp(-6 * t / length)

    if name == 'tap':
        tone(396, 0, .2, .11); tone(198, 0, .2, .05)
    elif name == 'flip':
        rustle(0, .26, .5); rustle(.05, .2, .25); tone(174, .03, .5, .05)
    elif name == 'reveal':
        tone(220, 0, 1.65, .23); tone(330, .14, 1.5, .12); rustle(0, .55, .08)
    elif name == 'shuffle':
        paper = random.Random(3251)

        def brush(delay, length, level, crisp):
            smooth = 0.
            for i in range(int(length * RATE)):
                j = i + int(delay * RATE)
                if j >= len(samples): break
                t = i / RATE
                grain = paper.uniform(-1, 1)
                smooth = .77 * smooth + .23 * grain
                envelope = min(1, t / .002) * math.exp(-4.2 * t / length)
                samples[j] += level * envelope * (smooth + crisp * (grain - smooth))

        # Two packets of cards slip together, then the deck settles on the table.
        for start in (.025, .365):
            brush(start, .24, .13, .32)
            for n in range(11):
                brush(start + .022 * n + paper.uniform(0, .009), .065,
                      paper.uniform(.11, .30) * (1 - n * .045), .53)
        brush(.691, .11, .29, .12)
    elif name == 'chime':
        for n, freq in enumerate([220, 261.63, 329.63]): tone(freq, n * .26, 1.5, .2 - n * .02)
    elif name == 'draw':
        for n in range(4): rustle(n * .07, .2, .25)
        tone(164.81, .3, 1.35, .2)
    if len(sys.argv) > 1 and name not in sys.argv[1:]:
        continue
    pcm = b''.join(struct.pack('<h', int(max(-.95, min(.95, x)) * 32767)) for x in samples)
    with wave.open(str(DEST / f'{name}.wav'), 'wb') as out:
        out.setnchannels(1); out.setsampwidth(2); out.setframerate(RATE); out.writeframes(pcm)
print('Generated offline sound cues.')
