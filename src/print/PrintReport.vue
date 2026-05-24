<script setup>
import { computed, onMounted } from 'vue';
import PrintPage from './PrintPage.vue';
import { getPrintComponent } from './templates/registry.js';

const props = defineProps({
  report: {
    type: Object,
    required: true
  }
});

const reportComponent = computed(() => getPrintComponent(props.report.type));

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
  <PrintPage
    :paper="report.paper"
    :orientation="report.orientation"
    :padding="report.padding"
    :watermark="report.watermark"
    :footer="report.footer"
  >
    <component :is="reportComponent" :report="report" />
  </PrintPage>
</template>
