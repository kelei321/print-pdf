<script setup>
import { computed } from 'vue';

const props = defineProps({
  paper: {
    type: String,
    default: 'A4',
    validator: (value) => ['A4', 'A3'].includes(String(value).toUpperCase())
  },
  orientation: {
    type: String,
    default: 'portrait',
    validator: (value) => ['portrait', 'landscape'].includes(value)
  },
  padding: {
    type: String,
    default: '12mm'
  }
});

const pageClass = computed(() => {
  return [
    'print-page',
    `print-page--${props.paper.toLowerCase()}`,
    `print-page--${props.orientation}`
  ];
});

const pageStyle = computed(() => ({
  '--print-page-padding': props.padding
}));
</script>

<template>
  <article :class="pageClass" :style="pageStyle">
    <slot />
  </article>
</template>
