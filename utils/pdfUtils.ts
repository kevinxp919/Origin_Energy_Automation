import * as fs from 'fs';

const PLAN_TYPE_PATTERNS = {
  gas: ['gas'],
} as const;

async function loadPdf(filePath: string) {
  const dataBuffer = await fs.promises.readFile(filePath);
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const pdfParse = require('pdf-parse');
  return pdfParse(dataBuffer);
}

function containsAny(text: string, terms: readonly string[]): boolean {
  const lower = text.toLowerCase();
  return terms.some(term => lower.includes(term));
}

export async function extractPdfText(filePath: string): Promise<string> {
  const pdf = await loadPdf(filePath);
  return pdf.text || '';
}

export async function isPdfGasPlan(filePath: string): Promise<boolean> {
  const text = await extractPdfText(filePath);
  return containsAny(text, PLAN_TYPE_PATTERNS.gas);
}
