import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";

export const metadata: Metadata = {
  title: "RxSignal | openFDA Intelligence Platform",
  description: "FDA drug safety analytics, adverse event monitoring, and pharmacovigilance intelligence.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="flex h-screen overflow-hidden">
        <Sidebar />
        <div className="flex flex-col flex-1 overflow-hidden">
          <Topbar />
          <main className="flex-1 overflow-y-auto bg-[#F8FAFC] p-6 text-[#1E293B]">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
