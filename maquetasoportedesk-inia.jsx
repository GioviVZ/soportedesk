import { useState } from "react";

const C = {
  green: "#63a431", greenDark: "#1e3a0f", greenLight: "#e8f5d9",
  yellow: "#fab50b", bg: "#f4f6f3", white: "#ffffff",
  gray: "#6b7280", grayLight: "#e5e7eb", red: "#dc2626", blue: "#2563eb",
};

const DATA = {
  licencias: [
    { id: 1, cantidad: 5, licencia: "Office 365 E3", correo: "j.perez@inia.gob.pe", clave: "NKJFR-XXXXX-XXXXX-MNBVC", orden_compra: "OC-2024-00123", anio: "2024" },
    { id: 2, cantidad: 10, licencia: "Office 365 E1", correo: "m.lopez@inia.gob.pe", clave: "PQRST-XXXXX-XXXXX-QWERT", orden_compra: "OC-2024-00145", anio: "2024" },
    { id: 3, cantidad: 3, licencia: "Office 365 E3", correo: "c.garcia@inia.gob.pe", clave: "ASDFG-XXXXX-XXXXX-HJKLZ", orden_compra: "OC-2023-00087", anio: "2023" },
    { id: 4, cantidad: 1, licencia: "Office 2021 Pro Plus", correo: "a.rivera@inia.gob.pe", clave: "ZXCVB-XXXXX-XXXXX-UIOPY", orden_compra: "OC-2023-00201", anio: "2023" },
    { id: 5, cantidad: 20, licencia: "Microsoft 365 Business", correo: "soporte@inia.gob.pe", clave: "LMNOP-XXXXX-XXXXX-VWXYZ", orden_compra: "OC-2025-00034", anio: "2025" },
  ],
  correos: [
    { id: 1, usuario: "jperez", nombre: "Juan Pérez", correo: "j.perez@inia.gob.pe", area: "TI", creado: "2023-01-10", estado: "Activo" },
    { id: 2, usuario: "mlopez", nombre: "María López", correo: "m.lopez@inia.gob.pe", area: "Investigación", creado: "2023-03-15", estado: "Activo" },
    { id: 3, usuario: "cgarcia", nombre: "Carlos García", correo: "c.garcia@inia.gob.pe", area: "Administración", creado: "2022-11-05", estado: "Inactivo" },
    { id: 4, usuario: "rflores", nombre: "Rosa Flores", correo: "r.flores@inia.gob.pe", area: "Patrimonio", creado: "2024-02-01", estado: "Activo" },
  ],
  usuarios_red: [
    { id: 1, usuario: "jperez", nombre: "Juan Pérez", area: "TI", grupo: "IT-Admins", ultimo_login: "2025-06-13 08:42", estado: "Activo" },
    { id: 2, usuario: "mlopez", nombre: "María López", area: "Investigación", grupo: "Investigadores", ultimo_login: "2025-06-12 17:10", estado: "Activo" },
    { id: 3, usuario: "cgarcia", nombre: "Carlos García", area: "Administración", grupo: "Administrativos", ultimo_login: "2024-12-20 14:30", estado: "Bloqueado" },
    { id: 4, usuario: "arivera", nombre: "Ana Rivera", area: "Dirección", grupo: "Directivos", ultimo_login: "2025-06-13 09:15", estado: "Activo" },
  ],
  vpn: [
    { id: 1, usuario: "jperez", nombre: "Juan Pérez", tipo: "OpenVPN", ip_asignada: "10.8.0.2", vence: "2025-12-31", estado: "Activo" },
    { id: 2, usuario: "arivera", nombre: "Ana Rivera", tipo: "WireGuard", ip_asignada: "10.8.0.5", vence: "2025-09-30", estado: "Activo" },
    { id: 3, usuario: "gdirector", nombre: "Gerente IT", tipo: "OpenVPN", ip_asignada: "10.8.0.3", vence: "2024-12-31", estado: "Vencido" },
  ],
  wifi: [
    { id: 1, ssid: "INIA-CORP", clave: "••••••••••••", ubicacion: "Edificio Principal - Todos los pisos", tipo: "WPA2-Enterprise", estado: "Activo" },
    { id: 2, ssid: "INIA-INVITADOS", clave: "••••••••", ubicacion: "Recepción / Sala reuniones", tipo: "WPA2-Personal", estado: "Activo" },
    { id: 3, ssid: "INIA-LAB", clave: "••••••••••", ubicacion: "Laboratorios - Piso 2", tipo: "WPA2-Enterprise", estado: "Activo" },
    { id: 4, ssid: "INIA-BACKUP", clave: "••••••••••••", ubicacion: "Edificio Secundario", tipo: "WPA2-Personal", estado: "Inactivo" },
  ],
  impresoras: [
    {
      id: 1, nombre: "HP-LaserJet-Admin", marca: "HP", modelo: "LaserJet Pro M404n",
      ip: "192.168.1.50", piso: "Piso 1", area: "Administración",
      consumibles: {
        toner_negro: "HP CF259A (59A)",
        toner_c: "—", toner_m: "—", toner_y: "—",
        cartucho: "—", drum: "HP CF232A (32A)", fusor: "HP RM2-6435",
      },
      driver: { nombre: "HP LaserJet Pro M404n PCL6", version: "61.245.1.26388", archivo: "hp_lj_m404n_win.zip", so: "Windows 10/11 64-bit" },
      estado: "Operativa",
    },
    {
      id: 2, nombre: "CANON-Invest-01", marca: "Canon", modelo: "imageRUNNER 2630",
      ip: "192.168.1.51", piso: "Piso 2", area: "Investigación",
      consumibles: {
        toner_negro: "Canon NPG-59 (3766B003)",
        toner_c: "—", toner_m: "—", toner_y: "—",
        cartucho: "—", drum: "Canon NPG-59 Drum", fusor: "Canon FM3-9667",
      },
      driver: { nombre: "Canon iR2630 UFR II", version: "3.10", archivo: "canon_ir2630_ufrII.zip", so: "Windows 10/11 64-bit" },
      estado: "Operativa",
    },
    {
      id: 3, nombre: "Epson-Dirección", marca: "Epson", modelo: "WorkForce Pro WF-4830",
      ip: "192.168.1.52", piso: "Piso 3", area: "Dirección",
      consumibles: {
        toner_negro: "—",
        toner_c: "Epson T9452 (Cyan)", toner_m: "Epson T9453 (Magenta)", toner_y: "Epson T9454 (Yellow)",
        cartucho: "Epson T9451 (Negro)", drum: "—", fusor: "—",
      },
      driver: { nombre: "Epson WF-4830 Series", version: "2.68.00", archivo: "epson_wf4830_driver.zip", so: "Windows 10/11 64-bit" },
      estado: "Operativa",
    },
    {
      id: 4, nombre: "HP-Color-Lab", marca: "HP", modelo: "Color LaserJet M255dw",
      ip: "192.168.1.53", piso: "Piso 2", area: "Laboratorio",
      consumibles: {
        toner_negro: "HP W2210A (207A Negro)",
        toner_c: "HP W2211A (207A Cyan)", toner_m: "HP W2213A (207A Magenta)", toner_y: "HP W2212A (207A Yellow)",
        cartucho: "—", drum: "HP W2210A (incluido)", fusor: "HP RM2-8715",
      },
      driver: { nombre: "HP Color LaserJet M255dw PCL6", version: "61.245.1.26388", archivo: "hp_color_m255dw_win.zip", so: "Windows 10/11 64-bit" },
      estado: "Operativa",
    },
  ],
  equipos: [
    { id: 1, codigo: "EQ-2024-001", tipo: "Laptop", marca: "Dell", modelo: "Latitude 5540", usuario: "jperez", area: "TI", asignado: "2024-01-10", estado: "En uso" },
    { id: 2, codigo: "EQ-2023-045", tipo: "PC", marca: "HP", modelo: "EliteDesk 800 G6", usuario: "mlopez", area: "Investigación", asignado: "2023-06-15", estado: "En uso" },
    { id: 3, codigo: "EQ-2022-012", tipo: "Laptop", marca: "Lenovo", modelo: "ThinkPad E14", usuario: "Sin asignar", area: "—", asignado: "—", estado: "Disponible" },
    { id: 4, codigo: "EQ-2021-007", tipo: "PC", marca: "HP", modelo: "Compaq Pro 6300", usuario: "cgarcia", area: "Administración", asignado: "2021-03-01", estado: "Mantenimiento" },
  ],
};

const MODULES = [
  { key: "dashboard", label: "Dashboard", icon: "⊞" },
  { key: "licencias", label: "Licencias Office", icon: "📋" },
  { key: "correos", label: "Correos", icon: "📧" },
  { key: "usuarios_red", label: "Usuarios de Red", icon: "🖥️" },
  { key: "vpn", label: "VPN", icon: "🔐" },
  { key: "wifi", label: "Claves WiFi", icon: "📶" },
  { key: "impresoras", label: "Impresoras", icon: "🖨️" },
  { key: "equipos", label: "Equipos", icon: "💻" },
];

function Badge({ text }) {
  const map = {
    Activo: { bg: "#dcfce7", color: "#16a34a" }, Inactivo: { bg: "#fee2e2", color: "#dc2626" },
    Vencido: { bg: "#fef3c7", color: "#d97706" }, Bloqueado: { bg: "#fee2e2", color: "#dc2626" },
    Operativa: { bg: "#dcfce7", color: "#16a34a" }, "En uso": { bg: "#dbeafe", color: "#2563eb" },
    Disponible: { bg: "#dcfce7", color: "#16a34a" }, Mantenimiento: { bg: "#fef3c7", color: "#d97706" },
  };
  const s = map[text] || { bg: "#f3f4f6", color: "#6b7280" };
  return <span style={{ background: s.bg, color: s.color, padding: "2px 10px", borderRadius: 999, fontSize: 12, fontWeight: 600 }}>{text}</span>;
}

function Modal({ title, onClose, children, wide }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.45)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ background: C.white, borderRadius: 12, width: wide ? 780 : 520, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,.25)" }}>
        <div style={{ padding: "18px 24px", borderBottom: `1px solid ${C.grayLight}`, display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, background: C.white, zIndex: 1 }}>
          <span style={{ fontWeight: 700, fontSize: 16, color: C.greenDark }}>{title}</span>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: C.gray }}>✕</button>
        </div>
        <div style={{ padding: 24 }}>{children}</div>
      </div>
    </div>
  );
}

function Field({ label, placeholder, type = "text" }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: C.greenDark, marginBottom: 5 }}>{label}</label>
      <input type={type} placeholder={placeholder}
        style={{ width: "100%", padding: "8px 12px", border: `1px solid ${C.grayLight}`, borderRadius: 8, fontSize: 14, outline: "none", boxSizing: "border-box" }} />
    </div>
  );
}

function SectionTitle({ children }) {
  return <div style={{ fontSize: 12, fontWeight: 700, color: C.green, textTransform: "uppercase", letterSpacing: 1, borderBottom: `2px solid ${C.greenLight}`, paddingBottom: 6, marginBottom: 14, marginTop: 20 }}>{children}</div>;
}

function InfoRow({ label, value, mono }) {
  if (!value || value === "—") return null;
  return (
    <div style={{ display: "flex", gap: 8, marginBottom: 8, alignItems: "flex-start" }}>
      <span style={{ fontSize: 12, color: C.gray, minWidth: 140, flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: 13, color: "#111827", fontFamily: mono ? "monospace" : "inherit", background: mono ? "#f3f4f6" : "transparent", padding: mono ? "1px 6px" : 0, borderRadius: mono ? 4 : 0, fontWeight: mono ? 500 : 400 }}>{value}</span>
    </div>
  );
}

// ── FICHA IMPRESORA (detalle) ─────────────────────────────────
function FichaImpresora({ imp, onClose, isAdmin }) {
  const [tab, setTab] = useState("instalacion");
  const tabs = [
    { key: "instalacion", label: "📡 Instalación" },
    { key: "consumibles", label: "🗂 Consumibles" },
    { key: "driver", label: "💾 Driver" },
  ];
  return (
    <Modal title={`Ficha técnica — ${imp.nombre}`} onClose={onClose} wide>
      {/* Header impresora */}
      <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "14px 18px", background: C.greenLight, borderRadius: 10, marginBottom: 20 }}>
        <div style={{ fontSize: 40 }}>🖨️</div>
        <div>
          <div style={{ fontWeight: 800, fontSize: 18, color: C.greenDark }}>{imp.marca} {imp.modelo}</div>
          <div style={{ fontSize: 13, color: C.gray, marginTop: 2 }}>{imp.nombre} &nbsp;·&nbsp; {imp.area}, {imp.piso}</div>
        </div>
        <div style={{ marginLeft: "auto" }}><Badge text={imp.estado} /></div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 20, background: C.grayLight, borderRadius: 8, padding: 4 }}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            style={{ flex: 1, padding: "8px 0", borderRadius: 6, border: "none", fontWeight: 600, fontSize: 13, cursor: "pointer",
              background: tab === t.key ? C.white : "transparent",
              color: tab === t.key ? C.greenDark : C.gray,
              boxShadow: tab === t.key ? "0 1px 4px rgba(0,0,0,.10)" : "none",
              transition: "all .15s" }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab: Instalación */}
      {tab === "instalacion" && (
        <div>
          <SectionTitle>Datos de red</SectionTitle>
          <InfoRow label="Dirección IP" value={imp.ip} mono />
          <InfoRow label="Piso / Área" value={`${imp.piso} — ${imp.area}`} />
          <SectionTitle>Instrucciones de instalación</SectionTitle>
          {["Windows 10 / 11","Windows 7"].map((so, i) => (
            <div key={i} style={{ background: "#f8fafc", borderRadius: 8, padding: "12px 16px", marginBottom: 10, border: `1px solid ${C.grayLight}` }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: C.greenDark, marginBottom: 8 }}>{so}</div>
              <ol style={{ margin: 0, paddingLeft: 20, fontSize: 13, color: "#374151", lineHeight: 1.8 }}>
                <li>Ir a <b>Panel de control → Dispositivos e impresoras → Agregar impresora</b></li>
                <li>Seleccionar <b>"La impresora que deseo no está en la lista"</b></li>
                <li>Elegir <b>"Agregar una impresora usando TCP/IP"</b></li>
                <li>Ingresar IP: <span style={{ fontFamily: "monospace", background: "#e0f2fe", padding: "1px 6px", borderRadius: 4, color: "#0369a1" }}>{imp.ip}</span></li>
                <li>Instalar driver: <b>{imp.driver.archivo}</b></li>
                <li>Asignar nombre e imprimir página de prueba</li>
              </ol>
            </div>
          ))}
        </div>
      )}

      {/* Tab: Consumibles */}
      {tab === "consumibles" && (
        <div>
          <SectionTitle>Tóner</SectionTitle>
          <InfoRow label="Tóner Negro" value={imp.consumibles.toner_negro} />
          <InfoRow label="Tóner Cyan" value={imp.consumibles.toner_c} />
          <InfoRow label="Tóner Magenta" value={imp.consumibles.toner_m} />
          <InfoRow label="Tóner Yellow" value={imp.consumibles.toner_y} />
          <SectionTitle>Otros consumibles</SectionTitle>
          <InfoRow label="Cartucho de tinta" value={imp.consumibles.cartucho} />
          <InfoRow label="Drum / Tambor" value={imp.consumibles.drum} />
          <InfoRow label="Fusor (Fuser)" value={imp.consumibles.fusor} />
          <div style={{ background: "#fefce8", border: `1px solid ${C.yellow}`, borderRadius: 8, padding: "10px 14px", marginTop: 16, fontSize: 12, color: "#92400e" }}>
            ⚠️ Los ítems marcados con <b>—</b> no aplican para este modelo. Solicitar consumibles por orden de compra indicando el código exacto.
          </div>
        </div>
      )}

      {/* Tab: Driver */}
      {tab === "driver" && (
        <div>
          <SectionTitle>Información del driver</SectionTitle>
          <InfoRow label="Nombre del driver" value={imp.driver.nombre} />
          <InfoRow label="Versión" value={imp.driver.version} mono />
          <InfoRow label="Sistema operativo" value={imp.driver.so} />
          <SectionTitle>Archivo en repositorio</SectionTitle>
          <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "16px 18px", background: C.greenLight, borderRadius: 10, border: `1px solid ${C.green}30` }}>
            <div style={{ fontSize: 36 }}>📦</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, color: C.greenDark, fontSize: 14 }}>{imp.driver.archivo}</div>
              <div style={{ fontSize: 12, color: C.gray, marginTop: 3 }}>Repositorio interno TI — INIA</div>
            </div>
            <button style={{ background: C.green, color: C.white, border: "none", padding: "8px 18px", borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
              ⬇ Descargar
            </button>
          </div>
          {isAdmin && (
            <div style={{ marginTop: 20 }}>
              <SectionTitle>Subir nuevo driver</SectionTitle>
              <label style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", border: `2px dashed ${C.green}`, borderRadius: 10, padding: "28px 20px", cursor: "pointer", background: "#f9fef4", color: C.green, gap: 8, fontSize: 13, fontWeight: 600 }}>
                <span style={{ fontSize: 32 }}>📁</span>
                Arrastra el archivo o haz clic para seleccionar
                <span style={{ fontSize: 11, color: C.gray, fontWeight: 400 }}>Formatos: .zip, .exe, .inf — Máx. 200 MB</span>
                <input type="file" style={{ display: "none" }} accept=".zip,.exe,.inf" />
              </label>
              <Field label="Versión del driver" placeholder="Ej: 61.245.1.26388" />
              <Field label="Sistema operativo compatible" placeholder="Ej: Windows 10/11 64-bit" />
              <button style={{ background: C.green, color: C.white, border: "none", padding: "10px 24px", borderRadius: 8, fontWeight: 700, cursor: "pointer", marginTop: 4 }}>
                Subir al repositorio
              </button>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}

function Dashboard() {
  const counts = [
    { label: "Licencias Office", count: DATA.licencias.length, icon: "📋", color: C.green },
    { label: "Correos", count: DATA.correos.length, icon: "📧", color: "#0ea5e9" },
    { label: "Usuarios Red", count: DATA.usuarios_red.length, icon: "🖥️", color: "#8b5cf6" },
    { label: "Accesos VPN", count: DATA.vpn.length, icon: "🔐", color: C.yellow },
    { label: "Redes WiFi", count: DATA.wifi.length, icon: "📶", color: "#06b6d4" },
    { label: "Impresoras", count: DATA.impresoras.length, icon: "🖨️", color: "#f97316" },
    { label: "Equipos", count: DATA.equipos.length, icon: "💻", color: "#ec4899" },
  ];
  return (
    <div>
      <p style={{ color: C.gray, marginBottom: 24 }}>Resumen general del sistema de recursos TI — INIA</p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 16, marginBottom: 32 }}>
        {counts.map(c => (
          <div key={c.label} style={{ background: C.white, borderRadius: 12, padding: "20px 16px", boxShadow: "0 1px 4px rgba(0,0,0,.08)", borderTop: `4px solid ${c.color}` }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>{c.icon}</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: c.color }}>{c.count}</div>
            <div style={{ fontSize: 12, color: C.gray, marginTop: 4 }}>{c.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Tabla({ columns, rows, isAdmin, onAgregar, onVer, onEdit, onDelete }) {
  const [search, setSearch] = useState("");
  const filtered = rows.filter(r =>
    Object.values(r).some(v => typeof v === "string" && v.toLowerCase().includes(search.toLowerCase()))
  );
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <input placeholder="🔍 Buscar..." value={search} onChange={e => setSearch(e.target.value)}
          style={{ padding: "8px 14px", border: `1px solid ${C.grayLight}`, borderRadius: 8, fontSize: 14, width: 260, outline: "none" }} />
        {isAdmin && (
          <button onClick={onAgregar} style={{ background: C.green, color: C.white, border: "none", padding: "9px 20px", borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
            + Agregar
          </button>
        )}
      </div>
      <div style={{ background: C.white, borderRadius: 12, boxShadow: "0 1px 4px rgba(0,0,0,.08)", overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: C.greenDark }}>
                {columns.map(col => (
                  <th key={col.key} style={{ padding: "12px 16px", textAlign: "left", color: C.white, fontWeight: 600, whiteSpace: "nowrap" }}>{col.label}</th>
                ))}
                <th style={{ padding: "12px 16px", color: C.white }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row, i) => (
                <tr key={row.id} style={{ borderBottom: `1px solid ${C.grayLight}`, background: i % 2 === 0 ? C.white : "#fafafa" }}>
                  {columns.map(col => (
                    <td key={col.key} style={{ padding: "11px 16px", color: "#374151", whiteSpace: "nowrap" }}>
                      {col.render ? col.render(row[col.key], row) : row[col.key]}
                    </td>
                  ))}
                  <td style={{ padding: "11px 16px" }}>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button onClick={() => onVer(row)} style={{ background: "#eff6ff", color: C.blue, border: "none", padding: "5px 12px", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Ver</button>
                      {isAdmin && <>
                        <button onClick={() => onEdit(row)} style={{ background: C.greenLight, color: C.green, border: "none", padding: "5px 12px", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Editar</button>
                        <button onClick={() => onDelete(row)} style={{ background: "#fef2f2", color: C.red, border: "none", padding: "5px 12px", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Eliminar</button>
                      </>}
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={columns.length + 1} style={{ padding: 32, textAlign: "center", color: C.gray }}>Sin resultados</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div style={{ padding: "10px 16px", color: C.gray, fontSize: 12, borderTop: `1px solid ${C.grayLight}` }}>
          {filtered.length} registro(s)
        </div>
      </div>
    </div>
  );
}

const MODALS_FORMS = {
  licencias: <><Field label="Cantidad" placeholder="Ej: 5" type="number" /><Field label="Licencia" placeholder="Ej: Office 365 E3" /><Field label="Correo asociado" placeholder="Ej: j.perez@inia.gob.pe" type="email" /><Field label="Clave de producto" placeholder="Ej: XXXXX-XXXXX-XXXXX-XXXXX" /><Field label="Orden de compra" placeholder="Ej: OC-2025-00034" /><Field label="Año" placeholder="Ej: 2025" type="number" /></>,
  correos: <><Field label="Usuario" placeholder="Ej: jperez" /><Field label="Nombre completo" placeholder="Ej: Juan Pérez" /><Field label="Correo" placeholder="Ej: j.perez@inia.gob.pe" /><Field label="Área" placeholder="Ej: TI, Investigación" /></>,
  usuarios_red: <><Field label="Usuario AD" placeholder="Ej: jperez" /><Field label="Nombre completo" placeholder="Ej: Juan Pérez" /><Field label="Área" placeholder="Ej: TI" /><Field label="Grupo de permisos" placeholder="Ej: IT-Admins" /></>,
  vpn: <><Field label="Usuario" placeholder="Ej: jperez" /><Field label="Nombre completo" placeholder="Ej: Juan Pérez" /><Field label="Tipo VPN" placeholder="Ej: OpenVPN, WireGuard" /><Field label="IP asignada" placeholder="Ej: 10.8.0.5" /><Field label="Fecha vencimiento" type="date" /></>,
  wifi: <><Field label="SSID / Nombre de red" placeholder="Ej: INIA-CORP" /><Field label="Clave" type="password" placeholder="Contraseña de la red" /><Field label="Ubicación" placeholder="Ej: Piso 1, Recepción" /><Field label="Tipo de seguridad" placeholder="Ej: WPA2-Enterprise" /></>,
  impresoras: <>
    <SectionTitle>Datos generales</SectionTitle>
    <Field label="Nombre de referencia" placeholder="Ej: HP-LaserJet-Admin" />
    <Field label="Marca" placeholder="Ej: HP, Canon, Epson" />
    <Field label="Modelo" placeholder="Ej: LaserJet Pro M404n" />
    <Field label="Dirección IP" placeholder="Ej: 192.168.1.50" />
    <Field label="Piso" placeholder="Ej: Piso 1" />
    <Field label="Área" placeholder="Ej: Administración" />
    <SectionTitle>Consumibles</SectionTitle>
    <Field label="Tóner Negro" placeholder="Ej: HP CF259A (59A)" />
    <Field label="Tóner Cyan" placeholder="Ej: HP W2211A — dejar vacío si no aplica" />
    <Field label="Tóner Magenta" placeholder="Ej: HP W2213A — dejar vacío si no aplica" />
    <Field label="Tóner Yellow" placeholder="Ej: HP W2212A — dejar vacío si no aplica" />
    <Field label="Cartucho de tinta" placeholder="Dejar vacío si no aplica" />
    <Field label="Drum / Tambor" placeholder="Ej: HP CF232A (32A)" />
    <Field label="Fusor (Fuser)" placeholder="Ej: HP RM2-6435" />
    <SectionTitle>Driver</SectionTitle>
    <Field label="Nombre del driver" placeholder="Ej: HP LaserJet Pro M404n PCL6" />
    <Field label="Versión" placeholder="Ej: 61.245.1.26388" />
    <Field label="Sistema operativo" placeholder="Ej: Windows 10/11 64-bit" />
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#1e3a0f", marginBottom: 5 }}>Archivo del driver</label>
      <label style={{ display: "flex", alignItems: "center", gap: 10, border: "2px dashed #63a431", borderRadius: 8, padding: "12px 16px", cursor: "pointer", background: "#f9fef4", color: "#63a431", fontSize: 13, fontWeight: 600 }}>
        <span style={{ fontSize: 22 }}>📁</span> Seleccionar archivo (.zip, .exe, .inf)
        <input type="file" style={{ display: "none" }} accept=".zip,.exe,.inf" />
      </label>
    </div>
  </>,
  equipos: <><Field label="Código de activo" placeholder="Ej: EQ-2024-001" /><Field label="Tipo" placeholder="PC / Laptop" /><Field label="Marca" placeholder="Ej: Dell, HP, Lenovo" /><Field label="Modelo" placeholder="Ej: Latitude 5540" /><Field label="Usuario asignado" placeholder="Ej: jperez" /><Field label="Área" placeholder="Ej: TI" /></>,
};

const COLS = {
  licencias: [
    { key: "cantidad", label: "Cantidad", render: v => <span style={{ fontWeight: 700, color: C.green, fontSize: 15 }}>{v}</span> },
    { key: "licencia", label: "Licencia" },
    { key: "correo", label: "Correo asociado" },
    { key: "clave", label: "Clave", render: v => <span style={{ fontFamily: "monospace", fontSize: 12, background: "#f3f4f6", padding: "2px 8px", borderRadius: 4 }}>{v}</span> },
    { key: "orden_compra", label: "Orden de Compra" },
    { key: "anio", label: "Año", render: v => <span style={{ fontWeight: 700, color: C.greenDark }}>{v}</span> },
  ],
  correos: [
    { key: "usuario", label: "Usuario" }, { key: "nombre", label: "Nombre" },
    { key: "correo", label: "Correo" }, { key: "area", label: "Área" },
    { key: "creado", label: "Creado" }, { key: "estado", label: "Estado", render: v => <Badge text={v} /> },
  ],
  usuarios_red: [
    { key: "usuario", label: "Usuario AD" }, { key: "nombre", label: "Nombre" },
    { key: "area", label: "Área" }, { key: "grupo", label: "Grupo" },
    { key: "ultimo_login", label: "Último Login" }, { key: "estado", label: "Estado", render: v => <Badge text={v} /> },
  ],
  vpn: [
    { key: "usuario", label: "Usuario" }, { key: "nombre", label: "Nombre" },
    { key: "tipo", label: "Tipo VPN" }, { key: "ip_asignada", label: "IP Asignada" },
    { key: "vence", label: "Vence" }, { key: "estado", label: "Estado", render: v => <Badge text={v} /> },
  ],
  wifi: [
    { key: "ssid", label: "SSID" }, { key: "clave", label: "Clave" },
    { key: "ubicacion", label: "Ubicación" }, { key: "tipo", label: "Seguridad" },
    { key: "estado", label: "Estado", render: v => <Badge text={v} /> },
  ],
  impresoras: [
    { key: "nombre", label: "Nombre" },
    { key: "marca", label: "Marca" },
    { key: "modelo", label: "Modelo" },
    { key: "ip", label: "IP", render: v => <span style={{ fontFamily: "monospace", fontSize: 12, background: "#f3f4f6", padding: "2px 8px", borderRadius: 4 }}>{v}</span> },
    { key: "piso", label: "Piso" },
    { key: "area", label: "Área" },
    { key: "estado", label: "Estado", render: v => <Badge text={v} /> },
  ],
  equipos: [
    { key: "codigo", label: "Código" }, { key: "tipo", label: "Tipo" },
    { key: "marca", label: "Marca" }, { key: "modelo", label: "Modelo" },
    { key: "usuario", label: "Usuario" }, { key: "area", label: "Área" },
    { key: "estado", label: "Estado", render: v => <Badge text={v} /> },
  ],
};

const TITLES = {
  licencias: "Licencias Office", correos: "Correos Institucionales",
  usuarios_red: "Usuarios de Red / AD", vpn: "VPN",
  wifi: "Claves WiFi", impresoras: "Impresoras y Drivers",
  equipos: "Equipos Asignados",
};

export default function App() {
  const [active, setActive] = useState("dashboard");
  const [role, setRole] = useState("Administrador");
  const [modal, setModal] = useState(null);
  const [selected, setSelected] = useState(null);
  const [sideCollapsed, setSideCollapsed] = useState(false);
  const isAdmin = role === "Administrador";

  const handleVer = row => { setSelected(row); setModal("ver"); };
  const handleEdit = row => { setSelected(row); setModal("editar"); };
  const handleDelete = row => { setSelected(row); setModal("eliminar"); };

  return (
    <div style={{ display: "flex", height: "100vh", fontFamily: "'Inter', sans-serif", background: C.bg, color: "#111827" }}>
      {/* SIDEBAR */}
      <div style={{ width: sideCollapsed ? 64 : 240, background: C.greenDark, display: "flex", flexDirection: "column", transition: "width .25s", flexShrink: 0, overflow: "hidden" }}>
        <div style={{ padding: sideCollapsed ? "20px 0" : "20px", borderBottom: "1px solid rgba(255,255,255,.1)", display: "flex", alignItems: "center", gap: 10, justifyContent: sideCollapsed ? "center" : "flex-start" }}>
          <div style={{ width: 36, height: 36, background: C.green, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>🌿</div>
          {!sideCollapsed && <div>
            <div style={{ color: C.white, fontWeight: 800, fontSize: 14, lineHeight: 1.2 }}>SoporteDesk</div>
            <div style={{ color: C.yellow, fontSize: 11, fontWeight: 600 }}>INIA · TI</div>
          </div>}
        </div>
        <nav style={{ flex: 1, padding: "12px 0", overflowY: "auto" }}>
          {MODULES.map(m => {
            const isActive = active === m.key;
            return (
              <button key={m.key} onClick={() => setActive(m.key)} style={{
                width: "100%", display: "flex", alignItems: "center", gap: 12,
                padding: sideCollapsed ? "11px 0" : "11px 20px",
                justifyContent: sideCollapsed ? "center" : "flex-start",
                background: isActive ? "rgba(99,164,49,.35)" : "none",
                border: "none", borderLeft: isActive ? `3px solid ${C.yellow}` : "3px solid transparent",
                color: isActive ? C.white : "rgba(255,255,255,.65)",
                fontSize: 13, fontWeight: isActive ? 700 : 400, cursor: "pointer",
              }}>
                <span style={{ fontSize: 16, flexShrink: 0 }}>{m.icon}</span>
                {!sideCollapsed && <span>{m.label}</span>}
              </button>
            );
          })}
        </nav>
        <button onClick={() => setSideCollapsed(!sideCollapsed)}
          style={{ background: "rgba(255,255,255,.08)", border: "none", color: "rgba(255,255,255,.6)", padding: 12, cursor: "pointer", fontSize: 16 }}>
          {sideCollapsed ? "▶" : "◀"}
        </button>
      </div>

      {/* MAIN */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <header style={{ background: C.white, borderBottom: `1px solid ${C.grayLight}`, padding: "0 24px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <span style={{ fontSize: 16, fontWeight: 700, color: C.greenDark }}>
            {active === "dashboard" ? "Dashboard" : TITLES[active]}
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ display: "flex", background: C.grayLight, borderRadius: 8, padding: 3 }}>
              {["Administrador", "Soporte"].map(r => (
                <button key={r} onClick={() => setRole(r)} style={{
                  padding: "5px 14px", borderRadius: 6, border: "none", fontSize: 12, fontWeight: 600, cursor: "pointer",
                  background: role === r ? C.green : "transparent", color: role === r ? C.white : C.gray,
                }}>{r}</button>
              ))}
            </div>
            <div style={{ width: 36, height: 36, background: C.green, borderRadius: 999, display: "flex", alignItems: "center", justifyContent: "center", color: C.white, fontWeight: 700, fontSize: 14 }}>
              {role === "Administrador" ? "AD" : "ST"}
            </div>
          </div>
        </header>

        <main style={{ flex: 1, overflowY: "auto", padding: 24 }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: C.greenDark, marginBottom: 6 }}>
            {active === "dashboard" ? "📊 Dashboard General" : `${MODULES.find(m => m.key === active)?.icon} ${TITLES[active]}`}
          </h2>
          {active === "dashboard" ? <Dashboard /> : (
            <Tabla
              columns={COLS[active]} rows={DATA[active]} isAdmin={isAdmin}
              onAgregar={() => setModal("agregar")}
              onVer={handleVer} onEdit={handleEdit} onDelete={handleDelete}
            />
          )}
        </main>
      </div>

      {/* MODAL VER IMPRESORA (ficha técnica) */}
      {modal === "ver" && active === "impresoras" && selected && (
        <FichaImpresora imp={selected} onClose={() => setModal(null)} isAdmin={isAdmin} />
      )}

      {/* MODAL VER genérico */}
      {modal === "ver" && active !== "impresoras" && selected && (
        <Modal title="Detalle del registro" onClose={() => setModal(null)}>
          {Object.entries(selected).filter(([k]) => k !== "id").map(([k, v]) => (
            typeof v !== "object" && <InfoRow key={k} label={k.replace(/_/g, " ")} value={String(v)} />
          ))}
        </Modal>
      )}

      {/* MODAL AGREGAR / EDITAR */}
      {(modal === "agregar" || modal === "editar") && (
        <Modal title={modal === "agregar" ? `Agregar — ${TITLES[active]}` : "Editar registro"} onClose={() => setModal(null)} wide={active === "impresoras"}>
          {MODALS_FORMS[active]}
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
            <button onClick={() => setModal(null)} style={{ padding: "9px 20px", borderRadius: 8, border: `1px solid ${C.grayLight}`, background: C.white, cursor: "pointer" }}>Cancelar</button>
            <button onClick={() => setModal(null)} style={{ padding: "9px 20px", borderRadius: 8, border: "none", background: C.green, color: C.white, fontWeight: 700, cursor: "pointer" }}>
              {modal === "agregar" ? "Guardar" : "Actualizar"}
            </button>
          </div>
        </Modal>
      )}

      {/* MODAL ELIMINAR */}
      {modal === "eliminar" && selected && (
        <Modal title="Confirmar eliminación" onClose={() => setModal(null)}>
          <p style={{ color: "#374151", marginBottom: 20 }}>¿Seguro que deseas eliminar este registro? Esta acción no se puede deshacer.</p>
          <div style={{ background: "#fef2f2", borderRadius: 8, padding: 12, marginBottom: 20, fontSize: 13, color: C.red }}>
            <b>{selected.nombre || selected.nombre_red || selected.ssid || selected.codigo || "Registro"}</b>
          </div>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button onClick={() => setModal(null)} style={{ padding: "9px 20px", borderRadius: 8, border: `1px solid ${C.grayLight}`, background: C.white, cursor: "pointer" }}>Cancelar</button>
            <button onClick={() => setModal(null)} style={{ padding: "9px 20px", borderRadius: 8, border: "none", background: C.red, color: C.white, fontWeight: 700, cursor: "pointer" }}>Eliminar</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function SectionTitle({ children }) {
  return <div style={{ fontSize: 12, fontWeight: 700, color: "#63a431", textTransform: "uppercase", letterSpacing: 1, borderBottom: "2px solid #e8f5d9", paddingBottom: 6, marginBottom: 14, marginTop: 20 }}>{children}</div>;
}

function InfoRow({ label, value, mono }) {
  if (!value || value === "—") return null;
  return (
    <div style={{ display: "flex", gap: 8, marginBottom: 8, alignItems: "flex-start" }}>
      <span style={{ fontSize: 12, color: "#6b7280", minWidth: 140, flexShrink: 0, textTransform: "capitalize" }}>{label}</span>
      <span style={{ fontSize: 13, color: "#111827", fontFamily: mono ? "monospace" : "inherit", background: mono ? "#f3f4f6" : "transparent", padding: mono ? "1px 6px" : 0, borderRadius: mono ? 4 : 0 }}>{value}</span>
    </div>
  );
}
