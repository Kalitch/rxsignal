"use client";
import { useState, useEffect } from "react";
import { ShieldAlert, RefreshCw, ChevronDown, ChevronUp } from "lucide-react";
import { SectionHeader, LoadingSpinner, SeverityBadge, EmptyState } from "@/components/ui";
import { fda } from "@/lib/api";

const DOMAINS = ["all", "drug", "device", "food"] as const;

export default function RecallsPage() {
  const [domain, setDomain] = useState<typeof DOMAINS[number]>("all");
  const [recallClass, setRecallClass] = useState("");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});

  const toggle = (i: number) => setExpanded(p => ({ ...p, [i]: !p[i] }));

  async function load() {
    setLoading(true);
    try {
      const res: any = await fda.recalls({ domain, recall_class: recallClass, limit: 25 });
      setData(res.recalls);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [domain, recallClass]);

  const allRecalls = data
    ? Object.entries(data).flatMap(([domain, items]: any) =>
        (items as any[]).map(r => ({ ...r, _domain: domain }))
      )
    : [];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <SectionHeader
          title="Recall Monitor"
          subtitle="Unified FDA recall enforcement reports across drugs, devices, and food"
        />
        <button onClick={load}
          className="flex items-center gap-2 text-sm text-[#64748B] hover:text-[#1E293B]
            px-3 py-2 rounded-lg border border-[#E2E8F0] hover:bg-[#F8FAFC] transition-all">
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="card p-4 flex flex-wrap gap-4">
        {/* Domain tabs */}
        <div className="flex gap-1 bg-[#F1F5F9] rounded-lg p-1">
          {DOMAINS.map(d => (
            <button key={d}
              onClick={() => setDomain(d)}
              className={`px-4 py-1.5 rounded-md text-sm capitalize transition-all ${
                domain === d
                  ? "bg-white shadow-sm text-primary font-medium"
                  : "text-[#64748B] hover:text-[#1E293B]"
              }`}
            >
              {d}
            </button>
          ))}
        </div>

        {/* Class filter */}
        <div className="flex gap-1 bg-[#F1F5F9] rounded-lg p-1">
          {["", "I", "II", "III"].map(cls => (
            <button key={cls}
              onClick={() => setRecallClass(cls)}
              className={`px-3 py-1.5 rounded-md text-sm transition-all ${
                recallClass === cls
                  ? "bg-white shadow-sm text-[#1E293B] font-medium"
                  : "text-[#64748B] hover:text-[#1E293B]"
              }`}
            >
              {cls || "All Classes"}
            </button>
          ))}
        </div>
      </div>

      {loading && <LoadingSpinner text="Fetching recall data…" />}

      {!loading && allRecalls.length === 0 && (
        <EmptyState icon={ShieldAlert} title="No recalls found" body="Try adjusting filters or refreshing." />
      )}

      {!loading && allRecalls.length > 0 && (
        <div className="space-y-3 fade-up">
          {allRecalls.map((recall: any, i: number) => {
            const isExpanded = expanded[i];
            return (
              <div key={i} className="card card-hover p-5 cursor-pointer" onClick={() => toggle(i)}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <SeverityBadge cls={recall.classification || "Unknown"} />
                      <span className="text-xs text-[#94A3B8] capitalize font-mono">
                        {recall._domain}
                      </span>
                      {recall.status && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-[#F1F5F9] text-[#64748B]">
                          {recall.status}
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-medium text-[#1E293B] line-clamp-2">
                      {recall.product_description ?? recall.product_short_reason ?? "No description"}
                    </p>
                    <p className="text-xs text-[#94A3B8] mt-1">
                      {recall.recalling_firm} • {recall.recall_initiation_date ?? recall.event_date_terminated ?? ""}
                    </p>
                  </div>
                  <div className="text-[#94A3B8] mt-1 shrink-0 p-1">
                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </div>
                </div>

                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-[#E2E8F0] space-y-3 cursor-text" onClick={e => e.stopPropagation()}>
                    {recall.reason_for_recall && (
                      <div>
                        <p className="text-xs text-[#94A3B8] uppercase tracking-wider mb-1">Reason for Recall</p>
                        <p className="text-sm text-[#1E293B]">{recall.reason_for_recall}</p>
                      </div>
                    )}
                    {recall.product_description && (
                      <div>
                        <p className="text-xs text-[#94A3B8] uppercase tracking-wider mb-1">Full Description</p>
                        <p className="text-sm text-[#64748B]">{recall.product_description}</p>
                      </div>
                    )}
                    {recall.code_info && (
                      <div>
                        <p className="text-xs text-[#94A3B8] uppercase tracking-wider mb-1">Code Info</p>
                        <p className="text-sm text-[#64748B]">{recall.code_info}</p>
                      </div>
                    )}
                    {recall.distribution_pattern && (
                      <div>
                        <p className="text-xs text-[#94A3B8] uppercase tracking-wider mb-1">Distribution</p>
                        <p className="text-sm text-[#64748B]">{recall.distribution_pattern}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
