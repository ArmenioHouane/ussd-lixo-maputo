from PIL import Image, ImageDraw, ImageFont
import os

OUT = os.path.join(os.path.dirname(__file__), '..', 'assets')
os.makedirs(OUT, exist_ok=True)

PRIMARY = (27, 122, 67)        # #1B7A43
PRIMARY_DARK = (15, 82, 48)    # #0F5230
WHITE = (255, 255, 255)
LIGHT = (229, 244, 236)        # #E5F4EC


def get_font(size):
    candidates = [
        'C:/Windows/Fonts/segoeuib.ttf',
        'C:/Windows/Fonts/segoeui.ttf',
        'C:/Windows/Fonts/arialbd.ttf',
        'C:/Windows/Fonts/arial.ttf',
    ]
    for path in candidates:
        if os.path.exists(path):
            try:
                return ImageFont.truetype(path, size)
            except Exception:
                pass
    return ImageFont.load_default()


def make_icon(size):
    img = Image.new('RGBA', (size, size), PRIMARY + (255,))
    d = ImageDraw.Draw(img)
    # Rounded square mask
    mask = Image.new('L', (size, size), 0)
    md = ImageDraw.Draw(mask)
    r = int(size * 0.18)
    md.rounded_rectangle((0, 0, size - 1, size - 1), radius=r, fill=255)
    img.putalpha(mask)

    d = ImageDraw.Draw(img)
    # Draw a stylized trash bin
    cx = size / 2
    pad = size * 0.22
    top = size * 0.30
    bot = size * 0.78
    lid_h = size * 0.06
    # Lid
    d.rounded_rectangle(
        (cx - size * 0.28, top - lid_h, cx + size * 0.28, top),
        radius=int(lid_h / 2),
        fill=WHITE,
    )
    d.rectangle(
        (cx - size * 0.22, top, cx + size * 0.22, top + size * 0.02),
        fill=WHITE,
    )
    # Bin body trapezoid
    body_top_l = cx - size * 0.22
    body_top_r = cx + size * 0.22
    body_bot_l = cx - size * 0.28
    body_bot_r = cx + size * 0.28
    d.polygon(
        [
            (body_top_l, top + size * 0.02),
            (body_top_r, top + size * 0.02),
            (body_bot_r, bot),
            (body_bot_l, bot),
        ],
        fill=WHITE,
    )
    # Vertical lines
    for k in (-1, 0, 1):
        x = cx + k * size * 0.10
        d.line(
            [
                (x, top + size * 0.06),
                (x, bot - size * 0.04),
            ],
            fill=PRIMARY_DARK,
            width=max(2, int(size * 0.012)),
        )

    return img


def make_splash(size):
    img = Image.new('RGB', (size, size), PRIMARY)
    d = ImageDraw.Draw(img)
    icon_size = int(size * 0.32)
    icon = make_icon(icon_size)
    img.paste(icon, ((size - icon_size) // 2, int(size * 0.30)), icon)

    font_big = get_font(int(size * 0.05))
    font_small = get_font(int(size * 0.022))
    title = 'Denúncia de Lixo Maputo'
    subtitle = 'USSD digital · Maputo'
    tb = d.textbbox((0, 0), title, font=font_big)
    tw = tb[2] - tb[0]
    d.text(
        ((size - tw) // 2, int(size * 0.30) + icon_size + int(size * 0.04)),
        title,
        font=font_big,
        fill=WHITE,
    )
    sb = d.textbbox((0, 0), subtitle, font=font_small)
    sw = sb[2] - sb[0]
    d.text(
        ((size - sw) // 2, int(size * 0.30) + icon_size + int(size * 0.04) + int(size * 0.07)),
        subtitle,
        font=font_small,
        fill=LIGHT,
    )
    return img


def make_adaptive(size):
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    icon_size = int(size * 0.55)
    icon = make_icon(icon_size)
    img.paste(icon, ((size - icon_size) // 2, (size - icon_size) // 2), icon)
    return img


def save(img, path):
    if img.mode == 'RGBA':
        bg = Image.new('RGB', img.size, PRIMARY)
        bg.paste(img, mask=img.split()[-1])
        img = bg
    img.save(path, 'PNG')
    print('wrote', path, img.size)


save(make_icon(1024), os.path.join(OUT, 'icon.png'))
save(make_splash(1242), os.path.join(OUT, 'splash.png'))
save(make_adaptive(1024), os.path.join(OUT, 'adaptive-icon.png'))
save(make_adaptive(432), os.path.join(OUT, 'adaptive-icon-foreground.png'))

icon_fg = make_icon(1024)
mask = Image.new('L', icon_fg.size, 0)
ImageDraw.Draw(mask).rectangle((0, 0, icon_fg.size[0] - 1, icon_fg.size[1] - 1), fill=255)
icon_fg.putalpha(mask)
save(icon_fg, os.path.join(OUT, 'foreground.png'))