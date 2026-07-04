from PIL import Image, ImageDraw, ImageFont
from pathlib import Path

OUT = Path("assets")
OUT.mkdir(exist_ok=True)

def font(size, bold=False):
    candidates = [
        "/System/Library/Fonts/Supplemental/Arial Bold.ttf" if bold else "/System/Library/Fonts/Supplemental/Arial.ttf",
        "/System/Library/Fonts/Supplemental/Helvetica Bold.ttf" if bold else "/System/Library/Fonts/Supplemental/Helvetica.ttf",
        "/System/Library/Fonts/Supplemental/Verdana Bold.ttf" if bold else "/System/Library/Fonts/Supplemental/Verdana.ttf",
    ]
    for p in candidates:
        try:
            return ImageFont.truetype(p, size)
        except Exception:
            pass
    return ImageFont.load_default()

def center_text(draw, xy, text, fnt, fill=(20, 30, 40), spacing=8):
    x, y, w = xy
    lines = text.split("\n")
    heights = []
    widths = []
    for line in lines:
        box = draw.textbbox((0, 0), line, font=fnt)
        widths.append(box[2] - box[0])
        heights.append(box[3] - box[1])
    total_h = sum(heights) + spacing * (len(lines) - 1)
    yy = y - total_h / 2
    for line, tw, th in zip(lines, widths, heights):
        draw.text((x + (w - tw) / 2, yy), line, font=fnt, fill=fill)
        yy += th + spacing

def rounded_box(draw, box, fill, outline=(180, 190, 200), radius=28, width=3):
    draw.rounded_rectangle(box, radius=radius, fill=fill, outline=outline, width=width)

def make_cover():
    W, H = 1600, 900
    img = Image.new("RGB", (W, H), (247, 250, 252))
    d = ImageDraw.Draw(img)

    title = font(72, True)
    subtitle = font(34)
    badge = font(26, True)
    small = font(26)

    d.rectangle((0, 0, W, 110), fill=(25, 45, 70))
    center_text(d, (0, 55, W), "AI Safety Inspection Agent", title, fill=(255, 255, 255))

    center_text(
        d,
        (160, 270, W - 320),
        "Turning messy safety inspection records into\ntraceable observations, weekly summaries,\nand source-supported recommendations.",
        subtitle,
        fill=(25, 45, 70),
        spacing=14,
    )

    boxes = [
        ("Inspection\nRecords", 120, 480),
        ("Agent Workflow\n+ Validation", 565, 480),
        ("Auditable\nHSE Outputs", 1010, 480),
    ]

    for text, x, y in boxes:
        rounded_box(d, (x, y, x + 330, y + 150), fill=(255, 255, 255), outline=(95, 120, 145))
        center_text(d, (x, y + 75, 330), text, badge, fill=(25, 45, 70), spacing=8)

    arrow = font(54, True)
    d.text((480, 525), "→", font=arrow, fill=(25, 45, 70))
    d.text((925, 525), "→", font=arrow, fill=(25, 45, 70))

    center_text(
        d,
        (0, 770, W),
        "Agent Workflow  |  Evidence Traceability  |  Validation Gates",
        small,
        fill=(65, 80, 95),
    )

    img.save(OUT / "cover-image.png")

def make_architecture():
    W, H = 1800, 1000
    img = Image.new("RGB", (W, H), (248, 250, 252))
    d = ImageDraw.Draw(img)

    title = font(58, True)
    boxfont = font(28, True)
    small = font(24)

    center_text(d, (0, 80, W), "AI Safety Inspection Agent Architecture", title, fill=(25, 45, 70))

    steps = [
        "Inspection\nReport Records",
        "Agent Extraction\nWorkflow",
        "Structured\nObservations",
        "Weekly\nSummaries",
        "Recommendation-only\nOutput Model",
        "Validation Gates\n& Artifact Checks",
        "Auditable HSE\nReview Outputs",
    ]

    start_x, y = 90, 300
    box_w, box_h, gap = 210, 150, 35

    for i, step in enumerate(steps):
        x = start_x + i * (box_w + gap)
        rounded_box(d, (x, y, x + box_w, y + box_h), fill=(255, 255, 255), outline=(95, 120, 145), radius=24)
        center_text(d, (x, y + box_h / 2, box_w), step, boxfont, fill=(25, 45, 70), spacing=6)
        if i < len(steps) - 1:
            d.text((x + box_w + 5, y + 45), "→", font=font(48, True), fill=(25, 45, 70))

    notes = [
        "Evidence first",
        "Source references preserved",
        "Blank vs N/A kept distinct",
        "Recommendations limited to supported source material",
        "Validation checks for reproducibility",
    ]

    note_y = 590
    d.text((150, note_y), "Design principles", font=font(36, True), fill=(25, 45, 70))
    for idx, note in enumerate(notes):
        d.text((180, note_y + 65 + idx * 48), f"• {note}", font=small, fill=(45, 60, 75))

    img.save(OUT / "architecture.png")

if __name__ == "__main__":
    make_cover()
    make_architecture()
    print("Created assets/cover-image.png and assets/architecture.png")
