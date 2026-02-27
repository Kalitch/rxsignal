"use client";
import { useEffect, useState } from "react";
import { AlertTriangle, ShieldAlert, Pill, Cpu } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { KpiCard, SectionHeader, LoadingSpinner } from "@/components/ui";
import { fda } from "@/lib/api";

export default function DashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fda.dashboard()
      .then(setStats)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner text="Loading FDA data…" />;

  const ae = stats?.adverse_events ?? {};
  const topDrugs = (stats?.top_drugs ?? []).slice(0, 8);
  const recalls = stats?.drug_recalls ?? [];
  const deviceTypes = stats?.device_event_types ?? [];

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <SectionHeader
        title="Platform Dashboard"
        subtitle="Real-time FDA regulatory intelligence across drugs, devices, and food"
      />

      {error && (
        <div className="card p-4 border-red-500/30 bg-red-500/5 text-red-400 text-sm">
          ⚠ {error} — Make sure the Django backend is running on port 8000.
        </div>
      )}

      {/* KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Total AE Reports"
          value={ae.total ? ae.total.toLocaleString() : "—"}
          icon={AlertTriangle}
          trend="All-time FAERS database"
          color="orange"
          delay={0}
        />
        <KpiCard
          label="Serious Reports"
          value={ae.serious ? ae.serious.toLocaleString() : "—"}
          icon={AlertTriangle}
          trend="Classified as serious"
          color="red"
          delay={100}
        />
        <KpiCard
          label="Drug Recall Classes"
          value={recalls.length > 0 ? recalls.reduce((a: number, r: any) => a + r.count, 0).toLocaleString() : "—"}
          icon={ShieldAlert}
          trend="Active & historical"
          color="orange"
          delay={200}
        />
        <KpiCard
          label="Device Event Types"
          value={deviceTypes.length}
          icon={Cpu}
          trend="MAUDE categories"
          color="blue"
          delay={300}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Top Drugs by AE Reports */}
        <div className="card p-5 fade-up-2">
          <h2 className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-4">
            Top Drugs by Adverse Event Volume
          </h2>
          {topDrugs.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={topDrugs} layout="vertical" margin={{ left: 10 }}>
                <XAxis type="number" tick={{ fill: "#64748b", fontSize: 11 }} />
                <YAxis type="category" dataKey="term" width={110}
                  tick={{ fill: "#94a3b8", fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 8 }}
                  labelStyle={{ color: "#1E293B" }}
                  itemStyle={{ color: "#3B9EDE" }}
                />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                  {topDrugs.map((_: any, i: number) => (
                    <Cell key={i} fill={`rgba(59,158,222,${0.9 - i * 0.08})`} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-slate-600 text-sm py-10 text-center">No data — check backend connection</p>
          )}
        </div>

        {/* Recall Classification Breakdown */}
        <div className="card p-5 fade-up-3">
          <h2 className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-4">
            Drug Recall Classification Breakdown
          </h2>
          {recalls.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={recalls}>
                <XAxis dataKey="term" tick={{ fill: "#94a3b8", fontSize: 12 }} />
                <YAxis tick={{ fill: "#64748b", fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 8 }}
                  labelStyle={{ color: "#1E293B" }}
                  itemStyle={{ color: "#3B9EDE" }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {recalls.map((r: any, i: number) => {
                    const colors = ["#F87171", "#FBBF24", "#4FC9A4"];
                    return <Cell key={i} fill={colors[i] || "#3B9EDE"} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-slate-600 text-sm py-10 text-center">No data — check backend connection</p>
          )}
        </div>
      </div>

      {/* Device Event Types */}
      {deviceTypes.length > 0 && (
        <div className="card p-5 fade-up-4">
          <h2 className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-4">
            Device Adverse Event Types (MAUDE)
          </h2>
          <div className="flex flex-wrap gap-3">
            {deviceTypes.map((d: any) => (
              <div key={d.term} className="flex items-center gap-2 px-3 py-1.5
                bg-[#F1F5F9] border border-[#E2E8F0] rounded-full">
                <span className="text-sm text-[#64748B]">{d.term}</span>
                <span className="text-xs font-mono text-primary">{d.count.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Links */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 fade-up-4">
        {[
          { href: "/adverse-events", label: "Explore AE Reports", icon: "⚠" },
          { href: "/recalls",        label: "Monitor Recalls",    icon: "🚨" },
          { href: "/drugs",          label: "Drug Intelligence",  icon: "💊" },
          { href: "/assistant",      label: "Ask AI Assistant",   icon: "🤖" },
        ].map(({ href, label, icon }) => (
          <a key={href} href={href}
            className="card card-hover p-4 text-center cursor-pointer group">
            <div className="text-2xl mb-2">{icon}</div>
            <div className="text-sm text-[#64748B] group-hover:text-primary transition-colors">
              {label}
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
