#!/usr/bin/env python3
"""Baixa retratos e gera folhas de contato rotuladas para auditoria visual humana."""
import csv, io, os, urllib.request
from PIL import Image, ImageDraw, ImageFont
CSV = "reports/people-images.csv"
OUT = "reports/contact-sheets"
os.makedirs(OUT, exist_ok=True)
rows = list(csv.DictReader(open(CSV, encoding="utf-8")))
font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 17)
for start in range(0, len(rows), 20):
    subset = rows[start:start+20]
    sheet = Image.new("RGB", (1200, 5*250), "#101722")
    draw = ImageDraw.Draw(sheet)
    for j, row in enumerate(subset):
        x, y = (j%4)*300, (j//4)*250
        try:
            req = urllib.request.Request(row["url"], headers={"User-Agent": "StarWarsExplorerAudit/1.0"})
            with urllib.request.urlopen(req, timeout=20) as response:
                img = Image.open(io.BytesIO(response.read())).convert("RGB")
            img.thumbnail((282, 206))
            sheet.paste(img, (x+(300-img.width)//2, y+3+(206-img.height)//2))
        except Exception as error:
            draw.text((x+8,y+90), "IMAGE ERROR", font=font, fill="#ff7777")
            print(row["id"], "ERROR", error)
        label = f'{row["id"]} - {row["name"]}'
        draw.text((x+7, y+214), label[:30], font=font, fill="white")
    target = f"{OUT}/sheet-{start//20+1}.jpg"
    sheet.save(target, quality=85)
    print(target)
