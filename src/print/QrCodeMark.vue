<script setup>
defineProps({
  cells: {
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
  <figure class="qr-mark">
    <svg viewBox="0 0 21 21" role="img" :aria-label="`二维码 ${value}`">
      <rect width="21" height="21" fill="#fff" />
      <rect v-for="cell in cells" :key="`${cell.x}-${cell.y}`" :x="cell.x" :y="cell.y" width="1" height="1" fill="#101820" />
    </svg>
    <figcaption>{{ value }}</figcaption>
  </figure>
</template>
