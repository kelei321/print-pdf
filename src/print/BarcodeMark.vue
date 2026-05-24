<script setup>
defineProps({
  bars: {
    type: Array,
    required: true
  },
  value: {
    type: String,
    required: true
  }
});
</script>

<template>
  <figure class="barcode-mark">
    <div class="barcode-bars" role="img" :aria-label="`条码 ${value}`">
      <span
        v-for="(bar, index) in bars"
        :key="index"
        :style="{ width: `${bar.width}px`, height: `${bar.height}px`, marginRight: `${bar.gap}px` }"
      />
    </div>
    <figcaption>{{ value }}</figcaption>
  </figure>
</template>
