'use client';
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

export default function ChartDisplay({ chartType, chartTitle, chartData }) {
  if (!chartData || chartType === 'none') return null;
  return (
    <div className="mt-4">
      {chartTitle && (
        <p className="font-semibold text-sm text-gray-700 mb-2">{chartTitle}</p>
      )}
      <ResponsiveContainer width="100%" height={320}>
        {chartType === 'line' ? (
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Line type="monotone" dataKey="value" stroke="#1d4ed8" strokeWidth={2} dot />
          </LineChart>
        ) : (
          <BarChart data={chartData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" tick={{ fontSize: 12 }} />
            <YAxis dataKey="name" type="category" width={180} tick={{ fontSize: 11 }} />
            <Tooltip />
            <Bar dataKey="value" fill="#1d4ed8" radius={[0, 4, 4, 0]} />
          </BarChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}
