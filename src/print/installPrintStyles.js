import { printCss } from './printCss.js';

const styleId = 'print-report-styles';

export function installPrintStyles() {
  if (document.getElementById(styleId)) return;

  const style = document.createElement('style');
  style.id = styleId;
  style.textContent = printCss;
  document.head.appendChild(style);
}
