<script setup>
import { computed } from 'vue';
import { getPaperSpec } from './paperConfig.js';

const props = defineProps({
  paper: {
    type: String,
    default: 'A4'
  },
  orientation: {
    type: String,
    default: 'portrait'
  },
  padding: {
    type: String,
    default: '12mm'
  },
  watermark: {
    type: Object,
    default: null
  },
  footer: {
    type: Object,
    default: null
  }
});

const paperSpec = computed(() => getPaperSpec(props.paper, props.orientation));

const pageClass = computed(() => [
  'print-page',
  `print-page--${paperSpec.value.paper.toLowerCase()}`,
  `print-page--${paperSpec.value.orientation}`,
  {
    'print-page--with-watermark': props.watermark?.enabled,
    'print-page--with-footer': props.footer?.enabled
  }
]);

const watermarkText = computed(() => props.watermark?.text || '内部资料');
const footerLeft = computed(() => props.footer?.left || '');
const footerCenter = computed(() => props.footer?.center || '');
const footerRight = computed(() => props.footer?.right || '');

const pageStyle = computed(() => ({
  '--print-page-padding': props.padding,
  '--print-page-width': paperSpec.value.width,
  '--print-page-height': paperSpec.value.height,
  '--print-watermark-opacity': String(props.watermark?.opacity ?? 0.08)
}));
</script>

<template>
  <article :class="pageClass" :style="pageStyle">
    <div v-if="watermark?.enabled" class="print-watermark" aria-hidden="true">{{ watermarkText }}</div>
    <slot />
    <footer v-if="footer?.enabled" class="print-fixed-footer" aria-hidden="true">
      <span>{{ footerLeft }}</span>
      <span>{{ footerCenter }}</span>
      <span>{{ footerRight }}</span>
    </footer>
  </article>
</template>
