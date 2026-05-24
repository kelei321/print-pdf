import A3AssetTagsReport from '../A3AssetTagsReport.vue';
import A3LedgerReport from '../A3LedgerReport.vue';
import A3SummaryReport from '../A3SummaryReport.vue';
import A4ContractReport from '../A4ContractReport.vue';
import A4InspectionReport from '../A4InspectionReport.vue';
import A4StatementReport from '../A4StatementReport.vue';
import A4WaybillReport from '../A4WaybillReport.vue';

export const templateRegistry = {
  'a3-ledger': {
    component: A3LedgerReport,
    name: 'A3 横向明细宽表',
    description: '多页宽表、分组汇总、重复表头，适合库存台账和履约明细。',
    paper: 'A3',
    orientation: 'landscape',
    padding: '10mm 10mm 9mm',
    rowsEnabled: true
  },
  'a4-contract': {
    component: A4ContractReport,
    name: 'A4 合同',
    description: '常见合同/协议版式，含甲乙方、条款和签章。',
    paper: 'A4',
    orientation: 'portrait',
    padding: '16mm 14mm',
    rowsEnabled: false
  },
  'a4-statement': {
    component: A4StatementReport,
    name: 'A4 对账单',
    description: '客户账单、费用明细、合计与付款信息。',
    paper: 'A4',
    orientation: 'portrait',
    padding: '14mm 12mm',
    rowsEnabled: false
  },
  'a3-summary': {
    component: A3SummaryReport,
    name: 'A3 横向汇总看板',
    description: '区域 KPI、风险清单和趋势摘要，适合经营例会材料。',
    paper: 'A3',
    orientation: 'landscape',
    padding: '12mm',
    rowsEnabled: false
  },
  'a4-waybill': {
    component: A4WaybillReport,
    name: 'A4 物流面单',
    description: '包含收寄件信息、二维码、条码、分拣码和签收联。',
    paper: 'A4',
    orientation: 'portrait',
    padding: '10mm',
    rowsEnabled: false
  },
  'a4-inspection': {
    component: A4InspectionReport,
    name: 'A4 设备巡检单',
    description: '设备二维码、巡检项目、结果勾选、异常记录和负责人签字。',
    paper: 'A4',
    orientation: 'portrait',
    padding: '12mm',
    rowsEnabled: false
  },
  'a3-asset-tags': {
    component: A3AssetTagsReport,
    name: 'A3 资产标签批量打印',
    description: '批量资产标签、二维码、条码、设备编码和位置字段。',
    paper: 'A3',
    orientation: 'landscape',
    padding: '8mm',
    rowsEnabled: false
  }
};

export const printExamples = Object.entries(templateRegistry).map(([id, template]) => ({
  id,
  name: template.name,
  description: template.description,
  paper: template.paper,
  orientation: template.orientation,
  padding: template.padding,
  rowsEnabled: template.rowsEnabled
}));

export function getPrintTemplate(templateId) {
  return templateRegistry[templateId] || templateRegistry['a3-ledger'];
}

export function getPrintComponent(templateId) {
  return getPrintTemplate(templateId).component;
}
