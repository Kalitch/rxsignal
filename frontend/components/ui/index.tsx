import clsx from "clsx";
import { LucideIcon } from "lucide-react";

// ── KPI Card ─────────────────────────────────────────────────────────────────
interface KpiCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  color?: "blue" | "red" | "orange" | "green";
  delay?: number;
}

export function KpiCard({ label, value, icon: Icon, trend, color = "blue", delay = 0 }: KpiCardProps) {
  const colorMap = {
    blue:   "text-primary bg-[#EFF6FF]",
    red:    "text-danger bg-[#FEF2F2]",
    orange: "text-warning bg-[#FFFBEB]",
    green:  "text-secondary bg-[#F0FDF4]",
  };

  return (
    <div
      className="card card-hover p-5 fade-up"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[12px] text-[#94A3B8] uppercase tracking-wider mb-1">{label}</p>
          <p className="text-[28px] font-bold text-[#1E293B] leading-none mb-1">{value}</p>
          {trend && <p className="text-xs text-[#64748B] mb-3">{trend}</p>}
          <div className="text-sm text-primary hover:text-[#2D8AC8] cursor-pointer inline-flex items-center transition-colors">
            View data &rarr;
          </div>
        </div>
        <div className={clsx("w-10 h-10 rounded-lg flex items-center justify-center", colorMap[color])}>
          <Icon size={18} />
        </div>
      </div>
    </div>
  );
}

// ── Section Header ────────────────────────────────────────────────────────────
export function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-6">
      <h1 className="font-bold text-2xl text-[#1E293B]">{title}</h1>
      {subtitle && <p className="text-sm text-[#64748B] mt-1">{subtitle}</p>}
    </div>
  );
}

// ── Severity Badge ────────────────────────────────────────────────────────────
export function SeverityBadge({ cls }: { cls: string }) {
  const map: Record<string, string> = {
    "Class I":   "badge-class-i",
    "Class II":  "badge-class-ii",
    "Class III": "badge-class-iii",
  };
  return (
    <span className={clsx("text-xs px-2 py-0.5 rounded-full font-mono", map[cls] || "badge-active")}>
      {cls}
    </span>
  );
}

// ── Loading Spinner ───────────────────────────────────────────────────────────
export function LoadingSpinner({ text = "Loading…" }: { text?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-3">
      <div className="w-8 h-8 border-2 border-[#E2E8F0] border-t-primary rounded-full animate-spin" />
      <p className="text-sm text-[#64748B]">{text}</p>
    </div>
  );
}

// ── Empty State ───────────────────────────────────────────────────────────────
export function EmptyState({ icon: Icon, title, body }: { icon: LucideIcon; title: string; body?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
      <div className="w-12 h-12 rounded-xl bg-[#F1F5F9] border border-[#E2E8F0] flex items-center justify-center">
        <Icon size={22} className="text-[#64748B]" />
      </div>
      <p className="text-[#1E293B] font-medium">{title}</p>
      {body && <p className="text-sm text-[#64748B] max-w-xs">{body}</p>}
    </div>
  );
}

// ── Search Input ──────────────────────────────────────────────────────────────
interface SearchInputProps {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  placeholder?: string;
}
export function SearchInput({ value, onChange, onSubmit, placeholder = "Search…" }: SearchInputProps) {
  return (
    <div className="flex gap-2">
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        onKeyDown={e => e.key === "Enter" && onSubmit()}
        placeholder={placeholder}
        className="flex-1 px-4 py-2.5 text-sm rounded-lg
          bg-white border border-[#E2E8F0]
          text-[#1E293B] placeholder:text-[#94A3B8]
          focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20
          transition-all"
      />
      <button
        onClick={onSubmit}
        className="px-5 py-2.5 bg-primary hover:bg-[#2D8AC8] text-white text-sm
          rounded-lg transition-colors font-medium border border-transparent"
      >
        Search
      </button>
    </div>
  );
}

// ── Data Table ────────────────────────────────────────────────────────────────
interface Column<T> { key: string; label: string; render?: (row: T) => React.ReactNode }
interface DataTableProps<T> { columns: Column<T>[]; data: T[]; keyField: string }

export function DataTable<T extends Record<string, unknown>>({ columns, data, keyField }: DataTableProps<T>) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[#E2E8F0]">
            {columns.map(c => (
              <th key={c.key} className="text-left py-3 px-4 text-xs font-semibold text-[#64748B] uppercase tracking-wider">
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={String(row[keyField] ?? i)}
                className="border-b border-[#E2E8F0] hover:bg-[#F8FAFC] transition-colors">
              {columns.map(c => (
                <td key={c.key} className="py-3 px-4 text-[#1E293B]">
                  {c.render ? c.render(row) : String(row[c.key] ?? "—")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
