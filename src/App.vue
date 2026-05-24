<script setup>
import { computed, onMounted, ref } from 'vue';
import PrintReport from './print/PrintReport.vue';
import { buildPageCss, buildReportHtml } from './print/buildReportHtml.js';
import { formatOrientation, ORIENTATION_OPTIONS, PAPER_OPTIONS } from './print/paperConfig.js';
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
const paperOverride = ref('auto');
const orientationOverride = ref('auto');
const status = ref('idle');
const error = ref('');
const exportResult = ref(null);
const previewMode = ref('component');
const previewHtml = ref('');
const previewStatus = ref('idle');
const watermarkEnabled = ref(false);
const watermarkText = ref('内部资料');
const footerEnabled = ref(true);
const rendererStatus = ref(null);
const rendererStatusError = ref('');

const selectedExample = computed(() => getPrintExample(selectedExampleId.value));
const selectedPaper = computed(() => paperOverride.value === 'auto' ? selectedExample.value.paper : paperOverride.value);
const selectedOrientation = computed(() => orientationOverride.value === 'auto' ? selectedExample.value.orientation : orientationOverride.value);
const report = computed(() =>
  createSampleReport(rowCount.value, selectedExampleId.value, {
    paper: selectedPaper.value,
    orientation: selectedOrientation.value,
    watermark: {
      enabled: watermarkEnabled.value,
      text: watermarkText.value,
      opacity: 0.08
    },
    footer: {
      enabled: footerEnabled.value,
      left: selectedExample.value.name,
      center: '仅供归档 / 系统生成',
      right: '打印时间：2026-04-29 21:20'
    }
  })
);
const isBusy = computed(() => ['building', 'rendering', 'downloading'].includes(status.value));
const statusText = computed(() => ({
  idle: '待生成',
  building: '构建 HTML 中...',
  rendering: '服务端渲染中...',
  downloading: '下载中...',
  done: '导出成功',
  error: '导出失败'
}[status.value] || '待生成'));
const estimatedPages = computed(() => {
  if (selectedExample.value.id !== 'a3-ledger') return 1;
  const rowsPerPage = selectedPaper.value === 'A3' && selectedOrientation.value === 'landscape' ? 28 : 18;
  return Math.max(1, Math.ceil(rowCount.value / rowsPerPage));
});
const dynamicPageCss = computed(() => buildPageCss(report.value));
const queueText = computed(() => {
  const queue = rendererStatus.value?.queue;
  if (!queue) return '未读取';
  return `运行 ${queue.active} / 排队 ${queue.queued} / 已完成 ${queue.completed} / 已拒绝 ${queue.rejected}`;
});

function printBrowser() {
  window.print();
}

function applyExample(value) {
  selectedExampleId.value = value;
  paperOverride.value = 'auto';
  orientationOverride.value = 'auto';
  exportResult.value = null;
  previewHtml.value = '';
}

function applyRowCount(value) {
  rowCount.value = clampRowCount(value);
  exportResult.value = null;
  previewHtml.value = '';
}

function applyPaper(value) {
  paperOverride.value = value;
  exportResult.value = null;
  previewHtml.value = '';
}

function applyOrientation(value) {
  orientationOverride.value = value;
  exportResult.value = null;
  previewHtml.value = '';
}

function applyWatermarkEnabled(value) {
  watermarkEnabled.value = value;
  exportResult.value = null;
  previewHtml.value = '';
}

function applyWatermarkText(value) {
  watermarkText.value = String(value || '内部资料').slice(0, 32);
  exportResult.value = null;
  previewHtml.value = '';
}

function applyFooterEnabled(value) {
  footerEnabled.value = value;
  exportResult.value = null;
  previewHtml.value = '';
}

function formatBytes(value) {
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / 1024 / 1024).toFixed(2)} MB`;
}

async function refreshRendererStatus() {
  rendererStatusError.value = '';

  try {
    const response = await fetch('/api/status');
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.message || '服务端状态读取失败');
    rendererStatus.value = payload;
  } catch (err) {
    rendererStatusError.value = err instanceof Error ? err.message : '服务端状态读取失败';
  }
}

async function refreshPreviewHtml() {
  previewStatus.value = 'building';
  error.value = '';

  try {
    previewHtml.value = await buildReportHtml(report.value);
    previewMode.value = 'iframe';
    previewStatus.value = 'done';
  } catch (err) {
    previewStatus.value = 'error';
    error.value = err instanceof Error ? err.message : 'HTML preview failed';
  }
}

function showComponentPreview() {
  previewMode.value = 'component';
}

async function downloadPdf() {
  status.value = 'building';
  error.value = '';
  exportResult.value = null;
  const activeReport = report.value;
  const startedAt = performance.now();

  try {
    const html = await buildReportHtml(activeReport);
    const htmlReadyAt = performance.now();
    status.value = 'rendering';
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
          rows: activeReport.rows?.length || 0,
          paper: activeReport.paper,
          orientation: activeReport.orientation
        }
      })
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      const suffix = payload.requestId ? `（requestId: ${payload.requestId}）` : '';
      throw new Error(`${payload.message || 'PDF render failed'}${suffix}`);
    }

    status.value = 'downloading';
    const blob = await response.blob();
    const finishedAt = performance.now();
    const serverDuration = response.headers.get('X-PDF-Render-Duration-Ms');
    const timing = {
      example: selectedExample.value.name,
      rows: activeReport.rows?.length || 0,
      estimatedPages: estimatedPages.value,
      htmlBuildMs: Math.round(htmlReadyAt - startedAt),
      serverRenderMs: serverDuration ? Number(serverDuration) : null,
      queueMs: Number(response.headers.get('X-PDF-Queue-Duration-Ms') || 0),
      totalMs: Math.round(finishedAt - startedAt),
      pdfBytes: blob.size,
      paper: activeReport.paper,
      orientation: activeReport.orientation,
      requestId: response.headers.get('X-Request-Id')
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
    refreshRendererStatus();
  } catch (err) {
    status.value = 'error';
    error.value = err instanceof Error ? err.message : 'PDF render failed';
  }
}

onMounted(refreshRendererStatus);
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
        <span class="status-badge" :class="`status-badge--${status}`">{{ statusText }}</span>
        <button type="button" @click="printBrowser">浏览器打印</button>
        <button type="button" :disabled="previewStatus === 'building'" @click="refreshPreviewHtml">
          {{ previewStatus === 'building' ? '预览构建中...' : 'HTML 预览' }}
        </button>
        <button type="button" class="primary" :disabled="isBusy" @click="downloadPdf">
          {{ isBusy ? statusText : '服务端生成 PDF' }}
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

      <div class="field">
        <label for="paperType">纸张</label>
        <select id="paperType" :value="paperOverride" @change="applyPaper($event.target.value)">
          <option value="auto">跟随示例</option>
          <option v-for="paper in PAPER_OPTIONS" :key="paper" :value="paper">{{ paper }}</option>
        </select>
      </div>

      <div class="field">
        <label for="orientationType">方向</label>
        <select id="orientationType" :value="orientationOverride" @change="applyOrientation($event.target.value)">
          <option value="auto">跟随示例</option>
          <option v-for="orientation in ORIENTATION_OPTIONS" :key="orientation" :value="orientation">
            {{ formatOrientation(orientation) }}
          </option>
        </select>
      </div>

      <div class="field field--inline">
        <label for="watermarkEnabled">水印</label>
        <input
          id="watermarkEnabled"
          type="checkbox"
          :checked="watermarkEnabled"
          @change="applyWatermarkEnabled($event.target.checked)"
        />
      </div>

      <div v-if="watermarkEnabled" class="field">
        <label for="watermarkText">水印文字</label>
        <input id="watermarkText" :value="watermarkText" maxlength="32" @input="applyWatermarkText($event.target.value)" />
      </div>

      <div class="field field--inline">
        <label for="footerEnabled">页脚</label>
        <input
          id="footerEnabled"
          type="checkbox"
          :checked="footerEnabled"
          @change="applyFooterEnabled($event.target.checked)"
        />
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
        <span>{{ selectedPaper }} {{ formatOrientation(selectedOrientation) }}</span>
        <span v-if="selectedExample.rowsEnabled">{{ report.rows.length }} 条数据</span>
        <span>预计 {{ estimatedPages }} 页</span>
      </div>
    </section>

    <section class="renderer-panel" aria-label="服务端状态">
      <div>
        <strong>服务端队列</strong>
        <span>{{ queueText }}</span>
        <small v-if="rendererStatusError">{{ rendererStatusError }}</small>
      </div>
      <button type="button" @click="refreshRendererStatus">刷新状态</button>
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
      <span>{{ exportResult.example }} / {{ exportResult.paper }} {{ formatOrientation(exportResult.orientation) }}</span>
      <span>总耗时 {{ exportResult.totalMs }} ms</span>
      <span>HTML 构建 {{ exportResult.htmlBuildMs }} ms</span>
      <span>服务端渲染 {{ exportResult.serverRenderMs ?? '-' }} ms</span>
      <span>队列等待 {{ exportResult.queueMs }} ms</span>
      <span>{{ formatBytes(exportResult.pdfBytes) }}</span>
      <span v-if="exportResult.requestId">requestId: {{ exportResult.requestId }}</span>
    </section>

    <section class="preview-actions" aria-label="预览模式">
      <button type="button" :class="{ active: previewMode === 'component' }" @click="showComponentPreview">组件预览</button>
      <button type="button" :class="{ active: previewMode === 'iframe' }" :disabled="!previewHtml" @click="previewMode = 'iframe'">HTML 导出预览</button>
    </section>

    <section class="preview-frame" aria-label="Print preview">
      <PrintReport v-if="previewMode === 'component'" :report="report" />
      <iframe v-else class="html-preview" title="HTML 导出预览" :srcdoc="previewHtml" />
    </section>
  </main>
</template>
