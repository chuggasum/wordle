# Generates icon-192.png, icon-512.png, og.png (needs Pillow). Run: python tools/make-images.py
from PIL import Image, ImageDraw, ImageFont
import os
root = os.path.join(os.path.dirname(__file__), '..', 'public')
PAPER, INK, TEAL, GOLD, GREY, RED = '#f6efe0', '#1d2433', '#12806f', '#f5a800', '#6b7280', '#e8503a'

def font(size):
    for f in ('georgiab.ttf', 'georgia.ttf', 'arialbd.ttf', 'DejaVuSerif-Bold.ttf'):
        try: return ImageFont.truetype(f, size)
        except OSError: pass
    return ImageFont.load_default()

def tile(d, x, y, s, color, letter=None, f=None):
    x, y, s = int(x), int(y), int(s)
    o = max(3, s // 14)
    d.rounded_rectangle([x + o, y + o * 1.4, x + s + o, y + s + o * 1.4], int(s // 8), fill=INK)
    d.rounded_rectangle([x, y, x + s, y + s], int(s // 8), fill=color, outline=INK, width=max(3, s // 20))
    if letter: d.text((x + s / 2, y + s / 2), letter, font=f, fill='white' if color != GOLD else INK, anchor='mm')

def icon(n):
    im = Image.new('RGB', (n, n), PAPER); d = ImageDraw.Draw(im)
    s = n * .22; gap = n * .035; total = 3 * s + 2 * gap; x0 = (n - total) / 2
    for i, c in enumerate((TEAL, GOLD, GREY)): tile(d, x0 + i * (s + gap), n * .22, s, c)
    d.text((n / 2, n * .72), 'BH', font=font(int(n * .3)), fill=INK, anchor='mm')
    im.save(os.path.join(root, f'icon-{n}.png'))

def og():
    W, H = 1200, 630
    im = Image.new('RGB', (W, H), PAPER); d = ImageDraw.Draw(im)
    for y in range(0, H, 22):
        for x in range((y // 22 % 2) * 11, W, 22): d.ellipse([x, y, x + 3, y + 3], fill='#e6dfce')
    f = font(120); w1 = d.textlength('Ben ', font=f); w2 = d.textlength('Hoffmann', font=f); x = (W - w1 - w2) / 2
    d.text((x, 90), 'Ben ', font=f, fill=INK); d.text((x + w1, 90), 'Hoffmann', font=f, fill=RED)
    d.text((W / 2, 270), 'One word. Six guesses. Can you crack it?', font=font(40), fill=INK, anchor='mm')
    pat = [(TEAL, GOLD, GREY, GREY, GOLD), (GREY, TEAL, TEAL, GOLD, GREY), (TEAL, TEAL, TEAL, TEAL, TEAL)]
    s, g = 80, 12; x0 = (W - (5 * s + 4 * g)) / 2
    for r, row in enumerate(pat):
        for c, col in enumerate(row): tile(d, x0 + c * (s + g), 318 + r * (s + g), s, col)
    im.save(os.path.join(root, 'og.png'))

icon(192); icon(512); og(); print('ok')
