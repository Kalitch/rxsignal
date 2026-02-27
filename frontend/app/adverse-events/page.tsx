"use client";
import { useState } from "react";
import { AlertTriangle, Download } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid
} from "recharts";
import { SectionHeader, SearchInput, LoadingSpinner, EmptyState } from "@/components/ui";
import { fda } from "@/lib/api";

export default function AdverseEventsPage() {
  const [drug, setDrug] = useState("");
  const [results, setResults] = useState<any>(null);
  const [reactions, setReactions] = useState<any[]>([]);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function search() {
    if (!drug.trim()) return;
    setLoading(true);
    setError("");
    try {
      const [reactionData, timelineData]: any[] = await Promise.all([
        fda.adverseEvents({ drug, count: "patient.reaction.reactionmeddrapt.exact", limit: 15 }),
        fda.adverseEvents({ drug, count: "receivedate", limit: 50 }),
      ]);
      setReactions(reactionData.results?.slice(0, 15) ?? []);

      // Normalize timeline — group by year
      const byYear: Record<string, number> = {};
      for (const item of (timelineData.results ?? [])) {
        const year = String(item.time ?? item.term ?? "").slice(0, 4);
        if (year && year.match(/^\d{4}$/)) {
          byYear[year] = (byYear[year] || 0) + item.count;
        }
      }
      const tl = Object.entries(byYear)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([year, count]) => ({ year, count }));
      setTimeline(tl);
      setResults(reactionData);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <SectionHeader
        title="Adverse Events Explorer"
        subtitle="Search FAERS — FDA Adverse Event Reporting System"
      />

      <div className="card p-5">
        <SearchInput
          value={drug}
          onChange={setDrug}
          onSubmit={search}
          placeholder="Drug name, e.g. Ozempic, Aspirin, metformin…"
        />
      </div>

      {error && (
        <div className="card p-4 border-red-500/30 bg-red-500/5 text-red-400 text-sm">⚠ {error}</div>
      )}

      {loading && <LoadingSpinner text="Querying FAERS database…" />}

      {!loading && !results && (
        <EmptyState
          icon={AlertTriangle}
          title="Enter a drug name to begin"
          body="Search the FDA's adverse event reporting system for any approved drug."
        />
      )}

      {results && !loading && (
        <div className="space-y-6 fade-up">
          {/* Summary row */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "Total Reports",    value: results.meta?.results?.total?.toLocaleString() ?? "—" },
              { label: "Unique Reactions", value: reactions.length },
              { label: "Years of Data",    value: timeline.length > 0 ? `${timeline[0]?.year}–${timeline[timeline.length-1]?.year}` : "—" },
            ].map(({ label, value }) => (
              <div key={label} className="card p-4">
                <p className="text-xs text-[#94A3B8] uppercase tracking-wider">{label}</p>
                <p className="text-2xl font-bold text-[#1E293B] mt-1">{value}</p>
              </div>
            ))}
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top reactions */}
            <div className="card p-5">
              <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-4">
                Top Adverse Reactions
              </h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={reactions} layout="vertical">
                  <XAxis type="number" tick={{ fill: "#64748b", fontSize: 11 }} />
                  <YAxis type="category" dataKey="term" width={130}
                    tick={{ fill: "#94a3b8", fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 8 }}
                    labelStyle={{ color: "#1E293B" }}
                    itemStyle={{ color: "#3B9EDE" }}
                  />
                  <Bar dataKey="count" fill="#3B9EDE" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Timeline */}
            {timeline.length > 0 && (
              <div className="card p-5">
                <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-4">
                  Report Volume by Year
                </h3>
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={timeline}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                    <XAxis dataKey="year" tick={{ fill: "#94a3b8", fontSize: 11 }} />
                    <YAxis tick={{ fill: "#64748b", fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 8 }}
                      labelStyle={{ color: "#1E293B" }}
                      itemStyle={{ color: "#3B9EDE" }}
                    />
                    <Line type="monotone" dataKey="count" stroke="#3B9EDE"
                      strokeWidth={2} dot={false} activeDot={{ r: 4, fill: "#3B9EDE" }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Raw reactions table */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider">
                Reaction Terms (MedDRA)
              </h3>
              <button
                onClick={() => {
                  const csv = ["Reaction,Count", ...reactions.map(r => `${r.term},${r.count}`)].join("\n");
                  const blob = new Blob([csv], { type: "text/csv" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `${drug}-adverse-events.csv`;
                  a.click();
                }}
                className="flex items-center gap-1.5 text-xs text-fda-light hover:text-white
                  px-3 py-1.5 rounded-lg border border-fda-blue/20 hover:border-fda-blue/40
                  transition-colors"
              >
                <Download size={12} /> Export CSV
              </button>
            </div>
            <div className="space-y-1">
              {reactions.map((r: any, i: number) => (
                <div key={r.term}
                  className="flex items-center justify-between py-2 px-3 rounded-lg
                    hover:bg-[#F8FAFC] transition-colors border border-transparent hover:border-[#E2E8F0]">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono text-[#94A3B8] w-5">{i + 1}</span>
                    <span className="text-sm text-[#1E293B]">{r.term}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-24 h-1.5 rounded-full bg-[#E2E8F0] overflow-hidden">
                      <div className="h-full bg-primary rounded-full"
                        style={{ width: `${(r.count / reactions[0].count) * 100}%` }} />
                    </div>
                    <span className="text-xs font-mono text-primary w-14 text-right">
                      {r.count.toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
