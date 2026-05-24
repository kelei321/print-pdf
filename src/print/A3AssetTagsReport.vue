<script setup>
import BarcodeMark from './BarcodeMark.vue';
import QrCodeMark from './QrCodeMark.vue';

defineProps({
  report: {
    type: Object,
    required: true
  }
});
</script>

<template>
  <header class="report-header">
    <div>
      <p class="eyebrow">A3 标签批量打印示例</p>
      <h2>{{ report.title }}</h2>
      <p class="subtitle">{{ report.subtitle }}</p>
    </div>
    <dl class="report-meta">
      <div>
        <dt>标签数量</dt>
        <dd>{{ report.tags.length }}</dd>
      </div>
      <div>
        <dt>生成时间</dt>
        <dd>{{ report.generatedAt }}</dd>
      </div>
    </dl>
  </header>

  <section class="asset-tag-grid">
    <article v-for="tag in report.tags" :key="tag.id" class="asset-tag">
      <div>
        <h3>{{ tag.name }}</h3>
        <p>{{ tag.id }}</p>
        <p>{{ tag.department }} / {{ tag.location }}</p>
        <p>责任人：{{ tag.owner }}</p>
      </div>
      <QrCodeMark :cells="tag.codes.qrCells" :value="tag.id" />
      <BarcodeMark :bars="tag.codes.barcodeBars" :value="tag.id" />
    </article>
  </section>
</template>
