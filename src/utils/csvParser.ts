import { SalesOrder } from '../types/sales';

/**
 * Parses standard CSV text, properly handling quotes, commas within quotes,
 * escaped quotes (""), and multiple line break types (\r\n, \n, \r).
 */
export function parseCsvText(text: string): string[][] {
  const lines: string[][] = [];
  let currentRow: string[] = [];
  let currentField = '';
  let insideQuote = false;

  const cleanText = text.replace(/^\uFEFF/, ''); // strip BOM if present

  for (let i = 0; i < cleanText.length; i++) {
    const char = cleanText[i];
    const nextChar = cleanText[i + 1];

    if (char === '"') {
      if (insideQuote && nextChar === '"') {
        currentField += '"';
        i++; // skip next quote
      } else {
        insideQuote = !insideQuote;
      }
    } else if (char === ',' && !insideQuote) {
      currentRow.push(currentField.trim());
      currentField = '';
    } else if ((char === '\r' || char === '\n') && !insideQuote) {
      if (char === '\r' && nextChar === '\n') {
        i++; // handle CRLF
      }
      currentRow.push(currentField.trim());
      // only push non-empty rows
      if (currentRow.some((f) => f.length > 0)) {
        lines.push(currentRow);
      }
      currentRow = [];
      currentField = '';
    } else {
      currentField += char;
    }
  }

  // Push final field / row if any
  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField.trim());
    if (currentRow.some((f) => f.length > 0)) {
      lines.push(currentRow);
    }
  }

  return lines;
}

/**
 * Standardizes quarter names: "Q1", "Q2", "Q3", "Q4".
 */
export function normalizeQuarter(raw: string): string {
  const clean = raw.trim().toUpperCase();
  const match = clean.match(/Q(?:UARTER)?\s*([1-4])/i) || clean.match(/([1-4])\s*(?:ST|ND|RD|TH)?\s*Q(?:TR)?/i);
  if (match) {
    return `Q${match[1]}`;
  }
  if (['1', '2', '3', '4'].includes(clean)) {
    return `Q${clean}`;
  }
  return clean || 'Q1';
}

/**
 * Cleans numerical inputs like "$1,250.50", "(200)", "15%".
 */
export function cleanNumber(raw: string | number): number {
  if (typeof raw === 'number') return isNaN(raw) ? 0 : raw;
  if (!raw) return 0;
  const str = String(raw).trim();
  const isNegative = str.startsWith('(') && str.endsWith(')');
  const sanitized = str.replace(/[^0-9.-]/g, '');
  const num = parseFloat(sanitized);
  if (isNaN(num)) return 0;
  return isNegative ? -Math.abs(num) : num;
}

/**
 * Normalizes discount percent into a consistent 0 - 100 percentage range.
 */
export function normalizeDiscount(raw: string | number): number {
  const num = cleanNumber(raw);
  // If user entered 0.15 for 15%, scale to 15
  if (num > 0 && num <= 1) {
    return +(num * 100).toFixed(2);
  }
  return +num.toFixed(2);
}

export interface ParseResult {
  orders: SalesOrder[];
  errors: string[];
  warnings: string[];
  detectedColumns: Record<string, string>;
  totalRows: number;
}

/**
 * Parses CSV content into validated SalesOrder objects.
 */
export function parseSalesCsv(csvText: string): ParseResult {
  const rawRows = parseCsvText(csvText);
  const errors: string[] = [];
  const warnings: string[] = [];

  if (rawRows.length < 2) {
    return {
      orders: [],
      errors: ['The CSV file is empty or does not contain header and data rows.'],
      warnings: [],
      detectedColumns: {},
      totalRows: 0,
    };
  }

  const headerRow = rawRows[0].map((h) => h.toLowerCase().trim().replace(/[\s_-]+/g, ''));

  // Flexible header aliases
  const aliases: Record<string, string[]> = {
    quarter: ['quarter', 'qtr', 'quartername', 'period', 'salesquarter'],
    region: ['region', 'territory', 'market', 'area', 'geography', 'salesregion'],
    channel: ['channel', 'saleschannel', 'route', 'distributionchannel', 'type'],
    product: ['product', 'item', 'sku', 'productname', 'productline'],
    units: ['units', 'unitssold', 'quantity', 'qty', 'volume', 'count'],
    discount_pct: ['discountpct', 'discount', 'discountrate', 'discountpercentage', 'discountpercent', 'disc'],
    revenue: ['revenue', 'sales', 'salesamount', 'amount', 'totalrevenue', 'netsales', 'reventotal'],
  };

  const detectedIndex: Record<keyof typeof aliases, number> = {
    quarter: -1,
    region: -1,
    channel: -1,
    product: -1,
    units: -1,
    discount_pct: -1,
    revenue: -1,
  };

  const detectedColumns: Record<string, string> = {};

  (Object.keys(aliases) as (keyof typeof aliases)[]).forEach((col) => {
    const aliasList = aliases[col];
    const idx = headerRow.findIndex((h) => aliasList.some((alias) => h === alias || h.includes(alias)));
    detectedIndex[col] = idx;
    if (idx !== -1) {
      detectedColumns[col] = rawRows[0][idx];
    }
  });

  const missingColumns: string[] = [];
  (Object.keys(detectedIndex) as (keyof typeof detectedIndex)[]).forEach((key) => {
    if (detectedIndex[key] === -1) {
      missingColumns.push(key);
    }
  });

  if (missingColumns.length > 0) {
    errors.push(
      `Missing required column(s): ${missingColumns.join(', ')}. Found headers: [${rawRows[0].join(', ')}].`
    );
    return {
      orders: [],
      errors,
      warnings,
      detectedColumns,
      totalRows: rawRows.length - 1,
    };
  }

  const orders: SalesOrder[] = [];

  for (let i = 1; i < rawRows.length; i++) {
    const row = rawRows[i];
    if (row.length === 0 || row.every((c) => c === '')) continue;

    const rawQuarter = row[detectedIndex.quarter] || '';
    const rawRegion = row[detectedIndex.region] || '';
    const rawChannel = row[detectedIndex.channel] || '';
    const rawProduct = row[detectedIndex.product] || '';
    const rawUnits = row[detectedIndex.units] || '0';
    const rawDiscount = row[detectedIndex.discount_pct] || '0';
    const rawRevenue = row[detectedIndex.revenue] || '0';

    if (!rawQuarter || !rawRegion) {
      warnings.push(`Row ${i + 1}: Skipped row due to empty quarter or region.`);
      continue;
    }

    const quarter = normalizeQuarter(rawQuarter);
    const region = rawRegion.trim();
    const channel = rawChannel.trim() || 'General';
    const product = rawProduct.trim() || 'Standard Product';
    const units = Math.max(0, Math.round(cleanNumber(rawUnits)));
    const discount_pct = normalizeDiscount(rawDiscount);
    const revenue = cleanNumber(rawRevenue);

    orders.push({
      id: `ord-${i}`,
      quarter,
      region,
      channel,
      product,
      units,
      discount_pct,
      revenue,
    });
  }

  if (orders.length === 0) {
    errors.push('No valid order rows could be extracted from the file.');
  }

  return {
    orders,
    errors,
    warnings,
    detectedColumns,
    totalRows: rawRows.length - 1,
  };
}

/**
 * Generates realistic enterprise sales order data spanning Q1 to Q4 across regions,
 * products, and channels with notable Q2 to Q3 changes.
 */
export function getSampleSalesCsv(): string {
  return `quarter,region,channel,product,units,discount_pct,revenue
Q1,North America,Enterprise,Enterprise Suite,320,10.0,480000
Q1,North America,Direct Online,Cloud Pro,850,5.0,255000
Q1,North America,Partner,Hardware Appliance,140,12.5,210000
Q1,North America,Retail,Accessories & Peripherals,1200,8.0,96000
Q1,Europe,Enterprise,Enterprise Suite,210,12.0,315000
Q1,Europe,Direct Online,Cloud Pro,620,6.0,186000
Q1,Europe,Partner,Hardware Appliance,95,15.0,142500
Q1,Asia Pacific,Enterprise,Enterprise Suite,180,8.0,270000
Q1,Asia Pacific,Direct Online,Cloud Pro,920,4.0,276000
Q1,Asia Pacific,Partner,Hardware Appliance,110,10.0,165000
Q1,Latin America,Enterprise,Enterprise Suite,90,14.0,135000
Q1,Latin America,Direct Online,Cloud Pro,310,7.0,93000
Q2,North America,Enterprise,Enterprise Suite,360,10.5,540000
Q2,North America,Direct Online,Cloud Pro,920,5.0,276000
Q2,North America,Partner,Hardware Appliance,165,12.0,247500
Q2,North America,Retail,Accessories & Peripherals,1350,8.0,108000
Q2,Europe,Enterprise,Enterprise Suite,240,11.5,360000
Q2,Europe,Direct Online,Cloud Pro,680,6.0,204000
Q2,Europe,Partner,Hardware Appliance,110,14.0,165000
Q2,Europe,Retail,Accessories & Peripherals,820,9.0,65600
Q2,Asia Pacific,Enterprise,Enterprise Suite,210,8.0,315000
Q2,Asia Pacific,Direct Online,Cloud Pro,1050,4.5,315000
Q2,Asia Pacific,Partner,Hardware Appliance,125,10.0,187500
Q2,Asia Pacific,Retail,Accessories & Peripherals,1100,5.0,88000
Q2,Latin America,Enterprise,Enterprise Suite,110,15.0,165000
Q2,Latin America,Direct Online,Cloud Pro,340,7.5,102000
Q2,Latin America,Partner,Hardware Appliance,60,16.0,90000
Q3,North America,Enterprise,Enterprise Suite,520,11.0,780000
Q3,North America,Direct Online,Cloud Pro,1480,4.0,444000
Q3,North America,Partner,Hardware Appliance,290,9.5,435000
Q3,North America,Retail,Accessories & Peripherals,2100,6.0,168000
Q3,Europe,Enterprise,Enterprise Suite,260,12.0,390000
Q3,Europe,Direct Online,Cloud Pro,710,6.0,213000
Q3,Europe,Partner,Hardware Appliance,115,13.5,172500
Q3,Europe,Retail,Accessories & Peripherals,860,8.5,68800
Q3,Asia Pacific,Enterprise,Enterprise Suite,240,8.0,360000
Q3,Asia Pacific,Direct Online,Cloud Pro,1180,4.0,354000
Q3,Asia Pacific,Partner,Hardware Appliance,140,9.0,210000
Q3,Asia Pacific,Retail,Accessories & Peripherals,1250,5.0,100000
Q3,Latin America,Enterprise,Enterprise Suite,125,14.0,187500
Q3,Latin America,Direct Online,Cloud Pro,380,7.0,114000
Q3,Latin America,Partner,Hardware Appliance,70,15.0,105000
Q4,North America,Enterprise,Enterprise Suite,580,12.0,870000
Q4,North America,Direct Online,Cloud Pro,1620,5.0,486000
Q4,North America,Partner,Hardware Appliance,310,10.0,465000
Q4,North America,Retail,Accessories & Peripherals,2400,7.0,192000
Q4,Europe,Enterprise,Enterprise Suite,280,12.5,420000
Q4,Europe,Direct Online,Cloud Pro,750,6.5,225000
Q4,Europe,Partner,Hardware Appliance,130,13.0,195000
Q4,Asia Pacific,Enterprise,Enterprise Suite,260,8.5,390000
Q4,Asia Pacific,Direct Online,Cloud Pro,1300,4.0,390000
Q4,Asia Pacific,Partner,Hardware Appliance,155,9.0,232500
Q4,Latin America,Enterprise,Enterprise Suite,140,14.5,210000
Q4,Latin America,Direct Online,Cloud Pro,420,7.0,126000
Q4,Latin America,Partner,Hardware Appliance,80,15.0,120000`;
}
