import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "2026 하나가족수양회 신청",
  description: "수원하나교회 2026 하나가족수양회 온라인 신청",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>
        <div className="min-h-screen flex flex-col">
          {/* 헤더 */}
          <header className="bg-white border-b border-slate-100 sticky top-0 z-10">
            <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
              <div className="flex flex-col">
                <span className="text-[11px] font-medium text-blue-600 tracking-wider uppercase">
                  수원하나교회
                </span>
                <span className="text-base font-bold text-slate-800 leading-tight">
                  2026 하나가족수양회
                </span>
              </div>
            </div>
          </header>

          {/* 컨텐츠 */}
          <main className="flex-1 max-w-lg mx-auto w-full px-4 py-6">
            {children}
          </main>

          {/* 푸터 */}
          <footer className="max-w-lg mx-auto w-full px-4 py-6 text-center text-xs text-slate-400">
            <p>7월 25일(토) ~ 26일(일)</p>
          </footer>
        </div>
      </body>
    </html>
  );
}
