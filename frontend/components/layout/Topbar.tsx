"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

export default function Topbar() {
  const [query, setQuery] = useState("");
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/drugs?q=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <header className="h-14 flex-shrink-0 flex items-center px-6 gap-4
      bg-white border-b border-[#E2E8F0] z-10">
      <form onSubmit={handleSearch} className="flex-1 max-w-xl">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search drugs, NDC codes, manufacturers…"
            className="w-full pl-9 pr-4 py-2 text-sm rounded-lg
              bg-[#F1F5F9] border border-[#E2E8F0]
              text-[#1E293B] placeholder:text-[#94A3B8]
              focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20
              transition-all"
          />
        </div>
      </form>

      <div className="ml-auto flex items-center gap-3">
        <span className="text-xs text-[#64748B] font-mono">
          {new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
        </span>
      </div>
    </header>
  );
}
