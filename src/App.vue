<script setup>
import { computed, ref } from 'vue';
import PrintReport from './print/PrintReport.vue';
import { buildPageCss, buildReportHtml } from './print/buildReportHtml.js';
import {
  DEFAULT_ROW_COUNT,
  MAX_ROW_COUNT,
  MIN_ROW_COUNT,
  clampRowCount,
  createSampleReport,
  getPrintExample,
  printExamples
} from './print/sampleReport.js';

const selectedExampleId = ref('a3-ledger');
const rowCount = ref(DEFAULT_ROW_COUNT);
const status = ref('idle');
const error = ref('');
const exportResult = ref(null);

const selectedExample = computed(() => getPrintExample(selectedExampleId.value));
const report = computed(() => createSampleReport(rowCount.value, selectedExampleId.value));
const isRendering = computed(() => status.value === 'rendering');
const estimatedPages = computed(() => {
  if (selectedExample.value.id !== 'a3-ledger') return selectedExample.value.paper === 'A3' ? 1 : 1;
  return Math.max(1, Math.ceil(rowCount.value / 28));
});
const dynamicPageCss = computed(() => buildPageCss(report.value));

function printBrowser() {
  window.print();
}

function applyExample(value) {
  selectedExampleId.value = value;
  exportResult.value = null;
}

function applyRowCount(value) {
  rowCount.value = clampRowCount(value);
  exportResult.value = null;
}

function formatBytes(value) {
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / 1024 / 1024).toFixed(2)} MB`;
}

async function downloadPdf() {
  status.value = 'rendering';
  error.value = '';
  exportResult.value = null;
  const activeReport = report.value;
  const startedAt = performance.now();

  try {
    const html = await buildReportHtml(activeReport);
    const htmlReadyAt = performance.now();
    const response = await fetch('/api/pdf/render', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        html,
        filename: `${activeReport.type}-${activeReport.reportNo}.pdf`,
        paper: activeReport.paper,
        margin: {
          top: '0mm',
          right: '0mm',
          bottom: '0mm',
          left: '0mm'
        },
        metadata: {
          businessId: activeReport.reportNo,
          type: activeReport.type,
          rows: activeReport.rows?.length || 0
        }
      })
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      throw new Error(payload.message || 'PDF render failed');
    }

    const blob = await response.blob();
    const finishedAt = performance.now();
    const serverDuration = response.headers.get('X-PDF-Render-Duration-Ms');
    const timing = {
      example: selectedExample.value.name,
      rows: activeReport.rows?.length || 0,
      estimatedPages: estimatedPages.value,
      htmlBuildMs: Math.round(htmlReadyAt - startedAt),
      serverRenderMs: serverDuration ? Number(serverDuration) : null,
      totalMs: Math.round(finishedAt - startedAt),
      pdfBytes: blob.size
    };

    console.info('PDF_EXPORT_TIMING', timing);
    exportResult.value = timing;

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${activeReport.type}-${activeReport.reportNo}.pdf`;
    link.click();
    URL.revokeObjectURL(url);
    status.value = 'done';
  } catch (err) {
    status.value = 'error';
    error.value = err instanceof Error ? err.message : 'PDF render failed';
  }
}
</script>

<template>
  <main class="app-shell">
    <component :is="'style'">{{ dynamicPageCss }}</component>

    <section class="toolbar" aria-label="PDF actions">
      <div>
        <h1>打印页多示例</h1>
        <p>A4/A3、合同、对账单、汇总看板和复杂宽表，统一走服务端 Playwright PDF 导出。</p>
      </div>
      <div class="actions">
        <button type="button" @click="printBrowser">浏览器打印</button>
        <button type="button" class="primary" :disabled="isRendering" @click="downloadPdf">
          {{ isRendering ? '生成中...' : '服务端生成 PDF' }}
        </button>
      </div>
    </section>

    <section class="test-panel" aria-label="测试参数">
      <div class="field">
        <label for="exampleType">示例</label>
        <select id="exampleType" :value="selectedExampleId" @change="applyExample($event.target.value)">
          <option v-for="example in printExamples" :key="example.id" :value="example.id">
            {{ example.name }}
          </option>
        </select>
      </div>

      <div v-if="selectedExample.rowsEnabled" class="field">
        <label for="rowCount">数据量</label>
        <input
          id="rowCount"
          :value="rowCount"
          type="number"
          :min="MIN_ROW_COUNT"
          :max="MAX_ROW_COUNT"
          step="10"
          @change="applyRowCount($event.target.value)"
        />
      </div>

      <input
        v-if="selectedExample.rowsEnabled"
        class="row-slider"
        :value="rowCount"
        type="range"
        :min="MIN_ROW_COUNT"
        :max="MAX_ROW_COUNT"
        step="10"
        aria-label="调节数据量"
        @input="applyRowCount($event.target.value)"
      />

      <div class="test-metrics">
        <span>{{ selectedExample.paper }} {{ selectedExample.orientation === 'landscape' ? '横向' : '纵向' }}</span>
        <span v-if="selectedExample.rowsEnabled">{{ report.rows.length }} 条数据</span>
        <span>预计 {{ estimatedPages }} 页</span>
      </div>
    </section>

    <section class="example-tabs" aria-label="示例说明">
      <button
        v-for="example in printExamples"
        :key="example.id"
        type="button"
        :class="{ active: example.id === selectedExampleId }"
        @click="applyExample(example.id)"
      >
        <strong>{{ example.name }}</strong>
        <span>{{ example.description }}</span>
      </button>
    </section>

    <div v-if="error" class="alert">{{ error }}</div>

    <section v-if="exportResult" class="toast" role="status" aria-live="polite">
      <button type="button" aria-label="关闭提示" @click="exportResult = null">x</button>
      <strong>PDF 导出成功</strong>
      <span>{{ exportResult.example }}</span>
      <span>总耗时 {{ exportResult.totalMs }} ms</span>
      <span>服务端渲染 {{ exportResult.serverRenderMs ?? '-' }} ms</span>
      <span>{{ formatBytes(exportResult.pdfBytes) }}</span>
    </section>

    <section class="preview-frame" aria-label="Print preview">
      <PrintReport :report="report" />
    </section>
  </main>
</template>
