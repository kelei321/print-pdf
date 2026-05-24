<script setup>
import { computed } from 'vue';

const props = defineProps({
  report: {
    type: Object,
    required: true
  }
});

const groupedRows = computed(() => {
  const groups = new Map();

  for (const row of props.report.rows) {
    if (!groups.has(row.region)) {
      groups.set(row.region, { region: row.region, rows: [], planAmount: 0, actualAmount: 0, gapAmount: 0 });
    }

    const group = groups.get(row.region);
    group.rows.push(row);
    group.planAmount += row.planAmount;
    group.actualAmount += row.actualAmount;
    group.gapAmount += row.gapAmount;
  }

  return Array.from(groups.values());
});

const totals = computed(() => {
  return props.report.rows.reduce(
    (acc, row) => {
      acc.quantity += row.quantity;
      acc.planAmount += row.planAmount;
      acc.actualAmount += row.actualAmount;
      acc.gapAmount += row.gapAmount;
      return acc;
    },
    { quantity: 0, planAmount: 0, actualAmount: 0, gapAmount: 0 }
  );
});

function formatNumber(value) {
  return new Intl.NumberFormat('zh-CN').format(value);
}

function formatMoney(value) {
  return new Intl.NumberFormat('zh-CN', { style: 'currency', currency: 'CNY', maximumFractionDigits: 2 }).format(value);
}
</script>

<template>
  <header class="report-header">
    <div>
      <p class="eyebrow">A3 横向多页报表</p>
      <h2>{{ report.title }}</h2>
      <p class="subtitle">{{ report.subtitle }}</p>
    </div>
    <dl class="report-meta">
      <div>
        <dt>报表编号</dt>
        <dd>{{ report.reportNo }}</dd>
      </div>
      <div>
        <dt>统计周期</dt>
        <dd>{{ report.period }}</dd>
      </div>
      <div>
        <dt>生成时间</dt>
        <dd>{{ report.generatedAt }}</dd>
      </div>
    </dl>
  </header>

  <section class="summary-grid">
    <div>
      <span>记录数</span>
      <strong>{{ report.rows.length }}</strong>
    </div>
    <div>
      <span>总数量</span>
      <strong>{{ formatNumber(totals.quantity) }}</strong>
    </div>
    <div>
      <span>计划金额</span>
      <strong>{{ formatMoney(totals.planAmount) }}</strong>
    </div>
    <div>
      <span>实际金额</span>
      <strong>{{ formatMoney(totals.actualAmount) }}</strong>
    </div>
    <div>
      <span>差异金额</span>
      <strong :class="{ negative: totals.gapAmount < 0 }">{{ formatMoney(totals.gapAmount) }}</strong>
    </div>
  </section>

  <section class="ledger-section">
    <table class="ledger-table">
      <thead>
        <tr>
          <th rowspan="2" class="col-index">序号</th>
          <th rowspan="2" class="col-region">区域</th>
          <th rowspan="2" class="col-project">项目/仓库</th>
          <th rowspan="2" class="col-sku">物料编码</th>
          <th rowspan="2" class="col-name">物料名称</th>
          <th colspan="3">库存信息</th>
          <th colspan="3">金额信息</th>
          <th colspan="3">进度与风险</th>
          <th rowspan="2" class="col-owner">负责人</th>
          <th rowspan="2" class="col-note">备注</th>
        </tr>
        <tr>
          <th>单位</th>
          <th>数量</th>
          <th>库龄</th>
          <th>计划金额</th>
          <th>实际金额</th>
          <th>差异</th>
          <th>完成率</th>
          <th>状态</th>
          <th>风险</th>
        </tr>
      </thead>
      <tbody>
        <template v-for="group in groupedRows" :key="group.region">
          <tr class="group-row">
            <td colspan="7">{{ group.region }}：{{ group.rows.length }} 条记录</td>
            <td colspan="3">计划 {{ formatMoney(group.planAmount) }} / 实际 {{ formatMoney(group.actualAmount) }}</td>
            <td colspan="6">差异 {{ formatMoney(group.gapAmount) }}</td>
          </tr>
          <tr v-for="row in group.rows" :key="row.id">
            <td class="numeric">{{ row.id }}</td>
            <td>{{ row.region }}</td>
            <td>{{ row.project }}</td>
            <td>{{ row.sku }}</td>
            <td>{{ row.name }}</td>
            <td>{{ row.unit }}</td>
            <td class="numeric">{{ formatNumber(row.quantity) }}</td>
            <td>{{ row.age }}</td>
            <td class="numeric">{{ formatMoney(row.planAmount) }}</td>
            <td class="numeric">{{ formatMoney(row.actualAmount) }}</td>
            <td class="numeric" :class="{ negative: row.gapAmount < 0 }">{{ formatMoney(row.gapAmount) }}</td>
            <td>
              <span class="progress-track">
                <span class="progress-bar" :style="{ width: `${row.progress}%` }" />
              </span>
              <span class="progress-text">{{ row.progress }}%</span>
            </td>
            <td><span class="status-pill" :class="`status-${row.statusKey}`">{{ row.status }}</span></td>
            <td>{{ row.risk }}</td>
            <td>{{ row.owner }}</td>
            <td>{{ row.note }}</td>
          </tr>
        </template>
      </tbody>
      <tfoot>
        <tr>
          <td colspan="6">总计</td>
          <td class="numeric">{{ formatNumber(totals.quantity) }}</td>
          <td></td>
          <td class="numeric">{{ formatMoney(totals.planAmount) }}</td>
          <td class="numeric">{{ formatMoney(totals.actualAmount) }}</td>
          <td class="numeric" :class="{ negative: totals.gapAmount < 0 }">{{ formatMoney(totals.gapAmount) }}</td>
          <td colspan="5"></td>
        </tr>
      </tfoot>
    </table>
  </section>
</template>
