import {
  SalesOrder,
  RegionQuarterMetric,
  ProductDriver,
  ChannelDriver,
  RegionQ2Q3Analysis,
  AnalysisResult,
  SalesAnalyticsPayload,
} from '../types/sales';

export function formatCurrency(amount: number, compact = false): string {
  if (compact && Math.abs(amount) >= 1_000_000) {
    return `$${(amount / 1_000_000).toFixed(2)}M`;
  }
  if (compact && Math.abs(amount) >= 1_000) {
    return `$${(amount / 1_000).toFixed(1)}k`;
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatPct(val: number, includeSign = true): string {
  const sign = includeSign && val > 0 ? '+' : '';
  return `${sign}${val.toFixed(1)}%`;
}

/**
 * Computes all aggregations, cross-tab matrices, and Q2-to-Q3 drill-down drivers.
 */
export function analyzeSalesData(orders: SalesOrder[]): AnalysisResult {
  // Sort quarters logically: Q1, Q2, Q3, Q4, then any custom quarters
  const quarterRank: Record<string, number> = { Q1: 1, Q2: 2, Q3: 3, Q4: 4 };
  const rawQuarters = Array.from(new Set(orders.map((o) => o.quarter)));
  const quarters = rawQuarters.sort((a, b) => {
    const ra = quarterRank[a.toUpperCase()] || 99;
    const rb = quarterRank[b.toUpperCase()] || 99;
    if (ra !== rb) return ra - rb;
    return a.localeCompare(b);
  });

  const regions = Array.from(new Set(orders.map((o) => o.region))).sort();
  const channels = Array.from(new Set(orders.map((o) => o.channel))).sort();
  const products = Array.from(new Set(orders.map((o) => o.product))).sort();

  // Matrix: region -> quarter -> metric
  const matrix: Record<string, Record<string, RegionQuarterMetric>> = {};
  const quarterTotals: Record<string, RegionQuarterMetric> = {};
  const regionTotals: Record<string, RegionQuarterMetric> = {};

  regions.forEach((r) => {
    matrix[r] = {};
    quarters.forEach((q) => {
      matrix[r][q] = {
        revenue: 0,
        units: 0,
        orderCount: 0,
        avgDiscount: 0,
        avgPricePerUnit: 0,
      };
    });
    regionTotals[r] = {
      revenue: 0,
      units: 0,
      orderCount: 0,
      avgDiscount: 0,
      avgPricePerUnit: 0,
    };
  });

  quarters.forEach((q) => {
    quarterTotals[q] = {
      revenue: 0,
      units: 0,
      orderCount: 0,
      avgDiscount: 0,
      avgPricePerUnit: 0,
    };
  });

  let grandTotalRevenue = 0;
  const regionQuarterDiscountSums: Record<string, Record<string, number>> = {};
  const quarterDiscountSums: Record<string, number> = {};
  const regionDiscountSums: Record<string, number> = {};

  orders.forEach((order) => {
    const r = order.region;
    const q = order.quarter;

    if (!matrix[r]) matrix[r] = {};
    if (!matrix[r][q]) {
      matrix[r][q] = {
        revenue: 0,
        units: 0,
        orderCount: 0,
        avgDiscount: 0,
        avgPricePerUnit: 0,
      };
    }

    matrix[r][q].revenue += order.revenue;
    matrix[r][q].units += order.units;
    matrix[r][q].orderCount += 1;

    if (!regionQuarterDiscountSums[r]) regionQuarterDiscountSums[r] = {};
    regionQuarterDiscountSums[r][q] = (regionQuarterDiscountSums[r][q] || 0) + order.discount_pct;

    regionTotals[r].revenue += order.revenue;
    regionTotals[r].units += order.units;
    regionTotals[r].orderCount += 1;
    regionDiscountSums[r] = (regionDiscountSums[r] || 0) + order.discount_pct;

    quarterTotals[q].revenue += order.revenue;
    quarterTotals[q].units += order.units;
    quarterTotals[q].orderCount += 1;
    quarterDiscountSums[q] = (quarterDiscountSums[q] || 0) + order.discount_pct;

    grandTotalRevenue += order.revenue;
  });

  // Calculate averages
  regions.forEach((r) => {
    quarters.forEach((q) => {
      const cell = matrix[r][q];
      if (cell.orderCount > 0) {
        cell.avgDiscount = +(regionQuarterDiscountSums[r]?.[q] / cell.orderCount).toFixed(2);
      }
      if (cell.units > 0) {
        cell.avgPricePerUnit = +(cell.revenue / cell.units).toFixed(2);
      }
    });

    const rt = regionTotals[r];
    if (rt.orderCount > 0) {
      rt.avgDiscount = +(regionDiscountSums[r] / rt.orderCount).toFixed(2);
    }
    if (rt.units > 0) {
      rt.avgPricePerUnit = +(rt.revenue / rt.units).toFixed(2);
    }
  });

  quarters.forEach((q) => {
    const qt = quarterTotals[q];
    if (qt.orderCount > 0) {
      qt.avgDiscount = +(quarterDiscountSums[q] / qt.orderCount).toFixed(2);
    }
    if (qt.units > 0) {
      qt.avgPricePerUnit = +(qt.revenue / qt.units).toFixed(2);
    }
  });

  const hasQ2AndQ3 = quarters.includes('Q2') && quarters.includes('Q3');

  // Compute Q2 to Q3 comparisons for each region
  const q2q3Comparisons: RegionQ2Q3Analysis[] = [];

  if (hasQ2AndQ3) {
    regions.forEach((region) => {
      const q2Cell = matrix[region]?.['Q2'] || {
        revenue: 0,
        units: 0,
        orderCount: 0,
        avgDiscount: 0,
        avgPricePerUnit: 0,
      };
      const q3Cell = matrix[region]?.['Q3'] || {
        revenue: 0,
        units: 0,
        orderCount: 0,
        avgDiscount: 0,
        avgPricePerUnit: 0,
      };

      const q2Revenue = q2Cell.revenue;
      const q3Revenue = q3Cell.revenue;
      const netChange = q3Revenue - q2Revenue;
      const absChange = Math.abs(netChange);
      const pctChange = q2Revenue === 0 ? (q3Revenue > 0 ? 100 : 0) : +((netChange / q2Revenue) * 100).toFixed(2);

      const q2Units = q2Cell.units;
      const q3Units = q3Cell.units;
      const netUnitsChange = q3Units - q2Units;
      const unitsPctChange = q2Units === 0 ? (q3Units > 0 ? 100 : 0) : +((netUnitsChange / q2Units) * 100).toFixed(2);

      const q2AvgDiscount = q2Cell.avgDiscount;
      const q3AvgDiscount = q3Cell.avgDiscount;
      const discountPointsChange = +(q3AvgDiscount - q2AvgDiscount).toFixed(2);

      const q2AvgPricePerUnit = q2Cell.avgPricePerUnit;
      const q3AvgPricePerUnit = q3Cell.avgPricePerUnit;

      // Product drivers in this region
      const productDriversMap: Record<
        string,
        { q2Revenue: number; q3Revenue: number; q2Units: number; q3Units: number }
      > = {};

      orders
        .filter((o) => o.region === region && (o.quarter === 'Q2' || o.quarter === 'Q3'))
        .forEach((o) => {
          if (!productDriversMap[o.product]) {
            productDriversMap[o.product] = { q2Revenue: 0, q3Revenue: 0, q2Units: 0, q3Units: 0 };
          }
          if (o.quarter === 'Q2') {
            productDriversMap[o.product].q2Revenue += o.revenue;
            productDriversMap[o.product].q2Units += o.units;
          } else if (o.quarter === 'Q3') {
            productDriversMap[o.product].q3Revenue += o.revenue;
            productDriversMap[o.product].q3Units += o.units;
          }
        });

      const allProductDrivers: ProductDriver[] = Object.entries(productDriversMap).map(([p, data]) => {
        const deltaRevenue = data.q3Revenue - data.q2Revenue;
        const deltaPct = data.q2Revenue === 0 ? (data.q3Revenue > 0 ? 100 : 0) : +((deltaRevenue / data.q2Revenue) * 100).toFixed(2);
        const deltaUnits = data.q3Units - data.q2Units;
        return {
          product: p,
          q2Revenue: data.q2Revenue,
          q3Revenue: data.q3Revenue,
          deltaRevenue,
          deltaPct,
          q2Units: data.q2Units,
          q3Units: data.q3Units,
          deltaUnits,
        };
      });

      allProductDrivers.sort((a, b) => b.deltaRevenue - a.deltaRevenue);
      const topProductGain = allProductDrivers.length > 0 && allProductDrivers[0].deltaRevenue > 0 ? allProductDrivers[0] : null;
      const topProductLoss =
        allProductDrivers.length > 0 && allProductDrivers[allProductDrivers.length - 1].deltaRevenue < 0
          ? allProductDrivers[allProductDrivers.length - 1]
          : null;

      // Channel drivers in this region
      const channelDriversMap: Record<string, { q2Revenue: number; q3Revenue: number }> = {};
      orders
        .filter((o) => o.region === region && (o.quarter === 'Q2' || o.quarter === 'Q3'))
        .forEach((o) => {
          if (!channelDriversMap[o.channel]) {
            channelDriversMap[o.channel] = { q2Revenue: 0, q3Revenue: 0 };
          }
          if (o.quarter === 'Q2') {
            channelDriversMap[o.channel].q2Revenue += o.revenue;
          } else if (o.quarter === 'Q3') {
            channelDriversMap[o.channel].q3Revenue += o.revenue;
          }
        });

      const allChannelDrivers: ChannelDriver[] = Object.entries(channelDriversMap).map(([c, data]) => {
        const deltaRevenue = data.q3Revenue - data.q2Revenue;
        const deltaPct = data.q2Revenue === 0 ? (data.q3Revenue > 0 ? 100 : 0) : +((deltaRevenue / data.q2Revenue) * 100).toFixed(2);
        return {
          channel: c,
          q2Revenue: data.q2Revenue,
          q3Revenue: data.q3Revenue,
          deltaRevenue,
          deltaPct,
        };
      });

      allChannelDrivers.sort((a, b) => b.deltaRevenue - a.deltaRevenue);
      const topChannelGain = allChannelDrivers.length > 0 && allChannelDrivers[0].deltaRevenue > 0 ? allChannelDrivers[0] : null;
      const topChannelLoss =
        allChannelDrivers.length > 0 && allChannelDrivers[allChannelDrivers.length - 1].deltaRevenue < 0
          ? allChannelDrivers[allChannelDrivers.length - 1]
          : null;

      q2q3Comparisons.push({
        region,
        q2Revenue,
        q3Revenue,
        absChange,
        netChange,
        pctChange,
        q2Units,
        q3Units,
        netUnitsChange,
        unitsPctChange,
        q2AvgDiscount,
        q3AvgDiscount,
        discountPointsChange,
        q2AvgPricePerUnit,
        q3AvgPricePerUnit,
        topProductGain,
        topProductLoss,
        topChannelGain,
        topChannelLoss,
        allProductDrivers,
        allChannelDrivers,
      });
    });
  }

  // Sort comparisons by absolute dollar change descending
  const sortedByDollar = [...q2q3Comparisons].sort((a, b) => b.absChange - a.absChange);
  const sortedByPct = [...q2q3Comparisons].sort((a, b) => Math.abs(b.pctChange) - Math.abs(a.pctChange));

  const mostChangedByDollar = sortedByDollar.length > 0 ? sortedByDollar[0] : null;
  const mostChangedByPct = sortedByPct.length > 0 ? sortedByPct[0] : null;

  const overallQ2Revenue = quarterTotals['Q2']?.revenue || 0;
  const overallQ3Revenue = quarterTotals['Q3']?.revenue || 0;
  const overallQ2Q3Delta = overallQ3Revenue - overallQ2Revenue;
  const overallQ2Q3Pct = overallQ2Revenue === 0 ? 0 : +((overallQ2Q3Delta / overallQ2Revenue) * 100).toFixed(2);

  return {
    orders,
    quarters,
    regions,
    channels,
    products,
    matrix,
    quarterTotals,
    regionTotals,
    grandTotalRevenue,
    hasQ2AndQ3,
    q2q3Comparisons: sortedByDollar,
    mostChangedByDollar,
    mostChangedByPct,
    overallQ2Revenue,
    overallQ3Revenue,
    overallQ2Q3Delta,
    overallQ2Q3Pct,
  };
}

/**
 * Builds the exact payload sent to the backend Gemini AI service.
 */
export function buildSalesAnalyticsPayload(analysis: AnalysisResult): SalesAnalyticsPayload | null {
  if (!analysis.hasQ2AndQ3 || !analysis.mostChangedByDollar) {
    return null;
  }

  return {
    mostChangedRegion: analysis.mostChangedByDollar,
    allRegions: analysis.q2q3Comparisons.map((c) => ({
      region: c.region,
      q2Revenue: c.q2Revenue,
      q3Revenue: c.q3Revenue,
      netChange: c.netChange,
      pctChange: c.pctChange,
    })),
    overallCompany: {
      q2Revenue: analysis.overallQ2Revenue,
      q3Revenue: analysis.overallQ3Revenue,
      netChange: analysis.overallQ2Q3Delta,
      pctChange: analysis.overallQ2Q3Pct,
    },
  };
}

/**
 * Deterministic generator of a three-sentence summary.
 * Used as a 100% reliable baseline or instant preview.
 */
export function generateDeterministicSummary(analysis: RegionQ2Q3Analysis): { summary: string; sentences: string[] } {
  const direction = analysis.netChange >= 0 ? 'increased' : 'decreased';
  const growthSign = analysis.netChange >= 0 ? '+' : '';
  const dollarChangeStr = formatCurrency(Math.abs(analysis.netChange));
  const q2Str = formatCurrency(analysis.q2Revenue);
  const q3Str = formatCurrency(analysis.q3Revenue);
  const pctStr = `${growthSign}${analysis.pctChange.toFixed(1)}%`;

  // Sentence 1: Region identification and revenue swing
  const s1 = `${analysis.region} experienced the largest revenue change from Q2 to Q3, moving from ${q2Str} to ${q3Str}, a net swing of ${dollarChangeStr} (${pctStr}).`;

  // Sentence 2: Primary driver (units and top product)
  let s2 = '';
  const unitsDirection = analysis.netUnitsChange >= 0 ? 'grew' : 'contracted';
  const unitsChangeStr = Math.abs(analysis.netUnitsChange).toLocaleString();
  const topProduct = analysis.topProductGain || analysis.topProductLoss;

  if (topProduct) {
    const prodDeltaStr = formatCurrency(Math.abs(topProduct.deltaRevenue));
    const prodVerb = topProduct.deltaRevenue >= 0 ? 'gained' : 'declined by';
    s2 = `This shift was primarily driven by total order volume that ${unitsDirection} by ${unitsChangeStr} units (from ${analysis.q2Units.toLocaleString()} in Q2 to ${analysis.q3Units.toLocaleString()} in Q3), led by ${topProduct.product} which ${prodVerb} ${prodDeltaStr}.`;
  } else {
    s2 = `This shift was primarily driven by total order volume that ${unitsDirection} by ${unitsChangeStr} units, moving from ${analysis.q2Units.toLocaleString()} units in Q2 to ${analysis.q3Units.toLocaleString()} units in Q3.`;
  }

  // Sentence 3: Secondary driver (discounts & channel)
  let s3 = '';
  const discDelta = analysis.discountPointsChange;
  const discDirection = discDelta >= 0 ? 'rose' : 'dropped';
  const topChannel = analysis.topChannelGain || analysis.topChannelLoss;

  if (topChannel && Math.abs(discDelta) > 0.05) {
    const chDeltaStr = formatCurrency(Math.abs(topChannel.deltaRevenue));
    const chVerb = topChannel.deltaRevenue >= 0 ? 'contributed an increase of' : 'saw a decline of';
    s3 = `Additionally, the average discount rate ${discDirection} from ${analysis.q2AvgDiscount.toFixed(1)}% to ${analysis.q3AvgDiscount.toFixed(1)}%, while the ${topChannel.channel} channel ${chVerb} ${chDeltaStr} to overall regional performance.`;
  } else if (topChannel) {
    const chDeltaStr = formatCurrency(Math.abs(topChannel.deltaRevenue));
    const chVerb = topChannel.deltaRevenue >= 0 ? 'expanded by' : 'fell by';
    s3 = `Additionally, sales through the ${topChannel.channel} channel ${chVerb} ${chDeltaStr}, reinforcing the quarterly trend across the regional product portfolio.`;
  } else {
    s3 = `Additionally, the regional discount rate changed by ${Math.abs(discDelta).toFixed(1)} percentage points, averaging ${analysis.q3AvgDiscount.toFixed(1)}% in Q3 compared to ${analysis.q2AvgDiscount.toFixed(1)}% in Q2.`;
  }

  const sentences = [s1, s2, s3];
  return {
    summary: sentences.join(' '),
    sentences,
  };
}
