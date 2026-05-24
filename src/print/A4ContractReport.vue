<script setup>
defineProps({
  report: {
    type: Object,
    required: true
  }
});
</script>

<template>
  <header class="document-header">
    <p class="eyebrow">A4 合同示例</p>
    <h2>{{ report.title }}</h2>
    <p class="subtitle">{{ report.subtitle }}</p>
  </header>

  <section class="contract-meta">
    <div>
      <span>合同编号</span>
      <strong>{{ report.contractNo }}</strong>
    </div>
    <div>
      <span>统计周期</span>
      <strong>{{ report.period }}</strong>
    </div>
    <div>
      <span>生成时间</span>
      <strong>{{ report.generatedAt }}</strong>
    </div>
  </section>

  <section class="party-grid">
    <div v-for="party in report.parties" :key="party.role" class="party-box">
      <span>{{ party.role }}</span>
      <strong>{{ party.name }}</strong>
      <p>{{ party.address }}</p>
    </div>
  </section>

  <section class="clause-section">
    <h3>合同条款</h3>
    <ol>
      <li v-for="clause in report.clauses" :key="clause">{{ clause }}</li>
    </ol>
  </section>

  <section class="signature-row">
    <div v-for="party in report.parties" :key="party.role" class="signature-box">
      <span>{{ party.role }}</span>
      <strong>{{ party.name }}</strong>
      <i>签章</i>
    </div>
  </section>
</template>
