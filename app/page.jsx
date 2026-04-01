import ChatWindow from '@/components/ChatWindow';
import MethodsDisclosure from '@/components/MethodsDisclosure';

export default function Home() {
  return (
    <div className="flex flex-col h-screen max-w-3xl mx-auto">
      {/* Header */}
      <header className="px-6 py-4 border-b border-gray-200 bg-white">
        <h1 className="text-xl font-bold text-gray-900">ASK-PPD</h1>
        <p className="text-xs text-gray-500 mt-0.5">
          Ask questions about Portland Police Bureau public safety data
        </p>
      </header>

      {/* Methods disclosure */}
      <MethodsDisclosure />

      {/* Chat */}
      <div className="flex-1 overflow-hidden bg-gray-50">
        <ChatWindow />
      </div>

      {/* Footer */}
      <footer className="px-6 py-2 border-t border-gray-100 bg-white">
        <p className="text-xs text-gray-400 text-center">
          Data: Portland Police Bureau Open Data · portlandoregon.gov/police ·
          Crime reports: 2015–2026 · Dispatch calls: 2016–2026 ·
          Not affiliated with the City of Portland.
        </p>
      </footer>
    </div>
  );
}
