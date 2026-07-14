import { useState, useEffect, useRef } from "react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, CartesianGrid,
} from "recharts";
import {
  Monitor, Printer, Users, Key, Mail, Wifi, ShieldCheck,
  LayoutDashboard, BookOpen, Activity, ChevronLeft, ChevronRight,
  RefreshCw, AlertTriangle, ArrowUpRight, ArrowDownRight, Menu,
  Settings, ClipboardList, Server, Bell, Search, LogOut,
  ChevronDown, TrendingUp,
} from "lucide-react";

/* ─── Design tokens (Modernize-style) ─────────────────────────────── */
const T = {
  primary:      "#5d87ff",
  primaryLight: "#ecf2ff",
  secondary:    "#44b7f7",
  success:      "#13deb9",
  successLight: "#e6fbf8",
  warning:      "#ffae1f",
  warningLight: "#fff8e6",
  danger:       "#fa896b",
  dangerLight:  "#fff0eb",
  info:         "#539bff",
  infoLight:    "#eef6ff",
  bg:           "#f0f4fc",
  card:         "#ffffff",
  text:         "#2a3547",
  textSec:      "#7c8fac",
  textMuted:    "#adb5c5",
  border:       "#e5eaf2",
  sidebarBg:    "#ffffff",
  sidebarW:     270,
  sidebarColl:  80,
  headerH:      70,
  cardRadius:   7,
  cardShadow:   "rgba(145,158,171,0.12) 0px 2px 16px",
  cardShadowHov:"rgba(145,158,171,0.22) 0px 6px 24px",
};

/* ─── Data ────────────────────────────────────────────────────────── */
const summaryCards = [
  { label: "Equipos",       value: 847,  trend: +12, icon: Monitor,     color: T.primary,   bg: T.primaryLight },
  { label: "Usuarios Red",  value: 412,  trend: -3,  icon: Users,       color: T.success,   bg: T.successLight },
  { label: "Licencias",     value: 214,  trend: +6,  icon: Key,         color: T.warning,   bg: T.warningLight },
  { label: "Impresoras",    value: 93,   trend: 0,   icon: Printer,     color: T.secondary, bg: "#eef9ff" },
  { label: "Correos",       value: 389,  trend: +4,  icon: Mail,        color: T.info,      bg: T.infoLight },
  { label: "Credenciales VPN", value: 156, trend: -4, icon: ShieldCheck, color: T.danger,   bg: T.dangerLight },
  { label: "Redes WiFi",    value: 28,   trend: +1,  icon: Wifi,        color: "#8754ec",   bg: "#f3edff" },
];

const revenueData = [
  { mes: "Ene", equipos: 62, usuarios: 38 },
  { mes: "Feb", equipos: 71, usuarios: 42 },
  { mes: "Mar", equipos: 55, usuarios: 36 },
  { mes: "Abr", equipos: 80, usuarios: 51 },
  { mes: "May", equipos: 74, usuarios: 46 },
  { mes: "Jun", equipos: 90, usuarios: 58 },
  { mes: "Jul", equipos: 84, usuarios: 53 },
];

const ubicacionData = [
  { name: "Central",    v: 198 },
  { name: "La Platina", v: 87 },
  { name: "Carillanca", v: 61 },
  { name: "Remehue",    v: 38 },
  { name: "Quilamapu",  v: 28 },
];

const licenciasData = [
  { name: "Microsoft 365", value: 89,  color: T.primary   },
  { name: "ArcGIS",        value: 41,  color: T.success    },
  { name: "AutoCAD",       value: 34,  color: T.warning    },
  { name: "Adobe CC",      value: 28,  color: "#8754ec"   },
  { name: "Otros",         value: 22,  color: T.textMuted  },
];
const totalLic = licenciasData.reduce((a, d) => a + d.value, 0);

const priorityItems = [
  { label: "Licencias por vencer",       value: 31, detail: "Próximos 30 días",           state: "warning" },
  { label: "Credenciales VPN expiradas", value: 4,  detail: "Acción inmediata requerida", state: "danger"  },
  { label: "Impresoras sin conductor",   value: 6,  detail: "Driver no cargado",           state: "warning" },
  { label: "Correos sin acceso activo",  value: 11, detail: "Revisar estado GW",           state: "danger"  },
  { label: "Usuarios inactivos +30d",    value: 18, detail: "Active Directory",            state: "warning" },
];

const recentActivity = [
  { action: "Equipo registrado",       detail: "LAPTOP-0394 · Sede Central",  time: "12 min", type: "primary" },
  { action: "VPN credencial expirada", detail: "jperez@inia.cl",              time: "43 min", type: "danger"  },
  { action: "Licencia renovada",       detail: "AutoCAD 2024 · Carillanca",   time: "1 h",    type: "success" },
  { action: "Usuario inactivado",      detail: "mrodriguez@inia.cl",          time: "2 h",    type: "warning" },
  { action: "Impresora actualizada",   detail: "HP LaserJet · Piso 3",        time: "3 h",    type: "secondary"},
];

const navItems = [
  { label: "Panel de Control",         icon: LayoutDashboard, active: true  },
  { label: "Equipos",                  icon: Monitor                        },
  { label: "Impresoras",               icon: Printer                        },
  { label: "Usuarios de Red (AD)",     icon: Users                          },
  { label: "Correos Institucionales",  icon: Mail                           },
  { label: "Licencias",                icon: Key                            },
  { label: "Credenciales VPN",         icon: ShieldCheck                    },
  { label: "Redes WiFi",               icon: Wifi                           },
  { sep: true                                                                },
  { label: "Auditoría",                icon: ClipboardList                  },
  { label: "Herramientas",             icon: Server                         },
  { label: "Catálogos",                icon: BookOpen                       },
  { sep: true                                                                },
  { label: "Configuración",            icon: Settings                       },
];

const stateColor: Record<string, string> = {
  primary:   T.primary,
  success:   T.success,
  warning:   T.warning,
  danger:    T.danger,
  secondary: T.secondary,
};
const stateBg: Record<string, string> = {
  primary:   T.primaryLight,
  success:   T.successLight,
  warning:   T.warningLight,
  danger:    T.dangerLight,
  secondary: "#eef9ff",
};

/* ─── Helpers ────────────────────────────────────────────────────── */
const fmt = (n: number) => n.toLocaleString("es-CL");

/* ─── Custom recharts tooltip ────────────────────────────────────── */
const CTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: T.card, border: `1px solid ${T.border}`,
      borderRadius: 8, padding: "10px 14px",
      boxShadow: T.cardShadow, fontSize: 12, fontFamily: "DM Sans, sans-serif",
    }}>
      {label && <div style={{ color: T.textSec, marginBottom: 6, fontWeight: 600 }}>{label}</div>}
      {payload.map((p: any, i: number) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: p.color || T.primary, flexShrink: 0 }} />
          <span style={{ color: T.textSec }}>{p.name ? `${p.name}: ` : ""}</span>
          <span style={{ fontWeight: 700, color: T.text }}>{p.value}</span>
        </div>
      ))}
    </div>
  );
};

/* ─── Sidebar ─────────────────────────────────────────────────────── */
function Sidebar({ collapsed, onToggle, mobile, onClose }: {
  collapsed: boolean; onToggle: () => void; mobile?: boolean; onClose?: () => void;
}) {
  const w = mobile ? T.sidebarW : (collapsed ? T.sidebarColl : T.sidebarW);
  return (
    <aside style={{
      width: w, flexShrink: 0, height: "100%",
      background: T.sidebarBg,
      borderRight: `1px solid ${T.border}`,
      display: "flex", flexDirection: "column",
      transition: "width 0.25s cubic-bezier(0.4,0,0.2,1)",
      overflow: "hidden",
      position: mobile ? "fixed" : "relative",
      top: 0, left: 0, zIndex: mobile ? 400 : undefined,
      boxShadow: mobile ? "4px 0 32px rgba(0,0,0,0.10)" : undefined,
    }}>
      {/* Brand */}
      <div style={{
        height: T.headerH, display: "flex", alignItems: "center",
        padding: collapsed && !mobile ? "0 0 0 22px" : "0 20px",
        gap: 12, borderBottom: `1px solid ${T.border}`, flexShrink: 0,
        justifyContent: collapsed && !mobile ? "center" : undefined,
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: 8,
          background: `linear-gradient(135deg, ${T.primary}, ${T.secondary})`,
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0, boxShadow: `0 4px 12px ${T.primary}40`,
        }}>
          <Activity size={18} color="#fff" strokeWidth={2.5} />
        </div>
        {(!collapsed || mobile) && (
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: T.text, lineHeight: 1.2 }}>SoporteDesk</div>
            <div style={{ fontSize: 11, color: T.textSec, fontWeight: 500 }}>INIA · Gestión de TI</div>
          </div>
        )}
        {mobile && (
          <button onClick={onClose} style={{
            width: 28, height: 28, borderRadius: 6,
            background: T.bg, border: `1px solid ${T.border}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", color: T.textSec, flexShrink: 0,
          }}>
            ✕
          </button>
        )}
      </div>

      {/* Section label */}
      {(!collapsed || mobile) && (
        <div style={{ padding: "18px 20px 6px", fontSize: 11, fontWeight: 700, color: T.textMuted, letterSpacing: "0.08em", textTransform: "uppercase" }}>
          Navegación
        </div>
      )}

      {/* Nav */}
      <nav style={{
        flex: 1, overflowY: "auto", overflowX: "hidden",
        padding: "6px 12px 12px",
        display: "flex", flexDirection: "column", gap: 2,
      }}>
        {navItems.map((item: any, i) => {
          if (item.sep) return <div key={i} style={{ height: 1, background: T.border, margin: "8px 4px" }} />;
          const Icon = item.icon;
          return (
            <button
              key={i}
              title={collapsed && !mobile ? item.label : ""}
              style={{
                display: "flex", alignItems: "center",
                gap: 12, padding: "10px 12px",
                borderRadius: 8, border: "none", cursor: "pointer",
                background: item.active ? T.primaryLight : "transparent",
                color: item.active ? T.primary : T.textSec,
                fontSize: 13.5, fontWeight: item.active ? 600 : 400,
                fontFamily: "DM Sans, sans-serif",
                textAlign: "left", width: "100%",
                justifyContent: collapsed && !mobile ? "center" : "flex-start",
                transition: "all 0.15s ease",
                whiteSpace: "nowrap",
              }}
              onMouseEnter={e => {
                if (!item.active) {
                  (e.currentTarget as HTMLElement).style.background = T.bg;
                  (e.currentTarget as HTMLElement).style.color = T.text;
                }
              }}
              onMouseLeave={e => {
                if (!item.active) {
                  (e.currentTarget as HTMLElement).style.background = "transparent";
                  (e.currentTarget as HTMLElement).style.color = T.textSec;
                }
              }}
            >
              <div style={{
                width: 36, height: 36, borderRadius: 8, flexShrink: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
                background: item.active ? T.primary : "transparent",
                transition: "background 0.15s",
              }}>
                <Icon size={17} strokeWidth={1.8}
                  color={item.active ? "#fff" : "currentColor"}
                />
              </div>
              {(!collapsed || mobile) && item.label}
            </button>
          );
        })}
      </nav>

      {/* User */}
      {(!collapsed || mobile) && (
        <div style={{
          margin: "0 12px 12px",
          padding: "12px",
          background: T.bg, borderRadius: 10,
          display: "flex", alignItems: "center", gap: 10,
        }}>
          <div style={{
            width: 38, height: 38, borderRadius: "50%",
            background: `linear-gradient(135deg, ${T.primary}, ${T.secondary})`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 13, fontWeight: 700, color: "#fff", flexShrink: 0,
          }}>AT</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: T.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>Administrador</div>
            <div style={{ fontSize: 11, color: T.textSec }}>admin@inia.cl</div>
          </div>
          <LogOut size={14} color={T.textSec} style={{ flexShrink: 0, cursor: "pointer" }} />
        </div>
      )}

      {/* Collapse toggle */}
      {!mobile && (
        <button
          onClick={onToggle}
          style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 12px 12px", padding: "8px",
            background: T.bg, border: `1px solid ${T.border}`,
            borderRadius: 8, cursor: "pointer", color: T.textSec,
            transition: "all 0.15s",
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = T.border; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = T.bg; }}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      )}
    </aside>
  );
}

/* ─── Stat Card (Modernize style) ────────────────────────────────── */
function StatCard({ s }: { s: typeof summaryCards[0] }) {
  const Icon = s.icon;
  const [hov, setHov] = useState(false);
  const isUp = s.trend >= 0;
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: T.card, borderRadius: T.cardRadius,
        boxShadow: hov ? T.cardShadowHov : T.cardShadow,
        padding: 20, cursor: "pointer",
        transition: "box-shadow 0.25s, transform 0.25s",
        transform: hov ? "translateY(-2px)" : "translateY(0)",
        display: "flex", flexDirection: "column", gap: 14,
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div style={{
          width: 48, height: 48, borderRadius: "50%",
          background: s.bg,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Icon size={22} color={s.color} strokeWidth={1.8} />
        </div>
        <div style={{
          display: "flex", alignItems: "center", gap: 4,
          padding: "4px 8px", borderRadius: 20,
          background: isUp ? T.successLight : T.dangerLight,
          fontSize: 11.5, fontWeight: 700,
          color: isUp ? T.success : T.danger,
        }}>
          {isUp ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
          {Math.abs(s.trend)}%
        </div>
      </div>
      <div>
        <div style={{ fontSize: 24, fontWeight: 700, color: T.text, lineHeight: 1 }}>
          {fmt(s.value)}
        </div>
        <div style={{ fontSize: 13, color: T.textSec, marginTop: 4 }}>{s.label}</div>
      </div>
    </div>
  );
}

/* ─── Card wrapper ───────────────────────────────────────────────── */
function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: T.card, borderRadius: T.cardRadius,
      boxShadow: T.cardShadow, padding: 24, ...style,
    }}>
      {children}
    </div>
  );
}

/* ─── Card Header ────────────────────────────────────────────────── */
function CardHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div style={{
      display: "flex", alignItems: "flex-start", justifyContent: "space-between",
      marginBottom: 20,
    }}>
      <div>
        <div style={{ fontSize: 15, fontWeight: 700, color: T.text }}>{title}</div>
        {subtitle && <div style={{ fontSize: 12, color: T.textSec, marginTop: 2 }}>{subtitle}</div>}
      </div>
      {action}
    </div>
  );
}

/* ─── Badge ──────────────────────────────────────────────────────── */
function Badge({ label, color, bg }: { label: string; color: string; bg: string }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center",
      padding: "3px 10px", borderRadius: 20,
      fontSize: 11, fontWeight: 700, color, background: bg,
    }}>{label}</span>
  );
}

/* ─── Priority row ───────────────────────────────────────────────── */
function PRow({ item }: { item: typeof priorityItems[0] }) {
  const c = item.state === "danger" ? T.danger : T.warning;
  const bg = item.state === "danger" ? T.dangerLight : T.warningLight;
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 14,
      padding: "10px 0",
      borderBottom: `1px solid ${T.border}`,
    }}>
      <div style={{
        width: 44, height: 44, borderRadius: "50%", flexShrink: 0,
        background: bg,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 14, fontWeight: 700, color: c,
      }}>{item.value}</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{item.label}</div>
        <div style={{ fontSize: 11.5, color: T.textSec, marginTop: 2 }}>{item.detail}</div>
      </div>
      <Badge
        label={item.state === "danger" ? "Urgente" : "Revisar"}
        color={c} bg={bg}
      />
    </div>
  );
}

/* ─── Activity row ───────────────────────────────────────────────── */
function ARow({ item }: { item: typeof recentActivity[0] }) {
  const c = stateColor[item.type] || T.primary;
  const bg = stateBg[item.type] || T.primaryLight;
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 12,
      padding: "10px 0",
      borderBottom: `1px solid ${T.border}`,
    }}>
      <div style={{
        width: 38, height: 38, borderRadius: "50%", flexShrink: 0,
        background: bg,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <Activity size={15} color={c} strokeWidth={2} />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{item.action}</div>
        <div style={{ fontSize: 11.5, color: T.textSec }}>{item.detail}</div>
      </div>
      <div style={{ fontSize: 11, color: T.textMuted, flexShrink: 0, whiteSpace: "nowrap" }}>
        Hace {item.time}
      </div>
    </div>
  );
}

/* ─── App ────────────────────────────────────────────────────────── */
export default function App() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 900);
  const [loading, setLoading] = useState(false);
  const [updatedAt, setUpdatedAt] = useState(new Date());
  const [activeTab, setActiveTab] = useState<"equipos" | "usuarios">("equipos");

  useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth < 900);
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);

  const refresh = () => {
    setLoading(true);
    setTimeout(() => { setLoading(false); setUpdatedAt(new Date()); }, 1200);
  };

  const totalRegistros = summaryCards.reduce((a, c) => a + c.value, 0);
  const criticals = priorityItems.filter(p => p.state === "danger").reduce((a, p) => a + p.value, 0);

  return (
    <div style={{
      fontFamily: "DM Sans, system-ui, sans-serif",
      background: T.bg, color: T.text,
      display: "flex", height: "100vh", overflow: "hidden",
      fontSize: 14,
    }}>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div onClick={() => setMobileOpen(false)} style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)",
          zIndex: 399,
        }} />
      )}

      {/* Sidebar */}
      {!isMobile && (
        <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(v => !v)} />
      )}
      {isMobile && mobileOpen && (
        <Sidebar collapsed={false} onToggle={() => {}} mobile onClose={() => setMobileOpen(false)} />
      )}

      {/* Main */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>

        {/* Header */}
        <header style={{
          height: T.headerH,
          background: T.card,
          borderBottom: `1px solid ${T.border}`,
          display: "flex", alignItems: "center",
          padding: "0 24px", gap: 16, flexShrink: 0,
          boxShadow: "0 1px 8px rgba(145,158,171,0.08)",
        }}>
          {isMobile && (
            <button
              onClick={() => setMobileOpen(true)}
              style={{
                width: 36, height: 36, borderRadius: 8,
                background: T.bg, border: `1px solid ${T.border}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", color: T.textSec, flexShrink: 0,
              }}
            >
              <Menu size={17} />
            </button>
          )}

          {/* Search */}
          <div style={{
            display: "flex", alignItems: "center", gap: 8,
            background: T.bg, border: `1px solid ${T.border}`,
            borderRadius: 8, padding: "0 12px", height: 38, flex: 1, maxWidth: 320,
          }}>
            <Search size={14} color={T.textSec} />
            <input
              placeholder="Buscar equipos, usuarios, licencias…"
              style={{
                border: "none", background: "transparent",
                fontSize: 13, color: T.text, outline: "none",
                fontFamily: "DM Sans, sans-serif", width: "100%",
              }}
            />
          </div>

          <div style={{ flex: 1 }} />

          {/* Alerts badge */}
          {criticals > 0 && (
            <div style={{
              display: "flex", alignItems: "center", gap: 6,
              background: T.dangerLight, border: `1px solid ${T.danger}30`,
              borderRadius: 8, padding: "6px 12px",
            }}>
              <AlertTriangle size={13} color={T.danger} />
              <span style={{ fontSize: 12, fontWeight: 700, color: T.danger }}>
                {criticals} alertas críticas
              </span>
            </div>
          )}

          {/* Refresh */}
          <button
            onClick={refresh}
            disabled={loading}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              height: 36, padding: "0 14px",
              background: T.primaryLight, border: "none", borderRadius: 8,
              color: T.primary, cursor: loading ? "not-allowed" : "pointer",
              fontSize: 12.5, fontWeight: 600, fontFamily: "DM Sans, sans-serif",
              opacity: loading ? 0.7 : 1, transition: "all 0.15s",
            }}
          >
            <RefreshCw size={13} style={{ animation: loading ? "spin 0.9s linear infinite" : "none" }} />
            {loading ? "Actualizando…" : "Actualizar"}
          </button>

          {/* Bell */}
          <div style={{ position: "relative" }}>
            <button style={{
              width: 38, height: 38, borderRadius: 8,
              background: T.bg, border: `1px solid ${T.border}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", color: T.textSec,
            }}>
              <Bell size={16} />
            </button>
            <span style={{
              position: "absolute", top: 6, right: 6,
              width: 8, height: 8, borderRadius: "50%",
              background: T.danger, border: `2px solid ${T.card}`,
            }} />
          </div>

          {/* Avatar */}
          <div style={{
            width: 38, height: 38, borderRadius: "50%",
            background: `linear-gradient(135deg, ${T.primary}, ${T.secondary})`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 13, fontWeight: 700, color: "#fff", cursor: "pointer",
            flexShrink: 0,
          }}>AT</div>
        </header>

        {/* Content area */}
        <main style={{
          flex: 1, overflowY: "auto", padding: isMobile ? 14 : 24,
          display: "flex", flexDirection: "column", gap: 24,
        }}>

          {/* Page title */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
            <div>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: T.text }}>
                Panel de Control
              </h2>
              <div style={{ fontSize: 12.5, color: T.textSec, marginTop: 3 }}>
                Sistema Gestión de Soporte Informático · INIA ·&nbsp;
                <span style={{ color: T.textMuted }}>
                  Actualizado {updatedAt.toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            </div>
            <div style={{
              background: T.primaryLight, borderRadius: T.cardRadius,
              padding: "10px 20px", textAlign: "center", flexShrink: 0,
            }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: T.primary }}>
                {fmt(totalRegistros)}
              </div>
              <div style={{ fontSize: 11, color: T.textSec, fontWeight: 600, marginTop: 2 }}>
                Total registros
              </div>
            </div>
          </div>

          {/* Stat cards — 7 cols */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
            gap: 16,
          }}>
            {summaryCards.map((s, i) => <StatCard key={i} s={s} />)}
          </div>

          {/* Row 2 — Area chart + Licencias pie */}
          <div style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "1.5fr 1fr",
            gap: 20,
          }}>
            {/* Activity evolution */}
            <Card style={{ padding: 0, overflow: "hidden" }}>
              <div style={{ padding: "20px 24px 0" }}>
                <CardHeader
                  title="Evolución de registros"
                  subtitle="Equipos y usuarios incorporados por mes"
                  action={
                    <div style={{ display: "flex", gap: 6 }}>
                      {(["equipos", "usuarios"] as const).map(t => (
                        <button key={t} onClick={() => setActiveTab(t)} style={{
                          padding: "5px 12px", borderRadius: 20, border: "none",
                          cursor: "pointer", fontSize: 12, fontWeight: 600,
                          background: activeTab === t ? T.primary : T.bg,
                          color: activeTab === t ? "#fff" : T.textSec,
                          fontFamily: "DM Sans, sans-serif",
                          transition: "all 0.15s",
                        }}>{t === "equipos" ? "Equipos" : "Usuarios"}</button>
                      ))}
                    </div>
                  }
                />
              </div>

              {/* KPI row inside chart card */}
              <div style={{
                display: "grid", gridTemplateColumns: "repeat(3, 1fr)",
                gap: 0, borderTop: `1px solid ${T.border}`, borderBottom: `1px solid ${T.border}`,
              }}>
                {[
                  { label: "Total equipos", value: "847", trend: "+12%", up: true },
                  { label: "Este mes",      value: "84",  trend: "+6.7%", up: true },
                  { label: "Activos",       value: "821", trend: "97%",   up: true },
                ].map((k, i) => (
                  <div key={i} style={{
                    padding: "14px 24px",
                    borderRight: i < 2 ? `1px solid ${T.border}` : undefined,
                  }}>
                    <div style={{ fontSize: 11, color: T.textSec, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      {k.label}
                    </div>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 4 }}>
                      <span style={{ fontSize: 20, fontWeight: 700, color: T.text }}>{k.value}</span>
                      <span style={{
                        fontSize: 11, fontWeight: 700,
                        color: k.up ? T.success : T.danger,
                        display: "flex", alignItems: "center", gap: 2,
                      }}>
                        <TrendingUp size={10} /> {k.trend}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ padding: "20px 24px 24px" }}>
                <ResponsiveContainer width="100%" height={190}>
                  <AreaChart data={revenueData} margin={{ top: 4, right: 0, bottom: 0, left: -28 }}>
                    <defs>
                      <linearGradient id="gradE" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor={T.primary}   stopOpacity={0.18} />
                        <stop offset="95%" stopColor={T.primary}   stopOpacity={0.01} />
                      </linearGradient>
                      <linearGradient id="gradU" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor={T.success}   stopOpacity={0.18} />
                        <stop offset="95%" stopColor={T.success}   stopOpacity={0.01} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} vertical={false} />
                    <XAxis dataKey="mes" tick={{ fontSize: 11, fill: T.textSec }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: T.textMuted }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CTooltip />} />
                    {activeTab === "equipos"
                      ? <Area type="monotone" dataKey="equipos" name="Equipos" stroke={T.primary} strokeWidth={2.5} fill="url(#gradE)" dot={false} />
                      : <Area type="monotone" dataKey="usuarios" name="Usuarios" stroke={T.success} strokeWidth={2.5} fill="url(#gradU)" dot={false} />
                    }
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* Licencias pie */}
            <Card>
              <CardHeader title="Licencias por tipo" subtitle={`${totalLic} licencias administradas`} />
              <div style={{ display: "flex", justifyContent: "center" }}>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={licenciasData} cx="50%" cy="50%"
                      innerRadius={50} outerRadius={78}
                      paddingAngle={3} dataKey="value" stroke="none">
                      {licenciasData.map((e, i) => <Cell key={i} fill={e.color} />)}
                    </Pie>
                    <Tooltip content={<CTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 9, marginTop: 8 }}>
                {licenciasData.map((d, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{
                      width: 10, height: 10, borderRadius: "50%",
                      background: d.color, flexShrink: 0,
                    }} />
                    <span style={{ fontSize: 12.5, color: T.textSec, flex: 1 }}>{d.name}</span>
                    <span style={{ fontSize: 12.5, fontWeight: 700, color: T.text }}>{d.value}</span>
                    <span style={{ fontSize: 11, color: T.textMuted, width: 34, textAlign: "right" }}>
                      {Math.round(d.value / totalLic * 100)}%
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Row 3 — Bar chart + Priority + Activity */}
          <div style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr 1fr",
            gap: 20,
          }}>
            {/* Bar — usuarios por sede */}
            <Card>
              <CardHeader title="Usuarios por sede" subtitle="Active Directory · jul 2026" />
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={ubicacionData} barCategoryGap="35%" margin={{ top: 4, right: 0, bottom: 0, left: -28 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 10.5, fill: T.textSec }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10.5, fill: T.textMuted }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CTooltip />} cursor={{ fill: `${T.primary}0a` }} />
                  <Bar dataKey="v" name="Usuarios" fill={T.primary} radius={[5, 5, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>

            {/* Priority */}
            <Card>
              <CardHeader
                title="Atención prioritaria"
                subtitle="Requieren revisión inmediata"
                action={
                  <Badge
                    label={`${priorityItems.length} alertas`}
                    color={T.danger} bg={T.dangerLight}
                  />
                }
              />
              <div>
                {priorityItems.map((item, i) => <PRow key={i} item={item} />)}
              </div>
            </Card>

            {/* Activity */}
            <Card>
              <CardHeader title="Actividad reciente" subtitle="Últimos movimientos" />
              <div>
                {recentActivity.map((item, i) => <ARow key={i} item={item} />)}
              </div>
            </Card>
          </div>

          {/* Row 4 — Quick access modules */}
          <Card>
            <CardHeader title="Módulos del sistema" subtitle="Acceso rápido a todas las áreas administradas" />
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
              gap: 12,
            }}>
              {summaryCards.map((s, i) => {
                const Icon = s.icon;
                return (
                  <button key={i} style={{
                    display: "flex", alignItems: "center", gap: 12,
                    padding: "14px 16px",
                    background: T.bg, border: `1px solid ${T.border}`,
                    borderRadius: 10, cursor: "pointer",
                    fontFamily: "DM Sans, sans-serif",
                    textAlign: "left", width: "100%",
                    transition: "all 0.2s",
                  }}
                    onMouseEnter={e => {
                      const el = e.currentTarget as HTMLElement;
                      el.style.background = s.bg;
                      el.style.borderColor = `${s.color}40`;
                    }}
                    onMouseLeave={e => {
                      const el = e.currentTarget as HTMLElement;
                      el.style.background = T.bg;
                      el.style.borderColor = T.border;
                    }}
                  >
                    <div style={{
                      width: 42, height: 42, borderRadius: "50%",
                      background: s.bg,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      flexShrink: 0,
                    }}>
                      <Icon size={18} color={s.color} strokeWidth={1.8} />
                    </div>
                    <div>
                      <div style={{ fontSize: 13.5, fontWeight: 600, color: T.text }}>{s.label}</div>
                      <div style={{ fontSize: 12, color: s.color, fontWeight: 700, marginTop: 1 }}>
                        {fmt(s.value)} registros
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </Card>

          <div style={{ height: 8 }} />
        </main>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #d7dde2; border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: #b0b8c4; }
        * { box-sizing: border-box; margin: 0; }
        input::placeholder { color: #adb5c5; }
      `}</style>
    </div>
  );
}
