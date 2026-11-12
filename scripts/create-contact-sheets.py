#!/usr/bin/env python3
"""Gera evidência visual dos mesmos bytes baixados na auditoria HTTP, sem republicá-los no site."""
import csv
import hashlib
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont


def generate(root=Path('reports')):
    with (root / 'people-images.csv').open(encoding='utf-8') as file:
        rows = list(csv.DictReader(file))
    out = root / 'contact-sheets'
    out.mkdir(parents=True, exist_ok=True)
    for old in out.glob('sheet-*.jpg'):
        old.unlink()
    seen, flags, metadata = {}, [], []
    try:
        font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 17)
    except OSError:
        font = ImageFont.load_default()
    for start in range(0, len(rows), 20):
        subset = rows[start:start + 20]
        sheet = Image.new('RGB', (1200, 250 * ((len(subset) + 3) // 4)), '#101722')
        draw = ImageDraw.Draw(sheet)
        for j, row in enumerate(subset):
            x, y = (j % 4) * 300, (j // 4) * 250
            info = {'id': row['id'], 'name': row['name'], 'width': '', 'height': '', 'format': '', 'sha256': '', 'duplicateOf': '', 'error': ''}
            try:
                if row.get('error'):
                    raise ValueError(row['error'])
                image_path = root / 'image-files' / (row['id'] + '.img')
                digest = hashlib.sha256(image_path.read_bytes()).hexdigest()
                info['sha256'] = digest
                with Image.open(image_path) as image:
                    image.verify()
                with Image.open(image_path) as image:
                    info.update(width=image.width, height=image.height, format=image.format)
                    img = image.convert('RGB')
                if digest in seen:
                    info['duplicateOf'] = seen[digest]
                    flags.append((row['id'], row['name'], seen[digest], 'ARQUIVO DUPLICADO'))
                else:
                    seen[digest] = row['id']
                if img.width < 200 or img.height < 150:
                    flags.append((row['id'], row['name'], f'{img.width}x{img.height}', 'RESOLUÇÃO BAIXA'))
                img.thumbnail((282, 206))
                sheet.paste(img, (x + (300 - img.width) // 2, y + 3 + (206 - img.height) // 2))
            except Exception as error:
                info['error'] = str(error)
                draw.text((x + 8, y + 90), 'IMAGE ERROR', font=font, fill='#ff7777')
                flags.append((row['id'], row['name'], str(error), 'ERRO DE IMAGEM'))
            metadata.append(info)
            draw.text((x + 7, y + 214), f'{row["id"]} - {row["name"]}'[:30], font=font, fill='white')
        target = out / f'sheet-{start // 20 + 1}.jpg'
        sheet.save(target, quality=85)
        print(target)
    with (root / 'image-metadata.csv').open('w', newline='', encoding='utf-8') as file:
        writer = csv.DictWriter(file, fieldnames=['id', 'name', 'width', 'height', 'format', 'sha256', 'duplicateOf', 'error'])
        writer.writeheader()
        writer.writerows(metadata)
    with (root / 'visual-flags.csv').open('w', newline='', encoding='utf-8') as file:
        writer = csv.writer(file)
        writer.writerow(['id', 'nome', 'referência', 'problema'])
        writer.writerows(flags)
    for flag in flags:
        print(' | '.join(flag))
    print('Possíveis problemas detectados:', len(flags))
    print('Identidade e direitos continuam exigindo revisão humana.')
    return flags


if __name__ == '__main__':
    issues = generate()
    if any(flag[3] == 'ERRO DE IMAGEM' for flag in issues):
        raise SystemExit(1)
