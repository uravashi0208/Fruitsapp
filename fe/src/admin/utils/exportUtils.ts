/**
 * exportUtils.ts
 *
 * Browser-side export to Excel (.xlsx), CSV, and PDF.
 * No npm packages needed — xlsx and jsPDF are loaded from CDN on demand.
 *
 * Column types:
 *   { key: 'fieldName', label: 'Header' }                    — reads row[key]
 *   { label: 'Header', resolve: (row) => string }            — computed string value
 *   { label: 'Header', imageKey: 'fieldName' }               — embeds image (PDF) / URL (CSV/Excel)
 *   { label: 'Header', imageResolve: (row) => string|null }  — computed image URL
 */

export type ExportFormat = 'excel' | 'csv' | 'pdf';

export interface ExportColumn {
  label: string;
  /** Simple dot-notation field key */
  key?: string;
  /** Custom value resolver — takes precedence over key */
  resolve?: (row: Record<string, unknown>) => string;
  /** Field key whose value is an image URL — embedded in PDF, URL text in CSV/Excel */
  imageKey?: string;
  /** Custom image URL resolver */
  imageResolve?: (row: Record<string, unknown>) => string | null;
}

/* ── Value helpers ───────────────────────────────────────────── */

function getVal(obj: Record<string, unknown>, key: string): unknown {
  return key.split('.').reduce<unknown>((acc, k) => {
    if (acc !== null && acc !== undefined && typeof acc === 'object') {
      return (acc as Record<string, unknown>)[k];
    }
    return '';
  }, obj);
}

function stringify(v: unknown): string {
  if (v === null || v === undefined) return '';
  if (typeof v === 'boolean') return v ? 'Yes' : 'No';
  if (typeof v === 'object') return JSON.stringify(v);
  return String(v);
}

function resolveText(col: ExportColumn, row: Record<string, unknown>): string {
  if (col.resolve)      return col.resolve(row);
  if (col.key)          return stringify(getVal(row, col.key));
  if (col.imageKey)     return stringify(getVal(row, col.imageKey));   // URL as text fallback
  if (col.imageResolve) return col.imageResolve(row) ?? '';
  return '';
}

function resolveImageUrl(col: ExportColumn, row: Record<string, unknown>): string | null {
  if (col.imageResolve) return col.imageResolve(row);
  if (col.imageKey) {
    const v = stringify(getVal(row, col.imageKey));
    return v || null;
  }
  return null;
}

function isImageCol(col: ExportColumn): boolean {
  return !!(col.imageKey || col.imageResolve);
}

/* ── Script loader ───────────────────────────────────────────── */

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
    const s = document.createElement('script');
    s.src = src;
    s.onload  = () => resolve();
    s.onerror = () => reject(new Error(`Failed to load: ${src}`));
    document.head.appendChild(s);
  });
}

/* ── Blob download ───────────────────────────────────────────── */

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a   = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

/* ── Image fetch → base64 ────────────────────────────────────── */

async function fetchBase64(url: string): Promise<{ data: string; format: string } | null> {
  try {
    const res  = await fetch(url, { mode: 'cors' });
    const blob = await res.blob();
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const format = blob.type.includes('png') ? 'PNG' : 'JPEG';
        // strip the data:...;base64, prefix
        const data = result.split(',')[1] ?? '';
        resolve({ data, format });
      };
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

/* ── CSV ─────────────────────────────────────────────────────── */

function toCSV(columns: ExportColumn[], rows: Record<string, unknown>[]): string {
  const esc = (s: string): string =>
    s.includes(',') || s.includes('"') || s.includes('\n')
      ? `"${s.replace(/"/g, '""')}"` : s;
  const header = columns.map(c => esc(c.label)).join(',');
  const body   = rows.map(row => columns.map(c => esc(resolveText(c, row))).join(','));
  return [header, ...body].join('\r\n');
}

/**
 * Build an HTML table that embeds images inline (as <img> tags).
 * Used when at least one column is an image column so the export
 * actually shows the image rather than a raw URL string.
 */
async function toHTMLWithImages(
  columns: ExportColumn[],
  rows: Record<string, unknown>[]
): Promise<string> {
  // Pre-fetch all image URLs → base64 data URIs
  const imgData: Record<number, Record<number, string | null>> = {};
  const imageCols = columns.map((c, i) => i).filter(i => isImageCol(columns[i]));

  await Promise.all(
    rows.map(async (row, ri) => {
      imgData[ri] = {};
      await Promise.all(
        imageCols.map(async (ci) => {
          const url = resolveImageUrl(columns[ci], row);
          if (url) {
            const b64 = await fetchBase64(url);
            if (b64) {
              imgData[ri][ci] = `data:image/${b64.format === 'PNG' ? 'png' : 'jpeg'};base64,${b64.data}`;
            } else {
              imgData[ri][ci] = url; // fallback to original URL
            }
          } else {
            imgData[ri][ci] = null;
          }
        })
      );
    })
  );

  const thCells = columns.map(c => `<th>${c.label}</th>`).join('');
  const bodyRows = rows.map((row, ri) => {
    const tds = columns.map((c, ci) => {
      if (isImageCol(c)) {
        const src = imgData[ri][ci];
        return src
          ? `<td><img src="${src}" style="width:80px;height:50px;object-fit:cover;border-radius:4px;" /></td>`
          : `<td>—</td>`;
      }
      return `<td>${resolveText(c, row)}</td>`;
    }).join('');
    return `<tr>${tds}</tr>`;
  }).join('\n');

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Export</title>
  <style>
    body { font-family: sans-serif; font-size: 13px; padding: 16px; }
    table { border-collapse: collapse; width: 100%; }
    th, td { border: 1px solid #ddd; padding: 8px 10px; text-align: left; vertical-align: middle; }
    th { background: #4655ff; color: white; font-weight: 600; }
    tr:nth-child(even) { background: #f5f7ff; }
    img { display: block; }
  </style>
</head>
<body>
  <table>
    <thead><tr>${thCells}</tr></thead>
    <tbody>${bodyRows}</tbody>
  </table>
</body>
</html>`;
}

async function exportCSV(filename: string, columns: ExportColumn[], rows: Record<string, unknown>[]) {
  const hasImageCol = columns.some(c => isImageCol(c));
  if (hasImageCol) {
    // Export as HTML so images are actually visible
    const html = await toHTMLWithImages(columns, rows);
    downloadBlob(new Blob([html], { type: 'text/html;charset=utf-8;' }), `${filename}.html`);
  } else {
    downloadBlob(new Blob([toCSV(columns, rows)], { type: 'text/csv;charset=utf-8;' }), `${filename}.csv`);
  }
}

/* ── Excel via SheetJS CDN ───────────────────────────────────── */

async function exportExcel(
  filename: string,
  columns: ExportColumn[],
  rows: Record<string, unknown>[]
) {
  await loadScript('https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const XLSX = (window as any).XLSX;
  if (!XLSX) throw new Error('SheetJS failed to load');

  const header = columns.map(c => c.label);
  // For image columns include the URL as plain text
  const data   = rows.map(row => columns.map(c => resolveText(c, row)));

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet([header, ...data]);
  ws['!cols'] = columns.map(() => ({ wch: 24 }));
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

/* ── PDF via jsPDF + autotable CDN ───────────────────────────── */

async function exportPDF(
  filename: string,
  columns: ExportColumn[],
  rows: Record<string, unknown>[]
) {
  await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
  await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const win = window as any;
  const jsPDFCtor = (win.jspdf?.jsPDF) ?? win.jsPDF;
  if (!jsPDFCtor) throw new Error('jsPDF failed to load');

  const doc = new jsPDFCtor({ orientation: 'landscape', unit: 'pt', format: 'a4' });

  // Pre-fetch all images needed
  const imageColIndexes = columns
    .map((c, i) => ({ c, i }))
    .filter(({ c }) => isImageCol(c))
    .map(({ i }) => i);

  // Cache: rowIndex → colIndex → base64 result
  const imgCache: Record<number, Record<number, { data: string; format: string } | null>> = {};
  if (imageColIndexes.length > 0) {
    await Promise.all(
      rows.map(async (row, ri) => {
        imgCache[ri] = {};
        await Promise.all(
          imageColIndexes.map(async (ci) => {
            const url = resolveImageUrl(columns[ci], row);
            imgCache[ri][ci] = url ? await fetchBase64(url) : null;
          })
        );
      })
    );
  }

  const IMG_CELL_H = 40; // pt height for image rows
  const IMG_CELL_W = 48; // pt width for image columns

  // Keys considered "long text" — get extra column width and forced line-wrap
  const LONG_TEXT_KEYS = ['message', 'description', 'subtitle', 'notes', 'body', 'content', 'comment', 'details','answer'];
  const isLongTextCol = (col: ExportColumn): boolean => {
    const key = (col.key ?? col.label ?? '').toLowerCase();
    return LONG_TEXT_KEYS.some(k => key.includes(k));
  };

  // Rating column detection — draw stars via vector in didDrawCell
  const RATING_KEYS = ['rating', 'stars', 'score', 'views'];
  const isRatingCol = (col: ExportColumn): boolean => {
    const key = (col.key ?? col.label ?? '').toLowerCase();
    return RATING_KEYS.some(k => key.includes(k));
  };
  const ratingColIndexes = columns.map((c, i) => i).filter(i => isRatingCol(columns[i]));

  /** Draw a 5-pointed star centred at (cx, cy) with given radius */
  const drawStar = (doc: any, cx: number, cy: number, r: number, filled: boolean) => {
    const pts: number[][] = [];
    for (let i = 0; i < 5; i++) {
      const outerA = (Math.PI / 2) + (i * 2 * Math.PI) / 5;
      const innerA = outerA + Math.PI / 5;
      pts.push([cx + r * Math.cos(outerA), cy - r * Math.sin(outerA)]);
      pts.push([cx + (r * 0.4) * Math.cos(innerA), cy - (r * 0.4) * Math.sin(innerA)]);
    }
    doc.setDrawColor(247, 144, 9);
    if (filled) {
      doc.setFillColor(247, 144, 9);
    } else {
      doc.setFillColor(255, 255, 255);
    }
    doc.lines(
      pts.slice(1).map((p, i) => [p[0] - pts[i][0], p[1] - pts[i][1]]),
      pts[0][0], pts[0][1],
      [1, 1], filled ? 'FD' : 'D', true
    );
  };

  const head = [columns.map(c => c.label)];
  // For rating cols, leave cell text empty — we draw stars manually
  const body = rows.map((row) => columns.map((c, ci) => {
    if (isImageCol(c)) return '';
    if (ratingColIndexes.includes(ci)) return '';
    return resolveText(c, row);
  }));

  // Build per-column styles
  const colStyles = columns.reduce<Record<number, object>>((acc, col, i) => {
    if (isImageCol(col)) {
      acc[i] = { cellWidth: IMG_CELL_W };
    } else if (isLongTextCol(col)) {
      acc[i] = { cellWidth: 180, overflow: 'linebreak' };
    } else if (isRatingCol(col)) {
      acc[i] = { cellWidth: 55 };
    }
    return acc;
  }, {});

  doc.autoTable({
    head,
    body,
    startY: 30,
    margin: { left: 16, right: 16 },
    styles:      { fontSize: 8, cellPadding: 5, overflow: 'linebreak', minCellHeight: imageColIndexes.length ? IMG_CELL_H : 20 },
    headStyles:  { fillColor: [70, 85, 255], textColor: 255, fontStyle: 'bold', fontSize: 9 },
    alternateRowStyles: { fillColor: [245, 247, 255] },
    tableLineColor: [220, 224, 235],
    tableLineWidth: 0.3,
    columnStyles: colStyles,
    // Inject images and stars after each cell is drawn
    didDrawCell: (data: any) => {
      if (data.section !== 'body') return;
      const ci = data.column.index;

      // Draw image
      if (imageColIndexes.includes(ci)) {
        const ri  = data.row.index;
        const img = imgCache[ri]?.[ci];
        if (!img) return;
        const { x, y, width, height } = data.cell;
        const pad = 4;
        const iw  = width  - pad * 2;
        const ih  = height - pad * 2;
        if (iw < 4 || ih < 4) return;
        try { doc.addImage(img.data, img.format, x + pad, y + pad, iw, ih); } catch { /* skip */ }
        return;
      }

      // Draw rating stars
      if (ratingColIndexes.includes(ci)) {
        const ri  = data.row.index;
        const ratingKey = columns[ci].key ?? 'rating';
        const rating = Number((rows[ri] as any)?.[ratingKey] ?? 0);
        const { x, y, width, height } = data.cell;
        const starR = 4;
        const totalW = 5 * (starR * 2 + 2);
        let sx = x + (width - totalW) / 2 + starR;
        const sy = y + height / 2;
        for (let s = 1; s <= 5; s++) {
          drawStar(doc, sx, sy, starR, s <= rating);
          sx += starR * 2 + 2;
        }
      }
    },
  });

  doc.save(`${filename}.pdf`);
}

/* ── Main export entry point ─────────────────────────────────── */

export async function exportData(
  format: ExportFormat,
  filename: string,
  columns: ExportColumn[],
  rows: Record<string, unknown>[]
): Promise<void> {
  switch (format) {
    case 'csv':    await exportCSV(filename, columns, rows);         break;
    case 'excel':  await exportExcel(filename, columns, rows);       break;
    case 'pdf':    await exportPDF(filename, columns, rows);         break;
    default: throw new Error(`Unknown export format: ${format}`);
  }
}