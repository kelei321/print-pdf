export const PAPER_SPECS = {
  A4: {
    portrait: { width: '210mm', height: '297mm' },
    landscape: { width: '297mm', height: '210mm' }
  },
  A3: {
    portrait: { width: '297mm', height: '420mm' },
    landscape: { width: '420mm', height: '297mm' }
  }
};

export const PAPER_OPTIONS = Object.keys(PAPER_SPECS);
export const ORIENTATION_OPTIONS = ['portrait', 'landscape'];

export function normalizePaper(value, fallback = 'A4') {
  const paper = String(value || fallback).toUpperCase();
  return PAPER_SPECS[paper] ? paper : fallback;
}

export function normalizeOrientation(value, fallback = 'portrait') {
  return ORIENTATION_OPTIONS.includes(value) ? value : fallback;
}

export function getPaperSpec(paper, orientation) {
  const normalizedPaper = normalizePaper(paper);
  const normalizedOrientation = normalizeOrientation(orientation);
  return {
    paper: normalizedPaper,
    orientation: normalizedOrientation,
    ...PAPER_SPECS[normalizedPaper][normalizedOrientation]
  };
}

export function formatOrientation(value) {
  return normalizeOrientation(value) === 'landscape' ? '横向' : '纵向';
}
