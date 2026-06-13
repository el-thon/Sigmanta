import { LogoutButton } from "@/components/LogoutButton";
import { BarChart3, FolderOpen, Layers, Map, Settings, User } from "lucide-react";

type DashboardSidebarProps = {
  active?: "dashboard" | "projects" | "map" | "records" | "reports" | "settings" | "help" | "profile";
  projectName?: string;
  userInstitution?: string | null;
  userRole?: "admin" | "user";
  userEmail?: string;
  avatarUrl?: string | null;
};

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: BarChart3, key: "dashboard" },
  { label: "Projects", href: "/projects", icon: FolderOpen, key: "projects" },
  { label: "Map Workspace", href: "/workspace", icon: Map, key: "map" },
  { label: "Land Records", href: "/land-records", icon: Layers, key: "records" },
  { label: "Risk Reports", href: "/risk-reports", icon: BarChart3, key: "reports" },
  { label: "Manage Users", href: "/settings", icon: Settings, key: "settings" },
];

export function DashboardSidebar({ active = "dashboard", projectName = "Project Alpha", userInstitution, userRole, userEmail, avatarUrl }: DashboardSidebarProps) {
  const userInitial = projectName.slice(0, 1).toUpperCase();
  const visibleNavItems = userRole === "admin" ? navItems : navItems.filter((item) => item.key !== "settings");

  return (
    <aside className="topographic-paper flex h-auto w-full shrink-0 flex-col overflow-y-auto border-b-2 border-earth-dark p-4 md:sticky md:top-0 md:h-screen md:min-h-screen md:w-64 md:border-b-0 md:border-r-2 md:p-5">
      <a href="/" className="flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center border-2 border-earth-dark bg-moss-light shadow-[4px_4px_0_#1c1a14]">
          <Map size={22} />
        </span>
        <div>
          <p className="font-display text-2xl font-black leading-none">{projectName}</p>
          <p className="label-mono mt-2 text-earth-dark/70">{userInstitution || (userRole === "admin" ? "Administrator" : "Disaster Mitigation Unit")}</p>
        </div>
      </a>

      <nav className="mt-12 space-y-3">
        {visibleNavItems.map((item) => {
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

      <div className="mt-auto space-y-4 border-t-2 border-earth-dark pt-5">
        <a className="flex items-center gap-3 border-2 border-earth-dark bg-earth-light p-3 shadow-[3px_3px_0_#1c1a14]" href="/profile">
          <span className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden border-2 border-earth-dark bg-moss-light font-display text-xl font-black">
            {avatarUrl ? <img src={avatarUrl} alt="" className="h-full w-full object-cover" /> : userInitial}
          </span>
          <span className="min-w-0">
            <span className="label-mono block text-earth-dark/55">Profile</span>
            <span className="block truncate text-sm font-bold">{projectName}</span>
            {userEmail ? <span className="mt-1 block truncate text-[11px] text-earth-dark/55">{userEmail}</span> : null}
          </span>
        </a>
        <a className="brutal-button w-full bg-earth-dark px-4 py-4 text-earth-light" href="/profile">
          <User size={17} /> Profile
        </a>
        <LogoutButton />
      </div>
    </aside>
  );
}

export { FolderOpen };
