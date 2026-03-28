'use client';
import ChartDisplay from './ChartDisplay';

export default function MessageBubble({ role, answer, chartType, chartTitle, chartData, sql }) {
  if (role === 'user') {
    return (
      <div className="flex justify-end">
        <div className="bg-blue-600 text-white rounded-2xl rounded-br-sm px-4 py-2.5 max-w-[75%] text-sm">
          {answer}
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start">
      <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-sm px-4 py-3 max-w-[85%] shadow-sm">
        <p className="text-sm text-gray-800 leading-relaxed">{answer}</p>
        <ChartDisplay chartType={chartType} chartTitle={chartTitle} chartData={chartData} />
        {sql && (
          <details className="mt-3">
            <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-600 select-none">
              View SQL query
            </summary>
            <pre className="mt-2 text-xs bg-gray-50 rounded p-2 overflow-x-auto text-gray-600 whitespace-pre-wrap">
              {sql}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
}
