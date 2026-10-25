// Client-side PDF export. Pages are composed on canvas so user-entered Unicode
// text is rendered by the browser, then embedded as JPEG image streams in a
// small deterministic PDF container. No map content leaves the browser.

import { WardleyMap } from '@/domain/types';
import { catalogProvenance, summarizeAnalysis } from '@/analysis/summary';
import { exportSize, ExportTheme, renderMapSVG } from './svg-export';

const PDF_WIDTH = 841.89;
const PDF_HEIGHT = 595.28;
const PAGE_WIDTH = 1684;
const PAGE_HEIGHT = 1190;
const MARGIN = 64;

const COLORS = {
  light: { bg: '#ffffff', text: '#17202c', muted: '#4b5867', subtle: '#6b7787', border: '#d6dce5', primary: '#1f5f8b' },
  dark: { bg: '#141a22', text: '#e6ebf1', muted: '#b2bdcb', subtle: '#8a97a8', border: '#2b3645', primary: '#5aa7d8' },
} satisfies Record<ExportTheme, Record<string, string>>;

export interface PdfExportOptions {
  theme?: ExportTheme;
  includeDetails?: boolean;
  generatedAt?: string;
}

export interface RasterPdfPage {
  jpeg: Uint8Array;
  width: number;
  height: number;
}

const encoder = new TextEncoder();

function ascii(value: string): Uint8Array {
  return encoder.encode(value);
}

function concat(chunks: Uint8Array[]): Uint8Array {
  const total = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    out.set(chunk, offset);
    offset += chunk.length;
  }
  return out;
}

/** Build a standards-compatible PDF from full-page RGB JPEG images. */
export function buildRasterPdf(pages: RasterPdfPage[]): Uint8Array {
  if (pages.length === 0) throw new Error('PDF requires at least one page');

  const objects: Uint8Array[] = [];
  objects.push(ascii('<< /Type /Catalog /Pages 2 0 R >>'));
  const kids = pages.map((_, index) => `${3 + index * 3} 0 R`).join(' ');
  objects.push(ascii(`<< /Type /Pages /Kids [${kids}] /Count ${pages.length} >>`));

  pages.forEach((page, index) => {
    const pageNumber = 3 + index * 3;
    const imageNumber = pageNumber + 1;
    const contentNumber = pageNumber + 2;
    const content = ascii(`q\n${PDF_WIDTH} 0 0 ${PDF_HEIGHT} 0 0 cm\n/Im0 Do\nQ\n`);

    objects.push(ascii(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PDF_WIDTH} ${PDF_HEIGHT}] ` +
      `/Resources << /XObject << /Im0 ${imageNumber} 0 R >> >> /Contents ${contentNumber} 0 R >>`
    ));
    objects.push(concat([
      ascii(
        `<< /Type /XObject /Subtype /Image /Width ${page.width} /Height ${page.height} ` +
        `/ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${page.jpeg.length} >>\nstream\n`
      ),
      page.jpeg,
      ascii('\nendstream'),
    ]));
    objects.push(concat([
      ascii(`<< /Length ${content.length} >>\nstream\n`),
      content,
      ascii('endstream'),
    ]));
  });

  const chunks: Uint8Array[] = [ascii('%PDF-1.4\n'), new Uint8Array([0x25, 0xe2, 0xe3, 0xcf, 0xd3, 0x0a])];
  const offsets: number[] = [0];
  let length = chunks.reduce((sum, chunk) => sum + chunk.length, 0);

  objects.forEach((object, index) => {
    offsets.push(length);
    const wrapped = concat([ascii(`${index + 1} 0 obj\n`), object, ascii('\nendobj\n')]);
    chunks.push(wrapped);
    length += wrapped.length;
  });

  const xrefOffset = length;
  const xref = [
    `xref\n0 ${objects.length + 1}\n`,
    '0000000000 65535 f \n',
    ...offsets.slice(1).map((offset) => `${String(offset).padStart(10, '0')} 00000 n \n`),
    `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`,
  ].join('');
  chunks.push(ascii(xref));
  return concat(chunks);
}

function canvas(theme: ExportTheme): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } {
  const el = document.createElement('canvas');
  el.width = PAGE_WIDTH;
  el.height = PAGE_HEIGHT;
  const ctx = el.getContext('2d')!;
  ctx.fillStyle = COLORS[theme].bg;
  ctx.fillRect(0, 0, PAGE_WIDTH, PAGE_HEIGHT);
  ctx.textBaseline = 'alphabetic';
  return { canvas: el, ctx };
}

function loadImage(source: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(new Blob([source], { type: 'image/svg+xml' }));
    const image = new window.Image();
    image.onload = () => { URL.revokeObjectURL(url); resolve(image); };
    image.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Could not render map for PDF')); };
    image.src = url;
  });
}

function footer(ctx: CanvasRenderingContext2D, theme: ExportTheme, text: string) {
  const color = COLORS[theme];
  ctx.strokeStyle = color.border;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(MARGIN, PAGE_HEIGHT - 54);
  ctx.lineTo(PAGE_WIDTH - MARGIN, PAGE_HEIGHT - 54);
  ctx.stroke();
  ctx.fillStyle = color.subtle;
  ctx.font = '22px Inter, system-ui, sans-serif';
  ctx.fillText(text, MARGIN, PAGE_HEIGHT - 22);
}

async function renderMapPage(map: WardleyMap, theme: ExportTheme, generatedDate: string): Promise<HTMLCanvasElement> {
  const page = canvas(theme);
  const svg = renderMapSVG(map, { theme, background: true });
  const image = await loadImage(svg);
  const size = exportSize();
  const availableWidth = PAGE_WIDTH - MARGIN * 2;
  const availableHeight = PAGE_HEIGHT - 128;
  const scale = Math.min(availableWidth / size.width, availableHeight / size.height);
  const width = size.width * scale;
  const height = size.height * scale;
  page.ctx.drawImage(image, (PAGE_WIDTH - width) / 2, 24, width, height);
  footer(
    page.ctx,
    theme,
    `Generated ${generatedDate} - Wardley Maps originated by Simon Wardley - CC BY-SA reference attribution`
  );
  return page.canvas;
}

function wrappedLines(ctx: CanvasRenderingContext2D, text: string, width: number): string[] {
  const paragraphs = text.split(/\n/);
  const lines: string[] = [];
  for (const paragraph of paragraphs) {
    const words = paragraph.split(/\s+/).filter(Boolean).flatMap((word) => {
      if (ctx.measureText(word).width <= width) return [word];
      const chunks: string[] = [];
      let chunk = '';
      for (const character of word) {
        if (chunk && ctx.measureText(chunk + character).width > width) {
          chunks.push(chunk);
          chunk = character;
        } else {
          chunk += character;
        }
      }
      if (chunk) chunks.push(chunk);
      return chunks;
    });
    if (words.length === 0) { lines.push(''); continue; }
    let line = words[0];
    for (const word of words.slice(1)) {
      const candidate = `${line} ${word}`;
      if (ctx.measureText(candidate).width <= width) line = candidate;
      else { lines.push(line); line = word; }
    }
    lines.push(line);
  }
  return lines;
}

function renderDetailPages(map: WardleyMap, theme: ExportTheme, generatedDate: string): HTMLCanvasElement[] {
  const colors = COLORS[theme];
  const pages: HTMLCanvasElement[] = [];
  let current = canvas(theme);
  let y = 96;

  const newPage = () => {
    footer(current.ctx, theme, `Wardley Maps Studio - ${map.title} - generated ${generatedDate}`);
    pages.push(current.canvas);
    current = canvas(theme);
    y = 96;
  };
  const ensure = (height: number) => {
    if (y + height > PAGE_HEIGHT - 90) newPage();
  };
  const heading = (text: string) => {
    ensure(58);
    current.ctx.fillStyle = colors.primary;
    current.ctx.font = '600 30px Inter, system-ui, sans-serif';
    current.ctx.fillText(text, MARGIN, y);
    y += 44;
  };
  const paragraph = (text: string, prefix?: string) => {
    current.ctx.font = '24px Inter, system-ui, sans-serif';
    const content = prefix ? `${prefix}: ${text}` : text;
    const lines = wrappedLines(current.ctx, content, PAGE_WIDTH - MARGIN * 2);
    for (const line of lines) {
      ensure(44);
      current.ctx.fillStyle = colors.text;
      current.ctx.font = '24px Inter, system-ui, sans-serif';
      current.ctx.fillText(line, MARGIN, y);
      y += 34;
    }
    y += 10;
  };
  const bullet = (text: string) => paragraph(`- ${text}`);

  current.ctx.fillStyle = colors.text;
  current.ctx.font = '650 46px Inter, system-ui, sans-serif';
  current.ctx.fillText('Context and analysis', MARGIN, y);
  y += 60;
  current.ctx.fillStyle = colors.muted;
  current.ctx.font = '24px Inter, system-ui, sans-serif';
  current.ctx.fillText(`${map.title} - revision ${map.revision}`, MARGIN, y);
  y += 54;

  heading('Purpose and map summary');
  paragraph(map.purpose || 'No purpose or scope has been recorded.');
  paragraph(
    `${map.elements.length} elements, ${map.dependencies.length} dependencies, ` +
    `${map.evolutions.length} proposed movements, ${map.annotations.length} notes.`
  );

  heading('Legend');
  bullet('Diamond: anchor, user, or stakeholder. Circle: component or capability.');
  bullet('An arrow from A to B means A depends on B. Dashed arrows show flows or proposed movement.');
  bullet('Horizontal position is evolution from Genesis to Commodity; vertical position is visibility in the value chain.');

  const summary = summarizeAnalysis(map, generatedDate);
  heading('Analysis summary');
  paragraph(
    `${summary.counts.climate} climate, ${summary.counts.doctrine} doctrine, ` +
    `${summary.counts.gameplay} gameplay, ${summary.counts.evidence} evidence records.`
  );
  paragraph('Assessments are context-specific hypotheses recorded by the map authors, not objective facts or predictions.');
  if (summary.rows.length === 0) bullet('No analysis assessments have been recorded.');
  for (const row of summary.rows) {
    bullet(`${row.kind}: ${row.title} - ${row.status.replace(/-/g, ' ')} - ${row.evidenceCount} evidence`);
  }

  heading('Assumptions, risks, and stop conditions');
  const gameplays = map.analysis.gameplay;
  if (gameplays.length === 0) bullet('No gameplay assumptions have been recorded.');
  for (const item of gameplays) {
    if (item.assumptions) bullet(`Assumption: ${item.assumptions}`);
    for (const risk of item.risks) bullet(`Risk: ${risk}`);
    for (const stop of item.stopConditions ?? []) bullet(`Stop condition: ${stop}`);
  }

  heading('Evidence and notes');
  if (map.analysis.evidence.length === 0 && map.annotations.length === 0) bullet('No evidence or map notes have been recorded.');
  for (const evidence of map.analysis.evidence) {
    bullet(`${evidence.claim} (${evidence.confidence} confidence${evidence.sourceLabel ? `, ${evidence.sourceLabel}` : ''})`);
  }
  for (const note of map.annotations) bullet(`Map note: ${note.text}`);

  heading('Attribution');
  const provenance = catalogProvenance();
  paragraph((
    `${provenance.climate[0]?.attribution ?? 'Wardley Maps originated by Simon Wardley.'} ` +
    `${provenance.license} This application is not affiliated with or endorsed by Simon Wardley.`
  ).replace(/[\u2010-\u2015]/g, '-'));

  footer(current.ctx, theme, `Wardley Maps Studio - ${map.title} - generated ${generatedDate}`);
  pages.push(current.canvas);
  return pages;
}

function canvasJpeg(source: HTMLCanvasElement): Promise<RasterPdfPage> {
  return new Promise((resolve, reject) => {
    source.toBlob(async (blob) => {
      if (!blob) { reject(new Error('Could not encode PDF page')); return; }
      resolve({ jpeg: new Uint8Array(await blob.arrayBuffer()), width: source.width, height: source.height });
    }, 'image/jpeg', 0.92);
  });
}

export async function renderMapPdf(map: WardleyMap, options: PdfExportOptions = {}): Promise<Blob> {
  const theme = options.theme ?? 'light';
  const generatedAt = options.generatedAt ?? new Date().toISOString();
  const generatedDate = generatedAt.slice(0, 10);
  await document.fonts.ready;
  const canvases = [
    await renderMapPage(map, theme, generatedDate),
    ...(options.includeDetails === false ? [] : renderDetailPages(map, theme, generatedDate)),
  ];
  const pages = await Promise.all(canvases.map(canvasJpeg));
  return new Blob([buildRasterPdf(pages) as BlobPart], { type: 'application/pdf' });
}
