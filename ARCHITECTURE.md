# Application Architecture & Overview

## What the App Does

The Quarterly Sales Analytics & Executive AI Summary application is an enterprise-grade financial intelligence dashboard designed to turn raw transactional sales data into executive decision-making insights. Business leaders and financial analysts can upload sales order CSV files or explore built-in enterprise datasets to instantly view interactive revenue charts, quarterly trend tables, and key performance indicators across geographical regions. Crucially, the platform features a verifiable AI intelligence engine powered by Google Gemini 3.8 Flash that identifies which sales territory experienced the greatest performance shift from Q2 to Q3 and generates an audit-backed, exactly three-sentence executive briefing detailing the underlying unit volumes, discount variations, and product-level drivers. To guarantee complete boardroom trust and compliance, every figure cited by the AI is mathematically verified against the source dataset and can be inspected in real time via an interactive audit viewer.

---

## File Inventory & Descriptions

The following table details every file in the codebase and its specific role in the application architecture:

| File Path | Description & Business Purpose |
| :--- | :--- |
| `/.env.example` | Environment variable template documenting required configuration keys (such as `GEMINI_API_KEY` and `PORT`) without exposing sensitive secrets. |
| `/.gitignore` | Specifies files, temporary build directories, system logs, and local environment secrets that Git version control must exclude. |
| `/bun.lock` | Lockfile recording resolved dependency versions for consistency when using the Bun package manager. |
| `/index.html` | The HTML application entry point that defines webpage metadata, SEO configurations, social share previews, and mounts the React application root. |
| `/metadata.json` | Platform application manifest specifying the app's title, description, permissions, and server-side Gemini API enablement. |
| `/package.json` | Project configuration manifest defining project dependencies (React 19, Express, Tailwind CSS, Lucide icons, Google GenAI SDK), scripts, and dev tools. |
| `/server.ts` | Node.js Express backend server that serves the frontend, loads environment variables, and provides the secure `/api/ai/summarize` endpoint with Gemini AI integration and deterministic math fallback. |
| `/src/App.tsx` | Main application coordinator managing overall state (orders, calculated quarterly analytics, AI summaries, modal dialogues, and active tabs). |
| `/src/components/AiSummaryCard.tsx` | Executive summary presentation card displaying the verified 3-sentence performance commentary, model status badges, and audit inspection triggers. |
| `/src/components/AuditModal.tsx` | Transparency and governance modal allowing business users to inspect the exact mathematical metrics, payload, and prompt sent to the AI model. |
| `/src/components/FileUpload.tsx` | Drag-and-drop CSV upload zone that validates incoming sales files, reports syntax or data errors, and offers single-click sample data loading. |
| `/src/components/Header.tsx` | Top navigation bar displaying brand identity, currently active file name, order counters, sample dataset triggers, and manual AI recalculation buttons. |
| `/src/components/MetricCards.tsx` | High-level KPI dashboard displaying critical metrics such as company-wide revenue, order volumes, top regional performers, and net quarter-over-quarter shifts. |
| `/src/components/RawDataTable.tsx` | Granular transactional data grid allowing users to search, filter, and inspect individual order records parsed from the imported CSV file. |
| `/src/components/RevenueChart.tsx` | Interactive visualization component rendering multi-quarter sales performance comparisons and regional trends using dynamic visual charts. |
| `/src/components/RevenueTable.tsx` | Financial summary table breaking down revenue totals, quarter-over-quarter dollar variances, and percentage shifts by geographic territory. |
| `/src/index.css` | Global styling stylesheet containing Tailwind CSS directives, typography definitions, color themes, and custom animation keyframes. |
| `/src/main.tsx` | Client-side React bootstrap entry point that mounts the root application component into the Document Object Model (DOM). |
| `/src/types/sales.ts` | TypeScript domain models and interface contracts representing sales orders, regional metrics, quarterly comparisons, and AI payload structures. |
| `/src/utils/csvParser.ts` | Data parsing utility that reads, cleanses, and validates CSV text into structured order records, including fallback enterprise sample data generation. |
| `/src/utils/salesAnalytics.ts` | Mathematical calculation engine that aggregates revenues, calculates Q2-to-Q3 changes, identifies top product/channel drivers, and generates deterministic fallback summaries. |
| `/tsconfig.json` | TypeScript configuration specifying strict type safety rules, modern ECMAScript compilation targets, and path aliases. |
| `/vite.config.ts` | Vite build system configuration managing module bundling, React Fast Refresh, Tailwind CSS processing, and development server settings. |
