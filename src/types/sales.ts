export interface SalesOrder {
  id?: string;
  quarter: string;
  region: string;
  channel: string;
  product: string;
  units: number;
  discount_pct: number;
  revenue: number;
}

export interface RegionQuarterMetric {
  revenue: number;
  units: number;
  orderCount: number;
  avgDiscount: number; // percentage, e.g. 12.4%
  avgPricePerUnit: number;
}

export interface ProductDriver {
  product: string;
  q2Revenue: number;
  q3Revenue: number;
  deltaRevenue: number;
  deltaPct: number;
  q2Units: number;
  q3Units: number;
  deltaUnits: number;
}

export interface ChannelDriver {
  channel: string;
  q2Revenue: number;
  q3Revenue: number;
  deltaRevenue: number;
  deltaPct: number;
}

export interface RegionQ2Q3Analysis {
  region: string;
  q2Revenue: number;
  q3Revenue: number;
  absChange: number;
  netChange: number;
  pctChange: number;
  q2Units: number;
  q3Units: number;
  netUnitsChange: number;
  unitsPctChange: number;
  q2AvgDiscount: number; // in %
  q3AvgDiscount: number; // in %
  discountPointsChange: number; // q3 - q2 in % points
  q2AvgPricePerUnit: number;
  q3AvgPricePerUnit: number;
  topProductGain: ProductDriver | null;
  topProductLoss: ProductDriver | null;
  topChannelGain: ChannelDriver | null;
  topChannelLoss: ChannelDriver | null;
  allProductDrivers: ProductDriver[];
  allChannelDrivers: ChannelDriver[];
}

export interface SalesAnalyticsPayload {
  mostChangedRegion: RegionQ2Q3Analysis;
  allRegions: {
    region: string;
    q2Revenue: number;
    q3Revenue: number;
    netChange: number;
    pctChange: number;
  }[];
  overallCompany: {
    q2Revenue: number;
    q3Revenue: number;
    netChange: number;
    pctChange: number;
  };
}

export interface AnalysisResult {
  orders: SalesOrder[];
  quarters: string[];
  regions: string[];
  channels: string[];
  products: string[];
  matrix: Record<string, Record<string, RegionQuarterMetric>>;
  quarterTotals: Record<string, RegionQuarterMetric>;
  regionTotals: Record<string, RegionQuarterMetric>;
  grandTotalRevenue: number;
  hasQ2AndQ3: boolean;
  q2q3Comparisons: RegionQ2Q3Analysis[];
  mostChangedByDollar: RegionQ2Q3Analysis | null;
  mostChangedByPct: RegionQ2Q3Analysis | null;
  overallQ2Revenue: number;
  overallQ3Revenue: number;
  overallQ2Q3Delta: number;
  overallQ2Q3Pct: number;
}

export interface AiSummaryResponse {
  summary: string;
  sentences: string[];
  mostChangedRegionName: string;
  calculatedMetricsUsed: SalesAnalyticsPayload;
  source: 'gemini-3.8-flash' | 'fallback-deterministic' | string;
  error?: string;
  notice?: string;
}
