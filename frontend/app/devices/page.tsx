"use client";
import { useState } from "react";
import { Cpu } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { SectionHeader, SearchInput, LoadingSpinner, EmptyState } from "@/components/ui";
import { fda } from "@/lib/api";

export default function DevicesPage() {
  const [query, setQuery] = useState("");
  const [eventTypes, setEventTypes] = useState<any[]>([]);
  const [results, setResults] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  async function search() {
    if (!query.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const [countData, listData]: any[] = await Promise.all([
        fda.deviceEvents({ device: query, count: "event_type" }),
        fda.deviceEvents({ device: query, limit: 20 }),
      ]);
      setEventTypes(countData.results ?? []);
      setResults(listData.results ?? []);
      setTotal(listData.meta?.results?.total ?? 0);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  const COLORS = ["#F87171", "#FBBF24", "#4FC9A4", "#3B9EDE", "#10B981"];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <SectionHeader
        title="Device Safety"
        subtitle="MAUDE — FDA Medical Device Adverse Event Reporting System"
      />

      <div className="card p-5">
        <SearchInput
          value={query}
          onChange={setQuery}
          onSubmit={search}
          placeholder="Device brand or generic name, e.g. pacemaker, insulin pump…"
        />
      </div>

      {loading && <LoadingSpinner text="Querying MAUDE database…" />}
      {!loading && !searched && (
        <EmptyState icon={Cpu} title="Search device adverse events"
          body="Search the MAUDE database for reported medical device problems, malfunctions, and injuries." />
      )}

      {!loading && searched && (
        <div className="space-y-6 fade-up">
          <div className="grid grid-cols-2 gap-4">
            <div className="card p-4">
              <p className="text-xs text-[#94A3B8] uppercase tracking-wider">Total Reports</p>
              <p className="text-2xl font-bold text-[#1E293B] mt-1">{total.toLocaleString()}</p>
            </div>
            <div className="card p-4">
              <p className="text-xs text-[#94A3B8] uppercase tracking-wider">Event Categories</p>
              <p className="text-2xl font-bold text-[#1E293B] mt-1">{eventTypes.length}</p>
            </div>
          </div>

          {eventTypes.length > 0 && (
            <div className="card p-5">
              <h3 className="text-sm font-medium text-[#64748B] uppercase tracking-wider mb-4">
                Event Type Breakdown
              </h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={eventTypes}>
                  <XAxis dataKey="term" tick={{ fill: "#94a3b8", fontSize: 12 }} />
                  <YAxis tick={{ fill: "#64748b", fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 8 }}
                    labelStyle={{ color: "#1E293B" }}
                    itemStyle={{ color: "#3B9EDE" }}
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {eventTypes.map((_: any, i: number) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {results.length > 0 && (
            <div className="card p-5">
              <h3 className="text-sm font-medium text-[#64748B] uppercase tracking-wider mb-4">
                Recent Reports
              </h3>
              <div className="space-y-3">
                {results.map((event: any, i: number) => (
                  <div key={i} className="p-3 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0]">
                    <div className="flex items-center gap-2 mb-1">
                      {event.event_type && (
                        <span className={`text-xs px-2 py-0.5 rounded-full font-mono
                          ${event.event_type === "Death" ? "badge-class-i" :
                            event.event_type === "Injury" ? "badge-class-ii" : "badge-class-iii"}`}>
                          {event.event_type}
                        </span>
                      )}
                      <span className="text-xs text-[#94A3B8]">{event.date_received}</span>
                    </div>
                    <p className="text-xs text-[#1E293B]">
                      {event.device?.[0]?.brand_name || event.device?.[0]?.generic_name || "Unknown device"}
                    </p>
                    {event.mdr_text?.[0]?.text && (
                      <p className="text-xs text-[#64748B] mt-1 line-clamp-2">
                        {event.mdr_text[0].text}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
