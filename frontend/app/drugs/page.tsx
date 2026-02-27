"use client";
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Pill, ExternalLink } from "lucide-react";
import { SectionHeader, SearchInput, LoadingSpinner, EmptyState } from "@/components/ui";
import { fda } from "@/lib/api";

export default function DrugsPage() {
  const searchParams = useSearchParams();
  const initialQ = searchParams.get("q") || "";
  const [query, setQuery] = useState(initialQ);
  const [results, setResults] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    if (initialQ) search(initialQ);
  }, []);

  async function search(q?: string) {
    const term = q ?? query;
    if (!term.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const data: any = await fda.ndc({ drug: term, limit: 20 });
      setResults(data.results ?? []);
      setTotal(data.meta?.results?.total ?? 0);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <SectionHeader
        title="Drug Intelligence"
        subtitle="Search FDA-registered drugs via NDC directory and label database"
      />

      <div className="card p-5">
        <SearchInput
          value={query}
          onChange={setQuery}
          onSubmit={() => search()}
          placeholder="Brand name, generic name, or NDC code…"
        />
      </div>

      {loading && <LoadingSpinner text="Searching NDC directory…" />}

      {!loading && !searched && (
        <EmptyState icon={Pill} title="Search the drug database"
          body="Find any FDA-registered drug by brand name, generic name, or NDC code." />
      )}

      {!loading && searched && results.length === 0 && (
        <EmptyState icon={Pill} title="No drugs found"
          body="Try a different name or check spelling." />
      )}

      {!loading && results.length > 0 && (
        <div className="fade-up space-y-3">
          <p className="text-xs text-[#64748B]">
            {total.toLocaleString()} results found
          </p>
          {results.map((drug: any, i: number) => (
            <div key={i} className="card card-hover p-5 cursor-pointer"
              onClick={() => window.location.href = `/drugs/${encodeURIComponent(drug.brand_name || drug.generic_name)}`}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-medium text-[#1E293B]">
                      {drug.brand_name || drug.generic_name}
                    </h3>
                    {drug.marketing_status && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-[#F0FDF4]
                        text-secondary border border-[#F0FDF4]">
                        {drug.marketing_status}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#64748B]">
                    {drug.generic_name && drug.brand_name && `Generic: ${drug.generic_name} • `}
                    {drug.dosage_form} • {drug.route?.join(", ")}
                  </p>
                  <p className="text-xs text-[#94A3B8] mt-1">
                    {drug.labeler_name} • NDC: {drug.product_ndc}
                  </p>
                </div>
                <ExternalLink size={14} className="text-[#94A3B8] mt-0.5" />
              </div>

              {drug.active_ingredients && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {drug.active_ingredients.slice(0, 4).map((ing: any, j: number) => (
                    <span key={j}
                      className="text-xs px-2 py-0.5 rounded-full bg-[#EFF6FF]
                        text-primary border border-[#E2E8F0]">
                      {ing.name} {ing.strength}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
