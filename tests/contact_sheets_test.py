"""Testa a auditoria com pixels de teste em diretório temporário, sem fotos no produto."""
import csv
import importlib.util
import tempfile
import unittest
from pathlib import Path
from PIL import Image

spec = importlib.util.spec_from_file_location('contact_sheets', 'scripts/create-contact-sheets.py')
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class ContactSheetsTest(unittest.TestCase):
    def test_metadata_duplicates_small_and_invalid(self):
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder)
            (root / 'image-files').mkdir()
            Image.new('RGB', (210, 160), '#111111').save(root / 'image-files/1.img', 'JPEG')
            (root / 'image-files/2.img').write_bytes((root / 'image-files/1.img').read_bytes())
            Image.new('RGB', (30, 30), '#222222').save(root / 'image-files/3.img', 'PNG')
            (root / 'image-files/4.img').write_bytes(b'not an image')
            with (root / 'people-images.csv').open('w', newline='') as file:
                writer = csv.DictWriter(file, fieldnames=['id', 'name', 'error'])
                writer.writeheader()
                writer.writerows({'id': str(i), 'name': 'Test ' + str(i), 'error': ''} for i in range(1, 5))
            flags = module.generate(root)
            self.assertEqual(len(flags), 3)
            self.assertEqual({flag[3] for flag in flags}, {'ARQUIVO DUPLICADO', 'RESOLUÇÃO BAIXA', 'ERRO DE IMAGEM'})
            with (root / 'image-metadata.csv').open() as file:
                rows = list(csv.DictReader(file))
            self.assertEqual(rows[0]['width'], '210')
            self.assertEqual(rows[0]['height'], '160')
            self.assertEqual(rows[1]['duplicateOf'], '1')
            self.assertTrue(rows[3]['error'])
            with Image.open(root / 'contact-sheets/sheet-1.jpg') as image:
                self.assertEqual(image.size, (1200, 250))


if __name__ == '__main__':
    unittest.main()
