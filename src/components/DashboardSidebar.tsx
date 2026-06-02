import { BarChart3, CircleHelp, FolderOpen, Layers, LogOut, Map, Plus, Settings } from "lucide-react";

type DashboardSidebarProps = {
  active?: "dashboard" | "projects" | "map";
  projectName?: string;
};

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: BarChart3, key: "dashboard" },
  { label: "Map Workspace", href: "/projects", icon: Map, key: "map" },
  { label: "Land Records", href: "/projects", icon: Layers, key: "projects" },
  { label: "Risk Reports", href: "/dashboard", icon: BarChart3, key: "reports" },
  { label: "Settings", href: "/dashboard", icon: Settings, key: "settings" },
];

export function DashboardSidebar({ active = "dashboard", projectName = "Project Alpha" }: DashboardSidebarProps) {
  return (
    <aside className="topographic-paper flex min-h-screen w-full flex-col border-r-2 border-earth-dark p-5 md:w-64">
      <a href="/dashboard" className="flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center border-2 border-earth-dark bg-moss-light shadow-[4px_4px_0_#1c1a14]">
          <Map size={22} />
        </span>
        <div>
          <p className="font-display text-2xl font-black leading-none">{projectName}</p>
          <p className="label-mono mt-2 text-earth-dark/70">Disaster Mitigation Unit</p>
        </div>
      </a>

      <nav className="mt-12 space-y-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = active === item.key;
          return (
            <a
              key={item.label}
              href={item.href}
              className={`flex items-center gap-3 border-2 px-4 py-3 text-xs font-bold uppercase tracking-[0.06em] ${
                isActive
                  ? "border-earth-dark bg-moss-light shadow-[3px_3px_0_#1c1a14]"
                  : "border-transparent text-earth-dark/75 hover:border-earth-dark"
              }`}
            >
              <Icon size={19} /> {item.label}
            </a>
          );
        })}
      </nav>

      <div className="mt-auto space-y-5 border-t-2 border-earth-dark pt-5">
        <a className="brutal-button w-full bg-earth-dark px-4 py-4 text-earth-light" href="/projects/create">
          <Plus size={17} /> New Analysis
        </a>
        <a className="flex items-center gap-3 text-xs font-bold uppercase tracking-[0.06em] text-earth-dark/70" href="#">
          <CircleHelp size={18} /> Help Center
        </a>
        <form action="/api/auth/logout" method="post">
          <button className="flex items-center gap-3 text-xs font-bold uppercase tracking-[0.06em] text-earth-dark/70" type="submit">
            <LogOut size={18} /> Log Out
          </button>
        </form>
      </div>
    </aside>
  );
}

export { FolderOpen };
