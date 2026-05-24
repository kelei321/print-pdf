import { getPrintTemplate, printExamples as registeredPrintExamples } from './templates/registry.js';
import { normalizeOrientation, normalizePaper } from './paperConfig.js';

export const MIN_ROW_COUNT = 30;
export const MAX_ROW_COUNT = 10000;
export const DEFAULT_ROW_COUNT = 360;

const regions = ['华东', '华南', '华北', '西南', '西北', '华中'];
const projects = ['上海一仓', '广州中心仓', '北京备件库', '成都周转仓', '西安工厂仓', '武汉前置仓'];
const names = ['控制器组件', '高压线束', '传感器模组', '工业网关', '液晶面板', '电源模块', '包装耗材', '精密轴承'];
const owners = ['陈明', '李娜', '王珂', '赵宇', '孙悦', '周航', '吴倩', '郑磊'];
const risks = ['正常', '需复核', '临期', '超储', '待质检', '采购延期'];
const statuses = [
  { label: '正常', key: 'ok' },
  { label: '关注', key: 'watch' },
  { label: '延迟', key: 'late' }
];

export const printExamples = registeredPrintExamples;

export const sampleReport = createSampleReport(DEFAULT_ROW_COUNT, 'a3-ledger');

export function getPrintExample(exampleId) {
  const template = getPrintTemplate(exampleId);
  const resolvedId = template === getPrintTemplate('a3-ledger') && !registeredPrintExamples.some((example) => example.id === exampleId)
    ? 'a3-ledger'
    : exampleId;

  return {
    id: resolvedId,
    name: template.name,
    description: template.description,
    paper: template.paper,
    orientation: template.orientation,
    padding: template.padding,
    rowsEnabled: template.rowsEnabled
  };
}

export function createSampleReport(rowCount = DEFAULT_ROW_COUNT, exampleId = 'a3-ledger', overrides = {}) {
  const example = getPrintExample(exampleId);
  const safeRowCount = clampRowCount(rowCount);
  const paper = normalizePaper(overrides.paper || example.paper, example.paper);
  const orientation = normalizeOrientation(overrides.orientation || example.orientation, example.orientation);
  const base = {
    type: example.id,
    paper,
    orientation,
    padding: overrides.padding || example.padding,
    exampleName: example.name,
    title: example.name,
    reportNo: `${example.id.toUpperCase()}-${safeRowCount}`,
    period: '2026-04-01 至 2026-04-28',
    generatedAt: '2026-04-29 21:20',
    watermark: normalizeWatermark(overrides.watermark),
    footer: normalizeFooter(overrides.footer, example)
  };

  if (example.id === 'a4-contract') return createContractReport(base);
  if (example.id === 'a4-statement') return createStatementReport(base);
  if (example.id === 'a3-summary') return createSummaryReport(base);
  if (example.id === 'a4-waybill') return createWaybillReport(base);
  if (example.id === 'a4-inspection') return createInspectionReport(base);
  if (example.id === 'a3-asset-tags') return createAssetTagsReport(base);
  return createLedgerReport(base, safeRowCount);
}

export function clampRowCount(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return DEFAULT_ROW_COUNT;
  return Math.min(MAX_ROW_COUNT, Math.max(MIN_ROW_COUNT, Math.round(parsed)));
}


function normalizeWatermark(watermark) {
  if (!watermark || typeof watermark !== 'object') {
    return { enabled: false, text: '内部资料', opacity: 0.08 };
  }

  return {
    enabled: Boolean(watermark.enabled),
    text: String(watermark.text || '内部资料').slice(0, 32),
    opacity: clampNumber(watermark.opacity, 0.02, 0.18, 0.08)
  };
}

function normalizeFooter(footer, example) {
  if (!footer || typeof footer !== 'object') {
    return { enabled: false, left: example.name, center: '', right: '' };
  }

  return {
    enabled: Boolean(footer.enabled),
    left: String(footer.left ?? example.name).slice(0, 64),
    center: String(footer.center ?? '').slice(0, 64),
    right: String(footer.right ?? '').slice(0, 64)
  };
}

function clampNumber(value, min, max, fallback) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}

function createLedgerReport(base, rowCount) {
  return {
    ...base,
    title: '区域库存与履约明细台账',
    subtitle: `动态生成 ${rowCount} 条示例数据，用于验证 A3 横向复杂表格的多页打印、重复表头和服务端 PDF 导出。`,
    rows: createRows(rowCount)
  };
}

function createContractReport(base) {
  return {
    ...base,
    title: '年度技术服务合同',
    subtitle: 'A4 纵向合同示例，用于验证正文条款、签章区和浏览器打印效果。',
    contractNo: 'CT-2026-0429',
    parties: [
      { role: '甲方', name: '上海示例科技有限公司', address: '上海市浦东新区世纪大道 100 号' },
      { role: '乙方', name: '杭州云端信息服务有限公司', address: '杭州市西湖区文三路 200 号' }
    ],
    clauses: [
      '乙方为甲方提供系统维护、安全加固、数据报表和应急响应服务。',
      '服务周期为 2026 年 5 月 1 日至 2027 年 4 月 30 日。',
      '甲方应在合同生效后 10 个工作日内支付首期款项。',
      '双方确认通过本系统导出的 PDF 文件可作为业务归档材料。',
      '任何一方变更联系人、地址或开票信息，应提前 3 个工作日书面通知对方。'
    ]
  };
}

function createStatementReport(base) {
  const items = [
    ['平台服务费', '2026-04', 1, 68000],
    ['安全巡检服务', '2026-04', 2, 12000],
    ['数据报表服务', '2026-04', 4, 5800],
    ['紧急响应服务', '2026-04', 1, 9600],
    ['短信通知费用', '2026-04', 38000, 0.08],
    ['对象存储费用', '2026-04', 1, 7350]
  ].map(([name, period, quantity, unitPrice], index) => ({
    id: index + 1,
    name,
    period,
    quantity,
    unitPrice,
    amount: Math.round(quantity * unitPrice * 100) / 100
  }));

  return {
    ...base,
    title: '客户服务费用对账单',
    subtitle: 'A4 纵向对账单示例，用于验证明细表格、合计金额和付款信息。',
    customer: '上海示例科技有限公司',
    statementNo: 'ST-2026-0429',
    dueDate: '2026-05-10',
    items,
    totalAmount: items.reduce((sum, item) => sum + item.amount, 0)
  };
}

function createSummaryReport(base) {
  const regions = ['华东', '华南', '华北', '西南', '西北', '华中'];

  return {
    ...base,
    title: '区域经营指标汇总看板',
    subtitle: 'A3 横向汇总示例，用于验证卡片、矩阵表和风险清单的打印布局。',
    metrics: [
      ['履约完成率', '96.8%', '+2.1%'],
      ['准时交付单', '1,284', '+86'],
      ['库存周转天数', '27.4', '-3.2'],
      ['异常工单', '18', '-7']
    ],
    regions: regions.map((region, index) => ({
      region,
      revenue: 820 + index * 96,
      fulfillment: 92 + (index % 5),
      risk: ['低', '中', '低', '高', '中', '低'][index],
      owner: ['陈明', '李娜', '王珂', '赵宇', '孙悦', '周航'][index]
    })),
    risks: [
      '华南中心仓存在短期库容压力，建议调拨 12% 慢周转物料。',
      '西南区域 3 个项目验收延期，需补充客户确认记录。',
      '华北备件库安全库存偏低，建议提高传感器模组采购频率。'
    ]
  };
}

function createWaybillReport(base) {
  return {
    ...base,
    title: '城配物流发运面单',
    subtitle: 'A4 物流面单示例，包含可打印二维码、条码、分拣码和签收区。',
    waybillNo: 'WB202604290081',
    sortCode: 'SHA-PD-08',
    routeCode: '沪 A08 / 12 车',
    sender: {
      name: '杭州云端信息服务有限公司',
      contact: '张工 138-0000-2026',
      address: '杭州市西湖区文三路 200 号 5 幢'
    },
    receiver: {
      name: '上海示例科技有限公司',
      contact: '李经理 139-0000-0429',
      address: '上海市浦东新区世纪大道 100 号 18 层'
    },
    packages: [
      { name: '工业网关', sku: 'GW-260081', quantity: 4, weight: '12.8kg' },
      { name: '传感器模组', sku: 'SN-260233', quantity: 16, weight: '8.5kg' },
      { name: '包装耗材', sku: 'PK-260620', quantity: 2, weight: '3.1kg' }
    ],
    codes: createCodePayload('WB202604290081')
  };
}

function createInspectionReport(base) {
  return {
    ...base,
    title: '设备月度巡检记录单',
    subtitle: 'A4 设备巡检示例，包含设备二维码、资产条码、巡检清单和异常闭环记录。',
    assetNo: 'EQP-SH-2026-0429',
    location: '上海一仓 / 自动化分拣线 A 区',
    owner: '设备运维组 / 陈明',
    codes: createCodePayload('EQP-SH-2026-0429'),
    checks: [
      ['外观结构', '机身无变形，安全护罩完整', '正常'],
      ['电源模块', '输入电压稳定，接线端子无松动', '正常'],
      ['网络通信', '网关在线，延迟小于 20ms', '正常'],
      ['传感器状态', '3 号光电传感器需清洁', '关注'],
      ['急停按钮', '触发、复位功能正常', '正常'],
      ['日志上传', '巡检日志自动同步成功', '正常']
    ],
    exceptions: [
      '3 号光电传感器表面有灰尘，已安排当班清洁。',
      '建议下次停机窗口复核 A 区网关固件版本。'
    ]
  };
}

function createAssetTagsReport(base) {
  return {
    ...base,
    title: '固定资产标签批量打印',
    subtitle: 'A3 横向标签示例，适合批量打印资产二维码和条码标签。',
    tags: Array.from({ length: 24 }, (_, index) => {
      const id = `AST-${String(20260001 + index).padStart(8, '0')}`;
      return {
        id,
        name: names[index % names.length],
        department: ['仓储部', '运维部', '研发部', '质量部'][index % 4],
        location: projects[index % projects.length],
        owner: owners[index % owners.length],
        codes: createCodePayload(id)
      };
    })
  };
}

export function createCodePayload(value) {
  return {
    value,
    qrCells: createQrCells(value),
    barcodeBars: createBarcodeBars(value)
  };
}

function createQrCells(value) {
  const size = 21;
  let seed = hashString(value);
  const cells = [];

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const inFinder =
        isFinderCell(x, y, 0, 0) ||
        isFinderCell(x, y, size - 7, 0) ||
        isFinderCell(x, y, 0, size - 7);

      seed = (seed * 1664525 + 1013904223) >>> 0;
      const filled = inFinder || ((seed >>> ((x + y) % 16)) & 1) === 1;
      if (filled) cells.push({ x, y });
    }
  }

  return cells;
}

function isFinderCell(x, y, startX, startY) {
  const localX = x - startX;
  const localY = y - startY;
  if (localX < 0 || localX > 6 || localY < 0 || localY > 6) return false;
  return localX === 0 || localX === 6 || localY === 0 || localY === 6 || (localX >= 2 && localX <= 4 && localY >= 2 && localY <= 4);
}

function createBarcodeBars(value) {
  let seed = hashString(value);
  return Array.from({ length: 56 }, (_, index) => {
    seed = (seed * 1103515245 + 12345) >>> 0;
    return {
      width: 1 + (seed % 3),
      height: index % 7 === 0 ? 42 : 30 + (seed % 12),
      gap: index % 5 === 0 ? 2 : 1
    };
  });
}

function hashString(value) {
  return String(value).split('').reduce((hash, char) => ((hash << 5) - hash + char.charCodeAt(0)) >>> 0, 2166136261);
}

function createRows(count) {
  return Array.from({ length: count }, (_, index) => {
    const id = index + 1;
    const status = statuses[index % statuses.length];
    const quantity = 80 + ((index * 37) % 920);
    const planAmount = quantity * (38 + (index % 11) * 7);
    const actualAmount = Math.round(planAmount * (0.88 + ((index % 9) * 0.035)));

    return {
      id,
      region: regions[index % regions.length],
      project: projects[index % projects.length],
      sku: `SKU-${String(260000 + id).padStart(6, '0')}`,
      name: names[index % names.length],
      unit: index % 3 === 0 ? '箱' : index % 3 === 1 ? '件' : '套',
      quantity,
      age: `${8 + ((index * 5) % 130)} 天`,
      planAmount,
      actualAmount,
      gapAmount: actualAmount - planAmount,
      progress: Math.min(100, 62 + ((index * 13) % 43)),
      status: status.label,
      statusKey: status.key,
      risk: risks[index % risks.length],
      owner: owners[index % owners.length],
      note: index % 5 === 0 ? '跨区域调拨，需在月末前完成复核。' : '按计划推进。'
    };
  });
}
