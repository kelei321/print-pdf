export const printCss = `
@page {
  size: A3 landscape;
  margin: 0;
}

* {
  box-sizing: border-box;
}

html,
body {
  margin: 0;
  color: #162129;
  background: #fff;
  font-family: Arial, "Microsoft YaHei", sans-serif;
  font-size: 9px;
  line-height: 1.35;
}

.print-page {
  width: var(--print-page-width);
  min-height: var(--print-page-height);
  margin: 0 auto;
  padding: var(--print-page-padding, 12mm);
  background: #fff;
}

.print-page--a4.print-page--portrait {
  --print-page-width: 210mm;
  --print-page-height: 297mm;
}

.print-page--a4.print-page--landscape {
  --print-page-width: 297mm;
  --print-page-height: 210mm;
}

.print-page--a3.print-page--portrait {
  --print-page-width: 297mm;
  --print-page-height: 420mm;
}

.print-page--a3.print-page--landscape {
  --print-page-width: 420mm;
  --print-page-height: 297mm;
}

.report-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16mm;
  padding-bottom: 5mm;
  border-bottom: 1px solid #23313a;
  break-inside: avoid;
}

.document-header {
  padding-bottom: 7mm;
  border-bottom: 1px solid #23313a;
  break-inside: avoid;
}

.document-header h2 {
  font-size: 24px;
}

.statement-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12mm;
}

.statement-header > strong {
  font-size: 22px;
  white-space: nowrap;
}

.eyebrow {
  margin: 0 0 2mm;
  color: #5b6a72;
  font-size: 9px;
}

h2 {
  margin: 0;
  font-size: 22px;
  line-height: 1.15;
}

.subtitle {
  max-width: 220mm;
  margin: 3mm 0 0;
  color: #53636c;
  font-size: 10px;
}

.report-meta {
  display: grid;
  grid-template-columns: repeat(3, auto);
  gap: 7mm;
  margin: 0;
  text-align: right;
}

.report-meta dt {
  color: #6b7a82;
  font-size: 8px;
}

.report-meta dd {
  margin: 1mm 0 0;
  font-weight: 700;
}

.contract-meta,
.party-grid,
.dashboard-metrics {
  display: grid;
  gap: 4mm;
  margin: 6mm 0;
  break-inside: avoid;
}

.contract-meta {
  grid-template-columns: repeat(3, 1fr);
}

.contract-meta div,
.party-box,
.payment-box,
.risk-panel,
.dashboard-metrics div {
  padding: 4mm;
  border: 1px solid #c8d2d8;
  background: #f7fafb;
}

.contract-meta span,
.party-box span,
.dashboard-metrics span {
  display: block;
  color: #607079;
  font-size: 9px;
}

.contract-meta strong,
.party-box strong,
.dashboard-metrics strong {
  display: block;
  margin-top: 1.5mm;
  font-size: 14px;
}

.party-grid {
  grid-template-columns: 1fr 1fr;
}

.party-box {
  min-height: 28mm;
}

.party-box p,
.payment-box p {
  margin: 2mm 0 0;
}

.clause-section {
  margin-top: 7mm;
}

.clause-section h3,
.payment-box h3,
.risk-panel h3 {
  margin: 0 0 3mm;
  font-size: 15px;
}

.clause-section li,
.risk-panel li {
  margin-bottom: 2.5mm;
}

.signature-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8mm;
  margin-top: 12mm;
  break-inside: avoid;
}

.signature-box {
  min-height: 34mm;
  padding: 5mm;
  border: 1px solid #23313a;
}

.signature-box span {
  display: block;
  color: #607079;
  font-size: 9px;
}

.signature-box strong {
  display: block;
  margin-top: 2mm;
  font-size: 14px;
}

.signature-box i {
  display: block;
  width: 28mm;
  height: 14mm;
  margin-top: 8mm;
  color: #9f1f1f;
  border: 2px solid #9f1f1f;
  border-radius: 50%;
  font-style: normal;
  line-height: 13mm;
  text-align: center;
  transform: rotate(-8deg);
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 4mm;
  margin: 5mm 0;
  break-inside: avoid;
}

.summary-grid div {
  padding: 3mm;
  border: 1px solid #c8d2d8;
  background: #f5f8fa;
}

.summary-grid span {
  display: block;
  color: #607079;
  font-size: 8px;
}

.summary-grid strong {
  display: block;
  margin-top: 1mm;
  font-size: 14px;
}

.ledger-section {
  margin-top: 4mm;
}

.ledger-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
}

.simple-table {
  width: 100%;
  margin-top: 6mm;
  border-collapse: collapse;
  table-layout: fixed;
}

.simple-table th,
.simple-table td {
  padding: 2.6mm;
  border: 1px solid #b9c5cc;
  vertical-align: top;
}

.simple-table th,
.simple-table tfoot td {
  background: #e7eef2;
  font-weight: 700;
}

.payment-box {
  margin-top: 7mm;
}

.dashboard-metrics {
  grid-template-columns: repeat(4, 1fr);
}

.dashboard-metrics strong {
  font-size: 24px;
}

.dashboard-metrics em {
  display: block;
  margin-top: 1mm;
  color: #17645f;
  font-style: normal;
}

.dashboard-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 6mm;
  margin-top: 5mm;
  align-items: start;
}

.qr-mark,
.barcode-mark {
  margin: 0;
  break-inside: avoid;
}

.qr-mark svg {
  display: block;
  width: 28mm;
  height: 28mm;
  border: 1px solid #101820;
}

.qr-mark figcaption,
.barcode-mark figcaption {
  margin-top: 1mm;
  font-size: 8px;
  text-align: center;
  word-break: break-all;
}

.barcode-bars {
  display: flex;
  align-items: flex-end;
  height: 15mm;
  padding: 2mm;
  border: 1px solid #101820;
  background: #fff;
}

.barcode-bars span {
  display: block;
  background: #101820;
}

.waybill-header {
  display: grid;
  grid-template-columns: 1fr 42mm;
  gap: 6mm;
  align-items: stretch;
  padding-bottom: 5mm;
  border-bottom: 2px solid #101820;
}

.sort-code {
  display: grid;
  place-items: center;
  border: 2px solid #101820;
  font-size: 22px;
  font-weight: 700;
  letter-spacing: 1px;
}

.code-row {
  display: grid;
  grid-template-columns: 34mm 1fr;
  gap: 6mm;
  align-items: center;
  margin: 5mm 0;
  break-inside: avoid;
}

.address-grid {
  display: grid;
  grid-template-columns: 1fr 1.25fr;
  gap: 5mm;
  margin: 5mm 0;
}

.address-box {
  min-height: 36mm;
  padding: 5mm;
  border: 1px solid #101820;
}

.address-box.receiver {
  border-width: 2px;
}

.address-box span {
  color: #607079;
  font-size: 9px;
}

.address-box strong {
  display: block;
  margin: 2mm 0;
  font-size: 16px;
}

.address-box p {
  margin: 1.5mm 0;
}

.route-strip {
  display: flex;
  justify-content: space-between;
  gap: 5mm;
  padding: 3mm 4mm;
  border: 1px solid #101820;
  background: #eef3f6;
  break-inside: avoid;
}

.sign-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 5mm;
  margin-top: 8mm;
  break-inside: avoid;
}

.sign-grid div {
  min-height: 24mm;
  padding: 3mm;
  border: 1px solid #b9c5cc;
  color: #607079;
}

.inspection-table td:last-child {
  white-space: nowrap;
}

.asset-tag-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 4mm;
  margin-top: 5mm;
}

.asset-tag {
  display: grid;
  grid-template-columns: 1fr 26mm;
  grid-template-rows: auto auto;
  gap: 2mm 3mm;
  min-height: 45mm;
  padding: 3mm;
  border: 1px dashed #6b7a82;
  break-inside: avoid;
}

.asset-tag h3 {
  margin: 0 0 1mm;
  font-size: 12px;
}

.asset-tag p {
  margin: 0 0 1mm;
}

.asset-tag .qr-mark svg {
  width: 24mm;
  height: 24mm;
}

.asset-tag .barcode-mark {
  grid-column: 1 / -1;
}

.asset-tag .barcode-bars {
  height: 10mm;
  padding: 1mm;
}

.ledger-table thead {
  display: table-header-group;
}

.ledger-table tfoot {
  display: table-row-group;
}

.ledger-table tr {
  break-inside: avoid;
  page-break-inside: avoid;
}

.ledger-table th,
.ledger-table td {
  padding: 1.45mm 1.25mm;
  border: 1px solid #b9c5cc;
  vertical-align: top;
  overflow-wrap: anywhere;
}

.ledger-table th {
  color: #101b22;
  background: #e7eef2;
  font-weight: 700;
  text-align: center;
}

.ledger-table tbody tr:nth-child(odd):not(.group-row) td {
  background: #fbfcfd;
}

.ledger-table tfoot td,
.group-row td {
  font-weight: 700;
  background: #dce7ec;
}

.col-index {
  width: 10mm;
}

.col-region {
  width: 17mm;
}

.col-project {
  width: 28mm;
}

.col-sku {
  width: 25mm;
}

.col-name {
  width: 30mm;
}

.col-owner {
  width: 18mm;
}

.col-note {
  width: 38mm;
}

.numeric {
  text-align: right;
  white-space: nowrap;
}

.negative {
  color: #a92727;
}

.progress-track {
  display: inline-block;
  width: 22mm;
  height: 2.4mm;
  margin-right: 1mm;
  border: 1px solid #a6b6be;
  background: #eef3f6;
  vertical-align: middle;
}

.progress-bar {
  display: block;
  height: 100%;
  background: #24756d;
}

.progress-text {
  white-space: nowrap;
}

.status-pill {
  display: inline-block;
  min-width: 11mm;
  padding: 0.4mm 1.4mm;
  border: 1px solid #7f929c;
  text-align: center;
  white-space: nowrap;
}

.status-ok {
  color: #17645f;
  border-color: #5b9f97;
  background: #eaf5f3;
}

.status-watch {
  color: #806013;
  border-color: #b89b3d;
  background: #fff7d8;
}

.status-late {
  color: #9a2929;
  border-color: #c46b6b;
  background: #fff0f0;
}

@media screen {
  body {
    background: #eef3f6;
  }

  .print-page {
    margin: 24px auto;
    box-shadow: 0 12px 40px rgba(24, 35, 44, 0.16);
  }
}

@media print {
  html,
  body {
    width: auto;
    height: auto;
    min-height: 0;
    margin: 0;
    padding: 0;
    overflow: visible;
    background: #fff;
  }

  .print-page {
    width: var(--print-page-width);
    height: auto;
    min-height: 0;
    margin: 0;
    overflow: visible;
    box-shadow: none;
  }

  .print-page > :first-child {
    margin-top: 0;
  }

  .print-page > :last-child {
    margin-bottom: 0;
  }

  .print-page::before,
  .print-page::after {
    display: none;
  }

  table,
  thead,
  tbody,
  tfoot,
  tr,
  td,
  th {
    transform: none;
  }
}
`;
