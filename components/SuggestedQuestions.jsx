'use client';
import { useState, useEffect } from 'react';

const ALL_QUESTIONS = [
  "How has average police response time for high priority calls changed year over year?",
  "What are the most common crime types in Portland?",
  "Which neighborhood had the most burglaries last year?",
  "How many shots fired calls were dispatched each year?",
  "What time of day do most assaults occur?",
  "How has motor vehicle theft trended since 2015?",
  "Which neighborhoods have the longest average police response times?",
  "Which neighborhoods have both high crime counts and slow response times?",
  "How has the number of welfare check calls changed over time?",
  "What percentage of dispatched calls are high priority?",
  "How did crime change during 2020 compared to 2019?",
  "Which council district has the most property crime?",
];

// Always show the same 4 on server; shuffle only after hydration
const DEFAULT_QUESTIONS = ALL_QUESTIONS.slice(0, 4);

export default function SuggestedQuestions({ onSelect }) {
  const [questions, setQuestions] = useState(DEFAULT_QUESTIONS);

  useEffect(() => {
    const shuffled = [...ALL_QUESTIONS].sort(() => Math.random() - 0.5);
    setQuestions(shuffled.slice(0, 4));
  }, []);

  return (
    <div className="flex flex-col gap-2 w-full max-w-xl mx-auto">
      <p className="text-xs text-gray-400 text-center mb-1">Try asking…</p>
      {questions.map((q) => (
        <button
          key={q}
          onClick={() => onSelect(q)}
          className="text-left text-sm bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-gray-600 hover:border-blue-400 hover:text-blue-700 hover:bg-blue-50 transition-colors shadow-sm"
        >
          {q}
        </button>
      ))}
    </div>
  );
}
