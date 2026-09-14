"""Extract the six outlined station symbols from the official MM route-map PDF.

Requires PyMuPDF. Usage: python tools/extract_mm_station_vectors.py .tmp/mm-map.pdf
Source: https://www.mm21railway.co.jp/global/english/info/pdf/map.pdf
"""
import sys
from pathlib import Path
import xml.etree.ElementTree as ET

import pymupdf

root = Path(__file__).resolve().parent.parent
document = pymupdf.open(sys.argv[1])
page = document[0]
drawings = page.get_drawings()
# The six large blue station badges sit below the Toyoko portion of the map.
backgrounds = sorted([
    d for d in drawings
    if d['fill'] and d['rect'].y0 > 600
    and abs(d['rect'].width - 19.688) < 0.01
    and abs(d['rect'].height - 19.688) < 0.01
    and d['fill'][2] > 0.6 and d['fill'][0] < 0.3
], key=lambda d: d['rect'].y0)
assert len(backgrounds) == 6, 'PDF layout changed: expected six badges'
output = root / 'images/station/minatomirai'
output.mkdir(parents=True, exist_ok=True)

for number, background in enumerate(backgrounds, 1):
    border = drawings[drawings.index(background) + 1]
    assert border['fill'] == (1, 1, 1)
    bounds = border['rect']
    selected = [d for d in drawings if bounds.contains(d['rect'])]
    assert len(selected) == 7, 'Unexpected content inside station badge'
    svg = ET.Element('svg', {
        'xmlns': 'http://www.w3.org/2000/svg',
        'viewBox': f'0 0 {bounds.width:.5f} {bounds.height:.5f}',
        'width': '38', 'height': '38',
    })
    ET.SubElement(svg, 'title').text = f'MM{number:02d}'

    def point(p):
        return f'{p.x - bounds.x0:.5f} {p.y - bounds.y0:.5f}'

    for drawing in selected:
        assert drawing['type'] == 'f' and drawing['fill_opacity'] == 1
        commands = []
        previous = None
        for kind, *points in drawing['items']:
            assert kind in ('l', 'c'), 'Unexpected path operation'
            if previous != points[0]:
                commands.append('M' + point(points[0]))
            commands.append(('L' if kind == 'l' else 'C') + ' '.join(point(p) for p in points[1:]))
            previous = points[-1]
        if drawing.get('closePath'):
            commands.append('Z')
        color = '#' + ''.join(f'{round(c * 255):02x}' for c in drawing['fill'])
        ET.SubElement(svg, 'path', {
            'd': ' '.join(commands), 'fill': color,
            'fill-rule': 'evenodd' if drawing['even_odd'] else 'nonzero',
        })
    ET.indent(svg)
    target = output / f'mm{number:02d}.svg'
    ET.ElementTree(svg).write(target, encoding='utf-8', xml_declaration=False)
    print(f'{target.name}: {len(selected)} vector paths, {target.stat().st_size} bytes')
