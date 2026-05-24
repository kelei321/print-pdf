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
  <header class="document-header statement-header">
    <div>
      <p class="eyebrow">A4 巡检单示例</p>
      <h2>{{ report.title }}</h2>
      <p class="subtitle">{{ report.subtitle }}</p>
    </div>
    <QrCodeMark :cells="report.codes.qrCells" :value="report.assetNo" />
  </header>

  <section class="contract-meta">
    <div>
      <span>设备编号</span>
      <strong>{{ report.assetNo }}</strong>
    </div>
    <div>
      <span>设备位置</span>
      <strong>{{ report.location }}</strong>
    </div>
    <div>
      <span>责任人</span>
      <strong>{{ report.owner }}</strong>
    </div>
  </section>

  <BarcodeMark :bars="report.codes.barcodeBars" :value="report.assetNo" />

  <table class="simple-table inspection-table">
    <thead>
      <tr>
        <th>巡检项</th>
        <th>标准/记录</th>
        <th>结果</th>
        <th>确认</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="item in report.checks" :key="item[0]">
        <td>{{ item[0] }}</td>
        <td>{{ item[1] }}</td>
        <td>{{ item[2] }}</td>
        <td>□ 正常　□ 异常</td>
      </tr>
    </tbody>
  </table>

  <section class="payment-box">
    <h3>异常与闭环</h3>
    <ol>
      <li v-for="item in report.exceptions" :key="item">{{ item }}</li>
    </ol>
  </section>

  <section class="sign-grid">
    <div>巡检人</div>
    <div>复核人</div>
    <div>日期</div>
  </section>
</template>
