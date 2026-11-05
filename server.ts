import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '10mb' }));

// Shared Gemini client instance
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
};

/**
 * Health check endpoint
 */
app.get('/api/health', (_req: Request, res: Response) => {
  const hasKey = Boolean(process.env.GEMINI_API_KEY);
  res.json({ status: 'ok', hasGeminiKey: hasKey });
});

/**
 * AI 3-Sentence Summary generation endpoint
 */
app.post('/api/ai/summarize', async (req: Request, res: Response) => {
  try {
    const payload = req.body;
    if (!payload || !payload.mostChangedRegion) {
      res.status(400).json({ error: 'Missing sales analysis payload.' });
      return;
    }

    const m = payload.mostChangedRegion;
    const allRegions = payload.allRegions || [];
    const overall = payload.overallCompany || {};

    const ai = getGeminiClient();

    // If no API key configured, return note + deterministic breakdown
    if (!ai) {
      console.warn('GEMINI_API_KEY not found in environment, falling back to deterministic summary.');
      res.json({
        summary: null,
        error: 'GEMINI_API_KEY not configured in environment. Please check the Settings > Secrets panel.',
        source: 'fallback-deterministic',
      });
      return;
    }

    const promptData = {
      mostChangedRegion: {
        region: m.region,
        q2RevenueFormatted: `$${Number(m.q2Revenue).toLocaleString()}`,
        q3RevenueFormatted: `$${Number(m.q3Revenue).toLocaleString()}`,
        netChangeFormatted: `${m.netChange >= 0 ? '+' : '-'}$${Math.abs(Number(m.netChange)).toLocaleString()}`,
        pctChangeFormatted: `${m.pctChange >= 0 ? '+' : ''}${Number(m.pctChange).toFixed(1)}%`,
        q2Units: Number(m.q2Units).toLocaleString(),
        q3Units: Number(m.q3Units).toLocaleString(),
        unitsChange: `${m.netUnitsChange >= 0 ? '+' : '-'}${Math.abs(Number(m.netUnitsChange)).toLocaleString()}`,
        unitsPctChange: `${m.unitsPctChange >= 0 ? '+' : ''}${Number(m.unitsPctChange).toFixed(1)}%`,
        q2AvgDiscountPct: `${Number(m.q2AvgDiscount).toFixed(1)}%`,
        q3AvgDiscountPct: `${Number(m.q3AvgDiscount).toFixed(1)}%`,
        discountPointsShift: `${m.discountPointsChange >= 0 ? '+' : ''}${Number(m.discountPointsChange).toFixed(1)} percentage points`,
        topProductGain: m.topProductGain
          ? {
              product: m.topProductGain.product,
              q2Revenue: `$${Number(m.topProductGain.q2Revenue).toLocaleString()}`,
              q3Revenue: `$${Number(m.topProductGain.q3Revenue).toLocaleString()}`,
              deltaRevenue: `+$${Number(m.topProductGain.deltaRevenue).toLocaleString()}`,
              deltaPct: `+${Number(m.topProductGain.deltaPct).toFixed(1)}%`,
            }
          : null,
        topProductLoss: m.topProductLoss
          ? {
              product: m.topProductLoss.product,
              q2Revenue: `$${Number(m.topProductLoss.q2Revenue).toLocaleString()}`,
              q3Revenue: `$${Number(m.topProductLoss.q3Revenue).toLocaleString()}`,
              deltaRevenue: `-$${Math.abs(Number(m.topProductLoss.deltaRevenue)).toLocaleString()}`,
              deltaPct: `${Number(m.topProductLoss.deltaPct).toFixed(1)}%`,
            }
          : null,
        topChannelGain: m.topChannelGain
          ? {
              channel: m.topChannelGain.channel,
              deltaRevenue: `+$${Number(m.topChannelGain.deltaRevenue).toLocaleString()}`,
            }
          : null,
        topChannelLoss: m.topChannelLoss
          ? {
              channel: m.topChannelLoss.channel,
              deltaRevenue: `-$${Math.abs(Number(m.topChannelLoss.deltaRevenue)).toLocaleString()}`,
            }
          : null,
      },
      allRegionsComparison: allRegions.map((r: any) => ({
        region: r.region,
        q2Revenue: `$${Number(r.q2Revenue).toLocaleString()}`,
        q3Revenue: `$${Number(r.q3Revenue).toLocaleString()}`,
        change: `${r.netChange >= 0 ? '+' : '-'}$${Math.abs(Number(r.netChange)).toLocaleString()} (${r.pctChange >= 0 ? '+' : ''}${Number(r.pctChange).toFixed(1)}%)`,
      })),
      companyTotal: {
        q2Revenue: `$${Number(overall.q2Revenue || 0).toLocaleString()}`,
        q3Revenue: `$${Number(overall.q3Revenue || 0).toLocaleString()}`,
        change: `${(overall.netChange || 0) >= 0 ? '+' : '-'}$${Math.abs(Number(overall.netChange || 0)).toLocaleString()} (${(overall.pctChange || 0) >= 0 ? '+' : ''}${Number(overall.pctChange || 0).toFixed(1)}%)`,
      },
    };

    const systemInstruction = `You are a high-level executive sales & financial intelligence analyst.
Your task is to write EXACTLY a three-sentence summary of which region changed the most from Q2 to Q3, and why.
Strict Rules:
1. EXACTLY THREE SENTENCES. No more, no fewer. Do not merge clauses with semicolons to cheat; provide three clean, grammatically complete sentences.
2. USE ONLY NUMBERS PROVIDED IN THE INPUT DATA. Every dollar figure, unit count, and percentage MUST match the numbers in the data payload. Never invent or hallucinate unprovided numbers.
3. Sentence 1: Explicitly state which region changed the most in revenue from Q2 to Q3, citing its Q2 revenue, Q3 revenue, and the exact dollar change and/or percentage change.
4. Sentence 2: Explain the primary driver of this shift by citing the unit volume change (units sold in Q2 vs Q3) and the top product contributor with its dollar delta.
5. Sentence 3: Explain the secondary drivers or context by citing the average discount rate change (percentage in Q2 vs Q3) and/or top sales channel delta.
6. Professional, crisp executive boardroom tone.`;

    const userPrompt = `Here is the verified calculated sales data:
${JSON.stringify(promptData, null, 2)}

Write the exact three-sentence executive summary explaining which region changed most from Q2 to Q3 and why, using only the calculated numbers above.`;

    // Attempt generation with retry for transient errors (e.g. 503 high demand)
    let response: any = null;
    let lastError: any = null;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: userPrompt,
          config: {
            systemInstruction,
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                sentence1: {
                  type: Type.STRING,
                  description: 'Sentence 1 identifying which region changed most with starting Q2 revenue, ending Q3 revenue, and dollar/percentage change.',
                },
                sentence2: {
                  type: Type.STRING,
                  description: 'Sentence 2 explaining primary drivers (unit volume and top product dollar shift) using only numbers provided.',
                },
                sentence3: {
                  type: Type.STRING,
                  description: 'Sentence 3 explaining secondary drivers (discount rate shift and/or channel shift) using only numbers provided.',
                },
                fullSummary: {
                  type: Type.STRING,
                  description: 'The complete three-sentence summary combining sentences 1, 2, and 3.',
                },
              },
              required: ['sentence1', 'sentence2', 'sentence3', 'fullSummary'],
            },
          },
        });
        if (response && response.text) break;
      } catch (err: any) {
        lastError = err;
        console.warn(`Gemini API attempt ${attempt} failed:`, err?.message || err);
        if (attempt < 3) {
          await new Promise((r) => setTimeout(r, attempt * 1000));
        }
      }
    }

    if (response && response.text) {
      const rawText = response.text;
      const parsedJson = JSON.parse(rawText.trim());
      const sentences = [
        parsedJson.sentence1.trim(),
        parsedJson.sentence2.trim(),
        parsedJson.sentence3.trim(),
      ];
      const fullSummary = parsedJson.fullSummary.trim() || sentences.join(' ');

      res.json({
        summary: fullSummary,
        sentences,
        mostChangedRegionName: m.region,
        calculatedMetricsUsed: payload,
        source: 'gemini-3.8-flash',
      });
      return;
    }

    // Graceful fallback to verified deterministic 3-sentence summary if Gemini API is temporarily busy
    console.warn('Falling back to deterministic 3-sentence summary due to Gemini service load:', lastError?.message);
    const growthSign = m.netChange >= 0 ? '+' : '-';
    const s1 = `${m.region} experienced the largest revenue change from Q2 to Q3, moving from $${Number(m.q2Revenue).toLocaleString()} to $${Number(m.q3Revenue).toLocaleString()}, a net shift of ${growthSign}$${Math.abs(Number(m.netChange)).toLocaleString()} (${m.pctChange >= 0 ? '+' : ''}${Number(m.pctChange).toFixed(1)}%).`;
    const unitsDir = m.netUnitsChange >= 0 ? 'rose' : 'declined';
    const s2 = m.topProductGain
      ? `This shift was primarily driven by total order volume that ${unitsDir} by ${m.netUnitsChange >= 0 ? '+' : '-'}${Math.abs(Number(m.netUnitsChange)).toLocaleString()} units (${Number(m.q2Units).toLocaleString()} in Q2 to ${Number(m.q3Units).toLocaleString()} in Q3), led by ${m.topProductGain.product} which added +$${Number(m.topProductGain.deltaRevenue).toLocaleString()}.`
      : `This shift was primarily driven by total order volume that ${unitsDir} by ${m.netUnitsChange >= 0 ? '+' : '-'}${Math.abs(Number(m.netUnitsChange)).toLocaleString()} units (${Number(m.q2Units).toLocaleString()} in Q2 to ${Number(m.q3Units).toLocaleString()} in Q3).`;
    const discDir = m.discountPointsChange >= 0 ? 'increased' : 'decreased';
    const s3 = m.topChannelGain
      ? `Additionally, average discount rates ${discDir} from ${Number(m.q2AvgDiscount).toFixed(1)}% to ${Number(m.q3AvgDiscount).toFixed(1)}%, while the ${m.topChannelGain.channel} sales channel contributed a revenue increase of +$${Number(m.topChannelGain.deltaRevenue).toLocaleString()}.`
      : `Additionally, average regional discount rates ${discDir} by ${Math.abs(Number(m.discountPointsChange)).toFixed(1)} percentage points, averaging ${Number(m.q3AvgDiscount).toFixed(1)}% in Q3 compared to ${Number(m.q2AvgDiscount).toFixed(1)}% in Q2.`;

    const deterministicSummary = `${s1} ${s2} ${s3}`;
    res.json({
      summary: deterministicSummary,
      sentences: [s1, s2, s3],
      mostChangedRegionName: m.region,
      calculatedMetricsUsed: payload,
      source: 'fallback-deterministic',
      notice: 'Gemini model experienced temporary high demand; generated from verified calculated figures.',
    });
  } catch (err: any) {
    console.error('Gemini API Error:', err);
    res.status(500).json({
      error: err?.message || 'Error generating AI summary',
      source: 'fallback-deterministic',
    });
  }
});

async function start() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`Server listening on port ${PORT}`);
  });
}

start();
