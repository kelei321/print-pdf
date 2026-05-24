<script setup>
const props = defineProps({
  report: {
    type: Object,
    required: true
  }
});

function formatMoney(value) {
  return new Intl.NumberFormat('zh-CN', { style: 'currency', currency: 'CNY', maximumFractionDigits: 2 }).format(value);
}
</script>

<template>
  <header class="document-header statement-header">
    <div>
      <p class="eyebrow">A4 对账单示例</p>
      <h2>{{ report.title }}</h2>
      <p class="subtitle">{{ report.subtitle }}</p>
    </div>
    <strong>{{ formatMoney(props.report.totalAmount) }}</strong>
  </header>

  <section class="contract-meta">
    <div>
      <span>客户</span>
      <strong>{{ report.customer }}</strong>
    </div>
    <div>
      <span>账单编号</span>
      <strong>{{ report.statementNo }}</strong>
    </div>
    <div>
      <span>付款截止</span>
      <strong>{{ report.dueDate }}</strong>
    </div>
  </section>

  <table class="simple-table">
    <thead>
      <tr>
        <th>序号</th>
        <th>项目</th>
        <th>周期</th>
        <th>数量</th>
        <th>单价</th>
        <th>金额</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="item in report.items" :key="item.id">
        <td>{{ item.id }}</td>
        <td>{{ item.name }}</td>
        <td>{{ item.period }}</td>
        <td class="numeric">{{ item.quantity }}</td>
        <td class="numeric">{{ formatMoney(item.unitPrice) }}</td>
        <td class="numeric">{{ formatMoney(item.amount) }}</td>
      </tr>
    </tbody>
    <tfoot>
      <tr>
        <td colspan="5">应付合计</td>
        <td class="numeric">{{ formatMoney(report.totalAmount) }}</td>
      </tr>
    </tfoot>
  </table>

  <section class="payment-box">
    <h3>付款信息</h3>
    <p>开户名：杭州云端信息服务有限公司</p>
    <p>开户行：中国工商银行杭州文三路支行</p>
    <p>账号：6222 0000 0000 2026</p>
  </section>
</template>
