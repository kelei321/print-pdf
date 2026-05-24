<script setup>
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
      <p class="eyebrow">A3 横向汇总示例</p>
      <h2>{{ report.title }}</h2>
      <p class="subtitle">{{ report.subtitle }}</p>
    </div>
    <dl class="report-meta">
      <div>
        <dt>周期</dt>
        <dd>{{ report.period }}</dd>
      </div>
      <div>
        <dt>生成时间</dt>
        <dd>{{ report.generatedAt }}</dd>
      </div>
    </dl>
  </header>

  <section class="dashboard-metrics">
    <div v-for="metric in report.metrics" :key="metric[0]">
      <span>{{ metric[0] }}</span>
      <strong>{{ metric[1] }}</strong>
      <em>{{ metric[2] }}</em>
    </div>
  </section>

  <section class="dashboard-grid">
    <table class="simple-table">
      <thead>
        <tr>
          <th>区域</th>
          <th>收入指数</th>
          <th>履约率</th>
          <th>风险等级</th>
          <th>负责人</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="region in report.regions" :key="region.region">
          <td>{{ region.region }}</td>
          <td class="numeric">{{ region.revenue }}</td>
          <td class="numeric">{{ region.fulfillment }}%</td>
          <td>{{ region.risk }}</td>
          <td>{{ region.owner }}</td>
        </tr>
      </tbody>
    </table>

    <section class="risk-panel">
      <h3>重点风险</h3>
      <ol>
        <li v-for="risk in report.risks" :key="risk">{{ risk }}</li>
      </ol>
    </section>
  </section>
</template>
