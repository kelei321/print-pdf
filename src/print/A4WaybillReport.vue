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
  <header class="waybill-header">
    <div>
      <p class="eyebrow">A4 物流面单示例</p>
      <h2>{{ report.title }}</h2>
      <p class="subtitle">{{ report.subtitle }}</p>
    </div>
    <div class="sort-code">{{ report.sortCode }}</div>
  </header>

  <section class="code-row">
    <QrCodeMark :cells="report.codes.qrCells" :value="report.waybillNo" />
    <BarcodeMark :bars="report.codes.barcodeBars" :value="report.waybillNo" />
  </section>

  <section class="address-grid">
    <div class="address-box">
      <span>寄件方</span>
      <strong>{{ report.sender.name }}</strong>
      <p>{{ report.sender.contact }}</p>
      <p>{{ report.sender.address }}</p>
    </div>
    <div class="address-box receiver">
      <span>收件方</span>
      <strong>{{ report.receiver.name }}</strong>
      <p>{{ report.receiver.contact }}</p>
      <p>{{ report.receiver.address }}</p>
    </div>
  </section>

  <section class="route-strip">
    <strong>{{ report.routeCode }}</strong>
    <span>请按分拣码装车，签收前核对外箱数量和封签。</span>
  </section>

  <table class="simple-table">
    <thead>
      <tr>
        <th>货品</th>
        <th>SKU</th>
        <th>数量</th>
        <th>重量</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="item in report.packages" :key="item.sku">
        <td>{{ item.name }}</td>
        <td>{{ item.sku }}</td>
        <td class="numeric">{{ item.quantity }}</td>
        <td>{{ item.weight }}</td>
      </tr>
    </tbody>
  </table>

  <section class="sign-grid">
    <div>揽收人</div>
    <div>派送员</div>
    <div>签收人</div>
  </section>
</template>
