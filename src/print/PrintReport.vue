<script setup>
import { computed, onMounted } from 'vue';
import A3LedgerReport from './A3LedgerReport.vue';
import A3AssetTagsReport from './A3AssetTagsReport.vue';
import A3SummaryReport from './A3SummaryReport.vue';
import A4ContractReport from './A4ContractReport.vue';
import A4InspectionReport from './A4InspectionReport.vue';
import A4StatementReport from './A4StatementReport.vue';
import A4WaybillReport from './A4WaybillReport.vue';
import PrintPage from './PrintPage.vue';

const props = defineProps({
  report: {
    type: Object,
    required: true
  }
});

const reportComponent = computed(() => {
  if (props.report.type === 'a4-contract') return A4ContractReport;
  if (props.report.type === 'a4-statement') return A4StatementReport;
  if (props.report.type === 'a3-summary') return A3SummaryReport;
  if (props.report.type === 'a4-waybill') return A4WaybillReport;
  if (props.report.type === 'a4-inspection') return A4InspectionReport;
  if (props.report.type === 'a3-asset-tags') return A3AssetTagsReport;
  return A3LedgerReport;
});

function markPrintReady() {
  if (document.fonts?.ready) {
    document.fonts.ready.finally(() => {
      window.__PRINT_READY__ = true;
    });
    return;
  }

  window.__PRINT_READY__ = true;
}

onMounted(markPrintReady);
</script>

<template>
  <PrintPage :paper="report.paper" :orientation="report.orientation" :padding="report.padding">
    <component :is="reportComponent" :report="report" />
  </PrintPage>
</template>
