'use client';
import { useState } from 'react';

export default function MethodsDisclosure() {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-gray-200 bg-white">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-6 py-2.5 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-colors"
      >
        <span className="font-medium">Methods &amp; Limitations</span>
        <svg
          className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="px-6 pb-4 space-y-3 text-xs text-gray-600 border-t border-gray-100">
          <div className="pt-3">
            <p className="font-semibold text-gray-700 mb-1">Data sources</p>
            <p>Portland Police Bureau open data, accessed March 29, 2026. Includes crime reports (2015–2026) and 911 dispatch calls (2016–2026).</p>
          </div>
          <div>
            <p className="font-semibold text-gray-700 mb-1">How it works</p>
            <p>ASK-PPD uses a two-step pipeline powered by the Anthropic Claude API. When you submit a question, Claude translates it into a SQL query which is executed directly against a local SQLite database containing the raw PPB data. The query results are then passed back to Claude to generate a plain-English answer and chart. No statistics are generated from the model's training data, so every number in a response comes from a live database query. This architecture significantly reduces the risk of hallucinated statistics compared to asking an AI model a data question directly.</p>
          </div>
          <div>
            <p className="font-semibold text-gray-700 mb-1">Known limitations</p>
            <ul className="space-y-1 list-disc list-inside marker:text-gray-400">
              <li>Reflects reported incidents, not actual crime.</li>
              <li>Policing patterns affect what gets reported and where.</li>
              <li>No population density normalization. Areas with high foot traffic (downtown, transit hubs) may appear more dangerous than resident population figures suggest</li>
              <li>Geographic boundaries are police bureau districts, not neighborhoods.</li>
            </ul>
          </div>

          <div>
            <p className="font-semibold text-gray-700 mb-1">Query limitations</p>
            <p>Natural language to SQL has failure modes — complex or ambiguous questions may produce inaccurate queries. Results should be verified against source data for any consequential decisions.</p>
          </div>

          <div>
            <p className="font-semibold text-gray-700 mb-1">A note on use</p>
            <p>Good for exploratory research and generating questions. Not appropriate as a sole basis for decisions about housing, policing policy, or resource allocation without additional context.</p>
          </div>
        </div>
      )}
    </div>
  );
}
