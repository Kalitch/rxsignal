"use client";
import { useState } from "react";
import { Search } from "lucide-react";
import { SectionHeader, SearchInput, LoadingSpinner, EmptyState } from "@/components/ui";
import { fda } from "@/lib/api";

export default function NDCPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  async function search() {
    if (!query.trim()) return;
    setLoading(true);
    setSearched(true);
    const isNDC = /^\d{4,5}-\d{3,4}-\d{1,2}$|^\d{9,11}$/.test(query.trim());
    try {
      const data: any = await fda.ndc(
        isNDC ? { ndc: query, limit: 10 } : { drug: query, limit: 20 }
      );
      setResults(data.results ?? []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <SectionHeader
        title="NDC Lookup"
        subtitle="Resolve any drug by NDC code or name from the FDA National Drug Code directory"
      />

      <div className="card p-5">
        <SearchInput
          value={query}
          onChange={setQuery}
          onSubmit={search}
          placeholder="Drug name or NDC code (e.g. 0069-0153-41)…"
        />
        <p className="text-xs text-[#64748B] mt-2">
          Accepts brand name, generic name, or 10/11-digit NDC format
        </p>
      </div>

      {loading && <LoadingSpinner text="Searching NDC directory…" />}
      {!loading && !searched && (
        <EmptyState icon={Search} title="Enter a drug name or NDC code"
          body="Returns product details, active ingredients, packaging, and labeler information." />
      )}
      {!loading && searched && results.length === 0 && (
        <EmptyState icon={Search} title="No products found" body="Try a different name or code." />
      )}

      {!loading && results.length > 0 && (
        <div className="space-y-4 fade-up">
          {results.map((drug: any, i: number) => (
            <div key={i} className="card p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-base font-medium text-[#1E293B]">
                    {drug.brand_name || drug.generic_name}
                  </h3>
                  {drug.brand_name && drug.generic_name && (
                    <p className="text-xs text-[#64748B] mt-0.5">Generic: {drug.generic_name}</p>
                  )}
                </div>
                <span className="font-mono text-xs text-primary bg-[#EFF6FF] px-2 py-1 rounded">
                  NDC: {drug.product_ndc}
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                {[
                  { label: "Dosage Form", value: drug.dosage_form },
                  { label: "Route", value: drug.route?.join(", ") },
                  { label: "Labeler", value: drug.labeler_name },
                  { label: "Status", value: drug.marketing_status },
                ].map(({ label, value }) => value ? (
                  <div key={label}>
                    <p className="text-[#94A3B8] uppercase tracking-wider mb-0.5">{label}</p>
                    <p className="text-[#1E293B]">{value}</p>
                  </div>
                ) : null)}
              </div>

              {drug.active_ingredients && (
                <div className="mt-3">
                  <p className="text-xs text-[#94A3B8] uppercase tracking-wider mb-2">Active Ingredients</p>
                  <div className="flex flex-wrap gap-1.5">
                    {drug.active_ingredients.map((ing: any, j: number) => (
                      <span key={j} className="text-xs px-2 py-1 rounded bg-[#EFF6FF]
                        text-primary border border-[#E2E8F0]">
                        {ing.name} — {ing.strength}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {drug.packaging && (
                <div className="mt-3">
                  <p className="text-xs text-[#94A3B8] uppercase tracking-wider mb-2">Packaging</p>
                  <div className="space-y-1">
                    {drug.packaging.slice(0, 3).map((pkg: any, j: number) => (
                      <p key={j} className="text-xs text-[#64748B]">{pkg.description}</p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
