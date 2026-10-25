import { describe, expect, it } from 'vitest';
import { buildRasterPdf } from '../pdf-export';

const jpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xd9]);

describe('raster PDF export', () => {
  it('builds a valid multi-page PDF container with JPEG image streams', () => {
    const bytes = buildRasterPdf([
      { jpeg, width: 1684, height: 1190 },
      { jpeg, width: 1684, height: 1190 },
    ]);
    const text = new TextDecoder('latin1').decode(bytes);

    expect(text.startsWith('%PDF-1.4')).toBe(true);
    expect(text).toContain('/Type /Pages /Kids [3 0 R 6 0 R] /Count 2');
    expect(text.match(/\/Type \/Page\b/g)).toHaveLength(2);
    expect(text.match(/\/Filter \/DCTDecode/g)).toHaveLength(2);
    expect(text).toContain('/MediaBox [0 0 841.89 595.28]');
    expect(text.endsWith('%%EOF\n')).toBe(true);

    const start = Number(text.match(/startxref\n(\d+)\n%%EOF/)?.[1]);
    expect(text.slice(start, start + 4)).toBe('xref');
  });

  it('requires at least one page', () => {
    expect(() => buildRasterPdf([])).toThrow(/at least one page/);
  });
});
