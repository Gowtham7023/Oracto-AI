import { BarChart3, Bell, Database, LayoutDashboard, MessageSquareText, Route, Settings2, ShieldCheck, Sparkles, Waypoints, type LucideIcon } from "lucide-react";
import { NavLink, Outlet, useLocation } from "react-router-dom";

type NavigationItem = {
  name: string;
  path: string;
  icon: LucideIcon;
};

const navigationGroups: { label: string; items: NavigationItem[] }[] = [
  {
    label: "Overview",
    items: [{ name: "Dashboard", path: "/dashboard", icon: LayoutDashboard }],
  },
  {
    label: "Workspace",
    items: [
      { name: "Playground", path: "/playground", icon: MessageSquareText },
      { name: "Requests", path: "/requests", icon: Database },
      { name: "Models", path: "/models", icon: Waypoints },
    ],
  },
  {
    label: "Intelligence",
    items: [
      { name: "Routing", path: "/routing", icon: Route },
      { name: "Quality", path: "/quality", icon: ShieldCheck },
      { name: "Analytics", path: "/analytics", icon: BarChart3 },
    ],
  },
  {
    label: "System",
    items: [{ name: "Settings", path: "/settings", icon: Settings2 }],
  },
];

const pageMeta: Record<string, { title: string; subtitle: string }> = {
  "/dashboard": {
    title: "Dashboard",
    subtitle: "Monitor routing, cost efficiency, and model performance.",
  },
  "/playground": {
    title: "LLM Playground",
    subtitle: "Test Oracto's intelligent routing with real prompts.",
  },
  "/requests": {
    title: "Requests",
    subtitle: "Inspect request history and routing outcomes.",
  },
  "/models": {
    title: "Models",
    subtitle: "View configured LLM providers and capabilities.",
  },
  "/routing": {
    title: "Intelligent Routing",
    subtitle: "Understand how Oracto selects the best provider.",
  },
  "/quality": {
    title: "Quality Intelligence",
    subtitle: "Track verification quality and escalation outcomes.",
  },
  "/analytics": {
    title: "Analytics",
    subtitle: "Explore cost, routing, quality, and classifier performance.",
  },
  "/settings": {
    title: "Settings",
    subtitle: "Manage system configuration and platform preferences.",
  },
};

export function MainLayout() {
  const location = useLocation();
  const currentMeta = pageMeta[location.pathname] ?? {
    title: "Dashboard",
    subtitle: "AI Cost Autopilot",
  };

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] text-slate-900">
      <aside className="w-full max-w-[280px] border-r border-slate-200 bg-white">
        <div className="flex h-full flex-col p-5">
          <div className="mb-8 flex items-center gap-3 px-2">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600 shadow-sm ring-1 ring-indigo-100">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-semibold tracking-tight">ORACTO</p>
              <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
                AI Cost Autopilot
              </p>
            </div>
          </div>

          <nav className="space-y-6">
            {navigationGroups.map((group) => (
              <div key={group.label}>
                <p className="mb-2 px-3 text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400">
                  {group.label}
                </p>
                <div className="space-y-1.5">
                  {group.items.map(({ name, path, icon: Icon }) => (
                    <NavLink
                      key={path}
                      to={path}
                      className={({ isActive }) =>
                        `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                          isActive
                            ? "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-100"
                            : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                        }`
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <span
                            className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                              isActive
                                ? "bg-indigo-100 text-indigo-700"
                                : "bg-slate-100 text-slate-500"
                            }`}
                          >
                            <Icon className="h-4 w-4" />
                          </span>
                          <span>{name}</span>
                        </>
                      )}
                    </NavLink>
                  ))}
                </div>
              </div>
            ))}
          </nav>
        </div>
      </aside>

      <main className="flex-1 min-w-0">
        <header className="flex h-20 items-center justify-between border-b border-slate-200 bg-white/90 px-6 shadow-[0_1px_0_rgba(15,23,42,0.04)] backdrop-blur-sm lg:px-8">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-slate-400">
              Oracto Control Plane
            </p>
            <h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">
              {currentMeta.title}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-sm text-emerald-700">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              API Status
            </div>
            <button className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:border-slate-300 hover:text-slate-900">
              <Bell className="h-4 w-4" />
            </button>
          </div>
        </header>

        <div className="px-4 py-8 lg:px-8 max-w-7xl mx-auto w-full">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
