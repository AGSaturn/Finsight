import { FinancialData } from "./types";

export const MOCK_REPORTS: FinancialData[] = [
  {
    company: "贵州茅台",
    ticker: "600519",
    period: "2024年报",
    content: `# 贵州茅台2024年度报告摘要

## 第一节 重要提示
本年度报告摘要来自年度报告全文，为全面了解本公司的经营成果、财务状况及未来发展规划，投资者应当到上海证券交易所网站仔细阅读年度报告全文。

## 第二节 公司基本情况
公司主营业务：主要业务是茅台酒及系列酒的生产与销售，主导产品为“贵州茅台酒”。

## 第三节 经营情况与分析
2024年度，公司实现营业总收入 **1505.6亿元**，同比增长 **15.01%**；实现归属于上市公司股东的净利润 **747.34亿元**，同比增长 **19.16%**。

毛利率方面，公司全年综合毛利率为 **91.87%**，主要得益于产品结构持续优化，直销比例进一步提升。

销售费用率保持稳定，市场拓展力度稳中有升。

### 渠道分析
直销渠道收入达到 **678.2亿元**，同比增长 **35.4%**，占比提升至 **45%**。批发代理渠道收入 **827.4亿元**，同比增长 **5.2%**。i茅台数字营销平台贡献显著，月活用户突破 **1500万**。

### 产品结构
茅台酒实现收入 **1280.5亿元**，系列酒实现收入 **225.1亿元**。高端产品“飞天茅台”依然是核心增长引擎，珍品、生肖等非标产品补充了高端产品矩阵，满足了差异化需求。

### 研发投入
本年度研发投入 **12.5亿元**，主要用于数字化转型、防伪技术升级及新工艺研究。公司持续探索将大数据、人工智能应用于生产、物流及市场营销各环节，提升运营效率。

## 第四节 后期面临的风险
1. 行业竞争加剧。
2. 原辅材料价格波动。
3. 宏观经济波动带来的消费力下行。`,
    sections: [
      { title: "重要提示", id: "tips" },
      { title: "基本情况", id: "basic" },
      { title: "经营情况", id: "ops" },
      { title: "风险提示", id: "risks" },
    ]
  },
  {
    company: "Apple Inc.",
    ticker: "AAPL",
    period: "2024 Q1 10-K",
    content: `# Apple Inc. 2024 Q1 Form 10-K Summary

## Business Overview
Apple designs, manufactures, and markets smartphones, personal computers, tablets, wearables, and accessories, and sells a variety of related services.

## Financial Highlights
- Net sales: **$119.6 billion** (+2% YoY)
- Net income: **$33.9 billion** (+13% YoY)
- iPhone revenue: **$69.7 billion** (Strong holiday performance)
- Services revenue: **$23.1 billion** (Record high)

## Segment Performance
Americas remains the largest market, followed by Europe and Greater China. Growth in emerging markets was significant this quarter.

## Risk Factors
- Supply chain vulnerabilities.
- Geopolitical tensions affecting manufacturing and sales.
- Regulatory challenges in EU and USA regarding App Store policies.`,
    sections: [
      { title: "Overview", id: "overview" },
      { title: "Financials", id: "fin" },
      { title: "Segments", id: "seg" },
      { title: "Risks", id: "risk" },
    ]
  }
];
