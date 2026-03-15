import type { ReactNode } from "react";

import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { DashboardNav } from "@/components/dashboard/dashboard-nav";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen md:flex">
      <div className="anim-slide-right md:sticky md:top-0 md:h-screen">
        <DashboardNav />
      </div>
      <div className="relative flex-1">
        <div className="pointer-events-none absolute -right-20 top-8 h-72 w-72 rounded-full bg-sky-500/10 blur-3xl" />
        <DashboardHeader />
        <main className="page-shell p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
