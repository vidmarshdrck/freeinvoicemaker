import { useEffect, useState } from "react";
import {
  FileText,
  LayoutTemplate,
  Menu,
  Network,
  Package,
  Settings,
  Users,
  X,
} from "lucide-react";
import { Toaster } from "sonner";
import { cn } from "@/lib/cn";
import { useStore, type ViewId } from "@/lib/invoice-store";
import { ThemeToggle } from "@/components/theme-toggle";
import { ApiView } from "@/components/api-view";
import { ClientsView } from "@/components/clients-view";
import { DocumentsView, DocumentActions } from "@/components/documents-view";
import { ItemsView } from "@/components/items-view";
import { SettingsView } from "@/components/settings-view";
import { TemplatesView } from "@/components/templates-view";

const NAV: { id: ViewId; label: string; icon: typeof FileText }[] = [
  { id: "documents", label: "Documents", icon: FileText },
  { id: "clients", label: "Clients", icon: Users },
  { id: "items", label: "Items", icon: Package },
  { id: "templates", label: "Templates", icon: LayoutTemplate },
  { id: "settings", label: "Settings", icon: Settings },
  { id: "api", label: "API", icon: Network },
];

export function AppShell() {
  const view = useStore((state) => state.view);
  const setView = useStore((state) => state.setView);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    void useStore.persist.rehydrate();
  }, []);

  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;
    const update = () => {
      // Mobile keyboards can shrink the visual viewport without resizing layout.
      // Do not treat pinch zoom as a keyboard.
      const inset = viewport.scale === 1
        ? Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop) : 0;
      document.documentElement.style.setProperty("--keyboard-inset", `${inset}px`);
    };
    update();
    viewport.addEventListener("resize", update);
    viewport.addEventListener("scroll", update);
    return () => {
      viewport.removeEventListener("resize", update);
      viewport.removeEventListener("scroll", update);
      document.documentElement.style.removeProperty("--keyboard-inset");
    };
  }, []);

  function openView(next: ViewId) {
    setView(next);
    setMenuOpen(false);
  }

  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 focus:rounded-lg focus:bg-primary focus:px-3 focus:py-2 focus:text-on-primary"
      >
        Skip to content
      </a>
      <div className="no-print flex h-dvh flex-col overflow-hidden bg-bg text-fg">
        <header className="relative z-30 flex h-16 shrink-0 items-center gap-3 border-b border-line bg-elevated px-3 md:px-5">
          <button
            type="button"
            className="inline-flex size-11 items-center justify-center rounded-lg text-fg hover:bg-surface-raised md:hidden"
            aria-label="Open menu"
            onClick={() => setMenuOpen(true)}
          >
            <Menu className="size-5" />
          </button>
          <div className="flex min-w-0 items-center gap-2">
            <span className="inline-flex size-9 items-center justify-center rounded-lg bg-primary/15 text-primary">
              <FileText className="size-4" />
            </span>
            <p className="truncate font-display text-base font-semibold">
              <span className="sm:hidden">FIM</span>
              <span className="hidden sm:inline">Free Invoice Maker</span>
            </p>
            <span className="hidden rounded-full border border-primary/40 px-2 py-0.5 text-xs font-semibold tracking-wide text-primary lg:inline">
              OPEN SOURCE
            </span>
          </div>
          <ThemeToggle />
          {view === "documents" ? <DocumentActions /> : null}
        </header>
        <div className="flex min-h-0 flex-1">
          <Sidebar view={view} onNavigate={openView} className="hidden md:flex" />
          <div id="main" className="flex min-h-0 min-w-0 flex-1">
            {view === "documents" ? <DocumentsView /> : null}
            {view === "clients" ? <ClientsView /> : null}
            {view === "items" ? <ItemsView /> : null}
            {view === "templates" ? <TemplatesView /> : null}
            {view === "settings" ? <SettingsView /> : null}
            {view === "api" ? <ApiView /> : null}
          </div>
        </div>
      </div>
      {menuOpen ? (
        <div className="no-print fixed inset-0 z-40 md:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-bg/80"
            aria-label="Close menu"
            onClick={() => setMenuOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 flex w-72 flex-col bg-elevated shadow-2xl">
            <div className="flex h-16 items-center justify-between px-3">
              <p className="font-display font-semibold">Menu</p>
              <button
                type="button"
                className="inline-flex size-11 items-center justify-center rounded-lg hover:bg-surface-raised"
                aria-label="Close menu"
                onClick={() => setMenuOpen(false)}
              >
                <X className="size-5" />
              </button>
            </div>
            <Sidebar view={view} onNavigate={openView} className="flex h-full min-h-0 w-full flex-1" />
          </div>
        </div>
      ) : null}
      <Toaster theme="system" position="bottom-center" />
    </>
  );
}

function Sidebar({
  view,
  onNavigate,
  className,
}: {
  view: ViewId;
  onNavigate: (view: ViewId) => void;
  className?: string;
}) {
  return (
    <aside className={cn("w-56 shrink-0 flex-col border-r border-line bg-elevated", className)}>
      <nav className="flex flex-1 flex-col gap-1 p-3" aria-label="Primary">
        {NAV.map((item) => {
          const Icon = item.icon;
          const active = view === item.id;
          return (
            <button
              key={item.id}
              type="button"
              aria-current={active ? "page" : undefined}
              onClick={() => onNavigate(item.id)}
              className={cn(
                "flex h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors",
                active
                  ? "bg-primary/15 text-fg"
                  : "text-muted hover:bg-surface hover:text-fg",
              )}
            >
              <Icon className={cn("size-4", active ? "text-primary" : "text-muted")} />
              {item.label}
            </button>
          );
        })}
      </nav>
      <div className="m-3 rounded-xl border border-line bg-surface p-3">
        <p className="text-sm font-medium">Saved on this device</p>
        <p className="mt-1 text-xs text-muted">No cloud sync</p>
      </div>
    </aside>
  );
}
