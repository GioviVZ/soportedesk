---
name: Sistema Gestión de Soporte Informático INIA
description: Panel operativo interno para equipos, impresoras, redes, licencias y VPN de INIA
colors:
  verde-primario: "#63a431"
  verde-primario-hover: "#5d982d"
  verde-primario-suave: "#eef6e8"
  verde-profundo: "#2a5726"
  verde-profundo-suave: "#e8f0e6"
  ambar-acento: "#fab50b"
  ambar-acento-suave: "#ffde94"
  encabezado: "#244b21"
  fondo: "#f1f3f0"
  superficie: "#ffffff"
  borde: "#e1e5df"
  borde-fuerte: "#c8d1ca"
  texto: "#1e2d22"
  texto-secundario: "#5f7064"
  texto-tenue: "#98a49b"
  neutro-muted: "#f1f4ef"
  exito: "#2f7d4a"
  exito-suave: "#e7f3e9"
  advertencia: "#a86200"
  advertencia-suave: "#fff3dc"
  peligro: "#b9473a"
  peligro-suave: "#fbeae7"
  info: "#3e7185"
  info-suave: "#e9f1f3"
  modulo-licencias: "#456b8a"
  modulo-correos: "#657195"
  modulo-usuarios-red: "#a86200"
  modulo-vpn: "#b55245"
  modulo-wifi: "#357783"
  modulo-impresoras: "#66746a"
  modulo-equipos: "#63a431"
  modulo-auditoria: "#756a42"
typography:
  display:
    fontFamily: "DM Sans, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "34px"
    fontWeight: 800
    lineHeight: 1
    letterSpacing: "normal"
  headline:
    fontFamily: "DM Sans, sans-serif"
    fontSize: "22px"
    fontWeight: 600
    lineHeight: 1.3
  title:
    fontFamily: "DM Sans, sans-serif"
    fontSize: "16px"
    fontWeight: 700
    lineHeight: 1.3
  body:
    fontFamily: "DM Sans, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "DM Sans, sans-serif"
    fontSize: "11px"
    fontWeight: 800
    letterSpacing: "0.05em"
rounded:
  sm: "5px"
  md: "7px"
  lg: "8px"
  xl: "10px"
  pill: "999px"
spacing:
  xs: "6px"
  sm: "10px"
  md: "14px"
  lg: "18px"
  xl: "24px"
components:
  button-primary:
    backgroundColor: "{colors.verde-primario}"
    textColor: "#ffffff"
    rounded: "{rounded.sm}"
    padding: "8px 16px"
  button-primary-hover:
    backgroundColor: "{colors.verde-primario-hover}"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.texto-secundario}"
    rounded: "{rounded.sm}"
  card:
    backgroundColor: "{colors.superficie}"
    rounded: "{rounded.md}"
  input:
    backgroundColor: "{colors.superficie}"
    textColor: "{colors.texto}"
    rounded: "{rounded.sm}"
    padding: "9px 12px"
  badge-success:
    backgroundColor: "{colors.exito-suave}"
    textColor: "{colors.exito}"
    rounded: "{rounded.sm}"
  nav-item-active:
    backgroundColor: "{colors.verde-primario-suave}"
    textColor: "{colors.verde-primario-hover}"
    rounded: "{rounded.md}"
---

# Design System: Sistema Gestión de Soporte Informático INIA

## 1. Overview

**Creative North Star: "Panel Operativo INIA"**

Este es un sistema de trabajo, no un producto de consumo: cada pantalla existe
para que el equipo de soporte técnico de INIA vea el estado real de equipos,
impresoras, licencias, VPN, WiFi y usuarios de red, organizado por sede y
dependencia. La superficie es sobria y contenida en reposo — fondo neutro
(#f1f3f0), tarjetas blancas planas, bordes casi invisibles — y reserva el
verde institucional y el ámbar de acento para comunicar significado: qué
módulo es, qué estado tiene un registro, qué acción es primaria. No hay
gradientes decorativos, drenched surfaces ni efectos de marketing; el sistema
explícitamente rechaza el look de dashboard SaaS genérico e intercambiable.

Mantiene modo claro y modo oscuro como ciudadanos de primera clase (no un
tema "agregado después"): el oscuro no es solo una inversión de valores, usa
su propia rampa de verdes más claros y fondos casi negros con tinte verde
sutil para seguir sintiéndose de la misma familia.

**Key Characteristics:**
- Verde INIA (#63a431) como color de marca y acento único; el resto del
  sistema es neutro hasta que necesita comunicar estado o módulo.
- Cada módulo de negocio (licencias, correos, VPN, WiFi, impresoras, equipos,
  auditoría, usuarios de red) tiene su propio color de identidad, usado como
  barra superior de 3-4px en tarjetas y como variable `--dash-module-color`.
- Sombras suaves y ambientales, nunca decorativas: la superficie es plana en
  reposo y solo se eleva como respuesta a hover/foco.
- Tipografía única (DM Sans) en múltiples pesos; no hay mezcla de familias.
- Modo claro y modo oscuro con paridad total de componentes.

## 2. Colors

La paleta es restringida: neutros dominan la superficie, el verde institucional
carga la identidad y el ámbar aparece solo como acento puntual (nunca como
fondo grande).

### Primary
- **Verde Primario** (#63a431): color de marca, botón primario, enlaces,
  ícono activo, borde de foco. Es el único color "caliente" en pantallas sin
  estado de alerta.
- **Verde Profundo** (#2a5726): extremo oscuro del degradado del botón
  primario y color de encabezados de marca (`--color-heading` en claro).

### Secondary
- **Ámbar de Acento** (#fab50b): acento de marca secundario, reservado para
  el logo/identidad institucional y para el estado "usuarios de red" —
  no se usa como color de superficie ni de texto de cuerpo.

### Neutral
- **Fondo** (#f1f3f0): fondo de página en modo claro, un gris verdoso casi
  imperceptible, nunca blanco puro ni crema/arena.
- **Superficie** (#ffffff): tarjetas, modales, header, sidebar.
- **Borde** (#e1e5df) / **Borde Fuerte** (#c8d1ca): separadores y bordes de
  input; el borde fuerte se reserva para inputs y estados con más énfasis.
- **Texto** (#1e2d22), **Texto Secundario** (#5f7064), **Texto Tenue**
  (#98a49b): jerarquía de lectura de tres niveles, todos con contraste ≥4.5:1
  sobre superficie blanca.

### Estado
- **Éxito** (#2f7d4a), **Advertencia** (#a86200), **Peligro** (#b9473a),
  **Info** (#3e7185): siempre en pares tono/tono-suave (ej. `--color-danger`
  + `--color-danger-light`) para badges, notices y filas de tabla.

### Colores de módulo
Cada módulo de negocio tiene un color de identidad propio, distinto de los
colores de estado, usado como acento visual consistente en su dashboard y
tarjetas: Licencias (#456b8a, azul pizarra), Correos (#657195, índigo
apagado), Usuarios de Red (#a86200, ámbar oscuro — comparte tono con
Advertencia intencionalmente), VPN (#b55245, terracota), WiFi (#357783, teal),
Impresoras (#66746a, gris piedra), Equipos (#63a431, el verde primario —
el módulo insignia usa el color de marca), Auditoría (#756a42, oliva).

### Named Rules
**La Regla del Acento Único.** El verde primario es el único color usado
para acción/marca fuera de badges de estado o de módulo; si una pantalla
necesita un segundo color "de marca", ese lugar es del ámbar de acento, en
dosis mínimas (logo, un solo badge), nunca como fondo de sección.

**La Regla del Módulo Silencioso.** El color de módulo vive en una barra de
3-4px, un ícono o una variable `--dash-module-color` — nunca tiñe una
superficie completa. Un dashboard de VPN se reconoce por su acento
terracota, no por un fondo rojizo.

## 3. Typography

**Display Font:** DM Sans (con fallback -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif)
**Body Font:** DM Sans (misma familia, distintos pesos: 400/500/600/700/800)

**Character:** Una sola familia geométrica-humanista en múltiples pesos crea
jerarquía por peso y tamaño, no por contraste de familias — coherente con un
sistema "confiable y contenido" que no necesita una segunda voz tipográfica.

### Hierarchy
- **Display** (800, 34px, line-height 1): valores numéricos grandes en
  tarjetas KPI (`module-dash-stat strong`), siempre `font-variant-numeric:
  tabular-nums`.
- **Headline** (600, 22px, line-height 1.3): título de página/módulo
  (`module-header h2`).
- **Title** (700, 16-17px, line-height 1.3): nombre del sistema en sidebar/
  header, títulos de tarjeta.
- **Body** (400-500, 13-14px, line-height 1.5): texto de tabla, formularios,
  contenido general; base de página en 14px.
- **Label** (800, 11px, letter-spacing 0.05em, mayúsculas): encabezados de
  tabla, eyebrows de módulo, etiquetas de stat-pill — siempre uppercase y
  tracked, nunca en oración normal.

### Named Rules
**La Regla de Una Sola Familia.** Todo el sistema usa DM Sans; la jerarquía
se construye con peso (400→800) y tamaño, nunca introduciendo una segunda
tipografía para "dar personalidad".

### Named Rules
**La Regla de la Píldora Completa.** `rounded.pill` (999px) es el único radio fuera de la escala sm/md/lg/xl, reservado exclusivamente a formas que deben leerse como completamente redondeadas (badges tipo píldora, toggles, barras de progreso, el thumb del scrollbar) — nunca se aproxima a `xl` (10px), porque una píldora con esquinas apenas curvas deja de leerse como píldora.

## 4. Elevation

El sistema es plano en reposo y usa sombras ambientales y sutiles como
respuesta a interacción, no como decoración permanente. No hay elevación
skeuomórfica ni sombras duras; el propósito de la sombra es indicar
"esto es interactivo y acabas de pasar por encima", nunca simular
profundidad física fuerte.

### Shadow Vocabulary
- **shadow-sm** (`0 1px 2px rgba(30,45,34,.04), 0 10px 24px -22px rgba(30,45,34,.3)`):
  estado de reposo de tarjetas, stat pills, dashboard cards.
- **shadow-md** (`0 12px 30px -22px rgba(30,45,34,.34)`): estado hover de
  tarjetas y menús flotantes (user-menu).
- **shadow-lg** (`0 22px 52px -26px rgba(30,45,34,.42)`): modales y sidebar
  móvil abierto — el nivel más alto, reservado a overlays.

### Named Rules
**La Regla Ambiental.** Ninguna sombra decora una superficie en reposo más
allá de shadow-sm; toda sombra más marcada (md/lg) aparece solo en hover,
foco o overlay, nunca como estilo base de una tarjeta estática.

## 5. Components

Carácter general: **confiable y contenido** — bordes suaves, transiciones de
150-220ms, color usado con propósito de estado/módulo, nunca decoración
gratuita.

### Buttons
- **Shape:** radio pequeño (5px, `--radius-sm`), nunca completamente
  cuadrado ni pill excepto el botón "ver registro" (999px, ver Signature
  Component).
- **Primary:** degradado verde-primario → verde-profundo (135deg), texto
  blanco, sombra ambiental que se intensifica y sube 2px en hover.
- **Ghost:** fondo transparente, borde `--color-border`, texto secundario;
  en hover pasa a fondo `verde-primario-suave` y texto verde-profundo.
- **Danger:** fondo `--color-danger` sólido, mismo patrón de elevación en
  hover que primary.
- **Icon:** cuadrado de padding 6px, borde sutil, mismo tratamiento hover
  que ghost.

### Chips / Badges
- **Style:** fondo tono-suave + texto tono-fuerte del mismo color semántico
  (éxito/advertencia/peligro/info/neutro), radio 5px, sin borde salvo estado
  seleccionable.
- **State:** `.selectable` añade borde `currentColor` en hover; `.inactive`
  cae a fondo neutro con texto tenue.

### Cards / Containers
- **Corner Style:** radio medio (7px, `--radius-md`).
- **Background:** superficie blanca sólida; los KPI y highlight cards añaden
  un degradado sutil (7-9% del color de tono) solo como textura de fondo,
  nunca como bloque de color.
- **Shadow Strategy:** shadow-sm en reposo, shadow-md en hover (ver
  Elevation).
- **Border:** transparente en reposo; en hover algunos KPI ganan un borde de
  color de tono al 24% de mezcla.
- **Internal Padding:** 14-18px según densidad de contenido.

### Inputs / Fields
- **Style:** borde `--color-border-strong`, fondo superficie, radio 5px,
  padding 9px 12px.
- **Focus:** borde pasa a verde-primario + halo de 3px al 18% de opacidad
  (`box-shadow: 0 0 0 3px rgba(71,124,33,.18)`).
- **Placeholder:** color `--color-text-muted`.

### Navigation
- **Sidebar:** ítems con radio 7px, ícono + etiqueta; el ítem activo lleva
  una barra vertical de 3px en verde-primario a la izquierda y fondo
  verde-primario-suave — el único uso de "barra lateral de color" permitido
  en el sistema, reservado exclusivamente a este indicador de estado activo
  de navegación.
- **Header:** sticky, fondo superficie con 96% opacidad + blur, altura fija
  76px; el chip de usuario despliega un menú flotante con shadow-md.
- **Mobile:** sidebar se convierte en overlay deslizante con shadow-lg.

### Signature Component: Botón "Ver registro"
Pill completamente redondeado (999px), fondo verde-primario al 11% de
mezcla con superficie, texto secundario; en hover se invierte a fondo
verde-primario sólido con texto sobre-módulo. Es el único botón pill del
sistema y aparece de forma consistente en todas las tablas y tarjetas de
todos los módulos como la acción de "ver detalle".

## 6. Do's and Don'ts

### Do:
- **Do** usar el verde primario (#63a431) como único color de acción/marca
  fuera de badges de estado o de módulo.
- **Do** mantener el fondo de página en el gris verdoso neutro (#f1f3f0),
  nunca blanco puro ni un crema/arena cálido.
- **Do** reservar sombras por encima de shadow-sm para estados de
  interacción (hover, foco, overlay), no para el reposo.
- **Do** mostrar el color de cada módulo como acento (barra de 3-4px, ícono,
  variable `--dash-module-color`), no como fondo de sección completo.
- **Do** mantener paridad completa entre modo claro y modo oscuro en cada
  componente nuevo.

### Don't:
- **Don't** usar `border-left`/`border-right` de color como acento decorativo
  en tarjetas o alerts — la única excepción documentada es el indicador de
  ítem activo del sidebar.
- **Don't** introducir una segunda familia tipográfica; toda jerarquía nueva
  se resuelve con peso y tamaño de DM Sans.
- **Don't** usar gradiente de fondo grande, glassmorphism decorativo o
  superficies "drenched" de color — el sistema es neutro con acento mínimo,
  no un dashboard SaaS genérico.
- **Don't** aplicar texto gris claro sobre fondo casi blanco "por elegancia";
  todo texto de cuerpo debe cumplir ≥4.5:1 de contraste.
- **Don't** dar a un color de módulo el mismo peso visual que el verde de
  marca; los colores de módulo son acentos secundarios, no reemplazos de la
  identidad principal.
