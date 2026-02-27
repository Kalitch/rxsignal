"use client";
import { useEffect, useState } from "react";
import { fda, ai } from "@/lib/api";
import { LoadingSpinner, SeverityBadge } from "@/components/ui";
import { ChevronDown, ChevronUp, Bot, Sparkles } from "lucide-react";

export default function DrugDetailPage({ params }: { params: { slug: string } }) {
  const drugName = decodeURIComponent(params.slug);
  const [label, setLabel] = useState<any>(null);
  const [approval, setApproval] = useState<any>(null);
  const [recalls, setRecalls] = useState<any[]>([]);
  const [summary, setSummary] = useState("");
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  useEffect(() => {
    Promise.all([
      fda.drugLabels({ drug: drugName, limit: 1 }),
      fda.drugsFDA({ drug: drugName, limit: 1 }),
      fda.recalls({ domain: "drug" }),
    ])
    .then(([labelData, approvalData, recallData]: any[]) => {
      setLabel(labelData.results?.[0] ?? null);
      setApproval(approvalData.results?.[0] ?? null);
      const allRecalls = Object.values(recallData.recalls ?? {}).flat() as any[];
      setRecalls(allRecalls.filter((r: any) =>
        r.product_description?.toLowerCase().includes(drugName.toLowerCase())
      ).slice(0, 3));
    })
    .finally(() => setLoading(false));
  }, [drugName]);

  async function loadSummary() {
    setSummaryLoading(true);
    try {
      const res: any = await ai.query(`Summarize adverse event safety profile for ${drugName}`);
      setSummary(res.summary ?? "");
    } catch (e) {
      setSummary("LM Studio is not running — start it and load a Mistral model to enable AI summaries.");
    } finally {
      setSummaryLoading(false);
    }
  }

  const toggle = (key: string) => setExpanded(p => ({ ...p, [key]: !p[key] }));

  const LABEL_SECTIONS = [
    { key: "indications_and_usage",          label: "Indications & Usage" },
    { key: "warnings",                        label: "Warnings" },
    { key: "boxed_warning",                   label: "⚠ Boxed Warning" },
    { key: "contraindications",               label: "Contraindications" },
    { key: "dosage_and_administration",       label: "Dosage & Administration" },
    { key: "adverse_reactions",               label: "Adverse Reactions" },
    { key: "drug_interactions",               label: "Drug Interactions" },
  ];

  if (loading) return <LoadingSpinner text={`Loading ${drugName} data…`} />;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="card p-6 fade-up">
        <h1 className="font-bold text-3xl text-[#1E293B] mb-1">{drugName}</h1>
        {label?.openfda?.generic_name?.[0] && (
          <p className="text-[#64748B] text-sm">
            Generic: {label.openfda.generic_name[0]}
          </p>
        )}
        {label?.openfda?.manufacturer_name?.[0] && (
          <p className="text-xs text-[#94A3B8] mt-1">
            {label.openfda.manufacturer_name[0]}
          </p>
        )}
        <div className="flex flex-wrap gap-2 mt-3">
          {label?.openfda?.route?.map((r: string) => (
            <span key={r} className="text-xs px-2 py-0.5 rounded-full bg-[#EFF6FF]
              text-primary border border-[#E2E8F0]">{r}</span>
          ))}
          {label?.openfda?.pharm_class_epc?.slice(0, 2).map((c: string) => (
            <span key={c} className="text-xs px-2 py-0.5 rounded-full bg-[#F1F5F9] text-[#64748B] border border-[#E2E8F0]">{c}</span>
          ))}
        </div>
      </div>

      {/* AI Summary */}
      <div className="card p-5 fade-up-1">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sparkles size={15} className="text-primary" />
            <h3 className="text-sm font-medium text-[#1E293B]">AI Safety Summary</h3>
          </div>
          {!summary && (
            <button onClick={loadSummary} disabled={summaryLoading}
              className="flex items-center gap-2 text-xs text-primary hover:text-[#2D8AC8]
                px-3 py-1.5 rounded-lg bg-[#EFF6FF] hover:bg-slate-50 border border-[#E2E8F0]
                transition-all disabled:opacity-50">
              <Bot size={12} />
              {summaryLoading ? "Generating…" : "Generate with Mistral"}
            </button>
          )}
        </div>
        {summaryLoading && <div className="text-sm text-[#94A3B8] animate-pulse">Mistral is analyzing…</div>}
        {summary && <p className="text-sm text-[#64748B] leading-relaxed">{summary}</p>}
        {!summary && !summaryLoading && (
          <p className="text-xs text-[#94A3B8]">Click to generate a plain-language safety summary using local Mistral inference.</p>
        )}
      </div>

      {/* Approval Info */}
      {approval && (
        <div className="card p-5 fade-up-2">
          <h3 className="text-sm font-medium text-[#64748B] uppercase tracking-wider mb-3">Regulatory History</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-[#94A3B8] text-xs">Application #</span>
              <p className="text-[#1E293B]">{approval.application_number}</p>
            </div>
            <div>
              <span className="text-[#94A3B8] text-xs">Sponsor</span>
              <p className="text-[#1E293B]">{approval.sponsor_name}</p>
            </div>
          </div>
        </div>
      )}

      {/* Active Recalls */}
      {recalls.length > 0 && (
        <div className="card p-5 border-danger/20 fade-up-2">
          <h3 className="text-sm font-medium text-danger uppercase tracking-wider mb-3">
            ⚠ Related Recalls
          </h3>
          <div className="space-y-2">
            {recalls.map((r: any, i: number) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-[#FEF2F2]">
                <SeverityBadge cls={r.classification} />
                <p className="text-xs text-[#64748B] truncate">{r.product_description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Label Accordion */}
      {label && (
        <div className="card p-5 fade-up-3">
          <h3 className="text-sm font-medium text-[#64748B] uppercase tracking-wider mb-4">
            FDA Label (SPL)
          </h3>
          <div className="space-y-1">
            {LABEL_SECTIONS.map(({ key, label: sectionLabel }) => {
              const content = (label as any)[key];
              if (!content?.[0]) return null;
              return (
                <div key={key} className="border border-[#E2E8F0] rounded-lg overflow-hidden">
                  <button
                    onClick={() => toggle(key)}
                    className="w-full flex items-center justify-between px-4 py-3
                      text-left text-sm text-[#1E293B] hover:bg-[#F8FAFC] transition-colors"
                  >
                    <span>{sectionLabel}</span>
                    {expanded[key] ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>
                  {expanded[key] && (
                    <div className="px-4 pb-4 pt-0 text-xs text-[#64748B] leading-relaxed border-t border-[#E2E8F0]">
                      {content[0]}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
