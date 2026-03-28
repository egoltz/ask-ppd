import './globals.css';

export const metadata = {
  title: 'ASK-PPD',
  description: 'Ask questions about Portland Police Bureau public safety data',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-gray-50 min-h-screen">{children}</body>
    </html>
  );
}
