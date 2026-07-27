import type { Metadata } from 'next';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import './globals.css';

export const metadata: Metadata = {
  title: 'Research Vault - Knowledge Hub',
  description: 'Organize and manage your research with AI-powered insights',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-slate-900 text-white m-0 p-0">
        <div className="flex h-screen">
          <Sidebar />
          <div className="flex-1 flex flex-col">
            <Header />
            <main className="flex-1 overflow-auto bg-slate-900">
              {children}
            </main>
          </div>
        </div>
      </body>
    </html>
  );
}
