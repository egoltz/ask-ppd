export const runtime = 'nodejs';

import Anthropic from '@anthropic-ai/sdk';
import { getDb } from '@/lib/db';
import { SCHEMA_DESCRIPTION } from '@/lib/schema';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const RUN_SQL_TOOL = {
  name: 'run_sql',
  description: 'Execute a SQLite SELECT query against the Portland Police Bureau database and return the results.',
  input_schema: {
    type: 'object',
    properties: {
      sql: {
        type: 'string',
        description: 'A valid SQLite SELECT statement. Must start with SELECT.',
      },
    },
    required: ['sql'],
  },
};

export async function POST(request) {
  const { question } = await request.json();
  if (!question?.trim()) {
    return Response.json({ error: 'No question provided' }, { status: 400 });
  }

  const messages = [{ role: 'user', content: question }];

  const system = `You are a Portland Police Bureau data analyst with access to a SQLite database.

${SCHEMA_DESCRIPTION}

When the user asks a question:
1. Call the run_sql tool with an appropriate SELECT query
2. After receiving results, write a clear 2–4 sentence answer citing specific numbers
3. Decide on the best chart type and return a JSON response

Return your final answer as a JSON object wrapped in <answer> tags:
<answer>
{
  "answer": "2–4 sentences citing specific numbers. Mention which dataset (crime reports or dispatch calls).",
  "chartType": "bar" | "line" | "none",
  "chartTitle": "Short descriptive title",
  "chartData": [{ "name": "label", "value": number }, ...] | null
}
</answer>

Chart rules:
- "bar" for category/neighborhood comparisons — sort DESC, max 12 items
- "line" for time trends — sort chronologically, use year as name
- "none" for single-number answers
- Display response times in minutes (divide seconds by 60), rounded to 1 decimal`;

  let sql = null;
  let queryError = null;

  try {
    // Agentic loop: Claude calls run_sql, we execute it, Claude writes the answer
    while (true) {
      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 1500,
        system,
        tools: [RUN_SQL_TOOL],
        messages,
      });

      // Append assistant turn
      messages.push({ role: 'assistant', content: response.content });

      if (response.stop_reason === 'end_turn') {
        // Claude is done — extract the <answer> JSON from the last text block
        const textBlock = response.content.find(b => b.type === 'text');
        const text = textBlock?.text ?? '';

        const match = text.match(/<answer>([\s\S]*?)<\/answer>/);
        let parsed;
        try {
          parsed = JSON.parse(match ? match[1].trim() : text.trim().replace(/```json|```/g, ''));
        } catch {
          parsed = { answer: text, chartType: 'none', chartData: null };
        }

        return Response.json({
          answer: parsed.answer,
          chartType: parsed.chartType || 'none',
          chartTitle: parsed.chartTitle || '',
          chartData: parsed.chartData || null,
          sql,
        });
      }

      if (response.stop_reason === 'tool_use') {
        const toolUseBlock = response.content.find(b => b.type === 'tool_use');
        if (!toolUseBlock) break;

        const querySql = toolUseBlock.input?.sql;

        // Safety check
        if (!querySql || !/^\s*SELECT/i.test(querySql)) {
          messages.push({
            role: 'user',
            content: [{
              type: 'tool_result',
              tool_use_id: toolUseBlock.id,
              content: 'Error: Only SELECT queries are allowed.',
              is_error: true,
            }],
          });
          continue;
        }

        sql = querySql;

        let toolResult;
        try {
          const rs = await getDb().execute(sql);
          const rows = rs.rows;
          if (!rows.length) {
            toolResult = 'Query returned no results. Try different filters or a broader query.';
          } else {
            toolResult = JSON.stringify(rows.slice(0, 100));
          }
        } catch (err) {
          console.error('SQL execution error:', err, '\nSQL:', sql);
          queryError = err.message;
          toolResult = `SQL error: ${err.message}`;
        }

        messages.push({
          role: 'user',
          content: [{
            type: 'tool_result',
            tool_use_id: toolUseBlock.id,
            content: toolResult,
          }],
        });
      } else {
        // Unexpected stop reason
        break;
      }
    }
  } catch (err) {
    console.error('API error:', err);
    return Response.json({
      answer: "I ran into an error processing your question. Please try again.",
      sql,
      chartType: 'none',
      chartData: null,
    });
  }

  return Response.json({
    answer: queryError
      ? `There was an error running that query: ${queryError}`
      : "I couldn't generate an answer for that question. Try rephrasing it.",
    sql,
    chartType: 'none',
    chartData: null,
  });
}
