export const runtime = 'nodejs'; // REQUIRED — never use edge runtime with better-sqlite3

import Anthropic from '@anthropic-ai/sdk';
import { getDb } from '@/lib/db';
import { SCHEMA_DESCRIPTION } from '@/lib/schema';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(request) {
  const { question } = await request.json();
  if (!question?.trim()) {
    return Response.json({ error: 'No question provided' }, { status: 400 });
  }

  // CALL 1: Question → SQL
  let sql;
  try {
    const sqlResponse = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 500,
      system: `You are a SQLite expert. Generate a single valid SQLite SELECT query to answer the user's question about Portland Police Bureau public safety data.

${SCHEMA_DESCRIPTION}

Return ONLY the raw SQL query. No explanation, no markdown, no code fences.`,
      messages: [{ role: 'user', content: question }],
    });

    sql = sqlResponse.content[0].text.trim().replace(/```sql|```/g, '').trim();
    if (!/^\s*SELECT/i.test(sql)) throw new Error('Non-SELECT query generated');
  } catch (err) {
    console.error('SQL generation error:', err);
    return Response.json({
      answer: "I couldn't generate a valid query for that question. Try asking about a specific neighborhood, crime type, year, or response time.",
      sql: null,
      chartType: 'none',
      chartData: null,
    });
  }

  // Execute SQL
  let results;
  try {
    results = getDb().prepare(sql).all();
  } catch (err) {
    console.error('SQL execution error:', err, '\nSQL:', sql);
    return Response.json({
      answer: "I ran into an error executing that query. Try rephrasing your question.",
      sql,
      chartType: 'none',
      chartData: null,
    });
  }

  if (!results.length) {
    return Response.json({
      answer: "No data found for that query. Try a different neighborhood name, crime type, or date range. Crime data covers 2015–2026 and dispatch data covers 2016–2026.",
      sql,
      chartType: 'none',
      chartData: null,
    });
  }

  // CALL 2: Results → natural language answer + chart config
  const answerResponse = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1000,
    system: `You are a helpful Portland Police Bureau data assistant. Given a question and query results, write a clear answer for a general audience.

Return ONLY a valid JSON object with this shape:
{
  "answer": "2–4 sentences. Cite specific numbers. Mention which dataset was used (crime reports or dispatch calls). Note any data gaps if relevant.",
  "chartType": "bar" | "line" | "none",
  "chartTitle": "Short descriptive chart title",
  "chartData": [{ "name": "label", "value": number }, ...] | null
}

Chart rules:
- "bar" for category/neighborhood comparisons — sort DESC, max 12 items
- "line" for time trends — sort chronologically, use year or "Mon YYYY" as name
- "none" for single-number answers
- Always display response times in minutes (divide seconds by 60), rounded to 1 decimal
- Return valid JSON only. No markdown.`,
    messages: [{
      role: 'user',
      content: `Question: ${question}\nSQL used: ${sql}\nResults (first 50 rows): ${JSON.stringify(results.slice(0, 50))}`,
    }],
  });

  let parsed;
  try {
    parsed = JSON.parse(answerResponse.content[0].text.trim().replace(/```json|```/g, ''));
  } catch {
    parsed = { answer: answerResponse.content[0].text, chartType: 'none', chartData: null };
  }

  return Response.json({
    answer: parsed.answer,
    chartType: parsed.chartType || 'none',
    chartTitle: parsed.chartTitle || '',
    chartData: parsed.chartData || null,
    sql,
  });
}
