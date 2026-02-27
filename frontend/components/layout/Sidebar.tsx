"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Pill, AlertTriangle, ShieldAlert,
  Cpu, Search, Bot, Activity, FlaskConical
} from "lucide-react";
import clsx from "clsx";

const NAV = [
  { href: "/",               icon: LayoutDashboard, label: "Dashboard"      },
  { href: "/adverse-events", icon: AlertTriangle,   label: "Adverse Events" },
  { href: "/drugs",          icon: Pill,            label: "Drugs"          },
  { href: "/recalls",        icon: ShieldAlert,     label: "Recalls"        },
  { href: "/devices",        icon: Cpu,             label: "Devices"        },
  { href: "/ndc",            icon: Search,          label: "NDC Lookup"     },
  { href: "/assistant",      icon: Bot,             label: "AI Assistant"   },
];

export default function Sidebar() {
  const path = usePathname();

  return (
    <aside className="w-60 flex-shrink-0 flex flex-col bg-white border-r border-[#E2E8F0] z-20">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-[#E2E8F0] bg-white">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#EFF6FF] flex items-center justify-center">
            <FlaskConical size={16} className="text-primary" />
          </div>
          <div>
            <div className="font-bold text-[#1E293B] text-lg leading-none">RxSignal</div>
            <div className="text-xs text-[#64748B] mt-0.5">openFDA Platform</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5">
        {NAV.map(({ href, icon: Icon, label }) => {
          const active = path === href || (href !== "/" && path.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150",
                active
                  ? "bg-[#EFF6FF] text-primary border-l-[3px] border-primary rounded-l-none"
                  : "text-[#64748B] hover:bg-[#F8FAFC]"
              )}
            >
              <Icon size={15} className={active ? "text-primary" : ""} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-[#E2E8F0]">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-secondary" />
          <span className="text-xs text-[#64748B]">openFDA Connected</span>
        </div>
      </div>
    </aside>
  );
}
